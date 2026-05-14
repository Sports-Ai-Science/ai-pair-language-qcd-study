// integration.test.mjs — state ↔ engine の統合テスト（AC-07 履歴中心）
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadCalc } from "./_load.mjs";

const Calc = loadCalc();

function compute(s, exprTokens) {
  // 1 件の式トークン列を打ち込んで `=` で評価し、AC でクリアする運用ヘルパ。
  exprTokens.forEach((t) => s.apply(t));
  s.apply("=");
  s.apply("AC");
}

test("AC-07 履歴に直近の評価が積まれる", () => {
  const s = Calc.state.create();
  compute(s, ["1", "+", "2"]);
  compute(s, ["3", "*", "4"]);
  const snap = s.snapshot();
  assert.equal(snap.history.length, 2);
  assert.equal(snap.history[0], "1+2 = 3");
  assert.equal(snap.history[1], "3*4 = 12");
});

test("AC-07 履歴は 10 件で打ち切り、古いものが落ちる (FIFO)", () => {
  const s = Calc.state.create();
  for (let i = 1; i <= 12; i++) compute(s, [String(i), "+", "0"]);
  const snap = s.snapshot();
  assert.equal(snap.history.length, 10);
  assert.equal(snap.history[0], "3+0 = 3");
  assert.equal(snap.history[snap.history.length - 1], "12+0 = 12");
});

test("AC-07 エラー評価は履歴に積まれない", () => {
  const s = Calc.state.create();
  compute(s, ["1", "+", "2"]);
  // ゼロ除算 → エラー、履歴は 1 件のまま
  s.apply("1"); s.apply("/"); s.apply("0"); s.apply("=");
  const snap = s.snapshot();
  assert.equal(snap.history.length, 1);
  assert.equal(snap.error, "div0");
});

test("メモリと履歴の連携: M+ で結果を加算、MR でバッファ復元", () => {
  const s = Calc.state.create();
  // M+ は AC で lastResult が消える前に行う必要がある（仕様）。
  ["7", "+", "3", "="].forEach((t) => s.apply(t));
  s.memAdd();
  assert.equal(s.snapshot().memory, 10);
  s.clearAll();
  s.memRecall();
  assert.equal(s.snapshot().buffer, "10");
});

test("関数連鎖: sin(45) を 2 乗し cos(45) と足して 1 になる (DEG)", () => {
  const s = Calc.state.create();
  // sq(sin(45)) + sq(cos(45)) = 1
  ["sq", "sin", "4", "5", ")", ")", "+", "sq", "cos", "4", "5", ")", ")", "="]
    .forEach((t) => s.apply(t));
  const v = parseFloat(s.snapshot().display);
  assert.ok(Math.abs(v - 1) < 1e-9);
});

test("DEG/RAD 切替後の評価が一貫する", () => {
  const s = Calc.state.create();
  s.setMode("RAD");
  ["sin", "pi", "/", "2", ")", "="].forEach((t) => s.apply(t));
  assert.equal(parseFloat(s.snapshot().display), 1);
  s.apply("AC");
  s.setMode("DEG");
  ["sin", "9", "0", ")", "="].forEach((t) => s.apply(t));
  assert.equal(parseFloat(s.snapshot().display), 1);
});

test("snapshot はイミュータブルなビューを返す（履歴は copy）", () => {
  const s = Calc.state.create();
  compute(s, ["1", "+", "1"]);
  const snap1 = s.snapshot();
  snap1.history.push("tampered");
  const snap2 = s.snapshot();
  assert.equal(snap2.history.length, 1);
});
