import { forwardRef } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

/**
 * Card family (shadcn-style API).
 *   <Card interactive>
 *     <CardHeader><CardTitle>…</CardTitle><CardDescription>…</CardDescription></CardHeader>
 *     <CardContent>…</CardContent>
 *     <CardFooter>…</CardFooter>
 *   </Card>
 * `interactive` adds a subtle lift + border emphasis on hover.
 */
export const Card = forwardRef(function Card({ className, interactive = false, ...props }, ref) {
  return (
    <motion.div
      ref={ref}
      whileHover={interactive ? { y: -2 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className={cn(
        'rounded-lg border border-border bg-card text-card-foreground shadow-xs',
        interactive && 'transition-[border-color,box-shadow] duration-200 hover:border-input hover:shadow-md',
        className,
      )}
      {...props}
    />
  )
})

export function CardHeader({ className, action, children, ...props }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 p-5 pb-0', className)} {...props}>
      <div className="grid min-w-0 gap-1">{children}</div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function CardTitle({ className, as: Tag = 'h3', ...props }) {
  return <Tag className={cn('font-display text-[15px] font-semibold leading-tight tracking-tight', className)} {...props} />
}

export function CardDescription({ className, ...props }) {
  return <p className={cn('text-[13px] text-muted-foreground', className)} {...props} />
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-5', className)} {...props} />
}

export function CardFooter({ className, ...props }) {
  return <div className={cn('flex items-center gap-2 border-t border-border px-5 py-3.5', className)} {...props} />
}
