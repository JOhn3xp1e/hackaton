/**
 * API smoke tests — run with `npm test` (Node's built-in test runner, no deps).
 * These never call Claude: they cover health, auth and validation paths only.
 */
process.env.NODE_ENV = 'test'

import { after, before, describe, test } from 'node:test'
import assert from 'node:assert/strict'

const { createApp } = await import('../src/app.js')

let server
let base

before(async () => {
  server = createApp().listen(0)
  await new Promise((r) => server.once('listening', r))
  base = `http://127.0.0.1:${server.address().port}/api`
})

after(() => new Promise((r) => server.close(r)))

const call = async (method, path, body, headers = {}) => {
  const res = await fetch(base + path, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  })
  return { status: res.status, body: await res.json() }
}

describe('health', () => {
  test('GET /health → 200 with integration flags', async () => {
    const { status, body } = await call('GET', '/health')
    assert.equal(status, 200)
    assert.equal(body.success, true)
    assert.equal(body.data.status, 'ok')
    assert.equal(typeof body.data.supabase, 'boolean')
    assert.equal(typeof body.data.aiTriage, 'boolean')
  })
})

describe('triage', () => {
  // Only invalid bodies are sent, so Claude is never called even if
  // ANTHROPIC_API_KEY is present in server/.env.
  test('POST /triage is public but validates the body → 422', async () => {
    const { status, body } = await call('POST', '/triage', { title: 'x' })
    assert.equal(status, 422)
    assert.equal(body.success, false)
    assert.equal(body.error.code, 'VALIDATION_ERROR')
    assert.ok(body.error.details.title)
  })

  test('POST /triage with invalid JSON → 400', async () => {
    const res = await fetch(`${base}/triage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"title":',
    })
    assert.equal(res.status, 400)
  })
})

describe('chat', () => {
  // Never reaches Groq: every request here is rejected by auth first.
  test('POST /chat without a token → 401', async () => {
    const { status, body } = await call('POST', '/chat', { messages: [{ role: 'user', content: 'How many open tickets?' }] })
    assert.equal(status, 401)
    assert.equal(body.error.code, 'UNAUTHORIZED')
  })

  test('POST /chat with a bogus token → 401 or 503 (no Supabase)', async () => {
    const { status } = await call('POST', '/chat', { messages: [] }, { Authorization: 'Bearer not-a-real-token' })
    assert.ok([401, 503].includes(status), `got ${status}`)
  })
})

describe('rate limit', () => {
  test('POST /triage is limited to 10 requests per window → 429', async () => {
    let last
    for (let i = 0; i < 12; i++) last = await call('POST', '/triage', { title: '' })
    assert.equal(last.status, 429)
    assert.equal(last.body.error.code, 'RATE_LIMITED')
  })
})

describe('errors', () => {
  test('unknown route → 404 envelope', async () => {
    const { status, body } = await call('GET', '/does-not-exist')
    assert.equal(status, 404)
    assert.equal(body.success, false)
  })
})
