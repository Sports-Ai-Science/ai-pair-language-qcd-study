# Phase 10 — Retrospective (KPT)

## Outcomes

- All 10 acceptance criteria implemented and tested.
- 26 unit/integration tests + 5 system tests, 31/31 PASS.
- 5 source files in `src/`, 507 LOC total (under the 510-LOC budget).
- One bug found and fixed during Phase 5 (engine missing `log` alias for `log10`).

## Keep

- **Pure-functional engine + observable store + DOM-only UI separation.**
  Made unit-testing trivial (no jsdom needed) and let the integration tests reuse
  the same engine/state code paths the UI uses.
- **No-framework toolchain.** `node --test` for unit/integration and Playwright
  Chromium for system tests gave us a single devDependency. CI overhead is
  effectively zero.
- **Recursive-descent parser instead of `eval`.** Eliminates a whole class of
  injection vulnerabilities and gives us deterministic, friendly error
  messages.
- **Classic `<script>` tags + IIFE-bound globals.** Lets the page work directly
  under `file://`, satisfying AC-10 with no detours.

## Problem

- Initial CSS draft pushed the LOC over the 510 budget; required a one-pass
  compaction. Trivial to fix but worth noting.
- The engine alias for `log -> log10` was implicit in the design but not
  explicit in Phase 3, which is how the unit-test bug slipped in.
- `Math.log10` exists in modern JS; if we ever needed legacy ES5 we would have
  to substitute `Math.log(x) / Math.LN10`.

## Try

- For the next iteration, list every supported function name in the SRS,
  including aliases (`log <-> log10`), to prevent the kind of slip we hit in
  Phase 5.
- Add a Playwright accessibility check (`@axe-core/playwright`) under system
  tests to verify color contrast and ARIA role correctness without bloating
  the source budget.
- Consider extracting the parser into `engine.parse(expr)` so it can be
  exposed and tested independently of `evaluate`.

## Bug log

| Phase | Bug | Fix |
| ----- | --- | --- |
| 5 | `evaluate("log(1000)")` returned "Unknown function" because the engine only knew `log10`. | Added `case "log":` fall-through to `log10` in `applyUnary`. |
