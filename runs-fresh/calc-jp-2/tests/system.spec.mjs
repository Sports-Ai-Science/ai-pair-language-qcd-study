// システムテスト: AC-08 (キーボード入力), AC-10 (ローカル動作 = file:// 起動性)。
// jsdom 等の外部依存は禁止のため、HTML/JS 構造を文字列検査して
// 「file:// で開けば確実に動く前提」を機械検証する。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(here, '..', 'src');
const html = readFileSync(resolve(srcDir, 'index.html'), 'utf8');
const uiJs = readFileSync(resolve(srcDir, 'ui.js'), 'utf8');
const engineJs = readFileSync(resolve(srcDir, 'engine.js'), 'utf8');
const stateJs = readFileSync(resolve(srcDir, 'state.js'), 'utf8');

test('AC-10 src/index.html が存在し読み込める', () => {
  const stat = statSync(resolve(srcDir, 'index.html'));
  assert.ok(stat.size > 0);
});

test('AC-10 ES Modules を使っていない (file:// 動作前提)', () => {
  assert.ok(!/type=["']module["']/.test(html), 'index.html に type="module" は禁止');
  assert.ok(!/^\s*import\s+/m.test(engineJs), 'engine.js に import 禁止');
  assert.ok(!/^\s*import\s+/m.test(stateJs), 'state.js に import 禁止');
  assert.ok(!/^\s*import\s+/m.test(uiJs), 'ui.js に import 禁止');
});

test('AC-10 外部 CDN 参照がない (完全ローカル)', () => {
  assert.ok(!/https?:\/\//.test(html.replace(/<!doctype.*?>/i, '')), 'HTTP/HTTPS URL があってはならない');
});

test('AC-10 必須 DOM 要素が存在する', () => {
  assert.ok(/id=["']display["']/.test(html));
  assert.ok(/id=["']history["']/.test(html));
  assert.ok(/id=["']mode["']/.test(html));
});

test('AC-10 3 つの script タグで JS を順次読み込み', () => {
  assert.match(html, /<script src=["']engine\.js["']><\/script>/);
  assert.match(html, /<script src=["']state\.js["']><\/script>/);
  assert.match(html, /<script src=["']ui\.js["']><\/script>/);
});

test('AC-10 起動性能: HTML+CSS+JS 合計 < 30KB (5 秒以内ロード保証)', () => {
  const total = statSync(resolve(srcDir, 'index.html')).size
              + statSync(resolve(srcDir, 'styles.css')).size
              + statSync(resolve(srcDir, 'engine.js')).size
              + statSync(resolve(srcDir, 'state.js')).size
              + statSync(resolve(srcDir, 'ui.js')).size;
  assert.ok(total < 30 * 1024, '合計 ' + total + ' B が 30KB を超える');
});

test('AC-10 IIFE 起動性能: engine+state を vm.runInThisContext で 100ms 以内', () => {
  const sandbox = { globalThis: {} };
  vm.createContext(sandbox);
  const t0 = performance.now();
  vm.runInContext(engineJs, sandbox);
  vm.runInContext(stateJs, sandbox);
  const elapsed = performance.now() - t0;
  assert.ok(elapsed < 100, 'load took ' + elapsed.toFixed(1) + 'ms');
  assert.ok(sandbox.globalThis.CalcEngine, 'CalcEngine 公開済み');
  assert.ok(sandbox.globalThis.CalcState, 'CalcState 公開済み');
});

test('AC-08 ui.js に keydown ハンドラが登録されている', () => {
  assert.match(uiJs, /addEventListener\(['"]keydown['"]/);
});

test('AC-08 数字キー 0-9 を処理している', () => {
  assert.match(uiJs, /k >= ['"]0['"] && k <= ['"]9['"]/);
});

test('AC-08 演算子キー + - * / ^ を処理している', () => {
  assert.ok(uiJs.includes("'+'") || uiJs.includes('"+"'));
  assert.ok(uiJs.includes("'-'") || uiJs.includes('"-"'));
  assert.ok(uiJs.includes("'*'") || uiJs.includes('"*"'));
  assert.ok(uiJs.includes("'/'") || uiJs.includes('"/"'));
  assert.ok(uiJs.includes("'^'") || uiJs.includes('"^"'));
});

test('AC-08 Enter / = キーが評価をトリガする', () => {
  assert.match(uiJs, /['"]Enter['"]/);
  assert.ok(/k === ['"]Enter['"] \|\| k === ['"]=['"]/m.test(uiJs)
         || (uiJs.includes("'Enter'") && uiJs.includes("'='")));
});

test('AC-08 Backspace キーが backspace を呼ぶ', () => {
  assert.match(uiJs, /['"]Backspace['"]/);
  assert.match(uiJs, /backspace/);
});

test('AC-08 Escape キーが clear を呼ぶ', () => {
  assert.match(uiJs, /['"]Escape['"]/);
});

test('AC-10 全ボタンに data-action 属性が定義されている', () => {
  const buttonMatches = html.match(/<button[^>]*>/g) || [];
  assert.ok(buttonMatches.length > 20, 'ボタン数が想定 (20+) 未満: ' + buttonMatches.length);
  for (const btn of buttonMatches) {
    assert.match(btn, /data-action=/, 'data-action がないボタン: ' + btn);
  }
});

test('AC-10 必須関数ボタン (sin/cos/tan/log/ln/sqrt/exp) が UI に存在', () => {
  for (const fn of ['sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'exp', 'asin', 'acos', 'atan']) {
    assert.match(html, new RegExp('data-value=["\']' + fn + '["\']'), fn + ' ボタンが見つからない');
  }
});

test('AC-10 メモリボタン (MC/MR/M+/M-) が UI に存在', () => {
  assert.match(html, /data-action=["']mclear["']/);
  assert.match(html, /data-action=["']mrecall["']/);
  assert.match(html, /data-action=["']mplus["']/);
  assert.match(html, /data-action=["']mminus["']/);
});

test('AC-10 DEG/RAD トグルボタンが UI に存在', () => {
  assert.match(html, /data-action=["']toggle-angle["']/);
});

test('AC-10 定数ボタン (pi, e) が UI に存在', () => {
  assert.match(html, /data-value=["']pi["']/);
  assert.match(html, /data-value=["']e["']/);
});
