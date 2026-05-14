// ui.js — DOM bind とキーボードハンドリング（IIFE グローバル）
// 公開 API: window.Calc.ui = { mount, KEY_MAP, BUTTONS }
(function (root) {
  "use strict";

  // キーパッドのレイアウト定義（行ごと）。ラベルは英語固定。
  var BUTTONS = [
    ["sin", "cos", "tan", "pi", "e", "AC"],
    ["asin", "acos", "atan", "log10", "ln", "BS"],
    ["sqrt", "^", "sq", "exp", "(", ")"],
    ["7", "8", "9", "/", "M+", "MR"],
    ["4", "5", "6", "*", "M-", "MC"],
    ["1", "2", "3", "-", "DEG", "RAD"],
    ["0", ".", "=", "+", ",", " "],
  ];

  // キーボード → トークンの対応。
  var KEY_MAP = {
    Enter: "=", "=": "=",
    Backspace: "BS",
    Escape: "AC",
    "+": "+", "-": "-", "*": "*", "/": "/",
    "(": "(", ")": ")", ",": ",",
    "^": "^", ".": ".",
  };
  for (var d = 0; d <= 9; d++) KEY_MAP[String(d)] = String(d);

  function mount(rootEl, state) {
    // ヘッダ + 表示 + キーパッド + 履歴の DOM を構築し、イベントを束ねる。
    rootEl.innerHTML = "";
    rootEl.classList.add("calc-root");

    var header = el("div", "calc-header");
    var modeLabel = el("span", "calc-mode", "DEG");
    var memLabel = el("span", "calc-mem", "M: 0");
    header.appendChild(modeLabel); header.appendChild(memLabel);

    var bufferEl = el("div", "calc-buffer", "");
    var displayEl = el("div", "calc-display", "0");

    var pad = el("div", "calc-pad");
    BUTTONS.forEach(function (row) {
      row.forEach(function (label) {
        var b = el("button", "calc-key", label);
        b.setAttribute("data-token", label);
        b.addEventListener("click", function () { dispatch(label); });
        pad.appendChild(b);
      });
    });

    var historyTitle = el("div", "calc-history-title", "History");
    var historyList = el("ol", "calc-history");

    rootEl.appendChild(header);
    rootEl.appendChild(bufferEl);
    rootEl.appendChild(displayEl);
    rootEl.appendChild(pad);
    rootEl.appendChild(historyTitle);
    rootEl.appendChild(historyList);

    function dispatch(token) {
      if (token === " ") return;
      state.apply(token);
      render();
    }

    function render() {
      var snap = state.snapshot();
      bufferEl.textContent = snap.buffer;
      displayEl.textContent = snap.display;
      displayEl.classList.toggle("calc-error", !!snap.error);
      modeLabel.textContent = snap.mode;
      memLabel.textContent = "M: " + snap.memory;
      historyList.innerHTML = "";
      for (var i = snap.history.length - 1; i >= 0; i--) {
        var li = el("li", "calc-history-item", snap.history[i]);
        historyList.appendChild(li);
      }
    }

    var doc = rootEl.ownerDocument || (root.document);
    if (doc) {
      doc.addEventListener("keydown", function (ev) {
        var mapped = KEY_MAP[ev.key];
        if (mapped !== undefined) { ev.preventDefault(); dispatch(mapped); }
      });
    }

    render();
    return { render: render, dispatch: dispatch };
  }

  function el(tag, cls, text) {
    var doc = (typeof document !== "undefined") ? document : root.document;
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  root.Calc = root.Calc || {};
  root.Calc.ui = { mount: mount, KEY_MAP: KEY_MAP, BUTTONS: BUTTONS };
})(typeof window !== "undefined" ? window : globalThis);
