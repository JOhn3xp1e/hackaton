import { z } from 'zod'
import { CATEGORIES, SEVERITIES } from './triage.schema.js'

// Keep in sync with the CHECK constraints in database/schema.sql
// and STAFF_ROLES / STATUSES / VALIDITY in client/src/lib/constants.js
export const STAFF_ROLES = ['teacher', 'lab_assistant', 'maintenance', 'admin']
export const STATUSES = ['pending', 'in_progress', 'resolved']
export const VALIDITIES = ['unreviewed', 'valid', 'invalid']
export { CATEGORIES, SEVERITIES }

export const MAX_CHAT_MESSAGES = 20

const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1, 'Message cannot be empty').max(4000, 'Message is too long'),
})

export const chatRequestSchema = z.object({
  messages: z
    .array(chatMessageSchema)
    .min(1, 'Send at least one message')
    .max(MAX_CHAT_MESSAGES, `Conversation is limited to ${MAX_CHAT_MESSAGES} messages, please clear the chat`)
    .refine((m) => m.at(-1)?.role === 'user', 'The last message must come from the user')
    .refine((m) => m.at(-1)?.content.length <= 2000, 'Your question is too long (max 2000 characters)'),
})

// ── Tool argument schemas (the model's tool calls are untrusted input) ──
const code = z.string().trim().toUpperCase().max(32)

export const toolArgSchemas = {
  get_overview: z.object({}).passthrough(),
  get_daily_trend: z.object({}).passthrough(),
  list_locations: z.object({}).passthrough(),
  get_stats: z.object({ by: z.enum(['category', 'location']).default('category') }),
  search_tickets: z.object({
    status: z.enum(STATUSES).optional(),
    open_only: z.boolean().optional(),
    category: z.enum(CATEGORIES).optional(),
    severity: z.enum(SEVERITIES).optional(),
    location_code: code.optional(),
    equipment_code: code.optional(),
    student_no: z.string().trim().toUpperCase().max(20).optional(),
    validity: z.enum(VALIDITIES).optional(),
    text: z.string().trim().max(80).optional(),
    since_days: z.coerce.number().int().min(1).max(365).optional(),
    limit: z.coerce.number().int().min(1).max(25).default(10),
  }),
  get_ticket: z.object({ ticket_number: z.string().trim().toUpperCase().min(3).max(20) }),
  list_equipment: z.object({ location_code: code.optional() }),
  get_student_credits: z.object({ limit: z.coerce.number().int().min(1).max(20).default(10) }),
}
