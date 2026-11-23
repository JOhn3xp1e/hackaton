import { useEffect, useState } from 'react'
import { Cpu, Pencil, Plus, Printer, Trash2 } from 'lucide-react'
import { z } from 'zod'
import { useAsync } from '@/hooks/useAsync'
import { useForm } from '@/hooks/useForm'
import { useToast } from '@/components/ui/toast'
import { EQUIPMENT_CODE_PATTERN } from '@/lib/constants'
import { equipmentService } from '@/services/equipmentService'
import { Modal } from '@/components/ui/modal'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { ErrorState } from '@/components/feedback/ErrorState'

const schema = z.object({
  shortCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(EQUIPMENT_CODE_PATTERN, 'Use 2–32 letters, numbers or dashes (e.g. CL2-PC16)'),
  name: z.string().trim().min(2, 'Enter a name').max(120, 'Keep it under 120 characters'),
  description: z.string().trim().max(500, 'Keep it under 500 characters'),
})

const EMPTY = { shortCode: '', name: '', description: '' }

const escapeHtml = (s = '') => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

/** Open a print-ready sheet of ID labels to stick on each item. */
function printLabels(items, location) {
  const win = window.open('', '_blank', 'width=800,height=900')
  if (!win) return false
  const labels = items
    .map(
      (e) => `<div class="label"><div class="code">${escapeHtml(e.short_code)}</div><div class="name">${escapeHtml(e.name)}</div>
      <div class="room">${escapeHtml(location.name)} · ${escapeHtml(location.code)}</div><div class="hint">Broken? Report it with this ID</div></div>`,
    )
    .join('')
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Equipment labels · ${escapeHtml(location.code)}</title>
    <style>body{font-family:system-ui,sans-serif;margin:16px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
    .label{border:1.5px dashed #555;border-radius:8px;padding:12px;text-align:center;break-inside:avoid}
    .code{font:700 22px ui-monospace,monospace;letter-spacing:.5px}.name{font-size:13px;margin-top:4px}
    .room{font-size:11px;color:#555;margin-top:2px}.hint{font-size:10px;color:#777;margin-top:6px}</style></head>
    <body><div class="grid">${labels}</div></body></html>`)
  win.document.close()
  win.focus()
  win.print()
  return true
}

/** Admin: add / edit / delete the equipment in one location. */
export function EquipmentManager({ location, open, onOpenChange, onChanged }) {
  const toast = useToast()
  const [editing, setEditing] = useState(null) // null = adding, item = editing
  const [deleting, setDeleting] = useState(null)

  const list = useAsync(() => (location ? equipmentService.listByLocation(location.id) : Promise.resolve([])), [location?.id], {
    initialData: [],
  })

  const form = useForm({
    schema,
    initialValues: EMPTY,
    onSubmit: async (values) => {
      if (editing) {
        await equipmentService.update(editing.id, values)
        toast.success('Equipment updated', { description: values.shortCode.toUpperCase() })
      } else {
        await equipmentService.create({ ...values, locationId: location.id })
        toast.success('Equipment added', { description: `${values.shortCode.toUpperCase()} · ${location.name}` })
      }
      setEditing(null)
      form.reset(EMPTY)
      list.refetch()
      onChanged?.()
    },
  })

  useEffect(() => {
    if (!open) {
      setEditing(null)
      form.reset(EMPTY)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const startEdit = (item) => {
    setEditing(item)
    form.reset({ shortCode: item.short_code, name: item.name, description: item.description ?? '' })
  }

  const remove = async () => {
    try {
      await equipmentService.remove(deleting.id)
      toast.success('Equipment deleted', { description: deleting.short_code })
      if (editing?.id === deleting.id) {
        setEditing(null)
        form.reset(EMPTY)
      }
      list.refetch()
      onChanged?.()
    } catch (err) {
      toast.error('Could not delete', { description: err.message })
    }
  }

  const items = list.data ?? []

  return (
    <>
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        size="lg"
        title={location ? `Equipment · ${location.name}` : 'Equipment'}
        description="Each item gets a sticker ID. Students report a problem by typing that ID."
      >
        <div className="grid gap-5">
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">
                {items.length} item{items.length === 1 ? '' : 's'}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                leftIcon={<Printer />}
                disabled={!items.length}
                onClick={() => {
                  if (!printLabels(items, location)) toast.warning('Allow pop-ups to print labels')
                }}
              >
                Print ID labels
              </Button>
            </div>

            {list.isLoading && !items.length ? (
              <div className="grid place-items-center py-6 text-muted-foreground">
                <Spinner />
              </div>
            ) : list.error ? (
              <ErrorState compact error={list.error} onRetry={list.refetch} />
            ) : !items.length ? (
              <p className="flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                <Cpu className="size-4" /> No equipment in this room yet. Add the first item below.
              </p>
            ) : (
              <ul className="max-h-64 divide-y divide-border overflow-y-auto rounded-md border border-border">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                    <span className="w-28 shrink-0 font-mono text-[12.5px] font-semibold">{item.short_code}</span>
                    <span className="grid min-w-0 flex-1">
                      <span className="truncate">{item.name}</span>
                      {item.description && <span className="truncate text-[12px] text-muted-foreground">{item.description}</span>}
                    </span>
                    <Button type="button" size="icon-sm" variant="ghost" onClick={() => startEdit(item)} aria-label={`Edit ${item.short_code}`}>
                      <Pencil />
                    </Button>
                    <Button type="button" size="icon-sm" variant="ghost" onClick={() => setDeleting(item)} aria-label={`Delete ${item.short_code}`}>
                      <Trash2 className="text-destructive" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form onSubmit={form.handleSubmit} noValidate className="grid gap-3 rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm font-semibold">{editing ? `Edit ${editing.short_code}` : 'Add equipment'}</p>
            <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
              <Field label="Equipment ID" htmlFor="shortCode" error={form.errors.shortCode} required>
                <Input placeholder={`${location?.code?.split('-')[0] ?? 'RM'}-PC16`} className="font-mono uppercase" {...form.register('shortCode')} />
              </Field>
              <Field label="Name" htmlFor="name" error={form.errors.name} required>
                <Input placeholder="Computer 16" {...form.register('name')} />
              </Field>
            </div>
            <Field label="Description" htmlFor="description" error={form.errors.description} hint="Where exactly it is, model, serial no. (optional)">
              <Textarea rows={2} placeholder="Desktop PC, row 4, seat 1" {...form.register('description')} />
            </Field>
            {form.errors._form && <p className="text-sm text-destructive">{form.errors._form}</p>}
            <div className="flex justify-end gap-2">
              {editing && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEditing(null)
                    form.reset(EMPTY)
                  }}
                >
                  Cancel edit
                </Button>
              )}
              <Button type="submit" loading={form.isSubmitting} leftIcon={editing ? <Pencil /> : <Plus />}>
                {editing ? 'Save changes' : 'Add equipment'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.short_code ?? 'equipment'}?`}
        description="Past reports keep their details, but this ID can no longer be reported."
        confirmLabel="Delete"
        onConfirm={remove}
      />
    </>
  )
}
