// integration.test.mjs — Engine + Store wired together (AC-07, AC-09 flow).
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { loadStore } from './_load.mjs';

let Store;
beforeEach(() => { ({ Store } = loadStore()); Store.reset(); });

function type(seq) {
  for (const c of seq) Store.append(c);
}

test('AC-07 multi-step session populates history in order', () => {
  type('1+1'); Store.equals(); Store.clear();
  type('2*3'); Store.equals(); Store.clear();
  type('sqrt(16)'); Store.equals();
  const h = Store.snapshot().history;
  assert.equal(h.length, 3);
  assert.equal(h[0].expr, 'sqrt(16)');
  assert.equal(h[0].value, 4);
  assert.equal(h[1].expr, '2*3');
  assert.equal(h[2].expr, '1+1');
});

test('AC-06 + AC-07 memory survives clear, history independent', () => {
  type('10'); Store.memAdd(); Store.clear();
  type('1+2'); Store.equals(); Store.clear();
  Store.memRecall();
  assert.equal(Store.snapshot().display, '10');
  assert.equal(Store.snapshot().history.length, 1);
});

test('AC-09 error then clear unblocks input', () => {
  type('1/0'); Store.equals();
  assert.match(Store.snapshot().lastError, /divide by zero/);
  Store.clear();
  type('2+2'); Store.equals();
  assert.equal(Store.snapshot().display, '4');
});

test('AC-05 toggle DEG mid-session affects subsequent equals', () => {
  type('sin(pi/2)'); Store.equals();
  assert.equal(Number(Store.snapshot().display), 1);
  Store.clear();
  Store.toggleAngle(); // DEG
  type('sin(90)'); Store.equals();
  assert.equal(Number(Store.snapshot().display), 1);
});

test('AC-04 constants combine with operators', () => {
  type('2*pi'); Store.equals();
  const v = Number(Store.snapshot().display);
  assert.ok(Math.abs(v - 2 * Math.PI) < 1e-9);
});

test('AC-09 M+ on invalid expression sets error, memory unchanged', () => {
  type('1/0');
  Store.memAdd();
  const s = Store.snapshot();
  assert.equal(s.memory, 0);
  assert.match(s.lastError, /divide by zero/);
});

test('AC-07 history caps at 10 across mixed operations', () => {
  for (let i = 0; i < 15; i++) {
    type(`${i}+1`); Store.equals(); Store.clear();
  }
  assert.equal(Store.snapshot().history.length, 10);
});
