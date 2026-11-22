import { randomUUID } from 'node:crypto'

/**
 * In-memory table used when Supabase is not configured.
 * Data resets on every server restart — perfect for early development and tests.
 */
export function createMemoryTable(seed = []) {
  const rows = new Map(seed.map((r) => [r.id, { ...r }]))

  return {
    list() {
      return [...rows.values()]
    },
    get(id) {
      return rows.get(id) ?? null
    },
    insert(data) {
      const now = new Date().toISOString()
      const row = { id: randomUUID(), ...data, createdAt: now, updatedAt: now }
      rows.set(row.id, row)
      return row
    },
    update(id, patch) {
      const existing = rows.get(id)
      if (!existing) return null
      const row = { ...existing, ...patch, id, updatedAt: new Date().toISOString() }
      rows.set(id, row)
      return row
    },
    remove(id) {
      return rows.delete(id)
    },
    clear() {
      rows.clear()
    },
  }
}
