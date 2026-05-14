// system.spec.mjs — システムテスト：軽量 DOM スタブで AC-08, AC-10 を検証する。
// Node 標準のみで動作させるため、jsdom を使わず最小限の DOM API を実装する。
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = join(here, "..", "src");

function makeDom() {
  // 必要最小限の DOM API。textContent / className / addEventListener を持つ。
  function makeNode(tag) {
    return {
      tagName: tag.toUpperCase(),
      children: [],
      _attrs: {},
      _listeners: {},
      _text: "",
      classList: {
        _set: new Set(),
        add(c) { this._set.add(c); },
        toggle(c, on) { if (on) this._set.add(c); else this._set.delete(c); },
        contains(c) { return this._set.has(c); },
      },
      get className() { return Array.from(this.classList._set).join(" "); },
      set className(v) { this.classList._set = new Set(String(v).split(/\s+/).filter(Boolean)); },
      get textContent() { return this._text; },
      set textContent(v) { this._text = String(v); this.children = []; },
      get innerHTML() { return ""; },
      set innerHTML(_v) { this.children = []; this._text = ""; },
      setAttribute(k, v) { this._attrs[k] = v; },
      getAttribute(k) { return this._attrs[k]; },
      appendChild(c) { this.children.push(c); c.parentNode = this; return c; },
      addEventListener(name, fn) { (this._listeners[name] ||= []).push(fn); },
      dispatch(name, ev) { (this._listeners[name] || []).forEach((f) => f(ev || {})); },
      querySelectorAll(_) { return collectAll(this); },
    };
  }
  function collectAll(node, acc = []) {
    for (const c of node.children) { acc.push(c); collectAll(c, acc); }
    return acc;
  }
  const document = {
    createElement: makeNode,
    _listeners: {},
    addEventListener(name, fn) { (this._listeners[name] ||= []).push(fn); },
    dispatch(name, ev) { (this._listeners[name] || []).forEach((f) => f(ev || {})); },
  };
  return { document, makeNode, collectAll };
}

function loadCalcWithDom() {
  const { document, makeNode, collectAll } = makeDom();
  const ctx = {
    console, Math, Number, parseFloat, isFinite, Object, Error, document,
  };
  ctx.window = ctx;
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const f of ["engine.js", "state.js", "ui.js"]) {
    const code = readFileSync(join(srcDir, f), "utf8");
    vm.runInContext(code, ctx, { filename: f });
  }
  return { Calc: ctx.Calc, document, makeNode, collectAll };
}

