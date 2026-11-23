import { Router } from 'express'
import healthRoutes from './health.routes.js'
import triageRoutes from './triage.routes.js'

/**
 * API router — mounted at /api in app.js.
 * Only operations that need server-side secrets live here; regular CRUD goes
 * from the React client straight to Supabase (see CLAUDE.md).
 */
const router = Router()

router.use('/health', healthRoutes)
router.use('/triage', triageRoutes)

export default router
