import { env } from '../config/env.js'
import { itemsDataSource, itemsService } from '../services/items.service.js'
import { ok } from '../utils/response.js'

export const healthController = {
  /** Liveness: is the process up? */
  check(req, res) {
    ok(res, {
      status: 'ok',
      environment: env.nodeEnv,
      database: itemsDataSource,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    })
  },

  /** Readiness: can we reach the database? */
  async db(req, res) {
    const started = Date.now()
    await itemsService.ping()
    ok(res, { status: 'ok', database: itemsDataSource, latencyMs: Date.now() - started })
  },
}
