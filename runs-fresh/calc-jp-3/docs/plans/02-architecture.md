# Phase 2: アーキテクチャ — ADR-001（軽量 1 枚）

ID: 6b3f7a9c

## ADR-001: 単一 HTML + Vanilla JS + IIFE グローバル

### Status

Accepted

### Context

PLAN.md §3 の AC-10 により、`index.html` をブラウザでダブルクリックして
`file://` で起動できる必要がある。`file://` スキームでは ES modules
（`import` / `export`）が CORS エラーで読み込めないブラウザ挙動が標準。
さらに `src/` のファイル数 5 以内、合計 ~510 LOC の制約がある。

### Decision

- 単一 `src/index.html` から `<script src="...">` を順序ロードで結合する。
- 各 JS ファイルは IIFE で内部状態を閉包し、必要 API のみを
  `window.Calc.<module>` のグローバル名前空間に公開する。
- 言語: Vanilla JS（ECMAScript 2020 互換、ブラウザ標準）。フレームワーク不使用。
- スタイル: 単一 CSS。CSS Grid でキーパッドを構築。
- テスト: Node.js 組み込みの `node --test`（ESM）。`tests/_load.mjs` で
  `src/*.js` を `vm` で評価し、IIFE が公開した `globalThis.Calc.*` を取得。

### Consequences

- **Positive**:
  - `file://` で確実に動作する（ブラウザの ES modules 制約を完全回避）。
  - ビルドツール・依存ゼロ。配布は静的ファイルコピーのみ。
  - テストはブラウザ起動なしで CI 互換（`node --test`）。
- **Negative**:
  - グローバル名前空間汚染リスクは `Calc` 名前空間 1 個に閉じることで緩和。
  - Tree-shaking が効かないが、合計 ~510 LOC の規模では影響なし。

### Alternatives Considered

1. **ES modules + ローカルサーバ起動** — AC-10（ダブルクリック起動）に反するため却下。
2. **HTML 1 ファイルに全 JS をインライン埋め込み** — `src/` の責務分離が損なわれ、
   テスト時に DOM パーサが必要となるため却下。
3. **Vite 等のビルドで単一 HTML 化** — 「ビルドツール禁止」「依存最小」方針に反するため却下。

## コンポーネント分割

| ファイル | 責務 | 公開 API |
| --- | --- | --- |
| `src/index.html` | DOM 構造、`<script>` ロード順 | — |
| `src/styles.css` | CSS Grid キーパッド、エラー表示色 | — |
| `src/engine.js` | 純粋関数：四則・三角・対数・指数・定数 | `window.Calc.engine` |
| `src/state.js` | 入力バッファ・モード(DEG/RAD)・メモリ・履歴 | `window.Calc.state` |
| `src/ui.js` | DOM bind, ボタン/キーボード → state、display 更新 | `window.Calc.ui` |

## データフロー

```
[Click / KeyDown]
        │
        ▼
   ui.handleInput(token)
        │
        ▼
   state.apply(token)  ──→  engine.evaluate(expr, mode)
        │                            │
        ▼                            ▼
   state.snapshot               number | Error
        │                            │
        └─────────► ui.render(snapshot, result)
                            │
                            ▼
                  display, history list
```

## 非機能要件への対応

| NFR | 対応 |
| --- | --- |
| 起動 5 秒以内 | 静的ファイル 5 個・合計 ~510 LOC、ネットワーク不要 |
| エラー堅牢性 | engine が定義域外を `Error` で返却、ui で赤字表示 |
| キーボード操作 | `keydown` リスナを `ui` に集約、`state.apply` 共通経路 |
| テスト容易性 | engine/state を純粋化、`node --test` で副作用なし検証 |

## KPT (Phase 2)

- **Keep**: 1 枚 ADR で技術選定の根拠と却下案を残せた。
- **Problem**: IIFE グローバル方式は型安全性が低いが、規模上問題なし。
- **Try**: Phase 3 で関数シグネチャを確定し、テスト容易性を二重化する。
