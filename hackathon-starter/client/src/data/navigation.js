import { ChartColumn, Clock, LayoutGrid, Map, Settings, SquarePen, Wrench } from 'lucide-react'

const STAFF = ['lab_assistant', 'maintenance', 'admin']

/**
 * Sidebar navigation. `roles` limits an item to those profile roles
 * (omit for everyone). Add a page = add a route in App.jsx + an entry here.
 */
export const navSections = [
  {
    title: 'Workspace',
    items: [
      { label: 'Overview', to: '/', icon: LayoutGrid, end: true },
      { label: 'Report an Issue', to: '/report', icon: SquarePen },
      { label: 'Track Reports', to: '/my-reports', icon: Clock },
      { label: 'Maintenance Tasks', to: '/tickets', icon: Wrench, end: true, roles: STAFF },
      { label: 'Analytics', to: '/analytics', icon: ChartColumn, roles: STAFF },
      { label: 'Campus Map', to: '/locations', icon: Map, roles: ['admin'] },
      { label: 'Settings', to: '/settings', icon: Settings },
    ],
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
  '/': 'Overview',
  '/report': 'Report an issue',
  '/r': 'Report',
  '/my-reports': 'Track reports',
  '/tickets': 'Maintenance tasks',
  '/analytics': 'Analytics',
  '/locations': 'Campus map',
  '/settings': 'Settings',
}
