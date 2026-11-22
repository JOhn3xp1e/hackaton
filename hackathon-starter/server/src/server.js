import { createApp } from './app.js'
import { env } from './config/env.js'
import { itemsDataSource } from './services/items.service.js'

const app = createApp()

const server = app.listen(env.port, () => {
  console.log(`\n  🚀 API ready on http://localhost:${env.port}`)
  console.log(`     health   → http://localhost:${env.port}/api/health`)
  console.log(`     data     → ${itemsDataSource === 'supabase' ? 'Supabase (PostgreSQL)' : 'in-memory store (set SUPABASE_* in .env to use Supabase)'}`)
  console.log(`     cors     → ${env.corsOrigins.join(', ')}\n`)
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${env.port} is already in use. Change PORT in server/.env or stop the other process.`)
    process.exit(1)
  }
  throw err
})

// Graceful shutdown
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => process.exit(0))
    setTimeout(() => process.exit(0), 3000).unref()
  })
}
