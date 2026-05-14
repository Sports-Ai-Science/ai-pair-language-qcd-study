# Phase 2: アーキテクチャ設計（ADR）

## 決定事項

単一 HTML ファイル + Vanilla JS + Classic `<script>` タグ + IIFE による疎結合モジュール構成を採用する。

## コンテキスト

- ローカル `file://` プロトコルで動作させる必要がある（AC-10）。
- `<script type="module">` は `file://` 下で CORS 制約により失敗するため使用禁止。
- 外部依存・バンドラ・サーバを排除する。

## 決定の選択肢

| 案 | 概要 | 採否 |
| --- | --- | --- |
| A: ES Modules (`type="module"`) | モダン構文、ツリーシェイク容易 | **不採用**（CORS 失敗） |
| B: 単一ファイルにすべて記述 | 1 HTML 内にスクリプトを埋め込み | 不採用（テスト容易性低下） |
| C: Classic script + IIFE グローバル | `globalThis.X` で名前空間提供 | **採用** |

## 採用案 C の構成

```
src/
├── index.html    起動エントリ。順序通りにスクリプトを読み込む
├── styles.css    ボタンレイアウト（CSS Grid）
├── engine.js     evaluate(expr, mode) などの純粋計算
├── state.js      表示バッファ・メモリ・履歴の状態
└── ui.js         DOM バインド、イベントハンドラ
```

スクリプトの読み込み順序: `engine.js` → `state.js` → `ui.js`。各ファイルは IIFE で公開オブジェクトを `globalThis.CalcEngine` / `globalThis.CalcState` / `globalThis.CalcUI` に束縛する。

## モジュール責務

### engine.js（純粋関数のみ）

- `evaluate(expression: string, angleMode: 'DEG'|'RAD'): number`
- `applyUnary(fn: string, value: number, angleMode): number`
- `binaryOp(op: '+|-|*|/|^', a: number, b: number): number`
- 定数 `PI`, `E`
- ゼロ除算・定義域外エラーは例外として throw。

### state.js（状態管理）

- 入力バッファ（文字列）の追加・後退・クリア。
- メモリレジスタ（`memory: number`）と M+/M-/MR/MC。
- 履歴配列（最大 10 件、FIFO）。
- 角度モード `'DEG'|'RAD'`。

### ui.js（DOM 連携）

- ボタンクリック / キーボード入力をハンドリングし、state を更新後、表示を再描画。
- engine.evaluate を呼び出し、エラーは `Error` 表示に変換。

## 非機能設計

- 状態は IIFE クロージャに閉じる。テストでは公開 API のみ叩く。
- DOM 依存ロジック（ui.js）はユニットテスト対象外。engine と state はテスト対象。
- 浮動小数点比較は `1e-9` 許容。

## テスト戦略の概要

| 層 | 対象 | ツール |
| --- | --- | --- |
| ユニット | engine, state | Node `node --test`（ESM ラッパで読み込み） |
| 統合 | engine + state（履歴・メモリ連携） | Node `node --test` |
| システム | UI 起動・キーボード入力 | Playwright（Chromium） |

`tests/_load.mjs` で IIFE スクリプトを Node 側に読み込ませるブリッジを用意する。

## トレードオフ

- グローバル名前空間汚染が発生するが、`Calc*` プレフィックスで衝突回避。
- 型システムなし（TypeScript 不採用、ローカル動作優先）。
- バンドラなしのため `import` を使えない代償として IIFE で疑似モジュール化。
