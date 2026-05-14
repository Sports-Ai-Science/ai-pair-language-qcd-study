// 電卓の可変状態を管理する純粋関数群。
// 状態オブジェクトは常に新規生成して返す (イミュータブル方針)。
(function (root) {
  'use strict';

  var HISTORY_MAX = 10;

  function create() {
    return {
      display: '0',
      expr: '',
      memory: 0,
      history: [],
      angleMode: 'DEG',
      lastError: null
    };
  }

  // エラー直後の入力はエラーをクリアして新規入力扱いにする。
  function clearErrorIfNeeded(state) {
    if (state.lastError) {
      return Object.assign({}, state, { display: '0', expr: '', lastError: null });
    }
    return state;
  }

  // 1 トークン入力 (数字・演算子・括弧・ドット)。
  function input(state, token) {
    var s = clearErrorIfNeeded(state);
    var newExpr = s.expr + String(token);
    var newDisplay = newExpr.length === 0 ? '0' : newExpr;
    return Object.assign({}, s, { expr: newExpr, display: newDisplay });
  }

  function backspace(state) {
    var s = clearErrorIfNeeded(state);
    var newExpr = s.expr.slice(0, -1);
    var newDisplay = newExpr.length === 0 ? '0' : newExpr;
    return Object.assign({}, s, { expr: newExpr, display: newDisplay });
  }

  function clear(state) {
    return Object.assign({}, state, { display: '0', expr: '', lastError: null });
  }

  // = 押下時の評価。エラーは lastError に保存し、display を 'Error' に。
  function equals(state) {
    if (!state.expr) return state;
    try {
      var result = root.CalcEngine.evaluate(state.expr, state.angleMode);
      var formatted = root.CalcEngine.format(result);
      var newHistory = [{ expr: state.expr, result: formatted }].concat(state.history).slice(0, HISTORY_MAX);
      return Object.assign({}, state, {
        display: formatted,
        expr: formatted,
        history: newHistory,
        lastError: null
      });
    } catch (err) {
      return Object.assign({}, state, {
        display: 'Error',
        expr: '',
        lastError: err.message
      });
    }
  }

  // 単項関数を「現在の表示値」に適用して即時計算する。
  function applyUnary(state, fnName) {
    var s = clearErrorIfNeeded(state);
    var current = parseFloat(s.expr || s.display);
    if (isNaN(current)) current = 0;
    try {
      var r = root.CalcEngine.applyFunction(fnName, current, s.angleMode);
      var formatted = root.CalcEngine.format(r);
      var displayExpr = fnName + '(' + s.display + ')';
      var newHistory = [{ expr: displayExpr, result: formatted }].concat(s.history).slice(0, HISTORY_MAX);
      return Object.assign({}, s, {
        display: formatted,
        expr: formatted,
        history: newHistory,
        lastError: null
      });
    } catch (err) {
      return Object.assign({}, s, {
        display: 'Error',
        expr: '',
        lastError: err.message
      });
    }
  }

  function currentValue(state) {
    var v = parseFloat(state.expr || state.display);
    return isNaN(v) ? 0 : v;
  }

  function memoryPlus(state) {
    return Object.assign({}, state, { memory: state.memory + currentValue(state) });
  }
  function memoryMinus(state) {
    return Object.assign({}, state, { memory: state.memory - currentValue(state) });
  }
  function memoryRecall(state) {
    var s = clearErrorIfNeeded(state);
    var formatted = root.CalcEngine.format(s.memory);
    return Object.assign({}, s, { display: formatted, expr: formatted });
  }
  function memoryClear(state) {
    return Object.assign({}, state, { memory: 0 });
  }

  function toggleAngle(state) {
    return Object.assign({}, state, { angleMode: state.angleMode === 'DEG' ? 'RAD' : 'DEG' });
  }

  var CalcState = {
    HISTORY_MAX: HISTORY_MAX,
    create: create,
    input: input,
    backspace: backspace,
    clear: clear,
    equals: equals,
    applyUnary: applyUnary,
    memoryPlus: memoryPlus,
    memoryMinus: memoryMinus,
    memoryRecall: memoryRecall,
    memoryClear: memoryClear,
    toggleAngle: toggleAngle
  };

  root.CalcState = CalcState;
})(typeof window !== 'undefined' ? window : globalThis);
