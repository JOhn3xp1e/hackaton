import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import { Coins, Crown, Medal, Search, SquarePen, Trophy } from 'lucide-react'
import { useAsync } from '@/hooks/useAsync'
import { useToast } from '@/components/ui/toast'
import { CREDITS, STUDENT_NO_PATTERN } from '@/lib/constants'
import { maskStudentNo, useStudentIdentity } from '@/lib/studentIdentity'
import { cn } from '@/lib/utils'
import { analyticsService } from '@/services/analyticsService'
import { ticketsService } from '@/services/ticketsService'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'

const PODIUM = [
  { place: 2, height: 'h-24', tone: 'bg-muted text-foreground', icon: Medal },
  { place: 1, height: 'h-32', tone: 'bg-warning/15 text-warning', icon: Crown },
  { place: 3, height: 'h-20', tone: 'bg-muted text-foreground', icon: Medal },
]

const nameOf = (row) => row.display_name || 'Anonymous student'

/** Look up any student's credits by number (pre-filled with the saved one). */
function MyCredits({ rows }) {
  const toast = useToast()
  const [identity, saveIdentity] = useStudentIdentity()
  const [value, setValue] = useState(identity.studentNo)
  const [result, setResult] = useState(null) // { row | null, rank }
  const [loading, setLoading] = useState(false)

  const lookup = async (no) => {
    const studentNo = no.trim().toUpperCase()
    if (!STUDENT_NO_PATTERN.test(studentNo)) {
      toast.warning('Enter a valid student number', { description: 'e.g. 2000XXXXXX' })
      return
    }
    setLoading(true)
    try {
      const row = await analyticsService.creditsFor(studentNo)
      const rank = rows.findIndex((r) => r.student_no === studentNo) + 1
      setResult({ studentNo, row, rank })
      saveIdentity({ ...identity, studentNo })
    } catch (err) {
      toast.error('Could not look up credits', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (identity.studentNo && rows.length) lookup(identity.studentNo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows.length])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student credits</CardTitle>
        <CardDescription>
          +{CREDITS.valid} per valid report, +{CREDITS.resolvedBonus} more when it&apos;s fixed.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 pt-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            lookup(value)
          }}
          className="flex gap-2"
        >
          <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="2000XXXXXX" className="font-mono uppercase" />
          <Button type="submit" variant="outline" loading={loading} leftIcon={<Search />}>
            Check
          </Button>
        </form>
        {result && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-border bg-muted/40 p-4">
            {result.row ? (
              <div className="grid gap-3">
                <div className="flex items-end justify-between gap-3">
                  <div className="grid gap-0.5">
                    <span className="font-mono text-[12px] text-muted-foreground">{result.studentNo}</span>
                    <span className="flex items-center gap-1.5 font-display text-3xl font-semibold">
                      <Coins className="size-6 text-warning" /> {result.row.credits}
                    </span>
                  </div>
                  {result.rank > 0 && <span className="font-display text-lg font-semibold text-muted-foreground">#{result.rank}</span>}
                </div>
                <p className="text-[13px] text-muted-foreground">
                  {result.row.valid_reports} valid of {result.row.reports} report{result.row.reports === 1 ? '' : 's'}.{' '}
                  <Link to="/reports?mine=1" className="font-medium text-primary hover:underline">
                    See their reports
                  </Link>
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No reports yet for <span className="font-mono">{result.studentNo}</span>.{' '}
                <Link to="/" className="font-medium text-primary hover:underline">
                  Report an issue
                </Link>{' '}
                to start earning credits.
              </p>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}

export default function LeaderboardPage() {
  const { data, isLoading, error, refetch } = useAsync(() => analyticsService.leaderboard(50), [], { initialData: [] })

  // Credits change when staff review or resolve tickets.
  useEffect(() => ticketsService.subscribe(() => refetch(), { channel: 'leaderboard' }), [refetch])

  const rows = (data ?? []).filter((r) => r.credits > 0)
  const top = rows.slice(0, 3)

  return (
    <>
      <PageHeader
        eyebrow="Campus heroes"
        title="Leaderboard"
        description="Students who help keep campus working. Credits come from reports that staff confirm as valid."
        actions={
          <Button asChild>
            <Link to="/">
              <SquarePen /> Report an issue
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="grid gap-6">
          {isLoading && !data?.length ? (
            <LoadingSkeleton variant="table" rows={6} />
          ) : error ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : !rows.length ? (
            <EmptyState
              icon={Trophy}
              title="No credits awarded yet"
              description="When staff confirm a student's report as valid, they appear here."
            />
          ) : (
            <>
              {top.length === 3 && (
                <div className="grid grid-cols-3 items-end gap-3">
                  {PODIUM.map(({ place, height, tone, icon: Icon }, i) => {
                    const row = top[place - 1]
                    return (
                      <motion.div
                        key={place}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="grid justify-items-center gap-2 text-center"
                      >
                        <Icon className={cn('size-6', place === 1 ? 'text-warning' : 'text-muted-foreground')} />
                        <span className="max-w-full truncate text-sm font-semibold">{nameOf(row)}</span>
                        <span className="font-mono text-[11px] text-muted-foreground">{maskStudentNo(row.student_no)}</span>
                        <div className={cn('grid w-full place-items-center rounded-t-lg border border-b-0 border-border', height, tone)}>
                          <span className="grid gap-0.5">
                            <span className="font-display text-2xl font-semibold">{row.credits}</span>
                            <span className="text-[11px] opacity-80">credits</span>
                          </span>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}

              <Card>
                <CardContent className="p-0">
                  <ol className="divide-y divide-border">
                    {rows.map((row, i) => (
                      <li key={row.student_no} className="flex items-center gap-4 px-5 py-3">
                        <span
                          className={cn(
                            'grid size-8 shrink-0 place-items-center rounded-full font-mono text-[13px] font-semibold',
                            i === 0 ? 'bg-warning/15 text-warning' : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {i + 1}
                        </span>
                        <span className="grid min-w-0 flex-1">
                          <span className="truncate font-medium">{nameOf(row)}</span>
                          <span className="font-mono text-[11.5px] text-muted-foreground">
                            {maskStudentNo(row.student_no)} · {row.valid_reports} valid report{row.valid_reports === 1 ? '' : 's'}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-1 font-semibold tabular">
                          <Coins className="size-4 text-warning" /> {row.credits}
                        </span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <aside className="grid gap-6 lg:sticky lg:top-24">
          <MyCredits rows={rows} />
        </aside>
      </div>
    </>
  )
}
