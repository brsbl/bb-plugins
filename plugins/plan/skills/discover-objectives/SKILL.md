---
name: discover-objectives
description: Derive candidate objectives for a Plan company priority as one independent research submission (slot a or b) and submit it with bb plan research submit. Use when a Plan research thread's brief asks you to derive objectives for a company priority.
---

# Derive objectives

You are one of two independent agents (org-status README §6). Work alone
from original sources. Don't read, search for or message the other research
thread, and don't change Plan records.

| Part | Detail |
| --- | --- |
| **From** | A company priority: its metric, target, date, constraints and the work already underway |
| **Steps** | Find what blocks or could move the metric → propose distinct objectives, including work already underway → estimate each one's lift |
| **Gives** | Candidate objectives with an owner, rationale, lift where it can be supported, effort and dependencies. The user chooses which to adopt. |
| **Can't pass if** | Second submission missing, or the link to the company metric isn't sourced |

## Submission

```json
{
  "candidates": [
    {
      "key": "activation",
      "name": "Lift download → week-1 activation",
      "rationale": "Why this moves the priority's metric",
      "metricLink": { "claim": "How it reaches the company metric", "sources": ["…"] },
      "owner": { "proposal": "Growth / Conversion owns onboarding", "threadId": "thr_…" },
      "effort": "About 3 weeks",
      "dependencies": "Analytics event for first project",
      "lift": { "…": "see calculate-lift" }
    }
  ],
  "limitations": "What you couldn't check and what would change the answer"
}
```

- `key` is your own stable label, unique in the submission.
- Each candidate has `lift` (shaped by the `calculate-lift` skill) or
  `"unsized": { "missing": "…" }`, never both.
- `owner.threadId` is optional and must be an existing org or team thread.
- Include objectives for work already underway.

## Submit

Save the JSON, then run:

```sh
bb plan research submit --request <rr_id> --slot <a|b> --file submission.json
```

Use `--data-stdin` instead of `--file` when the file isn't on the bb server's
machine. A rejection lists every problem; fix them and submit again. An
accepted submission is final.
