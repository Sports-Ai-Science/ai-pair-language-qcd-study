// ui.js — DOM bindings. Builds the button grid, wires events,
// and renders Store snapshots. Exposes a global `UI` (IIFE).
var UI = (function () {
  'use strict';

  var BUTTONS = [
    [['MC', 'mem-clear'], ['MR', 'mem-recall'], ['M+', 'mem-add'], ['M-', 'mem-sub'], ['DEG', 'angle']],
    [['sin', 'fn-sin'], ['cos', 'fn-cos'], ['tan', 'fn-tan'], ['ln', 'fn-ln'], ['log', 'fn-log']],
    [['asin', 'fn-asin'], ['acos', 'fn-acos'], ['atan', 'fn-atan'], ['exp', 'fn-exp'], ['sqrt', 'fn-sqrt']],
    [['pi', 'const-pi'], ['e', 'const-e'], ['^', 'op-pow'], ['x^2', 'op-sq'], ['/', 'op-div']],
    [['7', 'd7'], ['8', 'd8'], ['9', 'd9'], ['(', 'lp'], ['*', 'op-mul']],
    [['4', 'd4'], ['5', 'd5'], ['6', 'd6'], [')', 'rp'], ['-', 'op-sub']],
    [['1', 'd1'], ['2', 'd2'], ['3', 'd3'], ['.', 'dot'], ['+', 'op-add']],
    [['0', 'd0'], ['C', 'clear'], ['<-', 'back'], ['=', 'equals']]
  ];

  function press(action) {
    if (action === 'clear') return Store.clear();
    if (action === 'back') return Store.backspace();
    if (action === 'equals') return Store.equals();
    if (action === 'angle') return Store.toggleAngle();
    if (action === 'mem-clear') return Store.memClear();
    if (action === 'mem-recall') return Store.memRecall();
    if (action === 'mem-add') return Store.memAdd();
    if (action === 'mem-sub') return Store.memSub();
    if (action === 'const-pi') return Store.append('pi');
    if (action === 'const-e') return Store.append('e');
    if (action === 'op-sq') return Store.append('^2');
    if (action === 'op-pow') return Store.append('^');
    if (action === 'op-div') return Store.append('/');
    if (action === 'op-mul') return Store.append('*');
    if (action === 'op-sub') return Store.append('-');
    if (action === 'op-add') return Store.append('+');
    if (action === 'lp') return Store.append('(');
    if (action === 'rp') return Store.append(')');
    if (action === 'dot') return Store.append('.');
    if (action.indexOf('d') === 0) return Store.append(action.slice(1));
    if (action.indexOf('fn-') === 0) return Store.append(action.slice(3) + '(');
  }

  function render(snap, els) {
    els.display.textContent = snap.lastError ? snap.lastError : (snap.display || '0');
    els.display.classList.toggle('error', !!snap.lastError);
    els.angle.textContent = snap.angleMode;
    els.memory.textContent = snap.memory === 0 ? '' : 'M';
    els.history.innerHTML = '';
    for (var i = 0; i < snap.history.length; i++) {
      var item = snap.history[i];
      var li = document.createElement('li');
      li.textContent = item.expr + ' = ' + Store.formatNumber(item.value);
      els.history.appendChild(li);
    }
  }

  function buildGrid(grid) {
    grid.innerHTML = '';
    for (var r = 0; r < BUTTONS.length; r++) {
      var row = BUTTONS[r];
      for (var c = 0; c < row.length; c++) {
        var label = row[c][0];
        var action = row[c][1];
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = label;
        btn.dataset.action = action;
        if (action === 'equals') btn.classList.add('span-2', 'primary');
        if (action === 'clear' || action === 'back') btn.classList.add('warn');
        if (/^op-/.test(action)) btn.classList.add('op');
        if (/^fn-/.test(action) || /^const-/.test(action) || /^mem-/.test(action) || action === 'angle') {
          btn.classList.add('sci');
        }
        grid.appendChild(btn);
      }
    }
    grid.addEventListener('click', function (ev) {
      var t = ev.target;
      if (t && t.dataset && t.dataset.action) press(t.dataset.action);
    });
  }

  function bindKeyboard() {
    document.addEventListener('keydown', function (ev) {
      var k = ev.key;
      if (k >= '0' && k <= '9') return Store.append(k);
      if ('+-*/^().'.indexOf(k) >= 0) return Store.append(k);
      if (k === 'Enter' || k === '=') { ev.preventDefault(); return Store.equals(); }
      if (k === 'Backspace') { ev.preventDefault(); return Store.backspace(); }
      if (k === 'Escape') return Store.clear();
    });
  }

  function mount(root) {
    root.innerHTML =
      '<div class="calc">' +
      '<header><span class="badge mode" data-el="angle">RAD</span>' +
      '<span class="badge mem" data-el="memory"></span>' +
      '<h1>Scientific Calculator</h1></header>' +
      '<div class="display" data-el="display">0</div>' +
      '<div class="grid" data-el="grid"></div>' +
      '<aside><h2>History</h2><ol data-el="history"></ol></aside>' +
      '</div>';
    var els = {
      display: root.querySelector('[data-el=display]'),
      angle: root.querySelector('[data-el=angle]'),
      memory: root.querySelector('[data-el=memory]'),
      grid: root.querySelector('[data-el=grid]'),
      history: root.querySelector('[data-el=history]')
    };
    buildGrid(els.grid);
    bindKeyboard();
    Store.subscribe(function (snap) { render(snap, els); });
    render(Store.snapshot(), els);
  }

  return { mount: mount, press: press };
})();

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function () {
    UI.mount(document.getElementById('app'));
  });
}
