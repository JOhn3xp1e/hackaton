import { Router } from 'express'
import { itemsController } from '../controllers/items.controller.js'
import { validate } from '../middleware/validate.js'
import { createItemSchema, itemIdParams, listItemsQuery, updateItemSchema } from '../validators/items.schema.js'

const router = Router()

// GET    /api/items          list (pagination, search, filter, sort)
// GET    /api/items/:id      read one
// POST   /api/items          create
// PATCH  /api/items/:id      partial update
// DELETE /api/items/:id      delete
router.get('/', validate({ query: listItemsQuery }), itemsController.list)
router.get('/:id', validate({ params: itemIdParams }), itemsController.getById)
router.post('/', validate({ body: createItemSchema }), itemsController.create)
router.patch('/:id', validate({ params: itemIdParams, body: updateItemSchema }), itemsController.update)
router.delete('/:id', validate({ params: itemIdParams }), itemsController.remove)

export default router
