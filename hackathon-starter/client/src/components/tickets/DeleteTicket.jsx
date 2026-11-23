import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { ticketsService } from '@/services/ticketsService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Button } from '@/components/ui/button'

/** Admin-only "danger zone" on the ticket page: permanently delete the report. */
export function DeleteTicket({ ticket }) {
  const toast = useToast()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const remove = async () => {
    try {
      const { photosRemoved } = await ticketsService.remove(ticket)
      toast.success(`${ticket.ticket_number} deleted`, {
        description: photosRemoved
          ? ticket.title
          : `${ticket.title} · Its photos could not be removed from storage (re-run database/schema.sql to allow it).`,
      })
      navigate('/tickets', { replace: true })
    } catch (err) {
      toast.error('Report not deleted', { description: err.message })
    }
  }

  const comments = ticket.comments?.[0]?.count
  const photos = ticket.photo_urls?.length ?? 0

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-destructive">Delete report</CardTitle>
        <CardDescription>Remove spam, duplicates or test reports. This cannot be undone.</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <Button variant="destructive" className="w-full" leftIcon={<Trash2 />} onClick={() => setOpen(true)}>
          Delete {ticket.ticket_number}
        </Button>
      </CardContent>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Delete ${ticket.ticket_number}?`}
        description={[
          `“${ticket.title}” will be removed for everyone, along with its status timeline`,
          comments ? `, ${comments} ${comments === 1 ? 'comment' : 'comments'}` : ', comments',
          photos ? ` and ${photos} ${photos === 1 ? 'photo' : 'photos'}` : '',
          '. Any credits it earned are removed too. This cannot be undone.',
        ].join('')}
        confirmLabel="Delete report"
        onConfirm={remove}
      />
    </Card>
  )
}
