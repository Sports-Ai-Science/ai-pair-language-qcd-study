# Phase 3 — Detailed Design

## 1. Engine API (`src/engine.js`)

Exposes a single namespace `Calc.engine`:

```
Calc.engine = {
  evaluate(expression: string, options: { angleMode: 'DEG'|'RAD' }): number,
  format(value: number): string,
  ERR: { DIV_ZERO, DOMAIN, SYNTAX, OVERFLOW }   // string constants
}
```

`evaluate` throws an `Error` whose `.code` is one of the `ERR` values.

### Tokens

| Type | Examples |
| --- | --- |
| number | `12`, `3.14`, `2.5e-3` |
| const  | `pi`, `e` |
| ident  | `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `log`, `ln`, `exp`, `sqrt` |
| op     | `+`, `-`, `*`, `/`, `^`, unary `-` |
| paren  | `(`, `)` |

The UI emits `*` for ×, `/` for ÷, `^` for x^y, `sqr(x)` for x² (rendered as
`(x)^2` internally to keep one path).

### Precedence

| Op | Precedence | Assoc |
| --- | --- | --- |
| unary `-` | 5 | right |
| `^`       | 4 | right |
| `*`, `/`  | 3 | left  |
| `+`, `-`  | 2 | left  |
| function  | 6 | n/a   |

### Error rules

- `/` with right operand 0 → `DIV_ZERO`.
- `sqrt(x)` for `x < 0` → `DOMAIN`.
- `ln(x)` / `log(x)` for `x <= 0` → `DOMAIN`.
- `asin(x)` / `acos(x)` for `|x| > 1` → `DOMAIN`.
- `tan(x)` near (n+0.5)π → `DOMAIN` when `|cos(x)| < 1e-12`.
- Non-finite result (`NaN`, `±Infinity`) → `OVERFLOW`.
- Malformed input → `SYNTAX`.

## 2. State API (`src/state.js`)

`Calc.state` exposes a small store and command functions:

```
Calc.state.create() -> store
store.snapshot() -> { display, expression, history, memory, angleMode, error }
store.inputDigit(d)
store.inputDot()
store.inputConst(name)            // 'pi' | 'e'
store.applyOperator(op)           // '+', '-', '*', '/', '^'
store.applyFunction(fn)           // 'sin', 'cos', ... wraps current value
store.applySquare()               // x²
store.equals()
store.clear()                     // AC
store.backspace()
store.setAngleMode(mode)          // 'DEG' | 'RAD'
store.memoryAdd() / memorySub() / memoryRecall() / memoryClear()
store.openParen() / closeParen()
```

Rules:

- `expression` is the canonical buffer fed to the engine.
- `display` echoes the buffer or the latest result.
- After `equals`, the result is appended to `history` (cap 10, FIFO eviction).
- An error sets `error` and freezes input until `clear` or `backspace`.

## 3. UI (`src/ui.js`)

- Renders the button grid defined by `index.html` and binds `click`.
- Maps keyboard:
  - `0-9` `.` → digits
  - `+ - * /` → operators (`x` and `X` also map to `*`)
  - `Enter` or `=` → equals
  - `Backspace` → backspace
  - `Escape` → clear
  - `(` `)` → parens
  - `^` → power
- Calls `store.snapshot()` after every action and updates DOM nodes
  `#display`, `#history`, `#mode`, `#memory-indicator`.

## 4. Test Loader (`tests/_load.mjs`)

Reads `src/engine.js`, `src/state.js` with `fs.readFileSync`, runs them in a
shared `vm` context that defines `globalThis.Calc = {}`, then exports the
populated `Calc`. This allows the same source files used by the browser to be
unit-tested under Node without ES modules.

## 5. Test Plan

| Layer | File | Covers |
| --- | --- | --- |
| unit | `tests/engine.test.mjs` | AC-01..06, AC-09 (math kernel) |
| unit | `tests/state.test.mjs`  | AC-05, AC-06, error freeze, clear |
| integration | `tests/integration.test.mjs` | AC-07 history cap & order |
| system | `tests/system.spec.mjs` | AC-10 file-loadability via JSDOM-style smoke |

`AC-08` keyboard handler is exercised in the integration test by simulating
key dispatch through the same code path the UI uses (a small adapter is
exposed on `Calc.ui` for testing).

## 6. Display Rules

- Results are rendered with at most 12 significant digits via
  `Number.prototype.toPrecision(12)`, then trailing zeros stripped.
- Integers up to 15 digits are shown without exponential form.
