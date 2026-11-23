import { Badge } from '@/components/ui/badge'
import { SEVERITIES, STATUSES } from '@/lib/constants'

export const STATUS_MAP = STATUSES
export const SEVERITY_MAP = SEVERITIES

/** <StatusBadge status="pending" />  or  <StatusBadge status="high" map={SEVERITY_MAP} /> */
export function StatusBadge({ status, map = STATUS_MAP, className }) {
  const s = map[status] ?? { label: status, variant: 'default' }
  return (
    <Badge variant={s.variant} dot className={className}>
      {s.label}
    </Badge>
  )
}
