import { useState } from 'react'
import { CircleCheck, CircleX, Coins, RotateCcw } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { useToast } from '@/components/ui/toast'
import { CREDITS, VALIDITY } from '@/lib/constants'
import { reporterLabel } from '@/lib/studentIdentity'
import { ticketsService } from '@/services/ticketsService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

/** Credits this ticket is worth to its reporter right now (mirrors the student_credits view). */
export function creditsFor(ticket) {
  if (ticket.validity !== 'valid') return 0
  return CREDITS.valid + (ticket.status === 'resolved' ? CREDITS.resolvedBonus : 0)
}

/**
 * Staff-only: mark a student's report valid (earns credits) or invalid (spam,
 * duplicate, not a real problem). Only shown for student-submitted tickets.
 */
export function ReviewPanel({ ticket, onChanged }) {
  const toast = useToast()
  const { user } = useAuth()
  const [saving, setSaving] = useState(null)

  const review = async (validity) => {
    setSaving(validity)
    try {
      await ticketsService.setValidity(ticket.id, validity, user.id)
      if (validity === 'valid') {
        const earned = CREDITS.valid + (ticket.status === 'resolved' ? CREDITS.resolvedBonus : 0)
        toast.success(`+${earned} credits to ${ticket.student_no}`, {
          description: ticket.status === 'resolved' ? 'Valid and already fixed.' : `+${CREDITS.resolvedBonus} more when it's resolved.`,
        })
      } else {
        toast.info(validity === 'invalid' ? 'Marked invalid — no credits awarded' : 'Review cleared')
      }
      onChanged?.()
    } catch (err) {
      toast.error('Review not saved', { description: err.message })
    } finally {
      setSaving(null)
    }
  }

  const earned = creditsFor(ticket)

  return (
    <Card>
      <CardHeader action={<Badge variant={VALIDITY[ticket.validity]?.variant}>{VALIDITY[ticket.validity]?.label}</Badge>}>
        <CardTitle>Report review</CardTitle>
        <CardDescription>
          Valid reports earn the student +{CREDITS.valid} credits (+{CREDITS.resolvedBonus} when resolved).
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 pt-4">
        <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
          <span className="min-w-0 truncate">
            <span className="font-mono">{ticket.student_no}</span>
            <span className="text-muted-foreground"> · {reporterLabel(ticket)}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1 font-semibold">
            <Coins className="size-4 text-warning" /> {earned}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={ticket.validity === 'valid' ? 'default' : 'outline'}
            onClick={() => review('valid')}
            loading={saving === 'valid'}
            disabled={Boolean(saving) || ticket.validity === 'valid'}
            leftIcon={<CircleCheck />}
          >
            Valid
          </Button>
          <Button
            variant={ticket.validity === 'invalid' ? 'destructive' : 'outline'}
            onClick={() => review('invalid')}
            loading={saving === 'invalid'}
            disabled={Boolean(saving) || ticket.validity === 'invalid'}
            leftIcon={<CircleX />}
          >
            Invalid
          </Button>
        </div>
        {ticket.validity !== 'unreviewed' && (
          <Button variant="ghost" size="sm" onClick={() => review('unreviewed')} loading={saving === 'unreviewed'} disabled={Boolean(saving)} leftIcon={<RotateCcw />}>
            Undo review
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
