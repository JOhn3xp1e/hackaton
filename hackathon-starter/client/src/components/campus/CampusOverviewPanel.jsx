import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Box, CircleCheck } from 'lucide-react'
import { useCampusRooms } from '@/hooks/useCampusRooms'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/feedback/ErrorState'

// three.js (~140 kB gzipped) loads only when this panel renders, not with the rest of the dashboard.
const CampusMap = lazy(() => import('./CampusMap').then((m) => ({ default: m.CampusMap })))

/**
 * Dashboard panel: a static (non-interactive) render of the Academic Center with
 * "!" markers on rooms that have open high/critical tickets, plus the list of
 * those rooms. Clicking through opens the full Campus Map.
 */
export function CampusOverviewPanel({ className }) {
  const { rooms, urgentRooms, locations } = useCampusRooms({ channel: 'overview-map' })
  const [sceneError, setSceneError] = useState(null)
  const loading = locations.isLoading && !locations.data?.length

  return (
    <Card className={className}>
      <CardHeader
        action={
          <Button variant="outline" size="sm" asChild>
            <Link to="/campus-map">
              Open map <ArrowRight />
            </Link>
          </Button>
        }
      >
        <CardTitle>Campus map</CardTitle>
        <p className="text-[13px] text-muted-foreground">Rooms with urgent (high or critical) open issues are marked with “!”.</p>
      </CardHeader>

      <CardContent className="grid gap-4 pt-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <Link
          to="/campus-map"
          aria-label="Open the interactive campus map"
          className="relative block h-72 overflow-hidden rounded-lg border border-border bg-white"
        >
          {locations.error ? (
            <ErrorState compact className="h-full rounded-none border-0" title="Could not load rooms" error={locations.error} />
          ) : sceneError ? (
            <div className="grid h-full place-items-center p-6 text-center text-sm text-muted-foreground">
              <span className="grid justify-items-center gap-2">
                <Box className="size-6" strokeWidth={1.5} />
                3D preview isn’t available in this browser.
              </span>
            </div>
          ) : (
            <Suspense fallback={<Skeleton className="size-full rounded-none" />}>
              <CampusMap rooms={rooms} interactive={false} className="size-full" onError={setSceneError} />
              {loading && <Skeleton className="absolute inset-0 rounded-none opacity-60" />}
            </Suspense>
          )}
        </Link>

        <div className="grid content-start gap-2">
          <p className="eyebrow">Needs attention</p>
          {loading ? (
            Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-12" />)
          ) : urgentRooms.length === 0 ? (
            <div className="flex items-center gap-2.5 rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
              <CircleCheck className="size-4 shrink-0 text-success" />
              No rooms with urgent issues right now.
            </div>
          ) : (
            <ul className="grid gap-1.5">
              {urgentRooms.slice(0, 5).map((room) => (
                <li key={room.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
                  <span
                    className={cn(
                      'grid size-6 shrink-0 place-items-center rounded-full text-[13px] font-black text-white',
                      room.critical > 0 ? 'bg-red-600' : 'bg-orange-500',
                    )}
                    aria-hidden
                  >
                    !
                  </span>
                  <span className="grid min-w-0 flex-1">
                    <span className="truncate text-sm font-medium">{room.name}</span>
                    <span className="truncate text-[12px] text-muted-foreground">
                      {room.urgent} urgent{room.critical > 0 && ` · ${room.critical} critical`} · {room.code}
                    </span>
                  </span>
                </li>
              ))}
              {urgentRooms.length > 5 && (
                <li className="px-1 text-[12px] text-muted-foreground">+{urgentRooms.length - 5} more on the map</li>
              )}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
