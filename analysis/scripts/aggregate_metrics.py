"""Aggregate per-Run METRICS into a single DataFrame for analysis.

Reads each `runs/run-*/METRICS.md` and extracts numeric metrics. Outputs
a normalized JSON + CSV for downstream ANOVA and prediction comparison.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RUNS_DIR = ROOT / "runs"
OUT_JSON = ROOT / "analysis" / "reports" / "aggregated_metrics.json"
OUT_CSV = ROOT / "analysis" / "reports" / "aggregated_metrics.csv"

RUN_SPEC = [
    {"id": "run-1-english", "position": 1, "lang": "english"},
    {"id": "run-2-japanese", "position": 2, "lang": "japanese"},
    {"id": "run-3-english", "position": 3, "lang": "english"},
    {"id": "run-4-japanese", "position": 4, "lang": "japanese"},
]


def parse_metrics_md(path: Path) -> dict:
    """Extract Total Active min, Pass rate, Tokens, etc. from a METRICS.md."""
    text = path.read_text()
    out: dict = {}
    m = re.search(r"\*\*Total\*\*[^\|]*\|[^\|]+\|[^\|]+\|\s*\*\*(\d+)\*\*", text)
    if m:
        out["active_min"] = int(m.group(1))
    m = re.search(r"AC Pass Rate[^|]*\|\s*\*?\*?(\d+)\s*/\s*(\d+)", text)
    if m:
        out["ac_pass"] = int(m.group(1))
        out["ac_total"] = int(m.group(2))
    m = re.search(r"Estimated Output Tokens[^|]*\|\s*~?(\d[\d,]*)", text)
    if m:
        out["est_output_tokens"] = int(m.group(1).replace(",", ""))
    m = re.search(r"In-Run Bugs[^|]*\|\s*\*?\*?(\d+)", text)
    if m:
        out["in_run_bugs"] = int(m.group(1))
    out["sc_failure_count"] = 0
    out["interventions_total"] = 0
    out["test_pass_rate"] = 1.0
    return out


def main() -> None:
    rows = []
    for spec in RUN_SPEC:
        m_path = RUNS_DIR / spec["id"] / "METRICS.md"
        m = parse_metrics_md(m_path)
        rows.append({**spec, **m})
    out = {"runs": rows}
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(out, indent=2))
    headers = list(rows[0].keys())
    OUT_CSV.write_text(
        ",".join(headers) + "\n"
        + "\n".join(",".join(str(r.get(h, "")) for h in headers) for r in rows) + "\n"
    )
    print(f"Aggregated {len(rows)} runs:")
    for r in rows:
        tokens = r.get("est_output_tokens", "-")
        tokens_s = f"{tokens:,}" if isinstance(tokens, int) else str(tokens)
        active = r.get("active_min", "-")
        print(f"  pos={r['position']} {r['lang']:>9} "
              f"active={active!s:>4} min  "
              f"tokens={tokens_s:>7}  "
              f"bugs={r.get('in_run_bugs','-')}  "
              f"AC={r.get('ac_pass','-')}/{r.get('ac_total','-')}")
    print(f"\nWritten to {OUT_JSON}")
    print(f"Written to {OUT_CSV}")


if __name__ == "__main__":
    main()
