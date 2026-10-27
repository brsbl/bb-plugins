---
name: build-portfolio
description: Build or refresh a Plan objective's whole portfolio of existing and new investments as one independent research submission (slot a or b) and submit it with bb plan research submit. Use when a Plan research thread's brief asks you to build or refresh a portfolio.
---

# Build or refresh a portfolio

You are one of two independent agents (org-status README §6). Work alone
from original sources. Don't read, search for or message the other research
thread, and don't change Plan records.

| Part | Detail |
| --- | --- |
| **From** | An objective, its company priority and search scope |
| **Steps** | List existing activity → search for new candidates → record what was covered and excluded → estimate each one's lift → rank |
| **Gives** | The whole portfolio, existing and new, on one shared lift basis, each with a Start-ready brief. Never just the investments chosen to start. |
| **Can't pass if** | Existing activity is left out, coverage is undocumented, or a material disagreement is unresolved |

Plan computes the ranking from base lift. Don't submit ranks.

## Submission

```json
{
  "coverage": {
    "searched": "Where you looked, search terms, time window",
    "excluded": [{ "item": "Paid ads", "reason": "Out of scope per constraints" }],
    "sources": ["…"]
  },
  "investments": [
    {
      "key": "checklist",
      "investmentId": "inv_…",
      "name": "Onboarding checklist",
      "existing": true,
      "cost": "2 engineer-weeks",
      "dependencies": "None",
      "deliverable": "Checklist shipped in every new first thread",
      "scope": "First-thread empty state only; no email or site changes",
      "acceptanceCriteria": "Checklist shows in every new first thread\nCompletion is tracked in Analytics",
      "measurement": "Week-1 active users from the shared metric",
      "sources": ["…"],
      "lift": { "…": "see calculate-lift" }
    }
  ],
  "limitations": "What you couldn't check and what would change the answer"
}
```

- Every investment in the brief's `portfolio` must appear with its
  `investmentId`. Omit `investmentId` only for new candidates.
- Each item has `lift` (shaped by the `calculate-lift` skill) or
  `"unsized": { "missing": "…" }`, never both.
- Every item carries its brief: `deliverable`, `scope`, `acceptanceCriteria`
  (one criterion per line), `measurement` and `sources`. Plan writes them to
  the investment's brief on publish, so Start can hand it to the team, but
  never over a field the user set by hand. Give `cost` and `dependencies`
  even when the item is unsized.
- Put every investment on the same unit, period and population. Plan ranks
  only the main comparable group; items on another basis stay unranked with
  the reason recorded. If one can't share the basis, say why in
  `limitations`.
- Work from the brief in your prompt. It is frozen when the request starts,
  and the other agent and the reconciliation get the same one. If a lift-relevant input
  changes meanwhile, Plan supersedes this request and queues a fresh run; a
  `submit` that returns `accepted: false` with "Superseded" means stop.

## Submit

```sh
bb plan research submit --request <rr_id> --slot <a|b> --file submission.json
```

Use `--data-stdin` instead of `--file` when the file isn't on the bb server's
machine. A rejection lists every problem; fix them and submit again. An
accepted submission is final.
