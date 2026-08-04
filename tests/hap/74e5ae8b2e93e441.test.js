import { EventEmitter } from 'node:events'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const spawnMock = vi.hoisted(() => vi.fn())
vi.mock('node:child_process', () => ({ spawn: spawnMock }))

function failedChild() {
  const child = new EventEmitter()
  child.stdout = new EventEmitter()
  child.stderr = new EventEmitter()
  child.kill = vi.fn()
  return child
}

function response() {
  let resolve
  const done = new Promise((r) => { resolve = r })
  return {
    writeHead(status, headers) { this.status = status; this.headers = headers },
    end(body = '') { this.body = body; resolve(this) },
    done,
  }
}

describe('CLI rewrite process outcome', () => {
  beforeEach(() => spawnMock.mockReset())

  it('does not return a successful rewrite from stdout when the CLI exits nonzero', async () => {
    const child = failedChild()
    spawnMock.mockReturnValue(child)
    const { default: config } = await import('../../vite.config.js?hap-cli-nonzero')
    let handler
    config.plugins[0].configureServer({ middlewares: { use(fn) { handler = fn } } })
    const req = new EventEmitter()
    Object.assign(req, { url: '/api/rewrite', method: 'POST', headers: {}, destroy() {} })
    const res = response()

    handler(req, res, () => {})
    req.emit('data', JSON.stringify({ text: 'Rewrite this.', engine: 'claude' }))
    req.emit('end')
    await vi.waitFor(() => expect(spawnMock).toHaveBeenCalled())
    child.stdout.emit('data', 'partial rewrite')
    child.emit('close', 2)
    const completed = await res.done

    expect(completed.status).toBe(500)
    expect(JSON.parse(completed.body).error).toMatch(/exited|failed|code 2/i)
  })
})
