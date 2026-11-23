import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { FilterX } from 'lucide-react'
import { useAsync } from '@/hooks/useAsync'
import { useDebounce } from '@/hooks/useDebounce'
import { useLiveTickets } from '@/hooks/useLiveTickets'
import { CATEGORIES, CATEGORY_KEYS, SEVERITIES, SEVERITY_KEYS, STATUS_KEYS, STATUSES, VALIDITY, VALIDITY_KEYS } from '@/lib/constants'
import { equipmentService } from '@/services/equipmentService'
import { locationsService } from '@/services/locationsService'
import { ticketsService } from '@/services/ticketsService'
import { PageHeader } from '@/components/shared/PageHeader'
import { SearchBar } from '@/components/shared/SearchBar'
import { TicketsTable } from '@/components/tickets/TicketsTable'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

const FILTERS = ['status', 'severity', 'category', 'location', 'equipment', 'validity']

export default function TicketsPage() {
  const [params, setParams] = useSearchParams()
  const search = params.get('search') ?? ''
  const debounced = useDebounce(search, 300)
  const filters = Object.fromEntries(FILTERS.map((k) => [k, params.get(k) ?? '']))

  const setParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const locations = useAsync(() => locationsService.list(), [], { initialData: [] })
  const equipment = useAsync(() => equipmentService.list(), [], { initialData: [] })
  const { data, isLoading, error, refetch } = useAsync(
    () =>
      ticketsService.list({
        status: filters.status,
        severity: filters.severity,
        category: filters.category,
        locationId: filters.location,
        equipmentId: filters.equipment,
        validity: filters.validity,
        search: debounced,
      }),
    [filters.status, filters.severity, filters.category, filters.location, filters.equipment, filters.validity, debounced],
    { initialData: [] },
  )
  useLiveTickets(refetch, { channel: 'tickets-page' })

  const hasFilters = FILTERS.some((k) => filters[k]) || search
  const locationOptions = useMemo(
    () => (locations.data ?? []).map((l) => ({ value: l.id, label: `${l.name} (${l.code})` })),
    [locations.data],
  )
  // Narrowed to the chosen location so the list stays short.
  const equipmentOptions = useMemo(
    () =>
      (equipment.data ?? [])
        .filter((e) => !filters.location || e.location_id === filters.location)
        .map((e) => ({ value: e.id, label: `${e.short_code} · ${e.name}` })),
    [equipment.data, filters.location],
  )

  // Picking a location clears a selected item that isn't in it.
  const setLocation = (value) => {
    const next = new URLSearchParams(params)
    if (value) next.set('location', value)
    else next.delete('location')
    const item = (equipment.data ?? []).find((e) => e.id === filters.equipment)
    if (value && item && item.location_id !== value) next.delete('equipment')
    setParams(next, { replace: true })
  }

  return (
    <>
      <PageHeader
        breadcrumbs
        title="All tickets"
        description="Every reported issue across campus. Click a row to update its status or review it for credits."
      />

      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1.3fr_repeat(6,1fr)_auto]">
        <SearchBar value={search} onChange={(v) => setParam('search', v)} placeholder="Title, ticket # or asset…" />
        <Select
          aria-label="Filter by status"
          value={filters.status}
          onChange={(e) => setParam('status', e.target.value)}
          options={[{ value: '', label: 'All statuses' }, ...STATUS_KEYS.map((k) => ({ value: k, label: STATUSES[k].label }))]}
        />
        <Select
          aria-label="Filter by severity"
          value={filters.severity}
          onChange={(e) => setParam('severity', e.target.value)}
          options={[{ value: '', label: 'All severities' }, ...SEVERITY_KEYS.map((k) => ({ value: k, label: SEVERITIES[k].label }))]}
        />
        <Select
          aria-label="Filter by category"
          value={filters.category}
          onChange={(e) => setParam('category', e.target.value)}
          options={[{ value: '', label: 'All categories' }, ...CATEGORY_KEYS.map((k) => ({ value: k, label: CATEGORIES[k].short }))]}
        />
        <Select
          aria-label="Filter by location"
          value={filters.location}
          onChange={(e) => setLocation(e.target.value)}
          options={[{ value: '', label: locations.isLoading ? 'Loading…' : 'All locations' }, ...locationOptions]}
        />
        <Select
          aria-label="Filter by equipment"
          value={filters.equipment}
          onChange={(e) => setParam('equipment', e.target.value)}
          options={[{ value: '', label: equipment.isLoading ? 'Loading…' : 'All equipment' }, ...equipmentOptions]}
        />
        <Select
          aria-label="Filter by review"
          value={filters.validity}
          onChange={(e) => setParam('validity', e.target.value)}
          options={[{ value: '', label: 'Any review' }, ...VALIDITY_KEYS.map((k) => ({ value: k, label: VALIDITY[k].label }))]}
        />
        <Button variant="ghost" onClick={() => setParams({}, { replace: true })} disabled={!hasFilters} leftIcon={<FilterX />}>
          Clear
        </Button>
      </div>

      <p className="mb-2 font-mono text-[12px] text-muted-foreground">
        {isLoading ? 'Loading…' : `${data?.length ?? 0} ticket${data?.length === 1 ? '' : 's'}`}
      </p>
      <TicketsTable tickets={data} isLoading={isLoading} error={error} onRetry={refetch} />
    </>
  )
}
