import { query, supabase } from '@/lib/supabase'
import { withoutDemo } from '@/lib/dataMode'

const SELECT = `
  id, ticket_id, author_id, student_no, display_name, is_anonymous, body, created_at,
  author:profiles!ticket_comments_author_id_fkey ( id, full_name, role )
`

/** Public comments on a report. Staff comment as their profile; students with their number. */
export const commentsService = {
  list: (ticketId) =>
    query(
      withoutDemo(supabase.from('ticket_comments').select(SELECT).eq('ticket_id', ticketId).order('created_at', { ascending: true })),
      'Could not load comments',
    ),

  /**
   * @param {{ ticketId: string, body: string, authorId?: string, studentNo?: string,
   *           displayName?: string, isAnonymous?: boolean }} input
   */
  create: (input) =>
    query(
      supabase
        .from('ticket_comments')
        .insert({
          ticket_id: input.ticketId,
          body: input.body.trim(),
          author_id: input.authorId ?? null,
          student_no: input.authorId ? null : input.studentNo.trim().toUpperCase(),
          display_name: input.authorId ? '' : (input.displayName ?? '').trim(),
          is_anonymous: input.authorId ? false : Boolean(input.isAnonymous),
        })
        .select(SELECT)
        .single(),
      'Could not post your comment',
    ),

  /** Realtime: new comments on one ticket. Returns an unsubscribe function. */
  subscribe(ticketId, onInsert) {
    const ch = supabase
      .channel(`ticket-comments-${ticketId}-${Math.random().toString(36).slice(2, 8)}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_comments', filter: `ticket_id=eq.${ticketId}` }, onInsert)
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  },
}
