import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

/**
 * FormContainer — card-style form shell with title, sections, error banner and actions.
 *
 *   <FormContainer title="Profile" description="…" onSubmit={form.handleSubmit}
 *                  isSubmitting={form.isSubmitting} error={form.errors._form}
 *                  submitLabel="Save" onCancel={() => form.reset()}>
 *     <FormSection title="Basics" description="…"> …fields… </FormSection>
 *   </FormContainer>
 *
 * Set `bare` to drop the card chrome (e.g. inside a Modal).
 */
export function FormContainer({
  title,
  description,
  onSubmit,
  isSubmitting,
  error,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  onCancel,
  actions,
  bare = false,
  className,
  children,
}) {
  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className={cn(!bare && 'rounded-lg border border-border bg-card shadow-xs', className)}
    >
      {(title || description) && (
        <div className={cn('grid gap-1', !bare && 'border-b border-border px-6 py-5')}>
          {title && <h2 className="font-display text-base font-semibold">{title}</h2>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}

      <div className={cn('grid gap-6', !bare && 'px-6 py-6')}>
        <AnimatePresence initial={false}>
          {error && (
            <motion.div
              role="alert"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-start gap-2 rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {children}
      </div>

      {(actions || onSubmit) && (
        <div className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', !bare ? 'border-t border-border bg-muted/30 px-6 py-3.5 rounded-b-lg' : 'pt-2')}>
          {actions ?? (
            <>
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                  {cancelLabel}
                </Button>
              )}
              <Button type="submit" loading={isSubmitting}>
                {submitLabel}
              </Button>
            </>
          )}
        </div>
      )}
    </form>
  )
}

/** Two-column section: label/description on the left, fields on the right (stacks on mobile). */
export function FormSection({ title, description, children, className }) {
  return (
    <section className={cn('grid gap-4 md:grid-cols-[minmax(0,14rem)_1fr] md:gap-8', className)}>
      <div className="grid content-start gap-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && <p className="text-[13px] text-muted-foreground">{description}</p>}
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  )
}
