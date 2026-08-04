import { EventEmitter } from 'node:events'
import { describe, expect, it } from 'vitest'
import config from '../../vite.config.js'

function apiHandler() {
  let handler
  config.plugins[0].configureServer({ middlewares: { use(fn) { handler = fn } } })
  return handler
}

function response() {
  let resolve
  const done = new Promise((r) => { resolve = r })
  return {
    status: undefined,
    headers: undefined,
    body: '',
    writeHead(status, headers) { this.status = status; this.headers = headers },
    end(body = '') { this.body = body; resolve(this) },
    done,
  }
}

describe('Vite request body size limit', () => {
  it('rejects a raw /api/deslop body larger than the declared 4MB cap', async () => {
    const req = new EventEmitter()
    Object.assign(req, {
      url: '/api/deslop',
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      destroy() {},
    })
    const res = response()

    apiHandler()(req, res, () => {})
    req.emit('data', 'x'.repeat(4 * 1024 * 1024 + 1))
    const completed = await res.done

    expect(completed.status).toBeGreaterThanOrEqual(400)
    expect(completed.status).toBeLessThan(500)
    expect(completed.body.toLowerCase()).toMatch(/too (?:large|big)|size|limit/)
  })
})
