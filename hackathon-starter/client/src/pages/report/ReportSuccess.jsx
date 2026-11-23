import { useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import { ArrowRight, Check, CircleCheck, Copy, Plus, Trophy } from 'lucide-react'
import { CREDITS } from '@/lib/constants'
import { Button } from '@/components/ui/button'

/** Confirmation screen shown right after a report is submitted. */
export function ReportSuccess({ ticket, onReportAnother }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(ticket.ticket_number)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="grid min-h-[60vh] place-items-center">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm"
      >
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 400, damping: 18 }}
          className="mx-auto grid size-14 place-items-center rounded-full bg-success/12 text-success"
        >
          <CircleCheck className="size-7" />
        </motion.span>
        <h1 className="mt-4 font-display text-xl font-semibold tracking-tight">Report submitted</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Maintenance has been notified{ticket.locationName ? ` about ${ticket.locationName}` : ''}.
        </p>

        <div className="mt-6 rounded-lg border border-border bg-muted/40 p-4">
          <p className="eyebrow">Your ticket number</p>
          <div className="mt-1.5 flex items-center justify-center gap-2">
            <span className="font-mono text-3xl font-semibold tracking-tight">{ticket.ticket_number}</span>
            <Button variant="ghost" size="icon-sm" onClick={copy} aria-label="Copy ticket number">
              {copied ? <Check className="text-success" /> : <Copy />}
            </Button>
          </div>
          <p className="mt-1 truncate text-[13px] text-muted-foreground">{ticket.title}</p>
        </div>

        {ticket.isStudent && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-primary/25 bg-primary/5 p-3.5 text-left text-[13px]">
            <Trophy className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              Once staff confirm this report is valid you earn <span className="font-semibold">+{CREDITS.valid} credits</span>, and{' '}
              <span className="font-semibold">+{CREDITS.resolvedBonus}</span> more when it&apos;s fixed.
            </span>
          </div>
        )}

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Button variant="outline" onClick={onReportAnother} leftIcon={<Plus />}>
            Report another
          </Button>
          <Button asChild>
            <Link to={`/track/${ticket.ticket_number}`}>
              Track it <ArrowRight />
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
