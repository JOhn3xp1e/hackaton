import { friendlyError, query, supabase } from '@/lib/supabase'

const SELECT = 'key, value, updated_at, updater:profiles!app_settings_updated_by_fkey ( full_name )'

/** App-wide settings stored in public.app_settings (admin-controlled). */
export const settingsService = {
  /** @returns {Promise<{ value: 'production' | 'mock', updated_at: string, updater: { full_name: string } | null } | null>} */
  getDataMode: () =>
    query(supabase.from('app_settings').select(SELECT).eq('key', 'data_mode').maybeSingle(), 'Could not load the data mode'),

  setDataMode: (value, profileId) =>
    query(
      supabase
        .from('app_settings')
        .upsert({ key: 'data_mode', value, updated_by: profileId ?? null }, { onConflict: 'key' })
        .select(SELECT)
        .single(),
      'Could not change the data mode',
    ),

  /** Real vs demo ticket counts for the Settings card. */
  async ticketCounts() {
    const count = async (isDemo) => {
      let res
      try {
        res = await supabase.from('tickets').select('id', { head: true, count: 'exact' }).eq('is_demo', isDemo)
      } catch (err) {
        throw new Error(friendlyError(err, 'Could not count tickets'))
      }
      if (res.error) throw new Error(friendlyError(res.error, 'Could not count tickets'))
      return res.count ?? 0
    }
    const [real, demo] = await Promise.all([count(false), count(true)])
    return { real, demo }
  },

  /** Realtime: called with the new row whenever the data mode changes. */
  subscribeDataMode(onChange) {
    const ch = supabase
      .channel(`app-settings-${Math.random().toString(36).slice(2, 8)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings', filter: 'key=eq.data_mode' }, (p) => onChange(p.new))
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  },
}
