import { supabase } from '../config/supabase.js'
import { CATEGORIES, SEVERITIES, STATUSES, VALIDITIES, toolArgSchemas } from '../validators/chat.schema.js'

/**
 * Read-only database tools the Groq assistant can call. Every handler returns
 * a small JSON-serialisable object; failures come back as { error } so the
 * model can explain the problem instead of the whole request failing.
 */

const TICKET_SELECT = `
  ticket_number, title, description, category, severity, status, validity,
  asset_label, ai_summary, student_no, reporter_name, is_anonymous,
  created_at, resolved_at,
  location:locations!tickets_location_id_fkey ( code, name, building ),
  equipment:equipment ( short_code, name ),
  reporter:profiles!tickets_reporter_id_fkey ( full_name, role ),
  assignee:profiles!tickets_assigned_to_fkey ( full_name, role )
`

const clip = (s, n) => (s && s.length > n ? `${s.slice(0, n - 1)}…` : s || '')

/** Shape a ticket row for the model: short, flat, no anonymous names. */
function compactTicket(t, { full = false } = {}) {
  const reporter = t.student_no
    ? { student_no: t.student_no, name: t.is_anonymous ? 'Anonymous' : t.reporter_name || null }
    : { staff: t.reporter?.full_name ?? null, role: t.reporter?.role ?? null }
  return {
    ticket_number: t.ticket_number,
    title: t.title,
    ...(full ? { description: t.description } : { summary: clip(t.ai_summary || t.description, 160) }),
    category: t.category,
    severity: t.severity,
    status: t.status,
    validity: t.student_no ? t.validity : undefined,
    location: t.location ? `${t.location.code} · ${t.location.name}` : null,
    equipment: t.equipment ? `${t.equipment.short_code} · ${t.equipment.name}` : t.asset_label || null,
    reporter,
    assigned_to: t.assignee?.full_name ?? null,
    reported_at: t.created_at,
    resolved_at: t.resolved_at,
  }
}

async function run(q) {
  const { data, error, count } = await q
  if (error) throw new Error(error.message)
  return { data, count }
}

