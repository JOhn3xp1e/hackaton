import { supabase } from '../config/supabase.js'
import { ApiError } from '../utils/ApiError.js'

/**
 * Verifies the Supabase access token sent as `Authorization: Bearer <jwt>`.
 * On success the user is available as req.user.
 */
export async function requireAuth(req, res, next) {
  const header = req.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!token) return next(ApiError.unauthorized('Sign in to use this feature'))
  if (!supabase) return next(new ApiError(503, 'AUTH_NOT_CONFIGURED', 'Supabase is not configured on the server'))

  try {
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data?.user) return next(ApiError.unauthorized('Your session has expired, please sign in again'))
    req.user = data.user
    next()
  } catch (err) {
    next(new ApiError(503, 'AUTH_UNAVAILABLE', `Could not verify session: ${err.message}`))
  }
}
