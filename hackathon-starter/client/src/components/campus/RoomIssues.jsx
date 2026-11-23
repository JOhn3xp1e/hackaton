import { useMemo } from 'react'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import { ArrowRight, ChevronRight, CircleCheck, UserRoundCheck } from 'lucide-react'
import { useAsync } from '@/hooks/useAsync'
import { useLiveTickets } from '@/hooks/useLiveTickets'
import { CATEGORIES } from '@/lib/constants'
import { cn, timeAgo } from '@/lib/utils'
import { ticketsService } from '@/services/ticketsService'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/feedback/ErrorState'

const SEVERITY_RANK = { critical: 0, high: 1, medium: 2, low: 3 }
const SEVERITY_DOT = {
  critical: 'bg-destructive',
  high: 'bg-destructive/70',
  medium: 'bg-warning',
  low: 'bg-muted-foreground/50',
}

/**
 * Ongoing (pending / in progress) issues in one room, most urgent first.
 * Each row opens the ticket page where staff update status, assign or email.
 */
export function RoomIssues({ location }) {
  const { data, isLoading, error, refetch } = useAsync(
    () => ticketsService.list({ locationId: location.id, limit: 100 }),
    [location.id],
    { initialData: [] },
  )
  useLiveTickets(refetch, { notify: false, channel: `room-issues-${location.id}` })

  const open = useMemo(
    () =>
      (data ?? [])
        .filter((t) => t.status !== 'resolved')
        .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || new Date(a.created_at) - new Date(b.created_at)),
    [data],
  )

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="eyebrow">Ongoing issues{!isLoading && ` · ${open.length}`}</p>
        {open.length > 0 && (
          <Link
            to={`/tickets?location=${location.id}`}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
          >
            All tickets <ArrowRight className="size-3" />
          </Link>
        )}
      </div>

      {isLoading && !data?.length ? (
        <div className="grid gap-1.5">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      ) : error ? (
        <ErrorState compact error={error} onRetry={refetch} />
      ) : !open.length ? (
        <p className="flex items-center gap-2 rounded-md border border-dashed border-border bg-card px-3 py-2.5 text-[12.5px] text-muted-foreground">
          <CircleCheck className="size-4 shrink-0 text-success" /> No ongoing issues in this room.
        </p>
      ) : (
        <ul className="grid max-h-32 gap-1.5 overflow-y-auto overscroll-contain scrollbar-thin pr-1">
          {open.map((t, i) => {
            const Icon = CATEGORIES[t.category]?.icon
            return (
              <motion.li
                key={t.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
              >
                <Link
                  to={`/tickets/${t.ticket_number}`}
                  className="group flex items-center gap-2.5 rounded-md border border-border bg-card px-2.5 py-2 transition-colors hover:border-input hover:bg-accent/50"
                >
                  <span className={cn('size-2 shrink-0 rounded-full', SEVERITY_DOT[t.severity])} title={`${t.severity} severity`} />
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className="flex items-center gap-1.5 truncate text-[13px] font-medium group-hover:text-primary">
                      {Icon && <Icon className="size-3.5 shrink-0 text-muted-foreground" />}
                      <span className="truncate">{t.title}</span>
                    </span>
                    <span className="flex items-center gap-1.5 truncate font-mono text-[10.5px] text-muted-foreground">
                      {t.ticket_number} · {timeAgo(t.created_at)}
                      {t.assignee && (
                        <span className="inline-flex items-center gap-0.5 truncate font-sans">
                          · <UserRoundCheck className="size-3 shrink-0" /> {t.assignee.full_name}
                        </span>
                      )}
                    </span>
                  </span>
                  <StatusBadge status={t.status} className="shrink-0" />
                  <ChevronRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              </motion.li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
