"""Sterman validation #6: Integration error / numerical method robustness.

Compares Euler dt=1 against Euler dt=0.1. Final stock values should
agree within 2% — large divergence indicates the model is too stiff
for dt=1 and needs RK4 or smaller dt.
"""
from __future__ import annotations

from pathlib import Path

import pysd
import pytest

MODEL_PATH = Path(__file__).resolve().parents[1] / "model" / "language_experiment.xmile"


@pytest.fixture
def stocks():
    return [
        "cognitive_load",
        "fatigue",
        "shared_understanding",
        "cumulative_tokens",
        "latent_defects",
        "known_defects",
        "clarification_count",
        "correction_count",
    ]


@pytest.mark.parametrize("col", [
    "cognitive_load",
    "fatigue",
    "shared_understanding",
    "cumulative_tokens",
    "clarification_count",
    "correction_count",
])
def test_dt_refinement_converges(col):
    """Final stock at dt=1 must match dt=0.1 within 2%."""
    m1 = pysd.read_xmile(str(MODEL_PATH))
    m2 = pysd.read_xmile(str(MODEL_PATH))
    df_coarse = m1.run(params={"time_step": 1.0}, return_columns=[col])
    df_fine = m2.run(params={"time_step": 0.1}, return_columns=[col])
    v_c = df_coarse[col].iloc[-1]
    v_f = df_fine[col].iloc[-1]
    denom = max(abs(v_f), 1e-9)
    rel_err = abs(v_c - v_f) / denom
    assert rel_err < 0.02, (
        f"{col} integration error too large at dt=1 vs dt=0.1: "
        f"v_c={v_c:.4f}, v_f={v_f:.4f}, rel_err={rel_err:.4f}"
    )
