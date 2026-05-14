# Phase 1: 要件分析 — 関数電卓

ID: 6b3f7a9c

## ユーザーストーリー

エンドユーザーとして、ブラウザで `index.html` をダブルクリックするだけで起動する
関数電卓を使い、四則演算・三角関数・対数指数・メモリ機能・履歴を、
キーボードと画面ボタンの両方で操作したい。それにより、サーバーやインストールに
依存せず、即座に計算作業を完了できる。

## スコープ

### In Scope (PLAN.md §3 由来)

| AC ID | 内容 | テスト層 |
| --- | --- | --- |
| AC-01 | 四則演算 (+, -, ×, ÷) | unit |
| AC-02 | sin/cos/tan/asin/acos/atan | unit |
| AC-03 | log10/ln/exp/√/x²/x^y | unit |
| AC-04 | 定数 π, e | unit |
| AC-05 | DEG/RAD 切替 | unit |
| AC-06 | M+/M-/MR/MC | unit |
| AC-07 | 計算履歴（直近 10 件） | integration |
| AC-08 | キーボード入力対応 | system |
| AC-09 | ゼロ除算・定義域外エラー処理 | unit |
| AC-10 | ローカル動作（`index.html` ダブルクリック起動）| system |

### Out of Scope

- グラフ描画
- 複素数・行列
- 永続化（localStorage 等）
- 多言語 UI（UI ラベルは英語固定）
- フレームワーク・ビルドツール
- ES modules（`file://` の CORS 制約により禁止）

## ステークホルダー

- ユーザー: ローカル環境でクイック計算をしたい個人
- 開発者: 本作業エージェント（自己完結で完了させる）
- 検証者: テストランナー（Node `node --test`）

## 制約

- **配布形態**: 静的ファイル一式（`file://` で動作）
- **依存**: ブラウザビルトイン API のみ。npm 依存はテストランタイムのみ可
- **ファイル数**: `src/` 配下は 5 ファイル以内、合計約 510 LOC を上限
- **モジュール**: ES modules 禁止。Classic `<script>` + IIFE グローバルで結合
- **言語**: ドキュメント日本語、UI ラベル英語固定

## 依存関係

外部依存なし。テスト実行に Node.js（`node --test` 組み込み）のみ。

## Definition of Ready

- [x] ユーザーストーリーが明確
- [x] AC が機械検証可能（unit/integration/system に区分）
- [x] スコープ外が明示
- [x] 制約が確定（ES modules 禁止・5 ファイル制限・classic script）

## 仮説と前提

- AC-08（キーボード）は `KeyboardEvent.key` を `state` 経由で `engine` に渡す方式で
  ボタン押下と同じ経路に乗せれば、ロジック重複なく満たせる。
- AC-10（`file://` 起動）は `<script src="...">` の同期ロード順で完結させ、
  `import` を一切使わない構成で確実に達成できる。
- AC-09 はエンジン側で結果を `Result` 形相当（数値 または `Error` 文字列）にラップし、
  UI 表示で分岐するのが疎結合。

## KPT (Phase 1)

- **Keep**: PLAN.md §3 の AC を表に落とし込み、テスト層と機械検証性を最初に確定。
- **Problem**: 探索的実装か、設計駆動かの選択は Phase 2 に持ち越し（複雑度小なので軽量 ADR で十分）。
- **Try**: Phase 2 で「単一 HTML + IIFE」を 1 枚 ADR として確定し、Phase 3 設計に直結させる。
