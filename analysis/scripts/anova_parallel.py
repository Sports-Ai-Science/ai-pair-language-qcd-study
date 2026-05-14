"""ANOVA for the parallel 2-group × N=3 design (v2.4).

Model:
  Y_ij = mu + alpha_i + epsilon_ij
    i ∈ {english, japanese}  (language, fixed effect)
    j ∈ {1, 2, 3}            (within-language replication)

With 6 observations and 2 means, residual df = 4.
Position effect is structurally zero (parallel execution), so we don't
include it. Within-language variance is what makes this design more
informative than the previous ABAB.
"""
from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AGG_PATH = ROOT / "analysis" / "reports" / "parallel_aggregated.json"
OUT = ROOT / "analysis" / "reports" / "anova_parallel.json"


def f_to_p_approx(f: float, df1: int, df2: int) -> str:
    """Crude F-distribution p-value indicator (no scipy dependency)."""
    if not math.isfinite(f) or f <= 0:
        return "n/a"
    # Very rough thresholds for df1=1, df2=4 (2-group ANOVA)
    if f > 21.2: return "<0.01"
    if f > 7.71: return "<0.05"
    if f > 4.54: return "<0.10"
    return ">0.10"


def anova_one_way(group_a: list[float], group_b: list[float]) -> dict:
    """One-way ANOVA between 2 groups, equal n per group."""
    n_a, n_b = len(group_a), len(group_b)
    n = n_a + n_b
    if n_a < 2 or n_b < 2:
        return {"error": "groups too small"}
    mean_a = sum(group_a) / n_a
    mean_b = sum(group_b) / n_b
    grand = (sum(group_a) + sum(group_b)) / n
    ss_between = n_a * (mean_a - grand) ** 2 + n_b * (mean_b - grand) ** 2
    ss_within = sum((x - mean_a) ** 2 for x in group_a) + sum((x - mean_b) ** 2 for x in group_b)
    df_between = 1
    df_within = n - 2
    ms_between = ss_between / df_between
    ms_within = ss_within / df_within if df_within > 0 else float("inf")
    f = ms_between / ms_within if ms_within > 0 else float("inf")
    eta_sq = ss_between / (ss_between + ss_within) if (ss_between + ss_within) > 0 else 0.0
    return {
        "n": n,
        "mean_english": mean_a,
        "mean_japanese": mean_b,
        "diff_jp_minus_en": mean_b - mean_a,
        "ratio_jp_over_en": (mean_b / mean_a) if mean_a else None,
        "ss_between": ss_between,
        "ss_within": ss_within,
        "df_between": df_between,
        "df_within": df_within,
        "F": f,
        "eta_squared": eta_sq,
        "p_approx": f_to_p_approx(f, df_between, df_within),
        "within_variance_en": ss_within and (sum((x - mean_a) ** 2 for x in group_a) / max(1, n_a - 1)),
        "within_variance_jp": ss_within and (sum((x - mean_b) ** 2 for x in group_b) / max(1, n_b - 1)),
    }


def main() -> None:
    if not AGG_PATH.exists():
        print(f"Run aggregate_parallel.py first; missing {AGG_PATH}")
        return
    rows = json.loads(AGG_PATH.read_text())

    en = [r for r in rows if r["lang"] == "english" and r.get("exists")]
    jp = [r for r in rows if r["lang"] == "japanese" and r.get("exists")]

    metrics_to_test = [
        ("total_active_min", "Wall-clock active time (min)"),
        ("docs_bytes", "Documentation bytes"),
        ("src_bytes", "Source code bytes"),
        ("phases_with_timestamps", "Phases completed"),
    ]

    report: dict = {
        "design": "parallel 2-group, N=3 each, single-session orchestrator with isolated sub-agents",
        "n_english": len(en),
        "n_japanese": len(jp),
        "metrics": {},
    }
    for key, label in metrics_to_test:
        a_vals = [r.get(key) for r in en if r.get(key) is not None]
        b_vals = [r.get(key) for r in jp if r.get(key) is not None]
        if len(a_vals) < 2 or len(b_vals) < 2:
            report["metrics"][key] = {"error": f"insufficient data: en={len(a_vals)}, jp={len(b_vals)}"}
            continue
        a_vals = [float(x) for x in a_vals]
        b_vals = [float(x) for x in b_vals]
        report["metrics"][key] = {
            "label": label,
            "english_values": a_vals,
            "japanese_values": b_vals,
            **anova_one_way(a_vals, b_vals),
        }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(report, indent=2))

    print("=== Parallel ANOVA (2 groups × N=3) ===\n")
    print(f"english samples: {len(en)} / japanese samples: {len(jp)}\n")
    for key, payload in report["metrics"].items():
        if "error" in payload:
            print(f"{key}: {payload['error']}")
            continue
        print(f"{payload['label']}")
        print(f"  english : {payload['english_values']} -> mean {payload['mean_english']:.2f}")
        print(f"  japanese: {payload['japanese_values']} -> mean {payload['mean_japanese']:.2f}")
        print(f"  diff (jp-en): {payload['diff_jp_minus_en']:+.2f}")
        if payload.get("ratio_jp_over_en") is not None:
            print(f"  ratio jp/en: {payload['ratio_jp_over_en']:.3f}")
        print(f"  F={payload['F']:.2f}  eta^2={payload['eta_squared']:.3f}  p~{payload['p_approx']}")
        print()
    print(f"Written: {OUT}")


if __name__ == "__main__":
    main()
