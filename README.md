# Output Language Effect on AI-Assisted Software Engineering

**English** | [日本語](README.ja.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Pilot Study](https://img.shields.io/badge/study-pilot%20N%3D3-blue.svg)](analysis/reports/comparison-report-v2.md)
[![Model](https://img.shields.io/badge/model-claude--opus--4.7-purple.svg)](https://www.anthropic.com/claude)
[![Replications welcome](https://img.shields.io/badge/replications-welcome-brightgreen.svg)](CONTRIBUTING.md)

A pilot study measuring how Claude's **output language choice** (English vs Japanese)
affects QCD (Quality, Cost, Delivery) when building the same specified software.

**Status**: Exploratory pilot, N=3 per language group, single experimenter session.
**Conducted**: 2026-05-12 to 2026-05-15
**Model**: Anthropic Claude Opus 4.7 (`claude-opus-4-7`)
**Subject software**: Vanilla JavaScript scientific calculator (10 acceptance criteria)

---

## TL;DR

When a Japanese-native engineer asks Claude Code to build the same small program
twice — once with all output (code comments, docs, reviews) in **English**, once in
**Japanese** — the differences are:

| Dimension | English | Japanese | Verdict |
| --- | ---: | ---: | --- |
| Token consumption per build | 82,273 | 117,548 | English **30% cheaper** |
| Wall-clock time per build | 11.6 min | 14.2 min | English **18% faster** |
| Acceptance criteria pass rate | 10/10 | 10/10 | **Tied** |
| Cross-validated functional tests | 15/15 | 15/15 | **Tied** |
| Self-reported "bugs found and fixed" | 1.0/run | 0.0/run | **Disputed** (definition-dependent) |
| Source LOC | 602 | 487 | Japanese **19% more concise** |
| Comment lines | 13 | 21 | Japanese **62% more comments** |
| Tests written | 43 | 53 | Japanese **25% more tests** |

**Headline finding**: the often-cited "Japanese costs 5.6× more tokens" prediction
(based on `tiktoken` calibration on pure prose) is **incorrect for real software
engineering work** — the effective multiplier is ~1.4×, because most output is
language-neutral code, configuration, and English-styled metadata.

**Most important methodological finding**: Claude's natural generation variance
(within-language, between independent agent invocations) is **comparable to or
larger than** the language effect on most metrics. Confident QCD comparisons of
AI behavior require **N ≥ 10 replicates per condition**.

See `analysis/reports/comparison-report-v2.md` for full analysis.

---

## What's in this repository

```
calc-experiment/
├── README.md                            ← you are here
├── PLAN.md                              ← experimental design (v2.3)
├── METHODOLOGY.md                       ← how the experiment was actually run
├── LICENSE                              ← MIT
├── SYSTEM_BOUNDARY.md                   ← scope boundary for SD model
├── MODEL_LIMITATIONS.md                 ← honest list of model assumptions
│
├── model/
│   └── language_experiment.xmile        ← System Dynamics model used to generate
│                                          pre-registered hypotheses (ISO 18722)
│
├── analysis/
│   ├── scripts/                         ← reproducible analysis pipeline
│   │   ├── measure_token_density.py     ← tiktoken calibration for H1
│   │   ├── run_comparison.py            ← SD baseline run
│   │   ├── run_phased.py                ← SD per-phase orchestrator
│   │   ├── sensitivity_sobol.py         ← SALib Sobol global sensitivity
│   │   ├── monte_carlo.py               ← uncertainty propagation, 95% CI
│   │   ├── loop_dominance.py            ← feedback loop dominance via deactivation
│   │   ├── draw_cld.py                  ← networkx-rendered CLD with auto loop detection
│   │   ├── plot_bot.py                  ← Behavior over Time plots
│   │   ├── aggregate_parallel.py        ← collect metrics from runs-fresh/
│   │   ├── anova_parallel.py            ← parallel-design ANOVA
│   │   ├── compare_predictions_v2.py    ← H1..H6 verdicts
│   │   └── ds_analysis.py               ← rigorous DS-grade re-analysis
│   └── reports/                         ← all results JSON + final markdown
│
├── tests/                               ← pytest validation of the SD model
│
├── runs-fresh/                          ← v2.4 PARALLEL design (the valid data)
│   ├── calc-en-1/  ┐
│   ├── calc-en-2/  ├── 3 English replicates, each is a complete build
│   ├── calc-en-3/  ┘
│   ├── calc-jp-1/  ┐
│   ├── calc-jp-2/  ├── 3 Japanese replicates
│   └── calc-jp-3/  ┘
│       └── (each contains src/, tests/, docs/plans/, .claude/reviews/, METRICS.md,
│            .phase-{start,end}-NN markers)
│
└── runs-archive/                        ← v2.3 ABAB single-session FAILED attempt
                                            (kept for methodological transparency)
```

### The two attempts

This repo contains two attempts at the same experiment:

1. **`runs-archive/`** — v2.3, ABAB 4-Run cross-over, executed sequentially in a
   single Claude Code session. **Methodologically invalid** because L2 session
   isolation was broken; the position effect (sequential carryover) accounted for
   60% of the variance in time-based metrics. Kept for transparency; do not cite
   its conclusions.

2. **`runs-fresh/`** — v2.4, parallel sub-agents with isolated contexts, 3
   replicates per language. **The valid dataset.** All conclusions in
   `analysis/reports/comparison-report-v2.md` and `ds_perspective.md` come from
   this run.

---

## Reproducing the analysis

```bash
# 1. Python environment
python3.14 -m venv .venv
.venv/bin/pip install -r requirements.txt

# 2. Re-measure token density (matches tiktoken cl100k_base; takes ~5 s)
.venv/bin/python analysis/scripts/measure_token_density.py

# 3. Aggregate the per-agent metrics from runs-fresh/
.venv/bin/python analysis/scripts/aggregate_parallel.py

# 4. ANOVA + statistics
.venv/bin/python analysis/scripts/anova_parallel.py
.venv/bin/python analysis/scripts/ds_analysis.py
.venv/bin/python analysis/scripts/compare_predictions_v2.py

# 5. (Optional) Re-run SD model and sensitivity analysis
.venv/bin/python analysis/scripts/run_comparison.py
.venv/bin/python analysis/scripts/sensitivity_sobol.py
.venv/bin/python analysis/scripts/monte_carlo.py
.venv/bin/python analysis/scripts/loop_dominance.py
.venv/bin/python analysis/scripts/draw_cld.py
.venv/bin/python analysis/scripts/plot_bot.py

# 6. Run the SD-model self-tests (Sterman validation suite, pytest)
.venv/bin/pytest tests/ -v
```

To re-run a single calculator build (in any one of `runs-fresh/calc-*/`):

```bash
cd runs-fresh/calc-en-1
npm install
npm test
node --test tests/system.spec.mjs
```

To **replicate the experiment from scratch** (spawn 6 agents): see `METHODOLOGY.md`.

---

## Pre-registered hypotheses (locked before data collection)

Encoded in the SD model `model/language_experiment.xmile` and frozen in PLAN.md
v2.3 § 8 before any agent was spawned.

| H | Prediction | Verdict |
| --- | --- | --- |
| H1 | JA/EN total token ratio ≈ **5.57×** (from tiktoken on pure prose) | ❌ DEVIATED — observed **1.43×** for total tokens |
| H2 | JA reduces clarification interventions for JA-native user | ⚠️ INDETERMINATE — auto mode produced zero interventions |
| H3 | Quality (defects, AC pass) shows no language effect | ⚠️ DEVIATED-FORMALLY (JP fewer self-reported bugs), but disputed by definition (see `ds_perspective.md`) |
| H4 (revised) | Position effect ≈ 0 by parallel design | ✅ STRUCTURALLY ZERO |
| H5 | B1 cognitive-load self-balancing loop is dominant | NOT TESTABLE — model-internal claim |
| H6 (added) | Within-language variance < between-language variance | ❌ REFUTED — within ≈ between for most metrics |

---

## Honest limitations

- **N = 3 per group** is exploratory. Statistical significance is reached for active
  time only (Welch's t p=0.048, but not after Bonferroni correction).
- All 6 builds are by **the same Claude Opus version**; results may not generalize
  to other models or future versions.
- **Auto-mode**: agents had no human intervention. The "comprehension burden"
  dimension (H2) cannot be evaluated from this dataset.
- **Confounders identified post-hoc**: agents made different algorithmic choices
  (recursive descent vs. shunting-yard). Some of the "language effect" is actually
  algorithm-choice effect.
- **"Bug" is defined by self-report**, and JA agents and EN agents apply the
  definition differently (see `analysis/reports/ds_perspective.md` § 7).
- The product (calculator) is small (~500 LOC); larger projects may show different
  dynamics.
- Single experimenter session; orchestrator context (this README's author) was not
  reset between agent spawns.

---

## License

MIT — see `LICENSE`.

## Citing

If you use these results in your own work:

```
Miyoshi, S. (2026). Output Language Effect on AI-Assisted Software Engineering:
A Pilot Study with Claude Opus 4.7.
Sports AI Science. https://github.com/<your-org>/calc-experiment
```

## Author

三好修司 / Shuji Miyoshi (Sports AI Science). Designed and executed with Claude Code.
