// state.js — observable store for the calculator. No DOM access.
// Exposes globalThis.CalcState with a `create()` factory.

(function () {
  "use strict";

  var HISTORY_CAP = 10;

  function create() {
    var state = {
      expr: "",
      display: "0",
      history: [],
      memory: 0,
      angleMode: "RAD"
    };
    var listeners = [];

    function notify() {
      // Snapshot to avoid mutation during iteration.
      var snap = listeners.slice();
      for (var i = 0; i < snap.length; i++) snap[i]();
    }

    return {
      getExpr: function () { return state.expr; },
      setExpr: function (s) { state.expr = String(s); notify(); },
      append: function (s) { state.expr += String(s); notify(); },
      backspace: function () {
        state.expr = state.expr.slice(0, -1);
        notify();
      },
      clear: function () {
        state.expr = "";
        state.display = "0";
        notify();
      },

      getDisplay: function () { return state.display; },
      setDisplay: function (s) { state.display = String(s); notify(); },

      pushHistory: function (entry) {
        // Keep only the last HISTORY_CAP entries; newest goes to the front.
        var next = [{ expr: entry.expr, result: entry.result }].concat(state.history);
        if (next.length > HISTORY_CAP) next = next.slice(0, HISTORY_CAP);
        state.history = next;
        notify();
      },
      getHistory: function () { return state.history.slice(); },

      memoryAdd: function (x) { state.memory += Number(x) || 0; notify(); },
      memorySub: function (x) { state.memory -= Number(x) || 0; notify(); },
      memoryRecall: function () { return state.memory; },
      memoryClear: function () { state.memory = 0; notify(); },
      hasMemory: function () { return state.memory !== 0; },

      setAngleMode: function (m) {
        if (m !== "DEG" && m !== "RAD") return;
        state.angleMode = m;
        notify();
      },
      getAngleMode: function () { return state.angleMode; },
      toggleAngleMode: function () {
        state.angleMode = state.angleMode === "DEG" ? "RAD" : "DEG";
        notify();
      },

      subscribe: function (fn) {
        listeners.push(fn);
        return function unsubscribe() {
          var idx = listeners.indexOf(fn);
          if (idx >= 0) listeners.splice(idx, 1);
        };
      }
    };
  }

  globalThis.CalcState = { create: create, HISTORY_CAP: HISTORY_CAP };
})();
