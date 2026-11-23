import { Navigate, Outlet, useLocation } from 'react-router'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { PageLoader } from '@/components/feedback/LoadingSkeleton'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'

/**
 * Route guard. Unauthenticated users go to /login?next=<current url>, so a
 * scanned QR link survives the sign-in step.
 *
 *   <Route element={<RequireAuth />}>…</Route>             any signed-in user
 *   <Route element={<RequireAuth roles={['admin']} />}>…   role-gated
 */
export function RequireAuth({ roles, children }) {
  const { user, profile, profileError, isLoading, refreshProfile } = useAuth()
  const location = useLocation()

  if (isLoading) return <PageLoader label="Checking your session" />

  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }

  if (!profile) {
    if (profileError) {
      return <ErrorState title="Could not load your profile" description={profileError} onRetry={refreshProfile} className="m-6" />
    }
    return <PageLoader label="Loading your profile" />
  }

  if (roles && !roles.includes(profile.role)) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Staff only"
        description="This page is for maintenance staff and administrators."
        className="m-6"
      />
    )
  }

  return children ?? <Outlet />
}
