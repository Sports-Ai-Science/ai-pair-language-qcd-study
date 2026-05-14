// ui.js — DOM and keyboard wiring. The only file that touches the DOM.
// Exposes globalThis.CalcUI.mount(rootEl, state, engine).

(function () {
  "use strict";

  // Buttons are declared as { label, action, type? } where action is a string
  // command interpreted by handleAction(). Using a table keeps the file small.
  var BUTTONS = [
    [
      { label: "MC", action: "mc" }, { label: "MR", action: "mr" },
      { label: "M+", action: "mplus" }, { label: "M-", action: "mminus" },
      { label: "(", action: "ins:(" }, { label: ")", action: "ins:)" }
    ],
    [
      { label: "sin", action: "fn:sin" }, { label: "cos", action: "fn:cos" },
      { label: "tan", action: "fn:tan" }, { label: "asin", action: "fn:asin" },
      { label: "acos", action: "fn:acos" }, { label: "atan", action: "fn:atan" }
    ],
    [
      { label: "log", action: "fn:log10" }, { label: "ln", action: "fn:ln" },
      { label: "exp", action: "fn:exp" }, { label: "sqrt", action: "fn:sqrt" },
      { label: "x^2", action: "ins:^2" }, { label: "x^y", action: "ins:^" }
    ],
    [
      { label: "7", action: "ins:7" }, { label: "8", action: "ins:8" },
      { label: "9", action: "ins:9" }, { label: "/", action: "ins:/" },
      { label: "pi", action: "ins:pi" }, { label: "e", action: "ins:e" }
    ],
    [
      { label: "4", action: "ins:4" }, { label: "5", action: "ins:5" },
      { label: "6", action: "ins:6" }, { label: "*", action: "ins:*" },
      { label: "C", action: "clear" }, { label: "Back", action: "back" }
    ],
    [
      { label: "1", action: "ins:1" }, { label: "2", action: "ins:2" },
      { label: "3", action: "ins:3" }, { label: "-", action: "ins:-" },
      { label: "DEG/RAD", action: "mode" }, { label: "=", action: "eq", type: "equals" }
    ],
    [
      { label: "0", action: "ins:0" }, { label: ".", action: "ins:." },
      { label: "+", action: "ins:+" }
    ]
  ];

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === "class") node.className = attrs[k];
      else if (k === "text") node.textContent = attrs[k];
      else node.setAttribute(k, attrs[k]);
    }
    if (children) for (var i = 0; i < children.length; i++) node.appendChild(children[i]);
    return node;
  }

  function buildLayout(root) {
    root.innerHTML = "";
    var displayExpr = el("div", { class: "display-expr" });
    var displayResult = el("div", { class: "display-result", text: "0" });
    var modeIndicator = el("span", { class: "mode-indicator", text: "RAD" });
    var memIndicator = el("span", { class: "mem-indicator", text: "" });
    var statusBar = el("div", { class: "status-bar" }, [memIndicator, modeIndicator]);
    var display = el("div", { class: "display" }, [statusBar, displayExpr, displayResult]);

    var pad = el("div", { class: "pad" });
    for (var r = 0; r < BUTTONS.length; r++) {
      for (var c = 0; c < BUTTONS[r].length; c++) {
        var b = BUTTONS[r][c];
        var btn = el("button", { class: "btn" + (b.type === "equals" ? " btn-equals" : ""), "data-action": b.action, text: b.label });
        pad.appendChild(btn);
      }
    }

    var history = el("div", { class: "history" });
    var historyTitle = el("div", { class: "history-title", text: "History" });
    var historyList = el("ul", { class: "history-list" });
    history.appendChild(historyTitle);
    history.appendChild(historyList);

    root.appendChild(display);
    root.appendChild(pad);
    root.appendChild(history);

    return { displayExpr: displayExpr, displayResult: displayResult, modeIndicator: modeIndicator, memIndicator: memIndicator, pad: pad, historyList: historyList };
  }

  function mount(root, state, engine) {
    var refs = buildLayout(root);

    function render() {
      refs.displayExpr.textContent = state.getExpr();
      refs.displayResult.textContent = state.getDisplay();
      refs.modeIndicator.textContent = state.getAngleMode();
      refs.memIndicator.textContent = state.hasMemory() ? "M" : "";
      var hist = state.getHistory();
      refs.historyList.innerHTML = "";
      for (var i = 0; i < hist.length; i++) {
        var li = el("li", { class: "history-item" });
        li.appendChild(el("span", { class: "h-expr", text: hist[i].expr }));
        li.appendChild(el("span", { class: "h-eq", text: " = " }));
        li.appendChild(el("span", { class: "h-res", text: hist[i].result }));
        refs.historyList.appendChild(li);
      }
    }

    state.subscribe(render);
    render();

    function evaluateNow() {
      var expr = state.getExpr();
      if (!expr) return;
      var r = engine.evaluate(expr, { angleMode: state.getAngleMode() });
      if (r.ok) {
        var formatted = engine.format(r.value);
        state.pushHistory({ expr: expr, result: formatted });
        state.setDisplay(formatted);
        state.setExpr(formatted);
      } else {
        state.setDisplay(r.error);
      }
    }

    function handleAction(action) {
      if (action.indexOf("ins:") === 0) { state.append(action.slice(4)); return; }
      if (action.indexOf("fn:") === 0) { state.append(action.slice(3) + "("); return; }
      switch (action) {
        case "clear": state.clear(); return;
        case "back": state.backspace(); return;
        case "eq": evaluateNow(); return;
        case "mode": state.toggleAngleMode(); return;
        case "mc": state.memoryClear(); return;
        case "mr": state.append(String(state.memoryRecall())); return;
        case "mplus": {
          var rp = engine.evaluate(state.getExpr() || state.getDisplay(), { angleMode: state.getAngleMode() });
          if (rp.ok) state.memoryAdd(rp.value);
          return;
        }
        case "mminus": {
          var rm = engine.evaluate(state.getExpr() || state.getDisplay(), { angleMode: state.getAngleMode() });
          if (rm.ok) state.memorySub(rm.value);
          return;
        }
      }
    }

    refs.pad.addEventListener("click", function (e) {
      var t = e.target;
      if (t && t.matches && t.matches(".btn")) handleAction(t.getAttribute("data-action"));
    });

    document.addEventListener("keydown", function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var k = e.key;
      if (k >= "0" && k <= "9") { state.append(k); e.preventDefault(); return; }
      if (k === "." || k === "+" || k === "-" || k === "*" || k === "/" || k === "^" || k === "(" || k === ")") {
        state.append(k); e.preventDefault(); return;
      }
      if (k === "Enter" || k === "=") { evaluateNow(); e.preventDefault(); return; }
      if (k === "Backspace") { state.backspace(); e.preventDefault(); return; }
      if (k === "Escape" || k === "c" || k === "C") { state.clear(); e.preventDefault(); return; }
      if (k === "p" || k === "P") { state.append("pi"); e.preventDefault(); return; }
      if (k === "e" || k === "E") { state.append("e"); e.preventDefault(); return; }
      if (k === "m" || k === "M") { state.toggleAngleMode(); e.preventDefault(); return; }
    });
  }

  globalThis.CalcUI = { mount: mount };
})();
