import { query, supabase } from '@/lib/supabase'

/**
 * Tickets — direct Supabase access (see CLAUDE.md: no Express for CRUD).
 * Every method throws an Error with a user-friendly message on failure.
 */

const LIST_SELECT = `
  id, ticket_number, category, severity, status, title, asset_label, photo_urls,
  ai_summary, created_at, updated_at, resolved_at, reporter_id, assigned_to,
  location:locations!tickets_location_id_fkey ( id, code, name, building ),
  reporter:profiles!tickets_reporter_id_fkey ( id, full_name, role ),
  assignee:profiles!tickets_assigned_to_fkey ( id, full_name, role )
`

const DETAIL_SELECT = `
  *,
  location:locations!tickets_location_id_fkey ( id, code, name, building, floor, type ),
  reporter:profiles!tickets_reporter_id_fkey ( id, full_name, role ),
  assignee:profiles!tickets_assigned_to_fkey ( id, full_name, role ),
  updates:ticket_updates (
    id, from_status, to_status, note, created_at,
    author:profiles!ticket_updates_author_id_fkey ( id, full_name, role )
  )
`

export const ticketsService = {
  /**
   * @param {{ reporterId?: string, status?: string, severity?: string, category?: string,
   *           locationId?: string, search?: string, limit?: number }} filters
   */
  async list(filters = {}) {
    let q = supabase.from('tickets').select(LIST_SELECT).order('created_at', { ascending: false })
    if (filters.reporterId) q = q.eq('reporter_id', filters.reporterId)
    if (filters.status) q = q.eq('status', filters.status)
    if (filters.severity) q = q.eq('severity', filters.severity)
    if (filters.category) q = q.eq('category', filters.category)
    if (filters.locationId) q = q.eq('location_id', filters.locationId)
    if (filters.search) {
      const s = filters.search.replace(/[%,()]/g, ' ').trim()
      if (s) q = q.or(`title.ilike.%${s}%,ticket_number.ilike.%${s}%,asset_label.ilike.%${s}%`)
    }
    q = q.limit(filters.limit ?? 200)
    return query(q, 'Could not load reports')
  },

  async getByNumber(ticketNumber) {
    const data = await query(
      supabase
        .from('tickets')
        .select(DETAIL_SELECT)
        .eq('ticket_number', ticketNumber.toUpperCase())
        .maybeSingle(),
      'Could not load this report',
    )
    if (data?.updates) data.updates.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    return data
  },

  /**
   * @param {{ locationId: string, reporterId: string, category: string, severity: string,
   *           title: string, description?: string, assetLabel?: string, photoUrls?: string[],
   *           ai?: { summary: string, category: string, severity: string } | null }} input
   */
  async create(input) {
    return query(
      supabase
        .from('tickets')
        .insert({
          location_id: input.locationId,
          reporter_id: input.reporterId,
          category: input.category,
          severity: input.severity,
          title: input.title,
          description: input.description ?? '',
          asset_label: input.assetLabel ?? '',
          photo_urls: input.photoUrls ?? [],
          ai_summary: input.ai?.summary ?? null,
          ai_category: input.ai?.category ?? null,
          ai_severity: input.ai?.severity ?? null,
        })
        .select('id, ticket_number')
        .single(),
      'Could not submit your report',
    )
  },

  /** Staff: change status and add a timeline note (atomic, via RPC). */
  async updateStatus(ticketId, status, note = '') {
    return query(
      supabase.rpc('update_ticket_status', { p_ticket_id: ticketId, p_status: status, p_note: note }),
      'Could not update the status',
    )
  },

  /** Staff: assign the ticket to a staff member (or null to unassign). */
  async assign(ticketId, profileId) {
    return query(
      supabase.from('tickets').update({ assigned_to: profileId }).eq('id', ticketId).select('id').single(),
      'Could not update the assignee',
    )
  },

  /**
   * Realtime: call `onChange(payload)` on any insert/update to tickets (optionally
   * filtered, e.g. `reporter_id=eq.<uuid>`). Returns an unsubscribe function.
   */
  subscribe(onChange, { filter, channel = 'tickets-changes' } = {}) {
    const ch = supabase
      .channel(`${channel}-${Math.random().toString(36).slice(2, 8)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets', ...(filter && { filter }) }, onChange)
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  },

  /** Realtime: new timeline entries for one ticket. */
  subscribeToUpdates(ticketId, onChange) {
    const ch = supabase
      .channel(`ticket-updates-${ticketId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ticket_updates', filter: `ticket_id=eq.${ticketId}` },
        onChange,
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tickets', filter: `id=eq.${ticketId}` }, onChange)
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  },
}
