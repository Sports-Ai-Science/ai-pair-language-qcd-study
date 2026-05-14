# Phase 3: 詳細設計 (SRS)

ID: 6b3f7a9c

## 1. 序論

### 1.1 目的

ローカル動作の関数電卓を、`src/` 配下 5 ファイル以内・合計約 510 LOC 以内で実装する
ための詳細仕様を定義する。

### 1.2 範囲

In: 四則・三角・対数・指数・定数・モード切替・メモリ・履歴・キーボード入力・エラー処理。
Out: グラフ、複素数、行列、永続化、多言語 UI、フレームワーク。

### 1.3 用語

- **DEG/RAD**: 三角関数の角度モード（度 / ラジアン）
- **メモリ**: M+, M-, MR, MC で操作される単一の数値スロット
- **履歴**: 直近 10 件の `式 = 結果` 文字列キュー

## 2. 機能要件 (FR)

### FR-001: 四則演算 (AC-01, P0)

- 説明: `+`, `-`, `*`, `/`（UI ラベルは `+ - x ÷`）の 2 項演算を評価する。
- 受入: `engine.evaluate("1+2", "DEG")` → `3`、優先順位 `*//` > `+/-` を遵守。
- 演算子優先順位: `^` > 単項 `-` > `* /` > `+ -`。

### FR-002: 三角関数 (AC-02, P0)

- 説明: `sin, cos, tan, asin, acos, atan` を関数呼び出し形式で受理。
- DEG モード時は度→ラジアン変換、RAD モード時はそのまま `Math.*` を呼ぶ。
- 逆関数の戻り値は現モードの単位で返す。
- 定義域外（`asin(2)` 等）は `Error("domain")` を返す。

### FR-003: 対数・指数・冪・平方根 (AC-03, P0)

- `log10(x)`, `ln(x)`, `exp(x)`, `sqrt(x)`, `sq(x)` (= x²), `pow(x,y)` (= x^y)。
- 入力構文（中置）: `x^y` を `pow(x,y)` に内部正規化。
- `log10(0)` / `ln(0)` / `sqrt(-1)` / `log10(-1)` は `Error("domain")`。

### FR-004: 定数 π, e (AC-04, P0)

- トークン `pi` / `e` を `Math.PI` / `Math.E` に展開。
- UI ボタンは `pi` と `e`。

### FR-005: DEG/RAD 切替 (AC-05, P0)

- `state.setMode("DEG"|"RAD")` を提供。デフォルトは `DEG`。
- 三角関数の評価時に現モードが engine に渡される。

### FR-006: メモリ M+/M-/MR/MC (AC-06, P0)

- `state.memory` は数値（初期値 0）。
- `M+`: 直近の評価結果を加算。
- `M-`: 減算。
- `MR`: 入力バッファに `state.memory` を代入。
- `MC`: 0 にクリア。

### FR-007: 履歴 (AC-07, P1)

- `state.history` は最大 10 件の文字列配列。`式 = 結果` 形式。
- 11 件目で先頭を破棄（FIFO）。
- UI は `<ol>` で逆順表示（最新が上）。

### FR-008: キーボード入力 (AC-08, P0)

- `0-9 . + - * / ( )` → そのままトークン化。
- `Enter` / `=` → 評価。
- `Backspace` → バッファ末尾削除。
- `Escape` → AC（全クリア）。
- `^` → 冪。

### FR-009: エラー処理 (AC-09, P0)

- 0 除算: `Error("div0")`。
- 構文エラー: `Error("syntax")`。
- 定義域外: `Error("domain")`。
- UI 表示: `Error: <code>` を赤字で表示し、入力バッファは保持。

### FR-010: ローカル起動 (AC-10, P0)

- `index.html` をブラウザでダブルクリック → 5 秒以内に UI 描画 + 最初の演算成功。
- すべて `<script src="...">` の同期ロードで完結、`import` 不使用。

## 3. API 仕様（モジュール契約）

### 3.1 `Calc.engine`

