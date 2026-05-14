// system.spec.mjs — system tests for the local file:// boot path (AC-08, AC-10).
// We do not launch a browser; instead we statically verify that the page can
// boot under file:// (no ES modules, no network) and we drive the same
// scripts under a Node sandbox to prove keyboard handling end-to-end.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadAll, srcFile } from './_load.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function readSrc(rel) {
  return readFileSync(path.join(ROOT, rel), 'utf8');
}

test('AC-10 index.html exists at src/index.html', () => {
  const html = readSrc('src/index.html');
  assert.match(html, /<!DOCTYPE html>/);
  assert.match(html, /<main id="app">/);
});

test('AC-10 no ES modules: scripts use classic <script> only', () => {
  const html = readSrc('src/index.html');
  assert.doesNotMatch(html, /type="module"/);
  assert.doesNotMatch(html, /import\s+/);
  // Three classic script tags loaded in order.
  const order = ['engine.js', 'state.js', 'ui.js'];
  let prev = -1;
  for (const f of order) {
    const i = html.indexOf(`src="${f}"`);
    assert.ok(i > prev, `script ${f} must follow previous script`);
    prev = i;
  }
});

test('AC-10 no network references in HTML/CSS', () => {
  const html = readSrc('src/index.html');
  const css = readSrc('src/styles.css');
  assert.doesNotMatch(html, /https?:\/\//);
  assert.doesNotMatch(css, /https?:\/\//);
  assert.doesNotMatch(html, /<link[^>]+href="\/\//);
});

test('AC-10 first calculation succeeds end-to-end via the bundled scripts', () => {
  const { ctx } = loadAll();
  ctx.Store.reset();
  ctx.Store.append('1');
  ctx.Store.append('+');
  ctx.Store.append('2');
  ctx.Store.equals();
  assert.equal(ctx.Store.snapshot().display, '3');
});

test('AC-08 keyboard: digits and operators dispatch through UI handler', () => {
  const { ctx, handlers } = loadAll();
  // Simulate DOMContentLoaded so UI.mount runs against the stub document.
  for (const fn of handlers.DOMContentLoaded || []) fn();
  ctx.Store.reset();
  const keydown = handlers.keydown || [];
  assert.ok(keydown.length > 0, 'keydown handler should be bound');
  const fire = (key) => {
    const ev = { key, preventDefault() {} };
    for (const fn of keydown) fn(ev);
  };
  ['2', '+', '3'].forEach(fire);
  assert.equal(ctx.Store.snapshot().display, '2+3');
  fire('Enter');
  assert.equal(ctx.Store.snapshot().display, '5');
  fire('Backspace');
  assert.equal(ctx.Store.snapshot().display, '');
  ['7', '*', '6'].forEach(fire);
  fire('=');
  assert.equal(ctx.Store.snapshot().display, '42');
  fire('Escape');
  assert.equal(ctx.Store.snapshot().display, '');
});

test('AC-08 keyboard: Escape clears, Backspace edits', () => {
  const { ctx, handlers } = loadAll();
  for (const fn of handlers.DOMContentLoaded || []) fn();
  ctx.Store.reset();
  const fire = (key) => {
    const ev = { key, preventDefault() {} };
    for (const fn of handlers.keydown || []) fn(ev);
  };
  ['1', '2', '3'].forEach(fire);
  fire('Backspace');
  assert.equal(ctx.Store.snapshot().display, '12');
  fire('Escape');
  assert.equal(ctx.Store.snapshot().display, '');
});

test('source budget: at most 5 src files', () => {
  const { readdirSync } = require ?? {};
  // Use dynamic import of fs to keep this ESM-clean.
  const fs = readSrcDir('src');
  assert.ok(fs.length <= 5, `src has ${fs.length} files: ${fs.join(', ')}`);
  assert.deepEqual(
    fs.sort(),
    ['engine.js', 'index.html', 'state.js', 'styles.css', 'ui.js']
  );
});

test('UI script defines no top-level forbidden globals', () => {
  const ui = srcFile('ui.js');
  // No mention of fetch/XHR/eval.
  assert.doesNotMatch(ui, /\bfetch\(/);
  assert.doesNotMatch(ui, /XMLHttpRequest/);
  assert.doesNotMatch(ui, /\beval\(/);
});

function readSrcDir(rel) {
  // Lazy require to avoid hoisting issues under node:test.
  // eslint-disable-next-line no-undef
  const { readdirSync } = require('node:fs');
  return readdirSync(path.join(ROOT, rel));
}

// Ensure require is available for the helper above (Node test runs ESM).
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
