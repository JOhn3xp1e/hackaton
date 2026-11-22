import { useMemo, useState } from 'react'

/**
 * Client-side pagination over an array. For server-side pagination, keep
 * `page` in state and pass it to your service instead; the <Pagination />
 * component works with both.
 */
export function usePagination(items = [], pageSize = 10) {
  const [page, setPage] = useState(1)
  const total = items.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, pageCount)

  const pageItems = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize],
  )

  return { page: safePage, setPage, pageCount, total, pageSize, pageItems }
}
