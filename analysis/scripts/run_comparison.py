"""Run-A (English output) vs Run-B (Japanese output) comparison.

Parameters mirror Run-A / Run-B in the experiment plan v2.1.
`alpha_token_eff` values are measured via tiktoken (see
`measure_token_density.py`); other language-specific parameters remain
estimated. See MODEL_LIMITATIONS.md.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd
import pysd

MODEL_PATH = Path(__file__).resolve().parents[2] / "model" / "language_experiment.xmile"

LANG_PARAMS = {
    "english": {
        "alpha_token_eff": 0.188,
        "rs_prose": 200.0,
        "alpha_write_prose": 0.90,
    },
    "japanese": {
        "alpha_token_eff": 1.047,
        "rs_prose": 600.0,
        "alpha_write_prose": 1.00,
    },
}

REPORTED_COLS = [
    "cognitive_load",
    "fatigue",
    "shared_understanding",
    "cumulative_tokens",
    "latent_defects",
    "known_defects",
    "clarification_count",
    "correction_count",
    "redirect_count",
    "approval_count",
]


def run(lang: str) -> pd.DataFrame:
    model = pysd.read_xmile(str(MODEL_PATH))
    return model.run(params=LANG_PARAMS[lang], return_columns=REPORTED_COLS)


def summarize(df: pd.DataFrame) -> dict:
    final = df.iloc[-1]
    qd = float(final["correction_count"] + final["redirect_count"])
    cd = float(final["clarification_count"])
    return {
        "final_cognitive_load": float(final["cognitive_load"]),
        "final_fatigue": float(final["fatigue"]),
        "final_shared_understanding": float(final["shared_understanding"]),
        "total_tokens": float(final["cumulative_tokens"]),
        "residual_latent_defects": float(final["latent_defects"]),
        "discovered_defects": float(final["known_defects"]),
        "clarification_count": cd,
        "correction_count": float(final["correction_count"]),
        "redirect_count": float(final["redirect_count"]),
        "approval_count": float(final["approval_count"]),
        "quality_driven_interventions": qd,
        "comprehension_driven_interventions": cd,
    }


def main() -> int:
    rows = {lang: summarize(run(lang)) for lang in ("english", "japanese")}
    summary = pd.DataFrame(rows).T
    summary.loc["ratio_jp/en"] = (
        summary.loc["japanese"] / summary.loc["english"].replace(0, pd.NA)
    )
    pd.set_option("display.float_format", lambda x: f"{x:,.3f}")
    print(summary.T.to_string())
    return 0


if __name__ == "__main__":
    sys.exit(main())
