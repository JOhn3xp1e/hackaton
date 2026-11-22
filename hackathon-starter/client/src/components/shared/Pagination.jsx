import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

function getPages(page, pageCount) {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1)
  if (page <= 4) return [1, 2, 3, 4, 5, '…', pageCount]
  if (page >= pageCount - 3) return [1, '…', pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1, pageCount]
  return [1, '…', page - 1, page, page + 1, '…', pageCount]
}

/**
 * Pagination — works for client- or server-side paging.
 *   <Pagination page={page} pageCount={10} total={97} pageSize={10} onPageChange={setPage} />
 */
export function Pagination({ page, pageCount, onPageChange, total, pageSize, className }) {
  if (pageCount <= 1 && !total) return null
  const from = total ? (page - 1) * pageSize + 1 : null
  const to = total ? Math.min(page * pageSize, total) : null

  return (
    <nav aria-label="Pagination" className={cn('flex flex-col items-center justify-between gap-3 sm:flex-row', className)}>
      <p className="text-[13px] text-muted-foreground tabular">
        {total ? (
          <>
            Showing <span className="font-medium text-foreground">{from}–{to}</span> of{' '}
            <span className="font-medium text-foreground">{total}</span>
          </>
        ) : (
          <>Page {page} of {pageCount}</>
        )}
      </p>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
          <ChevronLeft />
        </Button>
        {getPages(page, pageCount).map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="w-8 text-center text-sm text-muted-foreground">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={cn(
                'grid h-8 min-w-8 place-items-center rounded-md px-2 text-[13px] font-medium tabular transition-colors',
                p === page ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              {p}
            </button>
          ),
        )}
        <Button variant="ghost" size="icon-sm" onClick={() => onPageChange(page + 1)} disabled={page >= pageCount} aria-label="Next page">
          <ChevronRight />
        </Button>
      </div>
    </nav>
  )
}
