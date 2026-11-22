import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton'

/**
 * DataTable — sortable, responsive table with built-in loading / error / empty states.
 *
 *   const columns = [
 *     { key: 'title', header: 'Title', sortable: true },
 *     { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
 *     { key: 'amount', header: 'Amount', align: 'right', sortable: true, render: (r) => formatCurrency(r.amount) },
 *     { key: 'actions', header: '', render: (row) => <RowMenu row={row} />, className: 'w-10' },
 *   ]
 *   <DataTable columns={columns} data={rows} isLoading={isLoading} error={error} onRetry={refetch}
 *              onRowClick={(row) => …} empty={{ title: 'No items', action: <Button/> }} />
 *
 * Column options: key, header, render(row), sortable, sortValue(row), align ('left'|'right'|'center'),
 *                 className, hideOnMobile.
 */
export function DataTable({
  columns,
  data = [],
  rowKey = 'id',
  isLoading,
  error,
  onRetry,
  onRowClick,
  empty,
  defaultSort,
  className,
  dense = false,
}) {
  const [sort, setSort] = useState(defaultSort ?? null) // { key, dir: 'asc' | 'desc' }

  const sorted = useMemo(() => {
    if (!sort) return data
    const col = columns.find((c) => c.key === sort.key)
    const get = col?.sortValue ?? ((row) => row[sort.key])
    return [...data].sort((a, b) => {
      const av = get(a)
      const bv = get(b)
      if (av == null) return 1
      if (bv == null) return -1
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), undefined, { numeric: true })
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [data, sort, columns])

  const toggleSort = (key) =>
    setSort((s) => (s?.key !== key ? { key, dir: 'asc' } : s.dir === 'asc' ? { key, dir: 'desc' } : null))

  if (isLoading && !data.length) return <LoadingSkeleton variant="table" rows={6} className={className} />
  if (error) return <ErrorState error={error} onRetry={onRetry} compact className={className} />
  if (!data.length) return <EmptyState compact className={className} {...empty} />

  const alignClass = (a) => (a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left')

  return (
    <div className={cn('relative overflow-hidden rounded-lg border border-border bg-card', className)}>
      {isLoading && <div className="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden bg-primary/15"><div className="h-full w-1/3 animate-progress bg-primary" /></div>}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {columns.map((col) => {
                const active = sort?.key === col.key
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                    className={cn(
                      'h-10 px-4 font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground whitespace-nowrap',
                      alignClass(col.align),
                      col.hideOnMobile && 'hidden md:table-cell',
                      col.className,
                    )}
                  >
                    {col.sortable ? (
                      <button
                        onClick={() => toggleSort(col.key)}
                        className={cn('inline-flex items-center gap-1 uppercase hover:text-foreground transition-colors', active && 'text-foreground')}
                      >
                        {col.header}
                        {active ? (
                          sort.dir === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />
                        ) : (
                          <ChevronsUpDown className="size-3 opacity-50" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <motion.tbody initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: 0.025 } } }}>
            {sorted.map((row, i) => (
              <motion.tr
                key={row[rowKey] ?? i}
                variants={{ initial: { opacity: 0 }, animate: { opacity: 1 } }}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-b border-border last:border-0 transition-colors',
                  onRowClick && 'cursor-pointer',
                  'hover:bg-muted/50',
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 align-middle',
                      dense ? 'py-2' : 'py-3',
                      alignClass(col.align),
                      col.hideOnMobile && 'hidden md:table-cell',
                      col.className,
                    )}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </div>
    </div>
  )
}
