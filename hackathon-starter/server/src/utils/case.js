/**
 * PostgreSQL uses snake_case, JavaScript uses camelCase.
 * Convert at the service boundary so the API contract is always camelCase.
 */
const toCamel = (s) => s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase())
const toSnake = (s) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)

const mapKeys = (fn) => (obj) => {
  if (Array.isArray(obj)) return obj.map(mapKeys(fn))
  if (obj === null || typeof obj !== 'object' || obj instanceof Date) return obj
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [fn(k), v]))
}

export const keysToCamel = mapKeys(toCamel)
export const keysToSnake = mapKeys(toSnake)
export { toCamel, toSnake }
