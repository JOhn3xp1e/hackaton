import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageLoader } from '@/components/feedback/LoadingSkeleton'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { STAFF_ROLES } from '@/lib/constants'
import { isSupabaseConfigured } from '@/lib/supabase'
import SetupPage from '@/pages/SetupPage'

// Route-level code splitting: each page is loaded on demand.
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const SignupPage = lazy(() => import('@/pages/auth/SignupPage'))
const ReportPage = lazy(() => import('@/pages/report/ReportPage'))
const ReportsPage = lazy(() => import('@/pages/ReportsPage'))
const TicketPage = lazy(() => import('@/pages/TicketPage'))
const LeaderboardPage = lazy(() => import('@/pages/LeaderboardPage'))
const StaffDashboard = lazy(() => import('@/pages/staff/StaffDashboard'))
const TicketsPage = lazy(() => import('@/pages/staff/TicketsPage'))
const AnalyticsPage = lazy(() => import('@/pages/staff/AnalyticsPage'))
const LocationsPage = lazy(() => import('@/pages/staff/LocationsPage'))
const CampusMapPage = lazy(() => import('@/pages/CampusMapPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

/**
 * Students use CampusFix without an account (public routes). Teachers and
 * maintenance staff sign in for the dashboard; admins also manage locations.
 *
 * To add a page: create it in src/pages, add a lazy import + <Route> below,
 * and a sidebar link in src/data/navigation.js.
 */
export default function App() {
  if (!isSupabaseConfigured) return <SetupPage />

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Full-screen routes without the app shell */}
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />

        <Route element={<AppLayout />}>
          {/* Public: students can only report an issue (no account needed) */}
          <Route index element={<ReportPage />} />
          {/* QR codes point here: /r/CL-LAB-2 */}
          <Route path="r/:locationCode" element={<ReportPage />} />
          {/* Reached only via the "Track it" link after submitting a report */}
          <Route path="tickets/:ticketNumber" element={<TicketPage />} />

          {/* Teachers & staff */}
          <Route element={<RequireAuth roles={STAFF_ROLES} />}>
            <Route path="dashboard" element={<StaffDashboard />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
            <Route path="tickets" element={<TicketsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="campus-map" element={<CampusMapPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route element={<RequireAuth roles={['admin']} />}>
            <Route path="locations" element={<LocationsPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
