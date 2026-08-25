import { Kernel } from './src/kernel.js'
import { pluginManager } from './src/pluginmgr.js'
import { getPlugins } from './src/config.js'

const kernel = new Kernel()

async function main() {
    await kernel.boot('./config.json')

    pluginManager.initKernelAPI()
    pluginManager.setServer(kernel.getServer())

    // 更新延迟导出的引用，确保 Vercel 等外部调用能获取到初始化后的 server
    _server = kernel.getServer()

    const plugins = getPlugins()

    for (const pluginConfig of plugins) {
        await pluginManager.loadPlugin(pluginConfig);
        await pluginManager.activate(pluginConfig.name)
    }

    try {
        const { getDBConfigValue } = await import('./src/config.js')

        const port = getDBConfigValue('server.port', 3000)

        await kernel.start(port)
    } catch {
        await kernel.start()
    }
}

let _server: ReturnType<typeof kernel.getServer> | undefined = undefined

// 延迟导出：在 main() 启动后更新引用，避免模块加载时返回 undefined
main().catch(console.error)

process.on('SIGINT', async () => {
    console.log('收到关闭信号，正在优雅关闭...')
    await kernel.stop()
    process.exit(0)
})

process.on('SIGTERM', async () => {
    console.log('收到关闭信号，正在优雅关闭...')
    await kernel.stop()
    process.exit(0)
})

// 使用函数式导出确保始终返回最新值
export default function getServer() {
    return _server ?? kernel.getServer()
}