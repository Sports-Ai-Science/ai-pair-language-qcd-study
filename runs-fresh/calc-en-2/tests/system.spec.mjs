// system.spec.mjs — System-level smoke test for AC-10 (local startup).
// Confirms that:
//   1. index.html and the three script files exist and are loadable from
//      the local filesystem (file:// double-click scenario);
//   2. index.html references the scripts in classic <script> form, never
//      <script type="module"> (which would be blocked under file:// CORS);
//   3. Loading engine.js + state.js + ui.js into a minimal DOM shim renders
//      the calculator and a first calculation succeeds within the 5 s budget.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const srcDir = resolve(root, 'src');

test('AC-10: index.html and source files exist on local filesystem', () => {
  for (const f of ['index.html', 'styles.css', 'engine.js', 'state.js', 'ui.js']) {
    const p = resolve(srcDir, f);
    assert.ok(existsSync(p), 'missing src file: ' + f);
    assert.ok(statSync(p).size > 0, 'empty src file: ' + f);
  }
});

test('AC-10: index.html uses classic <script> tags only', () => {
  const html = readFileSync(resolve(srcDir, 'index.html'), 'utf8');
  assert.ok(/<script src="engine\.js"><\/script>/.test(html));
  assert.ok(/<script src="state\.js"><\/script>/.test(html));
  assert.ok(/<script src="ui\.js"><\/script>/.test(html));
  assert.ok(!/<script[^>]*type=["']module["']/i.test(html),
    'no <script type="module"> allowed under file://');
});

test('AC-10: cold start renders UI and first calculation succeeds < 5 s', () => {
  const t0 = Date.now();

  // Minimal DOM shim sufficient for ui.js. We track the elements ui.js touches.
  const elements = new Map();
  function makeEl(id) {
    const el = {
      id, textContent: '', innerHTML: '',
      _children: [],
      appendChild(c) { this._children.push(c); this.innerHTML += '<li>' + c.textContent + '</li>'; },
      addEventListener() {},
      closest() { return null; },
      setAttribute() {}, getAttribute() { return null; }
    };
    return el;
  }
  for (const id of ['display', 'history', 'mode', 'memory-indicator', 'keys']) {
    elements.set(id, makeEl(id));
  }
  const documentShim = {
    readyState: 'complete',
    getElementById: (id) => elements.get(id) || null,
    createElement: (tag) => makeEl(tag),
    addEventListener: () => {}
  };

  const ctx = { console, document: documentShim };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const file of ['engine.js', 'state.js', 'ui.js']) {
    vm.runInContext(readFileSync(resolve(srcDir, file), 'utf8'), ctx, { filename: file });
  }

  // Drive a minimal calculation through the public state API.
  const store = ctx.Calc.state.create();
  '12'.split('').forEach(c => store.inputDigit(c));
  store.applyOperator('+');
  '30'.split('').forEach(c => store.inputDigit(c));
  store.equals();
  assert.equal(store.snapshot().display, '42');

  const elapsed = Date.now() - t0;
  assert.ok(elapsed < 5000, 'cold start exceeded 5 s budget: ' + elapsed + ' ms');
});
