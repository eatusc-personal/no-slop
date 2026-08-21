# Known issues

None open.

## Fixed

### Lowercase abbreviations were capitalized at a sentence start

- Location: `src/deslop.js` (step 9), `django_api/deslop/engine.py` (`recap`)
- Fixed: 2026-08-21. `deslop('e.g. the result')` returned `E.g. the result`.
  `LOWER_ABBR` only inspects the text *before* the letter, which is empty at
  offset zero, so the exemption could not match. Reported here as a
  start-of-input problem, it was in fact every sentence start:
  `'Foo happened. e.g. x'` capitalized too, because the preceding slice was the
  previous sentence rather than an abbreviation. A `LEADING_ABBR` check now
  also looks at the text *starting* at the letter, so the abbreviation itself
  stays lowercase wherever it appears.

### The antithesis flag required a comma separator

- Location: `src/deslop.js` (`FLAG_PATTERNS`), `django_api/deslop/engine.py`
- Fixed: 2026-08-21. The `antithesis` and `isnt-its` patterns hardcoded `,\s*`
  between the two clauses, so `"It's not just a tool - it's a revolution."`
  written with an em dash scored 98 and raised no flag, while the same sentence
  with a comma scored 100 and flagged. Em-dash overload and the antithesis flip
  are the two signals this tool exists to catch and they co-occur constantly,
  so the form that slipped through was the one most worth catching. `deslop()`
  normalizes those dashes to commas, meaning the engine rewrote text into the
  shape the flagger wanted and never looked again. The separator is now a
  character class covering comma, em dash, en dash, semicolon, colon, and a
  spaced hyphen. A bare hyphen is excluded so `cutting-edge` stays a word.
