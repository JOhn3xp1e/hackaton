import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import apiRoutes from './routes/index.js'
import { requestLogger } from './middleware/requestLogger.js'
import { notFound } from './middleware/notFound.js'
import { errorHandler } from './middleware/errorHandler.js'

/**
 * Express app factory (no .listen here → easy to test with node:test).
 */
export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  app.set('trust proxy', 1)

  app.use(
    cors({
      origin(origin, cb) {
        // Allow non-browser clients (curl, Postman) and whitelisted origins
        if (!origin || env.corsOrigins.includes('*') || env.corsOrigins.includes(origin)) return cb(null, true)
        cb(null, false)
      },
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true }))
  if (!env.isTest) app.use(requestLogger)

  app.get('/', (req, res) => res.json({ success: true, data: { name: 'hackathon-api', docs: '/api/health' } }))
  app.use('/api', apiRoutes)

  app.use(notFound)
  app.use(errorHandler)

  return app
}
