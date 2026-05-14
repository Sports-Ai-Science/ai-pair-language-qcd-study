# 03 — Design

## File Layout

```
src/
  index.html    # markup, button grid, loads scripts
  styles.css    # layout, theme, responsive grid
  engine.js    # IIFE -> global Engine
  state.js    # IIFE -> global Store
  ui.js        # IIFE -> global UI, wires DOM + Store + Engine
```

## Global APIs

### `Engine` (pure)
- `Engine.evaluate(expression, angleMode)` -> `{ ok: true, value: number }`
  or `{ ok: false, error: string }`.
- `Engine.tokenize(str)` -> array of tokens.
- `Engine.parse(tokens)` -> AST.
- `Engine.evalAst(ast, angleMode)` -> number.
- Supported tokens: numbers, `+ - * / ^`, `(`, `)`, `,`, identifiers
  (`sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `log`, `ln`, `exp`,
  `sqrt`, `pi`, `e`).
- `x^2` is composed as `x^2` in the input string.
- Errors: `divide by zero`, `domain error`, `parse error`.

### `Store` (state)
- Fields: `display` (string), `history` (array<{expr, value}>, cap 10),
  `memory` (number), `angleMode` ("DEG" | "RAD"), `lastError` (string|null).
- Mutators: `append(token)`, `clear()`, `backspace()`, `equals()`,
  `memAdd()`, `memSub()`, `memRecall()`, `memClear()`, `toggleAngle()`,
  `subscribe(fn)` for change notification.

### `UI`
- `UI.mount(rootEl)` builds the button grid and binds events.
- Listens to `Store.subscribe` and re-renders display, history, mode badge.
- Keyboard: digits, `. + - * / ( ) ^`, `Enter` = `=`, `Backspace`,
  `Escape` = clear.

## Button Grid (5 columns x 7 rows)

```
[ MC ] [ MR ] [ M+ ] [ M- ] [DEG/RAD]
[ sin] [ cos] [ tan] [ ln ] [ log ]
[asin] [acos] [atan] [ exp] [ sqrt]
[ pi ] [ e  ] [ ^  ] [ x^2] [  /  ]
[ 7  ] [ 8  ] [ 9  ] [ (  ] [  *  ]
[ 4  ] [ 5  ] [ 6  ] [ )  ] [  -  ]
[ 1  ] [ 2  ] [ 3  ] [ .  ] [  +  ]
[ 0  ] [ C  ] [ <- ] [   = (spans 2)   ]
```

## Algorithm Sketch

Recursive-descent parser:
```
expr   := term ((+|-) term)*
term   := power ((*|/) power)*
power  := unary (^ unary)*    # right-assoc
unary  := (+|-) unary | call
call   := IDENT ( '(' expr ')' )? | NUMBER | '(' expr ')'
```
`x^2` button inserts `^2` after current expression. Implicit multiplication is
not supported; the user types the operator.

## Error Strategy
- Engine returns a discriminated result.
- Store stores `lastError` and freezes display until next clear/backspace.
- UI renders error text in red.
