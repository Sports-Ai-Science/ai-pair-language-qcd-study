// engine.test.mjs — engine.js の純粋関数に対するユニットテスト
// AC-01〜AC-05, AC-09 をカバーする
import { test } from "node:test";
import assert from "node:assert/strict";
import { CalcEngine } from "./_load.mjs";

const EPS = 1e-9;
const close = (a, b) => Math.abs(a - b) < EPS;

// AC-01: 四則演算
test("AC-01 加算", () => {
  assert.equal(CalcEngine.evaluate("1+2", "DEG"), 3);
});
test("AC-01 減算", () => {
  assert.equal(CalcEngine.evaluate("10-3", "DEG"), 7);
});
test("AC-01 乗算と優先度", () => {
  assert.equal(CalcEngine.evaluate("2+3*4", "DEG"), 14);
});
test("AC-01 除算", () => {
  assert.equal(CalcEngine.evaluate("20/4", "DEG"), 5);
});
test("AC-01 単項マイナスと括弧", () => {
  assert.equal(CalcEngine.evaluate("-(2+3)", "DEG"), -5);
});

// AC-02: 三角関数（DEG/RAD 両モード）
test("AC-02 sin(30) = 0.5 (DEG)", () => {
  assert.ok(close(CalcEngine.evaluate("sin(30)", "DEG"), 0.5));
});
test("AC-02 cos(0) = 1", () => {
  assert.ok(close(CalcEngine.evaluate("cos(0)", "DEG"), 1));
});
test("AC-02 tan(45) = 1 (DEG)", () => {
  assert.ok(close(CalcEngine.evaluate("tan(45)", "DEG"), 1));
});
test("AC-02 asin(1) = 90 (DEG)", () => {
  assert.ok(close(CalcEngine.evaluate("asin(1)", "DEG"), 90));
});
test("AC-02 acos(0) = 90 (DEG)", () => {
  assert.ok(close(CalcEngine.evaluate("acos(0)", "DEG"), 90));
});
test("AC-02 atan(1) = 45 (DEG)", () => {
  assert.ok(close(CalcEngine.evaluate("atan(1)", "DEG"), 45));
});

// AC-03: log/ln/exp/sqrt/x^2/x^y
test("AC-03 log(100) = 2", () => {
  assert.ok(close(CalcEngine.evaluate("log(100)", "DEG"), 2));
});
test("AC-03 ln(E)", () => {
  assert.ok(close(CalcEngine.evaluate("ln(E)", "DEG"), 1));
});
test("AC-03 exp(0) = 1", () => {
  assert.equal(CalcEngine.evaluate("exp(0)", "DEG"), 1);
});
test("AC-03 sqrt(16) = 4", () => {
  assert.equal(CalcEngine.evaluate("sqrt(16)", "DEG"), 4);
});
test("AC-03 x^2 (sq) = 25", () => {
  assert.equal(CalcEngine.evaluate("sq(5)", "DEG"), 25);
});
test("AC-03 x^y (2^10) = 1024", () => {
  assert.equal(CalcEngine.evaluate("2^10", "DEG"), 1024);
});

// AC-04: 定数 pi / e
test("AC-04 PI 定数", () => {
  assert.ok(close(CalcEngine.evaluate("PI", "DEG"), Math.PI));
});
test("AC-04 E 定数", () => {
  assert.ok(close(CalcEngine.evaluate("E", "DEG"), Math.E));
});

// AC-05: DEG/RAD 切替
test("AC-05 RAD モードで sin(PI/2) = 1", () => {
  assert.ok(close(CalcEngine.evaluate("sin(PI/2)", "RAD"), 1));
});
test("AC-05 RAD モードで cos(PI) = -1", () => {
  assert.ok(close(CalcEngine.evaluate("cos(PI)", "RAD"), -1));
});

// AC-09: ゼロ除算と定義域外エラー
test("AC-09 ゼロ除算でエラー", () => {
  assert.throws(() => CalcEngine.evaluate("1/0", "DEG"), /Math error/);
});
test("AC-09 asin(2) で定義域エラー", () => {
  assert.throws(() => CalcEngine.evaluate("asin(2)", "DEG"), /Math error/);
});
test("AC-09 log(0) で定義域エラー", () => {
  assert.throws(() => CalcEngine.evaluate("log(0)", "DEG"), /Math error/);
});
test("AC-09 sqrt(-1) で定義域エラー", () => {
  assert.throws(() => CalcEngine.evaluate("sqrt(-1)", "DEG"), /Math error/);
});
test("AC-09 不正トークンでエラー", () => {
  assert.throws(() => CalcEngine.evaluate("1+", "DEG"), /Math error/);
});
