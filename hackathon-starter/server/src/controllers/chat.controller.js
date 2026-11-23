import { chatService } from '../services/chat.service.js'
import { ok } from '../utils/response.js'

export const chatController = {
  async ask(req, res) {
    const result = await chatService.ask(req.valid.body.messages, req.user)
    ok(res, result)
  },
}
