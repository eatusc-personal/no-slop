import fs from 'node:fs'
import { describe, expect, it } from 'vitest'

function loadExRow() {
  const source = fs.readFileSync(new URL('../../src/main.js', import.meta.url), 'utf8')
  const start = source.indexOf('function exRow(')
  const end = source.indexOf('\n}\n\nfunction renderExList', start) + 2
  return Function(`${source.slice(start, end)}; return exRow`)()
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
