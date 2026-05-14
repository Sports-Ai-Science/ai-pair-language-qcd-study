# Phase 10 — Retrospective (KPT) — Run-1 (English Output)

## Keep

- **Pure module separation** (engine + state without DOM access) made
  testing trivial and validated AC behavior independently from the UI.
- **Sterman 12-test inspired Phase Exit Checkpoint** (especially extreme
  conditions and dimensional consistency in earlier Phase 0 work) caught
  multiple algorithmic edge cases before they reached system tests.
- **English output for code/docs** integrated cleanly with technical
  vocabulary (CORS, IIFE, vm.runInContext); no awkward translations.

## Problem

- **CORS-blocks-ES-modules-from-file://** was the single biggest issue.
  Root cause: assumed `<script type="module">` would work for any
  static-file deployment. Took ~7 min to detect (Playwright timeouts) and
  ~10 min to refactor 4 files to classic-script pattern. **AC-10 was
  silently broken until system tests ran**.
- **DOMContentLoaded race with module scripts**: even before the CORS
  issue, the readyState handling needed an explicit check.
- **Phase 7 system tests had multiple race-condition false negatives**:
  initial assertions read display state too early; required
  `waitForFunction()` patterns.

## Try

- For future Runs (especially Run-2/3/4 in Japanese output): start with
  classic scripts from Phase 4. Don't rely on ES modules for
  file://-deployable artifacts.
- Add a "smoke test" gate at the end of Phase 4 that loads `index.html`
  via Playwright and asserts a 1+1=2 round-trip BEFORE writing Phase 5
  unit tests. This would have caught the CORS issue at Phase 4.
- Establish a deterministic-wait pattern (waitForFunction, never
  immediate read) as a project convention from the start.
- Document the file://-launch constraint at the architecture level
  (ADR-01 should mention it explicitly).

## Quantitative Notes

- Total elapsed (this Run-1, autonomous within this session):
  approximately 90 minutes (vs PLAN estimate of 4 hours per Run with
  human in the loop and 30 min Pre-Run isolation).
- 56 of 56 tests passing.
- 10 of 10 ACs satisfied.
- 0 SC review failures (all 7 phase reviews APPROVED on first pass).
- 2 bugs found and fixed within the Run (CORS, DOMContentLoaded race).
- Estimated tokens consumed for Run-1: ~30k–50k (no `/cost` snapshot
  available within this run; to be measured for Runs 2-4 by user).
