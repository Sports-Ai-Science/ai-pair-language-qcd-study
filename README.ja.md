# AI 支援ソフトウェア開発における出力言語効果

[English](README.md) | **日本語**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Pilot Study](https://img.shields.io/badge/study-pilot%20N%3D3-blue.svg)](analysis/reports/comparison-report-v2.md)
[![Model](https://img.shields.io/badge/model-claude--opus--4.7-purple.svg)](https://www.anthropic.com/claude)
[![Replications welcome](https://img.shields.io/badge/replications-welcome-brightgreen.svg)](CONTRIBUTING.md)

Claude の **出力言語選択**（英語 vs 日本語）が、同じ仕様のソフトウェアを構築する際の
QCD（品質・コスト・納期）にどう影響するかを測定したパイロット研究。

**ステータス**: 探索的パイロット、言語あたり N=3、単一実験者セッション
**実施日**: 2026-05-12 〜 2026-05-15
**モデル**: Anthropic Claude Opus 4.7 (`claude-opus-4-7`)
**対象ソフトウェア**: Vanilla JavaScript 関数電卓（10 受け入れ基準）

---

## TL;DR

日本語ネイティブのエンジニアが、Claude Code に同じ小さなプログラムを 2 回作らせた:
1 回目はすべての出力（コードコメント、ドキュメント、レビュー）を **英語** で
2 回目はすべて **日本語** で。差は以下の通り:

| 観点 | 英語 | 日本語 | 結論 |
| --- | ---: | ---: | --- |
| 1 ビルドあたりトークン消費 | 82,273 | 117,548 | 英語が **30% 安い** |
| 1 ビルドあたり所要時間 | 11.6 分 | 14.2 分 | 英語が **18% 速い** |
| 受け入れ基準達成率 | 10/10 | 10/10 | **同点** |
| クロス検証機能テスト | 15/15 | 15/15 | **同点** |
| 自己報告「発見・修正したバグ」 | 1.0/run | 0.0/run | **議論あり**（定義依存）|
| ソース LOC | 602 | 487 | 日本語が **19% 簡潔** |
| コメント行 | 13 | 21 | 日本語が **62% 多い** |
| 記述したテスト | 43 | 53 | 日本語が **25% 多い** |

**ヘッドライン発見**: よく引用される「日本語は 5.6 倍トークンが高い」という予測
（純粋な散文に対する `tiktoken` の校正に基づく）は、**実際のソフトウェアエンジニアリング
作業では誤り**。実効倍率は約 **1.4 倍**。理由は出力の大半が言語非依存のコード、
設定、英語スタイルのメタデータだから。

**最も重要な方法論的発見**: Claude の自然な生成ばらつき（同言語内、独立 agent 呼び出し
間）は、ほとんどの指標で言語効果と **同等またはそれ以上の大きさ**。AI 行動の QCD 比較
を確信を持って行うには、**条件あたり N ≥ 10 の反復**が必要。

詳細は `analysis/reports/comparison-report-v2.md` 参照。

---

## 実験で実際に作られたもの

各 agent は同じ 10 受け入れ基準の仕様から、それぞれ独立に動作する関数電卓を構築した。
以下は同一入力から 6 つの独立 Claude Opus agent が作り上げたもの。

### 6 つの電卓（初期表示、`index.html` をダブルクリックして開いた直後）

| 英語出力（3 反復）| 日本語出力（3 反復）|
| :---: | :---: |
| ![calc-en-1](docs/images/ui-calc-en-1.png) **calc-en-1** — 6 列コンパクト、オレンジ `=` | ![calc-jp-1](docs/images/ui-calc-jp-1.png) **calc-jp-1** — 5 列カラフル（紫=メモリ、青=関数、橙=演算、緑=`=`）|
| ![calc-en-2](docs/images/ui-calc-en-2.png) **calc-en-2** — 4 列広め、「Scientific Calculator」見出し付、青 `=` | ![calc-jp-2](docs/images/ui-calc-jp-2.png) **calc-jp-2** — 6 列の徹底色分け（水色=関数、紫=メモリ、桃=C/DEL）|
| ![calc-en-3](docs/images/ui-calc-en-3.png) **calc-en-3** — 5 列、操作系にアクセント色（橙=C/Backspace、青=`=`/`x²`）| ![calc-jp-3](docs/images/ui-calc-jp-3.png) **calc-jp-3** — 6 列、完全モノクロ、最も視覚的にミニマル |

**同言語内でも見た目のばらつきが大きい**。「英語は単色、日本語はカラフル」という直感は
**事実と異なる**: calc-jp-3 は 6 つの中で最もモノクロで、calc-en-1 が最もアクセント色が強い。
**英語反復間（en-1 vs en-2）の差は、英語平均と日本語平均の差と同程度**。
これは仮説 H6（言語内分散 ≈ 言語間分散）の視覚的証拠でもある。

### 1 ビルドあたりの規模感

10 AC 仕様から 1 つの Claude Opus agent が作ったもの（6 ビルドの中央値）:

| 成果物 | 規模（中央値）|
| --- | --- |
| ソースコード（`src/`）| 5 ファイル、約 510 LOC、3 JS モジュール + 1 HTML + 1 CSS |
| テスト（`tests/`）| 5 ファイル（4 `.mjs` ユニット + 1 `.spec.mjs` Playwright）|
| 計画ドキュメント（`docs/plans/`）| 5 markdown ファイル（Phase 01, 02, 03, 08, 10）|
| SC レビューエビデンス（`.claude/reviews/`）| 9 markdown ファイル（Phase 01〜08, 10）+ YAML frontmatter |
| Phase マーカー（`.phase-{start,end}-NN`）| 18 タイムスタンプファイル（9 Phase × 2）|
| METRICS.md | 1 ファイル（Phase 別ログ表）|
| 通過したテスト件数 | 31〜77（中央値 47）|
| agent 1 体あたりの所要時間 | 7.8〜14.8 分（中央値 11.7 分）|
| agent 1 体あたりのトークン消費 | 71K〜139K（中央値 102K）|

### 各 Phase が生み出したもの（calc-en-1 のサイズで例示）

| Phase | 成果物 | サイズ | 内容 |
| --- | --- | ---: | --- |
| **01 要件分析** | `docs/plans/01-requirements.md` + SC レビュー | 76 行、3.7 KB | 10 AC を test_layer 付きで再記述、NFR、スコープ外、リスク |
| **02 アーキ設計** | `docs/plans/02-architecture.md`（ADR）+ SC レビュー | 102 行、3.4 KB | "Vanilla JS classic-script IIFE" ADR、代替案検討（TS、modules、フレームワーク）、ファイル配置決定 |
| **03 詳細設計** | `docs/plans/03-design.md` + SC レビュー | 148 行、6.0 KB | モジュール契約（engine.evaluate, state shape）、UI グリッド、エラー分類、キーボードマップ、表示丸めルール |
| **04 実装** | `src/index.html`, `styles.css`, `engine.js`, `state.js`, `ui.js` + SC レビュー | 5 ファイル合計 ~510 LOC | 完全な電卓: パーサ、RPN 評価器、不変状態、DOM 配線 |
| **05 ユニットテスト** | `tests/engine.test.mjs`, `state.test.mjs` + SC レビュー | 30+14 件のユニットテスト | AC-01〜06, AC-09 を独立検証、engine.js のブランチカバレッジ約 95% |
| **06 統合テスト** | `tests/integration.test.mjs` + SC レビュー | 5 件 | engine ↔ state 連携（履歴記録、モード切替伝播、エラー後の状態破壊なし）|
| **07 システムテスト** | `tests/system.spec.mjs`（Playwright、`file://` 対象）+ SC レビュー | 7 件 | AC-08（キーボード入力）、AC-10（ローカル起動）、実 Chromium での E2E スモーク |
| **08 PR** | `docs/plans/08-pull-request.md` + 4-agent SC レビュー | 70 行、3.1 KB | DoD チェックリスト、AC 最終状態、見つかったバグと修正方法、ファイル変更サマリ |
| **10 振り返り** | `docs/plans/10-retrospective.md` + SC レビュー | 48 行、2.1 KB | agent 自身の声で Keep/Problem/Try、定量メトリクス |

Phase 3a（注釈サイクル）は人間レビューが必要なためスキップ、Phase 9（インシデント）は本番デプロイがないため N/A。

### 観測された品質差（具体例つき）

同じ仕様だが、agent ごとに選択が大きく異なる:

- **アルゴリズム選択**: calc-en-1 は **再帰下降パーサ**、calc-jp-1 は **shunting-yard**。
  正しさは同じだが、コードが違う。
- **コメント密度**: 英語平均 13 行、日本語平均 21 行（日本語コメントは 1 行あたりの密度も高い）。
- **テスト命名スタイル**:
  英語: `test('AC-01 addition', ...)`
  日本語: `test('AC-01 四則演算: 加算', ...)`（階層的命名でテスト数が増えるが、アサーション数は比例しない）
- **自己報告「バグ」の定義差**: 英語 agent は「テスト期待値の修正」もバグと数えた（合計 3 件）。
  日本語 agent は同じ作業を 0 件とした — 自己報告バイアスの記録は
  `analysis/reports/ds_perspective.md` § 7 を参照。
- **クロスバリデーション**: 同じ 15 件の標準テストケース（sin(0), sin(90 DEG),
  1/0, sqrt(-1), log10(1000) 等）を全 6 実装に当てたところ、**全 6 実装が
  正しい結果を返す or 正しく不正入力を拒否**。**機能品質は完全に等価**。

---

## このリポジトリの構成

```
ai-pair-language-qcd-study/
├── README.md / README.ja.md             ← この README
├── PLAN.md                              ← 実験設計（v2.3）
├── METHODOLOGY.md                       ← 実際の実行手順
├── LICENSE                              ← MIT
├── SYSTEM_BOUNDARY.md                   ← SD モデルのスコープ境界
├── MODEL_LIMITATIONS.md                 ← モデル仮定の正直なリスト
│
├── model/
│   └── language_experiment.xmile        ← 事前登録仮説生成に使った
│                                          System Dynamics モデル（ISO 18722）
│
├── analysis/
│   ├── scripts/                         ← 再現可能な分析パイプライン
│   │   ├── measure_token_density.py     ← H1 の tiktoken 校正
│   │   ├── run_comparison.py            ← SD ベースライン実行
│   │   ├── run_phased.py                ← SD Phase 別オーケストレータ
│   │   ├── sensitivity_sobol.py         ← SALib による Sobol 全次感度
│   │   ├── monte_carlo.py               ← 不確実性伝播、95% CI
│   │   ├── loop_dominance.py            ← フィードバックループ支配性分析
│   │   ├── draw_cld.py                  ← networkx で CLD 描画 + 自動ループ検出
│   │   ├── plot_bot.py                  ← Behavior over Time プロット
│   │   ├── aggregate_parallel.py        ← runs-fresh/ からメトリクス集約
│   │   ├── anova_parallel.py            ← 並列設計 ANOVA
│   │   ├── compare_predictions_v2.py    ← H1〜H6 検証
│   │   └── ds_analysis.py               ← データサイエンティスト視点での厳密再分析
│   └── reports/                         ← 全結果 JSON + 最終 markdown
│
├── tests/                               ← SD モデルの pytest 検証
│
├── runs-fresh/                          ← v2.4 並列設計（有効データ）
│   ├── calc-en-1/  ┐
│   ├── calc-en-2/  ├── 英語 3 反復、それぞれ完全なビルド
│   ├── calc-en-3/  ┘
│   ├── calc-jp-1/  ┐
│   ├── calc-jp-2/  ├── 日本語 3 反復
│   └── calc-jp-3/  ┘
│       └── （各々 src/, tests/, docs/plans/, .claude/reviews/, METRICS.md,
│            .phase-{start,end}-NN マーカーを含む）
│
└── runs-archive/                        ← v2.3 ABAB 単一セッション失敗試行
                                            （方法論的透明性のため保持）
```

### 2 つの試行

このリポジトリには同じ実験の試行が 2 つ含まれます:

1. **`runs-archive/`** — v2.3、ABAB 4 ラン交差設計、単一 Claude Code セッションで
   逐次実行。**方法論的に無効**。L2 セッション隔離が破れていたため、位置効果（逐次
   carryover）が時間系メトリクスの分散の 60% を占めた。透明性のため保持しているが、
   結論は引用しないこと。

2. **`runs-fresh/`** — v2.4、並列 sub-agent + 隔離コンテキスト、言語あたり 3 反復。
   **有効データセット**。`analysis/reports/comparison-report-v2.md` および
   `ds_perspective.md` の結論はすべてこのデータから。

---

## 分析の再現

```bash
# 1. Python 環境
python3.14 -m venv .venv
.venv/bin/pip install -r requirements.txt

# 2. トークン密度の再測定（tiktoken cl100k_base、約 5 秒）
.venv/bin/python analysis/scripts/measure_token_density.py

# 3. runs-fresh/ から agent 別メトリクスを集約
.venv/bin/python analysis/scripts/aggregate_parallel.py

# 4. ANOVA + 統計
.venv/bin/python analysis/scripts/anova_parallel.py
.venv/bin/python analysis/scripts/ds_analysis.py
.venv/bin/python analysis/scripts/compare_predictions_v2.py

# 5. （オプション）SD モデルと感度分析を再実行
.venv/bin/python analysis/scripts/run_comparison.py
.venv/bin/python analysis/scripts/sensitivity_sobol.py
.venv/bin/python analysis/scripts/monte_carlo.py
.venv/bin/python analysis/scripts/loop_dominance.py
.venv/bin/python analysis/scripts/draw_cld.py
.venv/bin/python analysis/scripts/plot_bot.py

# 6. SD モデル自己テスト（Sterman 検証スイート、pytest）
.venv/bin/pytest tests/ -v
```

単一の電卓ビルドを再実行する場合（`runs-fresh/calc-*/` のいずれか）:

```bash
cd runs-fresh/calc-en-1
npm install
npm test
node --test tests/system.spec.mjs
```

**ゼロから実験を再現する場合**（6 agent を spawn する手順）: `METHODOLOGY.md` 参照。

---

## 事前登録仮説（データ収集前にロック）

SD モデル `model/language_experiment.xmile` にエンコードし、agent を spawn する前に
PLAN.md v2.3 § 8 で凍結したもの。

| 仮説 | 予測 | 検証結果 |
| --- | --- | --- |
| H1 | JA/EN 総トークン比 ≈ **5.57x**（純粋散文での tiktoken 由来）| ❌ 逸脱 — 総トークンで観測 **1.43x** |
| H2 | JA は JA ネイティブユーザーの clarification 介入を減らす | ⚠️ 検証不能 — auto モードで介入ゼロ |
| H3 | 品質（バグ、AC 達成）に言語効果なし | ⚠️ 形式的に逸脱（JP の自己報告バグが少）。ただし定義依存の議論あり（`ds_perspective.md` 参照）|
| H4（改訂）| 並列設計により位置効果 ≈ 0 | ✅ 構造的にゼロ |
| H5 | B1 認知負荷自己均衡ループが支配的 | 検証不能 — モデル内主張 |
| H6（追加）| 言語内分散 < 言語間分散 | ❌ 反証 — ほとんどの指標で言語内 ≈ 言語間 |

---

## 正直な限界

上の数値から強い結論を出す前に、以下に目を通してほしい。各項目は「何が限界か」と
「結果の解釈をどう変えるべきか」をセットで説明している。

- **サンプル数が小さい（言語あたり N=3）。** これは確認研究ではなく、探索的パイロット。
  通常の有意水準 p < 0.05 を満たしたのは「active time（実作業時間）」1 指標のみ
  （Welch の t 検定で p = 0.048。Welch の t 検定は、サンプルが小さく分散が等しいと
  仮定できない 2 群の平均差を比べる検定）。さらに **Bonferroni 補正**（複数の指標を
  同時に検定するときに偽陽性を防ぐため、有意の基準を厳しくする標準的な調整）を
  適用すると、この差も有意ではなくなる。**数値差は示唆であって、証明ではない**と
  受け取ってほしい。

- **モデルもバージョンも 1 つだけ。** 6 ビルドはすべて同じ Claude Opus 4.7 を使用。
  同じ効果（あるいは方向性）が他モデル、他ベンダー、あるいは将来の Opus でも
  成り立つかは分からない。「このモデル、このタスク、この時点」を超えて一般化しないこと。

- **完全自動実行のため、ユーザの読解負荷を測れていない。** agent は人間の介入なしで
  動かしたので、ユーザが読み直したり質問し直したりする様子は観測していない。
  仮説 H2（「日本語出力は日本語ネイティブユーザの読解負荷を下げる」）はこの
  データセットでは **反証されたのではなく、検証不可能**。

- **アルゴリズム選択が言語と交絡している。** 後から気づいたのだが、英語 agent は
  ある種のパース方式（再帰下降）を選びがちで、日本語 agent は別の方式
  （shunting-yard）を選びがちだった。**交絡因子**とは、自分が測っているつもりの
  変数と一緒に動いてしまう第 3 の変数のこと。LOC・コメント・テスト数で「言語効果」
  に見えた差の一部は、実は「アルゴリズム選択効果」。

- **「バグ件数」は誰がどう数えたかに依存する。** バグはビルド中に agent が自己申告
  したもの。英語 agent と日本語 agent は「バグ」の定義を違う形で運用しており、
  たとえばリファクタリングを「バグ修正」として扱うかどうかが分かれた
  （`analysis/reports/ds_perspective.md` § 7 を参照）。バグ件数の差は、品質差では
  なく報告スタイルの差である可能性がある。

- **対象プログラムが小さい（~500 LOC）。** 電卓レベルではモジュール間設計、長寿命の
  状態、大規模な依存グラフは扱わない。より大きなコードベースでは、効果は大きくも
  小さくも、あるいは質的に異なる方向にも現れうる。

- **オーケストレータをリセットせずに連続実行した。** 6 回の spawn は単一の人間
  （この README の著者）が 1 つの連続セッションの中で行った。オーケストレータ自身の
  会話コンテキスト（過去の指示、思考状態、蓄積したプロンプト）が次の agent 起動に
  持ち越された可能性があり、各ランの起動条件に微妙なドリフトを生じさせたかも
  しれない。

---

## ライセンス

MIT — `LICENSE` 参照。

## 引用

この結果を自分の仕事で使用する場合:

```
Miyoshi, S. (2026). Output Language Effect on AI-Assisted Software Engineering:
A Pilot Study with Claude Opus 4.7.
Sports AI Science. https://github.com/Sports-Ai-Science/ai-pair-language-qcd-study
```

## 著者

三好修司 / Shuji Miyoshi（Sports AI Science）。Claude Code を用いて設計・実行。
