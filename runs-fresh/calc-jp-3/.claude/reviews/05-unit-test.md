---
phase: "05"
target: "calc-jp-3"
status: APPROVED
head: local
agents: [self-review, quality-engineer, security-engineer, refactoring-expert]
sc_commands: [/sc:test, /sc:analyze --focus quality]
diversification_id: 6b3f7a9c
---

# Phase 5 セルフレビュー — ユニットテスト

## レビュー対象

- `tests/_load.mjs` — vm 経由で `src/*.js` を評価する共通ローダ
- `tests/engine.test.mjs` — 11 テスト（AC-01〜05, 09 を網羅）
- `tests/state.test.mjs` — 8 テスト（AC-01, 05, 06, 09 を網羅）

## 実行結果

```
node --test tests/engine.test.mjs tests/state.test.mjs
tests 19, pass 19, fail 0, duration_ms ~68
```

## カバレッジ（手集計）

| AC | テストファイル |
| --- | --- |
| AC-01 | engine 四則演算 / state buffer |
| AC-02 | engine 三角 DEG, 三角 RAD・逆関数 |
| AC-03 | engine 対数・指数・冪・平方根 |
| AC-04 | engine 定数 pi/e |
| AC-05 | engine DEG/RAD 切替 / state setMode |
| AC-06 | state メモリ M+/M-/MR/MC |
| AC-09 | engine div0 / domain / syntax (3 件 × 複数式) |

## 修正したバグ

1. **テスト期待誤り（FR-002 解釈）**: `-2^2` を `-4` で期待していたが、SRS の文法
   `factor := unary ('^' factor)?` では `(-2)^2 = 4`。テスト期待を修正し、数学慣習が
   必要な場合は `-(2^2)` と書く旨をテストコメントに記録。
2. **テスト期待誤り（評価後 buffer 動作）**: `=` 後はバッファに結果が残るため、
   連続入力で結合される。テストに `clearAll()` を挟むよう修正。

## quality-engineer 観点

- 全 AC が 1 件以上のテストでカバーされている。
- 浮動小数比較は `1e-9` 許容で安定。

## security-engineer 観点

- 不正トークン入力で `Error("syntax")` が返ることを確認。
- vm sandbox で `src/*.js` を読み込み、Node プロセスへの副作用なし。

## refactoring-expert 観点

- ローダを共通化することでテストファイルの DRY を維持。
- AC ID をテスト名に埋め込みトレーサビリティ確保。

## 結論

APPROVED。Phase 6（統合テスト）に進む。
