# Phase 1 — Requirements Analysis

## 1. Product Statement

A self-contained scientific calculator that runs locally by double-clicking
`index.html`. No build step, no server, no installation. The user opens the file
in a modern browser and immediately performs arithmetic and scientific
operations using either the on-screen buttons or the physical keyboard.

## 2. Stakeholders and Users

- **Primary user**: a single end user performing one-off scientific
  calculations on their own machine (offline-capable).
- **Operator**: the same end user; no admin role.
- **Maintainer**: a single engineer extending the calculator.

## 3. Functional Requirements (mapped to Acceptance Criteria)

| ID    | Requirement                                                  | Test layer  |
| ----- | ------------------------------------------------------------ | ----------- |
| AC-01 | Four arithmetic operations (`+`, `-`, `*`, `/`)              | unit        |
| AC-02 | Trigonometry: `sin`, `cos`, `tan`, `asin`, `acos`, `atan`    | unit        |
| AC-03 | `log10`, `ln`, `exp`, `sqrt`, `x^2`, `x^y`                   | unit        |
| AC-04 | Constants `pi`, `e`                                          | unit        |
| AC-05 | DEG / RAD angle-mode toggle                                  | unit        |
| AC-06 | Memory operations `M+`, `M-`, `MR`, `MC`                     | unit        |
| AC-07 | Calculation history of the last 10 entries                   | integration |
| AC-08 | Keyboard input is accepted for digits, operators, Enter, etc | system      |
| AC-09 | Division by zero and out-of-domain functions show an error   | unit        |
| AC-10 | Local launch: opening `index.html` renders UI within 5 s     | system      |

### AC-10 Given/When/Then

```
Given : a clean environment with no `npm install` and no local server
When  : the user double-clicks index.html and it opens in Chrome
Then  : the calculator UI is rendered within 5 seconds and the first
        arithmetic operation succeeds
```

## 4. Non-Functional Requirements

- Vanilla HTML/CSS/JS only (no frameworks, no bundlers).
- Must work under the `file://` protocol (no ES modules, no `import`).
- Single-page UI, English labels.
- Code budget: at most 5 source files inside `src/`, target ~510 LOC total.
- Numerical precision: IEEE-754 double (JavaScript `Number` default).

## 5. Out of Scope

Plotting, complex numbers, matrices, persistence between sessions, multi-language
UI, and any framework or bundler.

## 6. Assumptions

- Modern Chromium-based browser (Chrome, Edge) is available on the user's
  machine.
- The browser permits opening local HTML directly via `file://`.
- The user understands standard scientific-calculator notation.

## 7. Risks and Mitigations

| Risk                                                  | Mitigation                                                |
| ----------------------------------------------------- | --------------------------------------------------------- |
| ES modules fail under `file://` due to CORS           | Use classic `<script>` tags + IIFE-bound globals          |
| Floating-point quirks confuse users (e.g. 0.1+0.2)    | Round display to a safe number of significant digits      |
| Keyboard event collisions with browser shortcuts      | Limit handled keys to digits, operators, Enter, Esc, Bksp |
| Trig domain errors (e.g. `asin(2)`) crash the engine  | Return a sentinel "Error" value, surfaced by UI           |

## 8. Definition of Done (Phase 1)

- All 10 ACs are listed with a clear test layer.
- AC-10 has a Given/When/Then.
- Non-functional constraints are explicit.
- Out-of-scope items are explicit.
- Self-review with `/sc:brainstorm` focus is APPROVED.
