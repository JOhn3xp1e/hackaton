import { supabase } from '../config/supabase.js'
import { ApiError } from '../utils/ApiError.js'
import { keysToCamel, keysToSnake, toSnake } from '../utils/case.js'
import { createMemoryTable } from './memoryStore.js'

/**
 * Items service — business logic + data access for the `items` resource.
 *
 * Two interchangeable implementations with the SAME interface:
 *   - supabaseRepo  → PostgreSQL via @supabase/supabase-js (when env is set)
 *   - memoryRepo    → in-memory Map (fallback, resets on restart)
 *
 * Controllers never know which one is active. To add a new resource, copy
 * this file and change TABLE + fields.
 */
const TABLE = 'items'

// Rows are returned camelCase: { id, title, description, status, priority, category, createdAt, updatedAt }

/* ───────────────────────── Supabase implementation ───────────────────────── */

function dbError(error) {
  // Map common Postgres error codes to friendly API errors
  if (error.code === '23505') return ApiError.conflict('A record with these values already exists')
  if (error.code === '23503') return ApiError.badRequest('Referenced record does not exist')
  if (error.code === '23514') return ApiError.badRequest('A value violates a database constraint')
  if (error.code === 'PGRST116') return ApiError.notFound('Item not found')
  console.error('[supabase]', error)
  return ApiError.internal('Database error')
}

const supabaseRepo = {
  async list({ page, pageSize, search, status, sort, order }) {
    const from = (page - 1) * pageSize
    let query = supabase
      .from(TABLE)
      .select('*', { count: 'exact' })
      .order(toSnake(sort), { ascending: order === 'asc' })
      .range(from, from + pageSize - 1)

    if (status) query = query.eq('status', status)
    if (search) {
      const q = search.replace(/[,()%*\\]/g, ' ') // keep PostgREST filter syntax safe
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)
    }

    const { data, error, count } = await query
    if (error) throw dbError(error)
    return { rows: keysToCamel(data), total: count ?? 0 }
  },

  async getById(id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle()
    if (error) throw dbError(error)
    if (!data) throw ApiError.notFound('Item not found')
    return keysToCamel(data)
  },

  async create(input) {
    const { data, error } = await supabase.from(TABLE).insert(keysToSnake(input)).select().single()
    if (error) throw dbError(error)
    return keysToCamel(data)
  },

  async update(id, input) {
    const { data, error } = await supabase.from(TABLE).update(keysToSnake(input)).eq('id', id).select().maybeSingle()
    if (error) throw dbError(error)
    if (!data) throw ApiError.notFound('Item not found')
    return keysToCamel(data)
  },

  async remove(id) {
    const { data, error } = await supabase.from(TABLE).delete().eq('id', id).select('id')
    if (error) throw dbError(error)
    if (!data?.length) throw ApiError.notFound('Item not found')
  },

  async ping() {
    const { error } = await supabase.from(TABLE).select('id', { head: true, count: 'exact' }).limit(1)
    if (error) throw dbError(error)
  },
}

/* ───────────────────────── In-memory implementation ──────────────────────── */

const hours = (n) => new Date(Date.now() - n * 3600_000).toISOString()
const memory = createMemoryTable([
  { id: '6f1c2b1e-0000-4000-8000-000000000001', title: 'Set up project repository', description: 'Monorepo with client, server and database.', status: 'done', priority: 'high', category: 'Setup', createdAt: hours(30), updatedAt: hours(28) },
  { id: '6f1c2b1e-0000-4000-8000-000000000002', title: 'Design database schema', description: 'Tables, relations and RLS policies.', status: 'done', priority: 'high', category: 'Database', createdAt: hours(26), updatedAt: hours(20) },
  { id: '6f1c2b1e-0000-4000-8000-000000000003', title: 'Implement REST endpoints', description: 'CRUD for the core resource.', status: 'in_progress', priority: 'high', category: 'Backend', createdAt: hours(22), updatedAt: hours(2) },
  { id: '6f1c2b1e-0000-4000-8000-000000000004', title: 'Build dashboard overview', description: 'Stat cards, chart and activity table.', status: 'in_progress', priority: 'medium', category: 'Frontend', createdAt: hours(20), updatedAt: hours(1) },
  { id: '6f1c2b1e-0000-4000-8000-000000000005', title: 'Seed demo data', description: 'Realistic records for the final demo.', status: 'todo', priority: 'medium', category: 'Database', createdAt: hours(16), updatedAt: hours(16) },
  { id: '6f1c2b1e-0000-4000-8000-000000000006', title: 'Prepare demo script', description: '3-minute walkthrough of the core flow.', status: 'todo', priority: 'high', category: 'Docs', createdAt: hours(8), updatedAt: hours(8) },
])

const memoryRepo = {
  async list({ page, pageSize, search, status, sort, order }) {
    let rows = memory.list()
    if (status) rows = rows.filter((r) => r.status === status)
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter((r) => r.title.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q))
    }
    rows.sort((a, b) => {
      const cmp = String(a[sort]).localeCompare(String(b[sort]))
      return order === 'asc' ? cmp : -cmp
    })
    const from = (page - 1) * pageSize
    return { rows: rows.slice(from, from + pageSize), total: rows.length }
  },
  async getById(id) {
    const row = memory.get(id)
    if (!row) throw ApiError.notFound('Item not found')
    return row
  },
  async create(input) {
    return memory.insert(input)
  },
  async update(id, input) {
    const row = memory.update(id, input)
    if (!row) throw ApiError.notFound('Item not found')
    return row
  },
  async remove(id) {
    if (!memory.remove(id)) throw ApiError.notFound('Item not found')
  },
  async ping() {},
}

export const itemsService = supabase ? supabaseRepo : memoryRepo
export const itemsDataSource = supabase ? 'supabase' : 'memory'
