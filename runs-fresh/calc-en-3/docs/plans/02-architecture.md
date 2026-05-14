# 02 — Architecture (Mini ADR)

## Context
A scientific calculator must run from `file://` with no build step. ES modules
are blocked by browser CORS under `file://`, so we cannot use `import` /
`export`. The codebase is intentionally tiny (≤ 5 source files, ~510 LOC).

## Decision
- **Single static page**: `src/index.html` loads three classic `<script>` tags
  in order: `engine.js`, `state.js`, `ui.js`.
- **Three IIFE globals**:
  - `Engine` — pure math evaluation (no DOM).
  - `Store` — application state container (display, history, memory, mode).
  - `UI` — DOM bindings, event listeners, rendering.
- **No frameworks, no bundler, no network**. CSS is hand-written.
- **Tests**: Node's built-in `node:test` runner. A `tests/_load.mjs` helper
  loads each browser script into a sandboxed `vm.Context` so the same files
  used in the browser are exercised in tests.

## Consequences
- Trivially debuggable; `Cmd-Click` `index.html` and it runs.
- Globals are namespaced via IIFE — only `Engine`, `Store`, `UI` leak.
- Tests can run on Node ≥ 18 without dependencies; package.json lists none.
- Refactoring to ES modules later is mechanical (each IIFE → module file).

## Alternatives Considered
- **ES modules**: blocked by file:// CORS; would need a dev server.
- **Single bundled file**: harder to read/review; loses the 5-file separation.
- **Vitest / Jest**: extra dependencies; `node:test` is standard library.
