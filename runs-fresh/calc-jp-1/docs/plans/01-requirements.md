# Phase 1: 要件分析

## 目的

ローカル動作の関数電卓（静的 HTML/CSS/JS）を構築する。`index.html` をブラウザでダブルクリックするだけで動作することを必須要件とする。

## 受け入れ基準（PLAN.md §3 より転記）

| AC ID | 内容 | テスト層 |
| --- | --- | --- |
| AC-01 | 四則演算（+, -, ×, ÷） | unit |
| AC-02 | sin/cos/tan/asin/acos/atan | unit |
| AC-03 | log10/ln/exp/√/x²/x^y | unit |
| AC-04 | 定数 π, e | unit |
| AC-05 | DEG/RAD 切替 | unit |
| AC-06 | M+/M-/MR/MC | unit |
| AC-07 | 計算履歴（直近 10 件） | integration |
| AC-08 | キーボード入力対応 | system |
| AC-09 | ゼロ除算・定義域外エラー処理 | unit |
| AC-10 | ローカル動作（`index.html` ダブルクリック起動） | system |

## AC-10 の Given/When/Then

- Given: クリーンな環境（`npm install` やサーバ起動なし）
- When: `index.html` を Chrome でダブルクリック起動
- Then: 5 秒以内に電卓 UI が描画され、最初の演算が成功する

## 範囲外（Out of Scope）

- グラフ描画
- 複素数・行列
- 永続化（localStorage 含む）
- 多言語 UI（UI ラベルは英語固定）
- フレームワーク（React/Vue 等）

## 制約

- `<script type="module">` は `file://` プロトコル下で CORS エラーになるため使用禁止。Classic `<script>` タグと IIFE グローバル（`globalThis.CalcEngine` 等）で構成する。
- `src/` ディレクトリは最大 5 ファイル、合計約 510 LOC を上限とする。
- 外部ライブラリ・CDN リンクなし（ローカル動作担保）。

## ステークホルダーと利用シナリオ

- 主ユーザー: 関数電卓を必要とする一般利用者。
- 利用環境: 個人 PC の Chrome ブラウザ。
- 想定操作: マウスクリックでのボタン押下、およびキーボード入力。

## 主要な機能要件のサマリ

1. 入力バッファに対する数値・演算子・関数の蓄積。
2. `=` 押下による式評価と結果表示。
3. メモリレジスタ（M+ / M- / MR / MC）。
4. 角度モード切替（DEG/RAD）。
5. エラー時の表示（`Error`）と入力リセット。
6. 履歴 10 件のロールオーバ保持。
7. キーボードショートカット（数字、四則、Enter で `=`、Backspace、Escape）。

## 非機能要件

- 起動時間: 5 秒以内（AC-10）。
- ファイル数: src 5 ファイル以内。
- 単一プロセスで完結（バックエンドなし）。

## リスクと前提

- 浮動小数点誤差は IEEE 754 準拠で許容。テストでは `Math.abs(diff) < 1e-9` を許容範囲とする。
- ブラウザ独自挙動の差異は Chrome 最新版を前提とする。
