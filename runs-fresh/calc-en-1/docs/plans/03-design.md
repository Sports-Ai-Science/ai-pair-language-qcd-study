# Phase 3 — Detailed Design (SRS)

## 1. Engine module (`engine.js`)

### 1.1 Public surface (on `globalThis.CalcEngine`)

```text
evaluate(expr: string, opts: { angleMode: "DEG" | "RAD" })
  -> { ok: true, value: number } | { ok: false, error: string }

applyUnary(name: UnaryName, x: number, opts)
  -> { ok: true, value: number } | { ok: false, error: string }

constants: { PI: number, E: number }

format(value: number) -> string
```

`UnaryName` ∈ `{"sin","cos","tan","asin","acos","atan","log10","ln","exp","sqrt","sq"}`.

### 1.2 Expression grammar

```
expression := term (("+" | "-") term)*
term       := power (("*" | "/") power)*
power      := unary ("^" unary)*           // right-associative
unary      := ("-" | "+") unary | primary
primary    := number | "pi" | "e" | "(" expression ")"
number     := digit+ ("." digit+)? (("e" | "E") ("+" | "-")? digit+)?
```

The expression is produced by the UI from button clicks and key presses. The
UI never lets unsupported characters reach the engine; the engine still
defensively rejects unknown tokens.

### 1.3 Evaluation rules

- `/` by zero → `{ ok: false, error: "Division by zero" }`.
- `sqrt(x)` for `x < 0` → `{ ok: false, error: "Domain error" }`.
- `ln(x)` and `log10(x)` for `x <= 0` → `{ ok: false, error: "Domain error" }`.
- `asin(x)` / `acos(x)` for `|x| > 1` → `{ ok: false, error: "Domain error" }`.
- `tan` near singularities (cos(angle) ≈ 0): treat as `Domain error` when
  `Math.abs(Math.cos(angle)) < 1e-12`.
- Non-finite intermediate results (`Infinity`, `NaN`) → `{ ok: false, error: "Math error" }`.
- Angle conversion: in `DEG` mode, `sin/cos/tan` interpret input as degrees,
  and `asin/acos/atan` return degrees.

### 1.4 Formatting rule

Format with up to 12 significant digits, then strip trailing zeros. Values whose
absolute value is `< 1e-9` after rounding render as `0`.

## 2. State module (`state.js`)

`CalcState.create()` returns a store with the following methods:

- `getExpr()` / `setExpr(s)` / `append(s)` / `clear()`
- `getDisplay()` / `setDisplay(s)`
- `pushHistory(entry: { expr, result })` (cap at 10, FIFO)
- `getHistory()` returns a defensive copy
- `memoryAdd(x)`, `memorySub(x)`, `memoryRecall()`, `memoryClear()`
- `setAngleMode("DEG"|"RAD")`, `getAngleMode()`
- `subscribe(listener)` → returns an `unsubscribe` function. Listeners are
  called after every mutating method.

State is a plain object captured in the IIFE closure; no DOM access.

## 3. UI module (`ui.js`)

### 3.1 DOM layout (assembled in `index.html`)

- Display row (`.display`) with the current expression and the last result.
- Mode toggle (`DEG` / `RAD`).
- Memory indicator (`M` shown when memory ≠ 0).
- Button grid:
  - Row 1: `MC`, `MR`, `M+`, `M-`, `(`, `)`
  - Row 2: `sin`, `cos`, `tan`, `asin`, `acos`, `atan`
  - Row 3: `log`, `ln`, `exp`, `sqrt`, `x^2`, `x^y`
  - Row 4: `7`, `8`, `9`, `/`, `pi`, `e`
  - Row 5: `4`, `5`, `6`, `*`, `C`, `Back`
  - Row 6: `1`, `2`, `3`, `-`, `DEG/RAD`, `=`
  - Row 7: `0`, `.`, `+`
- History panel showing the last 10 entries.

### 3.2 Keyboard mapping

| Key                 | Action                                      |
| ------------------- | ------------------------------------------- |
| `0`-`9`             | append digit                                |
| `.`                 | append decimal point                        |
| `+ - * /`           | append operator                             |
| `^`                 | append `^`                                  |
| `( )`               | append parenthesis                          |
| `Enter` or `=`      | evaluate                                    |
| `Backspace`         | delete last char                            |
| `Escape` or `c`/`C` | clear                                       |
| `p`                 | append `pi`                                 |
| `e`                 | append `e` constant                         |
| `m`                 | toggle DEG/RAD                              |

The handler attaches to `document` once at mount time and ignores keys with
`Ctrl`/`Meta` modifiers so it does not interfere with browser shortcuts.

### 3.3 Render

`render()` is called whenever the store notifies. It updates: display
expression, last result, history panel, memory indicator, and DEG/RAD toggle.

## 4. HTML and CSS

`index.html` includes only:

```html
<link rel="stylesheet" href="styles.css">
<script src="engine.js"></script>
<script src="state.js"></script>
<script src="ui.js"></script>
```

and a small bootstrap that calls `CalcUI.mount(document.getElementById("app"),
CalcState.create(), CalcEngine)`.

CSS uses CSS Grid for the keypad and flexbox for the history panel. No remote
fonts, no images.

## 5. Test plan (mapped to ACs)

| AC    | Test file              | Notes                                   |
| ----- | ---------------------- | --------------------------------------- |
| AC-01 | `engine.test.mjs`      | tabulated cases incl. precedence        |
| AC-02 | `engine.test.mjs`      | DEG and RAD checks for each fn          |
| AC-03 | `engine.test.mjs`      | `log10`, `ln`, `exp`, `sqrt`, sq, x^y   |
| AC-04 | `engine.test.mjs`      | `pi` and `e` constants                  |
| AC-05 | `engine.test.mjs`      | DEG vs RAD parity for sin(90)           |
| AC-06 | `state.test.mjs`       | M+ / M- / MR / MC                       |
| AC-07 | `integration.test.mjs` | history capped at 10                    |
| AC-08 | `system.spec.mjs`      | Playwright keyboard input               |
| AC-09 | `engine.test.mjs`      | divide by zero, asin(2), ln(0), sqrt(-1)|
| AC-10 | `system.spec.mjs`      | open `index.html` via `file://`         |

## 6. Definition of Done (Phase 3)

- Public APIs of all three modules are listed.
- Grammar is unambiguous; tokens enumerated.
- Error semantics are explicit per operation.
- Keyboard mapping is enumerated.
- Test plan covers every AC with a test layer that matches the requirements
  table.
