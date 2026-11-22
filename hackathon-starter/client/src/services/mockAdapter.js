import { sleep } from '@/lib/utils'
import { ApiError } from './apiClient'

/**
 * Helpers that make mock services behave like the real API:
 * network latency, the same { data, meta } shape and the same ApiError.
 */
export async function mockResponse(data, { meta, delay = 350 } = {}) {
  await sleep(delay + Math.random() * 200)
  return { data: structuredClone(data), meta }
}

export async function mockError(message, { status = 400, code = 'BAD_REQUEST', details, delay = 300 } = {}) {
  await sleep(delay)
  throw new ApiError(message, { status, code, details })
}

/** In-memory collection with CRUD — state survives until page reload. */
export function createMockCollection(seed = []) {
  let rows = structuredClone(seed)
  return {
    all: () => rows,
    find: (id) => rows.find((r) => r.id === id),
    insert: (row) => {
      rows = [row, ...rows]
      return row
    },
    update: (id, patch) => {
      let updated = null
      rows = rows.map((r) => (r.id === id ? (updated = { ...r, ...patch }) : r))
      return updated
    },
    remove: (id) => {
      const before = rows.length
      rows = rows.filter((r) => r.id !== id)
      return rows.length < before
    },
  }
}