const handlers = {
  async get_overview() {
    const { data } = await run(supabase.from('ticket_overview').select('*').maybeSingle())
    return data ?? {}
  },

  async get_stats({ by }) {
    if (by === 'location') {
      const { data } = await run(supabase.from('ticket_stats_by_location').select('code, name, total, open').limit(50))
      return { by, rows: data }
    }
    const { data } = await run(supabase.from('ticket_stats_by_category').select('category, total, open'))
    return { by, rows: data }
  },

  async get_daily_trend() {
    const { data } = await run(supabase.from('ticket_daily_counts').select('day, reported, resolved'))
    return { days: data.filter((d) => d.reported || d.resolved), note: 'Last 30 days; days with no activity omitted' }
  },

  async search_tickets(a) {
    let q = supabase
      .from('tickets')
      .select(TICKET_SELECT, { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(a.limit)

    if (a.status) q = q.eq('status', a.status)
    else if (a.open_only) q = q.neq('status', 'resolved')
    if (a.category) q = q.eq('category', a.category)
    if (a.severity) q = q.eq('severity', a.severity)
    if (a.validity) q = q.eq('validity', a.validity)
    if (a.student_no) q = q.eq('student_no', a.student_no)
    if (a.since_days) q = q.gte('created_at', new Date(Date.now() - a.since_days * 86_400_000).toISOString())

    if (a.location_code) {
      const { data: loc } = await run(supabase.from('locations').select('id').eq('code', a.location_code).maybeSingle())
      if (!loc) return { error: `No location with code ${a.location_code}. Use list_locations to see valid codes.` }
      q = q.eq('location_id', loc.id)
    }
    if (a.equipment_code) {
      const { data: eq } = await run(supabase.from('equipment').select('id').eq('short_code', a.equipment_code).maybeSingle())
      if (!eq) return { error: `No equipment with ID ${a.equipment_code}.` }
      q = q.eq('equipment_id', eq.id)
    }
    if (a.text) {
      const s = a.text.replace(/[%,()*]/g, ' ').trim()
      if (s) q = q.or(`title.ilike.%${s}%,description.ilike.%${s}%,asset_label.ilike.%${s}%,ticket_number.ilike.%${s}%`)
    }

    const { data, count } = await run(q)
    return { total_matching: count ?? data.length, showing: data.length, tickets: data.map((t) => compactTicket(t)) }
  },

  async get_ticket({ ticket_number }) {
    const { data: t } = await run(
      supabase
        .from('tickets')
        .select(
          `${TICKET_SELECT},
          updates:ticket_updates ( from_status, to_status, note, created_at,
            author:profiles!ticket_updates_author_id_fkey ( full_name ) ),
          comments:ticket_comments ( body, display_name, is_anonymous, student_no, created_at,
            author:profiles!ticket_comments_author_id_fkey ( full_name ) )`,
        )
        .eq('ticket_number', ticket_number)
        .maybeSingle(),
    )
    if (!t) return { error: `Ticket ${ticket_number} was not found.` }

    const byDate = (x, y) => new Date(x.created_at) - new Date(y.created_at)
    return {
      ...compactTicket(t, { full: true }),
      timeline: (t.updates ?? []).sort(byDate).map((u) => ({
        at: u.created_at,
        from: u.from_status,
        to: u.to_status,
        note: clip(u.note, 200),
        by: u.author?.full_name ?? null,
      })),
      comments: (t.comments ?? []).sort(byDate).slice(-10).map((c) => ({
        at: c.created_at,
        by: c.author?.full_name ?? (c.is_anonymous ? 'Anonymous student' : c.display_name || c.student_no),
        text: clip(c.body, 300),
      })),
    }
  },

  async list_locations() {
    const { data } = await run(supabase.from('locations').select('code, name, building, floor, type').order('code').limit(100))
    return { locations: data }
  },

  async list_equipment({ location_code }) {
    let q = supabase
      .from('equipment')
      .select('short_code, name, location:locations!equipment_location_id_fkey!inner ( code, name )')
      .order('short_code')
      .limit(100)
    if (location_code) q = q.eq('location.code', location_code)
    const { data } = await run(q)
    return { equipment: data.map((e) => ({ id: e.short_code, name: e.name, location: e.location?.code })) }
  },

  async get_student_credits({ limit }) {
    const { data } = await run(
      supabase.from('student_credits').select('student_no, display_name, reports, valid_reports, credits').limit(limit),
    )
    return { rule: 'Valid report = +10 credits, +5 more once resolved', students: data }
  },
}

const fn = (name, description, properties = {}) => ({
  type: 'function',
  function: { name, description, parameters: { type: 'object', properties, additionalProperties: false } },
})

/** OpenAI-compatible tool definitions sent to Groq. */
export const toolDefinitions = [
  fn('get_overview', 'Campus-wide totals: pending, in_progress, resolved, resolved_this_week, open_critical, avg_resolution_hours, unreviewed student reports.'),
  fn('get_stats', 'Ticket counts (total and still open) grouped by category or by location.', {
    by: { type: 'string', enum: ['category', 'location'] },
  }),
  fn('get_daily_trend', 'Reported vs resolved ticket counts per day for the last 30 days.'),
  fn('search_tickets', 'Find tickets with filters. Returns the total matching count and the newest matching tickets.', {
    status: { type: 'string', enum: STATUSES },
    open_only: { type: 'boolean', description: 'true = pending or in_progress' },
    category: { type: 'string', enum: CATEGORIES },
    severity: { type: 'string', enum: SEVERITIES },
    location_code: { type: 'string', description: 'Room/lab code, e.g. CL2' },
    equipment_code: { type: 'string', description: 'Equipment sticker ID, e.g. CL2-PC15' },
    student_no: { type: 'string', description: 'Student number of the reporter' },
    validity: { type: 'string', enum: VALIDITIES, description: 'Staff review of a student report' },
    text: { type: 'string', description: 'Keyword searched in title, description and asset' },
    since_days: { type: 'integer', description: 'Only tickets reported in the last N days' },
    limit: { type: 'integer', description: 'Max tickets to return (1-25, default 10)' },
  }),
  fn('get_ticket', 'Full details of one ticket including its status timeline and comments.', {
    ticket_number: { type: 'string', description: 'e.g. CF-000123' },
  }),
  fn('list_locations', 'All campus rooms, labs and offices with their codes.'),
  fn('list_equipment', 'Equipment items with their sticker IDs, optionally for one location.', {
    location_code: { type: 'string' },
  }),
  fn('get_student_credits', 'Student leaderboard by credits earned from valid reports.', {
    limit: { type: 'integer', description: '1-20, default 10' },
  }),
]
// get_ticket needs its argument
toolDefinitions.find((t) => t.function.name === 'get_ticket').function.parameters.required = ['ticket_number']

/** Validate the model's arguments and run the tool. Never throws. */
export async function runTool(name, rawArgs) {
  const handler = handlers[name]
  const schema = toolArgSchemas[name]
  if (!handler || !schema) return { error: `Unknown tool ${name}` }

  let args
  try {
    args = schema.parse(rawArgs && typeof rawArgs === 'string' ? JSON.parse(rawArgs) : (rawArgs ?? {}))
  } catch (err) {
    return { error: `Invalid arguments for ${name}: ${err.issues?.map((i) => `${i.path.join('.')} ${i.message}`).join('; ') || err.message}` }
  }

  try {
    return await handler(args)
  } catch (err) {
    return { error: `Database query failed: ${err.message}` }
  }
}
