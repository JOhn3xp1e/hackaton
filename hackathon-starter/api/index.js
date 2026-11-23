// Vercel serverless entry: the whole Express app handles every /api/* request.
// Locally, keep using `npm run dev` (server/src/server.js calls app.listen).
import { createApp } from '../server/src/app.js'

export default createApp()
