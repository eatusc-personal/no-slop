import fs from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * Reads exRow out of the source and evaluates it on its own.
 *
 * src/main.js touches document at module scope, so it cannot be imported here;
 * lifting the one function out is the way to reach it from node. Its escaping
 * helper is lifted with it, because that helper is shared with the rest of the
 * file rather than defined inside exRow. Only how the function is reached has
 * changed. Every assertion below is the one that first caught this defect.
 */
function loadExRow() {
  const source = fs.readFileSync(new URL('../../src/main.js', import.meta.url), 'utf8')
  const escStart = source.indexOf('const esc = ')
  const escEnd = source.indexOf('\nconst input', escStart)
  const esc = source.slice(escStart, escEnd)

  const start = source.indexOf('function exRow(')
  const end = source.indexOf('\n}\n\nfunction renderExList', start) + 2
  const exRow = source.slice(start, end)

  if (!esc.includes('replaceAll') || !exRow.includes('esc(')) {
    throw new Error('src/main.js no longer has the shape this test reads it with')
  }
  return Function(`${esc}\n${exRow}\nreturn exRow`)()
}

describe('example metadata rendering', () => {
  it('renders filename, slug, and stage as text rather than executable markup', () => {
    const exRow = loadExRow()
    const payload = '<img src=x onerror=alert(1)>'
    const html = exRow({
      file: `bad\" onmouseover=\"alert(1).txt`,
      slug: payload,
      stage: '<script>alert(1)</script>',
      sc: { color: 'red' },
    }, false)

    expect(html).not.toContain(payload)
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('onmouseover="alert(1)')
    expect(html).toContain('&lt;img')
    expect(html).toContain('&lt;script&gt;')
  })
})
