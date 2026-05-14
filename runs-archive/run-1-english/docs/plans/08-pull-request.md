# Pull Request — Run-1 (English Output) Scientific Calculator

## Summary

A vanilla-JS scientific calculator that runs locally by double-clicking
`index.html`. Built as Run-1 (English output) of the language comparison
pilot per `PLAN.md` v2.3.

## SuperClaude Review

PBI: #1 (Run-1 calculator build)
Task: Phase 1..10 of Run-1
PR: (local Run, no GitHub PR for the experiment)
Status: APPROVED
HEAD: $(git rev-parse HEAD)
Agents: @self-review, @quality-engineer, @security-engineer, @refactoring-expert

## Changes

- `src/index.html` — UI markup, 3 classic-script includes
- `src/styles.css` — dark theme, grid keypad
- `src/engine.js` — pure expression evaluator (tokenize → shunting-yard → RPN)
- `src/state.js` — pure functional state (memory, history, mode)
- `src/ui.js` — DOM event wiring (button + keyboard)
- `tests/_load.mjs` — vm-context loader for classic scripts
- `tests/engine.test.mjs` — 30 unit tests
- `tests/state.test.mjs` — 14 unit tests
- `tests/integration.test.mjs` — 5 integration tests
- `tests/system.spec.mjs` — 7 Playwright system tests
- `package.json` — `npm test` and Playwright dev dep
- `docs/plans/01..03,08.md` — phase artifacts
- `.claude/reviews/01..07.md` — phase exit evidence

## Test plan

- [x] Unit tests: `npm test` → 49/49 PASS
- [x] System tests: `node --test tests/system.spec.mjs` → 7/7 PASS
- [x] Manual smoke: open `src/index.html` in Chrome via file:// → calculator
      renders, accepts keyboard, evaluates expressions

## AC Final Status

| AC | Status |
| -- | ------ |
| AC-01 four arithmetic | PASS |
| AC-02 trig | PASS |
| AC-03 log/exp/pow/sqrt | PASS |
| AC-04 constants pi, e | PASS |
| AC-05 DEG/RAD toggle | PASS |
| AC-06 memory M+/M-/MR/MC | PASS |
| AC-07 history (last 10) | PASS |
| AC-08 keyboard input | PASS |
| AC-09 error handling | PASS |
| AC-10 local launch via file:// | PASS (after CORS-related refactor) |

10 of 10 AC satisfied.

## Notable Bugs Found and Fixed Within Run-1

1. **DOMContentLoaded race**: module scripts load AFTER DOMContentLoaded
   fires; `addEventListener` registered too late. Mitigated by checking
   `document.readyState` before subscribing.
2. **CORS blocks ES modules from file://**: directly broke AC-10. Fixed by
   converting all source files to classic-script IIFE pattern with
   `globalThis.Calc{Engine,State}` namespaces, and updating tests to use
   Node's `vm.runInContext`. ~7 min MTTF.

## Run-1 Metrics (to be finalized in Phase 10)

See `runs/run-1-english/METRICS.md`.
