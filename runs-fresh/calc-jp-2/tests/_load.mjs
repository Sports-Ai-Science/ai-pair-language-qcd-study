// 本番 src の Classic JS (IIFE) を Node 環境にロードして CalcEngine/CalcState を globalThis に公開する。
// file:// と Node の両方で同一バンドルを動作させるためのブリッジ。
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(here, '..', 'src');

// IIFE は (function (root) {...})(window || globalThis) の形なので、
// Node では globalThis に直接公開される。
function load(name) {
  const code = readFileSync(resolve(srcDir, name), 'utf8');
  vm.runInThisContext(code, { filename: name });
}

load('engine.js');
load('state.js');

export const CalcEngine = globalThis.CalcEngine;
export const CalcState = globalThis.CalcState;
