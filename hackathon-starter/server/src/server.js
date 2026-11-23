import { createApp } from './app.js'
import { env } from './config/env.js'
import { isSupabaseEnabled } from './config/supabase.js'

const app = createApp()

const server = app.listen(env.port, () => {
  console.log(`\n  🚀 API ready on http://localhost:${env.port}`)
  console.log(`     health   → http://localhost:${env.port}/api/health`)
  console.log(`     supabase → ${isSupabaseEnabled ? 'configured' : 'NOT configured (set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env)'}`)
  console.log(`     ai       → ${env.anthropicApiKey ? 'Claude triage enabled' : 'disabled (set ANTHROPIC_API_KEY in .env)'}`)
  console.log(`     chat     → ${env.groq.apiKey ? `Groq assistant enabled (${env.groq.model})` : 'disabled (set GROQ_API_KEY in .env)'}`)
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
