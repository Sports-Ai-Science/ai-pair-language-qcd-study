// DOM 連携層。CalcState を閉包で保持し、ボタンとキーボードからのイベントを状態遷移に翻訳する。
(function (root) {
  'use strict';

  function init(doc) {
    var state = root.CalcState.create();
    var displayEl = doc.getElementById('display');
    var historyEl = doc.getElementById('history');
    var modeEl = doc.getElementById('mode');

    function render() {
      displayEl.textContent = state.display;
      modeEl.textContent = state.angleMode;
      historyEl.innerHTML = '';
      for (var i = 0; i < state.history.length; i++) {
        var li = doc.createElement('li');
        li.textContent = state.history[i].expr + ' = ' + state.history[i].result;
        historyEl.appendChild(li);
      }
    }

    // data-action 属性に応じてアクションを発火させる。
    function dispatch(action, value) {
      switch (action) {
        case 'input': state = root.CalcState.input(state, value); break;
        case 'equals': state = root.CalcState.equals(state); break;
        case 'clear': state = root.CalcState.clear(state); break;
        case 'backspace': state = root.CalcState.backspace(state); break;
        case 'unary': state = root.CalcState.applyUnary(state, value); break;
        case 'mplus': state = root.CalcState.memoryPlus(state); break;
        case 'mminus': state = root.CalcState.memoryMinus(state); break;
        case 'mrecall': state = root.CalcState.memoryRecall(state); break;
        case 'mclear': state = root.CalcState.memoryClear(state); break;
        case 'toggle-angle': state = root.CalcState.toggleAngle(state); break;
        case 'const': state = root.CalcState.input(state, value); break;
      }
      render();
    }

    var buttons = doc.querySelectorAll('button[data-action]');
    for (var i = 0; i < buttons.length; i++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          dispatch(btn.getAttribute('data-action'), btn.getAttribute('data-value'));
        });
      })(buttons[i]);
    }

    // キーボードから数字・演算子・Enter・Backspace・Escape を受け付ける。
    doc.addEventListener('keydown', function (ev) {
      var k = ev.key;
      if (k >= '0' && k <= '9') { dispatch('input', k); ev.preventDefault(); return; }
      if (k === '.' || k === '(' || k === ')' || k === '+' || k === '-' || k === '*' || k === '/' || k === '^') {
        dispatch('input', k); ev.preventDefault(); return;
      }
      if (k === 'Enter' || k === '=') { dispatch('equals'); ev.preventDefault(); return; }
      if (k === 'Backspace') { dispatch('backspace'); ev.preventDefault(); return; }
      if (k === 'Escape') { dispatch('clear'); ev.preventDefault(); return; }
      if (k === 'm' || k === 'M') { dispatch('mrecall'); ev.preventDefault(); return; }
    });

    render();
  }

  var CalcUI = { init: init };
  root.CalcUI = CalcUI;

  // ブラウザロード時に自動初期化する (Node 環境では document 不在のためスキップ)。
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { init(document); });
    } else {
      init(document);
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
