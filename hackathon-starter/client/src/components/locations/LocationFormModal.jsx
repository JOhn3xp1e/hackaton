import { z } from 'zod'
import { useForm } from '@/hooks/useForm'
import { LOCATION_TYPES } from '@/lib/constants'
import { locationsService } from '@/services/locationsService'
import { FormContainer } from '@/components/shared/FormContainer'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

// Mirrors the CHECK constraints on public.locations in database/schema.sql.
export const locationSchema = z.object({
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

/**
 * Create or edit a location.
 *   <LocationFormModal open onOpenChange location={row | null} onSaved={(row, isNew) => …} />
 * Mount it with `key={location?.id ?? 'new'}` so the form resets when the target changes.
 */
export function LocationFormModal({ open, onOpenChange, location, onSaved }) {
  const isNew = !location
  const form = useForm({
    schema: locationSchema,
    initialValues: location
      ? { code: location.code, name: location.name, building: location.building ?? '', floor: location.floor ?? '', type: location.type }
      : EMPTY,
    onSubmit: async (values) => {
      try {
        const saved = isNew ? await locationsService.create(values) : await locationsService.update(location.id, values)
        onSaved(saved, isNew)
        onOpenChange(false)
      } catch (err) {
        // Unique violation on `code` comes back as "That already exists."
        if (/already exists/i.test(err.message)) {
          throw Object.assign(new Error(err.message), { details: { code: `${values.code} is already used by another location` } })
        }
        throw err
      }
    },
  })

  return (
    <Modal
      open={open}
      onOpenChange={(v) => !form.isSubmitting && onOpenChange(v)}
      title={isNew ? 'Add a location' : `Edit ${location.name}`}
      description={isNew ? 'It appears on the campus map and gets its own QR code.' : 'Changing the code changes the QR code for this room.'}
    >
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
              {isNew ? 'Add location' : 'Save changes'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Code" htmlFor="code" error={form.errors.code} hint="Printed on the QR sticker" required>
            <Input placeholder="CL-LAB-3" className="font-mono uppercase" autoFocus={isNew} {...form.register('code')} />
          </Field>
          <Field label="Type" htmlFor="type" error={form.errors.type} required>
            <Select {...form.register('type')} options={Object.entries(LOCATION_TYPES).map(([value, label]) => ({ value, label }))} />
          </Field>
        </div>
        <Field label="Name" htmlFor="name" error={form.errors.name} required>
          <Input placeholder="Computer Laboratory 3" autoFocus={!isNew} {...form.register('name')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
          <Field label="Building" htmlFor="building" error={form.errors.building}>
            <Input placeholder="Science & Technology Building" {...form.register('building')} />
          </Field>
          <Field label="Floor" htmlFor="floor" error={form.errors.floor} hint="e.g. GF, 2F">
            <Input placeholder="2F" {...form.register('floor')} />
          </Field>
        </div>
      </FormContainer>
    </Modal>
  )
}