test("AC-10 src/index.html は ES modules を使わない（file:// 互換）", () => {
  const html = readFileSync(join(srcDir, "index.html"), "utf8");
  assert.ok(!/type=["']module["']/.test(html), "type=module は禁止");
  assert.ok(!/\bimport\s/.test(html), "import 文は禁止");
  assert.ok(/<script\s+src=["']engine\.js["']>/.test(html));
  assert.ok(/<script\s+src=["']state\.js["']>/.test(html));
  assert.ok(/<script\s+src=["']ui\.js["']>/.test(html));
});

test("AC-10 src/*.js も ES modules を使わない", () => {
  for (const f of ["engine.js", "state.js", "ui.js"]) {
    const code = readFileSync(join(srcDir, f), "utf8");
    assert.ok(!/^\s*import\s/m.test(code), f + " に import 文がある");
    assert.ok(!/^\s*export\s/m.test(code), f + " に export 文がある");
  }
});

test("AC-10 mount で 5 秒以内に UI が描画され、最初の演算が成功する", () => {
  const { Calc, document, collectAll } = loadCalcWithDom();
  const root = document.createElement("main");
  const t0 = Date.now();
  const state = Calc.state.create();
  Calc.ui.mount(root, state);
  const elapsed = Date.now() - t0;
  assert.ok(elapsed < 5000, "mount took " + elapsed + "ms");
  const all = collectAll(root);
  const display = all.find((n) => n.classList.contains("calc-display"));
  assert.ok(display, "display element exists");
  assert.equal(display.textContent, "0");
  // 最初の演算: 1 + 2 = 3
  state.apply("1"); state.apply("+"); state.apply("2"); state.apply("=");
  // 再描画
  const ui = Calc.ui.mount(root, state);
  ui.render();
  const all2 = collectAll(root);
  const disp2 = all2.find((n) => n.classList.contains("calc-display"));
  assert.equal(disp2.textContent, "3");
});

test("AC-08 キーボード入力: 1 + 2 Enter で 3 が表示される", () => {
  const { Calc, document, collectAll } = loadCalcWithDom();
  const root = document.createElement("main");
  const state = Calc.state.create();
  const ui = Calc.ui.mount(root, state);
  // document.dispatch で keydown を流す
  document.dispatch("keydown", { key: "1", preventDefault() {} });
  document.dispatch("keydown", { key: "+", preventDefault() {} });
  document.dispatch("keydown", { key: "2", preventDefault() {} });
  document.dispatch("keydown", { key: "Enter", preventDefault() {} });
  const all = collectAll(root);
  const disp = all.find((n) => n.classList.contains("calc-display"));
  assert.equal(disp.textContent, "3");
});

test("AC-08 キーボード Backspace と Escape", () => {
  const { Calc, document, collectAll } = loadCalcWithDom();
  const root = document.createElement("main");
  const state = Calc.state.create();
  Calc.ui.mount(root, state);
  ["1", "2", "3"].forEach((k) => document.dispatch("keydown", { key: k, preventDefault() {} }));
  document.dispatch("keydown", { key: "Backspace", preventDefault() {} });
  let all = collectAll(root);
  let buf = all.find((n) => n.classList.contains("calc-buffer"));
  assert.equal(buf.textContent, "12");
  document.dispatch("keydown", { key: "Escape", preventDefault() {} });
  all = collectAll(root);
  buf = all.find((n) => n.classList.contains("calc-buffer"));
  assert.equal(buf.textContent, "");
});

test("AC-08 ボタンクリックでも入力できる（クリック経路）", () => {
  const { Calc, document, collectAll } = loadCalcWithDom();
  const root = document.createElement("main");
  const state = Calc.state.create();
  Calc.ui.mount(root, state);
  const buttons = collectAll(root).filter((n) => n.tagName === "BUTTON");
  function click(label) {
    const b = buttons.find((b) => b.getAttribute("data-token") === label);
    assert.ok(b, "button " + label + " exists");
    b.dispatch("click");
  }
  click("9"); click("/"); click("3"); click("=");
  const disp = collectAll(root).find((n) => n.classList.contains("calc-display"));
  assert.equal(disp.textContent, "3");
});

test("AC-09 エラー時は display に Error: <code> を表示し赤字クラス付与", () => {
  const { Calc, document, collectAll } = loadCalcWithDom();
  const root = document.createElement("main");
  const state = Calc.state.create();
  Calc.ui.mount(root, state);
  ["1", "/", "0", "Enter"].forEach((k) =>
    document.dispatch("keydown", { key: k, preventDefault() {} }));
  const disp = collectAll(root).find((n) => n.classList.contains("calc-display"));
  assert.equal(disp.textContent, "Error: div0");
  assert.ok(disp.classList.contains("calc-error"));
});

test("制約: src/ ファイル数 ≤ 5、合計 LOC ≤ 510", async () => {
  const { readdirSync, statSync } = await import("node:fs");
  const files = readdirSync(srcDir);
  assert.ok(files.length <= 5, "src/ は 5 ファイル以内");
  let total = 0;
  for (const f of files) {
    const p = join(srcDir, f);
    if (!statSync(p).isFile()) continue;
    total += readFileSync(p, "utf8").split("\n").length;
  }
  assert.ok(total <= 510, "src/ 合計 LOC = " + total + " (上限 510)");
});
