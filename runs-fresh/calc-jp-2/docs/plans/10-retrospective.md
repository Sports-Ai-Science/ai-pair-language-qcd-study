# 10 振り返り — calc-jp-2 (8e2d5c1f)

## サマリ

| 指標 | 値 |
| --- | --- |
| 実行フェーズ | 1, 2, 3, 4, 5, 6, 7, 8, 10 (3a スキップ, 9 N/A) |
| 成果物 | src 5 ファイル (508 LOC), tests 5 ファイル, docs 6 ファイル, reviews 9 ファイル |
| テスト総数 | 77 (unit 50 + integration 9 + system 18) |
| テスト結果 | 77/77 PASS |
| バグ件数 | 0 |
| AC 達成率 | 10/10 (100%) |

## 全フェーズ KPT 集約

### Keep (継続したい)

- PLAN.md §3 を SSOT とし AC を機械検証可能な形でテストへ落とし込んだ → ぶれゼロ
- ADR を 1 枚に圧縮した結果、Phase 4 の実装迷いが少なかった
- Classic JS + IIFE による file:// 動作担保と Node テスト互換性の両立 (`vm.runInThisContext` ブリッジ)
- イミュータブルな state 設計により statefulバグが発生しなかった
- TDD ではないが、Phase 3 で API シグネチャを先に固定したため Phase 4-7 でテスト追加が容易

### Problem (問題・困りごと)

- 初版 styles.css と engine.js が ~510 LOC 制約を超過 (603 LOC) → Phase 4 内で 1 度圧縮が必要だった
- jsdom を使えない制約下で system テストの実機 DOM 検証ができず、HTML 文字列パターン検査で代替

### Try (次回試したい)

- Phase 3 の段階で LOC 見積もりを各ファイルごとに行い、超過を Phase 3 中に検知する
- system テストで Playwright 等の許可がある場合は実機ブラウザでクリック・キー入力を検証する
- 履歴クリック復元など UX 改善を別 PBI として切り出す

## ボトルネック分析

| 工程 | 所要 | 備考 |
| --- | --- | --- |
| Phase 1〜3 (要件・設計) | 4 分 | 高速。PLAN.md §3 が明瞭だった |
| Phase 4 (実装+圧縮) | 6.5 分 | 圧縮 1 サイクルでオーバーヘッド |
| Phase 5〜7 (テスト) | 7 分 | 想定通り |
| Phase 8, 10 (文書) | 4.5 分 | 想定通り |

合計: 約 22 分 (PR/振り返り含む)。

## 改善アクション

- LOC ガード: Phase 3 設計時にファイル別 LOC 上限を明示し、Phase 4 中に超過したら即圧縮
- system テスト戦略: 制約マトリクス (jsdom 可否, Playwright 可否) を Phase 2 ADR に記録

## 学び

- file:// 動作保証は ESM 排除と外部 CDN 排除が最重要 (system test で機械検証できる)
- 純粋関数の徹底でテストが極小コードで網羅可能 (engine.js 170 LOC に対し 33 テスト)
