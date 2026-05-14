# ADR-01 — Vanilla JS 単一ファイル構成の関数電卓

**ステータス**: Accepted
**日付**: 2026-05-14

## 背景

`index.html` をダブルクリックして起動するオフライン関数電卓が必要。制約:

- ビルドステップなし
- 外部ランタイム依存なし
- 単一ユーザー、単一セッション
- テスト容易性が必要

## 決定

下記の構成で Vanilla HTML/CSS/JavaScript を採用する:

```
src/
├── index.html         (UI マークアップ、3 つの classic script を順次ロード)
├── styles.css         (表現専用)
├── engine.js          (純粋な式評価器、DOM アクセスなし)
├── state.js           (メモリ + 履歴 + DEG/RAD モード、純粋な状態関数)
└── ui.js              (DOM イベント配線、engine + state を DOM に接続)
```

engine と state モジュールは純粋（DOM/グローバル不参照）なので、Vitest テストからインポートしてブラウザなしで実行可能。

## 重要な決定: ES modules を使わない

ES modules は file:// から CORS で拒否されるため、AC-10（ローカル起動）を直接破壊する。**Run-1 で発見済みの罠**を回避するため、最初から classic script + IIFE namespace パターンを採用する。

各 src ファイルは IIFE で `globalThis.CalcEngine`, `globalThis.CalcState` に名前空間を露出し、index.html は 3 つの `<script src=...>` で順次ロードする。

## 根拠

- **ビルドステップなし** ⇒ フレームワークを除外（React は JSX またはバンドラを要求）
- **純粋モジュール** ⇒ ユニットテストが容易、jsdom 不要
- **単一 HTML エントリ** ⇒ AC-10 と整合
- **Classic script** ⇒ file:// から動作（ES modules は CORS で不可）

## 検討した代替案

| 案 | 棄却理由 |
| --- | -------- |
| 単一インライン `<script>` タグ | ユニットテスト不可、ロジックと DOM が結合 |
| Web Components | AC セットに対しオーバースペック |
| TypeScript | ビルドステップ必須、no-build 制約に違反 |
| React + Vite | no-build と no-framework に違反 |
| ES modules + 単一サーバ | AC-10 のローカル起動を破壊 |

## 帰結

- 良い: インストール/ビルド不要、即時編集-リロード
- 良い: テストは Node で実行（ヘッドレスブラウザ不要）
- 良い: file:// 起動が直接動作
- 悪い: 型安全性なし（JSDoc 注釈で補う）
- 悪い: 手動 DOM 配線（小さい表面積で軽減）

## Phase 終了 DoD

- [x] ADR を 1 件記録
- [x] ファイル配置を決定し正当化
- [x] 代替案を文書化
- [x] 帰結を列挙
- [x] CORS 罠を最初から回避
