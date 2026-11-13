import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import { createServer } from 'vite'

// Regression: /api/doc/<name> matched \w+, so inherited keys such as
// "constructor" and "__proto__" passed the DOCS lookup. A POST then wrote a
// stray "[object Object].tmp" (or "function Object() {...}.tmp") file into the
// project root before failing with a 500.

const STRAY = ['[object Object].tmp', 'function Object() { [native code] }.tmp']

test('inherited object keys are not treated as editable docs', async () => {
  const server = await createServer({ server: { port: 0, strictPort: false }, logLevel: 'silent' })
  await server.listen()
  const { port } = server.httpServer.address()
  try {
    for (const name of ['constructor', '__proto__', 'toString', 'hasOwnProperty']) {
      for (const method of ['GET', 'POST']) {
        const res = await fetch(`http://127.0.0.1:${port}/api/doc/${name}`, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: method === 'POST' ? JSON.stringify({ text: 'test' }) : undefined,
        })
        assert.notEqual(res.status, 500, `${method} /api/doc/${name} must not error`)
        if (method === 'POST') {
          assert.equal(res.status, 404, `POST /api/doc/${name} must be rejected`)
        }
      }
    }
    for (const f of STRAY) {
      assert.equal(fs.existsSync(f), false, `stray file created: ${f}`)
    }
  } finally {
    await server.close()
    for (const f of STRAY) { try { fs.unlinkSync(f) } catch (_) {} }
  }
})
