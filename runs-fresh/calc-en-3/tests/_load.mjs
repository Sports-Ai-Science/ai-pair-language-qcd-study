// _load.mjs — load browser scripts into a Node sandbox so the same files
// shipped to file:// are exercised by tests.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, '..', 'src');

function read(file) {
  return readFileSync(path.join(SRC, file), 'utf8');
}

export function loadEngine() {
  const ctx = { module: { exports: {} }, console };
  vm.createContext(ctx);
  vm.runInContext(read('engine.js'), ctx, { filename: 'engine.js' });
  return ctx.Engine;
}

export function loadStore() {
  const ctx = { module: { exports: {} }, console };
  vm.createContext(ctx);
  vm.runInContext(read('engine.js'), ctx, { filename: 'engine.js' });
  vm.runInContext(read('state.js'), ctx, { filename: 'state.js' });
  return { Engine: ctx.Engine, Store: ctx.Store };
}

export function loadAll() {
  // jsdom-free fake: build minimal DOM stubs UI needs.
  const handlers = {};
  function makeEl() {
    const children = [];
    return {
      _attrs: {},
      dataset: {},
      classList: {
        _set: new Set(),
        add(...c) { c.forEach((x) => this._set.add(x)); },
        remove(...c) { c.forEach((x) => this._set.delete(x)); },
        toggle(c, on) { on ? this._set.add(c) : this._set.delete(c); },
        contains(c) { return this._set.has(c); }
      },
      children,
      _text: '',
      _html: '',
      get textContent() { return this._text; },
      set textContent(v) { this._text = String(v); },
      get innerHTML() { return this._html; },
      set innerHTML(v) {
        this._html = String(v);
        children.length = 0;
        // very small parser: only what UI.mount writes (data-el spans).
        const re = /data-el=["']?([a-z]+)["']?/g;
        let m;
        const named = {};
        while ((m = re.exec(v)) !== null) named[m[1]] = makeEl();
        this._named = named;
      },
      appendChild(el) { children.push(el); return el; },
      addEventListener(type, fn) {
        (handlers[type] = handlers[type] || []).push(fn);
      },
      querySelector(sel) {
        const m = /^\[data-el=([a-z]+)\]$/.exec(sel);
        if (m && this._named) return this._named[m[1]];
        return null;
      }
    };
  }

  const docEl = {
    _byId: {},
    addEventListener(type, fn) {
      (handlers[type] = handlers[type] || []).push(fn);
    },
    getElementById(id) {
      if (!this._byId[id]) this._byId[id] = makeEl();
      return this._byId[id];
    },
    createElement() { return makeEl(); }
  };

  const ctx = {
    module: { exports: {} },
    console,
    document: docEl,
    window: {}
  };
  ctx.window.document = docEl;
  vm.createContext(ctx);
  vm.runInContext(read('engine.js'), ctx, { filename: 'engine.js' });
  vm.runInContext(read('state.js'), ctx, { filename: 'state.js' });
  vm.runInContext(read('ui.js'), ctx, { filename: 'ui.js' });
  return { ctx, handlers, document: docEl };
}

export function srcFile(name) {
  return read(name);
}
