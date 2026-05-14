# Phase 3: 詳細設計

## 1. UI レイアウト

CSS Grid で 5 列 × 7 行を組む（UI ラベルは英語固定）。

```
display | display | display | display | display
MC      | MR      | M+      | M-      | mode
sin     | cos     | tan     | log     | ln
asin    | acos    | atan    | exp     | sqrt
7       | 8       | 9       | /       | ^
4       | 5       | 6       | *       | x^2
1       | 2       | 3       | -       | pi
0       | .       | =       | +       | e
C       | <-      | history | history | history
```

ボタンには `data-key` 属性を付与し、ui.js のシングルハンドラで分岐する。

## 2. 入力モデル

入力バッファ `expr: string` に対し、ボタンは以下のトークンを連結する。

| ボタン | 連結トークン | 備考 |
| --- | --- | --- |
| 0-9 | `'0'..'9'` | |
| `.` | `'.'` | 重複は state でチェック |
| `+ - * /` | 演算子 | × は `*`、÷ は `/` を内部表現に |
| `^` | `^` | engine 側で `**` に変換 |
| `pi` `e` | `PI` `E` | engine が定数解決 |
| `sqrt` `x^2` `exp` `ln` `log` | `sqrt(` `sq(` `exp(` `ln(` `log(` | 関数呼び出し |
| `sin/cos/tan/asin/acos/atan` | `sin(` 等 | 角度モードに従う |
| `(` `)` | そのまま | |
| `=` | 評価実行 | |
| `C` | バッファクリア | |
| `<-` | 末尾削除 | |
| `MC/MR/M+/M-` | メモリ操作 | |
| mode | DEG/RAD トグル | |

## 3. engine.js API

```
CalcEngine.evaluate(expr: string, mode: 'DEG'|'RAD'): number
CalcEngine.PI: number
CalcEngine.E:  number
```

実装方針:

1. `expr` を字句解析しトークン列を得る（数値・識別子・演算子・括弧）。
2. 識別子（`sin`, `pi` 等）は内部関数/定数テーブルで解決。
3. Shunting-yard 法で逆ポーランド記法（RPN）に変換。
4. RPN 評価で結果を得る。
5. ゼロ除算は `throw new Error('Math error')`。
6. 三角関数の引数は mode='DEG' のとき `degree * PI / 180` に変換。
7. 逆三角関数は結果を mode='DEG' のとき度に変換。
8. `asin`/`acos` の入力が `[-1,1]` 範囲外なら定義域エラー。
9. `log`/`ln`/`sqrt` の入力が定義域外なら定義域エラー。

トークン優先順位（Shunting-yard）:

| 演算子 | 優先度 | 結合性 |
| --- | --- | --- |
| `+ -` | 1 | 左 |
| `* /` | 2 | 左 |
| `u-`（単項マイナス） | 3 | 右 |
| `^` | 4 | 右 |
| 関数呼び出し | 5 | — |

## 4. state.js API

```
CalcState.getExpr(): string
CalcState.append(token: string): void
CalcState.backspace(): void
CalcState.clear(): void
CalcState.setResult(value: number | 'Error'): void
CalcState.getDisplay(): string
CalcState.memoryAdd(value: number): void
CalcState.memorySub(value: number): void
CalcState.memoryRecall(): number
CalcState.memoryClear(): void
CalcState.toggleMode(): 'DEG'|'RAD'
CalcState.getMode(): 'DEG'|'RAD'
CalcState.pushHistory(entry: { expr: string, result: string }): void
CalcState.getHistory(): Array<{expr,result}>   // 直近 10、新しい順
```

履歴は `unshift` して 10 件超過時 `pop`。

## 5. ui.js 振る舞い

- `DOMContentLoaded` で電卓 DOM を組み立て、ハンドラを取り付ける。
- ボタンクリックは `data-key` を見て state を更新し、表示を再描画。
- `=` 押下で `engine.evaluate(state.getExpr(), state.getMode())` を呼び、結果を `setResult` し、履歴に追加。
- `keydown` で対応キーを `data-key` の押下に変換。
  - 数字 / 演算子 / `.` / `(` / `)` / `^` はそのまま。
  - `Enter` `=` は `=` ボタン。
  - `Backspace` は `<-` ボタン。
  - `Escape` は `C` ボタン。

## 6. エラー処理

- engine が throw した場合、ui は表示を `Error` に切り替え、入力は次の `C` 操作までロック。
- ゼロ除算: `1/0` → `Error`。
- 定義域外: `asin(2)`, `log(0)`, `sqrt(-1)` → `Error`。

## 7. データ型と境界

- 数値はすべて JavaScript `number`（IEEE 754 倍精度）。
- 表示の有効桁は最大 12 桁、超過時は指数表記。
- 履歴の `result` は文字列で保持（`Error` も含むため）。

## 8. AC とテストのトレース表

| AC | テスト関数（予定） | ファイル |
| --- | --- | --- |
| AC-01 | 四則演算 4 ケース | tests/engine.test.mjs |
| AC-02 | 三角・逆三角 6 ケース | tests/engine.test.mjs |
| AC-03 | log/ln/exp/sqrt/x^2/x^y | tests/engine.test.mjs |
| AC-04 | pi, e | tests/engine.test.mjs |
| AC-05 | DEG/RAD 切替 | tests/engine.test.mjs |
| AC-06 | M+/M-/MR/MC | tests/state.test.mjs |
| AC-07 | 履歴 10 件 | tests/integration.test.mjs |
| AC-08 | キーボード入力 | tests/system.spec.mjs |
| AC-09 | エラー処理 | tests/engine.test.mjs |
| AC-10 | 起動 5 秒以内 | tests/system.spec.mjs |
