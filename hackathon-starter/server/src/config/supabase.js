import { createClient } from '@supabase/supabase-js'
import { env } from './env.js'

/**
 * Server-side Supabase client.
 *
 * - Uses the SERVICE ROLE key when provided (bypasses RLS — the API is the
 *   gatekeeper, so validate and authorise every request in controllers).
 * - `supabase` is null when not configured; services fall back to an in-memory
 *   store so the API still works during early development.
 */
export const supabase =
  env.supabase.url && env.supabase.key
    ? createClient(env.supabase.url, env.supabase.key, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null

export const isSupabaseEnabled = Boolean(supabase)
