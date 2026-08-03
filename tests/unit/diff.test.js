import { describe, expect, it } from 'vitest'

import { diffHtml } from '../../src/diff.js'

describe('diffHtml', () => {
  it('marks removed and inserted words', () => {
    expect(diffHtml('Leverage this tool', 'Use this tool')).toBe(
      '<del>Leverage</del><mark class="add">Use</mark> this tool',
    )
  })

  it('treats capitalization-only changes as unchanged', () => {
    expect(diffHtml('hello WORLD', 'Hello world')).toBe('Hello world')
  })

  it('escapes source and replacement text before emitting HTML', () => {
    expect(diffHtml('<unsafe>', '<safe>')).toBe(
      '&lt;<del>unsafe</del><mark class="add">safe</mark>&gt;',
    )
  })

  it('preserves newlines while collapsing leftover horizontal whitespace', () => {
    expect(diffHtml('one extra\nline', 'one\nline')).toBe('one\n<del>extra</del> line')
  })
})
