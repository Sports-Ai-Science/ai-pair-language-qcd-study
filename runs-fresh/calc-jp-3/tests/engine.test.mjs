// engine.test.mjs — engine.evaluate のユニットテスト
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadCalc } from "./_load.mjs";

const Calc = loadCalc();
const ev = (s, m = "DEG") => Calc.engine.evaluate(s, m);
const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

test("AC-01 四則演算: 加減乗除と優先順位", () => {
  assert.equal(ev("1+2"), 3);
  assert.equal(ev("10-4"), 6);
  assert.equal(ev("3*4"), 12);
  assert.equal(ev("20/4"), 5);
  assert.equal(ev("1+2*3"), 7);
  assert.equal(ev("(1+2)*3"), 9);
  assert.equal(ev("-5+3"), -2);
});

test("AC-02 三角関数: DEG モードで sin/cos/tan", () => {
  assert.ok(close(ev("sin(0)"), 0));
  assert.ok(close(ev("sin(90)"), 1));
  assert.ok(close(ev("cos(0)"), 1));
  assert.ok(close(ev("cos(180)"), -1));
  assert.ok(close(ev("tan(45)"), 1, 1e-9));
});

test("AC-02 三角関数: RAD モードと逆関数", () => {
  assert.ok(close(ev("sin(pi/2)", "RAD"), 1));
  assert.ok(close(ev("cos(pi)", "RAD"), -1));
  assert.ok(close(ev("asin(1)"), 90));
  assert.ok(close(ev("acos(0)"), 90));
  assert.ok(close(ev("atan(1)"), 45));
  assert.ok(close(ev("asin(1)", "RAD"), Math.PI / 2));
});

test("AC-03 対数・指数・冪・平方根", () => {
  assert.ok(close(ev("log10(1000)"), 3));
  assert.ok(close(ev("ln(e)"), 1));
  assert.ok(close(ev("exp(1)"), Math.E));
  assert.ok(close(ev("sqrt(16)"), 4));
  assert.ok(close(ev("sq(7)"), 49));
  assert.ok(close(ev("2^10"), 1024));
  assert.ok(close(ev("pow(2,10)"), 1024));
});

test("AC-04 定数 pi, e", () => {
  assert.equal(ev("pi"), Math.PI);
  assert.equal(ev("e"), Math.E);
  assert.ok(close(ev("2*pi"), 2 * Math.PI));
});

test("AC-05 DEG/RAD 切替が三角関数の引数解釈に効く", () => {
  assert.ok(close(ev("sin(90)", "DEG"), 1));
  assert.ok(close(ev("sin(90)", "RAD"), Math.sin(90)));
});

test("AC-09 ゼロ除算は Error('div0') を返す", () => {
  const r = ev("1/0");
  assert.ok(r instanceof Error);
  assert.equal(r.message, "div0");
});

test("AC-09 定義域外: log10(0), ln(-1), sqrt(-1), asin(2)", () => {
  for (const expr of ["log10(0)", "ln(-1)", "sqrt(-1)", "asin(2)", "acos(-3)"]) {
    const r = ev(expr);
    assert.ok(r instanceof Error, expr + " should return Error");
    assert.equal(r.message, "domain", expr + " should have code 'domain'");
  }
});

test("AC-09 構文エラー: 不正トークン・カッコ不一致", () => {
  for (const expr of ["1+", "(1+2", "1++2", "@@@", "sin"]) {
    const r = ev(expr);
    assert.ok(r instanceof Error, expr + " should return Error");
    assert.equal(r.message, "syntax", expr + " should be syntax");
  }
});

test("演算子: 単項マイナス、冪の右結合", () => {
  // SRS: factor := unary ('^' factor)? のため、-2^2 は (-2)^2 = 4。
  // 数学慣習の -2^2 = -4 が必要なら明示的に -(2^2) と書く。
  assert.equal(ev("-2^2"), 4);
  assert.equal(ev("-(2^2)"), -4);
  assert.equal(ev("2^3^2"), 512); // 右結合: 2^(3^2) = 2^9
});

test("tokenize/parse は内部 API として動作する", () => {
  const toks = Calc.engine.tokenize("1+2*3");
  assert.equal(toks.length, 5);
  const ast = Calc.engine.parse(toks);
  assert.equal(ast.type, "bin");
  assert.equal(ast.op, "+");
});
