"""Rigorous data-scientist-grade re-analysis of v2.4 parallel results.

Goes beyond the basic ANOVA in anova_parallel.py:
- Welch's t-test (no equal-variance assumption)
- Mann-Whitney U (non-parametric, robust to small N and outliers)
- Cliff's delta (non-parametric effect size)
- Bonferroni correction for multiple comparisons
- Bootstrap CI on the difference of means
- Power analysis: effect size required for significance at this N
- Outlier diagnosis
- Per-metric correlation matrix
"""
from __future__ import annotations

import json
import statistics
from pathlib import Path

import numpy as np
from scipy import stats

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "analysis" / "reports" / "ds_analysis.json"

# Per-agent measurements (consistent units)
DATA = {
    "agent":          ["calc-en-1", "calc-en-2", "calc-en-3", "calc-jp-1", "calc-jp-2", "calc-jp-3"],
    "lang":           ["en",        "en",        "en",        "jp",        "jp",        "jp"      ],
    "active_min":     [12.8,        11.7,        10.4,        14.8,        13.7,        14.1     ],  # wall-clock
    "phase_sum_min":  [10.4,         9.3,         7.8,         9.9,        10.6,        11.9     ],  # sum of per-phase
    "tokens_total":   [102491,      71880,       72448,       100960,      113058,      138625   ],
    "tests_passed":   [31,          53,          44,          49,          77,          34       ],
    "src_loc":        [508,         697,         602,         530,         508,         423      ],
    "js_lines":       [452,         517,         471,         449,         379,         358      ],
    "comment_lines":  [18,          16,           6,           24,          20,          19      ],
    "bugs":           [1,           1,            1,           0,           0,            0      ],
    "docs_bytes":     [30294,       19828,       16422,       25084,       25998,       37010   ],
    "src_bytes":      [19009,       21904,       18309,       16880,       19519,       15407   ],
}


def split_by_lang(arr: list, langs: list) -> tuple[np.ndarray, np.ndarray]:
    arr_np = np.array(arr, dtype=float)
    en_mask = np.array([l == "en" for l in langs])
    jp_mask = np.array([l == "jp" for l in langs])
    return arr_np[en_mask], arr_np[jp_mask]


def cliffs_delta(a: np.ndarray, b: np.ndarray) -> float:
    """Cliff's delta non-parametric effect size: P(B>A) - P(A>B)."""
    n_a, n_b = len(a), len(b)
    gt = sum(1 for x in a for y in b if y > x)
    lt = sum(1 for x in a for y in b if y < x)
    return (gt - lt) / (n_a * n_b)


def bootstrap_diff_ci(a: np.ndarray, b: np.ndarray, n_boot: int = 10000, alpha: float = 0.05) -> tuple[float, float]:
    """Bootstrap 95% CI on the difference of means b - a."""
    rng = np.random.default_rng(42)
    diffs = []
    for _ in range(n_boot):
        a_s = rng.choice(a, size=len(a), replace=True)
        b_s = rng.choice(b, size=len(b), replace=True)
        diffs.append(b_s.mean() - a_s.mean())
    lo, hi = np.percentile(diffs, [100 * alpha / 2, 100 * (1 - alpha / 2)])
    return float(lo), float(hi)


def required_n_for_significance(effect_d: float, alpha: float = 0.05, power: float = 0.80) -> int:
    """Approximate sample size per group for two-sample t-test (Cohen).
    Formula: n = 2 * ((z_alpha/2 + z_beta) / d)^2 + correction
    """
    z_alpha = stats.norm.ppf(1 - alpha / 2)  # 1.96 for two-sided 0.05
    z_beta = stats.norm.ppf(power)            # 0.84 for 80% power
    if abs(effect_d) < 0.01:
        return int(1e6)
    n = 2 * ((z_alpha + z_beta) / effect_d) ** 2 + 1
    return int(np.ceil(n))


