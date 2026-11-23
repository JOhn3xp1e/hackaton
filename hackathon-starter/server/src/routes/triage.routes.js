import { Router } from 'express'
import { triageController } from '../controllers/triage.controller.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { validate } from '../middleware/validate.js'
import { triageRequestSchema } from '../validators/triage.schema.js'

const router = Router()

// POST /api/triage   Claude suggests category, severity and a one-line summary
router.post('/', requireAuth, validate({ body: triageRequestSchema }), triageController.suggest)

export default router
