import {
  AirVent,
  Armchair,
  CircleHelp,
  Droplets,
  Monitor,
  Projector,
  Wifi,
  Zap,
} from 'lucide-react'

/**
 * Domain enumerations. Keep in sync with the CHECK constraints in
 * database/schema.sql and server/src/validators/triage.schema.js.
 */

export const CATEGORIES = {
  computer_equipment: { label: 'Computer / Lab Equipment', short: 'Computers', icon: Monitor },
  projector_av: { label: 'Projector / Audio-Visual', short: 'Projector & AV', icon: Projector },
  furniture: { label: 'Furniture & Fixtures', short: 'Furniture', icon: Armchair },
  electrical: { label: 'Electrical', short: 'Electrical', icon: Zap },
  network_internet: { label: 'Internet / Network', short: 'Network', icon: Wifi },
  plumbing: { label: 'Plumbing', short: 'Plumbing', icon: Droplets },
  air_conditioning: { label: 'Air Conditioning', short: 'Aircon', icon: AirVent },
  other: { label: 'Other', short: 'Other', icon: CircleHelp },
}
export const CATEGORY_KEYS = Object.keys(CATEGORIES)

export const SEVERITIES = {
  low: { label: 'Low', variant: 'outline', hint: 'Minor or cosmetic' },
  medium: { label: 'Medium', variant: 'warning', hint: 'Affects a few people' },
  high: { label: 'High', variant: 'danger', hint: 'Blocks class or many people' },
  critical: { label: 'Critical', variant: 'solid', hint: 'Safety hazard / room unusable' },
}
export const SEVERITY_KEYS = Object.keys(SEVERITIES)

export const STATUSES = {
  pending: { label: 'Pending', variant: 'warning' },
  in_progress: { label: 'In Progress', variant: 'info' },
  resolved: { label: 'Resolved', variant: 'success' },
}
export const STATUS_KEYS = Object.keys(STATUSES)

export const ROLES = {
  student: 'Student',
  teacher: 'Teacher',
  lab_assistant: 'Lab Assistant',
  maintenance: 'Maintenance',
  admin: 'Administrator',
}
/** Teachers sign up themselves and act as staff; students have no account. */
export const STAFF_ROLES = ['teacher', 'lab_assistant', 'maintenance', 'admin']

/** Staff review of a report — drives credits. */
export const VALIDITY = {
  unreviewed: { label: 'Awaiting review', variant: 'outline' },
  valid: { label: 'Valid', variant: 'success' },
  invalid: { label: 'Invalid', variant: 'danger' },
}
export const VALIDITY_KEYS = Object.keys(VALIDITY)

/** Keep in sync with the student_credits view in database/schema.sql. */
export const CREDITS = { valid: 10, resolvedBonus: 5 }

/** Room codes and equipment short codes (CHECK constraints in database/schema.sql). */
export const CODE_PATTERN = /^[A-Z0-9-]{2,32}$/

export const STUDENT_NO_PATTERN = /^[A-Za-z0-9-]{4,20}$/

/** Keep in sync with tickets_reporter_email_format in database/schema.sql. */
export const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
export const EMAIL_MAX = 254

export const LOCATION_TYPES = {
  classroom: 'Classroom',
  laboratory: 'Laboratory',
  office: 'Office',
  library: 'Library',
  common_area: 'Common Area',
}

export const MAX_PHOTOS = 3
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024
export const PHOTO_BUCKET = 'ticket-photos'

/** Equipment sticker IDs, e.g. CL2-PC15 (matches equipment_short_code_check). */
export const EQUIPMENT_CODE_PATTERN = /^[A-Z0-9-]{2,32}$/
