import { useCallback, useMemo } from 'react'
import { Link } from 'react-router'
import { ArrowRight, CircleCheck, Clock, Siren, Timer, Wrench } from 'lucide-react'
import { useAsync } from '@/hooks/useAsync'
import { useLiveTickets } from '@/hooks/useLiveTickets'
import { useAuth } from '@/providers/AuthProvider'
import { analyticsService } from '@/services/analyticsService'
import { ticketsService } from '@/services/ticketsService'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { TicketsTable } from '@/components/tickets/TicketsTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/feedback/ErrorState'

const formatHours = (h) => (h == null ? '—' : h < 24 ? `${Number(h).toFixed(1)}h` : `${(h / 24).toFixed(1)}d`)

export default function StaffDashboard() {
  const { profile } = useAuth()

  const overview = useAsync(() => analyticsService.overview(), [])
  const queue = useAsync(() => ticketsService.list({ limit: 200 }), [], { initialData: [] })

  const refetchAll = useCallback(() => {
    overview.refetch()
    queue.refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useLiveTickets(refetchAll, { channel: 'dashboard' })

  // Open tickets, most urgent first, then oldest first.
  const urgent = useMemo(() => {
    const rank = { critical: 0, high: 1, medium: 2, low: 3 }
    return (queue.data ?? [])
      .filter((t) => t.status !== 'resolved')
      .sort((a, b) => rank[a.severity] - rank[b.severity] || new Date(a.created_at) - new Date(b.created_at))
      .slice(0, 8)
  }, [queue.data])

  const mine = (queue.data ?? []).filter((t) => t.assigned_to === profile?.id && t.status !== 'resolved').length
  const o = overview.data

  return (
    <>
      <PageHeader
        eyebrow="Maintenance dashboard"
        title="Campus issues at a glance"
        description="New reports appear here in real time. Work the queue from the most urgent down."
        actions={
          <Button asChild>
            <Link to="/tickets">
              All tickets <ArrowRight />
            </Link>
          </Button>
        }
      />

      {overview.error ? (
        <ErrorState error={overview.error} onRetry={overview.refetch} className="mb-6" />
      ) : (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {!o ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[118px]" />)
          ) : (
            <>
              <StatCard label="Pending" value={o.pending} icon={Clock} hint="Waiting for a technician" />
              <StatCard label="In progress" value={o.in_progress} icon={Wrench} hint={`${mine} assigned to you`} />
              <StatCard label="Resolved this week" value={o.resolved_this_week} icon={CircleCheck} hint={`${o.resolved} resolved all-time`} />
              <StatCard
                label="Avg. time to fix"
                value={Number(o.avg_resolution_hours ?? 0)}
                format={formatHours}
                icon={Timer}
                hint="From report to resolved"
              />
            </>
          )}
        </div>
      )}

      {o?.open_critical > 0 && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm">
          <Siren className="size-5 shrink-0 text-destructive" />
          <span>
            <span className="font-semibold">{o.open_critical} critical</span> {o.open_critical === 1 ? 'issue needs' : 'issues need'} attention
            now (possible safety hazard).
          </span>
        </div>
      )}

      <Card>
        <CardHeader
          action={
            <Badge variant="outline" className="font-mono">
              {urgent.length} shown
            </Badge>
          }
        >
          <CardTitle>Priority queue</CardTitle>
          <p className="text-[13px] text-muted-foreground">Open tickets sorted by severity, then age.</p>
        </CardHeader>
        <CardContent className="pt-4">
          <TicketsTable
            tickets={urgent}
            isLoading={queue.isLoading}
            error={queue.error}
            onRetry={queue.refetch}
            empty={{ icon: CircleCheck, title: 'All clear', description: 'No open tickets. Nice work!' }}
          />
        </CardContent>
      </Card>
    </>
  )
}
