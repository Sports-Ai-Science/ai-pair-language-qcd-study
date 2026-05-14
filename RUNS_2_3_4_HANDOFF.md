# Handoff Instructions for Runs 2, 3, 4

Run-1 (English) is complete (`runs/run-1-english/`). Per the ABAB design
in `PLAN.md` v2.3, Runs 2, 3, 4 must be executed in **separate Claude Code
sessions** to obtain valid cross-over data. This file documents the
exact procedure.

## Why separate sessions are required

- L2 isolation: a single Claude Code session shares context across runs.
  If Runs 2-4 run in the same session as Run-1 (or as each other), the
  ANOVA `position effect` and `language effect` cannot be separated from
  carryover.
- The user-driven nature of separate-session execution is what the
  governance Pre-Run Checklist enforces.

## Sequence (per `PLAN.md` v2.3 §2)

| Run | Position | Output Lang | Subdir |
| --- | -------- | ----------- | ------ |
| 1 | 1 | English | `runs/run-1-english/` (DONE) |
| 2 | 2 | Japanese | `runs/run-2-japanese/` |
| 3 | 3 | English | `runs/run-3-english/` |
| 4 | 4 | Japanese | `runs/run-4-japanese/` |

## Procedure for each remaining Run (N = 2, 3, 4)

### Step 1 — Pre-Run Checklist (5 layers)

```bash
RUN_ID="run-N-LANG"            # e.g. "run-2-japanese"
LANG_FOR_OUTPUT="Japanese"     # or "English" depending on Run

MEM_DIR=~/.claude/projects/-Users-shujimiyoshi-Github-SportsAIScience/memory

# L1: MEMORY 退避
mv "$MEM_DIR/MEMORY.md" "$MEM_DIR/MEMORY.$RUN_ID.bak"
touch "$MEM_DIR/MEMORY.md"

# L3: Run 専用ディレクトリ作成
cd /Users/shujimiyoshi/Github/SportsAIScience/calc-experiment
mkdir -p runs/$RUN_ID/{src,tests,docs/plans,.claude/reviews,.claude/reviews-meta}
echo "Run-N ($LANG_FOR_OUTPUT Output) — START $(date -Iseconds)" \
  > runs/$RUN_ID/METRICS.md

# L4: Wait at least 10 minutes since the previous Run finished
# L5: Take at least a 30-minute break, ideally do an unrelated activity

# L2: CLOSE current Claude Code session, open a new terminal, then:
cd /Users/shujimiyoshi/Github/SportsAIScience/calc-experiment/runs/$RUN_ID
claude
```

### Step 2 — In the new Claude Code session

Paste this prompt verbatim (adjusted for the Run number and language):

> 言語比較実験の Run-N（出力言語: $LANG_FOR_OUTPUT）を実施します。
>
> 共通仕様は `../../PLAN.md` を参照、SRS の AC は同 §3 を共有。
> Run-1（英語）の参考実装は `../run-1-english/` にあります（参考、コピー禁止）。
>
> ガバナンス: `../../../claude-governance` の `full` profile に従い、
> Phase 1 → 2 → 3 → 3a → 4 → 5 → 6 → 7 → 8 → 10 を順次実施してください。
> 各 Phase の Exit Checkpoint に SC レビューを実行し、`.claude/reviews/`
> にエビデンスを残してください。
>
> 出力（コード/コメント/Plan/SRS/PR/SC レビュー/Commit）はすべて
> $LANG_FOR_OUTPUT で書いてください。会話は日本語のままでお願いします。
>
> 開始してください。

### Step 3 — During the Run

- Record interventions in `runs/$RUN_ID/METRICS.md` as they happen (4
  classes: clarification / correction / redirect / approval).
- Snapshot `/cost` output at each Phase Exit and append to METRICS.md.

### Step 4 — Post-Run

```bash
# Restore MEMORY
MEM_DIR=~/.claude/projects/-Users-shujimiyoshi-Github-SportsAIScience/memory
mv "$MEM_DIR/MEMORY.$RUN_ID.bak" "$MEM_DIR/MEMORY.md"

# Wait at least 10 minutes (cache TTL) and at least 30 minutes (user
# break) before starting the next Run.
```

## After All 4 Runs Complete

Run the analysis pipeline (to be implemented):

```bash
cd /Users/shujimiyoshi/Github/SportsAIScience/calc-experiment

# Per-run metric extraction (existing scripts may need extension to
# walk runs/* and consume METRICS.md + transcripts):
.venv/bin/python analysis/scripts/aggregate_metrics.py    # to be added

# ANOVA decomposition (language x position x interaction):
.venv/bin/python analysis/scripts/run_anova.py            # to be added

# Pre-Registered Hypothesis vs observation comparison:
.venv/bin/python analysis/scripts/compare_predictions.py  # to be added

# Final report:
# -> analysis/reports/comparison-report-final.md
```

The three analysis scripts above are TODOs — they were planned in
PLAN.md §16 but not yet implemented. Implementing them after Runs 2-4
data is in hand is sufficient.
