import { Router } from 'express'
import healthRoutes from './health.routes.js'
import itemsRoutes from './items.routes.js'

/**
 * API router — mounted at /api in app.js.
 * Add a resource: create routes/<name>.routes.js and register it here.
 */
const router = Router()

router.use('/health', healthRoutes)
router.use('/items', itemsRoutes)

export default router
