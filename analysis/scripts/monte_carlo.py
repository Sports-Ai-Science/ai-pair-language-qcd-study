"""Monte Carlo uncertainty quantification.

Replaces point-estimate predictions (e.g., "12,000 tokens") with 95%
confidence intervals. Samples parameters from independent uniform
priors (broad ranges reflecting our calibration uncertainty), runs the
model, and reports the empirical distribution of final stocks.
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd
import pysd

MODEL_PATH = Path(__file__).resolve().parents[2] / "model" / "language_experiment.xmile"
REPORT_PATH = Path(__file__).resolve().parents[1] / "reports" / "monte_carlo.json"

# Parameter priors: (low, high) uniform ranges per language regime.
# alpha_token_eff is tight because measured via tiktoken; others are loose.
PRIORS = {
    "english": {
        "alpha_token_eff": (0.17, 0.21),    # measured 0.188, ±10%
        "rs_prose":        (150.0, 280.0),  # estimated reading speed range for non-native
        "alpha_write_prose": (0.80, 0.95),
        "load_decay_rate": (0.10, 0.25),
        "fatigue_accumulation_rate": (0.03, 0.08),
        "defect_intro_coef": (0.002, 0.005),
    },
    "japanese": {
        "alpha_token_eff": (0.95, 1.15),    # measured 1.047, ±10%
        "rs_prose":        (500.0, 750.0),  # estimated reading speed range for JP-native
        "alpha_write_prose": (0.95, 1.00),
        "load_decay_rate": (0.10, 0.25),
        "fatigue_accumulation_rate": (0.03, 0.08),
        "defect_intro_coef": (0.002, 0.005),
    },
}

OUTPUTS = [
    "cognitive_load",
    "fatigue",
    "shared_understanding",
    "cumulative_tokens",
    "clarification_count",
    "correction_count",
    "redirect_count",
    "known_defects",
]

N_SAMPLES = 500
SEED = 42


def sample_params(rng: np.random.Generator, prior: dict) -> dict:
    return {k: rng.uniform(lo, hi) for k, (lo, hi) in prior.items()}


def run_one(params: dict) -> dict:
    model = pysd.read_xmile(str(MODEL_PATH))
    df = model.run(params=params, return_columns=OUTPUTS)
    return {col: float(df[col].iloc[-1]) for col in OUTPUTS}


def summarize_distribution(rows: list[dict]) -> dict:
    df = pd.DataFrame(rows)
    summary = {}
    for col in df.columns:
        s = df[col]
        summary[col] = {
            "mean": float(s.mean()),
            "median": float(s.median()),
            "std": float(s.std()),
            "ci_low_95": float(s.quantile(0.025)),
            "ci_high_95": float(s.quantile(0.975)),
        }
    return summary


def main() -> None:
    rng = np.random.default_rng(SEED)
    report: dict[str, dict] = {}
    for lang, prior in PRIORS.items():
        print(f"Running {N_SAMPLES} Monte Carlo samples for {lang}...")
        rows = [run_one(sample_params(rng, prior)) for _ in range(N_SAMPLES)]
        report[lang] = summarize_distribution(rows)

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(json.dumps(report, indent=2))

    print("\n=== Monte Carlo 95% CI ===\n")
    for col in OUTPUTS:
        en = report["english"][col]
        ja = report["japanese"][col]
        print(
            f"{col:<28}  EN: {en['median']:>10.1f} "
            f"[{en['ci_low_95']:>9.1f}, {en['ci_high_95']:>9.1f}]   "
            f"JA: {ja['median']:>10.1f} "
            f"[{ja['ci_low_95']:>9.1f}, {ja['ci_high_95']:>9.1f}]"
        )
    print(f"\nDetails: {REPORT_PATH}")


if __name__ == "__main__":
    main()
