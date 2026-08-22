import { Kernel } from './src/kernel.js'
import { pluginManager } from './src/pluginmgr.js'
import { getPlugins } from './src/config.js'

const kernel = new Kernel()

async function main() {
    await kernel.boot('./config.json')

    pluginManager.initKernelAPI()
    pluginManager.setServer(kernel.getServer())

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

main().catch(console.error);

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

export default kernel.getServer()