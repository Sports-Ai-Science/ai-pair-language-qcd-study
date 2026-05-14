# Project Plan v2.3 — Output Language Comparison Pilot

**Status**: APPROVED (SC 8.6 / Systems Thinking 8.3, 2 iterations)
**Date**: 2026-05-12
**Owner**: 三好修司 (Sports AI Science)
**Governance**: `claude-governance` (`full` profile)
**Design**: ABAB 4-Run cross-over with strong isolation

---

## 1. Purpose

Claude Code の **出力言語**（英語 vs 日本語）が QCD・トークン消費・自律性に与える
影響を、**探索的パイロット研究** (N=2 or 4) として「どの指標に有意差の兆候が出る
か」「支配的な交絡因子は何か」を抽出する。

**結論は運用判断に直結させない**。中間レポートで追加 Run の要否を判定する。

---

## 2. Comparison Design — ABAB 4-Run Cross-Over

### Run 定義

| Run 種別 | 会話言語 | Output 言語（コード/コメント/Plan/SRS/PR/SC レビュー/Commit）|
| --- | --- | --- |
| **Run-A** | 日本語 | **英語** |
| **Run-B** | 日本語 | **日本語** |

ユーザーとの会話画面は両 Run とも日本語固定。SRS 本体は両 Run で共有（中立化のため英語）。

### 実施シーケンス: A → B → A → B（ABAB 設計）

```
Run-1  Run-A (English) — 位置1, 疲労=低
Run-2  Run-B (Japanese)— 位置2, 疲労=中低
Run-3  Run-A (English) — 位置3, 疲労=中高
Run-4  Run-B (Japanese)— 位置4, 疲労=高
```

**ABAB を採用する理由**（ABBA 比較）:
- 各言語内で順序効果を直接検証可能（E1 vs E3, J2 vs J4）
- ABBA の "J→J 連続ブロック" 問題を回避
- ANOVA で言語効果・位置効果・交互作用を分離して推定可能（§10b 参照）
- 「本来は順序で変わらないはず」という仮説を**直接検定**できる

### 4 Run 強制実施

第 2 セット要否判断は廃止。中間レポートでの打ち切りなし。  
**4 Run 全実施を必須**とする（ANOVA 分解と順序効果検定に最低限の標本数）。

---

## 3. Product Scope (関数電卓)

ローカル動作の関数電卓（静的 HTML/CSS/JS、`index.html` をブラウザで開けば動く）。

### Acceptance Criteria

| AC ID | 内容 | test_layer |
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

**AC-10 G/W/T**:
```
Given: クリーンな環境（npm install/サーバ起動なし）
When:  index.html を Chrome でダブルクリック起動
Then:  5 秒以内に電卓 UI が描画され、最初の演算が成功する
```

### Out of Scope
グラフ描画 / 複素数 / 行列 / 永続化 / 多言語 UI / フレームワーク

---

## 4. Process

### Profile: `full` (10 phases)

実行: `1 → 2 → 3 → 3a → 4 → 5 → 6 → 7 → 8 → 10`

Phase 2 はミニマル ADR（"単一 HTML, Vanilla JS, 状態は IIFE 閉包" を 1 枚）。
Phase 9 は production デプロイなしのため N/A。

### 言語ルール（Phase 別）

| Phase | Run-A | Run-B |
| --- | --- | --- |
| 1, 2, 3a | 英語 | 日本語 |
| 3 SRS（共有）| 英語 | 英語 |
| 4–7（コード）| 英語 | 日本語コメント |
| 8 PR / 10 Retro | 英語 | 日本語 |
| SC レビュー | 英語 | 日本語 |
| 会話 | **日本語** | **日本語** |

---

## 5. Pre-Run Checklist（強隔離プロトコル）

ABAB 設計の前提として、各 Run 間で以下の強隔離を必須とする。隔離が破れると
Carryover が ANOVA 結果を汚染し、ABAB の利点（順序効果検定）が消える。

### 隔離の 5 層

| Layer | 対象 | 手段 |
| --- | --- | --- |
| L1 | 明示メモリ (MEMORY.md) | 退避＋空ファイル化 |
| L2 | セッションコンテキスト | 前 Run の Claude Code セッションを完全終了 |
| L3 | 作業ディレクトリ | Run 専用の `runs/run-<n>-<lang>/` で実施 |
| L4 | プロンプトキャッシュ | Run 間に最低 10 分（キャッシュ TTL=5min の 2 倍）|
| L5 | ユーザー脳内状態 | Run 間に最低 30 分の休憩 + 別 Run 開始時に短い瞑想/散歩 |

### 各 Run 開始前に実行

