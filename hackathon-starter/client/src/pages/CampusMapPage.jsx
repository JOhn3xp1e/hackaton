import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { CircleAlert, Eye, EyeOff, MapPin, Maximize2, Pencil, Plus, QrCode, RotateCw, SearchX, SquarePen, Sun, Sunrise, Sunset, Trash2 } from 'lucide-react'
import { CampusMap } from '@/components/campus/CampusMap'
import { LocationFormModal } from '@/components/locations/LocationFormModal'
import { downloadQr, reportUrlFor } from '@/components/locations/QrImage'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useAuth } from '@/providers/AuthProvider'
import { LEVELS, ROOM_TYPES, levelLabel } from '@/data/campusLayout'
import { locationsService } from '@/services/locationsService'
import { useCampusRooms } from '@/hooks/useCampusRooms'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { PageHeader } from '@/components/shared/PageHeader'
import { SearchBar } from '@/components/shared/SearchBar'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip } from '@/components/ui/tooltip'

const LIGHTS = [
  ['noon', 'Noon', Sun],
  ['golden', 'Golden hour', Sunrise],
  ['dusk', 'Dusk', Sunset],
]

export default function CampusMapPage() {
  const toast = useToast()
  const { isAdmin } = useAuth()
  const mapRef = useRef(null)
  const [form, setForm] = useState({ open: false, location: null }) // create (location null) or edit
  const [deleting, setDeleting] = useState(null) // { location, equipment } while the confirm dialog is open
  const [checkingDelete, setCheckingDelete] = useState(false)
  const [focusId, setFocusId] = useState(null) // fly to a room once it exists on the map (after create / edit)
  const [status, setStatus] = useState('loading') // 3D scene: loading | ready | error
  const [sceneError, setSceneError] = useState(null)
  const [mapKey, setMapKey] = useState(0)
  const [level, setLevel] = useState(null)
  const [xray, setXray] = useState(true)
  const [spin, setSpin] = useState(false)
  const [light, setLight] = useState('noon')
  const [selectedId, setSelectedId] = useState(null)
  const [query, setQuery] = useState('')
  const debounced = useDebounce(query, 150)

  const { rooms, unplaced, urgentRooms, locations } = useCampusRooms({ channel: 'campus-map' })

  useEffect(() => {
    if (locations.error) toast.error('Could not load rooms', { description: locations.error.message })
  }, [locations.error, toast])

  const listed = useMemo(() => {
    const q = debounced.trim().toLowerCase()
    const matches = (r) =>
      !q ||
      [r.name, r.code, r.building, r.floor, ROOM_TYPES[r.type]?.label].some((v) => v?.toLowerCase().includes(q))
    return [
      ...rooms.filter((r) => (level === null || r.level === level) && matches(r)),
      ...(level === null ? unplaced.filter(matches).map((r) => ({ ...r, unplaced: true })) : []),
    ]
  }, [rooms, unplaced, level, debounced])

  const changeLevel = (l) => {
    setLevel(l)
    mapRef.current?.setFloor(l)
  }

  const toggleXray = () => {
    mapRef.current?.setXray(!xray)
    setXray(!xray)
  }

  const toggleSpin = () => {
    mapRef.current?.setAutoRotate(!spin)
    setSpin(!spin)
  }

  const changeLight = (preset) => {
    setLight(preset)
    mapRef.current?.setLight(preset)
  }

  const highlight = (id) => mapRef.current?.setHighlight(id)

  const selectRoom = (room) => {
    setSelectedId(room?.id ?? null)
    highlight(room?.id ?? null)
    if (!room || room.unplaced) return
    // Make sure the room is actually visible before flying to it.
    if (!xray) toggleXray()
    if (level !== null && level !== room.level) changeLevel(room.level)
    mapRef.current?.focusRoom(room.id)
  }

  // Child effects (CampusMap's setRooms) run before this one, so the new room's mesh exists here.
  useEffect(() => {
    if (!focusId) return
    const room = rooms.find((r) => r.id === focusId)
    if (room) selectRoom(room)
    setFocusId(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms, focusId])

  const onSaved = (saved, isNew) => {
    locations.setData((list) => (isNew ? [...(list ?? []), saved] : (list ?? []).map((l) => (l.id === saved.id ? saved : l))))
    toast.success(isNew ? 'Location added' : 'Location saved', { description: `${saved.name} · ${saved.code}` })
    setQuery('')
    if (level !== null) changeLevel(null)
    setFocusId(saved.id)
  }

  const askDelete = async (location) => {
    setCheckingDelete(true)
    try {
      const usage = await locationsService.usage(location.id)
      if (usage.tickets > 0) {
        toast.error(`Can't delete ${location.name}`, {
          description: `It has ${usage.tickets} ${usage.tickets === 1 ? 'ticket' : 'tickets'} on record. Tickets keep their room, so the room has to stay.`,
        })
        return
      }
      setDeleting({ location, equipment: usage.equipment })
    } catch (err) {
      toast.error('Could not check this location', { description: err.message })
    } finally {
      setCheckingDelete(false)
    }
  }

  const confirmDelete = async () => {
    const { location } = deleting
    try {
      await locationsService.remove(location.id)
      locations.setData((list) => (list ?? []).filter((l) => l.id !== location.id))
      if (selectedId === location.id) selectRoom(null)
      toast.success('Location deleted', { description: `${location.name} · ${location.code}` })
    } catch (err) {
      toast.error(`Could not delete ${location.name}`, { description: err.message })
    }
  }

  const retryScene = () => {
    setSceneError(null)
    setStatus('loading')
    setMapKey((k) => k + 1)
  }

  // After a (re)mount the scene starts with defaults; push the current UI state into it.
  const onReady = () => {
    setStatus('ready')
    const map = mapRef.current
    map?.setFloor(level)
    map?.setXray(xray)
    map?.setAutoRotate(spin)
    map?.setLight(light)
    map?.setHighlight(selectedId)
  }

  const selected = rooms.find((r) => r.id === selectedId) ?? unplaced.find((r) => r.id === selectedId)
  const loadingRooms = locations.isLoading && !locations.data?.length

  return (
    <>
      <PageHeader
        breadcrumbs
        eyebrow="Academic Center"
        title="Campus Map"
        description="Explore the building in 3D. Hover or tap a room to see it; drag to orbit, scroll or pinch to zoom, right-drag to pan."
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<Maximize2 />} onClick={() => mapRef.current?.resetView()} disabled={status !== 'ready'}>
              Reset view
            </Button>
            {isAdmin && (
              <Button size="sm" leftIcon={<Plus />} onClick={() => setForm({ open: true, location: null })}>
                Add location
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="relative h-[62vh] min-h-[420px] overflow-hidden">
          {status === 'error' ? (
            <ErrorState
              className="m-4 h-[calc(100%-2rem)]"
              title="The 3D map couldn't start"
              description={`${sceneError?.message ?? 'WebGL is not available.'} Try another browser, or enable hardware acceleration.`}
              onRetry={retryScene}
            />
          ) : (
            <>
              <CampusMap
                key={mapKey}
                ref={mapRef}
                rooms={rooms}
                className="size-full"
                onSelect={(room) => {
                  setSelectedId(room?.id ?? null)
                  highlight(room?.id ?? null)
                }}
                onReady={onReady}
                onError={(e) => {
                  setSceneError(e)
                  setStatus('error')
                }}
              />

              {status === 'loading' && (
                <div className="absolute inset-0 grid place-items-center bg-card">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Spinner />
                    <span className="text-sm">Building the campus…</span>
                  </div>
                </div>
              )}

              {status === 'ready' && loadingRooms && (
                <p className="absolute left-1/2 top-16 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-1 text-[12px] text-muted-foreground shadow-sm">
                  <Spinner /> Loading rooms…
                </p>
              )}

              {/* Level filter */}
              <div className="absolute left-3 top-3 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-1 rounded-lg border border-border bg-card/90 p-1 shadow-sm backdrop-blur-sm">
                <LevelButton active={level === null} onClick={() => changeLevel(null)}>All</LevelButton>
                {LEVELS.map((l) => (
                  <LevelButton key={l} active={level === l} onClick={() => changeLevel(l)} title={levelLabel(l)}>
                    {l === 1 ? 'G' : l}
                  </LevelButton>
                ))}
              </div>

              {/* View controls */}
              <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg border border-border bg-card/90 p-1 shadow-sm backdrop-blur-sm">
                <Tooltip content={xray ? 'Show solid walls (hides rooms)' : 'See through walls'} side="top">
                  <Button variant="ghost" size="icon-sm" aria-pressed={xray} aria-label="See-through walls" onClick={toggleXray}>
                    {xray ? <Eye /> : <EyeOff />}
                  </Button>
                </Tooltip>
                <Tooltip content={spin ? 'Stop rotating' : 'Auto-rotate'} side="top">
                  <Button variant="ghost" size="icon-sm" aria-pressed={spin} aria-label="Auto-rotate" onClick={toggleSpin} className={cn(spin && 'text-primary')}>
                    <RotateCw className={cn(spin && 'animate-spin [animation-duration:3s]')} />
                  </Button>
                </Tooltip>
                <span className="mx-0.5 h-5 w-px bg-border" aria-hidden />
                {LIGHTS.map(([value, label, Icon]) => (
                  <Tooltip key={value} content={label} side="top">
                    <Button variant="ghost" size="icon-sm" aria-pressed={light === value} aria-label={label} onClick={() => changeLight(value)} className={cn(light === value && 'bg-accent text-foreground')}>
                      <Icon />
                    </Button>
                  </Tooltip>
                ))}
              </div>

              {/* Legend */}
              <div className="absolute bottom-3 left-3 hidden max-w-[55%] flex-wrap gap-x-3 gap-y-1 rounded-lg border border-border bg-card/90 px-3 py-2 text-[12px] shadow-sm backdrop-blur-sm md:flex">
                {Object.entries(ROOM_TYPES).map(([key, t]) => (
                  <span key={key} className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ background: t.color }} aria-hidden />
                    {t.label}
                  </span>
                ))}
              </div>

              {!xray && status === 'ready' && (
                <p className="absolute left-1/2 top-16 -translate-x-1/2 rounded-full border border-border bg-card/90 px-3 py-1 text-[12px] text-muted-foreground shadow-sm">
                  Rooms are hidden behind solid walls. Turn on <Eye className="inline size-3.5 align-[-2px]" /> to see them.
                </p>
              )}
            </>
          )}
        </Card>

        {/* Room directory */}
        <Card className="flex max-h-[62vh] min-h-[420px] flex-col overflow-hidden">
          <div className="grid gap-3 border-b border-border p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-[15px] font-semibold">Rooms</h2>
              {!loadingRooms && !locations.error && (
                <span className="text-[12px] text-muted-foreground">
                  {rooms.length} on map{unplaced.length > 0 && ` · ${unplaced.length} not placed`}
                  {urgentRooms.length > 0 && <span className="font-medium text-red-600"> · {urgentRooms.length} urgent</span>}
                </span>
              )}
            </div>
            <SearchBar value={query} onChange={setQuery} placeholder="Search rooms, codes, buildings…" />
            <p className="text-[11.5px] leading-snug text-muted-foreground">Positions in the building are placeholders until rooms get real map coordinates.</p>
          </div>

          {selected && (
            <div className="grid gap-2 border-b border-border bg-accent/40 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="grid min-w-0 gap-0.5">
                  <p className="eyebrow">Selected</p>
                  <p className="text-sm font-semibold">{selected.name}</p>
                  <p className="text-[12.5px] text-muted-foreground">
                    {[selected.code, selected.building, selected.floor, ROOM_TYPES[selected.type]?.label].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <button className="text-[12px] text-muted-foreground hover:text-foreground" onClick={() => selectRoom(null)}>
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" asChild>
                  <Link to={`/r/${selected.code}`}>
                    <SquarePen /> Report an issue
                  </Link>
                </Button>
                <Tooltip content="Download room QR code" side="top">
                  <Button
                    size="icon-sm"
                    variant="outline"
                    aria-label={`Download QR code for ${selected.name}`}
                    onClick={() =>
                      downloadQr(reportUrlFor(selected.code), `campusfix-qr-${selected.code}.png`).catch((err) =>
                        toast.error('Could not create the QR image', { description: err.message }),
                      )
                    }
                  >
                    <QrCode />
                  </Button>
                </Tooltip>
                {isAdmin && (
                  <>
                    <Tooltip content="Edit location" side="top">
                      <Button size="icon-sm" variant="outline" aria-label={`Edit ${selected.name}`} onClick={() => setForm({ open: true, location: selected })}>
                        <Pencil />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Delete location" side="top">
                      <Button
                        size="icon-sm"
                        variant="outline"
                        aria-label={`Delete ${selected.name}`}
                        className="text-destructive hover:text-destructive"
                        loading={checkingDelete}
                        onClick={() => askDelete(selected)}
                      >
                        {!checkingDelete && <Trash2 />}
                      </Button>
                    </Tooltip>
                  </>
                )}
                {selected.open > 0 && <Badge variant="warning">{selected.open} open</Badge>}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
            {loadingRooms ? (
              <div className="grid gap-2 p-2">
                {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-10" />)}
              </div>
            ) : locations.error ? (
              <ErrorState compact className="m-2" title="Could not load rooms" error={locations.error} onRetry={locations.refetch} />
            ) : !locations.data?.length ? (
              <EmptyState
                compact
                icon={MapPin}
                className="m-2"
                title="No rooms yet"
                description={isAdmin ? 'Add the first room to put it on the map.' : 'An admin needs to add rooms before they show up here.'}
                action={
                  isAdmin && (
                    <Button size="sm" leftIcon={<Plus />} onClick={() => setForm({ open: true, location: null })}>
                      Add location
                    </Button>
                  )
                }
              />
            ) : listed.length === 0 ? (
              <EmptyState
                compact
                icon={SearchX}
                className="m-2"
                title="No rooms found"
                description={query ? `Nothing matches “${query}”${level !== null ? ` on ${levelLabel(level).toLowerCase()}` : ''}.` : `Nothing is placed on ${levelLabel(level).toLowerCase()}.`}
                action={query && <Button variant="outline" size="sm" onClick={() => setQuery('')}>Clear search</Button>}
              />
            ) : (
              <ul className="grid gap-0.5">
                {listed.map((room) => (
                  <li key={room.id}>
                    <button
                      onClick={() => selectRoom(room)}
                      onMouseEnter={() => highlight(room.id)}
                      onMouseLeave={() => highlight(selectedId)}
                      onFocus={() => highlight(room.id)}
                      onBlur={() => highlight(selectedId)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent/70',
                        room.id === selectedId && 'bg-accent',
                      )}
                    >
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: ROOM_TYPES[room.type]?.color }} aria-hidden />
                      <span className="grid min-w-0 flex-1">
                        <span className="truncate text-sm font-medium">{room.name}</span>
                        <span className="truncate text-[12px] text-muted-foreground">
                          {room.unplaced ? 'Not on map' : levelLabel(room.level)} · {room.code}
                        </span>
                      </span>
                      {room.urgent > 0 ? (
                        <span
                          className={cn(
                            'grid size-5 shrink-0 place-items-center rounded-full text-[12px] font-black text-white',
                            room.critical > 0 ? 'bg-red-600' : 'bg-orange-500',
                          )}
                          title={`${room.urgent} urgent ${room.urgent === 1 ? 'issue' : 'issues'}${room.critical ? ` (${room.critical} critical)` : ''}`}
                        >
                          !
                        </span>
                      ) : (
                        room.open > 0 && (
                          <span className="inline-flex items-center gap-1 text-[12px] font-medium text-warning" title={`${room.open} open issues`}>
                            <CircleAlert className="size-3.5" /> {room.open}
                          </span>
                        )
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      {isAdmin && (
        <>
          <LocationFormModal
            key={form.location?.id ?? 'new'}
            open={form.open}
            onOpenChange={(open) => setForm((f) => ({ ...f, open }))}
            location={form.location}
            onSaved={onSaved}
          />
          <ConfirmDialog
            open={!!deleting}
            onOpenChange={(open) => !open && setDeleting(null)}
            title={deleting ? `Delete ${deleting.location.name}?` : 'Delete location?'}
            description={
              deleting &&
              `${deleting.location.code} will be removed from the map and its QR code will stop working.` +
                (deleting.equipment > 0
                  ? ` Its ${deleting.equipment} equipment ${deleting.equipment === 1 ? 'item' : 'items'} will be deleted too.`
                  : '') +
                ' This cannot be undone.'
            }
            confirmLabel="Delete location"
            onConfirm={confirmDelete}
          />
        </>
      )}
    </>
  )
}

function LevelButton({ active, className, ...props }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'h-7 min-w-8 rounded-md px-2 text-[13px] font-medium transition-colors',
        active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
        className,
      )}
      {...props}
    />
  )
}
