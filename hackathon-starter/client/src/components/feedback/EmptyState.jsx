import { motion } from 'motion/react'
import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * EmptyState — when a list has no data (or a search has no results).
 *   <EmptyState title="No items yet" description="…" action={<Button>Create</Button>} />
 */
export function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', description, action, className, compact }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'relative flex flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-border text-center',
        compact ? 'gap-2 px-6 py-8' : 'gap-3 px-6 py-14',
        className,
      )}
    >
      <div aria-hidden className="absolute inset-0 bg-blueprint mask-fade-b opacity-70" />
      <div className="relative grid size-11 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-xs">
        <Icon className="size-5" strokeWidth={1.75} />
      </div>
      <div className="relative grid max-w-sm gap-1">
        <h3 className="font-display text-[15px] font-semibold">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="relative mt-1">{action}</div>}
    </motion.div>
  )
}
