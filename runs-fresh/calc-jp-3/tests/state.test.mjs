// state.test.mjs — state のユニットテスト（メモリ・モード・バッファ）
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadCalc } from "./_load.mjs";

const Calc = loadCalc();

test("AC-01/05 buffer に数式を組み立てて評価できる", () => {
  const s = Calc.state.create();
  ["1", "+", "2", "*", "3"].forEach((t) => s.apply(t));
  s.apply("=");
  const snap = s.snapshot();
  assert.equal(snap.display, "7");
});

test("AC-05 setMode で DEG/RAD を切替", () => {
  const s = Calc.state.create();
  assert.equal(s.snapshot().mode, "DEG");
  s.setMode("RAD");
  assert.equal(s.snapshot().mode, "RAD");
  s.apply("DEG");
  assert.equal(s.snapshot().mode, "DEG");
});

test("AC-06 メモリ: M+, M-, MR, MC", () => {
  const s = Calc.state.create();
  ["1", "0", "="].forEach((t) => s.apply(t));
  assert.equal(s.snapshot().display, "10");
  s.memAdd();
  assert.equal(s.snapshot().memory, 10);
  // 評価後は結果が buffer に残るため、新たな計算前に AC で消す。
  s.clearAll();
  ["3", "="].forEach((t) => s.apply(t));
  s.memAdd();
  assert.equal(s.snapshot().memory, 13);
  s.memSub();
  assert.equal(s.snapshot().memory, 10);
  s.clearAll();
  s.memRecall();
  assert.equal(s.snapshot().buffer, "10");
  s.memClear();
  assert.equal(s.snapshot().memory, 0);
});

test("AC-09 エラー時は error フィールドに code が入り display に表示", () => {
  const s = Calc.state.create();
  ["1", "/", "0", "="].forEach((t) => s.apply(t));
  const snap = s.snapshot();
  assert.equal(snap.error, "div0");
  assert.equal(snap.display, "Error: div0");
});

test("backspace と AC", () => {
  const s = Calc.state.create();
  ["1", "2", "3"].forEach((t) => s.apply(t));
  s.backspace();
  assert.equal(s.snapshot().buffer, "12");
  s.clearAll();
  assert.equal(s.snapshot().buffer, "");
});

test("関数トークンは自動で開き括弧を付与する", () => {
  const s = Calc.state.create();
  s.apply("sin");
  assert.equal(s.snapshot().buffer, "sin(");
  ["9", "0", ")", "="].forEach((t) => s.apply(t));
  // sin(90) DEG = 1
  assert.equal(s.snapshot().display, "1");
});

test("UI 表記 x / ÷ は内部で * / / に正規化", () => {
  const s = Calc.state.create();
  ["3", "x", "4", "="].forEach((t) => s.apply(t));
  assert.equal(s.snapshot().display, "12");
  s.clearAll();
  ["8", "÷", "2", "="].forEach((t) => s.apply(t));
  assert.equal(s.snapshot().display, "4");
});

test("空 buffer での評価は no-op", () => {
  const s = Calc.state.create();
  s.evaluate();
  assert.equal(s.snapshot().display, "0");
});
