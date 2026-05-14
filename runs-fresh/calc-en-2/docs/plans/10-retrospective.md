# Phase 10 — Retrospective (KPT)

## Keep

- **Pure-engine separation.** Putting tokenizer + shunting-yard + RPN
  evaluator in `engine.js` with no external state made the unit tests
  trivial to write and the bug surface small.
- **Typed errors.** Engine throws `Error` with `.code ∈ {DIV_ZERO, DOMAIN,
  SYNTAX, OVERFLOW}`. State translates a single error into a frozen UI
  with one branch.
- **Shared file loader (`tests/_load.mjs`).** Same source files used by the
  browser are exercised under Node via `vm.createContext`, with no
  duplication and no transpiler.
- **Classic `<script>` tags + IIFE globals.** Eliminated the file://-vs-ES-
  modules pitfall before it could bite.

## Problem

- **Calculator-vs-math precedence ambiguity.** A test asserted `-2^2 = -4`
  (math convention) while the implementation chose calculator convention
  (`-2^2 = (-2)^2 = 4`). One failing test on the first run; resolved by
  documenting the choice in the test (and pointing back to the design's
  PREC table). Cost: ~1 min.
- **LOC ceiling.** Total source LOC came to ~697 against a target of
  "~510". Engine alone is 218 LOC because the tokenizer covers numeric
  literals, identifiers, exponent notation, and unary-minus rewriting.
  The grid in `index.html` adds another chunk. Could be tightened by
  collapsing helpers, but readability would suffer.

## Try

- **Property-based tests** for the engine (e.g. `evaluate(format(x)) ≈ x`
  for a sampled `x`) to catch precision/format edge cases beyond the
  hand-picked unit tests.
- **Real-DOM smoke test** with a tiny third-party DOM library (or a
  Playwright run when permitted) to exercise the click-delegation path
  in `ui.js` end to end, which the current integration test stubs out.
- **`tan` policy revisit.** Decide whether to clamp at the singularity
  with `OVERFLOW` instead of `DOMAIN` (matches IEEE 754 better when
  `cos(x)` underflows rather than being analytically zero).
