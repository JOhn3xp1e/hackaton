import { createClient } from '@supabase/supabase-js'
import { config } from './config'

/**
 * Browser Supabase client — the primary data layer for CampusFix.
 * React talks to Supabase directly for CRUD, Auth, Storage and Realtime
 * (see CLAUDE.md). Uses the PUBLIC anon key only; never the service-role key.
 *
 * `supabase` is null when env vars are missing; App.jsx then shows a setup screen.
 */
export const supabase =
  config.supabaseUrl && config.supabaseAnonKey
    ? createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: { persistSession: true, autoRefreshToken: true },
      })
    : null

export const isSupabaseConfigured = Boolean(supabase)

/** Turn a Supabase/PostgREST error into a short, user-friendly message. */
export function friendlyError(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback
  const msg = error.message || String(error)
  if (/Failed to fetch|NetworkError|network/i.test(msg)) return 'Cannot reach the server. Check your internet connection.'
  if (/JWT|session/i.test(msg)) return 'Your session has expired. Please sign in again.'
  if (/Invalid login credentials/i.test(msg)) return 'Incorrect email or password.'
  if (/User already registered/i.test(msg)) return 'An account with this email already exists.'
  if (/Email not confirmed/i.test(msg)) return 'Please confirm your email address first (check your inbox).'
  if (/relation .* does not exist|schema cache/i.test(msg)) return 'Database is not set up yet. Run database/schema.sql in Supabase.'
  if (error.code === '23514') return 'Some values are not allowed. Please check the form.'
  if (error.code === '23505') return 'That already exists.'
  return msg || fallback
}

/**
 * Await a Supabase query builder and return `data`, throwing an Error with a
 * friendly message on failure. Used by every service:
 *   return query(supabase.from('locations').select('*'), 'Could not load locations')
 */
export async function query(builder, fallback) {
  let result
  try {
    result = await builder
  } catch (err) {
    throw new Error(friendlyError(err, fallback))
  }
  if (result.error) throw new Error(friendlyError(result.error, fallback))
  return result.data
}