```bash
# === L1: MEMORY 退避 ===
RUN_ID="run-$N-$LANG"  # 例: run-1-english, run-2-japanese
MEM_DIR=~/.claude/projects/-Users-shujimiyoshi-Github-SportsAIScience/memory
mv "$MEM_DIR/MEMORY.md" "$MEM_DIR/MEMORY.$RUN_ID.bak"
touch "$MEM_DIR/MEMORY.md"

# === L2: 前セッション完全終了 ===
# Claude Code を `exit`、ターミナルウィンドウを閉じる、新規ターミナル起動

# === L3: 別ディレクトリへ ===
cd /Users/shujimiyoshi/Github/SportsAIScience/calc-experiment/runs/$RUN_ID

# === L4: キャッシュ無効化待機 ===
# 前 Run 終了から 10 分以上経過していることを確認
date  # 時刻記録

# === L5: 休憩・リセット ===
# Run 間 30 分以上の休憩、別作業や散歩で言語モード切替

# === Run 実施 ===
claude

# === Run 完了後 ===
mv "$MEM_DIR/MEMORY.$RUN_ID.bak" "$MEM_DIR/MEMORY.md"
```

### 時間帯統制
全 Run を **平日 10–12 時** または **14–16 時** の 2 時間枠で実施。Run 間に 30 分以上の休憩、複数日に分散（§10 Schedule 参照）。

---

## 6. Metrics (QCD + Token + Four Keys + Automation)

### 6.1 Four Keys 風コア指標

| 元 Four Keys | 本実験版 | 単位 |
| --- | --- | --- |
| Deployment Frequency | **Phase Throughput** | phases/hour |
| Lead Time for Changes | **AC Lead Time** | min/AC |
| Change Failure Rate | **SC Review Failure Rate** | % |
| Mean Time to Restore | **Mean Time to Fix (MTTF)** | min |

### 6.2 Q: Quality
- AC Pass Rate, Unit Coverage, SC Failure Rate, MTTF, 残存欠陥数

### 6.3 C: Cost
- **Output Tokens (主)**, **Token Density (主)**, Total Tokens (副), USD Cost
- **ユーザー介入回数（4 分類）**: clarification / correction / redirect / approval
  - Quality-Driven = correction + redirect
  - Comprehension-Driven = clarification

### 6.4 D: Delivery
- 全体期間 / Wall Clock Active / **Net Active Time（主, server latency 除外後）**
- Phase Throughput, AC Lead Time
- Server Latency p95（**ガード条件**: Run 間で 2x 超なら Delivery 比較保留）

### 6.5 Automation
- Quality-Driven Intervention Rate / Comprehension-Driven Intervention Rate
- Autonomy Rate, First-Pass Rate, Self-Correction Rate, Course-Correction Count

### 6.6 2 階層測定: Product + Phase 別
- **Product 全体 QCD**: 完成プロダクトの集約 QCD
- **Phase 別 QCD**: 工程別の言語効果差を抽出（10 Phase × 全指標）

詳細指標表とテンプレは `analysis/reports/comparison-report.md` に出力。

---

## 7. Data Collection

| ソース | 場所 | 取れるもの |
| --- | --- | --- |
| (A) JSONL Transcript | `~/.claude/projects/-Users-shujimiyoshi-Github-SportsAIScience/<sessionId>.jsonl` | 全メッセージ + timestamp + usage |
| (B) `/cost` | スラッシュコマンド | トークン累計 + USD |
| (C) SC エビデンス | `runs/<run>/.claude/reviews/` | status, head, agents |
| (D) `reviews-meta/` | `runs/<run>/.claude/reviews-meta/` | started_at / decided_at（MTTF 用、本体汚染回避）|
| (E) Git ログ | `git log` | Phase Exit コミット時刻 |
| (F) テスト結果 | vitest / playwright | カバレッジ・PASS/FAIL |
| (G) METRICS.md | `runs/<run>/METRICS.md` | 中断区間, 介入分類（手記録）|
| (H) AC テスト | `tests/ac/*` | AC Pass Rate（自動）|

凡例: 🟢 自動 / 🟡 半自動 / 🔴 手動

