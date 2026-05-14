# Phase 2 — Architecture Design (Minimal ADR)

## ADR-001: Single-page vanilla JS, IIFE-bound globals

### Status

Accepted.

### Context

The product must run by double-clicking `index.html`, i.e. under the `file://`
protocol, with no build step and no server. Modern bundlers and ES modules are
not viable here: when loaded from `file://`, `<script type="module">` triggers
CORS errors in Chromium. The product is also small (10 ACs, ~510 LOC budget),
so any heavyweight architecture is overkill.

### Decision

- Use a **single static HTML page** that loads three classic `<script>` files
  in dependency order: `engine.js`, `state.js`, `ui.js`.
- Each script wraps its logic in an **IIFE** and exposes a single object on
  `globalThis` (`CalcEngine`, `CalcState`, `CalcUI`). This gives us module-like
  isolation without `import` / `export`.
- The DOM-facing layer (`ui.js`) is the only file allowed to read or write the
  DOM. `engine.js` is **pure** (no DOM, no globals other than `Math`). `state.js`
  is a thin observable store that holds the current expression, memory, angle
  mode, and history.
- Styling is a single CSS file (`styles.css`).

### Component diagram

```
+---------------------+
|     index.html      |  loads three classic scripts
+----------+----------+
           |
   +-------+-------+--------------+
   |               |              |
   v               v              v
engine.js       state.js        ui.js
(pure math)    (store/obs)    (DOM + keys)
   ^               ^              |
   |               |              |
   +---------------+--------------+
                   |
            calls engine + state APIs
```

### Module contracts (informal)

- `CalcEngine.evaluate(expr: string, opts: { angleMode: "DEG"|"RAD" }) -> { ok, value? , error? }`
- `CalcEngine.applyUnary(name, x, opts) -> { ok, value?, error? }`
- `CalcState.create() -> store` with methods `getExpr`, `setExpr`, `append`,
  `clear`, `pushHistory`, `getHistory`, `memory{Add,Sub,Recall,Clear}`,
  `setAngleMode`, `getAngleMode`, `subscribe(listener)`.
- `CalcUI.mount(rootEl, state, engine)`: wires DOM + keyboard.

### Consequences

- Positive: zero build, double-click launch works in any modern Chromium.
- Positive: pure-function engine is trivial to unit-test under `node --test`.
- Positive: small surface area keeps the LOC budget realistic.
- Negative: no module tree-shaking; acceptable given the ~510 LOC budget.
- Negative: global namespace has three names; mitigated by IIFE encapsulation.

## ADR-002: Test stack — `node --test` + Playwright

### Decision

- Unit and integration tests run under Node's built-in test runner (`node
  --test`) to avoid any framework footprint. The engine and state modules are
  loaded into the Node test process via a tiny `_load.mjs` helper that reads
  the script files and evaluates them inside a `vm` context, mimicking a
  browser global.
- System tests run under Playwright (Chromium only) by opening the local
  `index.html` via the `file://` protocol.

### Consequences

- No transpiler, no bundler, no Jest. `npm test` reduces to `node --test`.
- Playwright is the only devDependency; it bundles its own Chromium.

## File layout

```
src/
  index.html
  styles.css
  engine.js
  state.js
  ui.js
tests/
  _load.mjs
  engine.test.mjs
  state.test.mjs
  integration.test.mjs
  system.spec.mjs
docs/plans/
  01-requirements.md
  02-architecture.md
  ...
```
