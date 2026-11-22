/**
 * Throw an ApiError anywhere (controller, service, middleware) and the central
 * error handler turns it into a consistent JSON response.
 *
 *   throw ApiError.notFound('Item not found')
 *   throw new ApiError(409, 'CONFLICT', 'Email already registered')
 */
export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }

  static badRequest(message = 'Bad request', details) {
    return new ApiError(400, 'BAD_REQUEST', message, details)
  }
  static validation(details, message = 'Validation failed') {
    return new ApiError(422, 'VALIDATION_ERROR', message, details)
  }
  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, 'UNAUTHORIZED', message)
  }
  static forbidden(message = 'You do not have access to this resource') {
    return new ApiError(403, 'FORBIDDEN', message)
  }
  static notFound(message = 'Resource not found') {
    return new ApiError(404, 'NOT_FOUND', message)
  }
  static conflict(message = 'Resource already exists') {
    return new ApiError(409, 'CONFLICT', message)
  }
  static internal(message = 'Internal server error') {
    return new ApiError(500, 'INTERNAL_ERROR', message)
  }
}
