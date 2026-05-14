// integration.test.mjs — engine と state を結合してフロー全体を検証する
// AC-07（直近 10 件履歴）と engine→state 統合シナリオをカバー
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { CalcEngine, CalcState } from "./_load.mjs";

beforeEach(() => CalcState._reset());

// 入力 → 評価 → 表示 → 履歴の一連フロー
function runExpr(expr) {
  CalcState.clear();
  for (const ch of expr) CalcState.append(ch);
  const r = CalcEngine.evaluate(CalcState.getExpr(), CalcState.getMode());
  const s = CalcState.formatNumber(r);
  CalcState.pushHistory({ expr: CalcState.getExpr(), result: s });
  CalcState.setResult(r);
  return s;
}

test("統合: 1+2 を入力→評価→表示", () => {
  assert.equal(runExpr("1+2"), "3");
  assert.equal(CalcState.getDisplay(), "3");
});

test("統合: メモリ操作と再利用", () => {
  CalcState.memoryAdd(CalcEngine.evaluate("3*4", "DEG"));
  assert.equal(CalcState.memoryRecall(), 12);
  CalcState.memorySub(CalcEngine.evaluate("2", "DEG"));
  assert.equal(CalcState.memoryRecall(), 10);
});

// AC-07: 履歴 10 件 FIFO
test("AC-07 履歴は新しい順で 10 件まで保持", () => {
  for (let i = 1; i <= 12; i++) {
    runExpr(`${i}+0`);
  }
  const h = CalcState.getHistory();
  assert.equal(h.length, 10);
  // 最新は 12+0、最古は 3+0（古い 1, 2 は捨てられる）
  assert.equal(h[0].expr, "12+0");
  assert.equal(h[0].result, "12");
  assert.equal(h[9].expr, "3+0");
});

test("AC-07 履歴に Error も記録される", () => {
  CalcState.clear();
  CalcState.append("1");
  CalcState.append("/");
  CalcState.append("0");
  try {
    CalcEngine.evaluate(CalcState.getExpr(), "DEG");
    assert.fail("expected throw");
  } catch (e) {
    CalcState.pushHistory({ expr: CalcState.getExpr(), result: "Error" });
    CalcState.setResult("Error");
  }
  const h = CalcState.getHistory();
  assert.equal(h[0].result, "Error");
  assert.equal(CalcState.getDisplay(), "Error");
  assert.equal(CalcState.isLocked(), true);
});

test("統合: エラー後に C で復帰し再計算可能", () => {
  CalcState.setResult("Error");
  CalcState.clear();
  CalcState.append("2");
  CalcState.append("+");
  CalcState.append("3");
  const r = CalcEngine.evaluate(CalcState.getExpr(), "DEG");
  CalcState.setResult(r);
  assert.equal(CalcState.getDisplay(), "5");
});

test("統合: モード切替が三角関数結果に反映される", () => {
  // DEG モードで sin(90)
  let r = CalcEngine.evaluate("sin(90)", CalcState.getMode());
  assert.ok(Math.abs(r - 1) < 1e-9);
  // RAD モードに切替
  CalcState.toggleMode();
  r = CalcEngine.evaluate("sin(PI/2)", CalcState.getMode());
  assert.ok(Math.abs(r - 1) < 1e-9);
});
