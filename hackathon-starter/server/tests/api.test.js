/**
 * API smoke tests — run with `npm test` (uses Node's built-in test runner, no deps).
 * Runs against the in-memory store unless SUPABASE_* env vars are set.
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

const call = async (method, path, body) => {
  const res = await fetch(base + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  return { status: res.status, body: await res.json() }
}

describe('health', () => {
  test('GET /health → 200 ok', async () => {
    const { status, body } = await call('GET', '/health')
    assert.equal(status, 200)
    assert.equal(body.success, true)
    assert.equal(body.data.status, 'ok')
  })

  test('GET /health/db → 200', async () => {
    const { status } = await call('GET', '/health/db')
    assert.equal(status, 200)
  })
})

describe('items CRUD', () => {
  let id

  test('GET /items → paginated list', async () => {
    const { status, body } = await call('GET', '/items?page=1&pageSize=2')
    assert.equal(status, 200)
    assert.ok(Array.isArray(body.data))
    assert.ok(body.data.length <= 2)
    assert.deepEqual(Object.keys(body.meta).sort(), ['page', 'pageSize', 'total', 'totalPages'])
  })

  test('POST /items with invalid body → 422 with field details', async () => {
    const { status, body } = await call('POST', '/items', { title: 'x', status: 'nope' })
    assert.equal(status, 422)
    assert.equal(body.success, false)
    assert.equal(body.error.code, 'VALIDATION_ERROR')
    assert.ok(body.error.details.title)
    assert.ok(body.error.details.status)
    assert.ok(body.error.details.category)
  })

  test('POST /items → 201 created with defaults', async () => {
    const { status, body } = await call('POST', '/items', { title: 'Test item', category: 'Testing' })
    assert.equal(status, 201)
    assert.equal(body.data.title, 'Test item')
    assert.equal(body.data.status, 'todo')
    assert.equal(body.data.priority, 'medium')
    assert.ok(body.data.id)
    assert.ok(body.data.createdAt)
    id = body.data.id
  })

  test('GET /items/:id → 200', async () => {
    const { status, body } = await call('GET', `/items/${id}`)
    assert.equal(status, 200)
    assert.equal(body.data.id, id)
  })

  test('PATCH /items/:id → only updates provided fields', async () => {
    await call('PATCH', `/items/${id}`, { status: 'in_progress' })
    const { status, body } = await call('PATCH', `/items/${id}`, { title: 'Renamed item' })
    assert.equal(status, 200)
    assert.equal(body.data.title, 'Renamed item')
    assert.equal(body.data.status, 'in_progress', 'status must not be reset to default')
  })

  test('PATCH with empty body → 422', async () => {
    const { status } = await call('PATCH', `/items/${id}`, {})
    assert.equal(status, 422)
  })

  test('GET /items?search= finds the item', async () => {
    const { body } = await call('GET', '/items?search=renamed')
    assert.ok(body.data.some((r) => r.id === id))
  })

  test('DELETE /items/:id → 200, then 404', async () => {
    assert.equal((await call('DELETE', `/items/${id}`)).status, 200)
    const { status, body } = await call('GET', `/items/${id}`)
    assert.equal(status, 404)
    assert.equal(body.error.code, 'NOT_FOUND')
  })

  test('GET /items/not-a-uuid → 422', async () => {
    const { status } = await call('GET', '/items/not-a-uuid')
    assert.equal(status, 422)
  })
})

describe('errors', () => {
  test('unknown route → 404 JSON', async () => {
    const { status, body } = await call('GET', '/does-not-exist')
    assert.equal(status, 404)
    assert.equal(body.success, false)
  })

  test('malformed JSON → 400', async () => {
    const res = await fetch(`${base}/items`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' })
    assert.equal(res.status, 400)
    assert.equal((await res.json()).error.code, 'BAD_REQUEST')
  })
})
