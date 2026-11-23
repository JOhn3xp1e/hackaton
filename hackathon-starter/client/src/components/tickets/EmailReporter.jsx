import { useEffect, useMemo, useState } from 'react'
import { Copy, ExternalLink, Mail, MailX } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { useToast } from '@/components/ui/toast'
import { ROLES, STATUSES } from '@/lib/constants'
import { config } from '@/lib/config'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

/** Latest staff note on the timeline, used as the default message. */
function latestNote(ticket) {
  const withNote = (ticket.updates ?? []).filter((u) => u.note?.trim() && u.note !== 'Issue reported')
  return withNote.at(-1)?.note.trim() ?? ''
}

function composeEmail(ticket, message, staff) {
  const greeting = !ticket.is_anonymous && ticket.reporter_name ? `Hi ${ticket.reporter_name.split(' ')[0]},` : 'Hi,'
  const subject = `[CampusFix] ${ticket.ticket_number} is ${STATUSES[ticket.status]?.label ?? ticket.status}: ${ticket.title}`
  const body = [
    greeting,
    '',
    `Here's an update on the issue you reported: "${ticket.title}" (${ticket.ticket_number}).`,
    '',
    `Status: ${STATUSES[ticket.status]?.label ?? ticket.status}`,
    ...(message.trim() ? ['', message.trim()] : []),
    '',
    `Follow the repair here: ${config.publicAppUrl}/tickets/${ticket.ticket_number}`,
    '',
    'Thank you for reporting it!',
    `${staff?.full_name || 'CampusFix team'}${staff?.role ? ` · ${ROLES[staff.role]}` : ''}`,
  ].join('\n')
  return { subject, body }
}

/**
 * Staff-only: the reporter left an email for updates. Writes the message and
 * opens it in Gmail (or the default mail app). Nothing is sent from the server.
 */
export function EmailReporter({ ticket }) {
  const toast = useToast()
  const { profile } = useAuth()
  const [message, setMessage] = useState(() => latestNote(ticket))

  // When a new note lands on the timeline, offer it as the message.
  const note = latestNote(ticket)
  useEffect(() => setMessage(note), [note])

  const email = ticket.reporter_email
  const { subject, body } = useMemo(() => composeEmail(ticket, message, profile), [ticket, message, profile])

  if (!email) {
    return (
      <Card>
        <CardContent className="flex items-start gap-3 py-4 text-[13px] text-muted-foreground">
          <MailX className="mt-0.5 size-4 shrink-0" />
          The reporter didn't leave an email, so they can only follow this report with the ticket number.
        </CardContent>
      </Card>
    )
  }

  const q = (v) => encodeURIComponent(v)
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${q(email)}&su=${q(subject)}&body=${q(body)}`
  const mailtoUrl = `mailto:${email}?subject=${q(subject)}&body=${q(body)}`

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email)
      toast.success('Email copied', { description: email })
    } catch {
      toast.error('Could not copy', { description: email })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="size-4 text-primary" /> Email the reporter
        </CardTitle>
        <CardDescription>They asked for updates. Write a message and send it from Gmail.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 pt-4">
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-[13px]">
          <span className="min-w-0 flex-1 truncate font-medium">{email}</span>
          <button
            type="button"
            onClick={copyEmail}
            aria-label="Copy email address"
            className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Copy className="size-3.5" />
          </button>
        </div>

        <Field label="Message" htmlFor="email-message" hint={`Sent with the status (${STATUSES[ticket.status]?.label}) and a link to track the report.`}>
          <Textarea
            id="email-message"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. A technician replaced the power supply. The computer works again."
            maxLength={1500}
          />
        </Field>

        <Button asChild>
          <a href={gmailUrl} target="_blank" rel="noreferrer">
            <ExternalLink /> Open in Gmail
          </a>
        </Button>
        <a href={mailtoUrl} className="text-center text-[12.5px] font-medium text-muted-foreground hover:text-foreground hover:underline">
          Use another email app instead
        </a>
      </CardContent>
    </Card>
  )
}
