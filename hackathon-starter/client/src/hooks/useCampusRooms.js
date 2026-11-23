import { useCallback, useMemo } from 'react'
import { useAsync } from '@/hooks/useAsync'
import { useLiveTickets } from '@/hooks/useLiveTickets'
import { placeLocations } from '@/data/campusLayout'
import { locationsService } from '@/services/locationsService'
import { analyticsService } from '@/services/analyticsService'

/**
 * Locations from Supabase, placed into the 3D Academic Center, with open and
 * urgent (high/critical) ticket counts. Ticket counts refresh live.
 *
 *   const { rooms, unplaced, locations, urgentRooms } = useCampusRooms({ channel: 'campus-map' })
 *
 * `locations` is the useAsync result for the rows (isLoading, error, refetch, setData).
 * Count failures are non-fatal: the map still works without them (see `countsError`).
 */
export function useCampusRooms({ channel = 'campus-rooms' } = {}) {
  const locations = useAsync(() => locationsService.list(), [], { initialData: [] })
  const stats = useAsync(() => analyticsService.byLocation(), [], { initialData: [] })
  const urgent = useAsync(() => locationsService.urgentByLocation(), [], { initialData: {} })

  const refetchCounts = useCallback(() => {
    stats.refetch()
    urgent.refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useLiveTickets(refetchCounts, { notify: false, channel })

  const { rooms, unplaced } = useMemo(() => {
    const counts = {}
    for (const s of stats.data ?? []) counts[s.location_id] = { open: s.open }
    for (const [id, u] of Object.entries(urgent.data ?? {})) counts[id] = { ...counts[id], ...u }
    return placeLocations(locations.data ?? [], counts)
  }, [locations.data, stats.data, urgent.data])

  const urgentRooms = useMemo(
    () => [...rooms, ...unplaced].filter((r) => r.urgent > 0).sort((a, b) => b.critical - a.critical || b.urgent - a.urgent),
    [rooms, unplaced],
  )

  return { rooms, unplaced, urgentRooms, locations, countsError: stats.error || urgent.error }
}
