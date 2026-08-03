import { describe, expect, it } from 'vitest'

import { deslop, flagsFor, slopScore } from '../../src/deslop.js'

describe('deslop', () => {
  it('normalizes typography and reports every changed character', () => {
    expect(deslop('“Leverage” a robust platform… now.')).toEqual({
      text: '"Use" a solid platform... Now.',
      groups: [
        { label: 'Smart quotes & special chars', count: 4 },
        { label: 'Inflated words', count: 2 },
      ],
      total: 6,
    })
  })

  it('turns prose dashes into commas while preserving numeric ranges', () => {
    expect(deslop('Growth — not hype. Revenue 2020–2024.')).toEqual({
      text: 'Growth, not hype. Revenue 2020-2024.',
      groups: [{ label: 'Em / en dashes', count: 2 }],
      total: 2,
    })
  })

  it('removes filler and applies case-aware plain-language replacements', () => {
    expect(deslop('Needless to say, leveraging synergy facilitates progress.')).toEqual({
      text: 'Using teamwork helps progress.',
      groups: [
        { label: 'Filler openers', count: 1 },
        { label: 'Inflated words', count: 3 },
      ],
      total: 4,
    })
    expect(deslop('LEVERAGE tools. Leverage tools.')).toMatchObject({
      text: 'USE tools. Use tools.',
      total: 2,
    })
  })

  it('removes sentence-opening transitions without damaging punctuation', () => {
    expect(deslop('First. Moreover, delve into the details.')).toEqual({
      text: 'First. Look at the details.',
      groups: [
        { label: 'Throat-clearing transitions', count: 1 },
        { label: 'Inflated words', count: 1 },
      ],
      total: 2,
    })
  })

  it('removes decorative emoji but retains arrows and check/cross marks', () => {
    expect(deslop('5% → 10% ✓ ✗ 🚀')).toEqual({
      text: '5% → 10% ✓ ✗',
      groups: [{ label: 'Emoji', count: 1 }],
      total: 1,
    })
  })

  it('is idempotent after text has been cleaned', () => {
    const once = deslop('In conclusion, harness a robust solution.').text
    expect(deslop(once)).toEqual({ text: once, groups: [], total: 0 })
  })
})

describe('flagsFor', () => {
  it('identifies risky antithesis patterns without rewriting them', () => {
    const input = 'It is not just fast, it is reliable.'
    expect(deslop(input).text).toBe(input)
    expect(flagsFor(input)).toEqual([
      {
        type: 'antithesis',
        label: '"it\'s not X, it\'s Y" pattern',
        fix: 'Cut the negation. Make the one positive point directly.',
        count: 1,
        samples: ['It is not just fast, it is'],
      },
    ])
  })

  it('deduplicates repeated matches with identical text and casing', () => {
    const flags = flagsFor('It is not easy, it is useful. IT IS NOT EASY, IT IS useful.')
    expect(flags).toHaveLength(1)
    expect(flags[0]).toMatchObject({ type: 'antithesis', count: 1 })
  })
})

describe('slopScore', () => {
  it('returns the zero-density Human baseline for direct prose', () => {
    expect(slopScore('plain direct prose')).toEqual({
      score: 0,
      label: 'Human',
      color: '#2ecc71',
      signals: {
        flips: 0, dashes: 0, emoji: 0, openers: 0, transitions: 0,
        hype: 0, words: 0, hedges: 0, vague: 0, ruleOfThree: 0,
      },
      per100: 0,
      words: 3,
    })
  })

  it('uses a one-word floor for empty input and never divides by zero', () => {
    expect(slopScore('')).toMatchObject({ score: 0, per100: 0, words: 1 })
  })

  it('reports weighted signal counts and the saturated score', () => {
    expect(slopScore('robust robust robust')).toMatchObject({
      score: 100,
      label: 'Pure slop',
      per100: 200,
      words: 3,
      signals: { words: 3 },
    })
  })
})
