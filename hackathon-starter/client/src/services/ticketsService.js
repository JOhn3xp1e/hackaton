import { query, supabase } from '@/lib/supabase'
import { PHOTO_BUCKET } from '@/lib/constants'

/**
 * Tickets — direct Supabase access (see CLAUDE.md: no Express for CRUD).
 * Every method throws an Error with a user-friendly message on failure.
 */

const LIST_SELECT = `
  id, ticket_number, category, severity, status, title, asset_label, photo_urls,
  ai_summary, created_at, updated_at, resolved_at, reporter_id, assigned_to,
  student_no, reporter_name, is_anonymous, validity, equipment_id,
  equipment:equipment ( id, short_code, name ),
  location:locations!tickets_location_id_fkey ( id, code, name, building ),
  reporter:profiles!tickets_reporter_id_fkey ( id, full_name, role ),
  assignee:profiles!tickets_assigned_to_fkey ( id, full_name, role ),
  comments:ticket_comments ( count )
`

const DETAIL_SELECT = `
  *,
  location:locations!tickets_location_id_fkey ( id, code, name, building, floor, type ),
  reporter:profiles!tickets_reporter_id_fkey ( id, full_name, role ),
  assignee:profiles!tickets_assigned_to_fkey ( id, full_name, role ),
  validator:profiles!tickets_validated_by_fkey ( id, full_name, role ),
  equipment:equipment ( id, short_code, name, description ),
  updates:ticket_updates (
    id, from_status, to_status, note, created_at,
    author:profiles!ticket_updates_author_id_fkey ( id, full_name, role )
  )
`

export const ticketsService = {
  /**
   * @param {{ studentNo?: string, status?: string, severity?: string, category?: string,
   *           locationId?: string, validity?: string, search?: string, limit?: number }} filters
   */
  async list(filters = {}) {
    let q = supabase.from('tickets').select(LIST_SELECT).order('created_at', { ascending: false })
    if (filters.studentNo) q = q.eq('student_no', filters.studentNo.trim().toUpperCase())
    if (filters.validity) q = q.eq('validity', filters.validity)
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
   * Either a signed-in staff member (reporterId) or a student (studentNo,
   * optional reporterName, isAnonymous) reports.
   * @param {{ locationId: string, reporterId?: string, studentNo?: string, reporterName?: string,
   *           isAnonymous?: boolean, category: string, severity: string, title: string,
   *           description?: string, assetLabel?: string, equipmentId?: string, photoUrls?: string[],
   *           ai?: { summary: string, category: string, severity: string } | null }} input
   */
  async create(input) {
    return query(
      supabase
        .from('tickets')
        .insert({
          location_id: input.locationId,
          equipment_id: input.equipmentId ?? null,
          reporter_id: input.reporterId ?? null,
          student_no: input.studentNo ? input.studentNo.trim().toUpperCase() : null,
          reporter_name: input.reporterName?.trim() ?? '',
          is_anonymous: Boolean(input.isAnonymous),
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
   * Admin: permanently delete a report. Its timeline and comments go with it
   * (ON DELETE CASCADE). Photos are then removed from storage on a best-effort
   * basis — returns { photosRemoved: boolean } so the UI can mention leftovers.
   */
  async remove(ticket) {
    const deleted = await query(
      supabase.from('tickets').delete().eq('id', ticket.id).select('id'),
      'Could not delete the report',
    )
    if (!deleted?.length) throw new Error('This report no longer exists or could not be deleted.')

    const marker = `/object/public/${PHOTO_BUCKET}/`
    const paths = (ticket.photo_urls ?? [])
      .map((url) => (url.includes(marker) ? decodeURIComponent(url.split(marker)[1].split('?')[0]) : null))
      .filter(Boolean)
    if (!paths.length) return { photosRemoved: true }
    try {
      const { data, error } = await supabase.storage.from(PHOTO_BUCKET).remove(paths)
      return { photosRemoved: !error && (data?.length ?? 0) === paths.length }
    } catch {
      return { photosRemoved: false }
    }
  },

  /** Staff: mark a student's report valid (earns credits) or invalid. */
  async setValidity(ticketId, validity, staffId) {
    return query(
      supabase
        .from('tickets')
        .update({
          validity,
          validated_by: validity === 'unreviewed' ? null : staffId,
          validated_at: validity === 'unreviewed' ? null : new Date().toISOString(),
        })
        .eq('id', ticketId)
        .select('id, validity')
        .single(),
      'Could not save the review',
    )
  },

  /**
   * Realtime: call `onChange(payload)` on any insert/update to tickets (optionally
   * filtered, e.g. `student_no=eq.2023-00412`). Returns an unsubscribe function.
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
