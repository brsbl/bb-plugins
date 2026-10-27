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
- An item from only one submission, or one where the two lifts differ in
  unit, period, population, baseline, method, base lift, range or sources, is
  listed in `disagreements` with a resolution. The rejection names which of
  these differ.
- `lift` is copied exactly from a traced item (`liftFrom`), or recomputed
  with `"recomputation": { "reason": "…" }` and all inputs shown per the
  `calculate-lift` skill.
- An unresolved disagreement (`"resolved": false`) leaves its items without
  lift: give `"unsized": { "missing": "<the exact unanswered question>" }`.
  While any disagreement is unresolved, nothing in the portfolio is ranked;
  every sized item records why under its missing evidence.
- Portfolio items keep their brief fields (`deliverable`, `scope`,
  `acceptanceCriteria`, `measurement`, `sources`), `cost` and `dependencies`.
- Portfolios still include every existing investment and documented coverage.

## Submit

```sh
bb plan research reconcile --request <rr_id> --file reconciliation.json
```

A valid reconciliation publishes: objectives appear as proposed, and
portfolio items get their lift, their brief and a computed rank. Only items on
the main shared unit, period and population are ranked; unsized items and
items on another basis stay unranked with the reason recorded.

The brief above is the one both submissions were made against. If a record in
it changed after the request started, the reconcile call returns
`"superseded": true`, publishes nothing, and Plan queues a fresh run. Stop
there.
