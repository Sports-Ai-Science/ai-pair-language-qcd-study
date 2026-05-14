"""Behavior over Time (BoT) plots for Run-A vs Run-B.

Generates a 2x3 grid showing how each stock evolves over the 300-min
simulation horizon under English vs Japanese output parameters.
"""
from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import pysd

MODEL_PATH = Path(__file__).resolve().parents[2] / "model" / "language_experiment.xmile"
OUT_PATH = Path(__file__).resolve().parents[1] / "reports" / "bot_comparison.png"

LANG_PARAMS = {
    "english": {"alpha_token_eff": 0.40, "rs_prose": 200.0, "alpha_write_prose": 0.90},
    "japanese": {"alpha_token_eff": 0.70, "rs_prose": 600.0, "alpha_write_prose": 1.00},
}

STOCKS = [
    ("cognitive_load", "Cognitive Load [dmnl]"),
    ("fatigue", "Fatigue [dmnl]"),
    ("shared_understanding", "Shared Understanding [dmnl]"),
    ("cumulative_tokens", "Cumulative Tokens"),
    ("latent_defects", "Latent Defects"),
    ("known_defects", "Discovered Defects"),
]


def main() -> None:
    runs = {}
    for lang, params in LANG_PARAMS.items():
        model = pysd.read_xmile(str(MODEL_PATH))
        runs[lang] = model.run(
            params=params, return_columns=[s for s, _ in STOCKS]
        )

    fig, axes = plt.subplots(2, 3, figsize=(15, 8))
    for ax, (stock, label) in zip(axes.flat, STOCKS):
        for lang, df in runs.items():
            ax.plot(df.index, df[stock], label=f"Run-{lang[0].upper()} ({lang})", lw=1.8)
        ax.set_title(label)
        ax.set_xlabel("time [min]")
        ax.grid(True, alpha=0.3)
        ax.legend(fontsize=8)
    fig.suptitle("Behavior over Time: English vs Japanese Output (JP-native user)", fontsize=12)
    fig.tight_layout()
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(OUT_PATH, dpi=120)
    print(f"Plot saved: {OUT_PATH}")


if __name__ == "__main__":
    main()
