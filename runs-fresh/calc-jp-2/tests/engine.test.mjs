// engine.js の単体テスト。AC-01〜AC-06, AC-09 を機械検証する。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CalcEngine } from './_load.mjs';

const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

test('AC-01 四則演算: 加算', () => {
  assert.equal(CalcEngine.evaluate('1+2'), 3);
});

test('AC-01 四則演算: 減算', () => {
  assert.equal(CalcEngine.evaluate('10-3'), 7);
});

test('AC-01 四則演算: 乗算', () => {
  assert.equal(CalcEngine.evaluate('4*5'), 20);
});

test('AC-01 四則演算: 除算', () => {
  assert.equal(CalcEngine.evaluate('20/4'), 5);
});

test('AC-01 演算優先順位と括弧', () => {
  assert.equal(CalcEngine.evaluate('2+3*4'), 14);
  assert.equal(CalcEngine.evaluate('(2+3)*4'), 20);
});

test('AC-02 sin(0)=0, cos(0)=1 (DEG)', () => {
  assert.ok(close(CalcEngine.evaluate('sin(0)', 'DEG'), 0));
  assert.ok(close(CalcEngine.evaluate('cos(0)', 'DEG'), 1));
});

test('AC-02 sin(90)=1 (DEG)', () => {
  assert.ok(close(CalcEngine.evaluate('sin(90)', 'DEG'), 1));
});

test('AC-02 tan(45)=1 (DEG)', () => {
  assert.ok(close(CalcEngine.evaluate('tan(45)', 'DEG'), 1, 1e-9));
});

test('AC-02 asin(1)=90 (DEG)', () => {
  assert.ok(close(CalcEngine.evaluate('asin(1)', 'DEG'), 90));
});

test('AC-02 acos(0)=90 (DEG)', () => {
  assert.ok(close(CalcEngine.evaluate('acos(0)', 'DEG'), 90));
});

test('AC-02 atan(1)=45 (DEG)', () => {
  assert.ok(close(CalcEngine.evaluate('atan(1)', 'DEG'), 45));
});

test('AC-02 RAD モードでは sin(pi/2)=1', () => {
  assert.ok(close(CalcEngine.evaluate('sin(pi/2)', 'RAD'), 1));
});

test('AC-03 log10(100)=2', () => {
  assert.ok(close(CalcEngine.evaluate('log(100)'), 2));
});

test('AC-03 ln(e)=1', () => {
  assert.ok(close(CalcEngine.evaluate('ln(e)'), 1));
});

test('AC-03 exp(1)=e', () => {
  assert.ok(close(CalcEngine.evaluate('exp(1)'), Math.E));
});

test('AC-03 sqrt(16)=4', () => {
  assert.equal(CalcEngine.evaluate('sqrt(16)'), 4);
});

test('AC-03 sq(7)=49 (x^2)', () => {
  assert.equal(CalcEngine.evaluate('sq(7)'), 49);
});

test('AC-03 x^y 2^10=1024', () => {
  assert.equal(CalcEngine.evaluate('2^10'), 1024);
});

test('AC-03 右結合性 2^3^2 = 2^(3^2) = 512', () => {
  assert.equal(CalcEngine.evaluate('2^3^2'), 512);
});

test('AC-04 定数 pi', () => {
  assert.equal(CalcEngine.evaluate('pi'), Math.PI);
});

test('AC-04 定数 e', () => {
  assert.equal(CalcEngine.evaluate('e'), Math.E);
});

test('AC-09 ゼロ除算は Div by zero エラー', () => {
  assert.throws(() => CalcEngine.evaluate('1/0'), /Div by zero/);
});

test('AC-09 asin(2) は Domain エラー', () => {
  assert.throws(() => CalcEngine.evaluate('asin(2)'), /Domain/);
});

test('AC-09 sqrt(-1) は Domain エラー', () => {
  assert.throws(() => CalcEngine.evaluate('sqrt(-1)'), /Domain/);
});

test('AC-09 log(0) は Div by zero エラー (-Infinity)', () => {
  assert.throws(() => CalcEngine.evaluate('log(0)'), /Div by zero/);
});

test('AC-09 括弧不一致は Syntax エラー', () => {
  assert.throws(() => CalcEngine.evaluate('(1+2'), /Syntax/);
  assert.throws(() => CalcEngine.evaluate('1+2)'), /Syntax/);
});

test('AC-09 不正な識別子は Syntax エラー', () => {
  assert.throws(() => CalcEngine.evaluate('foo(1)'), /Syntax/);
});

test('単項マイナス -3+5=2', () => {
  assert.equal(CalcEngine.evaluate('-3+5'), 2);
});

test('format: 整数', () => {
  assert.equal(CalcEngine.format(42), '42');
});

test('format: 0', () => {
  assert.equal(CalcEngine.format(0), '0');
});

test('format: 小数の末尾ゼロ削除', () => {
  assert.equal(CalcEngine.format(1.5), '1.5');
});

test('format: NaN/Infinity は Error', () => {
  assert.equal(CalcEngine.format(NaN), 'Error');
  assert.equal(CalcEngine.format(Infinity), 'Error');
});

test('format: 極大値は指数表記', () => {
  assert.match(CalcEngine.format(1e15), /e\+?\d+/);
});
