import { api } from './apiClient'

/**
 * Staff-only CampusFix Assistant (Groq) via the Express server, which reads
 * live ticket data with read-only tools. The Supabase access token is attached
 * by AuthProvider through setAuthToken().
 *
 * @param {{ role: 'user'|'assistant', content: string }[]} messages
 * @returns {Promise<{ reply: string, ticketNumbers: string[], toolsUsed: string[] }>}
 */
export const chatService = {
  async ask(messages, { signal } = {}) {
    const { data } = await api.post('/chat', { messages }, { timeout: 90000, signal })
    return data
  },
}
