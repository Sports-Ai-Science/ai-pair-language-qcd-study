# 02 アーキテクチャ設計 (ミニマル ADR)

## ADR-001: 単一 HTML + Vanilla JS + IIFE 閉包

### コンテキスト

`file://` プロトコルで動作する関数電卓を構築する必要がある。ブラウザは `file://` 配下では ES Modules の読み込みを CORS により拒否するため、`<script type="module">` は使用不可。フレームワーク (React/Vue 等) もビルド工程を要するため対象外。

### 決定

- 単一 `index.html` から複数の Classic `<script>` タグで JS ファイルを順次読み込む
- 各 JS ファイルは IIFE (Immediately Invoked Function Expression) で閉包を作り、`window.CalcEngine` / `window.CalcState` / `window.CalcUI` の 3 つのみグローバル公開
- 状態は `state.js` の閉包で保持 (永続化なし)
- 計算ロジックは `engine.js` (純粋関数群、副作用なし) に隔離
- DOM 連携は `ui.js` に集約

### 構成

```
src/
  index.html   - 構造とボタン配置 (英語 UI ラベル固定)
  styles.css   - グリッドレイアウト + カラー
  engine.js   - Shunting-yard パーサ + RPN 評価器 + 関数群 (純粋)
  state.js    - 表示・メモリ・履歴・角度モードの可変状態
  ui.js       - DOM イベント結線・キーボード連携・描画
```

### 結果

- ビルド不要、`index.html` をダブルクリックで起動可能
- engine は Node `node:test` で単体テスト可能 (DOM 非依存)
- src 配下 5 ファイル制約・~510 LOC 制約を満たす

### 代替案と却下理由

| 代替 | 却下理由 |
| --- | --- |
| `<script type="module">` | file:// で CORS により失敗 |
| eval ベースの式評価 | セキュリティ・テスト容易性で劣る |
| React + Vite | ビルド必須・ファイル数制約超過 |
| 単一巨大 JS ファイル | テスト容易性と責務分離が損なわれる |

## モジュール依存関係

```
ui.js  --uses-->  state.js  --uses-->  engine.js
                   ^
                   +-- ui.js も engine.js を直接呼ぶ (定数・関数評価)
```

循環依存なし。engine は他に依存しない。

## 非機能要件への対応

| NFR | 対応 |
| --- | --- |
| 起動 5 秒以内 | 全ファイル合計 < 30KB、外部依存ゼロ |
| キーボード対応 | ui.js で `keydown` リスナを window に登録 |
| エラー処理 | engine で例外、state でキャッチ、ui で `Error` 表示 |
| テスト容易性 | engine と state は DOM 非依存で Node から require 可能にする |

## Node からの読み込み戦略

`tests/_load.mjs` で `vm.runInThisContext` 風に `engine.js` / `state.js` を読み込み、IIFE 公開された `globalThis.CalcEngine` / `globalThis.CalcState` をテストから参照する。これにより本番コードと同一バンドルをテストできる。

## KPT

- Keep: ADR を 1 枚に圧縮し意思決定を明示化
- Problem: file:// 制約と通常 Node テストの両立が技術ポイント
- Try: Phase 3 で具体的な API シグネチャを確定する
