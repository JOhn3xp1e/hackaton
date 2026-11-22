import { ApiError } from '../utils/ApiError.js'

/**
 * Request validation with Zod.
 *
 *   router.post('/', validate({ body: createItemSchema }), controller.create)
 *   router.get('/', validate({ query: listItemsQuerySchema }), controller.list)
 *
 * Parsed (coerced, defaulted, stripped) values are stored on `req.valid`
 * — use req.valid.body / req.valid.query / req.valid.params in controllers.
 * (Express 5 makes req.query read-only, so we never overwrite it.)
 *
 * Failure → 422 { error: { code: 'VALIDATION_ERROR', details: { field: message } } }
 */
export function validate(schemas) {
  return (req, res, next) => {
    req.valid = req.valid ?? {}
    const details = {}

    for (const part of ['params', 'query', 'body']) {
      const schema = schemas[part]
      if (!schema) continue
      const result = schema.safeParse(req[part] ?? {})
      if (result.success) {
        req.valid[part] = result.data
      } else {
        for (const issue of result.error.issues) {
          const key = issue.path.join('.') || part
          if (!details[key]) details[key] = issue.message
        }
      }
    }

    if (Object.keys(details).length) return next(ApiError.validation(details))
    next()
  }
}
