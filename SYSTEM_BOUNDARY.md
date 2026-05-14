# System Boundary

Following Meadows (*Thinking in Systems* ch.5): explicit boundary statement.

## Endogenous (内生)

- `cognitive_load` — user cognitive load (0..100)
- `fatigue` — user fatigue (0..100)
- `shared_understanding` — user-Claude shared mental model (0..100)
- `cumulative_tokens` — total output tokens consumed
- `latent_defects` / `known_defects` — defect lifecycle
- `clarification_count` / `correction_count` / `redirect_count` / `approval_count` — intervention dynamics by type

## Exogenous (外生 — input parameters that shape behavior)

- `output_lang` choice (English / Japanese)
- `output_rate(t)` — Phase-dependent output volume schedule
- `content_type(t)` — Phase-dependent prose / code / mixed
- `content_complexity(t)` — Phase-dependent complexity
- `alpha_token_eff` — language-specific tokens-per-character ratio (calibrated via `tiktoken`)
- `rs_prose` / `rs_code` — user read speed
- `alpha_write_*` — Claude output quality
- Decay rates: `load_decay_rate`, `fatigue_accumulation_rate`, `understanding_decay_rate`
- Defect rates: `defect_intro_coef`, `defect_discovery_coef`

## Excluded (除外)

- Business value, organizational culture
- Claude model version changes (would invalidate all parameters)
- Long-term user English-skill growth across runs
- Memory bleed between runs (mitigated by Pre-Run Checklist, not modeled)
- Server latency (treated as reference value only per plan v2)
- Multiple users / collaboration effects
- Cost in USD (derived post-simulation from token count × price)

## Rationale

- The boundary is drawn at "one user, one session, one Phase-structured experiment run."
- Cross-run effects are externalized to the pre-run checklist (operational control), not modeled.
- USD cost is post-processed because Claude pricing is exogenous to the experiment dynamics.

## Boundary Adequacy Test (Sterman validation #1)

For the question "**which output language is more efficient for a JP-native user**?":
- The boundary must include user cognitive dynamics ✅
- The boundary must include token generation ✅
- The boundary must include defect/quality dynamics ✅
- The boundary need NOT include market value, team dynamics ✅ (excluded)

→ Boundary is **adequate** for the stated purpose.
