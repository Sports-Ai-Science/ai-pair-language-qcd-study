import { test } from "node:test";
import { strict as assert } from "node:assert";
import { loadCalculator } from "./_load.mjs";

const { Engine, State } = loadCalculator();

test("integration: history captures evaluated results", () => {
  let state = State.initial();
  const r1 = Engine.evaluate("3*4");
  assert.equal(r1.ok, true);
  state = State.pushHistory(state, "3*4", r1.value);
  const r2 = Engine.evaluate("sqrt(2)");
  assert.equal(r2.ok, true);
  state = State.pushHistory(state, "sqrt(2)", r2.value);
  assert.equal(state.history.length, 2);
  assert.equal(state.history[0].expression, "sqrt(2)");
  assert.equal(state.history[1].value, 12);
});

test("integration: mode change affects next evaluate", () => {
  const state = State.setMode(State.initial(), "DEG");
  const r = Engine.evaluate("sin(90)", state.mode);
  assert.equal(r.ok, true);
  assert.ok(Math.abs(r.value - 1) < 1e-10);
});

test("integration: error does not corrupt subsequent eval", () => {
  let state = State.initial();
  const bad = Engine.evaluate("1/0");
  assert.equal(bad.ok, false);
  assert.equal(state.history.length, 0);
  const good = Engine.evaluate("1+1");
  assert.equal(good.ok, true);
  state = State.pushHistory(state, "1+1", good.value);
  assert.equal(state.history.length, 1);
});

test("integration: 50 evaluations only keep last 10 in history", () => {
  let state = State.initial();
  for (let i = 0; i < 50; i++) {
    const r = Engine.evaluate(`${i}+1`);
    state = State.pushHistory(state, `${i}+1`, r.value);
  }
  assert.equal(state.history.length, 10);
  assert.equal(state.history[0].expression, "49+1");
});
