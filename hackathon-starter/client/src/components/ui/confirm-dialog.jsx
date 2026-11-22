import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal, ModalDescription, ModalTitle } from './modal'
import { Button } from './button'

/**
 * ConfirmDialog — ask before destructive or irreversible actions.
 * `onConfirm` may be async; the button shows a spinner until it resolves.
 *
 *   <ConfirmDialog open={…} onOpenChange={…} title="Delete item?"
 *     description="This cannot be undone." confirmLabel="Delete"
 *     variant="destructive" onConfirm={() => remove(id)} />
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'destructive',
  onConfirm,
}) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm?.()
      onOpenChange?.(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={(v) => !loading && onOpenChange?.(v)}
      size="sm"
      hideClose
      headless
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange?.(false)} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={handleConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-4">
        {variant === 'destructive' && (
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" />
          </div>
        )}
        <div className="grid gap-1.5 pt-0.5">
          <ModalTitle className="font-display text-base font-semibold">{title}</ModalTitle>
          <ModalDescription className={description ? 'text-sm text-muted-foreground' : 'sr-only'}>
            {description || title}
          </ModalDescription>
        </div>
      </div>
    </Modal>
  )
}
