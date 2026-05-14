# Phase 8: Pull Request

## タイトル

feat(calc-4a6f9b3e): Vanilla JS 関数電卓を追加

## ブランチ

`feature/calc-4a6f9b3e`

## サマリ

ローカル動作の関数電卓を Vanilla JS で実装した。`src/index.html` を Chrome でダブルクリックするだけで起動し、サーバ・ビルド工程不要で動作する。

## 主な変更点

- `src/engine.js`: 字句解析 + Shunting-yard による式評価エンジン（純粋関数）
- `src/state.js`: 入力バッファ、メモリ、履歴 10 件、角度モードの状態管理
- `src/ui.js`: DOM バインドとキーボード入力ハンドラ
- `src/styles.css`: CSS Grid による電卓レイアウト
- `src/index.html`: 起動エントリ（Classic `<script>` で順序読み込み）
- `tests/`: ユニット 38 件、統合 6 件、システム 5 件
- `package.json`: テストスクリプトと Playwright 開発依存

## AC 達成状況

| AC | 内容 | テスト | 結果 |
| --- | --- | --- | --- |
| AC-01 | 四則演算 | engine.test.mjs (5) | PASS |
| AC-02 | 三角・逆三角 | engine.test.mjs (6) | PASS |
| AC-03 | log/ln/exp/sqrt/x²/x^y | engine.test.mjs (6) | PASS |
| AC-04 | π, e | engine.test.mjs (2) | PASS |
| AC-05 | DEG/RAD 切替 | engine.test.mjs (2) + state.test.mjs (1) | PASS |
| AC-06 | M+/M-/MR/MC | state.test.mjs (4) | PASS |
| AC-07 | 履歴 10 件 | integration.test.mjs (2) | PASS |
| AC-08 | キーボード入力 | system.spec.mjs (3) | PASS |
| AC-09 | エラー処理 | engine.test.mjs (5) + system.spec.mjs (1) | PASS |
| AC-10 | ローカル起動 5 秒以内 | system.spec.mjs (1, 288ms) | PASS |

## テスト計画

- [x] ユニットテスト: 38/38 PASS
- [x] 統合テスト: 6/6 PASS
- [x] システムテスト: 5/5 PASS
- [x] 合計: 49/49 PASS
- [x] 手動確認: `src/index.html` を Chrome でダブルクリックして UI が描画される

## 設計上の判断

- ES Module を採用しない（`<script type="module">` は `file://` で CORS 失敗するため）。
- IIFE で `globalThis.CalcEngine` / `CalcState` / `CalcUI` を公開する疑似モジュール構成。
- パーサは外部依存を避けて自前 Shunting-yard を実装し、`eval` 等の動的評価を排除。

## ファイル予算

- src 5 ファイル、530 LOC（目安 510 LOC に対し +20 で許容範囲内）
- 単一プロセスで完結、ビルド・サーバ不要

## SuperClaude Review

PBI: #calc-4a6f9b3e
Task: #calc-4a6f9b3e
PR: #local
Status: APPROVED
HEAD: PHASE-08-LOCAL
Agents: @self-review, @quality-engineer, @security-engineer, @refactoring-expert
