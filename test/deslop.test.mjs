import assert from 'node:assert/strict'
import test from 'node:test'

import { deslop, flagsFor, slopScore } from '../src/deslop.js'

const SLOPPY = "It is not just a tool, it is a revolution. 🚀 Furthermore, our seamless platform leverages cutting-edge AI."

test('deslop removes deterministic AI-writing signals', () => {
  const result = deslop(SLOPPY)

  assert.equal(result.text.includes('🚀'), false)
  assert.equal(result.text.includes('Furthermore'), false)
  assert.equal(result.text.includes('seamless'), false)
  assert.equal(result.text.includes('leverages'), false)
  assert.equal(result.text.includes('cutting-edge'), false)
  assert.ok(result.total >= 5)
})

test('deslop preserves clean human text', () => {
  const input = 'The team shipped the feature on time. Tests pass.'
  const result = deslop(input)

  assert.equal(result.text, input)
  assert.equal(result.total, 0)
})

test('slopScore returns a bounded score and signal breakdown', () => {
  const result = slopScore(SLOPPY)

  assert.ok(result.score >= 0 && result.score <= 100)
  assert.ok(result.score > 50)
  assert.equal(typeof result.signals.emoji, 'number')
  assert.equal(typeof result.signals.transitions, 'number')
  assert.equal(typeof result.signals.words, 'number')
})

test('flagsFor leaves structural rewrites to a person or agent', () => {
  const flags = flagsFor(SLOPPY)

  assert.equal(flags.some((flag) => flag.type === 'antithesis'), true)
  assert.equal(deslop(SLOPPY).text.toLowerCase().includes('not just'), true)
})

test('meaningful arrows, check marks, and brand casing survive cleanup', () => {
  assert.equal(deslop('revenue rose 5% → 10%').text, 'Revenue rose 5% → 10%')
  assert.equal(deslop('passed ✓ shipped 🚀').text, 'Passed ✓ shipped')
  assert.equal(deslop('iOS and eBay lead.').text, 'iOS and eBay lead.')
})

test('the antithesis flag does not depend on the separator being a comma', () => {
  // The bug this pins: the separator was a literal ",", so the em-dash form -
  // the way an LLM is most likely to write the #1 tell - scored 98 and raised
  // no flag, while the comma form scored 100 and flagged. deslop() normalizes
  // those dashes to commas, so the engine rewrote text INTO the shape the
  // flagger wanted and never looked again.
  const separators = [',', ' —', ' –', ';', ':', ' -']
  for (const separator of separators) {
    const text = `It's not just a tool${separator} it's a revolution.`
    const flags = flagsFor(text)
    assert.equal(flags.some((flag) => flag.type === 'antithesis'), true,
      `no antithesis flag for separator ${JSON.stringify(separator)}`)
    assert.equal(slopScore(text).score, 100,
      `score differs for separator ${JSON.stringify(separator)}`)
  }
})

test("the isn't/it's flag does not depend on the separator either", () => {
  assert.equal(
    flagsFor("This isn't a demo — it's the product.")
      .some((flag) => flag.type === 'isnt-its'), true)
})

test('a spaced hyphen separates clauses but a hyphenated word does not', () => {
  // " - " is a clause boundary; "cutting-edge" is one word. Widening the
  // separator to a bare hyphen would have made every compound adjective look
  // like an antithesis.
  assert.equal(flagsFor('We use cutting-edge tools.').length, 0)
  assert.equal(flagsFor("It's not just talk - it's shipped.").length > 0, true)
})

test('a lowercase abbreviation is not capitalized into a sentence start', () => {
  // KNOWN-ISSUES.md reported this as start-of-input only. It was every
  // sentence start: LOWER_ABBR inspects the text BEFORE the letter, which at
  // offset zero is empty and after a full stop is the previous sentence.
  assert.equal(deslop('e.g. the result').text, 'e.g. the result')
  assert.equal(deslop('Foo happened. e.g. the result').text,
    'Foo happened. e.g. the result')
  assert.equal(deslop('i.e. this one').text, 'i.e. this one')
  assert.equal(deslop('vs. the other').text, 'vs. the other')
})

test('ordinary sentence starts are still capitalized', () => {
  // The abbreviation exemption must not become a blanket one.
  assert.equal(deslop('the result was good').text, 'The result was good')
  assert.equal(deslop('Foo. bar happened').text, 'Foo. Bar happened')
  assert.equal(deslop('iPhone sales rose').text, 'iPhone sales rose')
})

