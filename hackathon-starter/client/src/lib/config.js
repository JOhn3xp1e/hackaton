/**
 * Centralised, typed-ish access to environment variables.
 * Import `config` instead of reading import.meta.env all over the codebase.
 */
const env = import.meta.env

export const config = {
  appName: env.VITE_APP_NAME || 'Hackathon Starter',
  apiUrl: (env.VITE_API_URL || '/api').replace(/\/$/, ''),
  /** When true, services resolve with local mock data instead of HTTP calls. */
  useMocks: String(env.VITE_USE_MOCKS ?? 'true') === 'true',
  supabaseUrl: env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY || '',
  isDev: env.DEV,
}
