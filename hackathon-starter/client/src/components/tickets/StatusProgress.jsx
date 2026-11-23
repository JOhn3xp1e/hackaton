import { motion } from 'motion/react'
import { STATUS_KEYS, STATUSES } from '@/lib/constants'
import { cn } from '@/lib/utils'

/**
 * Three-step progress bar: Pending → In Progress → Resolved.
 * `labels` shows the step names underneath (used on the ticket page).
 */
export function StatusProgress({ status, labels = false, className }) {
  const current = STATUS_KEYS.indexOf(status)
  return (
    <div className={cn('grid gap-2', className)}>
      <div className="grid grid-cols-3 gap-1.5" aria-label={`Status: ${STATUSES[status]?.label}`}>
        {STATUS_KEYS.map((key, i) => (
          <div key={key} className="h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              className={cn('h-full rounded-full', status === 'resolved' ? 'bg-success' : i === current ? 'bg-info' : 'bg-primary')}
              initial={{ width: 0 }}
              animate={{ width: i <= current ? '100%' : '0%' }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
            />
          </div>
        ))}
      </div>
      {labels && (
        <div className="grid grid-cols-3 gap-1.5 text-[12px]">
          {STATUS_KEYS.map((key, i) => (
            <span key={key} className={cn(i <= current ? 'font-medium text-foreground' : 'text-muted-foreground', i === 1 && 'text-center', i === 2 && 'text-right')}>
              {STATUSES[key].label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
