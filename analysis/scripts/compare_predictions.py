"""Compare ABAB observed values to Pre-Registered Hypotheses (PLAN.md §8).

H1: Cost軸で Run-A（英語）が確実に優位（Token ratio JA/EN ≈ 5.57x）
H2: Comprehension Burden 軸で Run-B（日本語）が確実に優位（clarification: EN ~91 vs JA ~41）
H3: Quality 軸（修正・欠陥）は言語効果検出不能（discovered_defects EN ≈ JA）
H4: Phase × 言語のハイブリッド最適が存在
H5: B1 ループ（認知負荷の自己均衡）が最支配的（loop dominance +5060%）
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ANOVA = json.loads((ROOT / "analysis" / "reports" / "anova_results.json").read_text())
OUT = ROOT / "analysis" / "reports" / "predictions_vs_observed.json"


# Observed (computed from RUN-1..4 METRICS)
TOKENS = ANOVA["metrics"]["est_tokens"]["values_by_run"]
ACTIVE = ANOVA["metrics"]["active_min"]["values_by_run"]
BUGS = ANOVA["metrics"]["in_run_bugs"]["values_by_run"]


def main() -> None:
    en_tokens = (TOKENS["1"] + TOKENS["3"]) / 2
    ja_tokens = (TOKENS["2"] + TOKENS["4"]) / 2
    obs_token_ratio = ja_tokens / en_tokens

    en_active = (ACTIVE["1"] + ACTIVE["3"]) / 2
    ja_active = (ACTIVE["2"] + ACTIVE["4"]) / 2

    en_bugs = (BUGS["1"] + BUGS["3"]) / 2
    ja_bugs = (BUGS["2"] + BUGS["4"]) / 2

    pos_effect_active = ACTIVE["1"] - ACTIVE["3"]  # E early - E late
    pos_effect_active_ja = ACTIVE["2"] - ACTIVE["4"]  # J early - J late

    report = {
        "H1_token_ratio_ja_over_en": {
            "predicted": 5.57,
            "observed": round(obs_token_ratio, 2),
            "verdict": "SUPPORTED" if 4.0 < obs_token_ratio < 7.0 else "DEVIATED",
            "note": "Predicted from tiktoken cl100k_base on calibration corpus."
        },
        "H2_comprehension_burden": {
            "predicted_ja_lower": True,
            "observed_clarification_count_ja": 0,
            "observed_clarification_count_en": 0,
            "verdict": "INDETERMINATE",
            "note": "All runs ran in auto-mode (zero user interventions); the 4-class "
                    "intervention metric was zero across all runs. Cannot test H2 from "
                    "this dataset; would need a human-in-the-loop run."
        },
        "H3_quality_no_lang_effect": {
            "predicted_eq": True,
            "observed_known_defects_en": en_bugs,
            "observed_known_defects_ja": ja_bugs,
            "delta": en_bugs - ja_bugs,
            "verdict": "SUPPORTED" if abs(en_bugs - ja_bugs) < 1.5 else "DEVIATED",
            "note": "Bug count is small and dominated by the single Run-1 self-correction event."
        },
        "H4_phase_hybrid_optimal": {
            "predicted": "Prose-heavy phases favor JA, code-heavy phases neutral.",
            "observed": "Phase-level data not separately measured in autonomous runs; "
                        "can only infer from aggregate. Position effect on active_min was "
                        "59.8% share vs language effect 27.5% share, suggesting fatigue/"
                        "learning carryover dominates over language at the run level.",
            "verdict": "INDETERMINATE",
            "note": "Phase-level token/time decomposition would require per-phase metric "
                    "logging which the autonomous batch did not produce."
        },
        "H5_b1_loop_dominance": {
            "predicted_loop_share_pct": 5060.0,
            "observed": "B1 loop dominance was a structural property of the SD model, "
                        "not an empirically testable claim from the 4 calculator runs.",
            "verdict": "NOT_TESTABLE",
            "note": "H5 is a model-internal claim, not refuted/supported by run data."
        },
        "additional_findings": {
            "active_min_position_decay": {
                "run_1_to_run_3_diff": pos_effect_active,
                "run_2_to_run_4_diff": pos_effect_active_ja,
                "interpretation": "Active time dropped 90 min (E1->E3) and 47 min (J2->J4); "
                                  "monotonic decrease across positions confirms strong "
                                  "carryover from broken L2 isolation."
            },
            "anova_share_summary": {
                "active_min": {"language": "27.5%", "position": "59.8%", "interaction": "18.8%"},
                "est_tokens": {"language": "68.0%", "position": "9.3%", "interaction": "9.3%"},
            },
        },
        "honest_limitations": [
            "L2 session isolation broken (single-session execution).",
            "N=4 with no degrees of freedom for inferential statistics.",
            "Auto-mode means intervention 4-class metric is zero by construction; H2 "
              "cannot be tested.",
            "Token estimates derived from tiktoken cl100k_base ratios applied to estimated "
              "output volumes, not from /cost snapshots.",
            "Per-phase metric decomposition not performed in autonomous batch.",
        ],
    }
    OUT.write_text(json.dumps(report, indent=2, ensure_ascii=False))

    print("=== Pre-Registered Hypotheses vs Observed ===\n")
    for k, v in report.items():
        if k in ("additional_findings", "honest_limitations"):
            continue
        print(f"{k}:")
        for kk, vv in v.items():
            print(f"  {kk}: {vv}")
        print()
    print(f"Written to {OUT}")


if __name__ == "__main__":
    main()
