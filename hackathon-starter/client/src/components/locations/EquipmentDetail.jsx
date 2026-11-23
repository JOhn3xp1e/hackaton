import { Link } from 'react-router'
import { Download, ExternalLink, ListFilter, MapPin } from 'lucide-react'
import { useAsync } from '@/hooks/useAsync'
import { STATUS_KEYS, STATUSES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { ticketsService } from '@/services/ticketsService'
import { QrImage, equipmentUrlFor } from '@/components/locations/QrImage'
import { TicketsTable } from '@/components/tickets/TicketsTable'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const STAT_TONE = {
  pending: 'text-amber-600 dark:text-amber-400',
  in_progress: 'text-sky-600 dark:text-sky-400',
  resolved: 'text-emerald-600 dark:text-emerald-400',
}

/** One equipment item: its sticker, where it is, and every report filed against it. */
export function EquipmentDetail({ item, onOpenChange, onDownload }) {
  const reports = useAsync(
    () => (item ? ticketsService.list({ equipmentId: item.id }) : Promise.resolve([])),
    [item?.id],
    { initialData: [] },
  )
  const rows = reports.data ?? []
  const counts = Object.fromEntries(STATUS_KEYS.map((k) => [k, rows.filter((t) => t.status === k).length]))

  return (
    <Modal
      open={Boolean(item)}
      onOpenChange={onOpenChange}
      size="xl"
      title={item ? `${item.name}` : 'Equipment'}
      description={item ? `Equipment ID ${item.short_code}` : undefined}
    >
      {item && (
        <div className="grid gap-5">
          <div className="flex flex-col gap-4 sm:flex-row">
            <QrImage url={equipmentUrlFor(item.short_code)} label={item.short_code} size={112} className="shrink-0 self-start border border-border" />
            <div className="grid min-w-0 flex-1 content-start gap-1.5">
              <span className="w-fit rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[12px] font-semibold">{item.short_code}</span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" />
                {item.location?.name}
                {item.location?.building && ` · ${item.location.building}`}
                {item.location?.floor && ` · ${item.location.floor}`}
              </span>
              {item.description && <p className="text-sm">{item.description}</p>}
              <div className="mt-1 flex flex-wrap gap-1.5">
                <Button size="sm" variant="outline" onClick={() => onDownload(item)} leftIcon={<Download />}>
                  QR PNG
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link to={`/tickets?equipment=${item.id}`}>
                    <ListFilter /> Open in Maintenance Tasks
                  </Link>
                </Button>
                <Button size="sm" variant="ghost" asChild>
                  <a href={equipmentUrlFor(item.short_code)} target="_blank" rel="noreferrer">
                    <ExternalLink /> Report form
                  </a>
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Reports" value={rows.length} loading={reports.isLoading} />
            {STATUS_KEYS.map((k) => (
              <Stat key={k} label={STATUSES[k].label} value={counts[k]} loading={reports.isLoading} tone={STAT_TONE[k]} />
            ))}
          </div>

          <div className="grid gap-2">
            <h3 className="font-display text-sm font-semibold">Reports for this item</h3>
            <TicketsTable
              tickets={rows}
              isLoading={reports.isLoading}
              error={reports.error}
              onRetry={reports.refetch}
              empty={{ title: 'No reports yet', description: 'Nobody has reported a problem with this item.' }}
            />
          </div>
        </div>
      )}
    </Modal>
  )
}

function Stat({ label, value, loading, tone }) {
  return (
    <div className="grid gap-0.5 rounded-lg border border-border bg-card px-3 py-2.5">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      {loading ? <Skeleton className="h-6 w-8" /> : <span className={cn('font-display text-xl font-semibold', tone)}>{value}</span>}
    </div>
  )
}
