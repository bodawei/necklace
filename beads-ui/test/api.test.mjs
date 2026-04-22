import { test } from 'node:test'
import assert from 'node:assert/strict'

const BASE = process.env.API_BASE ?? 'http://localhost:3000'

async function api(method, path, body) {
  const opts = { method, headers: {} }
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(body)
  }
  const res = await fetch(`${BASE}${path}`, opts)
  const json = await res.json().catch(() => null)
  return { status: res.status, body: json }
}

async function cleanup(id) {
  if (id) await api('DELETE', `/api/beads/${id}`)
}

// ── List ──────────────────────────────────────────────────────────────────────

test('GET /api/beads returns an array', async () => {
  const { status, body } = await api('GET', '/api/beads')
  assert.equal(status, 200)
  assert.ok(Array.isArray(body), 'response should be an array')
})

test('GET /api/beads items have required fields', async () => {
  const { status, body } = await api('GET', '/api/beads')
  assert.equal(status, 200)
  assert.ok(body.length > 0, 'should have at least one bead')
  const item = body[0]
  for (const field of ['id', 'title', 'status', 'issue_type', 'priority']) {
    assert.ok(field in item, `item should have field "${field}"`)
  }
})

// ── Create ────────────────────────────────────────────────────────────────────

test('POST /api/beads creates a bead', async () => {
  const { status, body } = await api('POST', '/api/beads', {
    title: 'api-test bead',
    issue_type: 'task',
    priority: 3,
  })
  try {
    assert.equal(status, 201)
    assert.ok(body.id, 'response should include an id')
    assert.equal(body.title, 'api-test bead')
    assert.equal(body.status, 'open')
  } finally {
    await cleanup(body?.id)
  }
})

test('POST /api/beads with missing title returns 400', async () => {
  const { status, body } = await api('POST', '/api/beads', { issue_type: 'task' })
  assert.equal(status, 400)
  assert.ok(body?.error, 'response should include an error message')
})

// ── Show ──────────────────────────────────────────────────────────────────────

test('GET /api/beads/:id returns the bead', async () => {
  const { body: created } = await api('POST', '/api/beads', { title: 'api-test show' })
  try {
    const { status, body } = await api('GET', `/api/beads/${created.id}`)
    assert.equal(status, 200)
    assert.equal(body.id, created.id)
    assert.equal(body.title, 'api-test show')
  } finally {
    await cleanup(created?.id)
  }
})

test('GET /api/beads/:id returns 404 for unknown id', async () => {
  const { status } = await api('GET', '/api/beads/hq-does-not-exist-xyzzy')
  assert.equal(status, 404)
})

// ── Update ────────────────────────────────────────────────────────────────────

test('PATCH /api/beads/:id updates the bead', async () => {
  const { body: created } = await api('POST', '/api/beads', { title: 'api-test update' })
  try {
    const { status, body } = await api('PATCH', `/api/beads/${created.id}`, {
      title: 'api-test update EDITED',
      issue_type: 'task',
      priority: 1,
    })
    assert.equal(status, 200)
    assert.equal(body.title, 'api-test update EDITED')
    assert.equal(body.priority, 1)
  } finally {
    await cleanup(created?.id)
  }
})

test('PATCH /api/beads/:id with missing title returns 400', async () => {
  const { body: created } = await api('POST', '/api/beads', { title: 'api-test patch 400' })
  try {
    const { status, body } = await api('PATCH', `/api/beads/${created.id}`, { priority: 1 })
    assert.equal(status, 400)
    assert.ok(body?.error)
  } finally {
    await cleanup(created?.id)
  }
})

// ── Delete ────────────────────────────────────────────────────────────────────

test('DELETE /api/beads/:id removes the bead', async () => {
  const { body: created } = await api('POST', '/api/beads', { title: 'api-test delete' })
  const id = created.id

  const { status, body } = await api('DELETE', `/api/beads/${id}`)
  assert.equal(status, 200)
  assert.equal(body.ok, true)

  const { status: getStatus } = await api('GET', `/api/beads/${id}`)
  assert.equal(getStatus, 404, 'deleted bead should return 404')
})
