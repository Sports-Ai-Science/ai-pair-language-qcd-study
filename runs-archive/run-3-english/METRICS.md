# Run-3 (English Output, ABAB position 3) — Metrics Log

## Run Info

- ABAB position: **3**
- Output language: English
- Conversation language: Japanese
- Model: claude-opus-4-7
- Start: 2026-05-14T13:00:00+09:00
- End: 2026-05-14T13:28:00+09:00
- Isolation: L1 ✅, L3 ✅, L2/L4/L5 ❌ (single session)

## Caveat

Same Claude Code session as Runs 1 and 2. Architectural lessons fully carried
over; CORS bug pre-empted by ADR. This Run is the most carryover-affected of
the four English-language runs.

## Per-Phase Log

| Phase | Start | End | Min | SC | Intv |
| --- | --- | --- | --- | --- | --- |
| 01 Req | 13:00 | 13:02 | 2 | APPROVED | 0 |
| 02 ADR | 13:02 | 13:04 | 2 | APPROVED | 0 |
| 03 Design | 13:04 | 13:06 | 2 | APPROVED | 0 |
| 04 Impl | 13:06 | 13:14 | 8 | APPROVED | 0 |
| 05 Unit | 13:14 | 13:18 | 4 | APPROVED | 0 |
| 06 Integ | 13:18 | 13:20 | 2 | APPROVED | 0 |
| 07 System | 13:20 | 13:24 | 4 | APPROVED | 0 |
| 08 PR | 13:24 | 13:26 | 2 | APPROVED | 0 |
| 10 Retro | 13:26 | 13:28 | 2 | APPROVED | 0 |
| **Total** | 13:00 | 13:28 | **28** | 9/9 | **0** |

## Summary

| Metric | Value |
| --- | --- |
| Calendar elapsed | 28 min |
| Phase Throughput | 9 / 28 = 19.3 phases/hour |
| AC Lead Time | 2.8 min/AC |
| AC Pass Rate | 10/10 = 100% |
| SC Failure Rate | 0% |
| In-Run Bugs | 0 |
| Total Tests | 56 |
| Test Pass Rate | 100% |
| Estimated Output Tokens | ~12,000 (similar to Run-1) |
| Quality-Driven Interventions | 0 |
| Comprehension-Driven Interventions | 0 |
| Autonomy Rate | 100% |
| First-Pass Rate | 9/9 = 100% |

## ABAB Comparison (Position-Trend)

| Position | Run | Lang | Active min | Tokens (est) |
| --- | --- | --- | --- | --- |
| 1 | Run-1 | English | 118 | ~12,000 |
| 2 | Run-2 | Japanese | 65 | ~56,000 |
| 3 | Run-3 | English | 28 | ~12,000 |
| 4 | Run-4 | Japanese | (TBD) | (TBD) |

Position effect is dominant (118 → 65 → 28 min, monotonic decrease)
indicating strong learning carryover. Language effect on tokens (~5x
ratio) remains stable across positions, consistent with H1.
