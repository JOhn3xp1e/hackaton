import { itemsService } from '../services/items.service.js'
import { created, ok, paginationMeta } from '../utils/response.js'

/**
 * Controllers: translate HTTP ⇄ service calls. Keep them thin —
 * validation lives in validators/, logic and data access in services/.
 * (Express 5 forwards thrown/rejected errors to errorHandler automatically.)
 */
export const itemsController = {
  async list(req, res) {
    const query = req.valid.query
    const { rows, total } = await itemsService.list(query)
    ok(res, rows, paginationMeta({ page: query.page, pageSize: query.pageSize, total }))
  },

  async getById(req, res) {
    ok(res, await itemsService.getById(req.valid.params.id))
  },

  async create(req, res) {
    created(res, await itemsService.create(req.valid.body))
  },

  async update(req, res) {
    ok(res, await itemsService.update(req.valid.params.id, req.valid.body))
  },

  async remove(req, res) {
    await itemsService.remove(req.valid.params.id)
    ok(res, null)
  },
}
