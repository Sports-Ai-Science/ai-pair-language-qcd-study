// state.js の単体テスト。AC-05 (DEG/RAD), AC-06 (M+/M-/MR/MC), AC-09 (エラー回復) を検証する。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CalcState, CalcEngine } from './_load.mjs';

test('create: 初期状態', () => {
  const s = CalcState.create();
  assert.equal(s.display, '0');
  assert.equal(s.expr, '');
  assert.equal(s.memory, 0);
  assert.deepEqual(s.history, []);
  assert.equal(s.angleMode, 'DEG');
  assert.equal(s.lastError, null);
});

test('input: 数字を 1 つずつ追記', () => {
  let s = CalcState.create();
  s = CalcState.input(s, '1');
  s = CalcState.input(s, '2');
  s = CalcState.input(s, '3');
  assert.equal(s.expr, '123');
  assert.equal(s.display, '123');
});

test('input: 演算子も追記できる', () => {
  let s = CalcState.create();
  s = CalcState.input(s, '1');
  s = CalcState.input(s, '+');
  s = CalcState.input(s, '2');
  assert.equal(s.expr, '1+2');
});

test('equals: 計算成功時は履歴に追加される', () => {
  let s = CalcState.create();
  s = CalcState.input(s, '2');
  s = CalcState.input(s, '+');
  s = CalcState.input(s, '3');
  s = CalcState.equals(s);
  assert.equal(s.display, '5');
  assert.equal(s.history.length, 1);
  assert.equal(s.history[0].expr, '2+3');
  assert.equal(s.history[0].result, '5');
});

test('AC-09 equals: ゼロ除算は Error 表示', () => {
  let s = CalcState.create();
  s = CalcState.input(s, '1');
  s = CalcState.input(s, '/');
  s = CalcState.input(s, '0');
  s = CalcState.equals(s);
  assert.equal(s.display, 'Error');
  assert.equal(s.lastError, 'Div by zero');
});

test('AC-09 エラー後の入力で自動回復', () => {
  let s = CalcState.create();
  s = CalcState.input(s, '1');
  s = CalcState.input(s, '/');
  s = CalcState.input(s, '0');
  s = CalcState.equals(s);
  s = CalcState.input(s, '5');
  assert.equal(s.display, '5');
  assert.equal(s.lastError, null);
});

test('clear: 全リセット', () => {
  let s = CalcState.create();
  s = CalcState.input(s, '7');
  s = CalcState.clear(s);
  assert.equal(s.display, '0');
  assert.equal(s.expr, '');
});

test('backspace: 1 文字削除', () => {
  let s = CalcState.create();
  s = CalcState.input(s, '1');
  s = CalcState.input(s, '2');
  s = CalcState.input(s, '3');
  s = CalcState.backspace(s);
  assert.equal(s.expr, '12');
});

test('backspace: 空になったら 0 表示', () => {
  let s = CalcState.create();
  s = CalcState.input(s, '5');
  s = CalcState.backspace(s);
  assert.equal(s.display, '0');
});

test('AC-06 memoryPlus: 現在値を加算', () => {
  let s = CalcState.create();
  s = CalcState.input(s, '7');
  s = CalcState.memoryPlus(s);
  assert.equal(s.memory, 7);
  s = CalcState.memoryPlus(s);
  assert.equal(s.memory, 14);
});

test('AC-06 memoryMinus: 現在値を減算', () => {
  let s = CalcState.create();
  s = CalcState.input(s, '5');
  s = CalcState.memoryPlus(s);
  s = CalcState.memoryMinus(s);
  assert.equal(s.memory, 0);
});

test('AC-06 memoryRecall: 表示にメモリ値', () => {
  let s = CalcState.create();
  s = CalcState.input(s, '4');
  s = CalcState.input(s, '2');
  s = CalcState.memoryPlus(s);
  s = CalcState.clear(s);
  s = CalcState.memoryRecall(s);
  assert.equal(s.display, '42');
});

test('AC-06 memoryClear: メモリ 0 に', () => {
  let s = CalcState.create();
  s = CalcState.input(s, '9');
  s = CalcState.memoryPlus(s);
  s = CalcState.memoryClear(s);
  assert.equal(s.memory, 0);
});

test('AC-05 toggleAngle: DEG -> RAD -> DEG', () => {
  let s = CalcState.create();
  assert.equal(s.angleMode, 'DEG');
  s = CalcState.toggleAngle(s);
  assert.equal(s.angleMode, 'RAD');
  s = CalcState.toggleAngle(s);
  assert.equal(s.angleMode, 'DEG');
});

test('applyUnary: sin(90) DEG = 1', () => {
  let s = CalcState.create();
  s = CalcState.input(s, '9');
  s = CalcState.input(s, '0');
  s = CalcState.applyUnary(s, 'sin');
  // 浮動小数誤差で 0.99999... の可能性があるので接頭辞だけチェック
  assert.match(s.display, /^(1|0\.99999)/);
});

test('applyUnary: sqrt(-1) は Error', () => {
  let s = CalcState.create();
  s = CalcState.input(s, '-');
  s = CalcState.input(s, '1');
  s = CalcState.applyUnary(s, 'sqrt');
  assert.equal(s.display, 'Error');
});

test('イミュータビリティ: input は新オブジェクトを返す', () => {
  const s1 = CalcState.create();
  const s2 = CalcState.input(s1, '5');
  assert.notEqual(s1, s2);
  assert.equal(s1.expr, '');
  assert.equal(s2.expr, '5');
});
