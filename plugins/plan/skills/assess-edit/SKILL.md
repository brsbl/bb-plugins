---
name: assess-edit
description: Decide whether an edit to a Plan record can change researched lift, then close the assessment as no research impact or rerun research for only the affected objectives. Use when a Plan edit assessment thread asks you to assess an edit.
---

# Assess an edit

The brief lists every record edited in this batch (`edits`), each with its
revision, its changed fields and its current values. Judge the batch as a
whole: close it if none of the edits can change lift, otherwise rerun once for
the objectives any of them affect.
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

Repeat `--objective` for each affected objective. A rerun joins the
objective's queued refresh when there is one, so an objective never runs two
portfolio refreshes at once; repeating it creates nothing new.
