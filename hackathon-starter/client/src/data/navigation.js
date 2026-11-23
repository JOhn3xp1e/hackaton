import { Clock, LayoutGrid, Map, Monitor, Settings, SquarePen, Trophy, Wrench } from 'lucide-react'
import { STAFF_ROLES } from '@/lib/constants'

/**
 * Sidebar navigation. `roles` limits a section/item to those profile roles
 * (omit for everyone, including signed-out students).
 *
 * Students can only report an issue; everything else is for teachers & staff
 * (STAFF_ROLES = teacher, lab_assistant, maintenance, admin).
 * Analytics lives on the Overview page; room QR codes on the Campus Map.
 */
export const navSections = [
  {
    title: 'Campus',
    // Students only. Signed-in staff manage reports instead of filing them.
    hideForRoles: STAFF_ROLES,
    items: [{ label: 'Report an Issue', to: '/', icon: SquarePen, end: true }],
  },
  {
    title: 'Workspace',
    roles: STAFF_ROLES,
    items: [
      { label: 'Overview', to: '/dashboard', icon: LayoutGrid },
      { label: 'Track Reports', to: '/reports', icon: Clock },
      { label: 'Campus Map', to: '/campus-map', icon: Map },
      { label: 'Equipment', to: '/equipment', icon: Monitor, roles: ['admin'] },
      { label: 'Maintenance Tasks', to: '/tickets', icon: Wrench, end: true },
      { label: 'Leaderboard', to: '/leaderboard', icon: Trophy },
      { label: 'Settings', to: '/settings', icon: Settings },
    ],
  },
]

/** Sections and items visible to the given role (undefined = signed-out student). */
export function navForRole(role) {
  return navSections
    .filter((s) => !s.roles || s.roles.includes(role))
    .filter((s) => !s.hideForRoles || !s.hideForRoles.includes(role))
    .map((s) => ({ ...s, items: s.items.filter((i) => !i.roles || i.roles.includes(role)) }))
    .filter((s) => s.items.length)
}

/** Pretty labels for auto-generated breadcrumbs */
export const routeLabels = {
  '/': 'Report an issue',
  '/r': 'Report',
  '/dashboard': 'Overview',
  '/reports': 'Track reports',
  '/leaderboard': 'Leaderboard',
  '/tickets': 'Maintenance tasks',
  '/campus-map': 'Campus map',
  '/equipment': 'Equipment',
  '/e': 'Report',
  '/settings': 'Settings',
}
