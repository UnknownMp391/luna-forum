import { readFileSync, existsSync } from 'fs'
import path, { resolve } from 'path'
import { createHash } from 'crypto'
import { getDB } from './db.js'
import { PluginConfig } from './types.js'

export interface AppConfig {
    mongodb: {
        uri: string
        dbName: string
    }
    site?: {
        name: string
        description: string
    }
    jwt_secret: string
    session_secret?: string
    plugins: PluginConfig[]
}

export interface DBConfig extends Record<string, unknown> { }

let appConfig: AppConfig

const dbConfig: DBConfig = {}

export async function loadConfig(defaultConfigPath: string = './config.json'): Promise<AppConfig> {
    const configFromEnv = process.env.CONFIG

    if (configFromEnv !== undefined) {
      appConfig = JSON.parse(configFromEnv) as AppConfig
    } else {
      const fullPath = resolve(process.env.CONFIG_PATH ?? path.join(import.meta.dirname, '..', defaultConfigPath))

      if (!existsSync(fullPath)) {
        throw new Error(`Config file not found: ${fullPath}`)
      }

      const fileContent = readFileSync(fullPath, 'utf-8')
      appConfig = JSON.parse(fileContent) as AppConfig

      if (!appConfig.mongodb?.uri) {
        throw new Error('MongoDB URI is required in config.json')
      }
    }

    return appConfig
}

export async function loadDBConfig(): Promise<DBConfig> {
    const db = getDB()
    const configs = await db.collection('configs').find().toArray()

    configs.forEach((config) => {
        dbConfig[config.key] = config.value
    })

    return dbConfig
}

export function getConfig(): AppConfig {
    if (!appConfig) {
        throw new Error('Config not loaded')
    }
    return appConfig
}

export function getJWTSecret(): string {
    if (!appConfig) {
        throw new Error('Config not loaded')
    }
    if (!appConfig.jwt_secret) {
        throw new Error('jwt_secret must be configured in config.json or CONFIG environment variable')
    }
    return appConfig.jwt_secret
}

/** 获取 session 密钥：优先使用独立配置，否则从 jwt_secret 派生以隔离用途 */
export function getSessionSecret(): string {
    if (appConfig?.session_secret) return appConfig.session_secret
    // 通过 HMAC-SHA256 从 jwt_secret 派生独立密钥，避免与 JWT 密钥混用
    return createHash('sha256').update(appConfig!.jwt_secret + ':session-secret-derivation').digest('hex')
}

export function getPlugins(): PluginConfig[] {
    if (!appConfig) return []
    return appConfig.plugins || []
}

export function getDBConfig(): DBConfig {
    return dbConfig
}

export function getDBConfigValue<T>(key: string, defaultValue: T): T {
    return (dbConfig[key] as T) ?? defaultValue
}

export async function setDBConfig<T>(key: string, value: T): Promise<void> {
    const db = getDB()

    await db
        .collection('configs')
        .updateOne(
            { key },
            { $set: { key, value, updatedAt: new Date() } },
            { upsert: true }
        )

    dbConfig[key] = value
}