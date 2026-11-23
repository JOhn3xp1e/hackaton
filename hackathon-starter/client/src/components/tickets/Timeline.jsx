import { motion } from 'motion/react'
import { CircleCheck, CircleDot, Clock, Flag } from 'lucide-react'
import { ROLES, STATUSES } from '@/lib/constants'
import { cn, formatDate, timeAgo } from '@/lib/utils'

const ICONS = { pending: Clock, in_progress: CircleDot, resolved: CircleCheck }
const TONES = {
  pending: 'bg-warning/12 text-warning',
  in_progress: 'bg-info/12 text-info',
  resolved: 'bg-success/12 text-success',
}

/** Vertical status timeline from ticket_updates (oldest first). */
export function Timeline({ updates }) {
  if (!updates.length) return <p className="text-sm text-muted-foreground">No activity yet.</p>

  return (
    <ol className="relative grid gap-5">
      <span aria-hidden className="absolute bottom-3 left-[15px] top-3 w-px bg-border" />
      {updates.map((u, i) => {
        const isFirst = !u.from_status
        const Icon = isFirst ? Flag : ICONS[u.to_status] ?? CircleDot
        return (
          <motion.li
            key={u.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative flex gap-3"
          >
            <span className={cn('relative z-10 grid size-8 shrink-0 place-items-center rounded-full ring-4 ring-card', isFirst ? 'bg-muted text-foreground' : TONES[u.to_status])}>
              <Icon className="size-4" />
            </span>
            <div className="grid min-w-0 gap-0.5 pt-1">
              <p className="text-sm">
                <span className="font-medium">{isFirst ? 'Reported' : `Marked ${STATUSES[u.to_status]?.label}`}</span>
                {u.author?.full_name && (
                  <span className="text-muted-foreground">
                    {' '}
                    by {u.author.full_name}
                    {u.author.role && ` (${ROLES[u.author.role]})`}
                  </span>
                )}
              </p>
              {u.note && !isFirst && <p className="rounded-md bg-muted/60 px-3 py-2 text-[13px]">{u.note}</p>}
              <time dateTime={u.created_at} title={formatDate(u.created_at, { dateStyle: 'medium', timeStyle: 'short' })} className="font-mono text-[11px] text-muted-foreground">
                {timeAgo(u.created_at)}
              </time>
            </div>
          </motion.li>
        )
      })}
    </ol>
  )
}
