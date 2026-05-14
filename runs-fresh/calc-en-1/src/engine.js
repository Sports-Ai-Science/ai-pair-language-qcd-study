// engine.js — pure scientific calculator engine.
// Exposes globalThis.CalcEngine. No DOM access, no side effects.
// Uses a hand-written recursive-descent parser to avoid eval().

(function () {
  "use strict";

  var PI = Math.PI;
  var E = Math.E;
  var TAN_SINGULARITY = 1e-12;

  function ok(v) { return { ok: true, value: v }; }
  function err(m) { return { ok: false, error: m }; }

  // Convert angle from the user's mode into radians.
  function toRad(x, mode) { return mode === "DEG" ? x * PI / 180 : x; }
  // Convert a radian result back into the user's mode.
  function fromRad(x, mode) { return mode === "DEG" ? x * 180 / PI : x; }

  function applyUnary(name, x, opts) {
    var mode = (opts && opts.angleMode) || "RAD";
    if (!isFinite(x)) return err("Math error");
    switch (name) {
      case "sin": return ok(Math.sin(toRad(x, mode)));
      case "cos": return ok(Math.cos(toRad(x, mode)));
      case "tan": {
        var rad = toRad(x, mode);
        if (Math.abs(Math.cos(rad)) < TAN_SINGULARITY) return err("Domain error");
        return ok(Math.tan(rad));
      }
      case "asin":
        if (x < -1 || x > 1) return err("Domain error");
        return ok(fromRad(Math.asin(x), mode));
      case "acos":
        if (x < -1 || x > 1) return err("Domain error");
        return ok(fromRad(Math.acos(x), mode));
      case "atan":
        return ok(fromRad(Math.atan(x), mode));
      case "log":
      case "log10":
        if (x <= 0) return err("Domain error");
        return ok(Math.log10(x));
      case "ln":
        if (x <= 0) return err("Domain error");
        return ok(Math.log(x));
      case "exp":
        return ok(Math.exp(x));
      case "sqrt":
        if (x < 0) return err("Domain error");
        return ok(Math.sqrt(x));
      case "sq":
        return ok(x * x);
      default:
        return err("Unknown function");
    }
  }

  // Tokenizer: splits the input into number / ident / op / paren tokens.
  function tokenize(src) {
    var tokens = [];
    var i = 0;
    var n = src.length;
    while (i < n) {
      var c = src[i];
      if (c === " " || c === "\t") { i++; continue; }
      if ((c >= "0" && c <= "9") || c === ".") {
        var start = i;
        while (i < n && ((src[i] >= "0" && src[i] <= "9") || src[i] === ".")) i++;
        if (i < n && (src[i] === "e" || src[i] === "E")) {
          // Distinguish scientific exponent from the constant `e`.
          var save = i;
          i++;
          if (i < n && (src[i] === "+" || src[i] === "-")) i++;
          if (i < n && src[i] >= "0" && src[i] <= "9") {
            while (i < n && src[i] >= "0" && src[i] <= "9") i++;
          } else {
            // Not a valid exponent; rewind so `e` becomes its own token.
            i = save;
          }
        }
        tokens.push({ type: "num", value: parseFloat(src.slice(start, i)) });
        continue;
      }
      if ((c >= "a" && c <= "z") || (c >= "A" && c <= "Z")) {
        var s = i;
        while (i < n && ((src[i] >= "a" && src[i] <= "z") || (src[i] >= "A" && src[i] <= "Z"))) i++;
        tokens.push({ type: "ident", value: src.slice(s, i).toLowerCase() });
        continue;
      }
      if ("+-*/^()".indexOf(c) >= 0) { tokens.push({ type: "op", value: c }); i++; continue; }
      throw new Error("Unexpected character: " + c);
    }
    return tokens;
  }

  // Recursive-descent parser. Throws on malformed input; caller wraps errors.
  function parse(tokens, mode) {
    var pos = 0;
    function peek() { return tokens[pos]; }
    function eat(type, value) {
      var t = tokens[pos];
      if (!t || t.type !== type || (value !== undefined && t.value !== value)) {
        throw new Error("Parse error");
      }
      pos++;
      return t;
    }

    function parseExpr() {
      var left = parseTerm();
      while (peek() && peek().type === "op" && (peek().value === "+" || peek().value === "-")) {
        var op = eat("op").value;
        var right = parseTerm();
        left = op === "+" ? left + right : left - right;
      }
      return left;
    }
    function parseTerm() {
      var left = parsePower();
      while (peek() && peek().type === "op" && (peek().value === "*" || peek().value === "/")) {
        var op = eat("op").value;
        var right = parsePower();
        if (op === "*") left = left * right;
        else { if (right === 0) throw new Error("Division by zero"); left = left / right; }
      }
      return left;
    }
    function parsePower() {
      var base = parseUnary();
      if (peek() && peek().type === "op" && peek().value === "^") {
        eat("op");
        var exp = parsePower(); // right-associative
        return Math.pow(base, exp);
      }
      return base;
    }
    function parseUnary() {
      if (peek() && peek().type === "op" && (peek().value === "+" || peek().value === "-")) {
        var op = eat("op").value;
        var v = parseUnary();
        return op === "-" ? -v : v;
      }
      return parsePrimary();
    }
    function parsePrimary() {
      var t = peek();
      if (!t) throw new Error("Parse error");
      if (t.type === "num") { eat("num"); return t.value; }
      if (t.type === "op" && t.value === "(") {
        eat("op", "(");
        var v = parseExpr();
        eat("op", ")");
        return v;
      }
      if (t.type === "ident") {
        eat("ident");
        if (t.value === "pi") return PI;
        if (t.value === "e") return E;
        // Function call: name '(' expr ')'
        eat("op", "(");
        var arg = parseExpr();
        eat("op", ")");
        var r = applyUnary(t.value, arg, { angleMode: mode });
        if (!r.ok) throw new Error(r.error);
        return r.value;
      }
      throw new Error("Parse error");
    }

    var value = parseExpr();
    if (pos !== tokens.length) throw new Error("Parse error");
    return value;
  }

  function evaluate(expr, opts) {
    var mode = (opts && opts.angleMode) || "RAD";
    if (typeof expr !== "string" || expr.trim() === "") return err("Empty");
    try {
      var tokens = tokenize(expr);
      var v = parse(tokens, mode);
      if (!isFinite(v)) return err("Math error");
      return ok(v);
    } catch (e) {
      return err(e.message || "Error");
    }
  }

  function format(value) {
    if (!isFinite(value)) return "Error";
    if (Math.abs(value) < 1e-9) return "0";
    var s = value.toPrecision(12);
    if (s.indexOf(".") >= 0 && s.indexOf("e") < 0) {
      s = s.replace(/0+$/, "").replace(/\.$/, "");
    }
    return s;
  }

  globalThis.CalcEngine = {
    evaluate: evaluate,
    applyUnary: applyUnary,
    constants: { PI: PI, E: E },
    format: format
  };
})();
