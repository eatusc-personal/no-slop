# Known issues

## Lowercase abbreviations are capitalized at the start of input

- Location: `src/deslop.js:227`
- Expected: Common lowercase abbreviations such as `e.g.` and `i.e.` remain lowercase when they begin the input, consistent with the nearby abbreviation-preservation rule.
- Actual: `deslop('e.g. the result')` returns `E.g. the result`; the preceding-text check is empty at offset zero, so the exemption cannot match.
