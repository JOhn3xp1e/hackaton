import { Badge } from '@/components/ui/badge'

/**
 * StatusBadge — maps a domain status string to a badge style.
 * Update STATUS_MAP when the hackathon domain is known.
 */
export const STATUS_MAP = {
  todo: { label: 'To do', variant: 'outline' },
  in_progress: { label: 'In progress', variant: 'info' },
  done: { label: 'Done', variant: 'success' },
  archived: { label: 'Archived', variant: 'default' },
  // generic extras
  active: { label: 'Active', variant: 'success' },
  pending: { label: 'Pending', variant: 'warning' },
  failed: { label: 'Failed', variant: 'danger' },
}

export const PRIORITY_MAP = {
  low: { label: 'Low', variant: 'outline' },
  medium: { label: 'Medium', variant: 'warning' },
  high: { label: 'High', variant: 'danger' },
}

export function StatusBadge({ status, map = STATUS_MAP }) {
  const s = map[status] ?? { label: status, variant: 'default' }
  return (
    <Badge variant={s.variant} dot>
      {s.label}
    </Badge>
  )
}
