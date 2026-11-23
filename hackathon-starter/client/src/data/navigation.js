import { ChartColumn, LayoutDashboard, MapPin, Newspaper, Settings, SquarePen, Ticket, Trophy } from 'lucide-react'
import { STAFF_ROLES } from '@/lib/constants'

/**
 * Sidebar navigation. `roles` limits a section/item to those profile roles
 * (omit for everyone, including signed-out students).
 */
export const navSections = [
  {
    title: 'Campus',
    items: [{ label: 'Report an issue', to: '/', icon: SquarePen, end: true }],
  },
  {
    title: 'Staff',
    roles: STAFF_ROLES,
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
      { label: 'Reports feed', to: '/reports', icon: Newspaper },
      { label: 'Leaderboard', to: '/leaderboard', icon: Trophy },
      { label: 'All tickets', to: '/tickets', icon: Ticket, end: true },
      { label: 'Analytics', to: '/analytics', icon: ChartColumn },
      { label: 'Locations & QR', to: '/locations', icon: MapPin, roles: ['admin'] },
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
  '/': 'Report',
  '/r': 'Report',
  '/reports': 'Reports',
  '/leaderboard': 'Leaderboard',
  '/dashboard': 'Dashboard',
  '/tickets': 'Tickets',
  '/analytics': 'Analytics',
  '/locations': 'Locations',
  '/settings': 'Settings',
}
