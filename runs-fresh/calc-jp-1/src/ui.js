// ui.js — DOM バインドとイベントハンドラ
// 各ボタンの data-key を見て CalcState を更新し、CalcEngine.evaluate を呼ぶ
(function (root) {
  "use strict";

  // ボタン定義: [label, data-key, css class]
  var BUTTONS = [
    ["MC", "mc", "mem"], ["MR", "mr", "mem"], ["M+", "m+", "mem"], ["M-", "m-", "mem"], ["DEG", "mode", "mode"],
    ["sin", "sin", "fn"], ["cos", "cos", "fn"], ["tan", "tan", "fn"], ["log", "log", "fn"], ["ln", "ln", "fn"],
    ["asin", "asin", "fn"], ["acos", "acos", "fn"], ["atan", "atan", "fn"], ["exp", "exp", "fn"], ["sqrt", "sqrt", "fn"],
    ["7", "7", "num"], ["8", "8", "num"], ["9", "9", "num"], ["/", "/", "op"], ["^", "^", "op"],
    ["4", "4", "num"], ["5", "5", "num"], ["6", "6", "num"], ["*", "*", "op"], ["x^2", "sq", "fn"],
    ["1", "1", "num"], ["2", "2", "num"], ["3", "3", "num"], ["-", "-", "op"], ["pi", "pi", "const"],
    ["0", "0", "num"], [".", ".", "num"], ["=", "=", "eq"], ["+", "+", "op"], ["e", "e", "const"],
    ["C", "clear", "clr"], ["<-", "back", "clr"], ["(", "(", "op"], [")", ")", "op"], ["hist", "hist", "hist"]
  ];

  // 入力 token への変換テーブル（キーボード入力もこれを通す）
  var TOKEN_MAP = {
    "0": "0", "1": "1", "2": "2", "3": "3", "4": "4",
    "5": "5", "6": "6", "7": "7", "8": "8", "9": "9",
    ".": ".", "+": "+", "-": "-", "*": "*", "/": "/",
    "^": "^", "(": "(", ")": ")",
    "sin": "sin(", "cos": "cos(", "tan": "tan(",
    "asin": "asin(", "acos": "acos(", "atan": "atan(",
    "log": "log(", "ln": "ln(", "exp": "exp(", "sqrt": "sqrt(",
    "sq": "sq(", "pi": "PI", "e": "E"
  };

  function buildDom() {
    var root = document.getElementById("calc");
    if (!root) return;
    root.innerHTML = "";
    var disp = document.createElement("div");
    disp.className = "display";
    disp.id = "display";
    disp.textContent = "0";
    root.appendChild(disp);

    var grid = document.createElement("div");
    grid.className = "grid";
    BUTTONS.forEach(function (b) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = b[0];
      btn.setAttribute("data-key", b[1]);
      btn.className = "btn " + b[2];
      grid.appendChild(btn);
    });
    root.appendChild(grid);

    var hist = document.createElement("ul");
    hist.className = "history";
    hist.id = "history";
    root.appendChild(hist);

    grid.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeydown);
    render();
  }

  function onClick(ev) {
    var t = ev.target;
    if (!t || !t.getAttribute) return;
    var key = t.getAttribute("data-key");
    if (!key) return;
    handle(key);
  }

  function onKeydown(ev) {
    var k = ev.key;
    if (k === "Enter" || k === "=") { ev.preventDefault(); handle("="); return; }
    if (k === "Backspace") { ev.preventDefault(); handle("back"); return; }
    if (k === "Escape") { ev.preventDefault(); handle("clear"); return; }
    if (TOKEN_MAP[k] !== undefined) { ev.preventDefault(); handle(k); return; }
  }

  // 単一入力エントリポイント。キー種別ごとに状態遷移を行う
  function handle(key) {
    var s = root.CalcState;
    var e = root.CalcEngine;
    if (key === "clear") { s.clear(); render(); return; }
    if (key === "back") { s.backspace(); render(); return; }
    if (key === "mode") {
      s.toggleMode();
      render();
      return;
    }
    if (key === "mc") { s.memoryClear(); return; }
    if (key === "mr") {
      var v = s.memoryRecall();
      s.append(s.formatNumber(v));
      render();
      return;
    }
    if (key === "m+" || key === "m-") {
      try {
        var val = e.evaluate(s.getExpr() || "0", s.getMode());
        if (key === "m+") s.memoryAdd(val); else s.memorySub(val);
      } catch (err) {
        s.setResult("Error");
        render();
      }
      return;
    }
    if (key === "hist") { return; }
    if (key === "=") {
      try {
        var expr = s.getExpr();
        if (!expr) return;
        var r = e.evaluate(expr, s.getMode());
        var resultStr = s.formatNumber(r);
        s.pushHistory({ expr: expr, result: resultStr });
        s.setResult(r);
      } catch (err) {
        s.pushHistory({ expr: s.getExpr(), result: "Error" });
        s.setResult("Error");
      }
      render();
      return;
    }
    if (TOKEN_MAP[key] !== undefined) {
      s.append(TOKEN_MAP[key]);
      render();
    }
  }

  function render() {
    var s = root.CalcState;
    var disp = document.getElementById("display");
    if (disp) disp.textContent = s.getDisplay();
    var modeEl = document.querySelector('[data-key="mode"]');
    if (modeEl) modeEl.textContent = s.getMode();
    var hist = document.getElementById("history");
    if (hist) {
      hist.innerHTML = "";
      s.getHistory().forEach(function (h) {
        var li = document.createElement("li");
        li.textContent = h.expr + " = " + h.result;
        hist.appendChild(li);
      });
    }
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", buildDom);
    } else {
      buildDom();
    }
  }

  root.CalcUI = { handle: handle, render: render, _build: buildDom };
})(typeof globalThis !== "undefined" ? globalThis : this);
