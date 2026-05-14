# METRICS

| Phase | Start | End | Output chars | SC verdict | Bugs found/fixed |
|-------|-------|-----|--------------|------------|------------------|
| 01 | 2026-05-15T07:40:18+09:00 | 2026-05-15T07:41:12+09:00 | 3715 | APPROVED | 0 |
| 02 | 2026-05-15T07:41:16+09:00 | 2026-05-15T07:42:02+09:00 | 3420 | APPROVED | 0 |
| 03 | 2026-05-15T07:42:09+09:00 | 2026-05-15T07:43:11+09:00 | 5966 | APPROVED | 0 |
| 04 | 2026-05-15T07:43:18+09:00 | 2026-05-15T07:45:50+09:00 | 18983 | APPROVED | 0 |
| 05 | 2026-05-15T07:45:55+09:00 | 2026-05-15T07:47:53+09:00 | 7129 | APPROVED | 1 |
| 06 | 2026-05-15T07:47:59+09:00 | 2026-05-15T07:48:19+09:00 | 2498 | APPROVED | 0 |
| 07 | 2026-05-15T07:48:30+09:00 | 2026-05-15T07:49:50+09:00 | 2994 | APPROVED | 0 |
| 08 | 2026-05-15T07:49:55+09:00 | 2026-05-15T07:50:40+09:00 | 3092 | APPROVED | 0 |
| 10 | 2026-05-15T07:50:45+09:00 | 2026-05-15T07:51:30+09:00 | 2075 | APPROVED | 0 |

## Test Results

- Unit + integration (`npm test`, `node --test tests/engine.test.mjs tests/state.test.mjs tests/integration.test.mjs`): **26 PASS / 0 FAIL** (16 engine + 6 state + 4 integration).
- System (`node --test tests/system.spec.mjs`, Playwright Chromium against `file://`): **5 PASS / 0 FAIL**.
- Combined: **31 PASS / 0 FAIL**.

## Bugs

- **1** bug found and fixed during the build.
  - Phase 5: engine missing `log` alias for `log10`. Unit test `evaluate("log(1000)")` returned `Unknown function`. Fixed by adding `case "log":` falling through to the existing `log10` branch in `applyUnary`.

## Source size

5 files in `src/`, 507 LOC total (under the 510-LOC budget):

| File | LOC |
| --- | --- |
| engine.js | 204 |
| state.js | 79 |
| ui.js | 169 |
| index.html | 23 |
| styles.css | 32 |

## Acceptance Criteria coverage

All 10 ACs covered with the documented `test_layer`. See the table in
`docs/plans/08-pull-request.md`.
