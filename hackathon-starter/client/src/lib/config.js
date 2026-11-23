/**
 * Centralised access to environment variables.
 * Import `config` instead of reading import.meta.env all over the codebase.
 */
const env = import.meta.env

export const config = {
  appName: env.VITE_APP_NAME || 'CampusFix',
  apiUrl: (env.VITE_API_URL || '/api').replace(/\/$/, ''),
  supabaseUrl: env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY || '',
  isDev: env.DEV,
}
