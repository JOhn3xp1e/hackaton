import { useNavigate } from 'react-router'
import { Inbox } from 'lucide-react'
import { CATEGORIES } from '@/lib/constants'
import { timeAgo } from '@/lib/utils'
import { DataTable } from '@/components/shared/DataTable'
import { SEVERITY_MAP, StatusBadge } from '@/components/shared/StatusBadge'

const SEVERITY_RANK = { low: 0, medium: 1, high: 2, critical: 3 }

const columns = [
  {
    key: 'ticket_number',
    header: 'Ticket',
    sortable: true,
    className: 'w-28',
    render: (t) => <span className="font-mono text-[12.5px]">{t.ticket_number}</span>,
  },
  {
    key: 'title',
    header: 'Issue',
    sortable: true,
    render: (t) => {
      const Icon = CATEGORIES[t.category]?.icon
      return (
        <div className="flex min-w-0 items-center gap-2.5">
          {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" />}
          <div className="grid min-w-0">
            <span className="truncate font-medium">{t.title}</span>
            <span className="truncate text-[12px] text-muted-foreground">
              {t.location?.name}
              {t.asset_label && ` · ${t.asset_label}`}
            </span>
          </div>
        </div>
      )
    },
  },
  {
    key: 'severity',
    header: 'Severity',
    sortable: true,
    sortValue: (t) => SEVERITY_RANK[t.severity],
    render: (t) => <StatusBadge status={t.severity} map={SEVERITY_MAP} />,
  },
  { key: 'status', header: 'Status', sortable: true, render: (t) => <StatusBadge status={t.status} /> },
  {
    key: 'assignee',
    header: 'Assignee',
    hideOnMobile: true,
    sortable: true,
    sortValue: (t) => t.assignee?.full_name ?? '',
    render: (t) => t.assignee?.full_name ?? <span className="text-muted-foreground">—</span>,
  },
  {
    key: 'created_at',
    header: 'Reported',
    align: 'right',
    hideOnMobile: true,
    sortable: true,
    sortValue: (t) => new Date(t.created_at).getTime(),
    render: (t) => <span className="font-mono text-[12px] text-muted-foreground">{timeAgo(t.created_at)}</span>,
  },
]

/** Staff ticket table — click a row to open the ticket. */
export function TicketsTable({ tickets, isLoading, error, onRetry, empty }) {
  const navigate = useNavigate()
  return (
    <DataTable
      columns={columns}
      data={tickets ?? []}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      onRowClick={(t) => navigate(`/tickets/${t.ticket_number}`)}
      empty={{ icon: Inbox, title: 'No tickets', description: 'Nothing matches these filters.', ...empty }}
    />
  )
}
