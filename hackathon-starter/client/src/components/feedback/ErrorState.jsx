import { motion } from 'motion/react'
import { AlertOctagon, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * ErrorState — show a failed request with a retry button.
 *   if (error) return <ErrorState error={error} onRetry={refetch} />
 */
export function ErrorState({ title = 'Something went wrong', error, description, onRetry, className, compact }) {
  const message = description || error?.message || 'An unexpected error occurred. Please try again.'
  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/25 bg-destructive/[0.03] text-center',
        compact ? 'px-6 py-8' : 'px-6 py-14',
        className,
      )}
    >
      <div className="grid size-11 place-items-center rounded-full bg-destructive/10 text-destructive">
        <AlertOctagon className="size-5" strokeWidth={1.75} />
      </div>
      <div className="grid max-w-md gap-1">
        <h3 className="font-display text-[15px] font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{message}</p>
        {error?.status && <p className="eyebrow mt-1">HTTP {error.status}{error.code ? ` · ${error.code}` : ''}</p>}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} leftIcon={<RotateCw />}>
          Try again
        </Button>
      )}
    </motion.div>
  )
}
