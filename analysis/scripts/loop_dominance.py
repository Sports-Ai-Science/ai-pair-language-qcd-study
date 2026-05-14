"""Loop dominance analysis via link deactivation.

For each candidate loop, deactivate a key parameter that breaks the loop
and compare against baseline. Larger output delta -> more dominant loop.

This is a simplified version of Forrester's Pathway Participation Method
(PPM) — sufficient for qualitative dominance ranking.
"""
from __future__ import annotations

import json
from pathlib import Path

import pandas as pd
import pysd

MODEL_PATH = Path(__file__).resolve().parents[2] / "model" / "language_experiment.xmile"
REPORT_PATH = Path(__file__).resolve().parents[1] / "reports" / "loop_dominance.json"

# Loops we want to test, and the param/value that deactivates them.
LOOPS = {
    "R1_cognitive_load_spiral": {
        "description": "Read burden -> cognitive_load -> intervention drift -> rework. "
                       "Break by removing read burden contribution.",
        "params": {"content_complexity": 0.0},
    },
    "R2_shared_understanding": {
        "description": "Effective communication -> understanding -> approvals. "
                       "Break by zeroing write quality.",
        "params": {"alpha_write_prose": 0.0},
    },
    "B1_load_decay": {
        "description": "Cognitive load self-regulating via decay. "
                       "Break by setting decay rate to zero.",
        "params": {"load_decay_rate": 0.0},
    },
    "B2_fatigue_suppression": {
        "description": "Fatigue raises intervention threshold (suppressed generation). "
                       "Break by minimizing fatigue accumulation.",
        "params": {"fatigue_accumulation_rate": 0.0},
    },
    "B3_defect_lifecycle": {
        "description": "Latent defects discovered when understanding is high. "
                       "Break by zeroing discovery coefficient.",
        "params": {"defect_discovery_coef": 0.0},
    },
    "B4_understanding_decay": {
        "description": "Shared understanding decays with time. "
                       "Break by zeroing decay rate.",
        "params": {"understanding_decay_rate": 0.0},
    },
}

OUTPUTS = [
    "cognitive_load",
    "fatigue",
    "shared_understanding",
    "cumulative_tokens",
    "clarification_count",
    "correction_count",
    "known_defects",
]


def run_baseline() -> dict:
    model = pysd.read_xmile(str(MODEL_PATH))
    df = model.run(return_columns=OUTPUTS)
    return {col: float(df[col].iloc[-1]) for col in OUTPUTS}


def run_with_break(params: dict) -> dict:
    model = pysd.read_xmile(str(MODEL_PATH))
    df = model.run(params=params, return_columns=OUTPUTS)
    return {col: float(df[col].iloc[-1]) for col in OUTPUTS}


def main() -> None:
    baseline = run_baseline()
    report = {"baseline": baseline, "loops": {}}
    for name, cfg in LOOPS.items():
        broken = run_with_break(cfg["params"])
        delta_pct = {
            col: 100.0 * (broken[col] - baseline[col]) / max(abs(baseline[col]), 1e-9)
            for col in OUTPUTS
        }
        report["loops"][name] = {
            "description": cfg["description"],
            "delta_pct": delta_pct,
            "broken_final_state": broken,
        }

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(json.dumps(report, indent=2))

    rows = []
    for loop_name, info in report["loops"].items():
        rows.append({"loop": loop_name, **info["delta_pct"]})
    df_table = pd.DataFrame(rows).set_index("loop")
    pd.set_option("display.float_format", lambda x: f"{x:+.1f}%")
    print("\n=== Loop Dominance Analysis ===")
    print("(% change in final state when loop is broken; larger = more dominant)\n")
    print(df_table.to_string())
    print(f"\nDetails: {REPORT_PATH}")


if __name__ == "__main__":
    main()
