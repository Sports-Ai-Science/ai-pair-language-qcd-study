// _load.mjs — Loads the browser source files into a shared vm context so
// Node's test runner can exercise them without requiring ES modules.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(here, '..', 'src');

function loadCalc() {
  const ctx = { console };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const file of ['engine.js', 'state.js']) {
    const code = readFileSync(resolve(srcDir, file), 'utf8');
    vm.runInContext(code, ctx, { filename: file });
  }
  return ctx.Calc;
}

export const Calc = loadCalc();
