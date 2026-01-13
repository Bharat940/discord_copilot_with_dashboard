import { startBot } from './bot.js'
import http from 'http'

/**
 * Simple HTTP server for health checks (required by PaaS like Render/Koyeb)
 */
const port = process.env.PORT || 8080
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('Bot is alive!')
}).listen(port, () => {
    console.log(`✓ Health check server running on port ${port}`)
})

/**
 * Main entry point for Discord bot
 */
startBot()
