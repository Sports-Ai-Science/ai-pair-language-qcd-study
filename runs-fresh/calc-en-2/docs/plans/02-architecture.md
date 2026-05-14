# Phase 2 — Architecture (Mini-ADR)

## Decision

A single static page with three IIFE-scoped JavaScript modules attached to a
shared global namespace `Calc`.

## Context

- The product is a self-contained scientific calculator launched by
  double-clicking `index.html` on the local filesystem.
- Browsers refuse to load `<script type="module">` from `file://` due to CORS,
  so ES modules and `import`/`export` are forbidden.
- The product must remain auditable in ~510 LOC across at most 5 source files.

## Decision Drivers

1. Zero build step and zero network dependencies.
2. Pure functions in the engine to keep unit tests trivial.
3. Strict separation between calculation, state, and DOM.

## Architecture Overview

```
+--------------------+     +--------------------+     +--------------------+
|  ui.js (DOM bind)  | --> |  state.js (model)  | --> |  engine.js (math)  |
+--------------------+     +--------------------+     +--------------------+
         ^                          |                          |
         |                          v                          v
   keyboard / click         history, memory,            tokenize, parse,
     event handlers         angle mode, errors          evaluate (RPN)
```

- `engine.js` — Pure expression evaluator. Tokenizer, shunting-yard parser,
  RPN evaluator. Exposes `Calc.engine.evaluate(expr, { angleMode })`.
- `state.js` — Holds `expression`, `display`, `history[]` (cap 10),
  `memory`, `angleMode`. No DOM. Exposes commands like `inputDigit`,
  `applyOperator`, `equals`, `memoryAdd`, `setAngleMode`, `clear`.
- `ui.js` — Wires DOM events to `state.js` actions and re-renders. Owns
  keyboard mapping. No math.

## Files

| File | Purpose | Approx LOC |
| --- | --- | --- |
| `src/index.html` | Markup & button grid | 90 |
| `src/styles.css` | Layout & dark theme | 70 |
| `src/engine.js`  | Math kernel (pure) | 180 |
| `src/state.js`   | App state machine | 110 |
| `src/ui.js`      | DOM wiring & keys | 100 |

## Alternatives Considered

- **ES modules** — rejected: blocked under `file://`.
- **Single mega-file** — rejected: violates separation, harder to unit-test.
- **Framework (React, Vue)** — rejected: adds tooling and bundler.

## Consequences

- IIFE globals must be loaded in dependency order: engine → state → ui.
- Tests import the same files via `tests/_load.mjs` which evaluates them in a
  shared sandbox to obtain the `Calc` namespace under Node.
