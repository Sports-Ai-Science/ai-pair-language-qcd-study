// _load.mjs — Node 環境で IIFE スクリプトを読み込み globalThis に束縛するブリッジ
// 各テストファイルから import するだけで CalcEngine / CalcState が利用可能になる
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, "..", "src");

function loadScript(name) {
  const code = fs.readFileSync(path.join(SRC, name), "utf8");
  // globalThis を共有するため、現在のコンテキストで実行する
  vm.runInThisContext(code, { filename: name });
}

loadScript("engine.js");
loadScript("state.js");

export const CalcEngine = globalThis.CalcEngine;
export const CalcState = globalThis.CalcState;
