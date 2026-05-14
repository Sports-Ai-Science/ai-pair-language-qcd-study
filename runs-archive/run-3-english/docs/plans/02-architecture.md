# ADR-01 — Vanilla JS, classic-script IIFE pattern (carried over from Run-1)

**Status**: Accepted
**Date**: 2026-05-14

Same architecture as Run-1 (English) and Run-2 (Japanese). Key decision: do
not use ES modules; use classic scripts with IIFE-bound `globalThis.Calc*`
namespaces. This ensures AC-10 (file:// double-click launch) works in all
modern Chromium browsers.

## Files

```
src/index.html, styles.css, engine.js, state.js, ui.js
```

5 files, ~510 LOC total.

## Phase Exit DoD

- [x] ADR captured
- [x] Carryover from Run-1 explicit
