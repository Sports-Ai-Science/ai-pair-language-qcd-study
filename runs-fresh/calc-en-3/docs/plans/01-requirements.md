# 01 — Requirements

## Product
A self-contained scientific calculator that runs locally by opening `index.html`
directly in a modern browser via the `file://` protocol. No build step, no
network calls, no server.

## Stakeholder
A user who needs quick scientific computations on a laptop without installing
anything.

## Functional Requirements (mapped to Acceptance Criteria)

| AC ID | Requirement | Layer |
| --- | --- | --- |
| AC-01 | Four basic operations: `+`, `-`, `*`, `/`. | unit |
| AC-02 | Trigonometric functions: `sin`, `cos`, `tan`, `asin`, `acos`, `atan`. | unit |
| AC-03 | Exponential / logarithm / power: `log10`, `ln`, `exp`, `sqrt`, `x^2`, `x^y`. | unit |
| AC-04 | Constants: `pi`, `e`. | unit |
| AC-05 | Angle mode toggle DEG / RAD. | unit |
| AC-06 | Memory: `M+`, `M-`, `MR`, `MC`. | unit |
| AC-07 | Calculation history (latest 10 entries). | integration |
| AC-08 | Keyboard input for digits, operators, Enter, Backspace, Escape. | system |
| AC-09 | Errors handled for division-by-zero and out-of-domain (`asin(2)`, `ln(-1)`, …). | unit |
| AC-10 | Local boot: double-clicking `index.html` renders the UI within 5 s and the first calculation succeeds. | system |

## Non-Functional Requirements
- Pure vanilla HTML / CSS / JavaScript.
- Maximum five source files under `src/`.
- No ES modules; classic `<script>` tags only (file:// CORS forbids modules).
- Total source budget around 510 lines of code.
- All written artifacts in English.

## Out of Scope
Graph plotting, complex numbers, matrices, persistence, multi-language UI,
frameworks.
