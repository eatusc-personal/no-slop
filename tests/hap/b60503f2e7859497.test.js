import { EventEmitter } from 'node:events'
import { describe, expect, it } from 'vitest'
import config from '../../vite.config.js'

describe('Vite /api/deslop methods', () => {
  it('rejects PUT with 405 and advertises GET and POST', async () => {
    let handler
    config.plugins[0].configureServer({ middlewares: { use(fn) { handler = fn } } })
    const req = new EventEmitter()
    Object.assign(req, { url: '/api/deslop', method: 'PUT', headers: {}, destroy() {} })
    let finish
    const done = new Promise((r) => { finish = r })
    const res = {
      writeHead(status, headers) { this.status = status; this.headers = headers },
      end(body = '') { this.body = body; finish() },
    }

    handler(req, res, () => {})
    req.emit('data', 'Leverage this robust platform.')
    req.emit('end')
    await done

    expect(res.status).toBe(405)
    expect(res.headers.Allow || res.headers.allow).toMatch(/GET/)
    expect(res.headers.Allow || res.headers.allow).toMatch(/POST/)
  })
})
