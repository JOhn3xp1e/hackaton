import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useToast } from '@/components/ui/toast'
import { SEVERITIES } from '@/lib/constants'
import { ticketsService } from '@/services/ticketsService'

/**
 * Staff realtime: refetch on any ticket change and toast when a new report
 * arrives. `refetch` should reload the page's data.
 */
export function useLiveTickets(refetch, { notify = true, channel = 'staff-live' } = {}) {
  const toast = useToast()
  const navigate = useNavigate()
  const refetchRef = useRef(refetch)
  refetchRef.current = refetch

  useEffect(
    () =>
      ticketsService.subscribe(
        (payload) => {
          refetchRef.current?.()
          if (notify && payload.eventType === 'INSERT') {
            const t = payload.new
            toast({
              title: `New ${SEVERITIES[t.severity]?.label.toLowerCase() ?? ''} report · ${t.ticket_number}`,
              description: t.title,
              type: t.severity === 'critical' || t.severity === 'high' ? 'warning' : 'info',
              duration: 8000,
              action: { label: 'Open', onClick: () => navigate(`/tickets/${t.ticket_number}`) },
            })
          }
        },
        { channel },
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [notify, channel],
  )
}
