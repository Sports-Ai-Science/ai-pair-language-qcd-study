# Pull Request — Scientific Calculator (vanilla JS, file:// safe)

Branch suggestion: `feature/scientific-calculator-7f3a8b2c`

## Summary

A self-contained scientific calculator that runs by double-clicking
`src/index.html`. No build step, no server, no third-party runtime
dependency in the product. Implements all 10 acceptance criteria from
the project plan and is verified by 26 unit/integration tests plus 5
Playwright system tests against the page loaded over `file://`.

## What's in this PR

- `src/index.html`, `src/styles.css`, `src/engine.js`, `src/state.js`, `src/ui.js`
  — 5 source files, 507 lines total (under the 510-line budget).
- `tests/_load.mjs`, `tests/engine.test.mjs`, `tests/state.test.mjs`,
  `tests/integration.test.mjs`, `tests/system.spec.mjs`.
- `package.json` with a single devDependency (`playwright`) and an `npm test`
  script that runs unit + integration with `node --test`.
- `docs/plans/01..03,08,10`, `.claude/reviews/01..08,10`, and `METRICS.md`.

## Architecture (one paragraph)

`index.html` loads three classic `<script>` tags in order: `engine.js`
(pure math, recursive-descent parser, no DOM), `state.js` (observable
store: expression, memory, history, angle mode), `ui.js` (only file
that touches the DOM). Each script is wrapped in an IIFE and exposes a
single global (`CalcEngine`, `CalcState`, `CalcUI`). This avoids ES
modules, which fail under `file://` due to CORS, while keeping module
boundaries clean.

## Acceptance-Criteria coverage

| AC    | Where covered                                          |
| ----- | ------------------------------------------------------ |
| AC-01 | engine.test.mjs (4 tests; precedence + parens)         |
| AC-02 | engine.test.mjs (sin/cos/tan + asin/acos/atan)         |
| AC-03 | engine.test.mjs (log, ln, exp, sqrt, x^2, x^y)         |
| AC-04 | engine.test.mjs (pi, e, 2*pi)                          |
| AC-05 | engine.test.mjs + integration.test.mjs (DEG vs RAD)    |
| AC-06 | state.test.mjs (M+, M-, MR, MC)                        |
| AC-07 | integration.test.mjs (FIFO cap at 10)                  |
| AC-08 | system.spec.mjs (Playwright keyboard input)            |
| AC-09 | engine.test.mjs (5 error paths) + system.spec.mjs      |
| AC-10 | system.spec.mjs (file:// load, UI ready < 5 s, 2+3=5)  |

## Test plan

- [x] `npm install --silent && npm test` -> 26/26 PASS
- [x] `node --test tests/system.spec.mjs` -> 5/5 PASS
- [x] Manual: open `src/index.html` in Chrome and run the four ACs by hand.

## Notes for reviewers

- The engine deliberately avoids `eval`. All input is tokenized and parsed
  by hand, and unknown identifiers/functions are rejected.
- Display rounding strips trailing zeros and clips magnitudes < 1e-9 to "0"
  to avoid noisy floating-point output (e.g. `1e-16` after subtraction).
- `log` is aliased to `log10` so users typing `log(...)` get the
  base-10 logarithm consistent with the on-screen `log` button.

## SuperClaude Review

PBI: N/A (single-PR delivery)
Task: N/A
PR: feature/scientific-calculator-7f3a8b2c
Status: APPROVED
HEAD: pending
Agents: @self-review
