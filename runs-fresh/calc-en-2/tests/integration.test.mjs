// integration.test.mjs — Verifies engine + state + keyboard mapping work
// together end to end. Covers AC-07 (history cap) and AC-08 (keyboard).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Calc } from './_load.mjs';

// AC-07: history capped at 10, FIFO eviction, latest is last.
test('AC-07 history caps at 10 entries', () => {
  const s = Calc.state.create();
  for (let i = 1; i <= 12; i++) {
    s.clear();
    String(i).split('').forEach(c => s.inputDigit(c));
    s.applyOperator('+');
    s.inputDigit('0');
    s.equals();
  }
  const snap = s.snapshot();
  assert.equal(snap.history.length, 10);
  assert.match(snap.history[snap.history.length - 1], /^12\+0 = 12$/);
  assert.match(snap.history[0], /^3\+0 = 3$/); // first two evicted
});

test('AC-07 history records both expression and result', () => {
  const s = Calc.state.create();
  '2'.split('').forEach(c => s.inputDigit(c));
  s.applyOperator('+');
  '3'.split('').forEach(c => s.inputDigit(c));
  s.equals();
  assert.equal(s.snapshot().history[0], '2+3 = 5');
});

// AC-08: keyboard handler — replicate the same fromKey + dispatch path used
// by the live UI but without a real DOM. Build a thin shim.
function makeUiShim() {
  const store = Calc.state.create();

  // Recreate the fromKey logic from ui.js (stable contract).
  function fromKey(ev) {
    const k = ev.key;
    if (k >= '0' && k <= '9') return { kind: 'digit', value: k };
    if (k === '.') return { kind: 'dot' };
    if (k === '+' || k === '-' || k === '/' || k === '^') return { kind: 'op', value: k };
    if (k === '*' || k === 'x' || k === 'X') return { kind: 'op', value: '*' };
    if (k === 'Enter' || k === '=') return { kind: 'equals' };
    if (k === 'Backspace') return { kind: 'back' };
    if (k === 'Escape') return { kind: 'clear' };
    if (k === '(' || k === ')') return { kind: 'paren', value: k };
    return null;
  }

  function dispatch(action) {
    switch (action.kind) {
      case 'digit':  store.inputDigit(action.value); break;
      case 'dot':    store.inputDot(); break;
      case 'op':     store.applyOperator(action.value); break;
      case 'paren':  action.value === '(' ? store.openParen() : store.closeParen(); break;
      case 'equals': store.equals(); break;
      case 'back':   store.backspace(); break;
      case 'clear':  store.clear(); break;
    }
  }

  function press(key) {
    const a = fromKey({ key });
    if (a) dispatch(a);
  }

  return { store, press };
}

test('AC-08 keyboard typing computes 1+2*3', () => {
  const ui = makeUiShim();
  '1+2*3'.split('').forEach(k => ui.press(k));
  ui.press('Enter');
  assert.equal(ui.store.snapshot().display, '7');
});

test('AC-08 backspace and escape work via keyboard', () => {
  const ui = makeUiShim();
  '123'.split('').forEach(k => ui.press(k));
  ui.press('Backspace');
  assert.equal(ui.store.snapshot().display, '12');
  ui.press('Escape');
  assert.equal(ui.store.snapshot().display, '0');
});

test('AC-08 = and Enter both equal', () => {
  const ui1 = makeUiShim();
  '4+5'.split('').forEach(k => ui1.press(k));
  ui1.press('=');
  assert.equal(ui1.store.snapshot().display, '9');

  const ui2 = makeUiShim();
  '4+5'.split('').forEach(k => ui2.press(k));
  ui2.press('Enter');
  assert.equal(ui2.store.snapshot().display, '9');
});

test('AC-08 x maps to multiply', () => {
  const ui = makeUiShim();
  '6'.split('').forEach(k => ui.press(k));
  ui.press('x');
  '7'.split('').forEach(k => ui.press(k));
  ui.press('Enter');
  assert.equal(ui.store.snapshot().display, '42');
});

// Composite engine + state: nested functions + memory.
test('engine + state: M+ then MR continues new expression', () => {
  const s = Calc.state.create();
  '5'.split('').forEach(c => s.inputDigit(c));
  s.equals();
  s.memoryAdd();
  s.clear();
  s.memoryRecall();
  s.applyOperator('+');
  '3'.split('').forEach(c => s.inputDigit(c));
  s.equals();
  assert.equal(s.snapshot().display, '8');
});
