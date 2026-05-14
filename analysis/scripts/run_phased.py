"""Phase-structured simulation orchestrator.

The XMILE model runs with constant output_rate / content_complexity over
its full horizon. This orchestrator splits a run into the 10 Phases of
the governance workflow, varying output_rate and content_complexity per
Phase, and chaining stock state across Phases.

This addresses the SC panel CRITICAL gap: spec-implementation mismatch
where the previous v0.1 model could not produce Phase-level QCD.
"""
from __future__ import annotations

import json
from pathlib import Path

import pandas as pd
import pysd

MODEL_PATH = Path(__file__).resolve().parents[2] / "model" / "language_experiment.xmile"
REPORT_PATH = Path(__file__).resolve().parents[1] / "reports" / "phased_runs.json"

# Phase schedule from plan v2.1 (5.13.2): name, duration[min], output_rate[char/min],
# content_complexity, type (prose=more affected by language, code=less affected).
PHASES = [
    {"id": "01", "name": "Req",    "dur": 15, "rate":  90, "cx": 0.8, "type": "prose"},
    {"id": "02", "name": "ADR",    "dur": 15, "rate":  60, "cx": 0.4, "type": "mixed"},
    {"id": "03", "name": "Design", "dur": 30, "rate": 100, "cx": 0.9, "type": "prose"},
    {"id": "03a","name": "Annot",  "dur": 10, "rate":  80, "cx": 0.5, "type": "prose"},
    {"id": "04", "name": "Impl",   "dur": 60, "rate": 120, "cx": 0.6, "type": "code"},
    {"id": "05", "name": "Unit",   "dur": 30, "rate": 110, "cx": 0.4, "type": "code"},
    {"id": "06", "name": "Integ",  "dur": 20, "rate": 110, "cx": 0.6, "type": "code"},
    {"id": "07", "name": "System", "dur": 30, "rate": 110, "cx": 0.7, "type": "code"},
    {"id": "08", "name": "PR",     "dur": 10, "rate":  80, "cx": 0.4, "type": "prose"},
    {"id": "10", "name": "Retro",  "dur": 15, "rate":  90, "cx": 0.6, "type": "prose"},
]

LANG_PARAMS = {
    "english":  {"alpha_token_eff": 0.188, "rs_prose": 200.0, "rs_code": 400.0, "alpha_write_prose": 0.90, "alpha_write_code": 1.00},
    "japanese": {"alpha_token_eff": 1.047, "rs_prose": 600.0, "rs_code": 400.0, "alpha_write_prose": 1.00, "alpha_write_code": 0.95},
}

STOCKS = [
    "cognitive_load", "fatigue", "shared_understanding",
    "cumulative_tokens", "latent_defects", "known_defects",
    "clarification_count", "correction_count", "redirect_count", "approval_count",
]


def simulate_phase(phase: dict, lang: str, initial_state: dict) -> pd.DataFrame:
    """Run a single Phase: starts at t=0 with provided initial stock values,
    runs for phase['dur'] minutes with the Phase's output_rate / complexity.
    """
    model = pysd.read_xmile(str(MODEL_PATH))
    # rs_prose vs rs_code: choose based on content type
    rs = LANG_PARAMS[lang]["rs_prose"] if phase["type"] == "prose" else LANG_PARAMS[lang]["rs_code"]
    aw = LANG_PARAMS[lang]["alpha_write_prose"] if phase["type"] == "prose" else LANG_PARAMS[lang]["alpha_write_code"]
    params = {
        "alpha_token_eff": LANG_PARAMS[lang]["alpha_token_eff"],
        "rs_prose": rs,  # the model only consumes rs_prose; rs_code unused in eqns
        "alpha_write_prose": aw,
        "output_rate": phase["rate"],
        "content_complexity": phase["cx"],
    }
    return model.run(
        params=params,
        initial_condition=(0, initial_state),
        return_columns=STOCKS,
        final_time=phase["dur"],
        time_step=1,
    )


def run_full(lang: str) -> dict:
    """Execute all 10 Phases sequentially, chaining stock state."""
    state = {
        "cognitive_load": 20.0,
        "fatigue": 10.0,
        "shared_understanding": 50.0,
        "cumulative_tokens": 0.0,
        "latent_defects": 0.0,
        "known_defects": 0.0,
        "clarification_count": 0.0,
        "correction_count": 0.0,
        "redirect_count": 0.0,
        "approval_count": 0.0,
    }
    per_phase: dict[str, dict] = {}
    elapsed = 0
    for phase in PHASES:
        df = simulate_phase(phase, lang, state)
        last = df.iloc[-1]
        new_state = {s: float(last[s]) for s in STOCKS}
        per_phase[phase["id"]] = {
            "name": phase["name"],
            "duration_min": phase["dur"],
            "elapsed_at_exit_min": elapsed + phase["dur"],
            "delta": {s: new_state[s] - state[s] for s in STOCKS},
            "end_state": new_state,
        }
        state = new_state
        elapsed += phase["dur"]
    return {"final": state, "per_phase": per_phase, "total_minutes": elapsed}


def main() -> None:
    runs = {lang: run_full(lang) for lang in ("english", "japanese")}
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(json.dumps(runs, indent=2))

    # Compact comparison table
    rows = []
    for phase in PHASES:
        en = runs["english"]["per_phase"][phase["id"]]
        ja = runs["japanese"]["per_phase"][phase["id"]]
        rows.append({
            "phase": f"{phase['id']} {phase['name']}",
            "type": phase["type"],
            "en_tokens": en["delta"]["cumulative_tokens"],
            "ja_tokens": ja["delta"]["cumulative_tokens"],
            "en_load": en["end_state"]["cognitive_load"],
            "ja_load": ja["end_state"]["cognitive_load"],
            "en_qd_intv": en["delta"]["correction_count"] + en["delta"]["redirect_count"],
            "ja_qd_intv": ja["delta"]["correction_count"] + ja["delta"]["redirect_count"],
            "en_clarif": en["delta"]["clarification_count"],
            "ja_clarif": ja["delta"]["clarification_count"],
        })
    df = pd.DataFrame(rows)
    pd.set_option("display.float_format", lambda x: f"{x:,.2f}")
    print("\n=== Per-Phase Comparison (delta within each Phase) ===\n")
    print(df.to_string(index=False))

    print("\n=== Product-level Totals ===\n")
    for lang in ("english", "japanese"):
        f = runs[lang]["final"]
        print(f"{lang:>8}: tokens={f['cumulative_tokens']:>10,.0f}  "
              f"load={f['cognitive_load']:>5.1f}  "
              f"fatigue={f['fatigue']:>5.1f}  "
              f"U={f['shared_understanding']:>5.1f}  "
              f"clarif={f['clarification_count']:>5.1f}  "
              f"corr={f['correction_count']:>5.1f}  "
              f"redir={f['redirect_count']:>5.1f}  "
              f"defects(known)={f['known_defects']:>5.1f}")


if __name__ == "__main__":
    main()
