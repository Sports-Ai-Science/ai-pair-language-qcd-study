# 08 プルリクエスト — feat(calc): 関数電卓の Vanilla JS 実装 (8e2d5c1f)

## 概要

`file://` プロトコルでダブルクリック起動する関数電卓を Vanilla JS + Classic `<script>` + IIFE で実装した。フレームワーク・ビルドツール・外部 CDN を一切使わず、`src/index.html` を Chrome で開けば即動作する。

## 変更点

- `src/index.html` (76 LOC): UI 構造、英語ラベル固定、3 つの script タグで JS 順次読み込み
- `src/styles.css` (53 LOC): ダークテーマ + 6 列グリッドレイアウト
- `src/engine.js` (170 LOC): tokenize / Shunting-yard / RPN 評価 / 単項関数 / format。純粋関数群、DOM 非依存
- `src/state.js` (133 LOC): イミュータブルな状態遷移 (input/equals/memory/angleMode/history)
- `src/ui.js` (76 LOC): DOM 結線 + キーボードハンドラ + data-action ディスパッチ
- `tests/_load.mjs`: Classic JS を Node の `vm.runInThisContext` で読み込みグローバル公開
- `tests/engine.test.mjs` (33 件): AC-01〜04, 09 を網羅
- `tests/state.test.mjs` (17 件): AC-05, 06, 09 を網羅
- `tests/integration.test.mjs` (9 件): AC-07 履歴 FIFO + 連携シナリオ
- `tests/system.spec.mjs` (18 件): AC-08 キーボード + AC-10 ローカル動作前提
- `package.json`: `npm test` で unit + integration を一括実行
- `docs/plans/01〜04, 08, 10`: 各フェーズの設計・実装メモ・PR・振り返り
- `.claude/reviews/01〜08, 10`: フェーズ別セルフレビュー (frontmatter 付き)
- `METRICS.md`: フェーズ別 start/end/wc/判定/バグ一覧

## 受け入れ基準の達成状況

| AC ID | 内容 | 検証 | 結果 |
| --- | --- | --- | --- |
| AC-01 | 四則演算 | engine.test.mjs (5 件) | PASS |
| AC-02 | 三角関数 6 種 | engine.test.mjs (7 件) | PASS |
| AC-03 | log/ln/exp/sqrt/x^2/x^y | engine.test.mjs (7 件) | PASS |
| AC-04 | 定数 pi, e | engine.test.mjs (2 件) | PASS |
| AC-05 | DEG/RAD 切替 | state.test + integration (2 件) | PASS |
| AC-06 | M+/M-/MR/MC | state.test.mjs (4 件) | PASS |
| AC-07 | 履歴直近 10 件 | integration.test.mjs (3 件) | PASS |
| AC-08 | キーボード入力 | system.spec.mjs (6 件) | PASS |
| AC-09 | ゼロ除算・定義域外 | engine + state (8 件) | PASS |
| AC-10 | ローカル動作 | system.spec.mjs (12 件) | PASS |

合計 77 テスト全 PASS。

## テストプラン

- [x] `npm install --silent && npm test` (59/59 PASS)
- [x] `node --test tests/system.spec.mjs` (18/18 PASS)
- [x] 手動確認: `open src/index.html` で UI が描画される
- [x] 手動確認: キーボードから `1+2=` を入力して `3` が表示される

## DoD チェック

- [x] テスト追加・更新済み (77 件)
- [x] リント相当 (eval 不使用、ハードコードシークレットなし、console.log なし)
- [x] ドキュメント更新 (docs/plans 6 件)
- [x] セルフレビュー完了 (.claude/reviews 9 件)
- [x] LOC 制約遵守 (src 合計 508 / 510 目標)
- [x] file:// 動作要件 (ESM 不使用、外部依存ゼロ)

## SuperClaude Review

PBI: calc-jp-2
Task: calc-jp-2
PR: local-only
Status: APPROVED
HEAD: local
Agents: @self-review

## リスクと残課題

- 浮動小数点誤差により `sin(180)` は完全な 0 にならない (1.22e-16)。表示時は format で丸めて対処済み
- 履歴のクリック復元はスコープ外 (PLAN.md §3 通り)
- 永続化なし (リロードで履歴・メモリは消える)
