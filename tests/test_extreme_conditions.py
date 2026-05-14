"""Extreme condition tests (Sterman BD ch.21 validation #4).

Each test pushes a parameter to its physical/logical extreme and asserts
that the model behaves sensibly rather than producing nonsensical output
(e.g., negative defects, infinite stocks, division by zero).
"""
from __future__ import annotations

from pathlib import Path

import pysd
import pytest

MODEL_PATH = Path(__file__).resolve().parents[1] / "model" / "language_experiment.xmile"


@pytest.fixture
def model():
    return pysd.read_xmile(str(MODEL_PATH))


def test_zero_output_rate_stops_token_consumption(model):
    """If nothing is produced, no tokens are consumed."""
    df = model.run(params={"output_rate": 0.0}, return_columns=["cumulative_tokens"])
    assert df["cumulative_tokens"].iloc[-1] == 0.0


def test_zero_output_rate_keeps_defects_at_zero(model):
    """No output → no defects introduced."""
    df = model.run(
        params={"output_rate": 0.0},
        return_columns=["latent_defects", "known_defects"],
    )
    assert df["latent_defects"].iloc[-1] == pytest.approx(0.0, abs=1e-9)
    assert df["known_defects"].iloc[-1] == pytest.approx(0.0, abs=1e-9)


def test_max_token_efficiency_minimizes_tokens(model):
    """Lower α_token_eff → fewer tokens (monotonic)."""
    df_lo = model.run(params={"alpha_token_eff": 0.10}, return_columns=["cumulative_tokens"])
    df_hi = model.run(params={"alpha_token_eff": 0.90}, return_columns=["cumulative_tokens"])
    assert df_lo["cumulative_tokens"].iloc[-1] < df_hi["cumulative_tokens"].iloc[-1]


def test_high_write_quality_increases_understanding(model):
    """Higher α_write (Claude prose quality) raises steady-state U,
    which in turn suppresses defect introduction (chain effect).
    """
    df_low = model.run(
        params={"alpha_write_prose": 0.5, "output_rate": 200.0},
        return_columns=["shared_understanding", "latent_defects"],
    )
    df_high = model.run(
        params={"alpha_write_prose": 1.0, "output_rate": 200.0},
        return_columns=["shared_understanding", "latent_defects"],
    )
    assert df_high["shared_understanding"].iloc[-1] > df_low["shared_understanding"].iloc[-1]
    assert df_high["latent_defects"].iloc[-1] <= df_low["latent_defects"].iloc[-1]


def test_no_stock_goes_negative(model):
    """Across a wide parameter sweep, no stock should ever go negative."""
    test_params = [
        {"alpha_token_eff": 0.30, "rs_prose": 150.0},
        {"alpha_token_eff": 0.80, "rs_prose": 700.0},
        {"alpha_write_prose": 0.80},
        {"defect_intro_coef": 0.001},
        {"defect_intro_coef": 0.01},
    ]
    for p in test_params:
        df = model.run(
            params=p,
            return_columns=[
                "cognitive_load",
                "fatigue",
                "shared_understanding",
                "cumulative_tokens",
                "latent_defects",
                "known_defects",
            ],
        )
        for col in df.columns:
            assert (df[col] >= -1e-9).all(), (
                f"{col} went negative under params {p}: min={df[col].min()}"
            )


def test_stocks_remain_bounded(model):
    """Bounded stocks (load, fatigue, understanding) stay within [0, 100]."""
    df = model.run(
        return_columns=["cognitive_load", "fatigue", "shared_understanding"],
    )
    for col in ["cognitive_load", "fatigue", "shared_understanding"]:
        assert df[col].max() <= 100.5, f"{col} exceeded 100: {df[col].max()}"
        assert df[col].min() >= -0.5, f"{col} went below 0: {df[col].min()}"


def test_japanese_consumes_more_tokens_than_english(model):
    """Higher α_token_eff (Japanese) → more tokens (the headline finding)."""
    df_eng = model.run(
        params={"alpha_token_eff": 0.4, "rs_prose": 200.0, "alpha_write_prose": 0.9},
        return_columns=["cumulative_tokens"],
    )
    df_jpn = model.run(
        params={"alpha_token_eff": 0.7, "rs_prose": 600.0, "alpha_write_prose": 1.0},
        return_columns=["cumulative_tokens"],
    )
    assert df_jpn["cumulative_tokens"].iloc[-1] > df_eng["cumulative_tokens"].iloc[-1]


def test_japanese_lowers_cognitive_load_for_jp_native(model):
    """Faster read speed (rs_prose=600 for native) → lower steady-state load."""
    df_eng = model.run(params={"rs_prose": 200.0}, return_columns=["cognitive_load"])
    df_jpn = model.run(params={"rs_prose": 600.0}, return_columns=["cognitive_load"])
    assert df_jpn["cognitive_load"].iloc[-1] < df_eng["cognitive_load"].iloc[-1]


def test_simulation_horizon_consistency(model):
    """Stocks should not diverge as time horizon extends (no runaway growth)."""
    df = model.run(
        return_columns=["cognitive_load", "fatigue", "shared_understanding"],
    )
    last = df.iloc[-1]
    for col in last.index:
        assert last[col] < 200, f"{col} diverged: {last[col]}"
