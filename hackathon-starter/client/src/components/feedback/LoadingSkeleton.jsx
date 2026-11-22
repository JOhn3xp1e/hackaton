import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

/**
 * LoadingSkeleton — ready-made skeleton layouts.
 *   <LoadingSkeleton variant="table" rows={6} />
 *   <LoadingSkeleton variant="cards" count={4} />
 *   <LoadingSkeleton variant="list" rows={5} />
 *   <LoadingSkeleton variant="detail" />
 */
export function LoadingSkeleton({ variant = 'list', rows = 5, count = 4, className }) {
  if (variant === 'cards') {
    return (
      <div className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-4', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="grid gap-3 rounded-lg border border-border bg-card p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'table') {
    return (
      <div className={cn('overflow-hidden rounded-lg border border-border bg-card', className)}>
        <div className="flex gap-6 border-b border-border bg-muted/50 px-4 py-3">
          {[24, 40, 20, 16].map((w, i) => (
            <Skeleton key={i} className="h-3" style={{ width: `${w}%` }} />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 border-b border-border px-4 py-3.5 last:border-0">
            <Skeleton className="h-4 w-[24%]" />
            <Skeleton className="h-4 w-[40%]" />
            <Skeleton className="h-5 w-[12%] rounded-full" />
            <Skeleton className="h-4 w-[14%]" />
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'detail') {
    return (
      <div className={cn('grid gap-4', className)}>
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('grid gap-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-full" />
          <div className="grid flex-1 gap-2">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Full-area centered loader (route-level suspense, first load). */
export function PageLoader({ label = 'Loading' }) {
  return (
    <div className="grid min-h-[50vh] place-items-center text-muted-foreground">
      <div className="flex flex-col items-center gap-3">
        <Spinner />
        <span className="eyebrow">{label}</span>
      </div>
    </div>
  )
}