| 指標 | 区分 | 取得手順 |
| --- | --- | --- |
| AC Pass Rate | 🟢 | vitest + playwright JSON reporter 集計 |
| Coverage | 🟢 | `vitest --coverage --reporter=json-summary` |
| SC Failure Rate | 🟢 | `.claude/reviews/*.md` の status frontmatter grep |
| MTTF | 🟡 | `reviews-meta/<n>-<phase>.json` の started_at/decided_at 差分 |
| Output Tokens | 🟢 | JSONL → `jq` で `assistant.message.usage.output_tokens` 合計 |
| Token Density | 🟢 | output_tokens / output_chars（コードブロック含む/除外の 2 系統）|
| ユーザー介入数（4 分類）| 🟢 + 🔴 | JSONL から「真のユーザー」抽出 + METRICS.md で型分類 |
| 全体期間 | 🟢 | JSONL の min/max timestamp |
| Net Active Time | 🟢 | Active − Latency 中央値 |
| Server Latency p95 | 🟢 | user→assistant ペアのタイムスタンプ差 |
| Phase 境界 | 🟢 | `chore(phase-exit):` 規約コミットのタイムスタンプ |

スクリプト: `analysis/scripts/`（既存の SD 解析スクリプト群と同居）

---

## 8. SD Conceptual Aid

実装済み標準 SD スタック (PySD + SALib + pint + pytest, ISO 18722 XMILE) で
**事前登録仮説 (Pre-Registration)** を生成。実測値とのキャリブレーションは
Phase 1 完了後。

### Pre-Registered Hypotheses（実測前に明文化）

H1: **Cost 軸で Run-A（英語）が確実に優位**
- 根拠: Monte Carlo 95% CI で重なりなし
- 予測: Token ratio JA/EN ≈ 5.57x（実測 α_token_eff から）

H2: **Comprehension Burden 軸で Run-B（日本語）が確実に優位**
- 根拠: Monte Carlo 95% CI で重なりなし
- 予測: clarification_count EN ≈ 91 vs JA ≈ 41

H3: **Quality 軸（修正・欠陥）は言語効果検出不能**
- 根拠: Monte Carlo 95% CI が大きく重なる
- 予測: discovered_defects EN ≈ JA

H4: **Phase × 言語のハイブリッド最適が存在**
- 根拠: prose Phase は言語差大、code Phase は言語差ほぼなし
- 予測: Phase 1, 3, 3a, 8, 10 → JA、Phase 4, 5, 6, 7 → EN が最適

H5: **B1 ループ（認知負荷の自己均衡）が最支配的**
- 根拠: Loop dominance analysis で +5060% 影響度

実測完了後、**5 件の予測の的中率**を報告書に含める（モデル予測能力のキャリブレーション）。

### モデル成果物
- `model/language_experiment.xmile` (v0.2.0)
- `analysis/reports/cld.png` (CLD)
- `analysis/reports/loop_dominance.json`
- `analysis/reports/monte_carlo.json`
- `analysis/reports/sobol_sensitivity.json`
- `analysis/reports/phased_runs.json`
- `analysis/reports/tiktoken_calibration.json`

---

## 9. Bias Control

| バイアス源 | 対策 |
| --- | --- |
| 順序効果 | **ABAB 4-Run 設計 + ANOVA で位置効果を直接推定**（§12）|
| Carryover（Claude/User 学習）| 強隔離 5 層プロトコル（§5）+ ANOVA で交互作用検定 |
| Memory bleed | Pre-Run Checklist L1 で MEMORY.md 退避（必須）|
| 学習効果 | コンテキスト分離、別セッション |
| モデル差 | claude-opus-4-7 固定 |
| ガバナンス差 | 同一参照 |
| AC 解釈差 | test_layer メタ + 機械検証 |
| 入力トークン非対称 | Output Tokens / Token Density 主指標 |
| Server Latency | Net Active Time + p95 ガード（2x 超で保留）|
| 小サンプル | 探索的パイロットと再定義、N=4 と明記 |
| ユーザー疲労 | Run 間休憩、時間帯固定 |

---

## 10. Schedule（4 Run 強制実施）

### 1 Run の内訳

| Phase | 想定時間 |
| --- | --- |
| Phase 0（実験全体セットアップ + 計測スクリプト + テスト + SD モデル）| **完了** ✅ |
| Pre-Run Checklist（強隔離プロトコル）| 15 分 |
| Phase 1 | 15 分 |
| Phase 2（ADR）| 15 分 |
| Phase 3（共有 SRS 含む、Run-1 のみ）| 30 分 |
| Phase 3a | 10 分 |
| Phase 4 | 60 分 |
| Phase 5 | 30 分 |
| Phase 6 | 20 分 |
| Phase 7 | 30 分 |
| Phase 8 | 10 分 |
| Phase 10 | 15 分 |
| **1 Run 小計** | **約 4 時間 15 分** |

### 4 Run 全体スケジュール（疲労分散のため複数日推奨）

