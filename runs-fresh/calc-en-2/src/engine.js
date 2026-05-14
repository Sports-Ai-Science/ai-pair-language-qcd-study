// engine.js — Pure scientific calculator kernel.
// Tokenizer + shunting-yard parser + RPN evaluator.
// No DOM, no globals other than the published Calc.engine namespace.
(function (root) {
  'use strict';

  var ERR = {
    DIV_ZERO: 'DIV_ZERO',
    DOMAIN: 'DOMAIN',
    SYNTAX: 'SYNTAX',
    OVERFLOW: 'OVERFLOW'
  };

  function fail(code, msg) {
    var err = new Error(msg || code);
    err.code = code;
    throw err;
  }

  // --- Tokenizer ---------------------------------------------------------
  var FUNCS = {
    sin: 1, cos: 1, tan: 1, asin: 1, acos: 1, atan: 1,
    log: 1, ln: 1, exp: 1, sqrt: 1
  };

  function tokenize(src) {
    var tokens = [];
    var i = 0;
    var s = String(src).replace(/\s+/g, '');
    if (!s) fail(ERR.SYNTAX, 'empty expression');
    while (i < s.length) {
      var c = s[i];
      if ((c >= '0' && c <= '9') || c === '.') {
        var j = i;
        while (j < s.length && /[0-9.]/.test(s[j])) j++;
        if (j < s.length && (s[j] === 'e' || s[j] === 'E')) {
          j++;
          if (s[j] === '+' || s[j] === '-') j++;
          while (j < s.length && /[0-9]/.test(s[j])) j++;
        }
        var num = Number(s.slice(i, j));
        if (!isFinite(num)) fail(ERR.SYNTAX, 'bad number');
        tokens.push({ t: 'num', v: num });
        i = j;
        continue;
      }
      if (/[a-zA-Z]/.test(c)) {
        var k = i;
        while (k < s.length && /[a-zA-Z]/.test(s[k])) k++;
        var word = s.slice(i, k);
        if (word === 'pi') tokens.push({ t: 'num', v: Math.PI });
        else if (word === 'e') tokens.push({ t: 'num', v: Math.E });
        else if (FUNCS[word]) tokens.push({ t: 'fn', v: word });
        else fail(ERR.SYNTAX, 'unknown ident: ' + word);
        i = k;
        continue;
      }
      if ('+-*/^()'.indexOf(c) !== -1) {
        tokens.push({ t: c === '(' || c === ')' ? c : 'op', v: c });
        i++;
        continue;
      }
      fail(ERR.SYNTAX, 'unexpected char: ' + c);
    }
    return tokens;
  }

  // --- Shunting-yard ------------------------------------------------------
  // Distinguish unary minus from binary minus by inspecting previous token.
  function rewriteUnary(tokens) {
    var out = [];
    for (var i = 0; i < tokens.length; i++) {
      var tk = tokens[i];
      var prev = out[out.length - 1];
      if (
        tk.t === 'op' && tk.v === '-' &&
        (!prev || prev.t === 'op' || prev.v === '(')
      ) {
        out.push({ t: 'op', v: 'u-' });
      } else {
        out.push(tk);
      }
    }
    return out;
  }

  var PREC = { 'u-': 5, '^': 4, '*': 3, '/': 3, '+': 2, '-': 2 };
  var RIGHT = { 'u-': true, '^': true };

  function toRpn(tokens) {
    var out = [];
    var ops = [];
    for (var i = 0; i < tokens.length; i++) {
      var tk = tokens[i];
      if (tk.t === 'num') out.push(tk);
      else if (tk.t === 'fn') ops.push(tk);
      else if (tk.t === 'op') {
        while (ops.length) {
          var top = ops[ops.length - 1];
          if (top.t === 'fn') { out.push(ops.pop()); continue; }
          if (top.t !== 'op') break;
          var pTop = PREC[top.v], pCur = PREC[tk.v];
          if (pTop > pCur || (pTop === pCur && !RIGHT[tk.v])) {
            out.push(ops.pop());
          } else break;
        }
        ops.push(tk);
      } else if (tk.t === '(') {
        ops.push(tk);
      } else if (tk.t === ')') {
        var found = false;
        while (ops.length) {
          var o = ops.pop();
          if (o.t === '(') { found = true; break; }
          out.push(o);
        }
        if (!found) fail(ERR.SYNTAX, 'mismatched )');
        if (ops.length && ops[ops.length - 1].t === 'fn') {
          out.push(ops.pop());
        }
      }
    }
    while (ops.length) {
      var x = ops.pop();
      if (x.t === '(' || x.t === ')') fail(ERR.SYNTAX, 'mismatched (');
      out.push(x);
    }
    return out;
  }

  // --- Evaluator ----------------------------------------------------------
  function applyFn(name, x, angleMode) {
    var rad = angleMode === 'DEG' ? x * Math.PI / 180 : x;
    var deg = function (v) { return angleMode === 'DEG' ? v * 180 / Math.PI : v; };
    switch (name) {
      case 'sin': return Math.sin(rad);
      case 'cos': return Math.cos(rad);
      case 'tan':
        if (Math.abs(Math.cos(rad)) < 1e-12) fail(ERR.DOMAIN, 'tan singularity');
        return Math.tan(rad);
      case 'asin':
        if (x < -1 || x > 1) fail(ERR.DOMAIN, 'asin out of range');
        return deg(Math.asin(x));
      case 'acos':
        if (x < -1 || x > 1) fail(ERR.DOMAIN, 'acos out of range');
        return deg(Math.acos(x));
      case 'atan': return deg(Math.atan(x));
      case 'log':
        if (x <= 0) fail(ERR.DOMAIN, 'log of non-positive');
        return Math.log10(x);
      case 'ln':
        if (x <= 0) fail(ERR.DOMAIN, 'ln of non-positive');
        return Math.log(x);
      case 'exp': return Math.exp(x);
      case 'sqrt':
        if (x < 0) fail(ERR.DOMAIN, 'sqrt of negative');
        return Math.sqrt(x);
    }
    fail(ERR.SYNTAX, 'unknown fn: ' + name);
  }

  function evalRpn(rpn, angleMode) {
    var st = [];
    for (var i = 0; i < rpn.length; i++) {
      var tk = rpn[i];
      if (tk.t === 'num') { st.push(tk.v); continue; }
      if (tk.t === 'fn') {
        if (!st.length) fail(ERR.SYNTAX, 'fn missing arg');
        st.push(applyFn(tk.v, st.pop(), angleMode));
        continue;
      }
      if (tk.t === 'op') {
        if (tk.v === 'u-') {
          if (!st.length) fail(ERR.SYNTAX, 'unary missing operand');
          st.push(-st.pop());
          continue;
        }
        if (st.length < 2) fail(ERR.SYNTAX, 'binary missing operand');
        var b = st.pop(), a = st.pop(), r;
        switch (tk.v) {
          case '+': r = a + b; break;
          case '-': r = a - b; break;
          case '*': r = a * b; break;
          case '/':
            if (b === 0) fail(ERR.DIV_ZERO, 'divide by zero');
            r = a / b; break;
          case '^': r = Math.pow(a, b); break;
        }
        st.push(r);
      }
    }
    if (st.length !== 1) fail(ERR.SYNTAX, 'leftover stack');
    var res = st[0];
    if (!isFinite(res)) fail(ERR.OVERFLOW, 'non-finite result');
    return res;
  }

  function evaluate(expr, opts) {
    var mode = (opts && opts.angleMode) || 'RAD';
    var tokens = rewriteUnary(tokenize(expr));
    var rpn = toRpn(tokens);
    return evalRpn(rpn, mode);
  }

  // --- Display formatting -------------------------------------------------
  function format(value) {
    if (typeof value !== 'number' || !isFinite(value)) return String(value);
    if (Number.isInteger(value) && Math.abs(value) < 1e15) return String(value);
    var s = value.toPrecision(12);
    if (s.indexOf('e') === -1 && s.indexOf('.') !== -1) {
      s = s.replace(/0+$/, '').replace(/\.$/, '');
    }
    return s;
  }

  root.Calc = root.Calc || {};
  root.Calc.engine = { evaluate: evaluate, format: format, ERR: ERR };
})(typeof globalThis !== 'undefined' ? globalThis : this);
