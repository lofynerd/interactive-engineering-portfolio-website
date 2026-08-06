// Minimal, dependency-free HTTP server for the "break-it" demo target.
// Its only jobs: respond 200 on /health for the ALB health check, and
// report a stable task identifier so the frontend can show which task
// answered (useful for demonstrating that traffic moved to a *different*
// task after a break).
const http = require('http')
const os = require('os')

const PORT = process.env.PORT || 8080
// ECS injects a unique container/task hostname; fall back to a random id
// for local testing outside ECS.
const TASK_ID = process.env.ECS_TASK_ARN || os.hostname()
const startedAt = Date.now()

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', taskId: TASK_ID, uptimeMs: Date.now() - startedAt }))
    return
  }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(
    JSON.stringify({
      message: 'break-it-demo target',
      taskId: TASK_ID,
      uptimeMs: Date.now() - startedAt,
    })
  )
})

server.listen(PORT, () => {
  console.log(`demo-app listening on ${PORT}, taskId=${TASK_ID}`)
})

// Respond to SIGTERM promptly so ECS task stop/replace cycles feel snappy
// in the demo rather than waiting out a long grace period.
process.on('SIGTERM', () => {
  server.close(() => process.exit(0))
})
