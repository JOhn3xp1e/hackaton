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
export const STAFF_ROLES = ['lab_assistant', 'maintenance', 'admin']

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
