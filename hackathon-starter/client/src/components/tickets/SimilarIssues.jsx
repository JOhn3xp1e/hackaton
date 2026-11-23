import { useState } from 'react'
import { Link } from 'react-router'
import { Cpu, GitMerge } from 'lucide-react'
import { useAsync } from '@/hooks/useAsync'
import { timeAgo } from '@/lib/utils'
import { reporterLabel } from '@/lib/studentIdentity'
import { ticketsService } from '@/services/ticketsService'
import { useToast } from '@/components/ui/toast'
import { SEVERITY_MAP, StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/feedback/ErrorState'

/**
 * Staff: other reports filed against the same piece of equipment, so duplicates
 * are easy to spot. Pick some and press Merge (merging itself isn't built yet).
 */
export function SimilarIssues({ ticket }) {
  const toast = useToast()
  const [selected, setSelected] = useState(() => new Set())

  const similar = useAsync(
    async () => {
      if (!ticket.equipment_id) return []
      const rows = await ticketsService.list({ equipmentId: ticket.equipment_id, limit: 50 })
      return rows.filter((t) => t.id !== ticket.id)
    },
    [ticket.id, ticket.equipment_id],
    { initialData: [] },
  )
  const rows = similar.data ?? []

  const toggle = (id, on) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })

  const merge = () =>
    toast.info('Merging is not available yet', {
      description: `${selected.size} report${selected.size === 1 ? '' : 's'} selected to merge into ${ticket.ticket_number}.`,
    })

  return (
    <Card>
      <CardHeader
        action={
          <Button size="sm" variant="outline" onClick={merge} disabled={!selected.size} leftIcon={<GitMerge />}>
            Merge{selected.size ? ` (${selected.size})` : ''}
          </Button>
        }
      >
        <CardTitle>Similar issues</CardTitle>
        <CardDescription>
          {ticket.equipment
            ? `Other reports for ${ticket.equipment.short_code} · ${ticket.equipment.name}`
            : 'Reports for the same equipment'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {!ticket.equipment_id ? (
          <p className="text-sm text-muted-foreground">This report isn't linked to a piece of equipment, so there's nothing to compare.</p>
        ) : similar.isLoading && !rows.length ? (
          <div className="grid gap-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : similar.error ? (
          <ErrorState compact error={similar.error} onRetry={similar.refetch} />
        ) : !rows.length ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Cpu className="size-4 shrink-0" />
            No other reports for this equipment.
          </p>
        ) : (
          <ul className="grid gap-2">
            {rows.map((t) => (
              <li key={t.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                <Checkbox
                  className="mt-0.5"
                  checked={selected.has(t.id)}
                  onCheckedChange={(v) => toggle(t.id, v === true)}
                  aria-label={`Select ${t.ticket_number} to merge`}
                />
                <div className="grid min-w-0 flex-1 gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/tickets/${t.ticket_number}`} className="font-mono text-[12.5px] font-semibold hover:text-primary hover:underline">
                      {t.ticket_number}
                    </Link>
                    <span className="min-w-0 truncate text-sm font-medium">{t.title}</span>
                  </div>
                  <span className="text-[12.5px] text-muted-foreground">
                    {reporterLabel(t)} · {timeAgo(t.created_at)}
                  </span>
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                  <StatusBadge status={t.severity} map={SEVERITY_MAP} />
                  <StatusBadge status={t.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
