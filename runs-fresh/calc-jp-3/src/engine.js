// engine.js — 純粋関数の評価エンジン（IIFE グローバル）
// 公開 API: window.Calc.engine = { evaluate, tokenize, parse, evalAst }
(function (root) {
  "use strict";

  var FUNCS = {
    sin: 1, cos: 1, tan: 1, asin: 1, acos: 1, atan: 1,
    log10: 1, ln: 1, exp: 1, sqrt: 1, sq: 1, pow: 2,
  };
  var TRIG_FWD = { sin: 1, cos: 1, tan: 1 };
  var TRIG_INV = { asin: 1, acos: 1, atan: 1 };
  var CONSTS = { pi: Math.PI, e: Math.E };

  function tokenize(src) {
    // 入力文字列をトークン列に分解する。空白は無視。
    var tokens = [];
    var i = 0;
    var s = String(src);
    while (i < s.length) {
      var c = s[i];
      if (c === " " || c === "\t") { i++; continue; }
      if ((c >= "0" && c <= "9") || c === ".") {
        var j = i;
        while (j < s.length && ((s[j] >= "0" && s[j] <= "9") || s[j] === ".")) j++;
        tokens.push({ t: "num", v: parseFloat(s.slice(i, j)) });
        i = j; continue;
      }
      if ((c >= "a" && c <= "z") || (c >= "A" && c <= "Z")) {
        var k = i;
        while (k < s.length && ((s[k] >= "a" && s[k] <= "z") || (s[k] >= "A" && s[k] <= "Z") || (s[k] >= "0" && s[k] <= "9"))) k++;
        tokens.push({ t: "ident", v: s.slice(i, k).toLowerCase() });
        i = k; continue;
      }
      if ("+-*/^(),".indexOf(c) >= 0) { tokens.push({ t: "op", v: c }); i++; continue; }
      throw new Error("syntax");
    }
    return tokens;
  }

  function parse(tokens) {
    // 再帰下降パーサ。式 → 項 → 因子 → 単項 → 呼び出し → 原子 の順。
    var p = 0;
    function peek() { return tokens[p]; }
    function eat(t, v) {
      var tk = tokens[p];
      if (!tk) throw new Error("syntax");
      if (tk.t !== t) throw new Error("syntax");
      if (v !== undefined && tk.v !== v) throw new Error("syntax");
      p++; return tk;
    }
    function expr() {
      var left = term();
      while (peek() && peek().t === "op" && (peek().v === "+" || peek().v === "-")) {
        var op = eat("op").v;
        left = { type: "bin", op: op, a: left, b: term() };
      }
      return left;
    }
    function term() {
      var left = factor();
      while (peek() && peek().t === "op" && (peek().v === "*" || peek().v === "/")) {
        var op = eat("op").v;
        left = { type: "bin", op: op, a: left, b: factor() };
      }
      return left;
    }
    function factor() {
      var base = unary();
      if (peek() && peek().t === "op" && peek().v === "^") {
        eat("op"); base = { type: "bin", op: "^", a: base, b: factor() };
      }
      return base;
    }
    function unary() {
      if (peek() && peek().t === "op" && peek().v === "-") {
        eat("op"); return { type: "neg", x: unary() };
      }
      return call();
    }
    function call() {
      var tk = peek();
      if (tk && tk.t === "ident" && tokens[p + 1] && tokens[p + 1].t === "op" && tokens[p + 1].v === "(") {
        var name = eat("ident").v;
        eat("op", "(");
        var args = [expr()];
        while (peek() && peek().t === "op" && peek().v === ",") { eat("op"); args.push(expr()); }
        eat("op", ")");
        return { type: "call", name: name, args: args };
      }
      return atom();
    }
    function atom() {
      var tk = peek();
      if (!tk) throw new Error("syntax");
      if (tk.t === "num") { p++; return { type: "num", v: tk.v }; }
      if (tk.t === "ident") { p++; return { type: "ident", v: tk.v }; }
      if (tk.t === "op" && tk.v === "(") {
        eat("op", "("); var e = expr(); eat("op", ")"); return e;
      }
      throw new Error("syntax");
    }
    var ast = expr();
    if (p !== tokens.length) throw new Error("syntax");
    return ast;
  }

  function toRad(x, mode) { return mode === "DEG" ? x * Math.PI / 180 : x; }
  function fromRad(x, mode) { return mode === "DEG" ? x * 180 / Math.PI : x; }

  function evalAst(node, mode) {
    // AST を評価。例外で domain / div0 / syntax を伝搬。
    if (node.type === "num") return node.v;
    if (node.type === "ident") {
      if (Object.prototype.hasOwnProperty.call(CONSTS, node.v)) return CONSTS[node.v];
      throw new Error("syntax");
    }
    if (node.type === "neg") return -evalAst(node.x, mode);
    if (node.type === "bin") {
      var a = evalAst(node.a, mode), b = evalAst(node.b, mode);
      if (node.op === "+") return a + b;
      if (node.op === "-") return a - b;
      if (node.op === "*") return a * b;
      if (node.op === "/") { if (b === 0) throw new Error("div0"); return a / b; }
      if (node.op === "^") return Math.pow(a, b);
    }
    if (node.type === "call") {
      var name = node.name;
      if (!Object.prototype.hasOwnProperty.call(FUNCS, name)) throw new Error("syntax");
      if (node.args.length !== FUNCS[name]) throw new Error("syntax");
      var x = evalAst(node.args[0], mode);
      if (TRIG_FWD[name]) return Math[name](toRad(x, mode));
      if (TRIG_INV[name]) {
        if ((name === "asin" || name === "acos") && (x < -1 || x > 1)) throw new Error("domain");
        return fromRad(Math[name](x), mode);
      }
      if (name === "log10") { if (x <= 0) throw new Error("domain"); return Math.log10(x); }
      if (name === "ln") { if (x <= 0) throw new Error("domain"); return Math.log(x); }
      if (name === "exp") return Math.exp(x);
      if (name === "sqrt") { if (x < 0) throw new Error("domain"); return Math.sqrt(x); }
      if (name === "sq") return x * x;
      if (name === "pow") return Math.pow(x, evalAst(node.args[1], mode));
    }
    throw new Error("syntax");
  }

  function evaluate(src, mode) {
    // 公開窓口。失敗時は Error オブジェクトを返す（throw しない）。
    try { return evalAst(parse(tokenize(src)), mode || "DEG"); }
    catch (err) { return err instanceof Error ? err : new Error("syntax"); }
  }

  root.Calc = root.Calc || {};
  root.Calc.engine = { evaluate: evaluate, tokenize: tokenize, parse: parse, evalAst: evalAst };
})(typeof window !== "undefined" ? window : globalThis);
