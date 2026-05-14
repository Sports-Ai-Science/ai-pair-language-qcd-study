# METRICS

Self-contained vanilla-JS scientific calculator. All output language: English.
Diversification ID: 9d1e4f6a.

## Per-Phase Metrics

| Phase | Start (ISO-8601) | End (ISO-8601) | Artifact chars (`wc -m`) | Verdict | Bugs |
| --- | --- | --- | --- | --- | --- |
| 01 Requirements   | 2026-05-15T07:40:17+09:00 | 2026-05-15T07:40:53+09:00 | 2045 (`docs/plans/01-requirements.md`)        | APPROVED | 0 |
| 02 Architecture   | 2026-05-15T07:40:58+09:00 | 2026-05-15T07:41:32+09:00 | 2446 (`docs/plans/02-architecture.md`)        | APPROVED | 0 |
| 03 Detailed Design| 2026-05-15T07:41:36+09:00 | 2026-05-15T07:42:24+09:00 | 3757 (`docs/plans/03-design.md`)              | APPROVED | 0 |
| 04 Implementation | 2026-05-15T07:42:28+09:00 | 2026-05-15T07:44:45+09:00 | 21896 (5 src files combined)                  | APPROVED | 0 |
| 05 Unit Test      | 2026-05-15T07:45:01+09:00 | 2026-05-15T07:46:49+09:00 | 43 tests, all PASS                            | APPROVED | 1 |
| 06 Integration    | 2026-05-15T07:46:54+09:00 | 2026-05-15T07:47:53+09:00 | 7 tests, all PASS                             | APPROVED | 0 |
| 07 System Test    | 2026-05-15T07:47:57+09:00 | 2026-05-15T07:48:56+09:00 | 3 tests, all PASS                             | APPROVED | 0 |
| 08 Pull Request   | 2026-05-15T07:49:01+09:00 | 2026-05-15T07:49:39+09:00 | 2856 (`docs/plans/08-pull-request.md`)        | APPROVED | 0 |
| 10 Retrospective  | 2026-05-15T07:49:45+09:00 | 2026-05-15T07:50:26+09:00 | 1939 (`docs/plans/10-retrospective.md`)       | APPROVED | 0 |

## Test Totals

- Unit:        43 / 43 PASS  (`tests/engine.test.mjs`, `tests/state.test.mjs`)
- Integration:  7 /  7 PASS  (`tests/integration.test.mjs`)
- System:       3 /  3 PASS  (`tests/system.spec.mjs`)
- **Total:    53 / 53 PASS**

## Source Footprint

| File | LOC | Chars |
| --- | ---: | ---: |
| `src/engine.js` | 218 | 7007 |
| `src/state.js`  | 203 | 5579 |
| `src/ui.js`     |  96 | 3572 |
| `src/index.html`|  86 | 3425 |
| `src/styles.css`|  94 | 2313 |
| **Total**       | **697** | **21896** |

## Bug Summary

- 1 bug found and fixed in Phase 5: precedence ambiguity for `-2^2`
  (math vs calculator convention). Resolved by aligning the test with
  the documented PREC table in `docs/plans/03-design.md`. No production
  defects escaped Phase 5.

## Notes

- Output language: English (code, comments, docs, reviews, this file).
- UI labels: English-fixed.
- No ES modules; classic `<script>` tags for `file://` compatibility.
- No third-party runtime or test dependencies (`package.json` declares none).
