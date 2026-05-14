// Unit tests for engine.js. Loaded via vm context (file:// compatibility
// means engine.js is a classic script, not an ES module).
import { test } from "node:test";
import { strict as assert } from "node:assert";
import { loadCalculator } from "./_load.mjs";

const { Engine } = loadCalculator();
const { evaluate, formatNumber } = Engine;

const close = (a, b, eps = 1e-10) => Math.abs(a - b) < eps;

// AC-01
test("AC-01 addition", () => { const r = evaluate("1+2"); assert.equal(r.ok, true); assert.equal(r.value, 3); });
test("AC-01 subtraction", () => { const r = evaluate("10-3"); assert.equal(r.ok, true); assert.equal(r.value, 7); });
test("AC-01 multiplication", () => { const r = evaluate("4*5"); assert.equal(r.ok, true); assert.equal(r.value, 20); });
test("AC-01 division", () => { const r = evaluate("20/4"); assert.equal(r.ok, true); assert.equal(r.value, 5); });
test("AC-01 precedence", () => { const r = evaluate("2+3*4"); assert.equal(r.ok, true); assert.equal(r.value, 14); });
test("AC-01 parentheses", () => { const r = evaluate("(2+3)*4"); assert.equal(r.ok, true); assert.equal(r.value, 20); });
test("AC-01 unary minus", () => { const r = evaluate("-5+3"); assert.equal(r.ok, true); assert.equal(r.value, -2); });

// AC-02
test("AC-02 sin(0) = 0 (RAD)", () => { const r = evaluate("sin(0)", "RAD"); assert.equal(r.ok, true); assert.ok(close(r.value, 0)); });
test("AC-02 sin(pi/2) = 1 (RAD)", () => { const r = evaluate("sin(pi/2)", "RAD"); assert.equal(r.ok, true); assert.ok(close(r.value, 1)); });
test("AC-02 cos(0) = 1", () => { const r = evaluate("cos(0)", "RAD"); assert.equal(r.ok, true); assert.ok(close(r.value, 1)); });
test("AC-02 sin(90) = 1 (DEG)", () => { const r = evaluate("sin(90)", "DEG"); assert.equal(r.ok, true); assert.ok(close(r.value, 1)); });
test("AC-02 atan(1) = pi/4 (RAD)", () => { const r = evaluate("atan(1)", "RAD"); assert.equal(r.ok, true); assert.ok(close(r.value, Math.PI / 4)); });
test("AC-02 atan(1) = 45 (DEG)", () => { const r = evaluate("atan(1)", "DEG"); assert.equal(r.ok, true); assert.ok(close(r.value, 45)); });
test("AC-02 asin out of domain", () => { const r = evaluate("asin(2)"); assert.equal(r.ok, false); assert.match(r.error, /domain/); });

// AC-03
test("AC-03 log10(1000) = 3", () => { const r = evaluate("log10(1000)"); assert.equal(r.ok, true); assert.ok(close(r.value, 3)); });
test("AC-03 ln(e) = 1", () => { const r = evaluate("ln(e)"); assert.equal(r.ok, true); assert.ok(close(r.value, 1)); });
test("AC-03 exp(0) = 1", () => { const r = evaluate("exp(0)"); assert.equal(r.ok, true); assert.ok(close(r.value, 1)); });
test("AC-03 sqrt(16) = 4", () => { const r = evaluate("sqrt(16)"); assert.equal(r.ok, true); assert.ok(close(r.value, 4)); });
test("AC-03 5^2 = 25", () => { const r = evaluate("5^2"); assert.equal(r.ok, true); assert.equal(r.value, 25); });
test("AC-03 2^10 = 1024", () => { const r = evaluate("2^10"); assert.equal(r.ok, true); assert.equal(r.value, 1024); });
test("AC-03 power right-assoc 2^3^2 = 512", () => { const r = evaluate("2^3^2"); assert.equal(r.ok, true); assert.equal(r.value, 512); });

// AC-04
test("AC-04 pi", () => { const r = evaluate("pi"); assert.equal(r.ok, true); assert.ok(close(r.value, Math.PI)); });
test("AC-04 e", () => { const r = evaluate("e"); assert.equal(r.ok, true); assert.ok(close(r.value, Math.E)); });

// AC-09
test("AC-09 division by zero", () => { const r = evaluate("1/0"); assert.equal(r.ok, false); assert.match(r.error, /division by zero/); });
test("AC-09 log of zero", () => { const r = evaluate("log10(0)"); assert.equal(r.ok, false); assert.match(r.error, /log domain/); });
test("AC-09 log of negative", () => { const r = evaluate("ln(-1)"); assert.equal(r.ok, false); assert.match(r.error, /log domain/); });
test("AC-09 sqrt of negative", () => { const r = evaluate("sqrt(-1)"); assert.equal(r.ok, false); assert.match(r.error, /sqrt domain/); });
test("AC-09 parse error on garbage", () => { const r = evaluate("abc???"); assert.equal(r.ok, false); assert.match(r.error, /parse/); });
test("AC-09 empty input is parse error", () => { const r = evaluate(""); assert.equal(r.ok, false); });

// formatNumber
test("formatNumber integer", () => { assert.equal(formatNumber(42), "42"); });
test("formatNumber strips trailing zeros", () => { assert.equal(formatNumber(1.5), "1.5"); });
test("formatNumber 12 sig digits", () => {
  const s = formatNumber(1 / 3);
  assert.ok(s.startsWith("0.333333333333"), `got ${s}`);
});
