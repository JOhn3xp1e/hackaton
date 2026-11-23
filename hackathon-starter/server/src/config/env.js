import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config({ quiet: true })

/**
 * Validated environment. The server refuses to start with a clear message if
 * something is malformed — much faster to debug than `undefined` at runtime.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  SUPABASE_URL: z.string().url().optional().or(z.literal('')),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  // Newer Supabase key names (sb_secret_… / sb_publishable_…) are accepted too.
  SUPABASE_SECRET_KEY: z.string().optional(),
  SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  // Fallback: on Vercel the client's VITE_ vars are also visible to the API
  // function, so the server works even if only those are set.
  VITE_SUPABASE_URL: z.string().url().optional().or(z.literal('')),
  VITE_SUPABASE_ANON_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().optional(),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables:')
  for (const issue of parsed.error.issues) console.error(`   - ${issue.path.join('.')}: ${issue.message}`)
  process.exit(1)
}

const e = parsed.data

export const env = {
  nodeEnv: e.NODE_ENV,
  isProd: e.NODE_ENV === 'production',
  isTest: e.NODE_ENV === 'test',
  port: e.PORT,
  corsOrigins: e.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean),
  anthropicApiKey: e.ANTHROPIC_API_KEY || '',
  groq: {
    apiKey: e.GROQ_API_KEY || '',
    model: e.GROQ_MODEL || 'openai/gpt-oss-120b',
  },
  supabase: {
    url: e.SUPABASE_URL || e.VITE_SUPABASE_URL || '',
    key:
      e.SUPABASE_SERVICE_ROLE_KEY ||
      e.SUPABASE_SECRET_KEY ||
      e.SUPABASE_ANON_KEY ||
      e.SUPABASE_PUBLISHABLE_KEY ||
      e.VITE_SUPABASE_ANON_KEY ||
      '',
    usingServiceRole: Boolean(e.SUPABASE_SERVICE_ROLE_KEY || e.SUPABASE_SECRET_KEY),
  },
}
