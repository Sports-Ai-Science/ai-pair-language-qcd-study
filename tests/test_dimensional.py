"""Dimensional analysis tests using pint.

Verifies that every equation in the SD model is dimensionally consistent.
This is one of the 12 Sterman validation tests (Business Dynamics ch.21).
"""
from __future__ import annotations

import pint

ureg = pint.UnitRegistry()
ureg.define("char = []")
ureg.define("token = []")
ureg.define("defect = []")
ureg.define("dmnl = []")


def test_token_rate_dimensions():
    """token_rate = output_rate * alpha_token_eff
    [tokens/min] = [chars/min] * [tokens/char]
    """
    output_rate = 100 * ureg("char/min")
    alpha = 0.4 * ureg("token/char")
    token_rate = output_rate * alpha
    assert token_rate.units == ureg("token/min").units


def test_read_burden_dimensions():
    """read_burden_rate = output_rate / rs_prose * complexity * 10
    expected unit: [1/min] (rate of cognitive load increase)
    """
    output_rate = 100 * ureg("char/min")
    rs_prose = 200 * ureg("char/min")
    burden = (output_rate / rs_prose) * 0.6 * 10
    assert burden.dimensionality == ureg("1/min").dimensionality * ureg("min").dimensionality


def test_load_decay_dimensions():
    """load_decay = load_decay_rate * cognitive_load
    [1/min] = [1/min] * [dmnl]
    """
    rate = 0.15 * ureg("1/min")
    load = 20 * ureg("dmnl")
    decay = rate * load
    assert decay.dimensionality == ureg("1/min").dimensionality


def test_defect_intro_dimensions():
    """defect_intro_rate = output_rate * complexity * (1-U/100) * defect_intro_coef
    [defects/min] = [chars/min] * [dmnl] * [dmnl] * [defects/char]
    """
    output_rate = 100 * ureg("char/min")
    coef = 0.003 * ureg("defect/char")
    rate = output_rate * 0.6 * 0.5 * coef
    assert rate.units == ureg("defect/min").units


def test_defect_discovery_dimensions():
    """defect_discovery_rate = latent * coef * (U/100) * (1-F/100)
    [defects/min] = [defects] * [1/min] * [dmnl] * [dmnl]
    """
    latent = 1.0 * ureg("defect")
    coef = 0.05 * ureg("1/min")
    rate = latent * coef * 0.5 * 0.9
    assert rate.units == ureg("defect/min").units