```
Day 1
  10:00–14:15  Run-1 (English) — Phase 1〜10
  14:15–14:45  休憩（30 分以上）+ 隔離プロトコル
  14:45–19:00  Run-2 (Japanese) — Phase 1〜10  ※Phase 3 は Run-1 SRS 共有

Day 2
  10:00–14:15  Run-3 (English)
  14:15–14:45  休憩 + 隔離プロトコル
  14:45–19:00  Run-4 (Japanese)

Day 3
  10:00–11:00  ANOVA 分析実行
  11:00–12:00  Pre-Registered Hypotheses vs 実測の比較
  13:00–14:00  最終比較レポート作成
```

### 合計

| 項目 | 時間 |
| --- | --- |
| 4 Run × 4 時間 15 分 | 17 時間 |
| Run 間休憩・隔離 | 2 時間 |
| ANOVA + 仮説検証 + 最終レポート | 3 時間 |
| **合計** | **約 22 時間（3 日分散）** |

ABAB 設計のため第 2 セット要否判断は廃止、4 Run 全実施が前提。

---

## 11. Risks

| リスク | 影響 | 対策 |
| --- | --- | --- |
| 統計的検出力不足 | 結論の誤帰属 | 探索的パイロット明記、傾向抽出に限定 |
| Memory bleed | 後発 Run 有利 | Pre-run-checklist 必須化 |
| 入力トークン非対称 | C 比較ノイズ | Output Tokens / Density 主指標 |
| Profile 検証失敗 | ガバナンス Gate 落ち | `full` profile 採用 |
| 介入の言語バイアス | C/Auto 比較ノイズ | 4 分類別評価 |
| AC のテスト層誤分類 | Q 過小評価 | test_layer メタ + Playwright 併用 |
| frontmatter 拡張で Gate 失敗 | プロセス停止 | reviews-meta/ 別ファイル |
| Server 負荷バラツキ | D 比較不正確 | 時間帯固定 + p95 ガード |
| 計測スクリプトのバグ | 結論無効化 | Phase 0 で測定器テスト完了（27/27 PASS）|
| Playwright 環境差 | Phase 7 結果不一致 | Chromium バンドル版固定 + 解像度・locale・timezone 固定 |
| ユーザー疲労 | 介入頻度低下 | 1 セットを 1 日に圧縮せず、Run 間に休憩 |

---

## 12. ANOVA 分析計画

ABAB 設計の主目的: **言語効果・位置効果・交互作用を分離して推定する**。

### 12.1 観測モデル

各指標 Y（例: Output Tokens, Net Active Time, Cognitive Load）について:

```
Y_run = μ + α_lang + β_position + γ_(lang × position) + ε

  α_lang     : 言語の主効果 (E vs J)
  β_position : 位置（疲労・学習）の主効果 (1〜4)
  γ          : 言語 × 位置の交互作用
  ε          : 残差（測定誤差）
```

### 12.2 直接検定可能な仮説

| 仮説 | 検定方法 | 解釈 |
| --- | --- | --- |
| H0_lang: 言語効果なし | mean(Run-1, Run-3) vs mean(Run-2, Run-4) | 差なし → 言語選択は影響しない |
| H0_position: 順序効果なし | Run-1 vs Run-3（E 内）, Run-2 vs Run-4（J 内）| 差なし → 「本来変わらない」が成立 |
| H0_interaction: 交互作用なし | (Run-1 − Run-3) vs (Run-2 − Run-4) | 差なし → 言語効果は疲労状態に頑健 |

### 12.3 結果の解釈マトリクス

| α_lang | β_position | γ_interaction | 解釈 |
| --- | --- | --- | --- |
| 有意 | 非有意 | 非有意 | **理想**: 純粋な言語効果が観測された、結論信頼可 |
| 有意 | 有意 | 非有意 | 言語効果あり、ただし疲労効果も独立して存在 |
| 有意 | 非有意 | 有意 | 言語効果あり、ただし疲労状態で効きが変わる |
| 非有意 | 有意 | 非有意 | **重大**: 観測差は全て位置由来、言語効果なし |
| 非有意 | 非有意 | 非有意 | 効果検出不能、N=4 が小すぎる可能性 |
| 非有意 | 有意 | 有意 | 複雑な交互作用のみ存在、追加実験必要 |

### 12.4 ANOVA 実装

`analysis/scripts/run_anova.py` を Phase 0 完了後に追加実装:
```python
import statsmodels.api as sm
from statsmodels.formula.api import ols

# 各指標について
model = ols('Y ~ C(lang) + C(position) + C(lang):C(position)', data=df).fit()
anova_table = sm.stats.anova_lm(model, typ=2)
```

### 12.5 効果量の報告

