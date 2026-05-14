# Pull Request — Scientific Calculator

## Summary

Implements a self-contained scientific calculator that runs by double-clicking
`src/index.html` from the local filesystem. No build step, no server, no
third-party dependencies.

## Scope

- **Engine** (`src/engine.js`): pure tokenizer + shunting-yard parser + RPN
  evaluator. Supports `+ - * / ^`, unary minus, parentheses, the trig family
  (sin/cos/tan/asin/acos/atan), log10, ln, exp, sqrt, constants π and e, and
  DEG/RAD angle modes. Errors are typed: `DIV_ZERO`, `DOMAIN`, `SYNTAX`,
  `OVERFLOW`.
- **State** (`src/state.js`): pure model. Holds expression buffer, display,
  history (cap 10, FIFO), memory register, angle mode, and an error-freeze
  flag. No DOM access.
- **UI** (`src/ui.js`): button-grid event delegation plus a keyboard handler
  with the standard mapping (digits, operators, Enter/=, Backspace, Escape,
  parens, `^`, `x` as multiply alias).
- **Markup & style**: `src/index.html`, `src/styles.css` — dark theme,
  responsive button grid.

## Acceptance Criteria

| AC ID | Status | Evidence |
| --- | --- | --- |
| AC-01 four arithmetic ops    | PASS | engine.test.mjs `AC-01 *` |
| AC-02 trig (incl. inverse)   | PASS | engine.test.mjs `AC-02 *` |
| AC-03 log/ln/exp/sqrt/x²/x^y | PASS | engine.test.mjs `AC-03 *` |
| AC-04 constants π, e         | PASS | engine.test.mjs `AC-04 *` |
| AC-05 DEG/RAD toggle         | PASS | state.test.mjs `AC-05 *` |
| AC-06 M+/M-/MR/MC            | PASS | state.test.mjs `AC-06 *` |
| AC-07 history (cap 10)       | PASS | integration.test.mjs `AC-07 *` |
| AC-08 keyboard input         | PASS | integration.test.mjs `AC-08 *` |
| AC-09 error handling         | PASS | engine.test.mjs `AC-09 *` |
| AC-10 local file:// startup  | PASS | system.spec.mjs `AC-10 *` |

## Test Plan

```
npm install --silent           # no dependencies; succeeds immediately
npm test                       # 50 tests (engine + state + integration)
node --test tests/system.spec.mjs   # 3 system tests
```

All 53 tests pass.

## Definition of Done

- [x] All ACs covered by automated tests at the appropriate layer
      (unit / integration / system).
- [x] No ES modules; classic `<script>` tags so the page works from
      `file://` after a double-click.
- [x] Source code limited to the five files agreed in the architecture.
- [x] No third-party runtime dependencies; `package.json` declares no
      runtime deps.
- [x] Self-reviews recorded for phases 1, 2, 3, 4, 5, 6, 7, 8, 10.
- [x] Per-phase timestamps and metrics captured in `METRICS.md`.

## Risks / Follow-ups

- The keyboard handler uses `preventDefault()` for matched keys; this is
  expected (otherwise `Backspace` would navigate). Documented in `ui.js`.
- `tan` near (n+0.5)π returns a `DOMAIN` error rather than a huge number;
  mathematically debatable but matches the design contract.
