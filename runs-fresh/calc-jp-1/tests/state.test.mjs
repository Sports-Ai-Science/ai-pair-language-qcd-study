// state.test.mjs — state.js のメモリ・履歴・モード・整形に対するユニットテスト
// AC-06 の M+/M-/MR/MC をカバーする
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { CalcState } from "./_load.mjs";

beforeEach(() => CalcState._reset());

// AC-06: メモリ操作
test("AC-06 MC 初期値は 0", () => {
  assert.equal(CalcState.memoryRecall(), 0);
});
test("AC-06 M+ で加算", () => {
  CalcState.memoryAdd(5);
  CalcState.memoryAdd(3);
  assert.equal(CalcState.memoryRecall(), 8);
});
test("AC-06 M- で減算", () => {
  CalcState.memoryAdd(10);
  CalcState.memorySub(4);
  assert.equal(CalcState.memoryRecall(), 6);
});
test("AC-06 MC でクリア", () => {
  CalcState.memoryAdd(99);
  CalcState.memoryClear();
  assert.equal(CalcState.memoryRecall(), 0);
});

// 入力バッファ
test("append でバッファに連結", () => {
  CalcState.append("1");
  CalcState.append("+");
  CalcState.append("2");
  assert.equal(CalcState.getExpr(), "1+2");
});
test("backspace で末尾削除", () => {
  CalcState.append("123");
  CalcState.backspace();
  assert.equal(CalcState.getExpr(), "12");
});
test("clear で初期化", () => {
  CalcState.append("99");
  CalcState.clear();
  assert.equal(CalcState.getExpr(), "");
  assert.equal(CalcState.getDisplay(), "0");
});

// モード切替（AC-05 関連）
test("DEG/RAD トグル", () => {
  assert.equal(CalcState.getMode(), "DEG");
  assert.equal(CalcState.toggleMode(), "RAD");
  assert.equal(CalcState.toggleMode(), "DEG");
});

// エラーロック
test("setResult('Error') 後は append が無効", () => {
  CalcState.setResult("Error");
  assert.equal(CalcState.isLocked(), true);
  CalcState.append("9");
  assert.equal(CalcState.getExpr(), "");
  CalcState.clear();
  assert.equal(CalcState.isLocked(), false);
});

// formatNumber 整形
test("formatNumber 整数を文字列化", () => {
  assert.equal(CalcState.formatNumber(42), "42");
});
test("formatNumber 小数末尾ゼロ削除", () => {
  assert.equal(CalcState.formatNumber(1.5), "1.5");
});
test("formatNumber ゼロ", () => {
  assert.equal(CalcState.formatNumber(0), "0");
});
