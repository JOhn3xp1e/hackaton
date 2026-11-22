import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Activity, ArrowRight, DollarSign, Download, FilePlus2, Gauge, Plus, Share2, Upload, Users } from 'lucide-react'
import { useAsync } from '@/hooks/useAsync'
import { useToast } from '@/components/ui/toast'
import { dashboardService } from '@/services/dashboardService'
import { formatCurrency, formatNumber, timeAgo } from '@/lib/utils'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { AreaChart, BarChart } from '@/components/shared/Charts'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Stagger, StaggerItem } from '@/components/shared/Reveal'
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const STAT_ICONS = { users: Users, revenue: DollarSign, tasks: Activity, response: Gauge }
const FORMATS = { currency: (n) => formatCurrency(n), number: formatNumber }

/**
 * DEMO DASHBOARD — showcases the design system with clearly labeled mock data.
 * Replace with the real product screens on hackathon day.
 */
export default function DashboardPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [range, setRange] = useState('12m')
  const { data, isLoading, error, refetch } = useAsync(() => dashboardService.getOverview().then((r) => r.data), [])

  const trend = data ? (range === '6m' ? data.trend.slice(-6) : data.trend) : []

  const activityColumns = [
    {
      key: 'user',
      header: 'Member',
      sortable: true,
      render: (r) => (
        <span className="flex items-center gap-2.5">
          <Avatar name={r.user} size="sm" />
          <span className="font-medium">{r.user}</span>
        </span>
      ),
    },
    { key: 'action', header: 'Action', sortable: true },
    { key: 'target', header: 'Target', hideOnMobile: true, render: (r) => <span className="font-mono text-[12.5px] text-muted-foreground">{r.target}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'at', header: 'When', sortable: true, align: 'right', render: (r) => <span className="text-muted-foreground tabular">{timeAgo(r.at)}</span> },
  ]

  const quickActions = [
    { label: 'New item', icon: FilePlus2, onClick: () => navigate('/items?new=1') },
    { label: 'Import data', icon: Upload, onClick: () => toast.info('Import', { description: 'Wire this to your upload endpoint.' }) },
    { label: 'Export report', icon: Download, onClick: () => toast.success('Report exported', { description: 'demo-report.csv (mock)' }) },
    { label: 'Share workspace', icon: Share2, onClick: () => toast('Invite link copied (mock)') },
  ]

  return (
    <>
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2">
            Overview <Badge variant="warning" className="font-mono text-[10px] uppercase">Mock data</Badge>
          </span>
        }
        title="Good to see you, team"
        description="A demonstration of the design system. Every widget here is a reusable component fed by a service that can switch from mock data to the real API."
        actions={
          <>
            <Button variant="outline" leftIcon={<Download />} onClick={() => toast.success('Exported (mock)')}>
              Export
            </Button>
            <Button leftIcon={<Plus />} onClick={() => navigate('/items?new=1')}>
              New item
            </Button>
          </>
        }
      />

      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading || !data ? (
        <div className="grid grid-cols-1 gap-6">
          <LoadingSkeleton variant="cards" />
          <LoadingSkeleton variant="detail" />
        </div>
      ) : (
        <Stagger className="grid grid-cols-1 gap-6">
          {/* KPI row */}
          <StaggerItem className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.stats.map((s) => (
              <StatCard
                key={s.key}
                label={s.label}
                value={s.value}
                delta={s.delta}
                hint={s.hint}
                spark={s.spark}
                invertTrend={s.invertTrend}
                icon={STAT_ICONS[s.key]}
                format={FORMATS[s.format] ?? formatNumber}
              />
            ))}
          </StaggerItem>

          {/* Chart + side panel */}
          <StaggerItem className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader
                action={
                  <Tabs value={range} onValueChange={setRange} variant="pill">
                    <TabsList>
                      <TabsTrigger value="6m">6M</TabsTrigger>
                      <TabsTrigger value="12m">12M</TabsTrigger>
                    </TabsList>
                  </Tabs>
                }
              >
                <CardTitle>Revenue trend</CardTitle>
                <CardDescription>Current period vs previous period</CardDescription>
              </CardHeader>
              <CardContent>
                <AreaChart height={280}
                  key={range}
                  data={trend}
                  format={(n) => formatCurrency(n)}
                  series={[
                    { key: 'current', label: 'This year', color: 'var(--chart-1)' },
                    { key: 'previous', label: 'Last year', color: 'var(--chart-2)', dashed: true },
                  ]}
                />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick actions</CardTitle>
                  <CardDescription>Common shortcuts</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  {quickActions.map((a) => (
                    <Button key={a.label} variant="outline" className="h-auto flex-col items-start gap-2 p-3 text-left" onClick={a.onClick}>
                      <a.icon className="size-4 text-primary" />
                      <span className="text-[13px]">{a.label}</span>
                    </Button>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>This week</CardTitle>
                  <CardDescription>Tasks completed per day</CardDescription>
                </CardHeader>
                <CardContent className="pt-8">
                  <BarChart data={data.weekly} height={110} />
                </CardContent>
              </Card>
            </div>
          </StaggerItem>

          {/* Activity table */}
          <StaggerItem>
            <Card>
              <CardHeader
                action={
                  <Button variant="ghost" size="sm" rightIcon={<ArrowRight />} onClick={() => navigate('/items')}>
                    View all
                  </Button>
                }
              >
                <CardTitle>Recent activity</CardTitle>
                <CardDescription>Latest events across the workspace</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable columns={activityColumns} data={data.activity} defaultSort={{ key: 'at', dir: 'desc' }} />
              </CardContent>
            </Card>
          </StaggerItem>
        </Stagger>
      )}
    </>
  )
}
