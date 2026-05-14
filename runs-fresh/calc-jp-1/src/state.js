// state.js — 入力バッファ、メモリ、履歴、角度モードを保持する
// IIFE クロージャで状態を閉じ込め、CalcState オブジェクトのみを公開する
(function (root) {
  "use strict";

  var expr = "";
  var display = "0";
  var memory = 0;
  var mode = "DEG";
  var history = []; // 新しい順、最大 10 件
  var locked = false; // エラー後は C 操作までロック

  function append(token) {
    if (locked) return;
    expr += token;
    display = expr;
  }

  function backspace() {
    if (locked) return;
    if (expr.length === 0) return;
    expr = expr.slice(0, -1);
    display = expr.length ? expr : "0";
  }

  function clear() {
    expr = "";
    display = "0";
    locked = false;
  }

  // 結果セット。数値なら表示桁を整え、'Error' ならロックして以降の入力を拒否する
  function setResult(value) {
    if (value === "Error") {
      display = "Error";
      expr = "";
      locked = true;
      return;
    }
    var s = formatNumber(value);
    display = s;
    expr = s;
    locked = false;
  }

  // 12 桁の有効桁数を目安に整形（指数表記へのフォールバックを含む）
  function formatNumber(v) {
    if (v === 0) return "0";
    var abs = Math.abs(v);
    if (abs >= 1e12 || abs < 1e-9) return v.toExponential(6);
    var s = v.toPrecision(12);
    // toPrecision の末尾ゼロを削る（小数点以下のみ）
    if (s.indexOf(".") >= 0 && s.indexOf("e") < 0) {
      s = s.replace(/0+$/, "").replace(/\.$/, "");
    }
    return s;
  }

  function getExpr() { return expr; }
  function getDisplay() { return display; }
  function isLocked() { return locked; }

  function memoryAdd(value) { memory += value; }
  function memorySub(value) { memory -= value; }
  function memoryRecall() { return memory; }
  function memoryClear() { memory = 0; }

  function toggleMode() {
    mode = mode === "DEG" ? "RAD" : "DEG";
    return mode;
  }
  function getMode() { return mode; }

  // 履歴は新しい順に積む。10 件超で末尾を捨てる
  function pushHistory(entry) {
    history.unshift({ expr: entry.expr, result: entry.result });
    if (history.length > 10) history.length = 10;
  }
  function getHistory() { return history.slice(); }
  function clearHistory() { history.length = 0; }

  // テスト用に内部状態を完全リセットするためのヘルパ
  function _reset() {
    expr = "";
    display = "0";
    memory = 0;
    mode = "DEG";
    history.length = 0;
    locked = false;
  }

  root.CalcState = {
    append: append,
    backspace: backspace,
    clear: clear,
    setResult: setResult,
    getExpr: getExpr,
    getDisplay: getDisplay,
    isLocked: isLocked,
    memoryAdd: memoryAdd,
    memorySub: memorySub,
    memoryRecall: memoryRecall,
    memoryClear: memoryClear,
    toggleMode: toggleMode,
    getMode: getMode,
    pushHistory: pushHistory,
    getHistory: getHistory,
    clearHistory: clearHistory,
    formatNumber: formatNumber,
    _reset: _reset
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
