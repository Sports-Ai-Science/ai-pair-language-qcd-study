# Output Language Experiment

QCD と Token 効率の比較のため、Claude Code の出力言語（英語 vs 日本語）を変えて
小規模な関数電卓開発を 2 ラン実施し、計測する**探索的パイロット研究**。

## Scope

- Subject: 静的 HTML/CSS/JS のローカル動作な関数電卓
- Process: ガバナンス `claude-governance` の `full` profile (10 phases)
- Metrics: QCD（Product 全体 + Phase 別）+ Token + Four Keys 風 + Automation 度
- N: 2 ラン × 1–2 セット = N=2 or N=4（探索的、結論は運用判断に直結させない）

## Directory Layout

```
calc-experiment/
├── README.md                       # this file
├── requirements.txt                # Python deps
├── .gitignore
├── SYSTEM_BOUNDARY.md              # SD model boundary
├── MODEL_LIMITATIONS.md            # SD model assumptions and limits
├── model/
│   └── language_experiment.xmile   # SD model (ISO 18722)
├── analysis/
│   ├── scripts/                    # measurement + SD analysis
│   └── reports/                    # outputs
├── runs/                           # per-run artifacts (created at run time)
│   ├── run-a-english-output/
│   └── run-b-japanese-output/
└── tests/                          # pytest validation
```

## Usage

```bash
# environment
python3.14 -m venv .venv
.venv/bin/pip install -r requirements.txt

# baseline simulation
.venv/bin/python analysis/scripts/run_comparison.py

# Sobol sensitivity
.venv/bin/python analysis/scripts/sensitivity_sobol.py

# BoT plot
.venv/bin/python analysis/scripts/plot_bot.py

# validation
.venv/bin/pytest tests/ -v
```

## SD Model

The XMILE model in `model/language_experiment.xmile` captures:

- Cognitive load dynamics (user-side)
- Fatigue accumulation
- Shared understanding (Claude ↔ user)
- Cumulative tokens
- Latent / discovered defects
- Intervention generation (clarification, correction, redirect, approval)

See `SYSTEM_BOUNDARY.md` for what is in / out of scope, and
`MODEL_LIMITATIONS.md` for assumptions.

## Status

`v0.2` — Phase structure and intervention stocks integrated.
Pre-experiment SD predictions are documented as a pre-registered hypothesis.
