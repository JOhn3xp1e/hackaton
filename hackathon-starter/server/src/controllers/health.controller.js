import { env } from '../config/env.js'
import { isSupabaseEnabled, supabase } from '../config/supabase.js'
import { ApiError } from '../utils/ApiError.js'
import { ok } from '../utils/response.js'

export const healthController = {
  /** Liveness: is the process up, and which integrations are configured? */
  check(req, res) {
    ok(res, {
      status: 'ok',
      environment: env.nodeEnv,
      supabase: isSupabaseEnabled,
      aiTriage: Boolean(env.anthropicApiKey),
      chatbot: Boolean(env.groq.apiKey),
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    })
  },

  /** Readiness: can we reach the CampusFix tables? */
  async db(req, res) {
    if (!supabase) throw new ApiError(503, 'DB_NOT_CONFIGURED', 'Supabase is not configured on the server')
    const started = Date.now()
    try {
      const { error } = await supabase.from('locations').select('id', { head: true, count: 'exact' })
      if (error) throw error
    } catch (err) {
      throw new ApiError(503, 'DB_UNAVAILABLE', `Database check failed: ${err.message}`)
    }
    ok(res, { status: 'ok', database: 'supabase', latencyMs: Date.now() - started })
  },
}
