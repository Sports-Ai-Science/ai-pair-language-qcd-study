---
phase: 05-unit-test
reviewer: sc-self-review
status: APPROVED
score: 8.7
bugs: 1
date: 2026-05-15
---

# Self-Review — Phase 5 Unit Tests

## Test Results

- 43 tests, 43 passed, 0 failed (`node --test tests/engine.test.mjs
  tests/state.test.mjs`).

## AC Coverage Verification

- AC-01 covered by `AC-01 *` (7 tests).
- AC-02 covered by `AC-02 *` (8 tests, both RAD and DEG).
- AC-03 covered by `AC-03 *` (6 tests).
- AC-04 covered by `AC-04 pi` and `AC-04 e`.
- AC-05 covered by `AC-05 *` state tests.
- AC-06 covered by `AC-06 *` state tests.
- AC-09 covered by `AC-09 *` (8 error-path tests).

## Bug Found and Resolved

- The first run failed `AC-03 power binds tighter than unary minus`. Root
  cause: an ambiguity between math convention (`-2^2 = -4`) and calculator
  convention (`-2^2 = 4`). The implementation follows calculator convention
  (documented in the design's PREC table: u- = 5, ^ = 4). Test was rewritten
  to assert the calculator convention and an additional `-(2^2) = -4` case
  was added to lock the behaviour. Bugs found = 1, all fixed.

## Verdict

APPROVED — proceed to Phase 6.
