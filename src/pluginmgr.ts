import { Plugin, PluginContext, KernelAPI, PluginManifest } from './types.js'
import { hookManager } from './hookmgr.js'
import { getDB } from './db.js'
import { pathToFileURL } from 'url';
import { getDBConfigValue, setDBConfig } from './config.js'
import { privManager } from './privmgr.js'
import { getUserIdFromRequest } from './auth.js'
import { FastifyInstance } from 'fastify'
import nodePath from 'path'

class PluginManager {
    private plugins: Map<string, Plugin> = new Map()
    private commands: Map<string, Function> = new Map()
    private kernelAPI!: KernelAPI
    private server!: FastifyInstance

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
        // 相对于项目根目录解析插件路径（import.meta.dirname 是 src/，向上两级到项目根）
        const projectRoot = nodePath.join(import.meta.dirname, '..');
        const pluginPath = nodePath.resolve(projectRoot, manifest.main);

        const mod = await import(pathToFileURL(pluginPath).href);

        const plugin = mod.default || mod;
        
        await this.register(plugin);
    }

    getPlugin(name: string): Plugin | undefined {
        return this.plugins.get(name)
    }
}
export const pluginManager = new PluginManager()