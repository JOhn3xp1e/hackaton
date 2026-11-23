import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Cpu, Download, ExternalLink, MapPin, Monitor, Plus, Printer } from 'lucide-react'
import { z } from 'zod'
import { useAsync } from '@/hooks/useAsync'
import { useForm } from '@/hooks/useForm'
import { useToast } from '@/components/ui/toast'
import { LOCATION_TYPES } from '@/lib/constants'
import { locationsService } from '@/services/locationsService'
import { analyticsService } from '@/services/analyticsService'
import { equipmentService } from '@/services/equipmentService'
import { PageHeader } from '@/components/shared/PageHeader'
import { SearchBar } from '@/components/shared/SearchBar'
import { FormContainer } from '@/components/shared/FormContainer'
import { QrImage, downloadQr, reportUrlFor } from '@/components/locations/QrImage'
import { EquipmentManager } from '@/components/locations/EquipmentManager'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'

const locationSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{2,32}$/, 'Use 2–32 letters, numbers or dashes (e.g. CL-LAB-3)'),
  name: z.string().trim().min(2, 'Enter a name').max(120),
  building: z.string().trim().max(120),
  floor: z.string().trim().max(20),
  type: z.enum(Object.keys(LOCATION_TYPES)),
})

const EMPTY = { code: '', name: '', building: '', floor: '', type: 'classroom' }

function AddLocationModal({ open, onOpenChange, onCreated }) {
  const toast = useToast()
  const form = useForm({
    schema: locationSchema,
    initialValues: EMPTY,
    onSubmit: async (values) => {
      const created = await locationsService.create(values)
      toast.success('Location added', { description: `${created.name} · QR code ready to print.` })
      form.reset()
      onOpenChange(false)
      onCreated(created)
    },
  })

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Add a location" description="Each location gets its own QR code.">
      <FormContainer
        bare
        onSubmit={form.handleSubmit}
        error={form.errors._form}
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={form.isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" loading={form.isSubmitting}>
              Add location
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Code" htmlFor="code" error={form.errors.code} hint="Printed on the QR sticker" required>
            <Input placeholder="CL-LAB-3" className="font-mono uppercase" autoFocus {...form.register('code')} />
          </Field>
          <Field label="Type" htmlFor="type" error={form.errors.type} required>
            <Select {...form.register('type')} options={Object.entries(LOCATION_TYPES).map(([value, label]) => ({ value, label }))} />
          </Field>
        </div>
        <Field label="Name" htmlFor="name" error={form.errors.name} required>
          <Input placeholder="Computer Laboratory 3" {...form.register('name')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
          <Field label="Building" htmlFor="building" error={form.errors.building}>
            <Input placeholder="Science & Technology Building" {...form.register('building')} />
          </Field>
          <Field label="Floor" htmlFor="floor" error={form.errors.floor}>
            <Input placeholder="2F" {...form.register('floor')} />
          </Field>
        </div>
      </FormContainer>
    </Modal>
  )
}

export default function LocationsPage() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const locations = useAsync(() => locationsService.list(), [], { initialData: [] })
  const stats = useAsync(() => analyticsService.byLocation(), [], { initialData: [] })
  const equipmentCounts = useAsync(() => equipmentService.countsByLocation(), [], { initialData: {} })
  const [managing, setManaging] = useState(null) // location whose equipment modal is open

  const openCount = useMemo(() => Object.fromEntries((stats.data ?? []).map((s) => [s.location_id, s.open])), [stats.data])

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    return (locations.data ?? []).filter(
      (l) => !s || l.name.toLowerCase().includes(s) || l.code.toLowerCase().includes(s) || l.building.toLowerCase().includes(s),
    )
  }, [locations.data, search])

  const download = async (loc) => {
    try {
      await downloadQr(reportUrlFor(loc.code), `campusfix-qr-${loc.code}.png`)
    } catch (err) {
      toast.error('Could not create the QR image', { description: err.message })
    }
  }

  return (
    <>
      <PageHeader
        breadcrumbs
        title="Locations & QR codes"
        description="Print a QR sticker for every room and manage the equipment inside it. Students report by Equipment ID."
        actions={
          <>
            <Button variant="outline" onClick={() => window.print()} leftIcon={<Printer />} disabled={!filtered.length}>
              Print sheet
            </Button>
            <Button onClick={() => setAdding(true)} leftIcon={<Plus />}>
              Add location
            </Button>
          </>
        }
        className="print:hidden"
      />

      <div className="mb-4 max-w-sm print:hidden">
        <SearchBar value={search} onChange={setSearch} placeholder="Search rooms, codes, buildings…" />
      </div>

      {locations.isLoading && !locations.data?.length ? (
        <LoadingSkeleton variant="cards" count={6} />
      ) : locations.error ? (
        <ErrorState error={locations.error} onRetry={locations.refetch} />
      ) : !filtered.length ? (
        <EmptyState
          icon={MapPin}
          title={locations.data?.length ? 'No locations match' : 'No locations yet'}
          description={locations.data?.length ? 'Try a different search.' : 'Add your first room, or run database/seed.sql for demo rooms.'}
          action={
            !locations.data?.length && (
              <Button onClick={() => setAdding(true)} leftIcon={<Plus />}>
                Add location
              </Button>
            )
          }
        />
      ) : (
        <ul className="qr-sheet grid gap-4 sm:grid-cols-2 xl:grid-cols-3 print:grid-cols-3 print:gap-6">
          {filtered.map((loc) => (
            <li
              key={loc.id}
              className="flex break-inside-avoid gap-4 rounded-lg border border-border bg-card p-4 shadow-xs print:flex-col print:items-center print:border-neutral-400 print:text-center print:shadow-none"
            >
              <QrImage code={loc.code} size={112} className="shrink-0 border border-border print:border-0" />
              <div className="grid min-w-0 content-between gap-2">
                <div className="grid gap-1">
                  <span className="font-mono text-[12px] font-semibold">{loc.code}</span>
                  <span className="font-medium leading-snug">{loc.name}</span>
                  <span className="text-[12.5px] text-muted-foreground">
                    {loc.building}
                    {loc.floor && ` · ${loc.floor}`}
                  </span>
                  <span className="hidden text-[11px] print:block">Scan to report a broken item · CampusFix</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 print:hidden">
                  <Badge variant="outline">{LOCATION_TYPES[loc.type]}</Badge>
                  {openCount[loc.id] > 0 && <Badge variant="warning">{openCount[loc.id]} open</Badge>}
                </div>
                <div className="flex flex-wrap gap-1.5 print:hidden">
                  <Button size="sm" onClick={() => setManaging(loc)} leftIcon={<Cpu />}>
                    Equipment ({equipmentCounts.data?.[loc.id] ?? 0})
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => download(loc)} leftIcon={<Download />}>
                    PNG
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <a href={reportUrlFor(loc.code)} target="_blank" rel="noreferrer">
                      <ExternalLink /> Open
                    </a>
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <Link to={`/equipment?room=${encodeURIComponent(loc.code)}`}>
                      <Monitor /> Equipment
                    </Link>
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AddLocationModal open={adding} onOpenChange={setAdding} onCreated={() => locations.refetch()} />
      <EquipmentManager
        location={managing}
        open={Boolean(managing)}
        onOpenChange={(o) => !o && setManaging(null)}
        onChanged={() => equipmentCounts.refetch()}
      />
    </>
  )
}
