// state.js — application state container. Exposes a global `Store` (IIFE).
// Pure with respect to DOM; only depends on Engine.
var Store = (function () {
  'use strict';

  var state = {
    display: '',
    history: [],
    memory: 0,
    angleMode: 'RAD',
    lastError: null
  };
  var listeners = [];

  function snapshot() {
    return {
      display: state.display,
      history: state.history.slice(),
      memory: state.memory,
      angleMode: state.angleMode,
      lastError: state.lastError
    };
  }

  function notify() {
    var snap = snapshot();
    for (var i = 0; i < listeners.length; i++) listeners[i](snap);
  }

  function subscribe(fn) { listeners.push(fn); return function () {
    var idx = listeners.indexOf(fn);
    if (idx >= 0) listeners.splice(idx, 1);
  }; }

  function clearError() {
    if (state.lastError) {
      state.lastError = null;
      state.display = '';
    }
  }

  function append(token) {
    clearError();
    state.display = state.display + String(token);
    notify();
  }

  function clear() {
    state.display = '';
    state.lastError = null;
    notify();
  }

  function backspace() {
    if (state.lastError) { clear(); return; }
    state.display = state.display.slice(0, -1);
    notify();
  }

  function pushHistory(expr, value) {
    state.history.unshift({ expr: expr, value: value });
    if (state.history.length > 10) state.history.length = 10;
  }

  function equals() {
    if (state.display === '') return;
    var result = Engine.evaluate(state.display, state.angleMode);
    if (result.ok) {
      pushHistory(state.display, result.value);
      state.display = formatNumber(result.value);
      state.lastError = null;
    } else {
      state.lastError = result.error;
    }
    notify();
  }

  function formatNumber(v) {
    if (v === 0) return '0';
    var abs = Math.abs(v);
    if (abs >= 1e12 || abs < 1e-6) return v.toExponential(10).replace(/0+e/, 'e');
    var s = v.toPrecision(12);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return s;
  }

  function evaluateCurrent() {
    if (state.display === '') return null;
    var result = Engine.evaluate(state.display, state.angleMode);
    if (!result.ok) {
      state.lastError = result.error;
      notify();
      return null;
    }
    return result.value;
  }

  function memAdd() {
    var v = evaluateCurrent();
    if (v !== null) { state.memory += v; notify(); }
  }
  function memSub() {
    var v = evaluateCurrent();
    if (v !== null) { state.memory -= v; notify(); }
  }
  function memRecall() {
    clearError();
    state.display = state.display + formatNumber(state.memory);
    notify();
  }
  function memClear() {
    state.memory = 0;
    notify();
  }

  function toggleAngle() {
    state.angleMode = state.angleMode === 'DEG' ? 'RAD' : 'DEG';
    notify();
  }

  function reset() {
    state = {
      display: '',
      history: [],
      memory: 0,
      angleMode: 'RAD',
      lastError: null
    };
    notify();
  }

  return {
    snapshot: snapshot,
    subscribe: subscribe,
    append: append,
    clear: clear,
    backspace: backspace,
    equals: equals,
    memAdd: memAdd,
    memSub: memSub,
    memRecall: memRecall,
    memClear: memClear,
    toggleAngle: toggleAngle,
    reset: reset,
    formatNumber: formatNumber
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = Store;
