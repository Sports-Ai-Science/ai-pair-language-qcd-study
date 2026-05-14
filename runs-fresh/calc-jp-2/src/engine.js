// 関数電卓の純粋計算エンジン (DOM 非依存)。
// Shunting-yard でトークンを RPN に変換し、スタック評価する。
// IIFE で CalcEngine をグローバル公開し、Node テストでは globalThis から参照する。
(function (root) {
  'use strict';

  var PI = Math.PI, E = Math.E;

  // 二項演算子の優先順位と結合性。
  var OPS = {
    '+': { prec: 1, right: false, fn: function (a, b) { return a + b; } },
    '-': { prec: 1, right: false, fn: function (a, b) { return a - b; } },
    '*': { prec: 2, right: false, fn: function (a, b) { return a * b; } },
    '/': { prec: 2, right: false, fn: function (a, b) { return a / b; } },
    '^': { prec: 3, right: true,  fn: function (a, b) { return Math.pow(a, b); } }
  };
  var FUNCS = ['sin','cos','tan','asin','acos','atan','log','ln','exp','sqrt','sq'];

  function isDigit(c) { return c >= '0' && c <= '9'; }
  function isAlpha(c) { return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z'); }

  // 入力文字列をトークン列に分解する。
  // 単項マイナスは「式頭・直前が演算子・開き括弧・関数」のときに 0 を補う。
  function tokenize(expr) {
    var tokens = [], i = 0, s = String(expr);
    while (i < s.length) {
      var c = s[i];
      if (c === ' ' || c === '\t') { i++; continue; }
      if (isDigit(c) || c === '.') {
        var j = i;
        while (j < s.length && (isDigit(s[j]) || s[j] === '.')) j++;
        var num = parseFloat(s.slice(i, j));
        if (isNaN(num)) throw new Error('Syntax');
        tokens.push({ type: 'num', value: num }); i = j; continue;
      }
      if (isAlpha(c)) {
        var k = i;
        while (k < s.length && (isAlpha(s[k]) || isDigit(s[k]))) k++;
        var name = s.slice(i, k).toLowerCase();
        if (name === 'pi') tokens.push({ type: 'num', value: PI });
        else if (name === 'e') tokens.push({ type: 'num', value: E });
        else if (FUNCS.indexOf(name) >= 0) tokens.push({ type: 'func', value: name });
        else throw new Error('Syntax');
        i = k; continue;
      }
      if (c === '(') { tokens.push({ type: 'lparen' }); i++; continue; }
      if (c === ')') { tokens.push({ type: 'rparen' }); i++; continue; }
      if (OPS[c]) {
        if (c === '-') {
          var prev = tokens[tokens.length - 1];
          if (!prev || prev.type === 'op' || prev.type === 'lparen' || prev.type === 'func') {
            tokens.push({ type: 'num', value: 0 });
          }
        }
        tokens.push({ type: 'op', value: c }); i++; continue;
      }
      throw new Error('Syntax');
    }
    return tokens;
  }

  // Shunting-yard で中置記法を逆ポーランドに変換する。
  function toRpn(tokens) {
    var out = [], stack = [];
    for (var i = 0; i < tokens.length; i++) {
      var t = tokens[i];
      if (t.type === 'num') { out.push(t); }
      else if (t.type === 'func') { stack.push(t); }
      else if (t.type === 'op') {
        while (stack.length) {
          var top = stack[stack.length - 1];
          if (top.type === 'func') { out.push(stack.pop()); continue; }
          if (top.type === 'op') {
            var o1 = OPS[t.value], o2 = OPS[top.value];
            if ((!o1.right && o1.prec <= o2.prec) || (o1.right && o1.prec < o2.prec)) {
              out.push(stack.pop()); continue;
            }
          }
          break;
        }
        stack.push(t);
      } else if (t.type === 'lparen') { stack.push(t); }
      else if (t.type === 'rparen') {
        var matched = false;
        while (stack.length) {
          var x = stack.pop();
          if (x.type === 'lparen') { matched = true; break; }
          out.push(x);
        }
        if (!matched) throw new Error('Syntax');
        if (stack.length && stack[stack.length - 1].type === 'func') out.push(stack.pop());
      }
    }
    while (stack.length) {
      var r = stack.pop();
      if (r.type === 'lparen' || r.type === 'rparen') throw new Error('Syntax');
      out.push(r);
    }
    return out;
  }

  // RPN を評価する。Infinity はゼロ除算、NaN は定義域外として例外化する。
  function evalRpn(rpn, angleMode) {
    var st = [];
    for (var i = 0; i < rpn.length; i++) {
      var t = rpn[i];
      if (t.type === 'num') { st.push(t.value); }
      else if (t.type === 'op') {
        if (st.length < 2) throw new Error('Syntax');
        var b = st.pop(), a = st.pop();
        st.push(OPS[t.value].fn(a, b));
      } else if (t.type === 'func') {
        if (st.length < 1) throw new Error('Syntax');
        st.push(applyFunction(t.value, st.pop(), angleMode));
      }
    }
    if (st.length !== 1) throw new Error('Syntax');
    var result = st[0];
    if (!isFinite(result)) {
      if (isNaN(result)) throw new Error('Domain');
      throw new Error('Div by zero');
    }
    return result;
  }

  // 単項関数を適用する。三角関数は angleMode に応じて変換する。
  function applyFunction(name, x, angleMode) {
    var toRad = function (deg) { return deg * PI / 180; };
    var fromRad = function (rad) { return rad * 180 / PI; };
    var r;
    switch (name) {
      case 'sin': r = Math.sin(angleMode === 'DEG' ? toRad(x) : x); break;
      case 'cos': r = Math.cos(angleMode === 'DEG' ? toRad(x) : x); break;
      case 'tan': r = Math.tan(angleMode === 'DEG' ? toRad(x) : x); break;
      case 'asin': r = Math.asin(x); if (angleMode === 'DEG') r = fromRad(r); break;
      case 'acos': r = Math.acos(x); if (angleMode === 'DEG') r = fromRad(r); break;
      case 'atan': r = Math.atan(x); if (angleMode === 'DEG') r = fromRad(r); break;
      case 'log': r = Math.log10(x); break;
      case 'ln': r = Math.log(x); break;
      case 'exp': r = Math.exp(x); break;
      case 'sqrt': r = Math.sqrt(x); break;
      case 'sq': r = x * x; break;
      default: throw new Error('Syntax');
    }
    if (isNaN(r)) throw new Error('Domain');
    if (!isFinite(r)) throw new Error('Div by zero');
    return r;
  }

  function evaluate(expr, angleMode) {
    return evalRpn(toRpn(tokenize(expr)), angleMode || 'DEG');
  }

  // 表示用フォーマット。整数は整数表記、極端値は指数表記、それ以外は最大 12 桁。
  function format(n) {
    if (typeof n !== 'number' || !isFinite(n)) return 'Error';
    if (n === 0) return '0';
    var abs = Math.abs(n);
    if (abs >= 1e12 || abs < 1e-6) return n.toExponential(6);
    var s = n.toPrecision(12);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return s;
  }

  root.CalcEngine = {
    tokenize: tokenize, toRpn: toRpn, evalRpn: evalRpn,
    evaluate: evaluate, applyFunction: applyFunction, format: format,
    constants: { PI: PI, E: E }
  };
})(typeof window !== 'undefined' ? window : globalThis);
