import { cn } from '@/lib/utils'

/** Shimmering placeholder block. Size it with className (h-4 w-32, etc). */
export function Skeleton({ className, ...props }) {
  return (
    <div
      aria-hidden
      className={cn(
        'rounded-md bg-muted animate-shimmer',
        'bg-[linear-gradient(90deg,var(--muted)_0%,color-mix(in_oklab,var(--muted),var(--foreground)_5%)_50%,var(--muted)_100%)] bg-size-[200%_100%]',
        className,
      )}
      {...props}
    />
  )
}
