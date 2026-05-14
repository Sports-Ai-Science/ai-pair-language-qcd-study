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

- **言語あたり N=3** は探索的。統計的有意性に達したのは active time のみ
  （Welch's t p=0.048、ただし Bonferroni 補正後は不通過）。
- 6 ビルドすべて **同一の Claude Opus バージョン** によるもの。他モデルや将来バージョン
  への一般化は保証されない。
- **Auto モード**: agent には人間介入なし。「読解負荷」次元（H2）はこのデータからは
  評価できない。
- **事後発見の交絡因子**: agent は異なるアルゴリズム選択をした（再帰下降 vs
  shunting-yard）。「言語効果」と思われたものの一部は実は **アルゴリズム選択効果**。
- **「バグ」は自己報告で定義**され、JA agent と EN agent はその定義を違う形で適用
  （`analysis/reports/ds_perspective.md` § 7 参照）。
- 対象プロダクト（電卓）は小規模（~500 LOC）。大規模プロジェクトでは異なるダイナミクスを
  示す可能性あり。
- 単一実験者セッション。オーケストレータ（この README の著者）コンテキストは
  agent spawn 間でリセットされていない。

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
