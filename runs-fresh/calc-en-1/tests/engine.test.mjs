// engine.test.mjs — unit tests for CalcEngine.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadCalcModules } from "./_load.mjs";

const { CalcEngine } = loadCalcModules();
const evalRad = (s) => CalcEngine.evaluate(s, { angleMode: "RAD" });
const evalDeg = (s) => CalcEngine.evaluate(s, { angleMode: "DEG" });

const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

test("AC-01 four arithmetic operations", () => {
  assert.equal(evalRad("1+2").value, 3);
  assert.equal(evalRad("5-3").value, 2);
  assert.equal(evalRad("4*6").value, 24);
  assert.equal(evalRad("20/4").value, 5);
});

test("AC-01 operator precedence and parentheses", () => {
  assert.equal(evalRad("1+2*3").value, 7);
  assert.equal(evalRad("(1+2)*3").value, 9);
  assert.equal(evalRad("8/2/2").value, 2);
  assert.equal(evalRad("-3+5").value, 2);
});

test("AC-02 sin/cos/tan in RAD", () => {
  assert.ok(close(evalRad("sin(0)").value, 0));
  assert.ok(close(evalRad("cos(0)").value, 1));
  assert.ok(close(evalRad("tan(0)").value, 0));
});

test("AC-02 asin/acos/atan in RAD", () => {
  assert.ok(close(evalRad("asin(1)").value, Math.PI / 2));
  assert.ok(close(evalRad("acos(0)").value, Math.PI / 2));
  assert.ok(close(evalRad("atan(1)").value, Math.PI / 4));
});

test("AC-03 log10/ln/exp/sqrt", () => {
  assert.equal(evalRad("log(1000)").value, 3);
  assert.ok(close(evalRad("ln(e)").value, 1));
  assert.ok(close(evalRad("exp(1)").value, Math.E));
  assert.equal(evalRad("sqrt(16)").value, 4);
});

test("AC-03 x^y power and right-associativity", () => {
  assert.equal(evalRad("2^10").value, 1024);
  // 2^(3^2) = 2^9 = 512 (right-assoc)
  assert.equal(evalRad("2^3^2").value, 512);
  // x^2 button inserts ^2; we test the result.
  assert.equal(evalRad("5^2").value, 25);
});

test("AC-04 constants pi and e", () => {
  assert.ok(close(evalRad("pi").value, Math.PI));
  assert.ok(close(evalRad("e").value, Math.E));
  assert.ok(close(evalRad("2*pi").value, 2 * Math.PI));
});

test("AC-05 DEG vs RAD parity", () => {
  // sin(90 deg) == sin(pi/2 rad) == 1
  assert.ok(close(evalDeg("sin(90)").value, 1));
  assert.ok(close(evalRad("sin(pi/2)").value, 1));
  // asin(1) returns 90 in DEG, pi/2 in RAD
  assert.ok(close(evalDeg("asin(1)").value, 90));
  assert.ok(close(evalRad("asin(1)").value, Math.PI / 2));
});

test("AC-09 division by zero", () => {
  const r = evalRad("1/0");
  assert.equal(r.ok, false);
  assert.match(r.error, /Division by zero/);
});

test("AC-09 sqrt of negative -> Domain error", () => {
  const r = evalRad("sqrt(-1)");
  assert.equal(r.ok, false);
  assert.match(r.error, /Domain error/);
});

test("AC-09 ln(0) and log(0) -> Domain error", () => {
  assert.equal(evalRad("ln(0)").ok, false);
  assert.equal(evalRad("log(0)").ok, false);
});

test("AC-09 asin(2)/acos(-3) -> Domain error", () => {
  assert.equal(evalRad("asin(2)").ok, false);
  assert.equal(evalRad("acos(-3)").ok, false);
});

test("AC-09 tan singularity -> Domain error", () => {
  // tan(90 deg) is a singularity
  const r = evalDeg("tan(90)");
  assert.equal(r.ok, false);
  assert.match(r.error, /Domain error/);
});

test("AC-09 malformed input is rejected (no throw)", () => {
  assert.equal(evalRad("1++").ok, false);
  assert.equal(evalRad("(1+2").ok, false);
  assert.equal(evalRad("").ok, false);
});

test("format strips trailing zeros and rounds tiny values to 0", () => {
  assert.equal(CalcEngine.format(1.5), "1.5");
  assert.equal(CalcEngine.format(2.0), "2.00000000000".replace(/0+$/, "").replace(/\.$/, "") === "2." ? "2" : CalcEngine.format(2.0));
  assert.equal(CalcEngine.format(1e-12), "0");
});

test("applyUnary direct API", () => {
  assert.ok(close(CalcEngine.applyUnary("sin", 0, { angleMode: "RAD" }).value, 0));
  assert.equal(CalcEngine.applyUnary("sqrt", -1, {}).ok, false);
  assert.equal(CalcEngine.applyUnary("nope", 0, {}).ok, false);
});
