import { config } from '@/lib/config'
import { uid } from '@/lib/utils'
import { mockItems } from '@/data/mock/items'
import { api } from './apiClient'
import { createMockCollection, mockError, mockResponse } from './mockAdapter'

/**
 * Items service — the ONLY place pages get item data from.
 *
 * Switching mock → real API: set VITE_USE_MOCKS=false in client/.env.
 * Both branches return the same shape, so pages never change:
 *   list()   → { data: Item[], meta: { page, pageSize, total, totalPages } }
 *   get()    → { data: Item }
 *   create() → { data: Item }
 *   update() → { data: Item }
 *   remove() → { data: null }
 *
 * To add a new resource: copy this file, rename "items" and adjust fields.
 */

const store = createMockCollection(mockItems)

const mock = {
  async list({ page = 1, pageSize = 10, search = '', status = '', sort = 'createdAt', order = 'desc' } = {}) {
    let rows = store.all()
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter((r) => r.title.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q))
    }
    if (status) rows = rows.filter((r) => r.status === status)
    rows = [...rows].sort((a, b) => {
      const cmp = String(a[sort]).localeCompare(String(b[sort]))
      return order === 'asc' ? cmp : -cmp
    })
    const total = rows.length
    const start = (page - 1) * pageSize
    return mockResponse(rows.slice(start, start + pageSize), {
      meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    })
  },
  async get(id) {
    const row = store.find(id)
    return row ? mockResponse(row) : mockError('Item not found', { status: 404, code: 'NOT_FOUND' })
  },
  async create(input) {
    const ts = new Date().toISOString()
    return mockResponse(store.insert({ id: uid(), ...input, createdAt: ts, updatedAt: ts }))
  },
  async update(id, input) {
    const row = store.update(id, { ...input, updatedAt: new Date().toISOString() })
    return row ? mockResponse(row) : mockError('Item not found', { status: 404, code: 'NOT_FOUND' })
  },
  async remove(id) {
    return store.remove(id) ? mockResponse(null) : mockError('Item not found', { status: 404, code: 'NOT_FOUND' })
  },
}

const http = {
  list: (params) => api.get('/items', { params }),
  get: (id) => api.get(`/items/${id}`),
  create: (input) => api.post('/items', input),
  update: (id, input) => api.patch(`/items/${id}`, input),
  remove: (id) => api.delete(`/items/${id}`),
}

export const itemsService = config.useMocks ? mock : http
