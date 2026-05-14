"""Sobol global sensitivity analysis using SALib.

Replaces the previous OAT (one-at-a-time) approach. Computes first-order
and total-order Sobol indices for each parameter against multiple outputs,
which captures interaction effects ignored by OAT.

Run: python analysis/scripts/sensitivity_sobol.py
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd
import pysd
from SALib.analyze import sobol as sobol_analyze
from SALib.sample import sobol as sobol_sample

MODEL_PATH = Path(__file__).resolve().parents[2] / "model" / "language_experiment.xmile"
REPORT_PATH = Path(__file__).resolve().parents[1] / "reports" / "sobol_sensitivity.json"

PROBLEM = {
    "num_vars": 6,
    "names": [
        "alpha_token_eff",
        "rs_prose",
        "alpha_write_prose",
        "load_decay_rate",
        "fatigue_accumulation_rate",
        "defect_intro_coef",
    ],
    "bounds": [
        [0.30, 0.80],   # token efficiency: covers Eng~0.4 to Jpn~0.7
        [150, 700],     # read speed prose: Eng-slow to Jpn-fast
        [0.80, 1.00],   # write quality
        [0.05, 0.30],   # load decay
        [0.02, 0.10],   # fatigue rate
        [0.001, 0.01],  # defect intro coefficient
    ],
}

OUTPUT_NAMES = [
    "final_cognitive_load",
    "total_tokens",
    "discovered_defects",
    "final_fatigue",
]


def evaluate(sample: np.ndarray) -> np.ndarray:
    model = pysd.read_xmile(str(MODEL_PATH))
    out = np.zeros((sample.shape[0], len(OUTPUT_NAMES)))
    for i, row in enumerate(sample):
        params = dict(zip(PROBLEM["names"], row))
        df = model.run(
            params=params,
            return_columns=[
                "cognitive_load",
                "cumulative_tokens",
                "known_defects",
                "fatigue",
            ],
        )
        last = df.iloc[-1]
        out[i, :] = [
            last["cognitive_load"],
            last["cumulative_tokens"],
            last["known_defects"],
            last["fatigue"],
        ]
    return out


def main() -> None:
    n = 256
    print(f"Generating Sobol sample (N={n}, D={PROBLEM['num_vars']})")
    sample = sobol_sample.sample(PROBLEM, n, calc_second_order=False)
    print(f"  -> {sample.shape[0]} model evaluations required")

    print("Running model evaluations...")
    outputs = evaluate(sample)
    print("  -> done")

    report: dict[str, dict] = {}
    for j, output_name in enumerate(OUTPUT_NAMES):
        Si = sobol_analyze.analyze(
            PROBLEM, outputs[:, j], calc_second_order=False, print_to_console=False
        )
        report[output_name] = {
            "S1": dict(zip(PROBLEM["names"], [float(x) for x in Si["S1"]])),
            "ST": dict(zip(PROBLEM["names"], [float(x) for x in Si["ST"]])),
            "S1_conf": dict(zip(PROBLEM["names"], [float(x) for x in Si["S1_conf"]])),
            "ST_conf": dict(zip(PROBLEM["names"], [float(x) for x in Si["ST_conf"]])),
        }

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(json.dumps(report, indent=2))
    print(f"\nReport written to {REPORT_PATH}")

    print("\n=== Total-order Sobol indices (ST) ===")
    print("(higher = more influential, including interactions)\n")
    table = pd.DataFrame(
        {out: report[out]["ST"] for out in OUTPUT_NAMES},
        index=PROBLEM["names"],
    )
    pd.set_option("display.float_format", lambda x: f"{x:.3f}")
    print(table.to_string())


if __name__ == "__main__":
    main()
