import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Download, ExternalLink, Monitor, Plus, Printer, Trash2 } from 'lucide-react'
import { z } from 'zod'
import { useAsync } from '@/hooks/useAsync'
import { useForm } from '@/hooks/useForm'
import { useToast } from '@/components/ui/toast'
import { CODE_PATTERN } from '@/lib/constants'
import { config } from '@/lib/config'
import { equipmentService } from '@/services/equipmentService'
import { locationsService } from '@/services/locationsService'
import { PageHeader } from '@/components/shared/PageHeader'
import { SearchBar } from '@/components/shared/SearchBar'
import { FormContainer } from '@/components/shared/FormContainer'
import { QrImage, downloadQr, equipmentUrlFor } from '@/components/locations/QrImage'
import { Modal } from '@/components/ui/modal'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'

// Mirrors the equipment CHECK constraints in database/schema.sql.
const equipmentSchema = z.object({
  locationId: z.string().uuid('Choose the room this item is in'),
  shortCode: z.string().trim().toUpperCase().regex(CODE_PATTERN, 'Use 2–32 letters, numbers or dashes (e.g. CL1-PC-15)'),
  name: z.string().trim().min(2, 'Enter a name').max(80, 'Keep it under 80 characters'),
  description: z.string().trim().max(500, 'Keep it under 500 characters'),
})

function AddEquipmentModal({ open, onOpenChange, locations, defaultLocationId, onCreated }) {
  const toast = useToast()
  const form = useForm({
    schema: equipmentSchema,
    initialValues: { locationId: defaultLocationId ?? '', shortCode: '', name: '', description: '' },
    onSubmit: async (values) => {
      const created = await equipmentService.create(values)
      toast.success('Item added', { description: `${created.name} (${created.short_code}) · QR code ready to print.` })
      form.reset()
      onOpenChange(false)
      onCreated(created)
    },
  })

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Add equipment" description="Each item gets its own QR sticker that opens the report form with it filled in.">
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
              Add item
            </Button>
          </>
        }
      >
        <Field label="Room" htmlFor="locationId" error={form.errors.locationId} required>
          <Select
            placeholder="Choose a room…"
            {...form.register('locationId')}
            options={locations.map((l) => ({ value: l.id, label: `${l.name} (${l.code})` }))}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
          <Field label="Short code" htmlFor="shortCode" error={form.errors.shortCode} hint="Printed on the sticker" required>
            <Input placeholder="CL1-PC-15" className="font-mono uppercase" autoFocus {...form.register('shortCode')} />
          </Field>
          <Field label="Name" htmlFor="name" error={form.errors.name} required>
            <Input placeholder="Computer 15" maxLength={80} {...form.register('name')} />
          </Field>
        </div>
        <Field label="Description" htmlFor="description" error={form.errors.description} hint="Where it is, model, serial number…">
          <Textarea rows={2} placeholder="Desktop workstation, row 3" maxLength={500} {...form.register('description')} />
        </Field>
      </FormContainer>
    </Modal>
  )
}

