import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { Label } from './label'

/**
 * Field — label + control + hint/error, consistent spacing everywhere.
 *   <Field label="Title" htmlFor="title" error={form.errors.title} required>
 *     <Input {...form.register('title')} />
 *   </Field>
 */
export function Field({ label, htmlFor, hint, error, required, className, children }) {
  return (
    <div className={cn('grid content-start gap-1.5', className)}>
      {label && (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}
      {children}
      <AnimatePresence initial={false} mode="wait">
        {error ? (
          <motion.p
            key="error"
            role="alert"
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-[12.5px] text-destructive"
          >
            {error}
          </motion.p>
        ) : hint ? (
          <motion.p key="hint" initial={false} className="text-[12.5px] text-muted-foreground">
            {hint}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
