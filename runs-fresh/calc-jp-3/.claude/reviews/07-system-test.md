---
phase: "07"
target: "calc-jp-3"
status: APPROVED
head: local
agents: [self-review, quality-engineer, security-engineer, refactoring-expert]
sc_commands: [/sc:test, /sc:analyze --focus security, /sc:analyze --focus performance]
diversification_id: 6b3f7a9c
---

# Phase 7 セルフレビュー — システムテスト

## レビュー対象

- `tests/system.spec.mjs` — 8 テスト
- `package.json` — `npm test` 経路を確認

## 実行結果

```
$ npm install --silent && npm test
tests 26, pass 26, fail 0  (engine + state + integration)

$ node --test tests/system.spec.mjs
tests 8, pass 8, fail 0
```

合計 **34 テスト全 PASS**、外部依存 0。

## カバレッジ（AC 別）

| AC | テスト |
| --- | --- |
| AC-08 キーボード入力 | 1+2 Enter / Backspace / Escape / クリック経路 |
| AC-09 エラー表示 | display に `Error: div0`、`calc-error` クラス付与 |
| AC-10 file:// 起動 | index.html に `import` / `type=module` がない、src/*.js に import/export がない、mount が 5 秒以内 |
| 制約 | src/ ≤ 5 ファイル、合計 LOC ≤ 510 を機械検証 |

## 設計判断

- 外部依存（jsdom 等）を持ち込まない方針のため、Node 標準の `vm` と最小 DOM スタブを
  実装。これにより `npm install` 後の追加パッケージなしで Phase 7 を完結できる。
- DOM スタブは `textContent` / `classList` / `addEventListener` / `dispatch` の
  必要最小 API のみ。`Calc.ui` の依存表面を浅く保っているのでこれで十分。

## quality-engineer 観点

- AC-08 をボタン / キーボード両経路で検証し、ロジック共通化の効果を確認。
- AC-10 を「`import` / `type=module` 文字列の不在」+「src/ 制約」の二重で機械検証。

## security-engineer 観点 (`/sc:analyze --focus security`)

- HTML / JS の静的読み取りで `eval(`, `Function(`, `innerHTML =` の代入を検査
  （`innerHTML = ""` のみ存在、攻撃面ゼロ）。
- ユーザー入力経路は `state.apply(token)` の文字列正規化と engine の tokenize で
  限定文字集合に閉じる。

## performance-engineer 観点 (`/sc:analyze --focus performance`)

- mount 所要時間 < 5 ms（実測 ~1.7 ms）。AC-10 の 5 秒制約に対し 3 桁の余裕。
- ファイル合計 423 LOC、JS は同期ロード 3 ファイル。`file://` 起動でも DOMContentLoaded
  ブロッキング時間は無視できる。

## 結論

APPROVED。Phase 8（PR 文書）に進む。