export default function EquipmentPage() {
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const roomCode = params.get('room') ?? ''
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const locations = useAsync(() => locationsService.list(), [], { initialData: [] })
  const equipment = useAsync(() => equipmentService.list(), [], { initialData: [] })
  const room = (locations.data ?? []).find((l) => l.code === roomCode)

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    return (equipment.data ?? []).filter(
      (e) =>
        (!roomCode || e.location?.code === roomCode) &&
        (!s || e.name.toLowerCase().includes(s) || e.short_code.toLowerCase().includes(s) || e.description.toLowerCase().includes(s)),
    )
  }, [equipment.data, roomCode, search])

  const setRoom = (code) => setParams(code ? { room: code } : {}, { replace: true })

  const download = async (item) => {
    try {
      await downloadQr(equipmentUrlFor(item.short_code), `campusfix-qr-${item.short_code}.png`)
    } catch (err) {
      toast.error('Could not create the QR image', { description: err.message })
    }
  }

  const remove = async () => {
    try {
      await equipmentService.remove(deleting.id)
      toast.success('Item deleted', { description: 'Existing reports keep the item name.' })
      equipment.refetch()
    } catch (err) {
      toast.error('Could not delete the item', { description: err.message })
    }
  }

  return (
    <>
      <PageHeader
        breadcrumbs
        title="Equipment"
        description={`Stick a QR code on each computer, projector or aircon. Scanning it opens ${config.publicAppUrl.replace(/^https?:\/\//, '')}/e/… with the room and item filled in.`}
        actions={
          <>
            <Button variant="outline" onClick={() => window.print()} leftIcon={<Printer />} disabled={!filtered.length}>
              Print sheet
            </Button>
            <Button onClick={() => setAdding(true)} leftIcon={<Plus />} disabled={!locations.data?.length}>
              Add item
            </Button>
          </>
        }
        className="print:hidden"
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-[260px_minmax(0,320px)] print:hidden">
        <Select value={roomCode} onChange={(e) => setRoom(e.target.value)} disabled={locations.isLoading} aria-label="Filter by room">
          <option value="">All rooms</option>
          {(locations.data ?? []).map((l) => (
            <option key={l.id} value={l.code}>
              {l.name} ({l.code})
            </option>
          ))}
        </Select>
        <SearchBar value={search} onChange={setSearch} placeholder="Search items or codes…" />
      </div>

      {equipment.isLoading && !equipment.data?.length ? (
        <LoadingSkeleton variant="cards" count={6} />
      ) : equipment.error ? (
        <ErrorState error={equipment.error} onRetry={equipment.refetch} />
      ) : !filtered.length ? (
        <EmptyState
          icon={Monitor}
          title={equipment.data?.length ? 'No items match' : 'No equipment yet'}
          description={
            equipment.data?.length
              ? 'Try another room or search.'
              : 'Add the computers, projectors and aircons in each room, or run database/seed.sql for demo items.'
          }
          action={
            <Button onClick={() => setAdding(true)} leftIcon={<Plus />} disabled={!locations.data?.length}>
              Add item
            </Button>
          }
        />
      ) : (
        <ul className="qr-sheet grid gap-4 sm:grid-cols-2 xl:grid-cols-3 print:grid-cols-4 print:gap-4">
          {filtered.map((item) => (
            <li
              key={item.id}
              className="flex break-inside-avoid gap-4 rounded-lg border border-border bg-card p-4 shadow-xs print:flex-col print:items-center print:gap-1 print:border-neutral-400 print:p-2 print:text-center print:shadow-none"
            >
              <QrImage url={equipmentUrlFor(item.short_code)} label={item.short_code} size={104} className="shrink-0 border border-border print:border-0" />
              <div className="grid min-w-0 content-between gap-2">
                <div className="grid gap-0.5">
                  <span className="font-mono text-[12px] font-semibold">{item.short_code}</span>
                  <span className="font-medium leading-snug">{item.name}</span>
                  <span className="text-[12.5px] text-muted-foreground">
                    {item.location?.name}
                    {item.location?.floor && ` · ${item.location.floor}`}
                  </span>
                  {item.description && <span className="line-clamp-2 text-[12px] text-muted-foreground print:hidden">{item.description}</span>}
                  <span className="hidden text-[10px] print:block">Broken? Scan to report · CampusFix</span>
                </div>
                <div className="flex flex-wrap gap-1.5 print:hidden">
                  <Button size="sm" variant="outline" onClick={() => download(item)} leftIcon={<Download />}>
                    PNG
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <a href={equipmentUrlFor(item.short_code)} target="_blank" rel="noreferrer">
                      <ExternalLink /> Open
                    </a>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleting(item)} aria-label={`Delete ${item.name}`}>
                    <Trash2 className="text-destructive" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AddEquipmentModal
        key={room?.id ?? 'all'}
        open={adding}
        onOpenChange={setAdding}
        locations={locations.data ?? []}
        defaultLocationId={room?.id}
        onCreated={() => equipment.refetch()}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.name ?? 'item'}?`}
        description={`Its QR sticker (${deleting?.short_code}) will stop working. Existing reports keep the item name.`}
        confirmLabel="Delete"
        onConfirm={remove}
      />
    </>
  )
}
