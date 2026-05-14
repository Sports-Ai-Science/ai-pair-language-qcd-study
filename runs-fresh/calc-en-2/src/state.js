// state.js — Calculator state machine. No DOM access.
// Wraps Calc.engine and exposes commands consumed by ui.js and the tests.
(function (root) {
  'use strict';

  var engine = root.Calc && root.Calc.engine;

  var HISTORY_CAP = 10;

  function create() {
    var s = {
      expression: '',
      display: '0',
      history: [],
      memory: 0,
      angleMode: 'RAD',
      error: null,
      _justEvaluated: false
    };

    function snapshot() {
      return {
        expression: s.expression,
        display: s.display,
        history: s.history.slice(),
        memory: s.memory,
        angleMode: s.angleMode,
        error: s.error
      };
    }

    function clearError() { s.error = null; }
    function frozen() { return s.error !== null; }

    function resetIfJustEvaluated() {
      if (s._justEvaluated) {
        s.expression = '';
        s.display = '0';
        s._justEvaluated = false;
      }
    }

    function appendToken(tok) {
      if (frozen()) return;
      resetIfJustEvaluated();
      s.expression += tok;
      s.display = s.expression;
    }

    function inputDigit(d) {
      if (frozen()) return;
      resetIfJustEvaluated();
      if (s.expression === '' && d === '0') { s.display = '0'; return; }
      s.expression += String(d);
      s.display = s.expression;
    }

    function inputDot() {
      if (frozen()) return;
      resetIfJustEvaluated();
      // Prevent two dots in the current number.
      var tail = s.expression.split(/[+\-*/^()]/).pop();
      if (tail.indexOf('.') !== -1) return;
      if (tail === '') s.expression += '0';
      s.expression += '.';
      s.display = s.expression;
    }

    function inputConst(name) {
      appendToken(name === 'pi' ? 'pi' : 'e');
    }

    function applyOperator(op) {
      if (frozen()) return;
      // After equals, allow continuing with the result.
      if (s._justEvaluated) {
        s.expression = s.display;
        s._justEvaluated = false;
      }
      if (s.expression === '' && op !== '-') return;
      // Replace consecutive operators (except unary minus after '(').
      var last = s.expression.slice(-1);
      if (last && '+-*/^'.indexOf(last) !== -1 && op !== '-') {
        s.expression = s.expression.slice(0, -1);
      }
      s.expression += op;
      s.display = s.expression;
    }

    function applyFunction(fn) {
      if (frozen()) return;
      if (s._justEvaluated) {
        s.expression = fn + '(' + s.display + ')';
        s.display = s.expression;
        s._justEvaluated = false;
        return;
      }
      s.expression += fn + '(';
      s.display = s.expression;
    }

    function applySquare() {
      if (frozen()) return;
      if (s.expression === '' && !s._justEvaluated) return;
      var base = s._justEvaluated ? s.display : s.expression;
      s.expression = '(' + base + ')^2';
      s.display = s.expression;
      s._justEvaluated = false;
    }

    function openParen() { appendToken('('); }
    function closeParen() { appendToken(')'); }

    function equals() {
      if (frozen()) return;
      if (!s.expression) return;
      try {
        var v = engine.evaluate(s.expression, { angleMode: s.angleMode });
        var shown = engine.format(v);
        s.history.push(s.expression + ' = ' + shown);
        if (s.history.length > HISTORY_CAP) {
          s.history = s.history.slice(s.history.length - HISTORY_CAP);
        }
        s.display = shown;
        s._justEvaluated = true;
      } catch (e) {
        s.error = e.code || 'SYNTAX';
        s.display = 'Error: ' + s.error;
      }
    }

    function clear() {
      s.expression = '';
      s.display = '0';
      s._justEvaluated = false;
      clearError();
    }

    function backspace() {
      if (frozen()) { clear(); return; }
      if (s._justEvaluated) { clear(); return; }
      s.expression = s.expression.slice(0, -1);
      s.display = s.expression || '0';
    }

    function setAngleMode(mode) {
      if (mode !== 'DEG' && mode !== 'RAD') return;
      s.angleMode = mode;
    }

    function memoryAdd() {
      if (frozen()) return;
      try {
        var v = s.expression
          ? engine.evaluate(s.expression, { angleMode: s.angleMode })
          : Number(s.display);
        if (isFinite(v)) s.memory += v;
      } catch (e) { s.error = e.code; s.display = 'Error: ' + s.error; }
    }

    function memorySub() {
      if (frozen()) return;
      try {
        var v = s.expression
          ? engine.evaluate(s.expression, { angleMode: s.angleMode })
          : Number(s.display);
        if (isFinite(v)) s.memory -= v;
      } catch (e) { s.error = e.code; s.display = 'Error: ' + s.error; }
    }

    function memoryRecall() {
      if (frozen()) return;
      resetIfJustEvaluated();
      s.expression += engine.format(s.memory);
      s.display = s.expression;
    }

    function memoryClear() { s.memory = 0; }

    return {
      snapshot: snapshot,
      inputDigit: inputDigit,
      inputDot: inputDot,
      inputConst: inputConst,
      applyOperator: applyOperator,
      applyFunction: applyFunction,
      applySquare: applySquare,
      openParen: openParen,
      closeParen: closeParen,
      equals: equals,
      clear: clear,
      backspace: backspace,
      setAngleMode: setAngleMode,
      memoryAdd: memoryAdd,
      memorySub: memorySub,
      memoryRecall: memoryRecall,
      memoryClear: memoryClear
    };
  }

  root.Calc = root.Calc || {};
  root.Calc.state = { create: create, HISTORY_CAP: HISTORY_CAP };
})(typeof globalThis !== 'undefined' ? globalThis : this);
