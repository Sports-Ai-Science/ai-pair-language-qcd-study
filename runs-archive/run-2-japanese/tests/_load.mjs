// Test helper: load classic-script source files into a vm context and
// return the exposed namespaces (CalcEngine, CalcState).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(here, "..", "src");

export function loadCalculator() {
  const ctx = vm.createContext({});
  const engineSrc = readFileSync(resolve(srcDir, "engine.js"), "utf8");
  const stateSrc = readFileSync(resolve(srcDir, "state.js"), "utf8");
  vm.runInContext(engineSrc, ctx);
  vm.runInContext(stateSrc, ctx);
  return { Engine: ctx.CalcEngine, State: ctx.CalcState };
}
