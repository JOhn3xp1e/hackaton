import { Router } from 'express'
import { triageController } from '../controllers/triage.controller.js'
import { rateLimit } from '../middleware/rateLimit.js'
import { validate } from '../middleware/validate.js'
import { triageRequestSchema } from '../validators/triage.schema.js'

const router = Router()

// POST /api/triage   Claude suggests category, severity and a one-line summary.
// Public (students report without an account), so it is rate limited per IP.
router.post(
  '/',
  rateLimit({ max: 10, windowMs: 5 * 60_000, message: 'AI suggestions are limited to 10 every 5 minutes. Please pick the category yourself.' }),
  validate({ body: triageRequestSchema }),
  triageController.suggest,
)

export default router
