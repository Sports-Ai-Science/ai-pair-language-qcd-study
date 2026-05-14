# Phase 1 — Requirements Analysis

**Run**: 1 (English Output)
**Date**: 2026-05-12
**Phase**: 01 Requirements
**Profile**: full

## 1. Stakeholder

- Primary user: a Japanese-native engineer running a small calculation
  task locally in a browser, without installing any software stack.

## 2. Goals

- Provide a scientific calculator usable from a static HTML file (no
  build step, no server).
- Cover the arithmetic and scientific functions a typical engineer uses
  daily without reaching for Wolfram or a Python REPL.
- Keep the entire UI/UX in a single HTML file plus accompanying CSS/JS
  so the artifact can be shared by file copy.

## 3. Functional Requirements (Acceptance Criteria, mirrored from PLAN.md §3)

| AC ID | Description | Test Layer |
| ----- | ----------- | ---------- |
| AC-01 | Four arithmetic operations (+, -, *, /) | unit |
| AC-02 | Trigonometric: sin, cos, tan, asin, acos, atan | unit |
| AC-03 | Logarithm/exponential: log10, ln, exp, sqrt, x^2, x^y | unit |
| AC-04 | Constants pi and e | unit |
| AC-05 | DEG/RAD mode toggle | unit |
| AC-06 | Memory: M+, M-, MR, MC | unit |
| AC-07 | Calculation history (last 10 entries) | integration |
| AC-08 | Keyboard input | system |
| AC-09 | Error handling: division by zero, log of non-positive, sqrt of negative | unit |
| AC-10 | Local-first launch (double-click index.html opens working calculator) | system |

## 4. Non-Functional Requirements

- NFR-01 Performance: any single computation completes within 100 ms on
  a typical laptop.
- NFR-02 Portability: works in any current Chromium-based browser
  without any external dependency at runtime.
- NFR-03 Maintainability: file count under 5, single bundle under 50 KB.
- NFR-04 Testability: every functional AC has automated test coverage.

## 5. Out of Scope

- Graph plotting, complex numbers, matrices, statistics
- Persistence (no localStorage)
- Multi-language UI (English UI fixed; this is a controlled variable)
- Frameworks (no React, Vue, etc.; vanilla JS only)

## 6. Assumptions

- Single-user, single-session usage.
- The user knows basic calculator notation (infix expressions are
  acceptable; no need for RPN).
- The deployment target is the user's local filesystem; no CSP, CORS,
  or HTTPS concerns.

## 7. Risks

| Risk | Mitigation |
| ---- | ---------- |
| Floating-point representation surprises (e.g., 0.1 + 0.2) | Display rounding to 12 significant digits |
| Operator precedence misuse | Use a small parser that respects standard precedence |
| Modal-mode bugs in DEG/RAD switching | Centralize the state and make the toggle visible |
| Local-launch CSP differences | Use only inline scripts and module-free code |

## 8. Phase Exit DoD

- [x] Stakeholder identified
- [x] All AC numbered with test_layer
- [x] NFR enumerated
- [x] Out of scope documented
- [x] Risks listed with mitigations
