"""Validation tests for the 4-class intervention dynamics added in v0.2."""
from __future__ import annotations

from pathlib import Path

import pysd
import pytest

MODEL_PATH = Path(__file__).resolve().parents[1] / "model" / "language_experiment.xmile"


@pytest.fixture
def model():
    return pysd.read_xmile(str(MODEL_PATH))


def test_intervention_stocks_are_monotone_nondecreasing(model):
    """Counts accumulate; they never decrease."""
    df = model.run(
        return_columns=[
            "clarification_count",
            "correction_count",
            "redirect_count",
            "approval_count",
        ],
    )
    for col in df.columns:
        diffs = df[col].diff().dropna()
        assert (diffs >= -1e-9).all(), f"{col} decreased somewhere"


def test_jp_native_has_fewer_clarifications_in_japanese(model):
    """Faster reading (rs_prose=600) reduces comprehension-driven interventions."""
    df_en = model.run(params={"rs_prose": 200.0}, return_columns=["clarification_count"])
    df_jp = model.run(params={"rs_prose": 600.0}, return_columns=["clarification_count"])
    assert df_jp["clarification_count"].iloc[-1] < df_en["clarification_count"].iloc[-1]


def test_fatigue_suppression_lowers_intervention_rates(model):
    """B2 archetype: high fatigue must reduce intervention generation rates.
    Verify by comparing total interventions across two fatigue regimes.
    """
    df_lo_fat = model.run(
        params={"fatigue_accumulation_rate": 0.01},
        return_columns=["clarification_count", "correction_count", "redirect_count"],
    )
    df_hi_fat = model.run(
        params={"fatigue_accumulation_rate": 0.20},
        return_columns=["clarification_count", "correction_count", "redirect_count"],
    )
    total_lo = sum(df_lo_fat[c].iloc[-1] for c in df_lo_fat.columns)
    total_hi = sum(df_hi_fat[c].iloc[-1] for c in df_hi_fat.columns)
    assert total_hi < total_lo, "Higher fatigue should suppress intervention generation"


def test_low_understanding_increases_corrections(model):
    """Correction generation should rise as shared_understanding falls."""
    df_low = model.run(params={"alpha_write_prose": 0.3}, return_columns=["correction_count"])
    df_high = model.run(params={"alpha_write_prose": 1.0}, return_columns=["correction_count"])
    assert df_low["correction_count"].iloc[-1] > df_high["correction_count"].iloc[-1]


def test_high_load_increases_redirects(model):
    """Redirect generation rises with cognitive load (wrong-direction drift)."""
    df_easy = model.run(
        params={"output_rate": 50.0, "content_complexity": 0.2},
        return_columns=["redirect_count"],
    )
    df_hard = model.run(
        params={"output_rate": 200.0, "content_complexity": 0.9},
        return_columns=["redirect_count"],
    )
    assert df_hard["redirect_count"].iloc[-1] > df_easy["redirect_count"].iloc[-1]


def test_high_understanding_increases_approvals(model):
    """Approval rate scales with shared understanding."""
    df_low = model.run(params={"alpha_write_prose": 0.3}, return_columns=["approval_count"])
    df_high = model.run(params={"alpha_write_prose": 1.0}, return_columns=["approval_count"])
    assert df_high["approval_count"].iloc[-1] > df_low["approval_count"].iloc[-1]


def test_all_four_intervention_classes_exist_and_grow(model):
    """Smoke test: every intervention class generates non-zero accumulation."""
    df = model.run(
        return_columns=[
            "clarification_count",
            "correction_count",
            "redirect_count",
            "approval_count",
        ],
    )
    final = df.iloc[-1]
    for col in df.columns:
        assert final[col] > 0, f"{col} did not accumulate; check generation flow"
