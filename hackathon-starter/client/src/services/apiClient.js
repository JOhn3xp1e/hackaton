import { config } from '@/lib/config'

/**
 * Centralised HTTP client. Every service calls the API through here so that
 * base URL, headers, timeouts, auth tokens and error shapes live in ONE place.
 *
 * The Express API always answers with:
 *   success → { success: true, data, meta? }
 *   failure → { success: false, error: { code, message, details? } }
 * `request()` unwraps that envelope: it resolves with { data, meta } or throws ApiError.
 */

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'UNKNOWN_ERROR', details } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

let authToken = null
/** Call after login if you add auth later: setAuthToken(session.access_token) */
export const setAuthToken = (token) => {
  authToken = token
}

function buildUrl(path, params) {
  const url = `${config.apiUrl}${path.startsWith('/') ? path : `/${path}`}`
  if (!params) return url
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.append(k, String(v))
  })
  const s = qs.toString()
  return s ? `${url}?${s}` : url
}

export async function request(path, { method = 'GET', body, params, headers, timeout = 15000, signal } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(new DOMException('Request timed out', 'TimeoutError')), timeout)
  signal?.addEventListener('abort', () => controller.abort(signal.reason))

  let res
  try {
    res = await fetch(buildUrl(path, params), {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
  } catch (err) {
    clearTimeout(timer)
    const timedOut = err?.name === 'TimeoutError' || controller.signal.reason?.name === 'TimeoutError'
    throw new ApiError(timedOut ? 'The server took too long to respond.' : 'Cannot reach the server. Is the API running?', {
      code: timedOut ? 'TIMEOUT' : 'NETWORK_ERROR',
    })
  }
  clearTimeout(timer)

  if (res.status === 204) return { data: null, meta: undefined }

  let json = null
  try {
    json = await res.json()
  } catch {
    /* non-JSON response */
  }

  if (!res.ok || json?.success === false) {
    const e = json?.error ?? {}
    throw new ApiError(e.message || res.statusText || 'Request failed', {
      status: res.status,
      code: e.code || `HTTP_${res.status}`,
      details: e.details,
    })
  }

  return { data: json?.data ?? json, meta: json?.meta }
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  delete: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
}
