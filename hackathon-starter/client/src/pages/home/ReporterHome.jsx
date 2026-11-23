import { useEffect, useMemo } from 'react'
import { Link } from 'react-router'
import { ArrowRight, ClipboardList, QrCode, SquarePen } from 'lucide-react'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/providers/AuthProvider'
import { CATEGORIES, CATEGORY_KEYS } from '@/lib/constants'
import { ticketsService } from '@/services/ticketsService'
import { PageHeader } from '@/components/shared/PageHeader'
import { TicketCard } from '@/components/tickets/TicketCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'

export default function ReporterHome() {
  const { user, profile } = useAuth()
  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  const { data, isLoading, error, refetch } = useAsync(() => ticketsService.list({ reporterId: user.id, limit: 6 }), [user.id], {
    initialData: [],
  })
  useEffect(
    () => ticketsService.subscribe(() => refetch(), { filter: `reporter_id=eq.${user.id}`, channel: 'home' }),
    [user.id, refetch],
  )

  const open = useMemo(() => (data ?? []).filter((t) => t.status !== 'resolved').length, [data])

  return (
    <>
      <PageHeader
        eyebrow="CampusFix"
        title={`Hi ${firstName}, spotted something broken?`}
        description="Report broken computers, projectors, furniture, lights or Wi-Fi in under a minute. We'll keep you posted until it's fixed."
      />

      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <Card className="relative overflow-hidden p-6">
          <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-primary/10 blur-2xl" />
          <div className="relative grid gap-4">
            <span className="grid size-11 place-items-center rounded-lg bg-primary text-primary-foreground">
              <SquarePen className="size-5" />
            </span>
            <div className="grid gap-1">
              <h2 className="font-display text-lg font-semibold">Report an issue</h2>
              <p className="text-sm text-muted-foreground">Pick the room, describe the problem, add a photo — done.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_KEYS.slice(0, 5).map((k) => {
                const { short, icon: Icon } = CATEGORIES[k]
                return (
                  <span key={k} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-[12px] text-muted-foreground">
                    <Icon className="size-3.5" /> {short}
                  </span>
                )
              })}
            </div>
            <Button asChild size="lg" className="w-fit">
              <Link to="/report">
                Start a report <ArrowRight />
              </Link>
            </Button>
          </div>
        </Card>

        <Card className="grid content-between gap-4 p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-border bg-background">
              <QrCode className="size-5" />
            </span>
            <div className="grid gap-1">
              <h2 className="font-display text-base font-semibold">Even faster: scan the room QR</h2>
              <p className="text-sm text-muted-foreground">
                Every classroom and lab has a CampusFix QR sticker. Scanning it opens the report form with the room already filled in.
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
            You have <span className="font-semibold">{open}</span> open {open === 1 ? 'report' : 'reports'}.
          </div>
        </Card>
      </div>

      <section className="mt-8 grid gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">Your recent reports</h2>
          <Button asChild variant="link">
            <Link to="/my-reports">
              View all <ArrowRight />
            </Link>
          </Button>
        </div>
        {isLoading && !data?.length ? (
          <LoadingSkeleton variant="list" rows={3} />
        ) : error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : !data?.length ? (
          <EmptyState
            compact
            icon={ClipboardList}
            title="No reports yet"
            description="When you report an issue it will show up here with live status updates."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {data.map((t) => (
              <TicketCard key={t.id} ticket={t} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
