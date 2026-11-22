import { createClient } from '@supabase/supabase-js'
import { config } from './config'

/**
 * OPTIONAL browser Supabase client.
 *
 * - Uses the PUBLIC anon/publishable key only. Data is protected by Row Level
 *   Security policies (see database/schema.sql).
 * - NEVER use the service-role key in the frontend.
 * - Default architecture: the frontend talks to Express (/api), and Express
 *   talks to Supabase. Use this client only for features that benefit from
 *   direct access (auth, realtime, storage uploads).
 *
 * `supabase` is null when env vars are missing, so the app still runs.
 */
export const supabase =
  config.supabaseUrl && config.supabaseAnonKey
    ? createClient(config.supabaseUrl, config.supabaseAnonKey)
    : null

export const isSupabaseConfigured = Boolean(supabase)
