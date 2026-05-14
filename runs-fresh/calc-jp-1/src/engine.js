// engine.js — 純粋計算エンジン
// 字句解析 + Shunting-yard で式を評価する。DOM 非依存。
// IIFE でグローバル CalcEngine を公開する（ES module を file:// で使えないため）。
(function (root) {
  "use strict";

  // 定数（IEEE 754 倍精度）
  var PI = Math.PI;
  var E = Math.E;

  // 単項関数テーブル。引数 1 つを取り、必要なら角度モードで度→ラジアン変換する
  function makeFns(mode) {
    var deg = mode === "DEG";
    var toRad = function (x) { return deg ? (x * PI) / 180 : x; };
    var fromRad = function (x) { return deg ? (x * 180) / PI : x; };
    return {
      sin: function (x) { return Math.sin(toRad(x)); },
      cos: function (x) { return Math.cos(toRad(x)); },
      tan: function (x) { return Math.tan(toRad(x)); },
      asin: function (x) {
        if (x < -1 || x > 1) throw new Error("Math error");
        return fromRad(Math.asin(x));
      },
      acos: function (x) {
        if (x < -1 || x > 1) throw new Error("Math error");
        return fromRad(Math.acos(x));
      },
      atan: function (x) { return fromRad(Math.atan(x)); },
      log: function (x) {
        if (x <= 0) throw new Error("Math error");
        return Math.log10(x);
      },
      ln: function (x) {
        if (x <= 0) throw new Error("Math error");
        return Math.log(x);
      },
      exp: function (x) { return Math.exp(x); },
      sqrt: function (x) {
        if (x < 0) throw new Error("Math error");
        return Math.sqrt(x);
      },
      sq: function (x) { return x * x; }
    };
  }

  // 二項演算子の優先度・結合性
  var OPS = {
    "+": { p: 1, r: false },
    "-": { p: 1, r: false },
    "*": { p: 2, r: false },
    "/": { p: 2, r: false },
    "u-": { p: 3, r: true },
    "^": { p: 4, r: true }
  };

  // 字句解析: 数値・識別子・演算子・括弧・カンマに分解する
  function tokenize(src) {
    var i = 0, out = [];
    while (i < src.length) {
      var c = src[i];
      if (c === " " || c === "\t") { i++; continue; }
      if ((c >= "0" && c <= "9") || c === ".") {
        var j = i;
        while (j < src.length && ((src[j] >= "0" && src[j] <= "9") || src[j] === ".")) j++;
        out.push({ t: "num", v: parseFloat(src.slice(i, j)) });
        i = j; continue;
      }
      if ((c >= "a" && c <= "z") || (c >= "A" && c <= "Z")) {
        var k = i;
        while (k < src.length && ((src[k] >= "a" && src[k] <= "z") || (src[k] >= "A" && src[k] <= "Z"))) k++;
        out.push({ t: "id", v: src.slice(i, k) });
        i = k; continue;
      }
      if ("+-*/^(),".indexOf(c) >= 0) {
        out.push({ t: c });
        i++; continue;
      }
      throw new Error("Math error");
    }
    return out;
  }

  // Shunting-yard 法でトークン列を逆ポーランド記法に変換する
  function toRpn(tokens) {
    var out = [], stack = [], prev = null;
    for (var i = 0; i < tokens.length; i++) {
      var tk = tokens[i];
      if (tk.t === "num") {
        out.push(tk);
      } else if (tk.t === "id") {
        // 関数（次が `(`）か定数かを判別する
        var next = tokens[i + 1];
        if (next && next.t === "(") {
          stack.push({ t: "fn", v: tk.v });
        } else {
          var name = tk.v.toUpperCase();
          if (name === "PI") out.push({ t: "num", v: PI });
          else if (name === "E") out.push({ t: "num", v: E });
          else throw new Error("Math error");
        }
      } else if (tk.t === "+" || tk.t === "-" || tk.t === "*" || tk.t === "/" || tk.t === "^") {
        // 単項マイナスは式先頭か直前が演算子/開括弧/カンマのとき
        var op = tk.t;
        if (op === "-" && (prev === null || prev.t === "+" || prev.t === "-" || prev.t === "*" || prev.t === "/" || prev.t === "^" || prev.t === "(" || prev.t === ",")) {
          op = "u-";
        }
        while (stack.length) {
          var top = stack[stack.length - 1];
          if (top.t === "fn") { out.push(stack.pop()); continue; }
          if (!OPS[top.t]) break;
          var pTop = OPS[top.t].p;
          var pCur = OPS[op].p;
          if (pTop > pCur || (pTop === pCur && !OPS[op].r)) {
            out.push(stack.pop());
          } else break;
        }
        stack.push({ t: op });
      } else if (tk.t === "(") {
        stack.push(tk);
      } else if (tk.t === ")") {
        while (stack.length && stack[stack.length - 1].t !== "(") {
          out.push(stack.pop());
        }
        if (!stack.length) throw new Error("Math error");
        stack.pop();
        if (stack.length && stack[stack.length - 1].t === "fn") out.push(stack.pop());
      } else {
        throw new Error("Math error");
      }
      prev = tk;
    }
    while (stack.length) {
      var s = stack.pop();
      if (s.t === "(" || s.t === ")") throw new Error("Math error");
      out.push(s);
    }
    return out;
  }

  // RPN を評価する。スタックに数値を積み、演算子で取り出して結果を戻す
  function evalRpn(rpn, fns) {
    var s = [];
    for (var i = 0; i < rpn.length; i++) {
      var tk = rpn[i];
      if (tk.t === "num") {
        s.push(tk.v);
      } else if (tk.t === "u-") {
        if (s.length < 1) throw new Error("Math error");
        s.push(-s.pop());
      } else if (tk.t === "fn") {
        if (s.length < 1) throw new Error("Math error");
        var fn = fns[tk.v];
        if (!fn) throw new Error("Math error");
        s.push(fn(s.pop()));
      } else if (OPS[tk.t]) {
        if (s.length < 2) throw new Error("Math error");
        var b = s.pop(), a = s.pop();
        if (tk.t === "+") s.push(a + b);
        else if (tk.t === "-") s.push(a - b);
        else if (tk.t === "*") s.push(a * b);
        else if (tk.t === "/") {
          // ゼロ除算は AC-09 によりエラー扱い
          if (b === 0) throw new Error("Math error");
          s.push(a / b);
        } else if (tk.t === "^") s.push(Math.pow(a, b));
      }
    }
    if (s.length !== 1) throw new Error("Math error");
    var r = s[0];
    if (!isFinite(r) || isNaN(r)) throw new Error("Math error");
    return r;
  }

  function evaluate(expr, mode) {
    if (typeof expr !== "string" || expr.length === 0) throw new Error("Math error");
    var tokens = tokenize(expr);
    var rpn = toRpn(tokens);
    var fns = makeFns(mode === "DEG" ? "DEG" : "RAD");
    return evalRpn(rpn, fns);
  }

  root.CalcEngine = { evaluate: evaluate, PI: PI, E: E };
})(typeof globalThis !== "undefined" ? globalThis : this);
