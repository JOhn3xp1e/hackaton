/**
 * Centralised access to environment variables.
 * Import `config` instead of reading import.meta.env all over the codebase.
 */
const env = import.meta.env

export const config = {
  appName: env.VITE_APP_NAME || 'CampusFix',
  /** Public site URL printed into QR codes (e.g. https://campusfix.vercel.app). Falls back to the current origin. */
  publicAppUrl: (env.VITE_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, ''),
  apiUrl: (env.VITE_API_URL || '/api').replace(/\/$/, ''),
  supabaseUrl: env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY || '',
  isDev: env.DEV,
}
