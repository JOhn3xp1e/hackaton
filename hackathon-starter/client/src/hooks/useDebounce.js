import { useEffect, useState } from 'react'

/** Delay a fast-changing value (e.g. search input) until the user pauses typing. */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}
