/**
 * Centralised access to environment variables.
 * Import `config` instead of reading import.meta.env all over the codebase.
 */
const env = import.meta.env

export const config = {
  appName: env.VITE_APP_NAME || 'CampusFix',
  appVersion: env.VITE_APP_VERSION || '1.0',
  campusName: env.VITE_CAMPUS_NAME || 'Main Campus',
  campusUnit: env.VITE_CAMPUS_UNIT || 'Engineering & Technology',
  apiUrl: (env.VITE_API_URL || '/api').replace(/\/$/, ''),
  supabaseUrl: env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY || '',
  isDev: env.DEV,
}
