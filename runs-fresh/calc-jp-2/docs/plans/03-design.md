# 03 詳細設計

## モジュール API

### engine.js (CalcEngine — 純粋関数群)

```js
CalcEngine.tokenize(expr: string): Token[]
CalcEngine.toRpn(tokens: Token[]): Token[]   // Shunting-yard
CalcEngine.evalRpn(rpn: Token[], angleMode: 'DEG'|'RAD'): number
CalcEngine.evaluate(expr: string, angleMode: 'DEG'|'RAD'): number
CalcEngine.applyFunction(name: string, x: number, angleMode): number
CalcEngine.constants: { PI, E }
CalcEngine.format(n: number): string   // 表示用フォーマット (12 桁)
```

トークン種別: `num` / `op` / `lparen` / `rparen` / `func`。
演算子優先順位: `+,-` = 1, `*,/` = 2, `^` = 3 (右結合)。
関数: `sin cos tan asin acos atan log ln exp sqrt sq` (sq = x^2)。

### state.js (CalcState — 可変状態)

```js
CalcState.create(): {
  display: '0',
  expr: '',           // 入力中の式
  memory: 0,
  history: [],        // 直近 10 件 (FIFO)
  angleMode: 'DEG',
  lastError: null,
}
CalcState.input(state, token): state    // ボタン押下/キー入力 1 単位
CalcState.equals(state): state          // = 評価
CalcState.clear(state): state
CalcState.memoryPlus(state): state
CalcState.memoryMinus(state): state
CalcState.memoryRecall(state): state
CalcState.memoryClear(state): state
CalcState.toggleAngle(state): state
CalcState.applyUnary(state, fn): state  // sin/cos/sqrt 等を現値に適用
```

すべて純粋関数 (state を受け取り新 state を返す)。イミュータブル方針。

### ui.js (CalcUI)

```js
CalcUI.init(rootDoc: Document): void
// - state を閉包に保持
// - DOM ボタン click を input/equals 等にディスパッチ
// - keydown を window に登録 (0-9, ., +, -, *, /, Enter, Backspace, Escape)
// - 状態変化のたびに #display と #history を再描画
```

## 入力モデル

ユーザは 1 トークンずつボタン or キーボードで入力する。`expr` 文字列に追記し、`=` 押下で `CalcEngine.evaluate(expr, angleMode)` を呼ぶ。関数ボタン (sin, sqrt 等) は「現在表示値に対する単項適用」として `applyUnary` 経路で即時計算する。

## エラー処理

- ゼロ除算: `evalRpn` 内で `Infinity` 検出 → `Error: Div by zero` を throw
- 定義域外 (asin(2) など): NaN 検出 → `Error: Domain` を throw
- パース失敗 (括弧不一致など): `Error: Syntax` を throw
- state は catch して `lastError` を設定、display に `Error` 表示
- 次回入力で error を自動クリア

## 履歴

- `=` 評価成功時、`{ expr, result }` を unshift し 10 件超を切り捨て
- UI は ol で直近順に描画 (クリック復元はスコープ外)

## キーマッピング

| キー | 動作 |
| --- | --- |
| 0-9 | 数値入力 |
| . | 小数点 |
| + - * / | 二項演算子 |
| ^ | べき乗 |
| ( ) | 括弧 |
| Enter または = | 評価 |
| Backspace | 1 文字削除 |
| Escape | clear |
| m | memory recall |

## 表示フォーマット

`CalcEngine.format` は以下を行う:
- NaN/Infinity は `Error` 文字列 (state 側でエラー扱い)
- 整数は整数表示
- 浮動小数は最大 12 有効桁、末尾ゼロ削除
- 絶対値が `1e-6 < x < 1e12` の範囲外は指数表記

## ファイル LOC 目標 (合計 ~510)

| ファイル | 目安 LOC |
| --- | --- |
| index.html | 80 |
| styles.css | 90 |
| engine.js | 180 |
| state.js | 90 |
| ui.js | 90 |

## テスト戦略

- unit (`engine.test.mjs`): AC-01〜06, AC-09 (engine 側で全て検証)
- unit (`state.test.mjs`): メモリ・角度モード・履歴・エラー回復
- integration (`integration.test.mjs`): 履歴 10 件保持・state とengine の連携
- system (`system.spec.mjs`): index.html の構造検証 + キー入力シミュレーション (jsdom 不要、HTML 文字列検査と engine end-to-end)

## KPT

- Keep: API シグネチャを先に固定したことで実装迷いが減る
- Problem: jsdom 等の外部依存を避けるため system テストは HTML パターン検査で代替
- Try: Phase 4 でテストファースト (TDD) を実践
