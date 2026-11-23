import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { BadgeCheck, Building2, CalendarClock, Cpu, Eye, Hash, MapPin, SearchX, Sparkles, Tag, User, Wrench } from 'lucide-react'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/providers/AuthProvider'
import { CATEGORIES, ROLES, VALIDITY } from '@/lib/constants'
import { maskStudentNo, reporterLabel } from '@/lib/studentIdentity'
import { Comments } from '@/components/tickets/Comments'
import { ReviewPanel } from '@/components/tickets/ReviewPanel'
import { Badge } from '@/components/ui/badge'
import { formatDate, timeAgo } from '@/lib/utils'
import { ticketsService } from '@/services/ticketsService'
import { PageHeader } from '@/components/shared/PageHeader'
import { SEVERITY_MAP, StatusBadge } from '@/components/shared/StatusBadge'
import { StatusProgress } from '@/components/tickets/StatusProgress'
import { Timeline } from '@/components/tickets/Timeline'
import { StaffActions } from '@/components/tickets/StaffActions'
import { DeleteTicket } from '@/components/tickets/DeleteTicket'
import { EmailReporter } from '@/components/tickets/EmailReporter'
import { PhotoGallery } from '@/components/tickets/PhotoGallery'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'

function Detail({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="grid min-w-0 gap-0.5">
        <dt className="text-[12px] text-muted-foreground">{label}</dt>
        <dd className="text-sm">{children}</dd>
      </div>
    </div>
  )
}

/**
 * One report. `/tickets/:n` is the staff workspace view; `/track/:n` is the
 * reporter's progress page (the link we email and show after submitting) and
 * always renders the public view, even for signed-in staff.
 */
