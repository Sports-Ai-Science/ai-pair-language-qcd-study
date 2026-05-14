// 統合テスト: state と engine の連携、AC-07 履歴 10 件 FIFO を検証する。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CalcState } from './_load.mjs';

// expr 文字列を 1 文字ずつ input してから equals を呼ぶヘルパ。
function compute(state, expr) {
  let s = state;
  for (const ch of expr) s = CalcState.input(s, ch);
  return CalcState.equals(s);
}

test('AC-07 履歴は最大 10 件で FIFO', () => {
  let s = CalcState.create();
  // 12 回計算 → 最古 2 件は破棄され直近 10 件が残る
  for (let i = 1; i <= 12; i++) {
    s = compute(s, String(i) + '+0');
    s = CalcState.clear(s);
  }
  assert.equal(s.history.length, 10);
  // 最新は 12+0、最古 (index 9) は 3+0
  assert.equal(s.history[0].expr, '12+0');
  assert.equal(s.history[0].result, '12');
  assert.equal(s.history[9].expr, '3+0');
});

test('AC-07 履歴は新しい順 (unshift)', () => {
  let s = CalcState.create();
  s = compute(s, '1+1'); s = CalcState.clear(s);
  s = compute(s, '2+2'); s = CalcState.clear(s);
  s = compute(s, '3+3'); s = CalcState.clear(s);
  assert.equal(s.history[0].expr, '3+3');
  assert.equal(s.history[1].expr, '2+2');
  assert.equal(s.history[2].expr, '1+1');
});

test('AC-07 エラー時は履歴に追加されない', () => {
  let s = CalcState.create();
  s = compute(s, '1/0'); // エラー
  assert.equal(s.history.length, 0);
  s = compute(s, '2+3');
  assert.equal(s.history.length, 1);
});

test('AC-05 角度モード切替後の計算が反映される', () => {
  let s = CalcState.create();
  // DEG: sin(90)=1
  s = compute(s, 'sin(90)');
  assert.match(s.display, /^(1|0\.99999)/);
  s = CalcState.clear(s);
  s = CalcState.toggleAngle(s);
  // RAD: sin(90) ≒ 0.8939
  s = compute(s, 'sin(90)');
  assert.match(s.display, /^0\.89/);
});

test('メモリと計算式の連携: M+ → MR → 計算', () => {
  let s = CalcState.create();
  // 5 を memory に入れる
  s = CalcState.input(s, '5');
  s = CalcState.memoryPlus(s);
  s = CalcState.clear(s);
  // memory recall → 5 が表示
  s = CalcState.memoryRecall(s);
  assert.equal(s.display, '5');
  // 続けて +3 → 8
  s = CalcState.input(s, '+');
  s = CalcState.input(s, '3');
  s = CalcState.equals(s);
  assert.equal(s.display, '8');
});

test('連続計算: 2+3 = 5, 続けて *4 = 20', () => {
  let s = CalcState.create();
  s = compute(s, '2+3');
  assert.equal(s.display, '5');
  // equals 後 expr が '5' になっているので続けて入力
  s = CalcState.input(s, '*');
  s = CalcState.input(s, '4');
  s = CalcState.equals(s);
  assert.equal(s.display, '20');
});

test('複合演算: (1+2)*3-4/2 = 7', () => {
  let s = CalcState.create();
  s = compute(s, '(1+2)*3-4/2');
  assert.equal(s.display, '7');
});

test('単項関数の連鎖: sqrt(sq(5)) = 5', () => {
  let s = CalcState.create();
  s = compute(s, 'sqrt(sq(5))');
  assert.equal(s.display, '5');
});

test('AC-09 → 回復 → 通常計算', () => {
  let s = CalcState.create();
  s = compute(s, 'asin(2)'); // Domain
  assert.equal(s.display, 'Error');
  s = CalcState.input(s, '7'); // 自動回復
  assert.equal(s.display, '7');
  s = CalcState.input(s, '+');
  s = CalcState.input(s, '3');
  s = CalcState.equals(s);
  assert.equal(s.display, '10');
});
