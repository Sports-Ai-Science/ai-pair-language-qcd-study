# Phase 3 — 詳細設計 (SRS)

**Run**: 2 (日本語出力)
**日付**: 2026-05-14

## 1. モジュール契約

### 1.1 `engine.js`

純粋な式評価器。トークン化された中置式を扱う。アルゴリズム: shunting-yard → RPN → スタック評価。約 175 LOC。

`globalThis.CalcEngine = { evaluate, formatNumber }` を露出。

### 1.2 `state.js`

純粋関数型の状態コンテナ。約 50 LOC。

`globalThis.CalcState = { initial, setMemory, addToMemory, subFromMemory, clearMemory, pushHistory, setMode, HISTORY_LIMIT }` を露出。

### 1.3 `ui.js`

DOM 配線。ボタンクリックとキーボードイベントを購読。約 130 LOC。

## 2. UI レイアウト

```
+-------------------------------------------+
| display: [                          0]    |
| memory: 0    [DEG] [RAD]                  |
+-------------------------------------------+
| sin cos tan log ln exp                    |
| asin acos atan √ x² x^y                   |
| 7 8 9 ÷ π e                               |
| 4 5 6 × ( )                               |
| 1 2 3 - M+ M-                             |
| 0 . = + MR MC                             |
| C ←                                       |
+-------------------------------------------+
| 履歴 (直近 10 件):                        |
+-------------------------------------------+
```

## 3. エラー処理

| 引き金 | 表示 |
| ------ | ---- |
| ゼロ除算 | `Error: division by zero` |
| log/ln(x ≤ 0) | `Error: log domain` |
| sqrt(x < 0) | `Error: sqrt domain` |
| 不正な式 | `Error: parse` |

エラー表示後、次の数字/関数押下で表示をクリアする。

## 4. キーボードマップ (AC-08)

| キー | 動作 |
| ---- | ---- |
| 0-9 . | 数字を追加 |
| + - * / ^ | 演算子 |
| ( ) | グループ化 |
| Enter, = | 評価 |
| Backspace | 末尾 1 文字削除 |
| Escape | 表示クリア |
| d | DEG/RAD 切替 |

## 5. 浮動小数点表示

`Number.prototype.toPrecision(12)` で 12 有効桁に丸めた後、末尾の 0 を除去。

## 6. Phase 終了 DoD

- [x] モジュール契約定義済み
- [x] UI レイアウト概要済み
- [x] エラー分類列挙済み
- [x] キーボードマップ定義済み
- [x] 表示丸め規則決定済み
