"""ANOVA decomposition for the ABAB 4-Run experiment.

Decomposes each metric into:
  - language main effect (alpha)
  - position main effect (beta) — proxy for fatigue / learning
  - interaction (gamma)

With N=4 there is no residual degree of freedom for a full ANOVA, so this
script reports raw effect estimates and effect sizes rather than F-tests
with p-values. With N=4 we are in pilot-study territory.
"""
from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "analysis" / "reports" / "anova_results.json"

# Hard-coded values from each Run's METRICS.md (single source of truth).
RUNS = pd.DataFrame([
    {"run": 1, "position": 1, "lang": "english",  "active_min": 118, "est_tokens": 12000, "in_run_bugs": 2, "ac_pass": 10, "sc_fail": 0, "interventions": 0, "first_pass_rate": 1.0, "self_correction": 1.0},
    {"run": 2, "position": 2, "lang": "japanese", "active_min":  65, "est_tokens": 56000, "in_run_bugs": 0, "ac_pass": 10, "sc_fail": 0, "interventions": 0, "first_pass_rate": 1.0, "self_correction": 0.0},
    {"run": 3, "position": 3, "lang": "english",  "active_min":  28, "est_tokens": 12000, "in_run_bugs": 0, "ac_pass": 10, "sc_fail": 0, "interventions": 0, "first_pass_rate": 1.0, "self_correction": 0.0},
    {"run": 4, "position": 4, "lang": "japanese", "active_min":  18, "est_tokens": 70000, "in_run_bugs": 0, "ac_pass": 10, "sc_fail": 0, "interventions": 0, "first_pass_rate": 1.0, "self_correction": 0.0},
])

METRICS = ["active_min", "est_tokens", "in_run_bugs"]


def decompose(values: list[float]) -> dict:
    """For ABAB 4-run: y = mu + alpha*lang + beta*pos + gamma*interaction.

    With encoding: lang_E=+1, lang_J=-1; pos_early=+1 (1,2), pos_late=-1 (3,4);
    interaction = lang * pos.

    y_1 = mu + alpha + beta + gamma   (E, early)
    y_2 = mu - alpha + beta - gamma   (J, early)
    y_3 = mu + alpha - beta - gamma   (E, late)
    y_4 = mu - alpha - beta + gamma   (J, late)

    Solving:
      mu    = (y1 + y2 + y3 + y4) / 4
      alpha = (y1 - y2 + y3 - y4) / 4   <- language effect
      beta  = (y1 + y2 - y3 - y4) / 4   <- position effect
      gamma = (y1 - y2 - y3 + y4) / 4   <- interaction
    """
    y1, y2, y3, y4 = values
    mu = (y1 + y2 + y3 + y4) / 4
    alpha = (y1 - y2 + y3 - y4) / 4
    beta = (y1 + y2 - y3 - y4) / 4
    gamma = (y1 - y2 - y3 + y4) / 4

    # Effect "share" on the grand-mean magnitude (proxy for effect size).
    abs_mu = max(abs(mu), 1e-9)
    return {
        "grand_mean": mu,
        "language_effect": alpha,
        "position_effect": beta,
        "interaction": gamma,
        "language_share": abs(alpha) / abs_mu,
        "position_share": abs(beta) / abs_mu,
        "interaction_share": abs(gamma) / abs_mu,
        "values_by_run": {1: y1, 2: y2, 3: y3, 4: y4},
    }


def main() -> None:
    report: dict = {"design": "ABAB 4-run, single-session execution",
                    "caveat": "N=4 with broken L2 isolation; results are descriptive, not inferential.",
                    "encoding": {"language": "English=+1, Japanese=-1",
                                 "position": "early(1,2)=+1, late(3,4)=-1"},
                    "metrics": {}}
    for m in METRICS:
        vals = RUNS[m].tolist()
        report["metrics"][m] = decompose(vals)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(report, indent=2, default=float))

    print("=== ANOVA-style decomposition (ABAB, N=4, descriptive only) ===\n")
    pd.set_option("display.float_format", lambda x: f"{x:>10,.2f}")
    rows = []
    for m, d in report["metrics"].items():
        rows.append({
            "metric": m,
            "mean":          d["grand_mean"],
            "lang_effect":   d["language_effect"],
            "pos_effect":    d["position_effect"],
            "interaction":   d["interaction"],
            "lang_share":    f"{d['language_share']*100:>5.1f}%",
            "pos_share":     f"{d['position_share']*100:>5.1f}%",
            "interact_share":f"{d['interaction_share']*100:>5.1f}%",
        })
    print(pd.DataFrame(rows).to_string(index=False))
    print(f"\nWritten to {OUT}")


if __name__ == "__main__":
    main()
