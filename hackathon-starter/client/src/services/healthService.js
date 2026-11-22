import { api } from './apiClient'

/** Always hits the real API (used by Settings → "Test connection"). */
export const healthService = {
  check: () => api.get('/health', { timeout: 5000 }),
}
