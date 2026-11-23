import { triageService } from '../services/triage.service.js'
import { ok } from '../utils/response.js'

export const triageController = {
  async suggest(req, res) {
    const suggestion = await triageService.suggest(req.valid.body)
    ok(res, suggestion)
  },
}
