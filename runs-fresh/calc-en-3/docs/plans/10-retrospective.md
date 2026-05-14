# 10 — Retrospective

## What went well
- The IIFE-globals architecture made the file:// constraint a non-issue and
  let the same source files run in both the browser and the Node test
  sandbox without bundling.
- Writing tests against `vm.Context` instead of jsdom kept the dependency
  tree empty (`package.json` lists none) yet still proved end-to-end
  keyboard handling.
- Recursive-descent parsing with right-associative `^` handled the entire
  scientific surface in roughly 200 lines.

## What was tricky
- The minimal DOM stub initially missed the quoted form of `data-el="..."`
  in `UI.mount`'s template string. The fix was a one-character regex tweak,
  and a system test caught it on first run.
- Balancing the ~510 LOC budget against a complete button grid pushed the
  total to 602 lines (about 18 % over). Most of the overage is in the
  exhaustive button-action dispatch and the visual stylesheet; both are
  load-bearing for AC-08 and AC-10.

## Bugs and resolution
| # | Phase | Symptom | Fix |
| --- | --- | --- | --- |
| 1 | 07 | DOM stub regex did not match `data-el="display"` | Allow optional quotes in regex |

## Test summary
- Engine + State + Integration: 36 tests, all PASS.
- System: 8 tests, all PASS.
- Total: 44 tests, 0 failures, 1 bug discovered and fixed.

## Followups
- Add a real Playwright smoke test for AC-10 once a Chromium runner is
  available; the current system tests cover the JS contract but not pixel
  rendering.
- Consider adding `ANS` (last result) recall as a usability win.
- Consider folding the `press` dispatch table into a data-driven map to
  shave LOC if the budget tightens.

## Process notes
- Following the 9-phase workflow (1-8 + 10) gave a clean audit trail with
  one self-review per artifact and a single `METRICS.md` row per phase.
- All artifacts, comments, and UI labels are in English per the language
  rule.
