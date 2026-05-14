"""Aggregate metrics from the 6 parallel sub-agent runs (v2.4 design).

Reads each runs-fresh/calc-{lang}-{n}/METRICS.md plus the .phase-start-NN
and .phase-end-NN timestamp marker files, then produces a per-agent and
per-language summary.

Outputs:
  - analysis/reports/parallel_aggregated.json
  - analysis/reports/parallel_aggregated.csv
"""
from __future__ import annotations

import json
import re
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RUNS_DIR = ROOT / "runs-fresh"
OUT_JSON = ROOT / "analysis" / "reports" / "parallel_aggregated.json"
OUT_CSV = ROOT / "analysis" / "reports" / "parallel_aggregated.csv"

PHASES = ["01", "02", "03", "04", "05", "06", "07", "08", "10"]
AGENTS = [
    {"id": "calc-en-1", "lang": "english", "rep": 1},
    {"id": "calc-en-2", "lang": "english", "rep": 2},
    {"id": "calc-en-3", "lang": "english", "rep": 3},
    {"id": "calc-jp-1", "lang": "japanese", "rep": 1},
    {"id": "calc-jp-2", "lang": "japanese", "rep": 2},
    {"id": "calc-jp-3", "lang": "japanese", "rep": 3},
]


def read_iso(path: Path) -> datetime | None:
    if not path.exists():
        return None
    try:
        text = path.read_text().strip()
        return datetime.fromisoformat(text)
    except Exception:
        return None


def per_phase_elapsed(agent_dir: Path) -> dict[str, float]:
    """Return {phase: elapsed_seconds}."""
    out: dict[str, float] = {}
    for nn in PHASES:
        s = read_iso(agent_dir / f".phase-start-{nn}")
        e = read_iso(agent_dir / f".phase-end-{nn}")
        if s and e:
            out[nn] = (e - s).total_seconds()
    return out


def review_status(agent_dir: Path) -> tuple[int, int]:
    """Return (approved_count, total_count) of SC review files."""
    rev_dir = agent_dir / ".claude" / "reviews"
    if not rev_dir.exists():
        return 0, 0
    total = 0
    approved = 0
    for f in rev_dir.glob("*.md"):
        total += 1
        text = f.read_text()
        if re.search(r"^status:\s*APPROVED", text, re.MULTILINE):
            approved += 1
    return approved, total


def metrics_md_summary(agent_dir: Path) -> dict:
    """Best-effort parse of METRICS.md for bug count and SC failure count."""
    p = agent_dir / "METRICS.md"
    if not p.exists():
        return {"metrics_md": False}
    text = p.read_text()
    bug_re = re.findall(r"\bbugs?\s*(?:found)?[:\s|]+(\d+)", text, re.IGNORECASE)
    bug_count = sum(int(b) for b in bug_re) if bug_re else None
    return {
        "metrics_md": True,
        "metrics_md_chars": len(text),
        "bug_count_estimate": bug_count,
    }


def file_inventory(agent_dir: Path) -> dict:
    """Count deliverables and total source bytes."""
    src_files = list((agent_dir / "src").glob("*")) if (agent_dir / "src").exists() else []
    test_files = list((agent_dir / "tests").glob("*")) if (agent_dir / "tests").exists() else []
    plan_files = list((agent_dir / "docs" / "plans").glob("*.md")) if (agent_dir / "docs" / "plans").exists() else []
    review_files = list((agent_dir / ".claude" / "reviews").glob("*.md")) if (agent_dir / ".claude" / "reviews").exists() else []
    src_bytes = sum(f.stat().st_size for f in src_files if f.is_file())
    docs_bytes = sum(f.stat().st_size for f in plan_files + review_files if f.is_file())
    return {
        "src_files": len(src_files),
        "test_files": len(test_files),
        "plan_files": len(plan_files),
        "review_files": len(review_files),
        "src_bytes": src_bytes,
        "docs_bytes": docs_bytes,
    }


def summarize_agent(agent: dict) -> dict:
    d = RUNS_DIR / agent["id"]
    if not d.exists():
        return {**agent, "exists": False}
    elapsed = per_phase_elapsed(d)
    approved, total_rev = review_status(d)
    metrics = metrics_md_summary(d)
    inventory = file_inventory(d)
    total_seconds = sum(elapsed.values())
    return {
        **agent,
        "exists": True,
        "per_phase_seconds": elapsed,
        "phases_with_timestamps": len(elapsed),
        "total_active_seconds": total_seconds,
        "total_active_min": total_seconds / 60.0 if total_seconds else None,
        "sc_reviews_approved": approved,
        "sc_reviews_total": total_rev,
        **metrics,
        **inventory,
    }


def main() -> None:
    rows = [summarize_agent(a) for a in AGENTS]
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(rows, indent=2, default=str))

    headers = [
        "id", "lang", "rep", "exists",
        "phases_with_timestamps", "total_active_min",
        "sc_reviews_approved", "sc_reviews_total",
        "src_files", "src_bytes", "docs_bytes",
        "bug_count_estimate",
    ]
    with OUT_CSV.open("w") as f:
        f.write(",".join(headers) + "\n")
        for r in rows:
            f.write(",".join(str(r.get(h, "")) for h in headers) + "\n")

    print(f"Aggregated {len(rows)} agents:\n")
    print(f"{'agent':<14} {'lang':<10} {'min':>6} {'approved':>8}  {'src/B':>8} {'docs/B':>8} {'bugs':>5}")
    print("-" * 64)
    for r in rows:
        if not r.get("exists"):
            print(f"{r['id']:<14} {r['lang']:<10}   ----  (not yet produced)")
            continue
        m = r.get("total_active_min")
        m_s = f"{m:>6.1f}" if isinstance(m, (int, float)) else "  ----"
        print(f"{r['id']:<14} {r['lang']:<10} {m_s} "
              f"{str(r['sc_reviews_approved'])+'/'+str(r['sc_reviews_total']):>8}  "
              f"{r['src_bytes']:>8} {r['docs_bytes']:>8} "
              f"{str(r.get('bug_count_estimate','--')):>5}")
    print(f"\nWritten: {OUT_JSON}")
    print(f"Written: {OUT_CSV}")


if __name__ == "__main__":
    main()
