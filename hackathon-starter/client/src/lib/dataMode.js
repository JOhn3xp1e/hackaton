/**
 * Current data mode, shared with services that query tables directly.
 * Kept in sync by DataModeProvider (app_settings.data_mode, live via Realtime).
 *
 *   'mock'       → real reports + seeded demo rows (is_demo = true)
 *   'production' → real reports only
 *
 * Analytics views filter themselves in SQL (show_demo_data()), so only direct
 * `from('tickets')` / `from('ticket_comments')` queries need `withoutDemo()`.
 */
let mode = 'mock'

export const DATA_MODES = {
  production: { label: 'Production', hint: 'Real reports only. Seeded demo tickets and comments are hidden everywhere.' },
  mock: { label: 'Mock data', hint: 'Real reports plus seeded demo data, for presentations and testing.' },
}

export const getDataMode = () => mode
export const getShowDemo = () => mode === 'mock'
export const setDataModeCache = (next) => {
  mode = next === 'production' ? 'production' : 'mock'
}

/** Add the production filter to a Supabase query on a table with an is_demo column. */
export const withoutDemo = (q, column = 'is_demo') => (getShowDemo() ? q : q.eq(column, false))
