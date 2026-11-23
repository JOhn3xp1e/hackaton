import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageLoader } from '@/components/feedback/LoadingSkeleton'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { isSupabaseConfigured } from '@/lib/supabase'
import SetupPage from '@/pages/SetupPage'

// Route-level code splitting: each page is loaded on demand.
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const SignupPage = lazy(() => import('@/pages/auth/SignupPage'))
const HomePage = lazy(() => import('@/pages/HomePage'))
const ReportPage = lazy(() => import('@/pages/report/ReportPage'))
const MyReportsPage = lazy(() => import('@/pages/MyReportsPage'))
const TicketPage = lazy(() => import('@/pages/TicketPage'))
const TicketsPage = lazy(() => import('@/pages/staff/TicketsPage'))
const AnalyticsPage = lazy(() => import('@/pages/staff/AnalyticsPage'))
const LocationsPage = lazy(() => import('@/pages/staff/LocationsPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

const STAFF = ['lab_assistant', 'maintenance', 'admin']

/**
 * Routes. To add a page:
 *   1. create src/pages/MyPage.jsx (default export)
 *   2. add a lazy import + <Route> below
 *   3. add a sidebar link in src/data/navigation.js
 */
export default function App() {
  if (!isSupabaseConfigured) return <SetupPage />

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Full-screen routes without the app shell */}
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />

        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="report" element={<ReportPage />} />
            {/* QR codes point here: /r/CL-LAB-2 */}
            <Route path="r/:locationCode" element={<ReportPage />} />
            <Route path="my-reports" element={<MyReportsPage />} />
            <Route path="tickets/:ticketNumber" element={<TicketPage />} />
            <Route path="settings" element={<SettingsPage />} />

            <Route element={<RequireAuth roles={STAFF} />}>
              <Route path="tickets" element={<TicketsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
            </Route>
            <Route element={<RequireAuth roles={['admin']} />}>
              <Route path="locations" element={<LocationsPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}