export default function TicketPage({ publicView = false }) {
  const { ticketNumber } = useParams()
  const { user, isStaff, isAdmin } = useAuth()
  const signedInStaff = Boolean(user && isStaff)
  const staffView = signedInStaff && !publicView
  const [flash, setFlash] = useState(false)

  const { data: ticket, isLoading, error, refetch } = useAsync(() => ticketsService.getByNumber(ticketNumber), [ticketNumber])

  // Live: refresh when staff change the status or add a note.
  useEffect(() => {
    if (!ticket?.id) return undefined
    return ticketsService.subscribeToUpdates(ticket.id, () => {
      refetch()
      setFlash(true)
      setTimeout(() => setFlash(false), 1200)
    })
  }, [ticket?.id, refetch])

  if (isLoading && !ticket) return <LoadingSkeleton variant="detail" />
  if (error) return <ErrorState error={error} onRetry={refetch} />
  if (!ticket) {
    return (
      <EmptyState
        icon={SearchX}
        title="Ticket not found"
        description={`There is no report with number ${ticketNumber}. Check the number and try again.`}
        action={
          <Button asChild variant="outline">
            <Link to={staffView ? '/tickets' : '/'}>{staffView ? 'Back to tickets' : 'Report an issue'}</Link>
          </Button>
        }
      />
    )
  }

  const Category = CATEGORIES[ticket.category]

  return (
    <>
      <PageHeader
        breadcrumbs={[
          staffView ? { label: 'Tickets', to: '/tickets' } : { label: 'Report an issue', to: '/' },
          { label: ticket.ticket_number },
        ]}
        eyebrow={publicView ? `Your report · ${ticket.ticket_number}` : ticket.ticket_number}
        title={ticket.title}
        description={`${ticket.location?.name}${ticket.equipment ? ` · ${ticket.equipment.short_code} ${ticket.equipment.name}` : ticket.asset_label ? ` · ${ticket.asset_label}` : ''} · reported ${timeAgo(ticket.created_at)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {ticket.student_no && <StatusBadge status={ticket.validity} map={VALIDITY} />}
            <StatusBadge status={ticket.severity} map={SEVERITY_MAP} />
            <StatusBadge status={ticket.status} />
          </div>
        }
      />

      {publicView && signedInStaff && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-info/25 bg-info/8 px-4 py-3 text-sm">
          <Eye className="size-4 shrink-0 text-info" />
          <span className="flex-1">This is the progress page the reporter sees from the emailed link.</span>
          <Button asChild size="sm" variant="outline">
            <Link to={`/tickets/${ticket.ticket_number}`}>Open staff view</Link>
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="grid gap-6">
          <Card className={flash ? 'ring-2 ring-primary/30 transition-shadow' : 'transition-shadow'}>
            <CardContent className="grid gap-5 p-5">
              <StatusProgress status={ticket.status} labels />
              {ticket.status === 'resolved' && ticket.resolved_at && (
                <p className="rounded-md border border-success/25 bg-success/8 px-3 py-2 text-sm text-success">
                  Fixed {timeAgo(ticket.resolved_at)} — thanks for reporting!
                </p>
              )}
              {ticket.description ? (
                <p className="whitespace-pre-line text-sm leading-relaxed">{ticket.description}</p>
              ) : (
                <p className="text-sm italic text-muted-foreground">No extra details were provided.</p>
              )}
              {ticket.ai_summary && (
                <div className="flex items-start gap-2.5 rounded-md border border-primary/20 bg-primary/5 p-3 text-[13px]">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>
                    <span className="font-medium">AI triage:</span> {ticket.ai_summary}
                  </span>
                </div>
              )}
              <PhotoGallery urls={ticket.photo_urls} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <Timeline updates={ticket.updates ?? []} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <Comments ticket={ticket} />
            </CardContent>
          </Card>
        </div>

        <aside className="grid gap-6 lg:sticky lg:top-24">
          {staffView && ticket.student_no && <ReviewPanel ticket={ticket} onChanged={refetch} />}
          {staffView && <StaffActions ticket={ticket} onChanged={refetch} />}
          {staffView && <EmailReporter ticket={ticket} />}
          {staffView && isAdmin && <DeleteTicket ticket={ticket} />}

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <dl className="grid gap-4">
                <Detail icon={Hash} label="Ticket number">
                  <span className="font-mono">{ticket.ticket_number}</span>
                </Detail>
                <Detail icon={Tag} label="Category">
                  <span className="inline-flex items-center gap-1.5">
                    {Category?.icon && <Category.icon className="size-4" />} {Category?.label}
                  </span>
                </Detail>
                {ticket.equipment && (
                  <Detail icon={Cpu} label="Equipment">
                    <span className="font-mono text-[12.5px] font-semibold">{ticket.equipment.short_code}</span> · {ticket.equipment.name}
                    {ticket.equipment.description && (
                      <span className="block text-[12.5px] text-muted-foreground">{ticket.equipment.description}</span>
                    )}
                  </Detail>
                )}
                <Detail icon={MapPin} label="Location">
                  {ticket.location?.name} <span className="font-mono text-[12px] text-muted-foreground">({ticket.location?.code})</span>
                </Detail>
                <Detail icon={Building2} label="Building">
                  {ticket.location?.building}
                  {ticket.location?.floor && `, ${ticket.location.floor}`}
                </Detail>
                <Detail icon={User} label="Reported by">
                  {reporterLabel(ticket)}{' '}
                  {ticket.reporter ? (
                    <span className="text-muted-foreground">· {ROLES[ticket.reporter.role]}</span>
                  ) : (
                    <span className="font-mono text-[12px] text-muted-foreground">
                      · {staffView ? ticket.student_no : maskStudentNo(ticket.student_no)}
                    </span>
                  )}
                </Detail>
                {ticket.student_no && (
                  <Detail icon={BadgeCheck} label="Report review">
                    <span className="inline-flex flex-wrap items-center gap-1.5">
                      <Badge variant={VALIDITY[ticket.validity]?.variant}>{VALIDITY[ticket.validity]?.label}</Badge>
                      {ticket.validator?.full_name && <span className="text-muted-foreground">by {ticket.validator.full_name}</span>}
                    </span>
                  </Detail>
                )}
                <Detail icon={Wrench} label="Assigned to">
                  {ticket.assignee?.full_name ?? <span className="text-muted-foreground">Not assigned yet</span>}
                </Detail>
                <Detail icon={CalendarClock} label="Reported on">
                  {formatDate(ticket.created_at, { dateStyle: 'medium', timeStyle: 'short' })}
                </Detail>
              </dl>
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  )
}
