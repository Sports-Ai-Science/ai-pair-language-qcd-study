// Pure expression evaluator. Tokenize -> shunting-yard -> RPN evaluation.
// Loaded as a classic script (file:// compatible). Exposes globalThis.CalcEngine.
// Tests load this file via vm.runInNewContext.

(function (root) {
  const FUNCS = new Set([
    "sin", "cos", "tan", "asin", "acos", "atan",
    "log10", "ln", "exp", "sqrt",
  ]);
  const RIGHT_ASSOC = new Set(["^"]);
  const PRECEDENCE = { "+": 2, "-": 2, "*": 3, "/": 3, "^": 4, "neg": 5 };

  function tokenize(input) {
    const tokens = [];
    let i = 0;
    while (i < input.length) {
      const c = input[i];
      if (c === " " || c === "\t") { i++; continue; }
      if (c >= "0" && c <= "9" || c === ".") {
        let j = i;
        while (j < input.length && /[0-9.eE+\-]/.test(input[j])) {
          if ((input[j] === "+" || input[j] === "-") &&
              !(input[j - 1] === "e" || input[j - 1] === "E")) break;
          j++;
        }
        const num = Number(input.slice(i, j));
        if (Number.isNaN(num)) throw new Error("parse");
        tokens.push({ type: "num", value: num });
        i = j;
        continue;
      }
      if (/[a-z]/i.test(c)) {
        let j = i;
        while (j < input.length && /[a-z0-9]/i.test(input[j])) j++;
        const ident = input.slice(i, j).toLowerCase();
        if (ident === "pi") tokens.push({ type: "num", value: Math.PI });
        else if (ident === "e") tokens.push({ type: "num", value: Math.E });
        else if (FUNCS.has(ident)) tokens.push({ type: "func", value: ident });
        else throw new Error("parse");
        i = j;
        continue;
      }
      if ("+-*/^()".includes(c)) {
        tokens.push({ type: "op", value: c });
        i++;
        continue;
      }
      throw new Error("parse");
    }
    return tokens;
  }

  function toRPN(tokens) {
    const out = [];
    const stack = [];
    let prev = null;
    for (const t of tokens) {
      if (t.type === "num") {
        out.push(t);
      } else if (t.type === "func") {
        stack.push(t);
      } else if (t.type === "op") {
        if (t.value === "(") { stack.push(t); }
        else if (t.value === ")") {
          while (stack.length && stack[stack.length - 1].value !== "(") out.push(stack.pop());
          if (!stack.length) throw new Error("parse");
          stack.pop();
          if (stack.length && stack[stack.length - 1].type === "func") out.push(stack.pop());
        } else {
          const isUnary =
            (t.value === "-" || t.value === "+") &&
            (prev === null || (prev.type === "op" && prev.value !== ")"));
          const opName = isUnary && t.value === "-" ? "neg" : t.value;
          if (isUnary && t.value === "+") { prev = t; continue; }
          const op = { type: "op", value: opName };
          while (stack.length) {
            const top = stack[stack.length - 1];
            if (top.type === "func") { out.push(stack.pop()); continue; }
            if (top.type !== "op" || top.value === "(") break;
            const a = PRECEDENCE[op.value];
            const b = PRECEDENCE[top.value];
            if (b > a || (b === a && !RIGHT_ASSOC.has(op.value))) out.push(stack.pop());
            else break;
          }
          stack.push(op);
        }
      }
      prev = t;
    }
    while (stack.length) {
      const top = stack.pop();
      if (top.type === "op" && top.value === "(") throw new Error("parse");
      out.push(top);
    }
    return out;
  }

  function applyFunc(name, x, mode) {
    const angle = (a) => (mode === "DEG" ? (a * Math.PI) / 180 : a);
    const inv = (a) => (mode === "DEG" ? (a * 180) / Math.PI : a);
    switch (name) {
      case "sin": return Math.sin(angle(x));
      case "cos": return Math.cos(angle(x));
      case "tan": return Math.tan(angle(x));
      case "asin":
        if (x < -1 || x > 1) throw new Error("asin domain");
        return inv(Math.asin(x));
      case "acos":
        if (x < -1 || x > 1) throw new Error("acos domain");
        return inv(Math.acos(x));
      case "atan": return inv(Math.atan(x));
      case "log10":
        if (x <= 0) throw new Error("log domain");
        return Math.log10(x);
      case "ln":
        if (x <= 0) throw new Error("log domain");
        return Math.log(x);
      case "exp": return Math.exp(x);
      case "sqrt":
        if (x < 0) throw new Error("sqrt domain");
        return Math.sqrt(x);
    }
    throw new Error("parse");
  }

  function evalRPN(rpn, mode) {
    const stack = [];
    for (const t of rpn) {
      if (t.type === "num") { stack.push(t.value); continue; }
      if (t.type === "func") {
        if (!stack.length) throw new Error("parse");
        stack.push(applyFunc(t.value, stack.pop(), mode));
        continue;
      }
      if (t.type === "op") {
        if (t.value === "neg") {
          if (!stack.length) throw new Error("parse");
          stack.push(-stack.pop());
          continue;
        }
        if (stack.length < 2) throw new Error("parse");
        const b = stack.pop();
        const a = stack.pop();
        let r;
        switch (t.value) {
          case "+": r = a + b; break;
          case "-": r = a - b; break;
          case "*": r = a * b; break;
          case "/":
            if (b === 0) throw new Error("division by zero");
            r = a / b; break;
          case "^": r = Math.pow(a, b); break;
          default: throw new Error("parse");
        }
        stack.push(r);
      }
    }
    if (stack.length !== 1) throw new Error("parse");
    return stack[0];
  }

  function evaluate(expression, mode) {
    if (mode === undefined) mode = "RAD";
    if (typeof expression !== "string" || expression.trim() === "") {
      return { ok: false, error: "Error: parse" };
    }
    try {
      const value = evalRPN(toRPN(tokenize(expression)), mode);
      if (!Number.isFinite(value)) return { ok: false, error: "Error: overflow" };
      return { ok: true, value };
    } catch (e) {
      const msg = e.message || "parse";
      if (msg.indexOf("division") >= 0) return { ok: false, error: "Error: division by zero" };
      if (msg.indexOf("log domain") >= 0) return { ok: false, error: "Error: log domain" };
      if (msg.indexOf("sqrt domain") >= 0) return { ok: false, error: "Error: sqrt domain" };
      if (msg.indexOf("asin domain") >= 0 || msg.indexOf("acos domain") >= 0) {
        return { ok: false, error: "Error: domain" };
      }
      return { ok: false, error: "Error: parse" };
    }
  }

  function formatNumber(value) {
    if (!Number.isFinite(value)) return "Infinity";
    if (Number.isInteger(value) && Math.abs(value) < 1e15) return String(value);
    const s = value.toPrecision(12);
    return s.indexOf(".") >= 0 ? s.replace(/0+$/, "").replace(/\.$/, "") : s;
  }

  root.CalcEngine = { evaluate: evaluate, formatNumber: formatNumber };
})(typeof globalThis !== "undefined" ? globalThis : this);
