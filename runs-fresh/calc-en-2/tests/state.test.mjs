// state.test.mjs — Unit tests for the state machine.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Calc } from './_load.mjs';

function newStore() { return Calc.state.create(); }

// AC-05 angle mode
test('AC-05 default angle mode is RAD', () => {
  const s = newStore();
  assert.equal(s.snapshot().angleMode, 'RAD');
});

test('AC-05 toggle DEG affects evaluation', () => {
  const s = newStore();
  s.setAngleMode('DEG');
  s.applyFunction('sin');
  '90'.split('').forEach(c => s.inputDigit(c));
  s.closeParen();
  s.equals();
  assert.equal(s.snapshot().display, '1');
});

// AC-06 memory
test('AC-06 M+ accumulates', () => {
  const s = newStore();
  '5'.split('').forEach(c => s.inputDigit(c));
  s.memoryAdd();
  s.clear();
  '3'.split('').forEach(c => s.inputDigit(c));
  s.memoryAdd();
  assert.equal(s.snapshot().memory, 8);
});

test('AC-06 M- subtracts; MR recalls; MC clears', () => {
  const s = newStore();
  '10'.split('').forEach(c => s.inputDigit(c));
  s.memoryAdd();
  s.clear();
  '4'.split('').forEach(c => s.inputDigit(c));
  s.memorySub();
  assert.equal(s.snapshot().memory, 6);
  s.clear();
  s.memoryRecall();
  assert.equal(s.snapshot().display, '6');
  s.memoryClear();
  assert.equal(s.snapshot().memory, 0);
});

// Error freeze
test('error state freezes input until clear', () => {
  const s = newStore();
  '1/0'.split('').forEach(c => {
    if (c === '/') s.applyOperator('/');
    else s.inputDigit(c);
  });
  s.equals();
  assert.equal(s.snapshot().error, Calc.engine.ERR.DIV_ZERO);
  s.inputDigit('5');
  assert.match(s.snapshot().display, /^Error/);
  s.clear();
  assert.equal(s.snapshot().error, null);
  assert.equal(s.snapshot().display, '0');
});

// Backspace and dot guard
test('backspace removes last char', () => {
  const s = newStore();
  '123'.split('').forEach(c => s.inputDigit(c));
  s.backspace();
  assert.equal(s.snapshot().display, '12');
});

test('dot does not duplicate within one number', () => {
  const s = newStore();
  '1'.split('').forEach(c => s.inputDigit(c));
  s.inputDot();
  s.inputDigit('5');
  s.inputDot();
  assert.equal(s.snapshot().expression, '1.5');
});

test('digit after equals starts a new expression', () => {
  const s = newStore();
  '2+3'.split('').forEach(c => {
    if ('+'.includes(c)) s.applyOperator('+');
    else s.inputDigit(c);
  });
  s.equals();
  assert.equal(s.snapshot().display, '5');
  s.inputDigit('7');
  assert.equal(s.snapshot().display, '7');
});

test('operator after equals continues from result', () => {
  const s = newStore();
  '6'.split('').forEach(c => s.inputDigit(c));
  s.equals();
  s.applyOperator('+');
  s.inputDigit('4');
  s.equals();
  assert.equal(s.snapshot().display, '10');
});
