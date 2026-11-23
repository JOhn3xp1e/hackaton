import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ClipboardList, SquarePen } from 'lucide-react'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/providers/AuthProvider'
import { STATUS_KEYS, STATUSES } from '@/lib/constants'
import { ticketsService } from '@/services/ticketsService'
import { PageHeader } from '@/components/shared/PageHeader'
import { SearchBar } from '@/components/shared/SearchBar'
import { TicketCard } from '@/components/tickets/TicketCard'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'

export default function MyReportsPage() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState('all')
  const search = params.get('search') ?? ''

  const { data, isLoading, error, refetch } = useAsync(() => ticketsService.list({ reporterId: user.id }), [user.id], {
    initialData: [],
  })

  // Live status updates on my tickets
  useEffect(
    () => ticketsService.subscribe(() => refetch(), { filter: `reporter_id=eq.${user.id}`, channel: 'my-reports' }),
    [user.id, refetch],
  )

  const tickets = useMemo(() => {
    const s = search.trim().toLowerCase()
    return (data ?? []).filter(
      (t) =>
        (tab === 'all' || t.status === tab) &&
        (!s || t.title.toLowerCase().includes(s) || t.ticket_number.toLowerCase().includes(s) || t.asset_label?.toLowerCase().includes(s)),
    )
  }, [data, tab, search])

  const counts = useMemo(() => {
    const c = { all: data?.length ?? 0 }
    for (const k of STATUS_KEYS) c[k] = (data ?? []).filter((t) => t.status === k).length
    return c
  }, [data])

  return (
    <>
      <PageHeader
        title="My reports"
        description="Everything you've reported, with live status updates from maintenance."
        actions={
          <Button asChild>
            <Link to="/report">
              <SquarePen /> Report an issue
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={setTab} variant="pill">
          <TabsList>
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
            {STATUS_KEYS.map((k) => (
              <TabsTrigger key={k} value={k}>
                {STATUSES[k].label} ({counts[k]})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <SearchBar
          value={search}
          onChange={(v) => setParams(v ? { search: v } : {}, { replace: true })}
          placeholder="Search my reports…"
          className="sm:w-64"
        />
      </div>

      {isLoading && !data?.length ? (
        <LoadingSkeleton variant="list" rows={4} />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={data?.length ? 'No reports match' : 'No reports yet'}
          description={
            data?.length
              ? 'Try a different status or search term.'
              : 'Spotted a broken PC, projector or chair? Report it and track the fix here.'
          }
          action={
            !data?.length && (
              <Button asChild>
                <Link to="/report">
                  <SquarePen /> Report your first issue
                </Link>
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {tickets.map((t) => (
            <TicketCard key={t.id} ticket={t} />
          ))}
        </div>
      )}
    </>
  )
}
