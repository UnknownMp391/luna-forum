import { Plugin, PluginContext, KernelAPI, PluginManifest } from './types.js'
import { hookManager } from './hookmgr.js'
import { getDB } from './db.js'
import { getDBConfigValue, setDBConfig } from './config.js'
import { privManager } from './privmgr.js'
import { getUserIdFromRequest } from './auth.js'
import { FastifyInstance } from 'fastify'
import nodePath from 'path'
import { promises } from 'fs'

class PluginManager {
    private plugins: Map<string, Plugin> = new Map()
    private commands: Map<string, Function> = new Map()
    private kernelAPI!: KernelAPI
    private server!: FastifyInstance

    private pluginEntries = [
      'index.js',
      'index.ts'
    ]

    setServer(server: FastifyInstance) {
        this.server = server
        return Promise.resolve()
    }

    initKernelAPI() {
        this.kernelAPI = {
            getDB,
            getServer: () => this.server,
            getUserIdFromRequest,
            callHook: (...args) => hookManager.call(...args),
            executeCommand: (...args) => this.executeCommand(...args),
            registerPlugin: (plugin) => this.register(plugin),
            getConfig: (key, defaultValue) => getDBConfigValue(key, defaultValue),
            setConfig: (key, value) => setDBConfig(key, value),
            hasPriv: (userId, privBit) => privManager.hasPriv(userId, privBit),
            getPrivBit: (name) => privManager.getBit(name),
            banUser: async (userId) => { await privManager.banUser(userId) },
            unbanUser: async (userId) => { await privManager.unbanUser(userId) }
        }
        return this.kernelAPI
    }

    async register(plugin: Plugin) {
        if (this.plugins.has(plugin.name)) {
            throw new Error(`Plugin ${plugin.name} already registered`)
        }

        for (const dep of plugin.deps) {
            if (!this.plugins.has(dep)) {
                throw new Error(`Dependency ${dep} not found for plugin ${plugin.name}`)
            }
        }

        const ctx: PluginContext = {
            kernel: this.kernelAPI,
            registerHook: async (hook, handler) => { await hookManager.register(hook, handler) },
            registerCommand: (name, fn) => { this.commands.set(name, fn) },
            registerPriv: (name, bitExpression, isDefault) => { privManager.register(name, bitExpression, isDefault) }
        }

        await plugin.init(ctx)

        this.plugins.set(plugin.name, plugin)
    }

    async activate(name: string) {
        const plugin = this.plugins.get(name)

        if (!plugin) throw new Error(`Plugin ${name} not found`)

        await plugin.activate()
    }

    async deactivate(name: string) {
        const plugin = this.plugins.get(name)

        if (!plugin) throw new Error(`Plugin ${name} not found`)

        await plugin.deactivate()
    }

    async executeCommand(name: string, ...args: unknown[]) {
        const cmd = this.commands.get(name)

        if (!cmd) throw new Error(`Command ${name} not found`)

        return cmd(...args)
    }

    async loadPlugin(manifest: PluginManifest) {
      const tryPaths = this.pluginEntries.map(e => nodePath.join(import.meta.dirname,'../', manifest.main, e));

      let path = '';

      for (const element of tryPaths) {
          try {
              await promises.access(element, promises.constants.F_OK);

              path = element;
          }
          catch { }
      }

      const mod = await import(path);

      const plugin = mod.default || mod;

      await this.register(plugin);
    }

    getPlugin(name: string): Plugin | undefined {
        return this.plugins.get(name)
    }
}
export const pluginManager = new PluginManager()