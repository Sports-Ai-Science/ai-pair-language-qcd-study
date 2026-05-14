// engine.test.mjs — Unit tests for the math kernel.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Calc } from './_load.mjs';

const { evaluate, format, ERR } = Calc.engine;

const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

// AC-01: arithmetic
test('AC-01 addition', () => assert.equal(evaluate('1+2'), 3));
test('AC-01 subtraction', () => assert.equal(evaluate('10-7'), 3));
test('AC-01 multiplication', () => assert.equal(evaluate('6*7'), 42));
test('AC-01 division', () => assert.equal(evaluate('20/4'), 5));
test('AC-01 precedence', () => assert.equal(evaluate('1+2*3'), 7));
test('AC-01 parens override', () => assert.equal(evaluate('(1+2)*3'), 9));
test('AC-01 unary minus', () => assert.equal(evaluate('-3+5'), 2));

// AC-02: trigonometry (RAD default + DEG)
test('AC-02 sin(0) = 0', () => assert.equal(evaluate('sin(0)'), 0));
test('AC-02 cos(0) = 1', () => assert.equal(evaluate('cos(0)'), 1));
test('AC-02 sin(pi/2) ≈ 1', () => assert.ok(close(evaluate('sin(pi/2)'), 1)));
test('AC-02 sin(30 DEG) = 0.5', () => {
  assert.ok(close(evaluate('sin(30)', { angleMode: 'DEG' }), 0.5, 1e-12));
});
test('AC-02 cos(60 DEG) = 0.5', () => {
  assert.ok(close(evaluate('cos(60)', { angleMode: 'DEG' }), 0.5, 1e-12));
});
test('AC-02 atan(1) ≈ pi/4', () => assert.ok(close(evaluate('atan(1)'), Math.PI / 4)));
test('AC-02 asin returns DEG when DEG mode', () => {
  assert.ok(close(evaluate('asin(1)', { angleMode: 'DEG' }), 90, 1e-9));
});
test('AC-02 acos in DEG', () => {
  assert.ok(close(evaluate('acos(0)', { angleMode: 'DEG' }), 90, 1e-9));
});

// AC-03: log/ln/exp/sqrt/x^y
test('AC-03 log10(1000) = 3', () => assert.ok(close(evaluate('log(1000)'), 3)));
test('AC-03 ln(e) = 1', () => assert.ok(close(evaluate('ln(e)'), 1)));
test('AC-03 exp(0) = 1', () => assert.equal(evaluate('exp(0)'), 1));
test('AC-03 sqrt(16) = 4', () => assert.equal(evaluate('sqrt(16)'), 4));
test('AC-03 power right-assoc', () => assert.equal(evaluate('2^3^2'), 512));
test('AC-03 unary minus binds tighter than power (calculator convention)', () => {
  // Calculator convention: -2^2 parses as (-2)^2 = 4. Math convention would
  // give -4. Documented in design (PREC table: u- = 5, ^ = 4).
  assert.equal(evaluate('-2^2'), 4);
  assert.equal(evaluate('-(2^2)'), -4);
});

// AC-04: constants
test('AC-04 pi', () => assert.equal(evaluate('pi'), Math.PI));
test('AC-04 e', () => assert.equal(evaluate('e'), Math.E));

// AC-09: errors
function code(fn) {
  try { fn(); return null; }
  catch (e) { return e.code; }
}
test('AC-09 divide by zero', () => assert.equal(code(() => evaluate('1/0')), ERR.DIV_ZERO));
test('AC-09 sqrt of negative', () => assert.equal(code(() => evaluate('sqrt(-1)')), ERR.DOMAIN));
test('AC-09 ln of zero', () => assert.equal(code(() => evaluate('ln(0)')), ERR.DOMAIN));
test('AC-09 asin out of range', () => assert.equal(code(() => evaluate('asin(2)')), ERR.DOMAIN));
test('AC-09 syntax error', () => assert.equal(code(() => evaluate('1+')), ERR.SYNTAX));
test('AC-09 mismatched parens', () => assert.equal(code(() => evaluate('(1+2')), ERR.SYNTAX));
test('AC-09 unknown identifier', () => assert.equal(code(() => evaluate('foo(1)')), ERR.SYNTAX));
test('AC-09 overflow result', () => {
  assert.equal(code(() => evaluate('exp(1000)')), ERR.OVERFLOW);
});

// format
test('format integer', () => assert.equal(format(42), '42'));
test('format trims trailing zeros', () => assert.equal(format(1.5), '1.5'));
test('format precision', () => assert.equal(format(1 / 3).slice(0, 4), '0.33'));
