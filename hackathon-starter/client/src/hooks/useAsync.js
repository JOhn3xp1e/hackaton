import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * useAsync — run an async function and track { data, error, isLoading }.
 *
 *   const { data, isLoading, error, refetch } = useAsync(() => itemsService.list(params), [params.page])
 *
 * - Re-runs when `deps` change.
 * - Ignores stale responses (race-condition safe).
 * - `setData` lets you apply optimistic updates locally.
 */
export function useAsync(asyncFn, deps = [], { immediate = true, initialData = null } = {}) {
  const [state, setState] = useState({ data: initialData, error: null, isLoading: immediate })
  const callId = useRef(0)
  const fnRef = useRef(asyncFn)
  fnRef.current = asyncFn

  const run = useCallback(async () => {
    const id = ++callId.current
    setState((s) => ({ ...s, isLoading: true, error: null }))
    try {
      const data = await fnRef.current()
      if (id === callId.current) setState({ data, error: null, isLoading: false })
      return data
    } catch (error) {
      if (id === callId.current) setState((s) => ({ ...s, error, isLoading: false }))
      return undefined
    }
  }, [])

  useEffect(() => {
    if (immediate) run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  const setData = useCallback(
    (updater) => setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater })),
    [],
  )

  return { ...state, refetch: run, setData }
}
