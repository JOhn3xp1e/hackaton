import { Link } from 'react-router'
import { ChevronRight, ImageIcon, MapPin } from 'lucide-react'
import { CATEGORIES } from '@/lib/constants'
import { cn, timeAgo } from '@/lib/utils'
import { SEVERITY_MAP, StatusBadge } from '@/components/shared/StatusBadge'
import { StatusProgress } from './StatusProgress'

/** Compact, mobile-friendly ticket summary used in reporter lists. */
export function TicketCard({ ticket, className }) {
  const Icon = CATEGORIES[ticket.category]?.icon
  return (
    <Link
      to={`/tickets/${ticket.ticket_number}`}
      className={cn(
        'group grid gap-3 rounded-lg border border-border bg-card p-4 shadow-xs transition-colors hover:border-input hover:bg-accent/30',
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
      <div className="flex items-center gap-3">
        <StatusProgress status={ticket.status} className="flex-1" />
        <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{timeAgo(ticket.updated_at ?? ticket.created_at)}</span>
      </div>
    </Link>
  )
}
