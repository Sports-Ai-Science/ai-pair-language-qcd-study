import { test } from "node:test";
import { strict as assert } from "node:assert";
import { loadCalculator } from "./_load.mjs";

const { State } = loadCalculator();
const { initial, setMemory, addToMemory, subFromMemory, clearMemory,
        pushHistory, setMode, HISTORY_LIMIT } = State;

// AC-06
test("AC-06 initial memory is 0", () => { assert.equal(initial().memory, 0); });
test("AC-06 setMemory", () => { assert.equal(setMemory(initial(), 42).memory, 42); });
test("AC-06 addToMemory", () => { assert.equal(addToMemory(setMemory(initial(), 10), 5).memory, 15); });
test("AC-06 subFromMemory", () => { assert.equal(subFromMemory(setMemory(initial(), 10), 3).memory, 7); });
test("AC-06 clearMemory", () => { assert.equal(clearMemory(setMemory(initial(), 99)).memory, 0); });

// AC-07
test("AC-07 history starts empty", () => { assert.equal(initial().history.length, 0); });
test("AC-07 pushHistory keeps newest first", () => {
  let s = initial();
  s = pushHistory(s, "1+1", 2);
  s = pushHistory(s, "2*3", 6);
  assert.equal(s.history[0].expression, "2*3");
  assert.equal(s.history[1].expression, "1+1");
});
test("AC-07 history capped at HISTORY_LIMIT (10)", () => {
  let s = initial();
  for (let i = 1; i <= 15; i++) s = pushHistory(s, `expr${i}`, i);
  assert.equal(s.history.length, HISTORY_LIMIT);
  assert.equal(s.history[0].expression, "expr15");
  assert.equal(s.history[9].expression, "expr6");
});

// AC-05
test("AC-05 default mode is RAD", () => { assert.equal(initial().mode, "RAD"); });
test("AC-05 setMode toggles", () => { assert.equal(setMode(initial(), "DEG").mode, "DEG"); });
test("AC-05 setMode rejects invalid", () => { assert.throws(() => setMode(initial(), "GRAD")); });

// Immutability
test("state is immutable (frozen)", () => {
  const s = initial();
  assert.throws(() => { s.memory = 99; });
});
test("history is immutable", () => {
  let s = pushHistory(initial(), "1+1", 2);
  assert.throws(() => { s.history.push({}); });
});