統計的有意性（p 値）に加え、**効果量（partial η²、Cohen's f）**を報告:
- η² < 0.06: 小
- 0.06 ≤ η² < 0.14: 中
- η² ≥ 0.14: 大

N=4 の小サンプルでは p 値より効果量が解釈の主軸。

---

## 13. Deliverables

```
calc-experiment/
├── PLAN.md (this file)
├── README.md, requirements.txt, .gitignore
├── SYSTEM_BOUNDARY.md
├── MODEL_LIMITATIONS.md
├── model/
│   └── language_experiment.xmile (v0.2.0)
├── analysis/
│   ├── scripts/  (8 ツール)
│   └── reports/  (各種計測結果 + comparison-report-final.md)
├── tests/  (27 テスト, Sterman 6/12 + 介入 7 + dt 収束 6)
└── runs/
    ├── run-1-english/        # ABAB position 1
    ├── run-2-japanese/       # ABAB position 2
    ├── run-3-english/        # ABAB position 3
    └── run-4-japanese/       # ABAB position 4
        ├── index.html
        ├── tests/, src/, docs/plans/
        ├── .claude/reviews/, .claude/reviews-meta/
        └── METRICS.md
```

---

## 14. Phase 0 完了判定

| DoD 項目 | 状態 |
| --- | --- |
| ディレクトリ構造 | ✅ |
| Python 環境（venv 3.14）| ✅ |
| 依存性管理（requirements.txt）| ✅ |
| README/SYSTEM_BOUNDARY/LIMITATIONS | ✅ |
| SD モデル（XMILE v0.2.0）| ✅ |
| 計測スクリプト（8 件）| ✅ |
| pytest 全 PASS（27/27）| ✅ |
| Sterman 検証 6/12 達成 | ✅ |
| Pre-Registered Hypotheses（5 件）| ✅ |
| SC 再レビュー APPROVED（8.6）| ✅ |
| Systems Thinking 再レビュー APPROVED（8.3）| ✅ |

**Phase 0 完了** ✅

---

## 15. Changelog

| Version | Date | Changes |
| --- | --- | --- |
| v1.0 | 2026-05-12 | 初版（基本計画）|
| v1.1 | 2026-05-12 | Four Keys 風指標、Automation 度、ユーザー介入回数、実時間/期間追加 |
| v1.2 | 2026-05-12 | 取得方法（自動/半自動/手動分類）追加 |
| v2.0 | 2026-05-12 | SC レビュー反映: 探索的パイロット化、Memory bleed 対策、Token Density、full profile |
| v2.1 | 2026-05-12 | QCD 2 階層化（Product + Phase 別）、テスト戦略補強（プロダクト + 計測スクリプト）|
| v2.2 | 2026-05-12 | Phase 0 完了確定。標準 SD スタック実装（PySD + SALib + pint + pytest）、4 介入ストック、B2 ループ、Pre-Registered 仮説 5 件、両パネル APPROVED |
| **v2.3** | **2026-05-12** | **ABAB 4-Run 設計に変更（疲労効果と学習効果が逆向きの問題を ANOVA で分離）。強隔離プロトコル 5 層（MEMORY/Session/Dir/Cache/User）。第 2 セット要否判断を廃止し 4 Run 強制実施。ANOVA 分析計画追加（言語×位置×交互作用の分解）** |

---

## 16. Next Action

**Phase 1（実測）に着手**: ABAB シーケンスの **Run-1（English）** から開始。

```bash
# === Pre-Run Checklist (強隔離 5 層) ===
RUN_ID="run-1-english"
MEM_DIR=~/.claude/projects/-Users-shujimiyoshi-Github-SportsAIScience/memory

# L1: MEMORY 退避
mv "$MEM_DIR/MEMORY.md" "$MEM_DIR/MEMORY.$RUN_ID.bak"
touch "$MEM_DIR/MEMORY.md"

# L3: Run 専用ディレクトリ作成
mkdir -p runs/$RUN_ID/{src,tests,docs/plans,.claude/reviews,.claude/reviews-meta}
echo "Run-1 (English Output) — START $(date -Iseconds)" > runs/$RUN_ID/METRICS.md

# L2: 前セッション完全終了 → 新規ターミナル → cd
cd /Users/shujimiyoshi/Github/SportsAIScience/calc-experiment/runs/$RUN_ID
claude

# その後 /sc:brainstorm で Phase 1（要件分析）を実施
```

### 4 Run 完了後

```bash
# ANOVA 分析実行
.venv/bin/python analysis/scripts/run_anova.py

# Pre-Registered Hypotheses vs 実測比較
.venv/bin/python analysis/scripts/compare_predictions.py

# 最終レポート生成
# → analysis/reports/comparison-report-final.md
```
