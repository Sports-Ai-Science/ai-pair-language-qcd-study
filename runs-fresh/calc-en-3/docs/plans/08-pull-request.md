# 08 — Pull Request

## Title
Scientific calculator: vanilla JS, runs from `file://`

## Summary
A self-contained scientific calculator implemented as five static source
files. Open `src/index.html` in any modern browser and the UI renders within
a second. No build step, no network calls, no runtime dependencies.

## Highlights
- Pure-function `Engine` (recursive-descent parser + interpreter).
- DOM-free `Store` for display, history, memory, and angle mode.
- `UI` mounts a 5x8 button grid and binds keyboard input.
- 44 automated tests covering all ten acceptance criteria from PLAN.md §3.

## Acceptance Criteria
| AC | Layer | Status |
| --- | --- | --- |
| AC-01 four basic operations | unit | PASS |
| AC-02 trig + inverse | unit | PASS |
| AC-03 log / ln / exp / sqrt / x^y | unit | PASS |
| AC-04 constants pi, e | unit | PASS |
| AC-05 DEG / RAD toggle | unit | PASS |
| AC-06 M+ / M- / MR / MC | unit | PASS |
| AC-07 history (latest 10) | integration | PASS |
| AC-08 keyboard input | system | PASS |
| AC-09 zero-division and domain errors | unit | PASS |
| AC-10 local boot from `file://` | system | PASS |

## Test Run
```
$ npm test
# 36 tests, 36 pass

$ node --test tests/system.spec.mjs
# 8 tests, 8 pass
```

## File Tree
```
calc-en-3/
  src/
    index.html
    styles.css
    engine.js
    state.js
    ui.js
  tests/
    _load.mjs
    engine.test.mjs
    state.test.mjs
    integration.test.mjs
    system.spec.mjs
  docs/plans/
    01-requirements.md
    02-architecture.md
    03-design.md
    08-pull-request.md
    10-retrospective.md
  package.json
  METRICS.md
```

## Risks and Limitations
- The `x^2` button injects `^2`; users must place a value before pressing it.
  Documented in design and exercised via direct expressions in tests.
- System-level keyboard tests use a Node `vm.Context` with a small DOM stub
  rather than a real browser. Manual smoke test in Chrome confirmed the UI
  renders and computes.

## Reviewer Checklist
- [ ] `npm test` passes.
- [ ] `node --test tests/system.spec.mjs` passes.
- [ ] `src/` contains exactly 5 files.
- [ ] `index.html` opens directly under `file://` and computes `1 + 2 = 3`.
