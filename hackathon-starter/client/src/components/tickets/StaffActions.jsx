import { useEffect, useState } from 'react'
import { UserCheck } from 'lucide-react'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/providers/AuthProvider'
import { useToast } from '@/components/ui/toast'
import { ROLES, STATUS_KEYS, STATUSES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { profilesService } from '@/services/profilesService'
import { ticketsService } from '@/services/ticketsService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

const NOTE_PLACEHOLDER = {
  pending: 'Why is this back to pending?',
  in_progress: 'e.g. Technician on the way, parts ordered…',
  resolved: 'e.g. Replaced the power supply, tested OK.',
}

/** Staff-only panel on the ticket page: change status (+ note) and assignee. */
export function StaffActions({ ticket, onChanged }) {
  const toast = useToast()
  const { user } = useAuth()
  const [status, setStatus] = useState(ticket.status)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const staff = useAsync(() => profilesService.listStaff(), [], { initialData: [] })

  useEffect(() => setStatus(ticket.status), [ticket.status])

  const changed = status !== ticket.status

  const saveStatus = async () => {
    setSaving(true)
    try {
      await ticketsService.updateStatus(ticket.id, status, note.trim())
      // Picking up a ticket assigns it to you if nobody has it yet.
      if (status === 'in_progress' && !ticket.assigned_to) await ticketsService.assign(ticket.id, user.id)
      setNote('')
      toast.success(`Marked ${STATUSES[status].label}`, { description: `${ticket.ticket_number} · everyone following it sees this instantly.` })
      onChanged?.()
    } catch (err) {
      toast.error('Status not updated', { description: err.message })
    } finally {
      setSaving(false)
    }
  }

  const assign = async (profileId) => {
    setAssigning(true)
    try {
      await ticketsService.assign(ticket.id, profileId || null)
      toast.success(profileId ? 'Assignee updated' : 'Ticket unassigned')
      onChanged?.()
    } catch (err) {
      toast.error('Assignee not updated', { description: err.message })
    } finally {
      setAssigning(false)
    }
  }

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle>Update ticket</CardTitle>
        <CardDescription>Changes are pushed live to the reporter.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 pt-4">
        <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Status">
          {STATUS_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={status === key}
              onClick={() => setStatus(key)}
              className={cn(
                'h-9 rounded-md border text-[12.5px] font-medium transition-colors',
                status === key ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:text-foreground',
              )}
            >
              {STATUSES[key].label}
            </button>
          ))}
        </div>
        <Field label="Note (optional)" htmlFor="status-note">
          <Textarea
            id="status-note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={NOTE_PLACEHOLDER[status]}
            maxLength={1000}
          />
        </Field>
        <Button onClick={saveStatus} loading={saving} disabled={!changed && !note.trim()}>
          {changed ? `Mark as ${STATUSES[status].label}` : 'Add note'}
        </Button>

        <div className="h-px bg-border" />

        <Field label="Assigned to" htmlFor="assignee">
          <div className="flex gap-2">
            <Select
              id="assignee"
              value={ticket.assigned_to ?? ''}
              onChange={(e) => assign(e.target.value)}
              disabled={assigning || staff.isLoading}
            >
              <option value="">Unassigned</option>
              {(staff.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name || 'Unnamed'} · {ROLES[p.role]}
                </option>
              ))}
            </Select>
            {ticket.assigned_to !== user.id && (
              <Button variant="outline" onClick={() => assign(user.id)} loading={assigning} leftIcon={<UserCheck />} className="shrink-0">
                Me
              </Button>
            )}
          </div>
          {staff.error && <p className="text-[12.5px] text-destructive">{staff.error.message}</p>}
        </Field>
      </CardContent>
    </Card>
  )
}
