import { api } from './apiClient'

/**
 * Claude-powered triage via the Express server (needs the server-side
 * ANTHROPIC_API_KEY). The Supabase access token is attached by AuthProvider
 * through setAuthToken().
 *
 * @param {{ title: string, description?: string, assetLabel?: string, locationName?: string }} report
 * @returns {Promise<{ category: string, severity: string, summary: string }>}
 */
export const triageService = {
  async suggest(report) {
    const { data } = await api.post('/triage', report, { timeout: 45000 })
    return data
  },
}
