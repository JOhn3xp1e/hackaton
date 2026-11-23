import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { setDataModeCache } from '@/lib/dataMode'
import { settingsService } from '@/services/settingsService'

const DataModeCtx = createContext(null)

/**
 * App-wide data mode (admin toggle in Settings): 'production' hides seeded
 * demo rows, 'mock' shows them. Read from app_settings and kept live through
 * Realtime, so flipping it updates every open browser.
 *
 * Children are re-mounted when the mode changes so every page re-fetches with
 * the new filter (services read it via lib/dataMode).
 */
export function DataModeProvider({ children }) {
  const [setting, setSetting] = useState(null) // { value, updated_at, updater }
  const [error, setError] = useState(null)

  const apply = useCallback((row) => {
    if (!row?.value) return
    setDataModeCache(row.value)
    setSetting((prev) => ({ ...prev, ...row }))
  }, [])

  useEffect(() => {
    let alive = true
    settingsService
      .getDataMode()
      .then((row) => alive && apply(row ?? { value: 'mock' }))
      .catch((err) => {
        // The table may not exist yet (schema not re-run): fall back to showing everything.
        if (!alive) return
        setError(err.message)
        apply({ value: 'mock' })
      })
    const unsubscribe = settingsService.subscribeDataMode((row) => {
      // Realtime rows don't include the joined updater; reload the full row.
      settingsService.getDataMode().then(apply).catch(() => apply(row))
    })
    return () => {
      alive = false
      unsubscribe()
    }
  }, [apply])

  const mode = setting?.value ?? null

  const value = useMemo(
    () => ({
      mode: mode ?? 'mock',
      showDemo: mode !== 'production',
      isLoading: mode === null,
      error,
      updatedAt: setting?.updated_at ?? null,
      updatedBy: setting?.updater?.full_name ?? null,
      /** Admin only (enforced in the UI). Updates instantly here; others follow via Realtime. */
      setMode: async (next, profileId) => apply(await settingsService.setDataMode(next, profileId)),
    }),
    [mode, error, setting, apply],
  )

  return (
    <DataModeCtx.Provider value={value}>
      {/* Wait for the first read so pages never fetch with the wrong filter. */}
      {mode === null ? null : <ModeScope key={mode}>{children}</ModeScope>}
    </DataModeCtx.Provider>
  )
}

const ModeScope = ({ children }) => children

export function useDataMode() {
  const ctx = useContext(DataModeCtx)
  if (!ctx) throw new Error('useDataMode must be used inside <DataModeProvider>')
  return ctx
}
