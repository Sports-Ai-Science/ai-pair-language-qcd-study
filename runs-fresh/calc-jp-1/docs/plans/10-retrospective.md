# Phase 10: 振り返り（KPT）

## サマリ

- 全 10 AC を満たすローカル動作の関数電卓を 9 フェーズで完成させた。
- 単体 38 + 統合 6 + システム 5 = 49 テスト すべて PASS。
- 開発中に発見・修正したバグ件数は 0 件（テスト駆動で初回 PASS）。

## Keep（継続したいこと）

- **AC を Phase 1 で確定 → Phase 3 でテスト関数にトレース** という流れが効いた。実装段階で「何を満たせば良いか」が明確だった。
- IIFE + Classic script 構成は `file://` 制約と完全に整合し、追加デバッグなしで AC-10 をクリアできた。
- engine（純粋関数）を state（DOM 非依存の状態）と完全に分離したことで、Node `node --test` だけで unit と integration を完結できた。
- 自前 Shunting-yard は「依存ゼロ」「`eval` 不要」「セキュリティ的に明示」の三利点があった。

## Problem（課題）

- src の総 LOC が 530 となり、目安 510 を 20 行上回った。圧縮余地は ui.js のボタンテーブルと styles.css のクラスにある。
- ui.js のボタンレイアウトに `hist` ボタンがあるが、現在のハンドラでは履歴一覧の専用操作を行っていない（履歴は常時表示されているため）。冗長。
- formatNumber の指数表記閾値（1e12 / 1e-9）はマジックナンバー化していて、設計ドキュメントとの整合チェックが手動。

## Try（次回試したいこと）

- ui.js のボタン定義を `const BUTTONS = [...]` から JSON 化し、`src/buttons.json` を `fetch` ではなくインラインで保持するか検討（ただし `file://` の `fetch` 制約に注意）。
- formatNumber の閾値を engine の定数として共有し、表示と計算で単一ソース化する。
- Playwright 設定（解像度・locale・timezone）を `playwright.config.js` で固定し、実行環境差異を排除する。

## メトリクス参照

詳細は [`METRICS.md`](../../METRICS.md) を参照。

## AC × テスト最終確認

| AC | テスト層 | 件数 | 結果 |
| --- | --- | --- | --- |
| AC-01 | unit | 5 | PASS |
| AC-02 | unit | 6 | PASS |
| AC-03 | unit | 6 | PASS |
| AC-04 | unit | 2 | PASS |
| AC-05 | unit | 3 | PASS |
| AC-06 | unit | 4 | PASS |
| AC-07 | integration | 2 | PASS |
| AC-08 | system | 3 | PASS |
| AC-09 | unit + system | 6 | PASS |
| AC-10 | system | 1 | PASS |
| 合計 |  | 49 | 49/49 PASS |
