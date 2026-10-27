---
name: calculate-lift
description: Estimate the lift of one change on a shared metric as a reproducible low/base/high record for a Plan research submission or reconciliation, or record that it can't be sized yet. Use whenever a Plan research brief asks for lift.
---

# Calculate lift

```text
lift = metric with the change − metric at baseline
       (same population and period; reported as low / base / high)
```

| Part | Detail |
| --- | --- |
| **From** | A change, its baseline, the shared metric definition, the population and period |
| **Steps** | Pick the method the evidence supports (experiment, observational comparison or forecast) → source every input → calculate explicitly → work out low, base and high → a second agent reproduces it independently |
| **Gives** | A reproducible lift record, or a checked finding that lift can't be sized yet |
| **Can't pass if** | An input has no source, the units or periods don't match, or a funnel step has no supported link to the next |

## The lift object

Every sized item carries `lift` in exactly this shape. Plan's validator
recomputes it and rejects the whole submission on any mismatch.

```json
{
  "method": "experiment | observational | forecast",
  "methodNote": "What was compared or modeled, and what the design supports",
  "population": "Who is counted",
  "unit": "weekly active users",
  "period": "week ending 2026-12-06",
  "baseline": { "value": 1450, "unit": "weekly active users", "period": "week ending 2026-12-06", "sources": ["…"] },
  "withChange": {
    "low":  { "value": 1470, "unit": "weekly active users", "period": "week ending 2026-12-06", "sources": ["…"] },
    "base": { "value": 1490, "unit": "weekly active users", "period": "week ending 2026-12-06", "sources": ["…"] },
    "high": { "value": 1520, "unit": "weekly active users", "period": "week ending 2026-12-06", "sources": ["…"] }
  },
  "lift": { "low": 20, "base": 40, "high": 70 },
  "funnelSteps": [
    { "step": "Downloads", "value": 800, "unit": "installs", "sources": ["…"], "linkToNext": { "rate": 0.05, "sources": ["…"] } },
    { "step": "Week-1 active", "value": 40, "unit": "weekly active users", "sources": ["…"] }
  ]
}
```

Checks code enforces:

- `lift.low/base/high` equals `withChange.<case>.value − baseline.value`.
- `low ≤ base ≤ high`.
- Every measure uses the estimate's `unit` and `period`. Convert first and
  show the conversion as a funnel step; never compare across units silently.
- Every measure and funnel step has at least one source. Every funnel step
  except the last has `linkToNext` with its own sources.

## Rules

- **Unknown lift is not zero.** If the evidence can't size it, omit `lift` and
  give `"unsized": { "missing": "<the exact evidence that would size it>" }`.
- Plan ranks only items on the same unit, period and population. Use the
  portfolio's shared population, or the item stays unranked.
- Label forecasts `forecast`. Downloads never become active users without a
  sourced conversion step.
- Overlapping effects are never added together; size each change on its own
  against the same baseline.
- Read sources in full, prefer primary data, and record query windows and
  filters in `methodNote` or the source strings so the other agent can rerun
  them.