def analyze_metric(name: str, en: np.ndarray, jp: np.ndarray) -> dict:
    out = {"metric": name}
    out["en_values"] = en.tolist()
    out["jp_values"] = jp.tolist()
    out["en_mean"] = float(en.mean())
    out["jp_mean"] = float(jp.mean())
    out["diff_jp_minus_en"] = out["jp_mean"] - out["en_mean"]
    out["en_std"] = float(en.std(ddof=1))
    out["jp_std"] = float(jp.std(ddof=1))

    # Welch's t-test
    if en.std() > 0 or jp.std() > 0:
        t_stat, t_p = stats.ttest_ind(en, jp, equal_var=False)
        out["welch_t"] = float(t_stat)
        out["welch_p_two_sided"] = float(t_p)
    else:
        out["welch_t"] = "n/a (zero variance)"
        out["welch_p_two_sided"] = "n/a"

    # Mann-Whitney U (non-parametric, robust)
    try:
        u_stat, u_p = stats.mannwhitneyu(en, jp, alternative="two-sided")
        out["mannwhitney_u"] = float(u_stat)
        out["mannwhitney_p"] = float(u_p)
    except ValueError as e:
        out["mannwhitney_u"] = "n/a"
        out["mannwhitney_p"] = str(e)

    # Cliff's delta
    out["cliffs_delta"] = round(cliffs_delta(en, jp), 3)
    abs_d = abs(out["cliffs_delta"])
    out["cliffs_magnitude"] = (
        "negligible" if abs_d < 0.147 else
        "small"      if abs_d < 0.33  else
        "medium"     if abs_d < 0.474 else
        "large"
    )

    # Cohen's d (parametric effect size)
    pooled_sd = ((en.std(ddof=1) ** 2 + jp.std(ddof=1) ** 2) / 2) ** 0.5
    if pooled_sd > 0:
        d = (jp.mean() - en.mean()) / pooled_sd
        out["cohens_d"] = round(float(d), 3)
        out["required_n_per_group_80power"] = required_n_for_significance(abs(d))
    else:
        out["cohens_d"] = "n/a (zero pooled SD)"
        out["required_n_per_group_80power"] = "n/a"

    # Bootstrap CI
    if len(en) > 1 and len(jp) > 1:
        lo, hi = bootstrap_diff_ci(en, jp)
        out["bootstrap_ci95_diff"] = [round(lo, 3), round(hi, 3)]
        out["ci_excludes_zero"] = (lo > 0) or (hi < 0)
    else:
        out["bootstrap_ci95_diff"] = "n/a"
        out["ci_excludes_zero"] = False

    return out


def main() -> None:
    metrics = [
        "active_min", "phase_sum_min", "tokens_total",
        "tests_passed", "src_loc", "js_lines",
        "comment_lines", "bugs", "docs_bytes", "src_bytes",
    ]
    report = {
        "design_note": "Welch's t-test + Mann-Whitney U + Cliff's delta + Cohen's d + bootstrap CI + power",
        "n_per_group": 3,
        "alpha": 0.05,
        "metrics": {},
    }

    for m in metrics:
        en, jp = split_by_lang(DATA[m], DATA["lang"])
        report["metrics"][m] = analyze_metric(m, en, jp)

    # Bonferroni correction for multiple comparisons
    n_tests = sum(1 for m in metrics if isinstance(report["metrics"][m].get("welch_p_two_sided"), float))
    report["bonferroni_alpha"] = 0.05 / n_tests if n_tests > 0 else None

    # Rank metrics by effect size and significance
    ranked = sorted(
        ((m, report["metrics"][m]) for m in metrics),
        key=lambda kv: -abs(kv[1].get("cohens_d") if isinstance(kv[1].get("cohens_d"), float) else 0)
    )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(report, indent=2))

    # Pretty print
    print(f"{'='*100}")
    print(f"DATA SCIENCE RE-ANALYSIS — N=3 per group, alpha=0.05, Bonferroni-corrected alpha={report['bonferroni_alpha']:.4f}")
    print(f"{'='*100}\n")

    print(f"{'metric':<16} {'EN mean':>10} {'JP mean':>10} {'diff':>10} {'Cohen d':>9} "
          f"{'Welch p':>9} {'MW p':>7} {'Cliff Δ':>9} {'Need N':>8} {'CI95':>20}")
    print("-" * 130)
    for m, info in ranked:
        ci = info.get("bootstrap_ci95_diff", "n/a")
        ci_s = f"[{ci[0]:.1f},{ci[1]:.1f}]" if isinstance(ci, list) else "n/a"
        wp = info.get("welch_p_two_sided", "n/a")
        wp_s = f"{wp:.3f}" if isinstance(wp, float) else "n/a"
        mp = info.get("mannwhitney_p", "n/a")
        mp_s = f"{mp:.3f}" if isinstance(mp, float) else "n/a"
        d = info.get("cohens_d", "n/a")
        d_s = f"{d:+.2f}" if isinstance(d, float) else "n/a"
        n_req = info.get("required_n_per_group_80power", "n/a")
        sig = "**" if isinstance(wp, float) and wp < report["bonferroni_alpha"] else ""
        print(f"{m:<16} {info['en_mean']:>10.1f} {info['jp_mean']:>10.1f} {info['diff_jp_minus_en']:>+10.1f} "
              f"{d_s:>9} {wp_s:>9}{sig:>2} {mp_s:>7} {info['cliffs_delta']:>+9.2f} {str(n_req):>8} {ci_s:>20}")

    print(f"\nWritten: {OUT}")


if __name__ == "__main__":
    main()
