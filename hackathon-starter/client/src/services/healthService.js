import { api } from './apiClient'

/** Always hits the real API (used by Settings → "Test connection"). */
export const healthService = {
  check: (opts = {}) => api.get('/health', { timeout: 5000, ...opts }),
}
