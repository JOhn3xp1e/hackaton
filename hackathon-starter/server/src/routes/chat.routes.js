import { Router } from 'express'
import { chatController } from '../controllers/chat.controller.js'
import { rateLimit } from '../middleware/rateLimit.js'
import { requireStaff } from '../middleware/requireStaff.js'
import { validate } from '../middleware/validate.js'
import { chatRequestSchema } from '../validators/chat.schema.js'

const router = Router()

// POST /api/chat   Staff-only Groq assistant that answers from live ticket data.
router.post(
  '/',
  rateLimit({ max: 30, windowMs: 5 * 60_000, message: 'The assistant is limited to 30 questions every 5 minutes. Please wait a moment.' }),
  requireStaff,
  validate({ body: chatRequestSchema }),
  chatController.ask,
)

export default router
