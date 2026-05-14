# Phase 1 — Requirements Analysis

## Product

A scientific calculator that runs locally as a single static page. The user
opens `src/index.html` directly in a modern browser (no build step, no server)
and immediately sees a working UI.

## Stakeholders

- End user — wants accurate arithmetic and scientific functions in a quick,
  keyboard-friendly UI.
- Maintainer — needs small, readable, testable code in plain JavaScript.

## Acceptance Criteria (mapped from Product Scope §3)

| AC ID | Requirement | Test Layer |
| --- | --- | --- |
| AC-01 | Four basic operators: +, -, ×, ÷ | unit |
| AC-02 | Trigonometry: sin, cos, tan, asin, acos, atan | unit |
| AC-03 | log10, ln, exp, sqrt, x², x^y | unit |
| AC-04 | Constants π, e | unit |
| AC-05 | Angle mode toggle DEG/RAD | unit |
| AC-06 | Memory commands M+, M-, MR, MC | unit |
| AC-07 | History of the latest 10 results | integration |
| AC-08 | Keyboard input for digits, operators, Enter, Backspace, Escape | system |
| AC-09 | Errors: divide-by-zero, domain errors (e.g. asin(2), ln(-1)) | unit |
| AC-10 | Local startup: open `index.html`, UI renders within 5 s, first calc works | system |

## Non-Functional Requirements

- No network calls, no third-party libraries, no bundlers.
- Runs from `file://` — therefore classic `<script>` tags only (no ES modules,
  CORS would block module loading from the local filesystem).
- Source code lives in at most 5 files inside `src/`.
- UI labels are fixed in English.

## Out of Scope

Plotting, complex numbers, matrices, persistence beyond runtime memory,
internationalised UI, frameworks.

## Assumptions

- Target browsers: current Chrome / Edge / Firefox / Safari.
- Floating-point precision: native JavaScript `Number` is acceptable; results
  are rounded for display only (12 significant digits).

## Risks

- File-protocol restrictions block ES modules → mitigated by using IIFE
  globals and classic script tags.
- Accidental `eval` on untrusted input → mitigated by writing a deterministic
  shunting-yard parser, never `eval`.
