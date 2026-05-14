// state.js — 入力状態・モード・メモリ・履歴（IIFE グローバル）
// 公開 API: window.Calc.state = { create }
(function (root) {
  "use strict";

  var MAX_HISTORY = 10;

  function create() {
    var s = {
      buffer: "",
      mode: "DEG",
      memory: 0,
      lastResult: null,
      history: [],
      error: null,
    };

    function format(n) {
      // 表示用整形：整数はそのまま、小数は最大 12 桁で末尾ゼロ削除。
      if (!isFinite(n)) return "Error: domain";
      if (Math.abs(n) >= 1e15 || (n !== 0 && Math.abs(n) < 1e-9)) return n.toExponential(6);
      var str = Number(n.toPrecision(12)).toString();
      return str;
    }

    function apply(token) {
      // ボタン/キー入力を 1 件適用する。token はラベル文字列（"7", "+", "sin" 等）。
      s.error = null;
      if (token === "AC") return clearAll();
      if (token === "BS" || token === "Backspace") return backspace();
      if (token === "=" || token === "Enter") return evaluate();
      if (token === "M+") return memAdd();
      if (token === "M-") return memSub();
      if (token === "MR") return memRecall();
      if (token === "MC") return memClear();
      if (token === "DEG" || token === "RAD") return setMode(token);
      // 三角・対数・冪は関数呼び出しの開始括弧まで自動付与する。
      if (Object.prototype.hasOwnProperty.call(FUNC_TOKENS, token)) {
        s.buffer += token + "(";
        return;
      }
      // 表記の正規化：UI 上の "x" / "÷" を内部の "*" / "/" に変換。
      var t = token;
      if (t === "x" || t === "X" || t === "×") t = "*";
      if (t === "÷") t = "/";
      s.buffer += t;
    }

    var FUNC_TOKENS = {
      sin: 1, cos: 1, tan: 1, asin: 1, acos: 1, atan: 1,
      log10: 1, ln: 1, exp: 1, sqrt: 1, sq: 1, pow: 1,
    };

    function evaluate() {
      // バッファを engine に渡し、結果を履歴と lastResult に反映する。
      if (!s.buffer) return;
      var result = root.Calc.engine.evaluate(s.buffer, s.mode);
      if (result instanceof Error) {
        s.error = result.message;
        return;
      }
      s.history.push(s.buffer + " = " + format(result));
      if (s.history.length > MAX_HISTORY) s.history.shift();
      s.lastResult = result;
      s.buffer = format(result);
    }

    function setMode(mode) { s.mode = mode === "RAD" ? "RAD" : "DEG"; }
    function memAdd() { if (s.lastResult !== null) s.memory += s.lastResult; }
    function memSub() { if (s.lastResult !== null) s.memory -= s.lastResult; }
    function memRecall() { s.buffer += format(s.memory); }
    function memClear() { s.memory = 0; }
    function clearAll() {
      s.buffer = ""; s.error = null; s.lastResult = null;
    }
    function backspace() { s.buffer = s.buffer.slice(0, -1); }

    function snapshot() {
      // UI 表示用のイミュータブルなビュー。
      return {
        buffer: s.buffer,
        display: s.error ? "Error: " + s.error : (s.buffer || "0"),
        mode: s.mode,
        memory: s.memory,
        history: s.history.slice(),
        error: s.error,
      };
    }

    return {
      apply: apply, evaluate: evaluate, setMode: setMode,
      memAdd: memAdd, memSub: memSub, memRecall: memRecall, memClear: memClear,
      clearAll: clearAll, backspace: backspace, snapshot: snapshot,
      _format: format,
      get raw() { return s; },
    };
  }

  root.Calc = root.Calc || {};
  root.Calc.state = { create: create, MAX_HISTORY: MAX_HISTORY };
})(typeof window !== "undefined" ? window : globalThis);
