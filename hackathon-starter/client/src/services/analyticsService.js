import { query, supabase } from '@/lib/supabase'

/** Reads the analytics views defined in database/schema.sql. */
export const analyticsService = {
  overview: () => query(supabase.from('ticket_overview').select('*').single(), 'Could not load the overview'),
  byCategory: () => query(supabase.from('ticket_stats_by_category').select('*'), 'Could not load category stats'),
  byLocation: () => query(supabase.from('ticket_stats_by_location').select('*'), 'Could not load location stats'),
  daily: () => query(supabase.from('ticket_daily_counts').select('*'), 'Could not load daily counts'),
}
