import { useSyncExternalStore } from 'react'

/** Subscribe to a CSS media query.  const isDesktop = useMediaQuery('(min-width: 1024px)') */
export function useMediaQuery(query) {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', cb)
      return () => mql.removeEventListener('change', cb)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
