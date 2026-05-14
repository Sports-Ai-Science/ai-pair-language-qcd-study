// _load.mjs — loads the browser-targeted scripts into a Node `vm` context so
// they can be unit-tested without a browser. Each script runs against a shared
// sandbox where `globalThis` is the sandbox itself.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(here, "..", "src");

export function loadCalcModules() {
  // Minimal browser-like sandbox: only what the modules need.
  const sandbox = { Math, isFinite, parseFloat, Number, String, Error };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);

  const files = ["engine.js", "state.js", "ui.js"];
  for (const f of files) {
    // ui.js touches `document`; we skip it for unit tests by default.
    if (f === "ui.js") continue;
    const code = readFileSync(resolve(SRC, f), "utf8");
    vm.runInContext(code, sandbox, { filename: f });
  }
  return { CalcEngine: sandbox.CalcEngine, CalcState: sandbox.CalcState };
}
