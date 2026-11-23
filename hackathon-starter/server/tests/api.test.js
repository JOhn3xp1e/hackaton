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
  test('POST /triage without a token → 401', async () => {
    const { status, body } = await call('POST', '/triage', { title: 'Computer 15 will not boot' })
    assert.equal(status, 401)
    assert.equal(body.success, false)
    assert.equal(body.error.code, 'UNAUTHORIZED')
  })

  test('POST /triage with a malformed Authorization header → 401', async () => {
    const { status } = await call('POST', '/triage', { title: 'Projector flickers' }, { Authorization: 'Token abc' })
    assert.equal(status, 401)
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

describe('errors', () => {
  test('unknown route → 404 envelope', async () => {
    const { status, body } = await call('GET', '/does-not-exist')
    assert.equal(status, 404)
    assert.equal(body.success, false)
  })
})
