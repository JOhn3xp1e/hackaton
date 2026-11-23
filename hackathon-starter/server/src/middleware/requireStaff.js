import { supabase } from '../config/supabase.js'
import { ApiError } from '../utils/ApiError.js'
import { STAFF_ROLES } from '../validators/chat.schema.js'

/**
 * Only signed-in staff (teacher, lab_assistant, maintenance, admin) pass.
 * Expects `Authorization: Bearer <supabase access token>` (the client's
 * AuthProvider attaches it via setAuthToken). Sets req.user = { id, role, fullName }.
 */
export async function requireStaff(req, res, next) {
  const header = req.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!token) return next(ApiError.unauthorized('Please sign in as staff to use the assistant'))

  if (!supabase) {
    return next(new ApiError(503, 'DB_NOT_CONFIGURED', 'Supabase is not configured on the server'))
  }

  try {
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data?.user) return next(ApiError.unauthorized('Your session has expired, please sign in again'))

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, full_name')
      .eq('id', data.user.id)
      .maybeSingle()
    if (profileError) throw profileError
    if (!profile || !STAFF_ROLES.includes(profile.role)) {
      return next(ApiError.forbidden('The assistant is available to staff only'))
    }

    req.user = { id: profile.id, role: profile.role, fullName: profile.full_name }
    next()
  } catch (err) {
    next(new ApiError(503, 'AUTH_UNAVAILABLE', `Could not verify your session: ${err.message}`))
  }
}
