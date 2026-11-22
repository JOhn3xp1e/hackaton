import { config } from '@/lib/config'
import { mockActivity, mockNotifications, mockStats, mockTrend, mockUser, mockWeekly } from '@/data/mock/dashboard'
import { api } from './apiClient'
import { mockResponse } from './mockAdapter'

/**
 * Dashboard service. The backend starter does not ship /stats endpoints yet,
 * so the real branch shows WHERE to plug them in once they exist.
 */
const mock = {
  getOverview: () =>
    mockResponse({ stats: mockStats, trend: mockTrend, weekly: mockWeekly, activity: mockActivity }, { delay: 500 }),
  getNotifications: () => mockResponse(mockNotifications),
  getCurrentUser: () => mockResponse(mockUser, { delay: 100 }),
}

const http = {
  getOverview: () => api.get('/stats/overview'),
  getNotifications: () => api.get('/notifications'),
  getCurrentUser: () => api.get('/me'),
}

// Dashboard stays on mocks until its endpoints exist — flip to `config.useMocks ? mock : http` when ready.
const USE_REAL_DASHBOARD_API = false

export const dashboardService = !config.useMocks && USE_REAL_DASHBOARD_API ? http : mock
