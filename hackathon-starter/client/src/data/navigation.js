import { ChartColumn, ClipboardList, House, MapPin, Settings, SquarePen, Ticket } from 'lucide-react'

/**
 * Sidebar navigation. `roles` limits an item to those profile roles
 * (omit for everyone). Add a page = add a route in App.jsx + an entry here.
 */
export const navSections = [
  {
    title: 'Report',
    items: [
      { label: 'Home', to: '/', icon: House, end: true },
      { label: 'Report an issue', to: '/report', icon: SquarePen },
      { label: 'My reports', to: '/my-reports', icon: ClipboardList },
    ],
  },
  {
    title: 'Maintenance',
    roles: ['lab_assistant', 'maintenance', 'admin'],
    items: [
      { label: 'All tickets', to: '/tickets', icon: Ticket, end: true },
      { label: 'Analytics', to: '/analytics', icon: ChartColumn },
      { label: 'Locations & QR', to: '/locations', icon: MapPin, roles: ['admin'] },
    ],
  },
  {
    title: 'Account',
    items: [{ label: 'Settings', to: '/settings', icon: Settings }],
  },
]

/** Sections and items visible to the given role. */
export function navForRole(role) {
  return navSections
    .filter((s) => !s.roles || s.roles.includes(role))
    .map((s) => ({ ...s, items: s.items.filter((i) => !i.roles || i.roles.includes(role)) }))
    .filter((s) => s.items.length)
}

/** Pretty labels for auto-generated breadcrumbs */
export const routeLabels = {
  '/': 'Home',
  '/report': 'Report an issue',
  '/r': 'Report',
  '/my-reports': 'My reports',
  '/tickets': 'Tickets',
  '/analytics': 'Analytics',
  '/locations': 'Locations',
  '/settings': 'Settings',
}
