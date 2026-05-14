// DOM wiring. Classic script, runs after engine.js + state.js have loaded.
(function () {
  const Engine = globalThis.CalcEngine;
  const State = globalThis.CalcState;

  let state = State.initial();
  let display = "";
  let lastResult = null;
  let errorPending = false;

  function applyResultDisplay(text) {
    document.getElementById("display").textContent = text;
  }
  function applyMode() {
    document.getElementById("mode-deg").classList.toggle("active", state.mode === "DEG");
    document.getElementById("mode-rad").classList.toggle("active", state.mode === "RAD");
  }
  function applyMemory() {
    document.getElementById("memory-value").textContent = Engine.formatNumber(state.memory);
  }
  function applyHistory() {
    const ul = document.getElementById("history");
    ul.textContent = "";
    for (let i = 0; i < state.history.length; i++) {
      const entry = state.history[i];
      const li = document.createElement("li");
      li.textContent = entry.expression + " = " + Engine.formatNumber(entry.value);
      ul.appendChild(li);
    }
  }
  function render() {
    applyResultDisplay(display === "" ? "0" : display);
    applyMode();
    applyMemory();
    applyHistory();
  }

  function append(text) {
    if (errorPending) { display = ""; errorPending = false; }
    display += text;
    render();
  }
  function backspace() {
    if (errorPending) { display = ""; errorPending = false; render(); return; }
    display = display.slice(0, -1);
    render();
  }
  function clearAll() {
    display = "";
    errorPending = false;
    render();
  }
  function evaluateNow() {
    if (display === "") return;
    const result = Engine.evaluate(display, state.mode);
    if (result.ok) {
      state = State.pushHistory(state, display, result.value);
      lastResult = result.value;
      display = Engine.formatNumber(result.value);
      errorPending = false;
    } else {
      display = result.error;
      errorPending = true;
    }
    render();
  }
  function memoryAction(kind) {
    const value = lastResult == null ? 0 : lastResult;
    if (kind === "M+") state = State.addToMemory(state, value);
    else if (kind === "M-") state = State.subFromMemory(state, value);
    else if (kind === "MR") {
      if (errorPending) { display = ""; errorPending = false; }
      display += Engine.formatNumber(state.memory);
    } else if (kind === "MC") state = State.clearMemory(state);
    render();
  }
  function setModeUI(mode) {
    state = State.setMode(state, mode);
    render();
  }

  function onButtonLabel(label) {
    if (label === "=") { evaluateNow(); return; }
    if (label === "C") { clearAll(); return; }
    if (label === "←") { backspace(); return; }
    if (label === "DEG") { setModeUI("DEG"); return; }
    if (label === "RAD") { setModeUI("RAD"); return; }
    if (label === "M+" || label === "M-" || label === "MR" || label === "MC") {
      memoryAction(label); return;
    }
    if (label === "x²") { append("^2"); return; }
    if (label === "x^y") { append("^"); return; }
    if (label === "π") { append("pi"); return; }
    if (label === "e") { append("e"); return; }
    if (label === "√") { append("sqrt("); return; }
    if (label === "sin" || label === "cos" || label === "tan" ||
        label === "asin" || label === "acos" || label === "atan") {
      append(label + "("); return;
    }
    if (label === "log") { append("log10("); return; }
    if (label === "ln" || label === "exp") { append(label + "("); return; }
    append(label);
  }

  function wireButtons() {
    const btns = document.querySelectorAll("[data-key]");
    for (let i = 0; i < btns.length; i++) {
      const btn = btns[i];
      btn.addEventListener("click", function () { onButtonLabel(btn.dataset.key); });
    }
  }

  function wireKeyboard() {
    document.addEventListener("keydown", function (event) {
      const k = event.key;
      if ((k >= "0" && k <= "9") || k === ".") { append(k); event.preventDefault(); return; }
      if ("+-*/^()".indexOf(k) >= 0) { append(k); event.preventDefault(); return; }
      if (k === "Enter" || k === "=") { evaluateNow(); event.preventDefault(); return; }
      if (k === "Backspace") { backspace(); event.preventDefault(); return; }
      if (k === "Escape") { clearAll(); event.preventDefault(); return; }
      if (k === "d" || k === "D") {
        setModeUI(state.mode === "DEG" ? "RAD" : "DEG");
        event.preventDefault();
      }
    });
  }

  function init() {
    wireButtons();
    wireKeyboard();
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
