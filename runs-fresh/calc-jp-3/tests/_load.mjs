// _load.mjs — src/*.js を Node の vm で評価し、Calc 名前空間を返す共通ローダ。
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = join(here, "..", "src");

export function loadCalc() {
  const ctx = { console, Math, Number, parseFloat, isFinite, Object, Error };
  ctx.window = ctx;
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const f of ["engine.js", "state.js", "ui.js"]) {
    const code = readFileSync(join(srcDir, f), "utf8");
    vm.runInContext(code, ctx, { filename: f });
  }
  return ctx.Calc;
}
