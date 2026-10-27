---
name: reconcile-research
description: Reconcile the two saved independent Plan research submissions for one request claim by claim and submit the result with bb plan research reconcile, which publishes it to the Plan. Use when a Plan reconciliation thread gives you both submissions.
---

# Reconcile research

Both submissions were saved before you saw them (org-status README §6).
Compare them claim by claim: sources, scope, calculations, method and
interpretation. Use primary evidence to settle factual disputes. Don't
average incompatible results, vote, or make one agent conform to the other.
Don't message any other thread or change Plan records.

## Reconciliation

Same shape as the submission (`candidates` for objectives; `coverage` and
`investments` for portfolios), plus tracing:

```json
{
  "investments": [
    {
      "key": "checklist",
      "from": [{ "slot": "a", "key": "checklist" }, { "slot": "b", "key": "onboarding" }],
      "liftFrom": { "slot": "a", "key": "checklist" },
      "…": "all the submission fields for this item"
    }
  ],
  "disagreements": [
    {
      "topic": "Checklist lift",
      "affects": ["checklist"],
      "positions": { "a": "+40 from the experiment", "b": "+15 from a forecast" },
      "resolution": "The experiment's population matches the metric; b's forecast used installs",
      "resolved": true
    }
  ],
  "excluded": [{ "slot": "b", "key": "ads", "reason": "Outside the objective's scope" }],
  "limitations": "…"
}
```

Checks code enforces:

- Every item traces (`from`) to at least one submission item. Nothing new
  appears without a source in a submission.
- Every submission item is reconciled or listed in `excluded` with a reason.
- An item from only one submission, or one where the lifts differ, is listed
  in `disagreements` with a resolution.
- `lift` is copied exactly from a traced item (`liftFrom`), or recomputed
  with `"recomputation": { "reason": "…" }` and all inputs shown per the
  `calculate-lift` skill.
- An unresolved disagreement (`"resolved": false`) leaves its items without
  lift: give `"unsized": { "missing": "<the exact unanswered question>" }`.
- Portfolios still include every existing investment and documented coverage.

## Submit

```sh
bb plan research reconcile --request <rr_id> --file reconciliation.json
```

A valid reconciliation publishes: objectives appear as proposed, and
portfolio items get their lift and a computed rank. Unsized items stay
unranked with what's missing recorded.
