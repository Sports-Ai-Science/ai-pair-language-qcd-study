// ui.js — DOM wiring and keyboard mapping. No math.
(function (root) {
  'use strict';

  function bind(doc, store) {
    var displayEl = doc.getElementById('display');
    var historyEl = doc.getElementById('history');
    var modeEl = doc.getElementById('mode');
    var memEl = doc.getElementById('memory-indicator');

    function render() {
      var snap = store.snapshot();
      displayEl.textContent = snap.display;
      historyEl.innerHTML = '';
      for (var i = snap.history.length - 1; i >= 0; i--) {
        var li = doc.createElement('li');
        li.textContent = snap.history[i];
        historyEl.appendChild(li);
      }
      modeEl.textContent = snap.angleMode;
      memEl.textContent = snap.memory !== 0 ? 'M' : '';
    }

    function dispatch(action) {
      switch (action.kind) {
        case 'digit':    store.inputDigit(action.value); break;
        case 'dot':      store.inputDot(); break;
        case 'op':       store.applyOperator(action.value); break;
        case 'fn':       store.applyFunction(action.value); break;
        case 'square':   store.applySquare(); break;
        case 'const':    store.inputConst(action.value); break;
        case 'paren':    action.value === '(' ? store.openParen() : store.closeParen(); break;
        case 'equals':   store.equals(); break;
        case 'clear':    store.clear(); break;
        case 'back':     store.backspace(); break;
        case 'mode':     store.setAngleMode(action.value); break;
        case 'mplus':    store.memoryAdd(); break;
        case 'mminus':   store.memorySub(); break;
        case 'mrecall':  store.memoryRecall(); break;
        case 'mclear':   store.memoryClear(); break;
      }
      render();
    }

    // Click handler: every button carries data-action and optional data-value.
    var grid = doc.getElementById('keys');
    if (grid) {
      grid.addEventListener('click', function (ev) {
        var btn = ev.target.closest('button');
        if (!btn) return;
        var kind = btn.getAttribute('data-action');
        var value = btn.getAttribute('data-value') || undefined;
        if (kind) dispatch({ kind: kind, value: value });
      });
    }

    // Keyboard mapping shared with tests via Calc.ui.fromKey.
    function fromKey(ev) {
      var k = ev.key;
      if (k >= '0' && k <= '9') return { kind: 'digit', value: k };
      if (k === '.') return { kind: 'dot' };
      if (k === '+' || k === '-' || k === '/' || k === '^') return { kind: 'op', value: k };
      if (k === '*' || k === 'x' || k === 'X') return { kind: 'op', value: '*' };
      if (k === 'Enter' || k === '=') return { kind: 'equals' };
      if (k === 'Backspace') return { kind: 'back' };
      if (k === 'Escape') return { kind: 'clear' };
      if (k === '(' || k === ')') return { kind: 'paren', value: k };
      return null;
    }

    doc.addEventListener('keydown', function (ev) {
      var action = fromKey(ev);
      if (action) { ev.preventDefault(); dispatch(action); }
    });

    render();
    return { render: render, dispatch: dispatch, fromKey: fromKey };
  }

  function boot() {
    if (typeof document === 'undefined') return;
    var store = root.Calc.state.create();
    root.Calc.ui = bind(document, store);
  }

  root.Calc = root.Calc || {};
  root.Calc.uiFactory = { bind: bind, boot: boot };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
