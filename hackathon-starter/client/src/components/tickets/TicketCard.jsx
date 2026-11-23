import { Link } from 'react-router'
import { ChevronRight, ImageIcon, MapPin, MessageSquare, UserRound } from 'lucide-react'
import { CATEGORIES } from '@/lib/constants'
import { reporterLabel } from '@/lib/studentIdentity'
import { cn, timeAgo } from '@/lib/utils'
import { SEVERITY_MAP, StatusBadge } from '@/components/shared/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { StatusProgress } from './StatusProgress'

/** Compact, mobile-friendly ticket summary used in the public feed. */
export function TicketCard({ ticket, mine = false, className }) {
  const Icon = CATEGORIES[ticket.category]?.icon
  const commentCount = ticket.comments?.[0]?.count ?? 0

  return (
    <Link
      to={`/tickets/${ticket.ticket_number}`}
      className={cn(
        'group grid gap-3 rounded-lg border border-border bg-card p-4 shadow-xs transition-colors hover:border-input hover:bg-accent/30',
        mine && 'border-primary/30',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-md border border-border bg-background text-muted-foreground">
          {Icon && <Icon className="size-5" strokeWidth={1.75} />}
        </span>
        <div className="grid min-w-0 flex-1 gap-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-mono text-[12px] text-muted-foreground">{ticket.ticket_number}</span>
            <StatusBadge status={ticket.status} />
            {(ticket.severity === 'high' || ticket.severity === 'critical') && (
              <StatusBadge status={ticket.severity} map={SEVERITY_MAP} />
            )}
            {mine && <Badge variant="primary">Yours</Badge>}
          </div>
          <p className="truncate font-medium">{ticket.title}</p>
          <p className="flex items-center gap-1 truncate text-[12.5px] text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            {ticket.location?.name}
            {ticket.asset_label && ` · ${ticket.asset_label}`}
            {ticket.photo_urls?.length > 0 && (
              <>
                {' · '}
                <ImageIcon className="size-3.5 shrink-0" /> {ticket.photo_urls.length}
              </>
            )}
          </p>
        </div>
        <ChevronRight className="mt-2 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
      <StatusProgress status={ticket.status} />
      <div className="flex items-center justify-between gap-3 text-[12px] text-muted-foreground">
        <span className="flex min-w-0 items-center gap-1.5 truncate">
          <UserRound className="size-3.5 shrink-0" />
          <span className="truncate">{reporterLabel(ticket)}</span>
        </span>
        <span className="flex shrink-0 items-center gap-3 font-mono text-[11px]">
          <span className="flex items-center gap-1" aria-label={`${commentCount} comments`}>
            <MessageSquare className="size-3.5" /> {commentCount}
          </span>
          {timeAgo(ticket.created_at)}
        </span>
      </div>
    </Link>
  )
}
