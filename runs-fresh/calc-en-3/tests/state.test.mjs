// state.test.mjs — unit tests for src/state.js (AC-06, AC-07).
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { loadStore } from './_load.mjs';

let Store;
beforeEach(() => { ({ Store } = loadStore()); Store.reset(); });

test('append builds the display', () => {
  Store.append('1');
  Store.append('+');
  Store.append('2');
  assert.equal(Store.snapshot().display, '1+2');
});

test('clear empties the display', () => {
  Store.append('123');
  Store.clear();
  assert.equal(Store.snapshot().display, '');
});

test('backspace removes one char', () => {
  Store.append('123');
  Store.backspace();
  assert.equal(Store.snapshot().display, '12');
});

test('equals computes and replaces display', () => {
  Store.append('2+3');
  Store.equals();
  assert.equal(Store.snapshot().display, '5');
});

test('AC-07 history captures last 10 entries newest-first', () => {
  for (let i = 1; i <= 12; i++) {
    Store.append(`${i}+0`);
    Store.equals();
    Store.clear();
  }
  const h = Store.snapshot().history;
  assert.equal(h.length, 10);
  assert.equal(h[0].expr, '12+0');
  assert.equal(h[0].value, 12);
  assert.equal(h[9].expr, '3+0');
});

test('AC-06 memory M+ / MR / MC', () => {
  Store.append('5');
  Store.memAdd();
  assert.equal(Store.snapshot().memory, 5);
  Store.clear();
  Store.append('3');
  Store.memAdd();
  assert.equal(Store.snapshot().memory, 8);
  Store.clear();
  Store.memRecall();
  assert.equal(Store.snapshot().display, '8');
  Store.memClear();
  assert.equal(Store.snapshot().memory, 0);
});

test('AC-06 memory M-', () => {
  Store.append('10');
  Store.memAdd();
  Store.clear();
  Store.append('3');
  Store.memSub();
  assert.equal(Store.snapshot().memory, 7);
});

test('AC-05 toggleAngle flips DEG/RAD', () => {
  assert.equal(Store.snapshot().angleMode, 'RAD');
  Store.toggleAngle();
  assert.equal(Store.snapshot().angleMode, 'DEG');
  Store.toggleAngle();
  assert.equal(Store.snapshot().angleMode, 'RAD');
});

test('AC-05 trig respects angleMode in equals', () => {
  Store.toggleAngle(); // DEG
  Store.append('sin(30)');
  Store.equals();
  assert.equal(Number(Store.snapshot().display), 0.5);
});

test('AC-09 error sets lastError, equals does not advance', () => {
  Store.append('1/0');
  Store.equals();
  const s = Store.snapshot();
  assert.match(s.lastError, /divide by zero/);
});

test('AC-09 typing after error clears it', () => {
  Store.append('1/0');
  Store.equals();
  Store.append('2');
  const s = Store.snapshot();
  assert.equal(s.lastError, null);
  assert.equal(s.display, '2');
});

test('subscribe receives snapshots', () => {
  let count = 0;
  let last = null;
  Store.subscribe((snap) => { count++; last = snap; });
  Store.append('7');
  assert.equal(count, 1);
  assert.equal(last.display, '7');
});

test('formatNumber trims trailing zeros', () => {
  assert.equal(Store.formatNumber(1.5), '1.5');
  assert.equal(Store.formatNumber(0), '0');
  assert.equal(Store.formatNumber(2), '2');
});
