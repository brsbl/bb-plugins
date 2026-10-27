---
name: assess-edit
description: Decide whether an edit to a Plan record can change researched lift, then close the assessment as no research impact or rerun research for only the affected objectives. Use when a Plan edit assessment thread asks you to assess an edit.
---

# Assess an edit

The brief shows the edited record, its revision and the changed fields.
Don't message any other thread or change Plan records.

| Edit | Decision |
| --- | --- |
| Rename, wording, typo, moving a record without changing its scope | No research impact: the evidence still holds |
| Metric, baseline, target, date, constraints, scope, existing flag, or anything a lift input depends on | Rerun the portfolios whose lift inputs it touches |

Rerun only what the change affects. A priority's target change can affect
every objective under it; an investment's brief change affects only its
objective's portfolio.

## Close or rerun

```sh
bb plan research close --request <rr_id> --reason "Rename only; evidence unchanged"
bb plan research rerun --request <rr_id> --objective <obj_id> --reason "Target moved from 2,000 to 2,400 WAU"
```

Repeat `--objective` for each affected objective. Each rerun creates one
refresh request per objective revision; repeating it creates nothing new.
