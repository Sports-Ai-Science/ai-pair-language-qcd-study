# ADR-01 — Vanilla JS Single-File Calculator

**Status**: Accepted
**Date**: 2026-05-12

## Context

We need a scientific calculator that runs offline, by double-clicking
`index.html`. Constraints:

- No build step
- No external runtime dependency
- Single-user, single-session
- Must be testable

## Decision

Use vanilla HTML/CSS/JavaScript with the following structure:

```
src/
├── index.html         (UI markup, CSS link, single inline <script type=module> entry)
├── styles.css         (presentational only)
├── engine.js          (pure expression evaluator, no DOM access)
├── state.js           (memory + history + DEG/RAD mode, pure state functions)
└── ui.js              (event handlers, wiring engine + state to DOM)
```

Engine and state modules are pure (no DOM, no globals) so they can be
imported by Vitest tests without a browser.

## Rationale

- **No build step** ⇒ frameworks ruled out (React requires JSX or a
  bundler, both add tooling).
- **Pure modules** ⇒ unit tests are trivial; the entire algorithmic
  surface is testable without jsdom.
- **Single HTML entry** ⇒ matches the AC-10 "double-click index.html"
  requirement.
- **5 files** ⇒ within the NFR-03 maintainability budget.

## Alternatives Considered

| Option | Rejected Because |
| ------ | ---------------- |
| Single inline `<script>` tag | Inhibits unit testing; couples logic to DOM |
| Web Components | Overkill for the AC set; adds shadow-DOM complexity |
| TypeScript | Requires a build step, violates the no-build constraint |
| React + Vite | Violates no-build and no-framework constraints |

## Consequences

- Positive: zero install/build, instant edit-refresh loop
- Positive: tests run in Node (no headless browser for unit layer)
- Negative: no type safety beyond JSDoc annotations
- Negative: manual DOM wiring (mitigated by small surface area)

## Phase Exit DoD

- [x] Single ADR captured
- [x] File layout decided and justified
- [x] Alternatives documented
- [x] Consequences listed
