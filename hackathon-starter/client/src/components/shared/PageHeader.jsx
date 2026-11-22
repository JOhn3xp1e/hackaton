import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { TextReveal } from './Reveal'
import { Breadcrumbs } from './Breadcrumbs'

/**
 * PageHeader — consistent top of every page.
 *   <PageHeader eyebrow="Workspace" title="Items" description="…"
 *               actions={<Button>New</Button>} breadcrumbs />
 * `breadcrumbs` = true (auto from URL) or an array of { label, to }.
 */
export function PageHeader({ eyebrow, title, description, actions, breadcrumbs, className }) {
  return (
    <header className={cn('flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="grid min-w-0 gap-2">
        {breadcrumbs && <Breadcrumbs items={Array.isArray(breadcrumbs) ? breadcrumbs : undefined} className="mb-1" />}
        {eyebrow && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="eyebrow">
            {eyebrow}
          </motion.p>
        )}
        <TextReveal as="h1" text={title} className="font-display text-2xl font-semibold tracking-tight sm:text-[28px] leading-tight" />
        {description && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="max-w-2xl text-sm text-muted-foreground text-pretty"
          >
            {description}
          </motion.p>
        )}
      </div>
      {actions && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex shrink-0 flex-wrap items-center gap-2"
        >
          {actions}
        </motion.div>
      )}
    </header>
  )
}