```js
// 入力: 中置式文字列、モード ("DEG" | "RAD")
// 出力: number  または  Error
Calc.engine.evaluate(expression: string, mode: "DEG"|"RAD"): number | Error

// 内部公開（テスト用）
Calc.engine.tokenize(src: string): Array<Token>
Calc.engine.parse(tokens: Array<Token>): AstNode
Calc.engine.eval(ast: AstNode, mode): number  // throws Error
```

文法（EBNF 簡略）:

```
expr   := term (('+'|'-') term)*
term   := factor (('*'|'/') factor)*
factor := unary ('^' factor)?     # 右結合
unary  := '-' unary | call
call   := IDENT '(' expr (',' expr)* ')' | atom
atom   := NUMBER | IDENT | '(' expr ')'
```

### 3.2 `Calc.state`

```js
Calc.state.create(): StateInstance
// StateInstance
//   buffer: string         入力中の式
//   mode:   "DEG"|"RAD"
//   memory: number
//   lastResult: number|null
//   history: string[]      max 10
//   error:  string|null    最後のエラー code
//
//   apply(token: string): void   // 数字/演算子/関数名/制御コマンド
//   evaluate(): void             // buffer を engine に渡し結果を反映
//   setMode(mode): void
//   memAdd() / memSub() / memRecall() / memClear(): void
//   clearAll() / backspace(): void
//   snapshot(): { buffer, display, mode, memory, history, error }
```

### 3.3 `Calc.ui`

```js
Calc.ui.mount(rootEl: HTMLElement, state: StateInstance): void
// - キーパッドのクリックを state.apply にディスパッチ
// - keydown を全画面捕捉して state にディスパッチ
// - state 変更後に display と history を render
```

## 4. UI レイアウト

```
┌──────────────────────────────────────┐
│ [ DEG | RAD ]            M: 0        │  ← header
├──────────────────────────────────────┤
│                          1+2*3       │  ← input buffer
│                              7       │  ← display result
├──────────────────────────────────────┤
│  sin  cos  tan   pi    e    AC       │
│  asin acos atan  log   ln   ←        │
│  sqrt  ^   x²    exp   (    )        │
│   7    8    9    ÷    M+   MR        │
│   4    5    6    x    M-   MC        │
│   1    2    3    -                   │
│   0    .    =    +                   │
├──────────────────────────────────────┤
│ History (max 10, latest top)         │
│  1. 1+2*3 = 7                        │
└──────────────────────────────────────┘
```

UI ラベルはすべて英語固定（`AC`, `DEG`, `RAD`, `History`, etc.）。

## 5. テスト戦略

| 層 | ファイル | 対象 |
| --- | --- | --- |
| Unit | `tests/engine.test.mjs` | tokenize/parse/eval、AC-01〜05, 09 |
| Unit | `tests/state.test.mjs` | バッファ操作、メモリ、モード切替（AC-05, 06）|
| Integration | `tests/integration.test.mjs` | state ↔ engine の連携、履歴 10 件 FIFO（AC-07）|
| System | `tests/system.spec.mjs` | DOM 構造シミュレーションでキーボード入力 → 表示確認（AC-08, 10）|

すべて Node.js `node --test` で実行。`tests/_load.mjs` は `src/*.js` を
`vm` で評価して `Calc.*` を返す共通ローダ。

## 6. リスクと軽減

| リスク | 影響 | 軽減 |
| --- | --- | --- |
| `eval()` を使ってしまう | XSS / 任意コード実行 | tokenize + 再帰下降パーサで明示的に禁止 |
| 浮動小数誤差 | 三角関数の比較失敗 | テストで `Math.abs(diff) < 1e-9` 許容 |
| キーボードと UI ボタンの経路差 | ロジック重複 | 共通の `state.apply(token)` に集約 |
| `file://` で `import` 試行 | CORS エラー | classic `<script>` のみ、テストで構文チェック |

## 7. KPT (Phase 3)

- **Keep**: モジュール契約（公開 API シグネチャ）と AC を 1 対 1 で対応付け。
- **Problem**: パーサを手書きするため、エッジケース（連続単項、暗黙乗算）を
  Phase 5 のユニットテストで重点的に潰す必要あり。
- **Try**: tokenize → parse → eval の 3 段に分け、各段に独立テストを書く。
