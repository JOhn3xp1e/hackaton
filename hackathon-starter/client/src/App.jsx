import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageLoader } from '@/components/feedback/LoadingSkeleton'

// Route-level code splitting: each page is loaded on demand.
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const ItemsPage = lazy(() => import('@/pages/items/ItemsPage'))
const ComponentsPage = lazy(() => import('@/pages/ComponentsPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

/**
 * Routes. To add a page:
 *   1. create src/pages/MyPage.jsx (default export)
 *   2. add a lazy import + <Route> below
 *   3. add a sidebar link in src/data/navigation.js
 */
export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="items" element={<ItemsPage />} />
          <Route path="components" element={<ComponentsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        {/* Full-screen routes without the app shell (e.g. /login, /landing) go here */}
      </Routes>
    </Suspense>
  )
}
