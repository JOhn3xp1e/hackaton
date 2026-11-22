/**
 * Consistent success responses. Every endpoint returns:
 *   { "success": true, "data": <payload>, "meta": { ...optional } }
 * Errors are formatted by middleware/errorHandler.js:
 *   { "success": false, "error": { "code", "message", "details?" } }
 */
export function ok(res, data, meta, status = 200) {
  const body = { success: true, data }
  if (meta) body.meta = meta
  return res.status(status).json(body)
}

export const created = (res, data) => ok(res, data, undefined, 201)

export const paginationMeta = ({ page, pageSize, total }) => ({
  page,
  pageSize,
  total,
  totalPages: Math.max(1, Math.ceil(total / pageSize)),
})
