import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ClipboardList, Newspaper, SquarePen, UserRound } from 'lucide-react'
import { useAsync } from '@/hooks/useAsync'
import { useDebounce } from '@/hooks/useDebounce'
import { CATEGORIES, CATEGORY_KEYS, STATUS_KEYS, STATUSES, STUDENT_NO_PATTERN } from '@/lib/constants'
import { useStudentIdentity } from '@/lib/studentIdentity'
import { ticketsService } from '@/services/ticketsService'
import { PageHeader } from '@/components/shared/PageHeader'
import { SearchBar } from '@/components/shared/SearchBar'
import { TicketCard } from '@/components/tickets/TicketCard'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'

/** Shown on the "By student" tab until a student number is entered. */
function StudentNumberPrompt({ onSave }) {
  const [value, setValue] = useState('')
  const valid = STUDENT_NO_PATTERN.test(value.trim())
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (valid) onSave(value)
      }}
      className="mx-auto grid max-w-sm gap-3 rounded-lg border border-border bg-card p-5 text-center shadow-xs"
    >
      <UserRound className="mx-auto size-6 text-primary" />
      <div className="grid gap-1">
        <p className="font-medium">Look up a student</p>
        <p className="text-[13px] text-muted-foreground">Enter a student number to see every report they submitted.</p>
      </div>
      <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="2000XXXXXX" className="text-center font-mono uppercase" />
      <Button type="submit" disabled={!valid}>
        Show reports
      </Button>
    </form>
  )
}

export default function ReportsPage() {
  const [params, setParams] = useSearchParams()
  const [identity, saveIdentity] = useStudentIdentity()
  const mine = params.get('mine') === '1'
  const search = params.get('search') ?? ''
  const status = params.get('status') ?? ''
  const category = params.get('category') ?? ''
  const debounced = useDebounce(search, 300)

  const setParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const studentNo = mine ? identity.studentNo : ''
  const waitingForNumber = mine && !studentNo

  const { data, isLoading, error, refetch } = useAsync(
    () =>
      waitingForNumber
        ? Promise.resolve([])
        : ticketsService.list({ studentNo, status, category, search: debounced, limit: 100 }),
    [studentNo, status, category, debounced, waitingForNumber],
    { initialData: [] },
  )

  // Live: new reports and status changes appear without a refresh.
  useEffect(() => ticketsService.subscribe(() => refetch(), { channel: 'reports-feed' }), [refetch])

  const counts = useMemo(() => {
    const c = {}
    for (const k of STATUS_KEYS) c[k] = (data ?? []).filter((t) => t.status === k).length
    return c
  }, [data])

  return (
    <>
      <PageHeader
        title="Track reports"
        description="Every issue reported across campus, updated live. Comment if you've seen the same problem."
        actions={
          <Button asChild>
            <Link to="/">
              <SquarePen /> Report an issue
            </Link>
          </Button>
        }
      />

      <div className="mb-4 grid gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={mine ? 'mine' : 'all'} onValueChange={(v) => setParam('mine', v === 'mine' ? '1' : '')} variant="pill">
            <TabsList>
              <TabsTrigger value="all">
                <Newspaper /> All reports
              </TabsTrigger>
              <TabsTrigger value="mine">
                <ClipboardList /> By student
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {mine && identity.studentNo && (
            <p className="text-[13px] text-muted-foreground">
              Showing reports for <span className="font-mono font-medium text-foreground">{identity.studentNo}</span>{' '}
              <button
                type="button"
                onClick={() => saveIdentity({ ...identity, studentNo: '' })}
                className="font-medium text-primary hover:underline"
              >
                change
              </button>
            </p>
          )}
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_180px_200px]">
          <SearchBar value={search} onChange={(v) => setParam('search', v)} placeholder="Search title, ticket # or item…" />
          <Select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => setParam('status', e.target.value)}
            options={[
              { value: '', label: 'All statuses' },
              ...STATUS_KEYS.map((k) => ({ value: k, label: `${STATUSES[k].label}${data?.length && !status ? ` (${counts[k]})` : ''}` })),
            ]}
          />
          <Select
            aria-label="Filter by category"
            value={category}
            onChange={(e) => setParam('category', e.target.value)}
            options={[{ value: '', label: 'All categories' }, ...CATEGORY_KEYS.map((k) => ({ value: k, label: CATEGORIES[k].short }))]}
          />
        </div>
      </div>

      {waitingForNumber ? (
        <StudentNumberPrompt onSave={(no) => saveIdentity({ ...identity, studentNo: no })} />
      ) : isLoading && !data?.length ? (
        <LoadingSkeleton variant="list" rows={4} />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !data?.length ? (
        <EmptyState
          icon={ClipboardList}
          title={mine ? 'No reports for this student' : search || status || category ? 'No reports match' : 'No reports yet'}
          description={
            mine
              ? `Nothing found for ${identity.studentNo}. Check the number and try again.`
              : search || status || category
                ? 'Try a different search or filter.'
                : 'Be the first to report a broken computer, projector or chair.'
          }
          action={
            <Button asChild>
              <Link to="/">
                <SquarePen /> Report an issue
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data.map((t) => (
            <TicketCard key={t.id} ticket={t} mine={Boolean(identity.studentNo) && t.student_no === identity.studentNo} />
          ))}
        </div>
      )}
    </>
  )
}
