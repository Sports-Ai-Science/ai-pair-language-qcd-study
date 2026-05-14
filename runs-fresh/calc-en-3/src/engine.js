// engine.js — pure expression evaluator for the scientific calculator.
// Exposes a single global `Engine` (IIFE). No DOM access.
var Engine = (function () {
  'use strict';

  var FUNCS = {
    sin: 1, cos: 1, tan: 1,
    asin: 1, acos: 1, atan: 1,
    log: 1, ln: 1, exp: 1, sqrt: 1
  };
  var CONSTS = { pi: Math.PI, e: Math.E };

  function tokenize(src) {
    var tokens = [];
    var i = 0;
    while (i < src.length) {
      var ch = src[i];
      if (ch === ' ' || ch === '\t') { i++; continue; }
      if ((ch >= '0' && ch <= '9') || ch === '.') {
        var start = i;
        while (i < src.length && ((src[i] >= '0' && src[i] <= '9') || src[i] === '.')) i++;
        if (i < src.length && (src[i] === 'e' || src[i] === 'E')) {
          i++;
          if (src[i] === '+' || src[i] === '-') i++;
          while (i < src.length && src[i] >= '0' && src[i] <= '9') i++;
        }
        var raw = src.slice(start, i);
        var n = Number(raw);
        if (isNaN(n)) throw new Error('parse error: invalid number ' + raw);
        tokens.push({ type: 'num', value: n });
        continue;
      }
      if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')) {
        var s = i;
        while (i < src.length && ((src[i] >= 'a' && src[i] <= 'z') ||
               (src[i] >= 'A' && src[i] <= 'Z'))) i++;
        var name = src.slice(s, i).toLowerCase();
        tokens.push({ type: 'ident', value: name });
        continue;
      }
      if ('+-*/^(),'.indexOf(ch) >= 0) {
        tokens.push({ type: 'op', value: ch });
        i++;
        continue;
      }
      throw new Error('parse error: unexpected character ' + ch);
    }
    return tokens;
  }

  function Parser(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }
  Parser.prototype.peek = function () { return this.tokens[this.pos]; };
  Parser.prototype.eat = function () { return this.tokens[this.pos++]; };
  Parser.prototype.expect = function (val) {
    var t = this.eat();
    if (!t || t.value !== val) throw new Error('parse error: expected ' + val);
    return t;
  };

  Parser.prototype.parseExpr = function () {
    var left = this.parseTerm();
    while (this.peek() && (this.peek().value === '+' || this.peek().value === '-')) {
      var op = this.eat().value;
      var right = this.parseTerm();
      left = { kind: 'bin', op: op, left: left, right: right };
    }
    return left;
  };
  Parser.prototype.parseTerm = function () {
    var left = this.parsePower();
    while (this.peek() && (this.peek().value === '*' || this.peek().value === '/')) {
      var op = this.eat().value;
      var right = this.parsePower();
      left = { kind: 'bin', op: op, left: left, right: right };
    }
    return left;
  };
  Parser.prototype.parsePower = function () {
    var base = this.parseUnary();
    if (this.peek() && this.peek().value === '^') {
      this.eat();
      var exp = this.parsePower(); // right-assoc
      return { kind: 'bin', op: '^', left: base, right: exp };
    }
    return base;
  };
  Parser.prototype.parseUnary = function () {
    var p = this.peek();
    if (p && (p.value === '+' || p.value === '-')) {
      var op = this.eat().value;
      var arg = this.parseUnary();
      return { kind: 'unary', op: op, arg: arg };
    }
    return this.parseAtom();
  };
  Parser.prototype.parseAtom = function () {
    var t = this.eat();
    if (!t) throw new Error('parse error: unexpected end');
    if (t.type === 'num') return { kind: 'num', value: t.value };
    if (t.type === 'op' && t.value === '(') {
      var e = this.parseExpr();
      this.expect(')');
      return e;
    }
    if (t.type === 'ident') {
      var name = t.value;
      if (this.peek() && this.peek().value === '(') {
        if (!FUNCS[name]) throw new Error('parse error: unknown function ' + name);
        this.eat();
        var arg = this.parseExpr();
        this.expect(')');
        return { kind: 'call', name: name, arg: arg };
      }
      if (CONSTS.hasOwnProperty(name)) return { kind: 'num', value: CONSTS[name] };
      throw new Error('parse error: unknown identifier ' + name);
    }
    throw new Error('parse error: unexpected token ' + t.value);
  };

  function parse(tokens) {
    var p = new Parser(tokens);
    var ast = p.parseExpr();
    if (p.pos !== tokens.length) throw new Error('parse error: trailing input');
    return ast;
  }

  function toRad(x, mode) { return mode === 'DEG' ? x * Math.PI / 180 : x; }
  function fromRad(x, mode) { return mode === 'DEG' ? x * 180 / Math.PI : x; }

  function evalAst(node, mode) {
    if (node.kind === 'num') return node.value;
    if (node.kind === 'unary') {
      var v = evalAst(node.arg, mode);
      return node.op === '-' ? -v : v;
    }
    if (node.kind === 'bin') {
      var l = evalAst(node.left, mode);
      var r = evalAst(node.right, mode);
      if (node.op === '+') return l + r;
      if (node.op === '-') return l - r;
      if (node.op === '*') return l * r;
      if (node.op === '/') {
        if (r === 0) throw new Error('divide by zero');
        return l / r;
      }
      if (node.op === '^') return Math.pow(l, r);
    }
    if (node.kind === 'call') {
      var x = evalAst(node.arg, mode);
      switch (node.name) {
        case 'sin': return Math.sin(toRad(x, mode));
        case 'cos': return Math.cos(toRad(x, mode));
        case 'tan': return Math.tan(toRad(x, mode));
        case 'asin':
          if (x < -1 || x > 1) throw new Error('domain error');
          return fromRad(Math.asin(x), mode);
        case 'acos':
          if (x < -1 || x > 1) throw new Error('domain error');
          return fromRad(Math.acos(x), mode);
        case 'atan': return fromRad(Math.atan(x), mode);
        case 'log':
          if (x <= 0) throw new Error('domain error');
          return Math.log10(x);
        case 'ln':
          if (x <= 0) throw new Error('domain error');
          return Math.log(x);
        case 'exp': return Math.exp(x);
        case 'sqrt':
          if (x < 0) throw new Error('domain error');
          return Math.sqrt(x);
      }
    }
    throw new Error('parse error: bad node');
  }

  function evaluate(src, mode) {
    try {
      var tokens = tokenize(String(src));
      if (tokens.length === 0) return { ok: false, error: 'parse error: empty' };
      var ast = parse(tokens);
      var v = evalAst(ast, mode || 'RAD');
      if (!isFinite(v)) return { ok: false, error: 'domain error' };
      return { ok: true, value: v };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  return {
    tokenize: tokenize,
    parse: parse,
    evalAst: evalAst,
    evaluate: evaluate
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = Engine;
