import { LayoutDashboard, ListChecks, Settings, Shapes } from 'lucide-react'

/**
 * Sidebar navigation. Add a page = add a route in App.jsx + an entry here.
 */
export const navSections = [
  {
    title: 'Workspace',
    items: [
      { label: 'Dashboard', to: '/', icon: LayoutDashboard, end: true },
      { label: 'Items', to: '/items', icon: ListChecks, badge: 'CRUD' },
    ],
  },
  {
    title: 'Starter kit',
    items: [
      { label: 'Components', to: '/components', icon: Shapes },
      { label: 'Settings', to: '/settings', icon: Settings },
    ],
  },
]

/** Pretty labels for auto-generated breadcrumbs */
export const routeLabels = {
  '/': 'Dashboard',
  '/items': 'Items',
  '/components': 'Components',
  '/settings': 'Settings',
}
