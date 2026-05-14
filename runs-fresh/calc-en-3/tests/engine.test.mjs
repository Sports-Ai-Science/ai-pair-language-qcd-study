// engine.test.mjs — unit tests for src/engine.js (AC-01..AC-05, AC-09).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from './_load.mjs';

const Engine = loadEngine();

function ok(expr, mode = 'RAD') {
  const r = Engine.evaluate(expr, mode);
  assert.equal(r.ok, true, `expected ok for ${expr} got ${JSON.stringify(r)}`);
  return r.value;
}
function err(expr, fragment, mode = 'RAD') {
  const r = Engine.evaluate(expr, mode);
  assert.equal(r.ok, false, `expected error for ${expr}`);
  assert.match(r.error, new RegExp(fragment));
}
function near(actual, expected, eps = 1e-9) {
  assert.ok(Math.abs(actual - expected) < eps,
    `expected ${expected} got ${actual}`);
}

test('AC-01 four basic operations', () => {
  assert.equal(ok('1+2'), 3);
  assert.equal(ok('10-7'), 3);
  assert.equal(ok('3*4'), 12);
  assert.equal(ok('20/4'), 5);
});

test('AC-01 operator precedence and parens', () => {
  assert.equal(ok('2+3*4'), 14);
  assert.equal(ok('(2+3)*4'), 20);
  assert.equal(ok('-3+5'), 2);
  assert.equal(ok('2*-3'), -6);
});

test('AC-02 trig in RAD', () => {
  near(ok('sin(0)'), 0);
  near(ok('cos(0)'), 1);
  near(ok('tan(0)'), 0);
});

test('AC-02 trig in DEG', () => {
  near(ok('sin(30)', 'DEG'), 0.5);
  near(ok('cos(60)', 'DEG'), 0.5);
  near(ok('tan(45)', 'DEG'), 1, 1e-9);
});

test('AC-02 inverse trig', () => {
  near(ok('asin(1)'), Math.PI / 2);
  near(ok('acos(0)'), Math.PI / 2);
  near(ok('atan(1)'), Math.PI / 4);
  near(ok('asin(0.5)', 'DEG'), 30);
  near(ok('acos(0.5)', 'DEG'), 60);
  near(ok('atan(1)', 'DEG'), 45);
});

test('AC-03 log/ln/exp/sqrt/x^y', () => {
  near(ok('log(100)'), 2);
  near(ok('ln(exp(1))'), 1);
  near(ok('sqrt(16)'), 4);
  near(ok('exp(0)'), 1);
  assert.equal(ok('2^10'), 1024);
});

test('AC-03 ^ is right-associative', () => {
  assert.equal(ok('2^3^2'), 512);
});

test('AC-03 x^2 button input form', () => {
  assert.equal(ok('5^2'), 25);
  assert.equal(ok('(2+3)^2'), 25);
});

test('AC-04 constants pi and e', () => {
  near(ok('pi'), Math.PI);
  near(ok('e'), Math.E);
  near(ok('2*pi'), 2 * Math.PI);
});

test('AC-05 angle mode toggle', () => {
  near(ok('sin(pi/2)', 'RAD'), 1);
  near(ok('sin(90)', 'DEG'), 1);
});

test('AC-09 division by zero', () => {
  err('1/0', 'divide by zero');
  err('5/(2-2)', 'divide by zero');
});

test('AC-09 domain errors', () => {
  err('asin(2)', 'domain');
  err('acos(-2)', 'domain');
  err('ln(-1)', 'domain');
  err('log(0)', 'domain');
  err('sqrt(-4)', 'domain');
});

test('AC-09 parse errors', () => {
  err('1+', 'parse');
  err('(1+2', 'parse');
  err('foo(1)', 'parse');
  err('', 'parse');
  err('1 2', 'parse');
});

test('AC-09 infinity collapses to domain error', () => {
  err('exp(1000000)', 'domain');
});

test('Engine purity: no DOM access in engine.js', () => {
  // loadEngine creates a context without `document` or `window`.
  // If engine.js touched them, the script would have thrown on load.
  assert.equal(typeof Engine.evaluate, 'function');
  assert.equal(typeof Engine.tokenize, 'function');
});

test('tokenize handles scientific notation', () => {
  assert.equal(ok('1.5e2'), 150);
  assert.equal(ok('1e-3'), 0.001);
});
