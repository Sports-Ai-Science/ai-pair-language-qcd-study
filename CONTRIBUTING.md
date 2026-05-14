# Contributing — Replication Welcome

This is an empirical pilot study, not a software project. The most valuable
contribution you can make is **replicating the experiment** in your own
environment and publishing the results. The N=3 per group here is exploratory;
independent replications would dramatically increase what we can claim.

## Want to replicate?

### Quick replication (same setup, different day/operator)

```bash
git clone https://github.com/Sports-Ai-Science/ai-pair-language-qcd-study.git
cd ai-pair-language-qcd-study
python3.14 -m venv .venv
.venv/bin/pip install -r requirements.txt

# Read METHODOLOGY.md for the exact agent-spawning procedure.
# You will need:
#   - Claude Code with Agent tool access
#   - Claude Opus model access
#   - About 1 hour of orchestrator wall-clock time
#   - About $12 in API spend (for 6 agents at Opus pricing)

# Run the analysis pipeline once you have your own runs-fresh/ data:
.venv/bin/python analysis/scripts/aggregate_parallel.py
.venv/bin/python analysis/scripts/anova_parallel.py
.venv/bin/python analysis/scripts/ds_analysis.py
.venv/bin/python analysis/scripts/compare_predictions_v2.py
```

Submit your replication results as:
1. A pull request adding `replications/<your-handle>-<YYYY-MM-DD>/` with the
   same structure as `runs-fresh/`, **or**
2. An issue with a link to your own repo following the same methodology.

### Variations worth trying

- **N = 10 per group**: this is the most needed extension. Statistical power
  jumps significantly. About 30 min wall clock, ~$30 spend.
- **Different model**: Sonnet or Haiku instead of Opus, to map the model x
  language-effect interaction.
- **Different language pairs**: Chinese, Korean, German, Spanish, etc.
- **Different task**: a small REST API, a CLI tool, a data-pipeline script.
  The calculator is convenient but limits what we can claim.
- **Human-in-the-loop**: not auto-mode. This is the only way to get the H2
  comprehension-burden dimension that this pilot couldn't test.

## Code-level contributions

The **analysis scripts** (`analysis/scripts/`) and the **SD model** (`model/`)
welcome PRs:

- Bug fixes
- More rigorous statistical methods (e.g. proper Bayesian replacement for the
  bootstrap CI; mixed-effects models if N grows)
- Additional Sterman validation tests for the SD model
- More CLD / SFD diagrams from the model

The **calculator implementations** in `runs-fresh/calc-*/` and `runs-archive/`
should NOT be edited — they are experiment data. If you re-run, put new builds
under `replications/`.

## Style and process

This repo is governed by a parent governance project at
`claude-governance` (private). Public contributors aren't expected to follow it.
For PRs we just ask:

- Keep one logical change per PR
- Run `.venv/bin/pytest tests/ -v` if you touch the SD model
- Be honest about limitations in any analysis you add

## Caveats and biases

If you find a problem in the analysis or methodology, **please file an issue**.
The whole point of publishing this is so other people can poke holes. The
README and `analysis/reports/ds_perspective.md` already document the
limitations we know about; we'd rather hear about more.

## Citation

See `CITATION.cff` for citation metadata. The cff format is auto-rendered by
GitHub on the right-hand sidebar.
