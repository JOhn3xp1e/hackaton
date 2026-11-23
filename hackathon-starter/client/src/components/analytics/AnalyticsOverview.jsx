import { useCallback, useMemo } from 'react'
import { motion } from 'motion/react'
import { ChartColumn, MapPin } from 'lucide-react'
import { useAsync } from '@/hooks/useAsync'
import { useLiveTickets } from '@/hooks/useLiveTickets'
import { CATEGORIES } from '@/lib/constants'
import { analyticsService } from '@/services/analyticsService'
import { AreaChart, BarChart } from '@/components/shared/Charts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'

function Section({ state, height = 240, emptyIcon, children }) {
  if (state.error) return <ErrorState compact error={state.error} onRetry={state.refetch} />
  if (state.isLoading && !state.data?.length) return <Skeleton style={{ height }} className="w-full" />
  if (!state.data?.length)
    return <EmptyState compact icon={emptyIcon} title="No data yet" description="Analytics appear once reports come in." />
  return children
}

/** Ranked horizontal bars — reads better than vertical bars for long labels. */
function RankedBars({ rows, color = 'var(--chart-1)' }) {
  const max = Math.max(1, ...rows.map((r) => r.total))
  return (
    <ul className="grid gap-3">
      {rows.map((r, i) => (
        <li key={r.key} className="grid gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 truncate">
              {r.icon && <r.icon className="size-4 shrink-0 text-muted-foreground" />}
              <span className="truncate">{r.label}</span>
            </span>
            <span className="shrink-0 font-mono text-[12px] text-muted-foreground">
              <span className="font-semibold text-foreground">{r.total}</span> · {r.open} open
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full"
              style={{ background: color }}
              initial={{ width: 0 }}
              whileInView={{ width: `${(r.total / max) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

/**
 * Analytics section shown on the Overview page: 30-day trend, most-reported
 * problems, hotspots and the open backlog. Updates live.
 */
export function AnalyticsOverview() {
  const daily = useAsync(() => analyticsService.daily(), [], { initialData: [] })
  const byCategory = useAsync(() => analyticsService.byCategory(), [], { initialData: [] })
  const byLocation = useAsync(() => analyticsService.byLocation(), [], { initialData: [] })

  const refetchAll = useCallback(() => {
    daily.refetch()
    byCategory.refetch()
    byLocation.refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useLiveTickets(refetchAll, { notify: false, channel: 'overview-analytics' })

  const dailyData = useMemo(
    () =>
      (daily.data ?? []).map((d) => ({
        label: new Date(`${d.day}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        reported: d.reported,
        resolved: d.resolved,
      })),
    [daily.data],
  )

  const categoryRows = useMemo(
    () =>
      (byCategory.data ?? []).map((c) => ({
        key: c.category,
        label: CATEGORIES[c.category]?.label ?? c.category,
        icon: CATEGORIES[c.category]?.icon,
        total: c.total,
        open: c.open,
      })),
    [byCategory.data],
  )

  const locationRows = useMemo(
    () =>
      (byLocation.data ?? [])
        .filter((l) => l.total > 0)
        .slice(0, 8)
        .map((l) => ({ key: l.location_id, label: `${l.name} (${l.code})`, total: l.total, open: l.open })),
    [byLocation.data],
  )

  const categoryBars = useMemo(() => categoryRows.map((r) => ({ label: CATEGORIES[r.key]?.short ?? r.key, value: r.open })), [categoryRows])

  const totals30 = dailyData.reduce((acc, d) => ({ reported: acc.reported + d.reported, resolved: acc.resolved + d.resolved }), {
    reported: 0,
    resolved: 0,
  })

  return (
    <section id="analytics" aria-labelledby="analytics-title" className="grid scroll-mt-20 gap-6">
      <div className="grid gap-1">
        <p className="eyebrow">Analytics</p>
        <h2 id="analytics-title" className="font-display text-xl font-semibold tracking-tight">
          What breaks, where, and how fast it gets fixed
        </h2>
      </div>

      <Card>
        <CardHeader
          action={
            <span className="font-mono text-[12px] text-muted-foreground">
              {totals30.reported} reported · {totals30.resolved} resolved
            </span>
          }
        >
          <CardTitle>Reports vs. fixes — last 30 days</CardTitle>
          <CardDescription>Daily new reports compared with tickets resolved.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Section state={daily} emptyIcon={ChartColumn}>
            <AreaChart
              data={dailyData}
              series={[
                { key: 'reported', label: 'Reported', color: 'var(--chart-5)' },
                { key: 'resolved', label: 'Resolved', color: 'var(--chart-1)', dashed: true },
              ]}
            />
          </Section>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Most reported problems</CardTitle>
            <CardDescription>All-time reports by category.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Section state={byCategory} emptyIcon={ChartColumn}>
              <RankedBars rows={categoryRows} />
            </Section>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Problem hotspots</CardTitle>
            <CardDescription>Rooms and labs with the most reports.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Section state={byLocation} emptyIcon={MapPin}>
              {locationRows.length ? (
                <RankedBars rows={locationRows} color="var(--chart-4)" />
              ) : (
                <EmptyState compact icon={MapPin} title="No reports yet" />
              )}
            </Section>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Open backlog by category</CardTitle>
          <CardDescription>Unresolved tickets right now — where to send technicians first.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Section state={byCategory} height={200} emptyIcon={ChartColumn}>
            <BarChart data={categoryBars} height={200} color="var(--chart-5)" />
          </Section>
        </CardContent>
      </Card>
    </section>
  )
}
