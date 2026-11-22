/**
 * ⚠️ MOCK DATA — dashboard demo only. Replace via services/dashboardService.js
 * once a real `/api/stats` (or similar) endpoint exists.
 */
export const mockUser = {
  id: 'u-001',
  name: 'Alex Rivera',
  email: 'alex@example.com',
  role: 'Frontend Developer',
  avatarUrl: '',
}

export const mockStats = [
  { key: 'users', label: 'Active users', value: 2847, delta: 12.4, hint: 'vs last week', spark: [12, 18, 15, 22, 20, 26, 31] },
  { key: 'revenue', label: 'Revenue', value: 48290, delta: 8.1, hint: 'vs last week', format: 'currency', spark: [30, 28, 35, 33, 40, 44, 48] },
  { key: 'tasks', label: 'Tasks completed', value: 1294, delta: -3.2, hint: 'vs last week', spark: [40, 38, 42, 37, 35, 36, 34] },
  { key: 'response', label: 'Avg. response (ms)', value: 182, delta: -14.6, hint: 'faster', invertTrend: true, spark: [260, 240, 230, 210, 205, 190, 182] },
]

export const mockTrend = [
  { label: 'Jan', current: 3200, previous: 2800 },
  { label: 'Feb', current: 3900, previous: 3100 },
  { label: 'Mar', current: 3600, previous: 3400 },
  { label: 'Apr', current: 4800, previous: 3600 },
  { label: 'May', current: 5200, previous: 4100 },
  { label: 'Jun', current: 4900, previous: 4400 },
  { label: 'Jul', current: 6100, previous: 4700 },
  { label: 'Aug', current: 6800, previous: 5000 },
  { label: 'Sep', current: 6400, previous: 5300 },
  { label: 'Oct', current: 7600, previous: 5600 },
  { label: 'Nov', current: 8200, previous: 6100 },
  { label: 'Dec', current: 8900, previous: 6400 },
]

export const mockWeekly = [
  { label: 'Mon', value: 42 },
  { label: 'Tue', value: 58 },
  { label: 'Wed', value: 51 },
  { label: 'Thu', value: 74 },
  { label: 'Fri', value: 66 },
  { label: 'Sat', value: 28 },
  { label: 'Sun', value: 19 },
]

const now = Date.now()
const m = 60 * 1000

export const mockActivity = [
  { id: 'act-1', user: 'Jordan Lee', action: 'Created item', target: 'Implement REST endpoints', status: 'done', amount: 0, at: new Date(now - 4 * m).toISOString() },
  { id: 'act-2', user: 'Sam Patel', action: 'Updated schema', target: 'items table', status: 'in_progress', amount: 0, at: new Date(now - 18 * m).toISOString() },
  { id: 'act-3', user: 'Alex Rivera', action: 'Deployed preview', target: 'client@a1b2c3', status: 'done', amount: 0, at: new Date(now - 42 * m).toISOString() },
  { id: 'act-4', user: 'Jordan Lee', action: 'Opened PR', target: 'feat/items-api', status: 'pending', amount: 0, at: new Date(now - 75 * m).toISOString() },
  { id: 'act-5', user: 'Sam Patel', action: 'Seeded database', target: '24 rows', status: 'done', amount: 0, at: new Date(now - 130 * m).toISOString() },
  { id: 'act-6', user: 'Alex Rivera', action: 'Build failed', target: 'client@9f8e7d', status: 'failed', amount: 0, at: new Date(now - 200 * m).toISOString() },
]

export const mockNotifications = [
  { id: 'n-1', title: 'PR ready for review', body: 'feat/items-api by Jordan', at: new Date(now - 6 * m).toISOString(), read: false },
  { id: 'n-2', title: 'Schema updated', body: 'Sam added `category` to items', at: new Date(now - 35 * m).toISOString(), read: false },
  { id: 'n-3', title: 'Checkpoint in 1 hour', body: 'Mentors will visit tables at 14:00', at: new Date(now - 90 * m).toISOString(), read: true },
]
