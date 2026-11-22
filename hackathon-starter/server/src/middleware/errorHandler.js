import { ApiError } from '../utils/ApiError.js'
import { env } from '../config/env.js'

/**
 * Central error handler — the ONLY place error responses are formatted.
 * Express 5 forwards rejected promises from async handlers here automatically.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Malformed JSON body
  if (err?.type === 'entity.parse.failed') {
    err = ApiError.badRequest('Request body is not valid JSON')
  }
  // Body too large
  if (err?.type === 'entity.too.large') {
    err = new ApiError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large')
  }

  const isKnown = err instanceof ApiError
  const status = isKnown ? err.status : 500

  if (!isKnown || status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}`, err)
  }

  const body = {
    success: false,
    error: {
      code: isKnown ? err.code : 'INTERNAL_ERROR',
      message: isKnown ? err.message : 'Something went wrong on our side',
    },
  }
  if (isKnown && err.details) body.error.details = err.details
  // Expose stack traces in development only
  if (!env.isProd && !isKnown) body.error.debug = { message: err?.message, stack: err?.stack?.split('\n').slice(0, 5) }

  res.status(status).json(body)
}
