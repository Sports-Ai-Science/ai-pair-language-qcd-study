// integration.test.mjs — engine + state cross-module integration tests.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadCalcModules } from "./_load.mjs";

const { CalcEngine, CalcState } = loadCalcModules();

// Helper that mirrors what UI does on '=' press: evaluate the current
// expression, push to history, and update display.
function pressEquals(state) {
  const expr = state.getExpr();
  if (!expr) return;
  const r = CalcEngine.evaluate(expr, { angleMode: state.getAngleMode() });
  if (r.ok) {
    const formatted = CalcEngine.format(r.value);
    state.pushHistory({ expr, result: formatted });
    state.setDisplay(formatted);
    state.setExpr(formatted);
  } else {
    state.setDisplay(r.error);
  }
}

test("AC-07 history records the last 10 evaluations and is FIFO-capped", () => {
  const s = CalcState.create();
  for (let i = 1; i <= 12; i++) {
    s.setExpr(String(i) + "+1");
    pressEquals(s);
  }
  const h = s.getHistory();
  assert.equal(h.length, 10);
  // Newest first: last evaluation was 12+1 = 13
  assert.equal(h[0].expr, "12+1");
  assert.equal(h[0].result, "13");
  // Oldest still kept is 3+1 = 4
  assert.equal(h[9].expr, "3+1");
  assert.equal(h[9].result, "4");
});

test("AC-05 angle mode change affects subsequent evaluations", () => {
  const s = CalcState.create();
  s.setAngleMode("DEG");
  s.setExpr("sin(90)");
  pressEquals(s);
  assert.equal(s.getDisplay(), "1");
  s.setAngleMode("RAD");
  s.setExpr("sin(0)");
  pressEquals(s);
  assert.equal(s.getDisplay(), "0");
});

test("AC-06 + AC-01 memory store, recall, and reuse in expression", () => {
  const s = CalcState.create();
  // Compute 3+4=7 and store in memory via M+
  s.setExpr("3+4");
  pressEquals(s);
  const r = CalcEngine.evaluate(s.getExpr(), { angleMode: s.getAngleMode() });
  assert.ok(r.ok);
  s.memoryAdd(r.value);
  assert.equal(s.memoryRecall(), 7);
  // Use MR in a new expression: 7*2 = 14
  s.clear();
  s.append(String(s.memoryRecall()));
  s.append("*2");
  pressEquals(s);
  assert.equal(s.getDisplay(), "14");
});

test("error during evaluation does not corrupt history", () => {
  const s = CalcState.create();
  s.setExpr("1/0");
  pressEquals(s);
  assert.equal(s.getDisplay(), "Division by zero");
  assert.equal(s.getHistory().length, 0);
  // Recover: clear and run a normal calculation
  s.clear();
  s.setExpr("2+2");
  pressEquals(s);
  assert.equal(s.getDisplay(), "4");
  assert.equal(s.getHistory().length, 1);
});
