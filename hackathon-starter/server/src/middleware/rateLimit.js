import { ApiError } from '../utils/ApiError.js'

/**
 * Tiny in-memory, per-IP fixed-window rate limiter (no dependency).
 * Protects public endpoints that spend money (e.g. Claude triage) now that
 * students use them without signing in. Resets when the server restarts.
 *
 *   router.post('/', rateLimit({ max: 10, windowMs: 5 * 60_000 }), handler)
 */
export function rateLimit({ max, windowMs, message = 'Too many requests, please wait a moment and try again' }) {
  const hits = new Map() // ip -> { count, resetAt }

  const sweep = setInterval(() => {
    const now = Date.now()
    for (const [ip, entry] of hits) if (entry.resetAt <= now) hits.delete(ip)
  }, windowMs)
  sweep.unref()

  return (req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown'
    const now = Date.now()
    let entry = hits.get(ip)
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs }
      hits.set(ip, entry)
    }
    entry.count += 1

    res.setHeader('RateLimit-Limit', String(max))
    res.setHeader('RateLimit-Remaining', String(Math.max(0, max - entry.count)))
    if (entry.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)))
      return next(new ApiError(429, 'RATE_LIMITED', message))
    }
    next()
  }
}
