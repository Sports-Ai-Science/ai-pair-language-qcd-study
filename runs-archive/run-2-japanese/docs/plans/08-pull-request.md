# Pull Request — Run-2 (日本語出力) 関数電卓

## サマリ

`index.html` をダブルクリックでローカル動作する Vanilla JS 関数電卓。
言語比較パイロット (PLAN.md v2.3) の Run-2 (日本語出力) として構築。

## SuperClaude Review

PBI: #2 (Run-2 calculator build)
Task: Phase 1..10 of Run-2
PR: (ローカル Run のため GitHub PR なし)
Status: APPROVED
HEAD: $(git rev-parse HEAD)
Agents: @self-review, @quality-engineer, @security-engineer, @refactoring-expert

## 変更内容

- `src/index.html` — UI マークアップ
- `src/styles.css` — ダークテーマ、グリッドキーパッド
- `src/engine.js` — 純粋式評価器
- `src/state.js` — 純粋関数型状態コンテナ
- `src/ui.js` — DOM イベント配線
- `tests/_load.mjs` — vm-context ローダー
- `tests/engine.test.mjs` — 30 ユニットテスト
- `tests/state.test.mjs` — 14 ユニットテスト
- `tests/integration.test.mjs` — 5 統合テスト
- `tests/system.spec.mjs` — 7 Playwright システムテスト
- `package.json` — npm test と Playwright 開発依存
- `docs/plans/01..03,08.md` — Phase 成果物（日本語）
- `.claude/reviews/01..07.md` — Phase 終了エビデンス

## テスト計画

- [x] ユニットテスト: `npm test` → 49/49 PASS
- [x] システムテスト: `node --test tests/system.spec.mjs` → 7/7 PASS
- [x] 手動スモーク: `src/index.html` を Chrome の file:// で開く → 起動・キーボード受付・評価動作確認

## AC 最終ステータス

| AC | 状態 |
| -- | ---- |
| AC-01 四則演算 | PASS |
| AC-02 三角関数 | PASS |
| AC-03 log/exp/pow/sqrt | PASS |
| AC-04 定数 pi, e | PASS |
| AC-05 DEG/RAD 切替 | PASS |
| AC-06 メモリ M+/M-/MR/MC | PASS |
| AC-07 履歴 (直近 10 件) | PASS |
| AC-08 キーボード入力 | PASS |
| AC-09 エラー処理 | PASS |
| AC-10 file:// ローカル起動 | PASS (Run-1 の CORS 教訓を最初から適用) |

10 / 10 AC 達成。

## Run-1 からの学習適用

Run-1 で発見された CORS バグ（ES modules が file:// から拒否される）を Run-2 では Phase 2 アーキテクチャ段階で予め回避（IIFE classic script パターンを最初から採用）。Phase 7 でのバグ発見・修正サイクルを 0 件に抑制。

## Run-2 メトリクス

`runs/run-2-japanese/METRICS.md` 参照。
