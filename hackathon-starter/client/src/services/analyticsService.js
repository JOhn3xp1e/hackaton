import { query, supabase } from '@/lib/supabase'

/** Reads the analytics views defined in database/schema.sql. */
export const analyticsService = {
  overview: () => query(supabase.from('ticket_overview').select('*').single(), 'Could not load the overview'),
  byCategory: () => query(supabase.from('ticket_stats_by_category').select('*'), 'Could not load category stats'),
  byLocation: () => query(supabase.from('ticket_stats_by_location').select('*'), 'Could not load location stats'),
  daily: () => query(supabase.from('ticket_daily_counts').select('*'), 'Could not load daily counts'),

  /** Students ranked by credits (+10 valid report, +5 when resolved). */
  leaderboard: (limit = 50) =>
    query(supabase.from('student_credits').select('*').limit(limit), 'Could not load the leaderboard'),

  /** One student's credit summary, or null if they have no reports yet. */
  creditsFor: (studentNo) =>
    query(
      supabase.from('student_credits').select('*').eq('student_no', studentNo.trim().toUpperCase()).maybeSingle(),
      'Could not look up credits',
    ),
}
