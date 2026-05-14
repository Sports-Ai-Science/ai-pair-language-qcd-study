---
phase: 07
artifact: tests/system.spec.mjs
status: APPROVED
score: 8.6
reviewer: self
date: 2026-05-15
bugs: 1
bugs_fixed: 1
test_count: 8
test_pass: 8
---

# Self-Review — Phase 07

## Test Results
8 system tests / 8 pass / 0 fail.
Combined with Phase 06: 44 tests / 44 pass.

## AC Coverage at System Layer
- AC-08 keyboard: digits, operators, `Enter`/`=`, `Backspace`, `Escape`
  drive the same Store the UI uses, via the bound `keydown` handler.
- AC-10 file:// boot: `index.html` exists, uses classic scripts (no
  `type="module"`, no `import`), references no network resources, and the
  three scripts loaded together can perform a calculation end-to-end.
- Source budget: exactly 5 files in `src/` matching the expected names.
- Hygiene: no `fetch`, `XMLHttpRequest`, or `eval` in the UI layer.

## Bugs Found and Fixed
- DOM stub regex did not match the quoted form `data-el="..."` used inside
  `UI.mount`'s template string, while `querySelector` uses the unquoted form.
  Fixed by allowing both forms in `tests/_load.mjs`.

## Verdict
APPROVED.
