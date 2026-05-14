---
phase: "05"
status: APPROVED
head: pending
agents:
  - self-review
sc_commands:
  - /sc:test
  - /sc:analyze --focus quality
started_at: 2026-05-15T07:50:00+09:00
decided_at: 2026-05-15T07:55:00+09:00
review_round: 1
---

# Phase 5 Self-Review (/sc:test + /sc:analyze --focus quality)

## Scope reviewed

`tests/_load.mjs`, `tests/engine.test.mjs`, `tests/state.test.mjs`.

## Test counts

- engine.test.mjs: 16 tests covering AC-01, AC-02, AC-03, AC-04, AC-05, AC-09 plus `format()` and `applyUnary()`.
- state.test.mjs: 6 tests covering AC-06 plus expression and listener behavior.
- All tests run via `node --test` with no third-party framework.

## Bugs found and fixed in this phase

1. **engine `log` alias was missing.** The unit test `evalRad("log(1000)")` returned `{ ok:false, error:"Unknown function" }` because `applyUnary` only knew `log10`. Fixed by adding a `case "log":` falling through to the existing `log10` branch. UI button labeled "log" is also wired to `fn:log10`, so the alias is consistent end-to-end.

## AC coverage by ACs (unit layer)

| AC | Covered? | Where |
| --- | --- | --- |
| AC-01 | Yes | engine.test.mjs (4 tests incl. precedence) |
| AC-02 | Yes | engine.test.mjs (sin/cos/tan + asin/acos/atan) |
| AC-03 | Yes | engine.test.mjs (log/ln/exp/sqrt + power) |
| AC-04 | Yes | engine.test.mjs (pi, e, 2*pi) |
| AC-05 | Yes | engine.test.mjs (DEG vs RAD parity) |
| AC-06 | Yes | state.test.mjs (M+/M-/MR/MC) |
| AC-09 | Yes | engine.test.mjs (5 error-path tests) |

## Verdict

APPROVED. Proceed to Phase 6 (integration tests).
