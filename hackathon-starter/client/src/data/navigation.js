import { ChartColumn, LayoutGrid, Map, Newspaper, QrCode, Settings, SquarePen, Trophy, Wrench } from 'lucide-react'
import { STAFF_ROLES } from '@/lib/constants'

/**
 * Sidebar navigation. `roles` limits a section/item to those profile roles
 * (omit for everyone, including signed-out students).
 *
 * Students can only report an issue; everything else is for teachers & staff
 * (STAFF_ROLES = teacher, lab_assistant, maintenance, admin).
 */
export const navSections = [
  {
    title: 'Campus',
    items: [{ label: 'Report an Issue', to: '/', icon: SquarePen, end: true }],
  },
  {
    title: 'Workspace',
    roles: STAFF_ROLES,
    items: [
      { label: 'Overview', to: '/dashboard', icon: LayoutGrid },
      { label: 'Reports Feed', to: '/reports', icon: Newspaper },
      { label: 'Maintenance Tasks', to: '/tickets', icon: Wrench, end: true },
      { label: 'Leaderboard', to: '/leaderboard', icon: Trophy },
      { label: 'Analytics', to: '/analytics', icon: ChartColumn },
      { label: 'Campus Map', to: '/campus-map', icon: Map },
      { label: 'Locations & QR', to: '/locations', icon: QrCode, roles: ['admin'] },
      { label: 'Settings', to: '/settings', icon: Settings },
    ],
  },
]

/** Sections and items visible to the given role (undefined = signed-out student). */
export function navForRole(role) {
  return navSections
    .filter((s) => !s.roles || s.roles.includes(role))
    .map((s) => ({ ...s, items: s.items.filter((i) => !i.roles || i.roles.includes(role)) }))
    .filter((s) => s.items.length)
}

/** Pretty labels for auto-generated breadcrumbs */
export const routeLabels = {
  '/': 'Report an issue',
  '/r': 'Report',
  '/dashboard': 'Overview',
  '/reports': 'Reports feed',
  '/leaderboard': 'Leaderboard',
  '/tickets': 'Maintenance tasks',
  '/analytics': 'Analytics',
  '/campus-map': 'Campus map',
  '/locations': 'Locations & QR',
  '/settings': 'Settings',
}
