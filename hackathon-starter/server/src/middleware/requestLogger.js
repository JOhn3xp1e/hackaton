/** Minimal colourised request logger: "GET /api/items 200 12ms" */
export function requestLogger(req, res, next) {
  const start = process.hrtime.bigint()
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6
    const color = res.statusCode >= 500 ? 31 : res.statusCode >= 400 ? 33 : 32
    console.log(`\x1b[2m${new Date().toISOString().slice(11, 19)}\x1b[0m ${req.method} ${req.originalUrl} \x1b[${color}m${res.statusCode}\x1b[0m ${ms.toFixed(0)}ms`)
  })
  next()
}
