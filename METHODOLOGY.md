# Methodology

How the v2.4 parallel experiment (the valid dataset) was actually run.
For the experimental design rationale, see `PLAN.md`.

## Stack

| Layer | Tool | Version |
| --- | --- | --- |
| AI model | Anthropic Claude Opus | 4.7 (`claude-opus-4-7`) |
| Orchestrator | Claude Code | (default at experiment time) |
| SD modelling | PySD + XMILE (ISO 18722) | 3.14.3 |
| Sensitivity | SALib | latest (≥ 1.5) |
| Dimensional analysis | pint | 0.25.3 |
| Tokenizer reference | tiktoken (`cl100k_base`) | latest |
| Calculator runtime | Vanilla JS, classic `<script>` + IIFE globals | — |
| Test runner | Node 25 `node --test` (no external test framework) | 25.x |
| Browser test | Playwright (Chromium 148, 1920×1080, en-US, Asia/Tokyo) | 1.60+ |

## Pre-flight (one-time setup)

```bash
cd calc-experiment
git init
git add -A && git commit -m "Initial baseline"
echo ".claude/worktrees/" >> .gitignore   # not strictly needed for this repo
mv runs runs-archive 2>/dev/null || true   # only on re-run
```

The orchestrator (Claude Code session) also needs `MEMORY.md` cleared:

```bash
MEM_DIR=~/.claude/projects/<encoded-project-path>/memory
mv "$MEM_DIR/MEMORY.md" "$MEM_DIR/MEMORY.bak"
touch "$MEM_DIR/MEMORY.md"
```

## Spawning the 6 parallel agents

In a single Claude Code orchestrator message, invoke the `Agent` tool **6 times in
parallel** (one tool-use block per agent). Each agent gets:

- `subagent_type: "general-purpose"`
- `model: "opus"` (Claude Opus 4.7) — must match across agents to compare cleanly
- `name: "calc-en-1" | "calc-en-2" | "calc-en-3" | "calc-jp-1" | "calc-jp-2" | "calc-jp-3"`
- `run_in_background: true` — so the orchestrator can spawn them all without blocking
- An identical prompt template, varying only:
    - working directory (`runs-fresh/calc-{en,jp}-{1,2,3}/`)
    - output language directive (English or Japanese)
    - a small diversification ID (random hex string) to mildly perturb generation

The exact prompt template is below. Critical points:

- The agent must read **only PLAN.md § 3** of the parent — not other sections,
  to avoid leaking experiment-design context (Hawthorne effect).
- The agent must record `date -Iseconds > .phase-start-<NN>` and `.phase-end-<NN>`
  marker files at each phase boundary — these are how the aggregator computes
  per-phase elapsed times.
- The agent must **not** use ES modules in the calculator — they fail under `file://`
  due to CORS, which directly violates AC-10 (local launch). Use classic `<script>`
  tags with IIFE-bound `globalThis.CalcEngine` and `globalThis.CalcState`.
- The agent runs `npm test && node --test tests/system.spec.mjs` after Phase 7 and
  must report actual pass/fail counts.
- The agent's final message must include per-phase elapsed time, total time, test
  pass counts, bugs found and fixed, and a token-usage estimate.

The `Agent` tool returns a `usage.total_tokens` figure per agent — that is the
authoritative token measurement (no `/cost` snapshots needed).

## Why NOT git worktrees

The plan called for `isolation: "worktree"` on each `Agent` call, but the
orchestrator's working directory was the SportsAIScience parent directory which
isn't a git repository. The Agent tool's worktree feature requires the
orchestrator's CWD to be inside a git repo. Falling back to manual directory
isolation (creating `runs-fresh/calc-{lang}-{n}/` ahead of time and pointing each
agent at one) preserves filesystem isolation, and context isolation comes from
sub-agent invocation regardless. The trade-off is that you don't get automatic
worktree cleanup.

## Aggregation

After all 6 agents complete (typically within 15 minutes of wall clock once started
in parallel), run:

```bash
.venv/bin/python analysis/scripts/aggregate_parallel.py     # → parallel_aggregated.{json,csv}
.venv/bin/python analysis/scripts/anova_parallel.py         # → anova_parallel.json
.venv/bin/python analysis/scripts/ds_analysis.py            # → ds_analysis.json
.venv/bin/python analysis/scripts/compare_predictions_v2.py # → predictions_vs_observed_v2.json
```

The DS-grade analysis includes Welch's t-test, Mann-Whitney U, Cliff's δ,
Cohen's d, bootstrap 95% CI on the difference of means, and a power analysis
to estimate the N per group needed for α = 0.05 with 80% power.

## Validation of the SD model

The pre-registered SD model has 27 pytest checks across:
- dimensional consistency (pint, 5 tests)
- extreme conditions (Sterman validation #4, 9 tests)
- intervention dynamics (7 tests)
- numerical integration robustness (Sterman #6, 6 tests)

Run with `.venv/bin/pytest tests/ -v`.

## Replication caveats

- The orchestrator session is itself a Claude Code session. Its context (planning
  history, prior reads of governance documents, this README's author) is **not
  reset** between spawns. This contaminates how the orchestrator phrases the agent
  prompts. A truly clean replication would have a different person craft the
  prompts.
- The agent prompts contain English instructions even for Japanese-output agents
  (you're reading the Japanese instructions in the agent prompt, but the Claude
  Code system prompt itself remains English). This is unavoidable in current Claude
  Code.
- Network conditions and Anthropic API load differ across runs and could affect
  wall-clock timing. The phase markers (timestamp files) capture clock time, not
  API latency — if you suspect API load was variable, separately log per-call
  latency.

## Cost

Approximate USD cost for the 6-agent v2.4 run, at 2026-05 Claude Opus pricing:

| Item | Tokens | USD (est.) |
| --- | ---: | ---: |
| 6 agents × ~100k tokens average | ~600,000 | ~$10 |
| Orchestrator overhead (planning, aggregation) | ~150,000 | ~$2 |
| **Total** | **~750k** | **~$12** |

Adding more replicates is cheap: each additional agent adds about $2.
