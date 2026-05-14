# Model Limitations

Honest list of assumptions and what this model **cannot** tell us.

## Purpose Statement (Sterman BD ch.5)

> "Predict the relative magnitude of token cost vs. cognitive load
> across two output language strategies for a single JP-native user
> working through the 10-Phase calculator experiment, sufficient to
> inform pre-experiment hypothesis generation and Phase-level
> measurement design."

The model is a **Conceptual Aid** for hypothesis generation, **not** a
predictive simulator for decision-making.

## Key Simplifications

1. **Single user**: No team dynamics, no collaboration effects.
2. **Single session per run**: Cross-run memory bleed handled operationally, not modeled.
3. **No Phase content drift**: Output volume and complexity vary by Phase but
   are deterministic schedules, not stochastic.
4. **Linear-in-tokens cost**: USD cost is `tokens × constant`; no rate tier effects.
5. **No external surprises**: No API outages, latency spikes, or model regressions.
6. **Bounded stocks**: `cognitive_load`, `fatigue`, `shared_understanding` are
   clamped to [0, 100] via logistic saturation. Real cognition has different
   saturation curves.
7. **Intervention 4-classification is symmetric**: All 4 types are generated
   by the same rate equation, scaled by different coefficients. Real
   interventions have context-dependent triggers not captured here.

## What This Model Can Say (✓)

- Qualitative direction: which language has higher cognitive load for a
  JP-native user (given calibrated `α_token_eff`, `rs_prose`)
- Ranking of parameters by influence (Sobol)
- Whether system structure produces growth-limit, shifting-the-burden, or
  similar archetype patterns
- Where in the 10-Phase schedule the language effect is strongest

## What This Model Cannot Say (✗)

- Absolute token counts (model is order-of-magnitude only without calibration)
- Which specific Phase will succeed or fail
- The "correct" output language (depends on stakeholder values, not measured here)
- Predictions for users with different English skill levels (only one user
  parameterized)
- Long-term effects (model horizon = 300 min)

## Calibration Status

| Parameter           | Status                            | Source                        |
| ------------------- | --------------------------------- | ----------------------------- |
| `alpha_token_eff`   | **Measured (tiktoken)**           | `analysis/scripts/measure_token_density.py` |
| `rs_prose`          | Estimated (typical JP-native)     | Public reading-speed studies  |
| `rs_code`           | Estimated (language-independent)  | Common assumption             |
| `alpha_write_*`     | Estimated (no measurement)        | Modeler judgment              |
| Decay rates         | Estimated (typical SD defaults)   | Modeler judgment              |
| Defect coefficients | Estimated (no historical data)    | Modeler judgment              |

All parameters marked "Estimated" are **assumed, not measured**. They are
candidates for post-experiment Bayesian calibration once real data is collected.

## Validation Status (Sterman 12-test checklist)

| #  | Test                         | Status |
| -- | ---------------------------- | ------ |
| 1  | Boundary adequacy            | ✅ (SYSTEM_BOUNDARY.md) |
| 2  | Structure assessment         | ⚠️ Partial (CLD drawn) |
| 3  | Dimensional consistency      | ✅ (test_dimensional.py) |
| 4  | Parameter assessment         | ⚠️ Partial (1 of 6 measured) |
| 5  | Extreme conditions           | ✅ (test_extreme_conditions.py) |
| 6  | Integration error            | ✅ (test_integration_method.py) |
| 7  | Behavior reproduction        | ⚠️ Pending real data |
| 8  | Behavior anomaly             | ⏳ Not yet |
| 9  | Family member                | ⏳ Not yet |
| 10 | Surprise behavior            | ⏳ Not yet |
| 11 | Sensitivity                  | ✅ (sensitivity_sobol.py) |
| 12 | System improvement (utility) | ⏳ Evaluated post-experiment |

Current: **6 of 12** Sterman validation tests passed/partial.
