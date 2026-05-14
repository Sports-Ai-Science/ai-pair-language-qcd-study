# Phase 3 — Detailed Design (SRS)

**Run**: 1 (English Output)
**Date**: 2026-05-12

## 1. Module Contracts

### 1.1 `engine.js`

Pure expression evaluator. Operates on tokenized infix expressions.

```js
// evaluate(expression: string, mode: "DEG" | "RAD") -> { ok: true, value: number } | { ok: false, error: string }
export function evaluate(expression, mode = "RAD") { ... }

// Supported tokens:
//   numbers:    12, 12.5, 1.2e3
//   operators:  + - * /  ^  (^ = power)
//   functions:  sin cos tan asin acos atan log10 ln exp sqrt
//   constants:  pi  e
//   memory:     M (read-only here; writes happen in state.js)
//   parens:     ( )
```

Algorithm: shunting-yard → RPN → stack evaluation. ~120 LOC budget.

### 1.2 `state.js`

Pure functional state container.

```js
export const initial = () => ({ memory: 0, history: [], mode: "RAD" });

export function setMemory(state, value) { ... }
export function addToMemory(state, value) { ... }
export function subFromMemory(state, value) { ... }
export function clearMemory(state) { ... }
export function pushHistory(state, expr, value) { ... }   // keeps last 10
export function setMode(state, mode) { ... }              // "DEG" | "RAD"
```

Returns new state objects (immutable update). ~60 LOC budget.

### 1.3 `ui.js`

DOM wiring. Subscribes to button clicks and keyboard events.

```js
import { evaluate } from "./engine.js";
import * as State from "./state.js";

let state = State.initial();
let display = "";

function onButton(label) { ... }
function onKey(event)    { ... }
function render()        { ... }

document.addEventListener("DOMContentLoaded", () => { wireButtons(); wireKeyboard(); render(); });
```

~120 LOC budget.

## 2. UI Layout

```
+-------------------------------------------+
| display: [                          0]    |  <- expression area + result
| mode:   [DEG] [RAD]   memory: 0  history: |
+-------------------------------------------+
| 7 8 9 / sin cos    M+ MR                  |
| 4 5 6 * tan log    M- MC                  |
| 1 2 3 - ln  sqrt   pi e                   |
| 0 . = + ^   x^2    ( )                    |
+-------------------------------------------+
| history (last 10):                        |
|  3*4=12                                   |
|  sin(pi/2)=1                              |
+-------------------------------------------+
```

Buttons are 4 columns x 6 rows in a grid.

## 3. Error Handling

| Trigger | Display |
| ------- | ------- |
| Division by zero | `Error: division by zero` |
| log/ln of x ≤ 0 | `Error: log domain` |
| sqrt of x < 0 | `Error: sqrt domain` |
| Invalid expression | `Error: parse` |

After an error display, the next number/function press clears the
display.

## 4. Keyboard Map (AC-08)

| Key | Action |
| --- | ------ |
| 0-9 . | append digit |
| + - * / ^ | operator |
| ( ) | grouping |
| Enter, = | evaluate |
| Backspace | delete last char |
| Escape | clear display |
| m | open memory submenu (M+, M-, MR, MC via subsequent keys) |
| d | toggle DEG/RAD |

## 5. Floating-Point Display

Round results to 12 significant digits using
`Number.prototype.toPrecision(12)` then strip trailing zeros.

## 6. Phase Exit DoD

- [x] Module contracts defined
- [x] UI layout sketched
- [x] Error taxonomy listed
- [x] Keyboard map specified
- [x] Display rounding rule chosen
