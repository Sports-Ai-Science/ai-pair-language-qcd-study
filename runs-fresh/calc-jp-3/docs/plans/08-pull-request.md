# Phase 8: プルリクエスト本文（草案）

ID: 6b3f7a9c

## タイトル

feat(calc): file:// 起動の関数電卓 (Vanilla JS, IIFE グローバル)

## 概要

`index.html` をブラウザでダブルクリックするだけで動く関数電卓を、ES modules を
使わない単一 HTML + Classic `<script>` + IIFE グローバル構成で実装する。
四則・三角・対数・指数・定数・モード切替・メモリ・履歴・キーボード入力・エラー
処理を、`src/` 配下 5 ファイル / 合計 423 LOC で完結させる。

## 変更内容

- `src/index.html` (22 LOC): `<script>` 同期ロード + 起動 IIFE
- `src/styles.css` (43 LOC): CSS Grid キーパッド、エラー赤字
- `src/engine.js` (154 LOC): tokenize → parse (再帰下降) → evalAst の純粋関数
- `src/state.js` (101 LOC): バッファ・モード・メモリ・履歴 (FIFO 10 件)
- `src/ui.js` (103 LOC): DOM 構築、ボタン / キーボード両経路で同一ディスパッチ
- `tests/` 4 ファイル + 共通ローダで 34 テスト PASS

## Acceptance Criteria 達成状況

| AC | 状態 | 検証テスト |
| --- | --- | --- |
| AC-01 四則演算 | 達成 | engine.test (四則・優先順位) |
| AC-02 三角 | 達成 | engine.test (DEG/RAD, 逆関数) |
| AC-03 log/exp/sqrt/^ | 達成 | engine.test |
| AC-04 pi/e | 達成 | engine.test |
| AC-05 DEG/RAD | 達成 | engine.test, state.test, integration.test |
| AC-06 メモリ | 達成 | state.test, integration.test |
| AC-07 履歴 10 件 | 達成 | integration.test (FIFO 境界, エラー除外) |
| AC-08 キーボード | 達成 | system.spec (Enter/Backspace/Escape/click) |
| AC-09 エラー処理 | 達成 | engine.test (3 系統), state.test, system.spec |
| AC-10 file:// 起動 | 達成 | system.spec (import 文不在 + mount < 5 秒) |

## テスト計画

- [x] ユニットテスト 19/19 PASS（engine + state）
- [x] 統合テスト 7/7 PASS
- [x] システムテスト 8/8 PASS（DOM スタブ）
- [x] `npm install --silent && npm test && node --test tests/system.spec.mjs`

合計 **34/34 テスト PASS**、外部 npm 依存ゼロ（テスト含め Node 標準のみ）。

## DoD チェックリスト

- [x] AC を全 10 件カバー
- [x] テストがパスしている
- [x] `eval()` / `new Function()` 不使用
- [x] ES modules 不使用（`file://` CORS 回避）
- [x] UI ラベル英語固定
- [x] src/ 5 ファイル制限内 (5 / 5)
- [x] 合計 LOC 約 510 以内 (423 LOC)
- [x] グローバル汚染は `window.Calc` 1 個に閉じる
- [x] XSS 対策: `textContent` のみ使用

## SuperClaude Review

PBI: calc-jp-3
Task: calc-jp-3
PR: calc-jp-3
Status: APPROVED
HEAD: local
Agents: @self-review, @quality-engineer, @security-engineer, @refactoring-expert
