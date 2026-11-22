import { useEffect } from 'react'
import { useForm } from '@/hooks/useForm'
import { itemSchema, ITEM_PRIORITIES, ITEM_STATUSES } from '@/lib/schemas'
import { mockCategories } from '@/data/mock/items'
import { STATUS_MAP, PRIORITY_MAP } from '@/components/shared/StatusBadge'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { FormContainer } from '@/components/shared/FormContainer'

const EMPTY = { title: '', description: '', status: 'todo', priority: 'medium', category: '' }

/**
 * Create / edit modal for an item. Pass `item` to edit, omit to create.
 * `onSubmit(values)` should call the service and may throw ApiError —
 * server validation errors are shown on the matching fields automatically.
 */
export function ItemFormModal({ open, onOpenChange, item, onSubmit }) {
  const isEdit = Boolean(item)
  const form = useForm({ schema: itemSchema, initialValues: EMPTY, onSubmit })

  // Reset fields whenever the modal opens
  useEffect(() => {
    if (open) {
      form.reset(
        item
          ? { title: item.title, description: item.description ?? '', status: item.status, priority: item.priority, category: item.category }
          : EMPTY,
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item])

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit item' : 'New item'}
      description={isEdit ? 'Update the details below.' : 'Fill in the details to create a new item.'}
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
              {isEdit ? 'Save changes' : 'Create item'}
            </Button>
          </>
        }
      >
        <Field label="Title" htmlFor="title" error={form.errors.title} required>
          <Input placeholder="e.g. Build onboarding flow" autoFocus {...form.register('title')} />
        </Field>

        <Field label="Description" htmlFor="description" error={form.errors.description} hint="Optional — markdown not supported.">
          <Textarea rows={3} placeholder="What needs to happen?" {...form.register('description')} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Status" htmlFor="status" error={form.errors.status} required>
            <Select {...form.register('status')} options={ITEM_STATUSES.map((s) => ({ value: s, label: STATUS_MAP[s].label }))} />
          </Field>
          <Field label="Priority" htmlFor="priority" error={form.errors.priority} required>
            <Select {...form.register('priority')} options={ITEM_PRIORITIES.map((p) => ({ value: p, label: PRIORITY_MAP[p].label }))} />
          </Field>
          <Field label="Category" htmlFor="category" error={form.errors.category} required>
            <Select {...form.register('category')} placeholder="Choose…" options={mockCategories} />
          </Field>
        </div>
      </FormContainer>
    </Modal>
  )
}
