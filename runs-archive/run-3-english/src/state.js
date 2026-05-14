// Pure functional state container. Loaded as classic script.
// Exposes globalThis.CalcState.

(function (root) {
  const HISTORY_LIMIT = 10;

  function initial() {
    return Object.freeze({ memory: 0, history: [], mode: "RAD" });
  }
  function setMemory(state, value) {
    return Object.freeze({ memory: value, history: state.history, mode: state.mode });
  }
  function addToMemory(state, value) {
    return Object.freeze({ memory: state.memory + value, history: state.history, mode: state.mode });
  }
  function subFromMemory(state, value) {
    return Object.freeze({ memory: state.memory - value, history: state.history, mode: state.mode });
  }
  function clearMemory(state) {
    return Object.freeze({ memory: 0, history: state.history, mode: state.mode });
  }
  function pushHistory(state, expression, value) {
    const entry = Object.freeze({ expression: expression, value: value, at: Date.now() });
    const next = [entry].concat(state.history).slice(0, HISTORY_LIMIT);
    return Object.freeze({ memory: state.memory, history: Object.freeze(next), mode: state.mode });
  }
  function setMode(state, mode) {
    if (mode !== "DEG" && mode !== "RAD") {
      throw new Error("Invalid mode: " + mode);
    }
    return Object.freeze({ memory: state.memory, history: state.history, mode: mode });
  }

  root.CalcState = {
    HISTORY_LIMIT: HISTORY_LIMIT,
    initial: initial,
    setMemory: setMemory,
    addToMemory: addToMemory,
    subFromMemory: subFromMemory,
    clearMemory: clearMemory,
    pushHistory: pushHistory,
    setMode: setMode,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
