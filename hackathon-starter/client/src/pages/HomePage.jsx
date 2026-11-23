import { useAuth } from '@/providers/AuthProvider'
import ReporterHome from './home/ReporterHome'
import StaffDashboard from './home/StaffDashboard'

/** "/" — reporters get a quick-report home, staff get the maintenance dashboard. */
export default function HomePage() {
  const { isStaff } = useAuth()
  return isStaff ? <StaffDashboard /> : <ReporterHome />
}
