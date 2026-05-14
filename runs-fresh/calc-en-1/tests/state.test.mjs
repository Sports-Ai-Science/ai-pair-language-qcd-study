// state.test.mjs — unit tests for CalcState (memory, history, listeners).
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadCalcModules } from "./_load.mjs";

const { CalcState } = loadCalcModules();

test("AC-06 M+/M-/MR/MC", () => {
  const s = CalcState.create();
  assert.equal(s.memoryRecall(), 0);
  s.memoryAdd(5);
  assert.equal(s.memoryRecall(), 5);
  s.memoryAdd(3);
  assert.equal(s.memoryRecall(), 8);
  s.memorySub(2);
  assert.equal(s.memoryRecall(), 6);
  assert.equal(s.hasMemory(), true);
  s.memoryClear();
  assert.equal(s.memoryRecall(), 0);
  assert.equal(s.hasMemory(), false);
});

test("expr append/backspace/clear", () => {
  const s = CalcState.create();
  s.append("1");
  s.append("+");
  s.append("2");
  assert.equal(s.getExpr(), "1+2");
  s.backspace();
  assert.equal(s.getExpr(), "1+");
  s.clear();
  assert.equal(s.getExpr(), "");
  assert.equal(s.getDisplay(), "0");
});

test("history pushes are FIFO and capped at 10", () => {
  const s = CalcState.create();
  for (let i = 0; i < 15; i++) {
    s.pushHistory({ expr: "1+" + i, result: String(1 + i) });
  }
  const h = s.getHistory();
  assert.equal(h.length, 10);
  // Newest first
  assert.equal(h[0].expr, "1+14");
  assert.equal(h[9].expr, "1+5");
});

test("history returns a defensive copy", () => {
  const s = CalcState.create();
  s.pushHistory({ expr: "1+1", result: "2" });
  const h = s.getHistory();
  h.push({ expr: "x", result: "y" });
  assert.equal(s.getHistory().length, 1);
});

test("angle mode toggle and set", () => {
  const s = CalcState.create();
  assert.equal(s.getAngleMode(), "RAD");
  s.toggleAngleMode();
  assert.equal(s.getAngleMode(), "DEG");
  s.setAngleMode("RAD");
  assert.equal(s.getAngleMode(), "RAD");
  s.setAngleMode("invalid");
  assert.equal(s.getAngleMode(), "RAD");
});

test("subscribe is invoked after mutations and unsubscribe stops it", () => {
  const s = CalcState.create();
  let count = 0;
  const off = s.subscribe(() => { count++; });
  s.append("1");
  s.append("2");
  assert.ok(count >= 2);
  const before = count;
  off();
  s.append("3");
  assert.equal(count, before);
});
