# Plan

Plan company priorities, objectives and ranked portfolios beside the agent, then start one investment at a time per team.

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/plan --yes
```

## Use

Plan keeps shared planning records that you and the agent beside you both edit: company priorities, the objectives under each, and the investments that make up each objective's portfolio. Agents use the `plan` tool; people and scripts use `bb plan`. Both run the same validation.

```bash
bb plan show
bb plan priority add "Grow weekly active users" --metric "weekly active users" --baseline 1200 --now 1450 --target 2000 --by 2027-01-31
bb plan objective add <priority-id> "Lift download to week-1 activation" --assign <team-thread-id>
bb plan objective approve <objective-id> --expected-revision 1
bb plan objective assign <objective-id> --thread <team-thread-id> --expected-revision 2
bb plan investment add <objective-id> "Install-page copy test" --existing --deliverable "Winning copy shipped"
bb plan investment edit <investment-id> --scope "Copy only" --expected-revision 1
```

- Every edit, approve and assign takes `--expected-revision`. An edit based on an older revision is rejected, never applied over a newer one.
- Records save with fields missing. Add `--json` to any command for machine-readable output.
- Assigning stores an existing org or team thread's ID; the name shown is read from the thread. Adding or assigning a record sends nothing and wakes no thread.
- Objectives an agent proposes (`--proposed`) stay unapproved until adopted with `approve`.
- Lift and investment state are not editable through `edit`.

## Research

Adding a priority, approving and assigning an objective, adding an investment, or editing a record queues research. Research is batched: each objective has at most one portfolio research run at a time, and investment adds or reruns that arrive while one is queued or running fold into a single follow-up run that covers all of them. Edits under the same objective (or to the same priority) within 120 seconds of each other produce one edit assessment covering every changed record and field. Plan runs each request itself: two independent research threads, then one reconciliation thread once both submissions are saved. Research, reconciliation and assessment threads are hidden from bb's thread list; open them from an investment's "Open both submissions" links or with `bb plan research show`. Only a valid reconciliation reaches the records. Lift is written only by that publish step, and the rank is computed from base lift.

```bash
bb plan research list [--phase researching] [--json]
bb plan research show <request-id>
bb plan research submit --request <request-id> --slot a --file submission.json
bb plan research reconcile --request <request-id> --data-stdin < reconciliation.json
bb plan research close --request <request-id> --reason "Rename only"
bb plan research rerun --request <request-id> --objective <objective-id> --reason "Target changed"
```

- `submit`, `reconcile`, `close` and `rerun` are for the research threads Plan creates, and are rejected from any other thread or with no calling thread; the method skills (`discover-objectives`, `build-portfolio`, `calculate-lift`, `reconcile-research`, `assess-edit`) describe the JSON each takes. A rejection lists every problem to fix.
- Settings: `researchProjectId` is the project for research threads (default: the project of the plan's first assigned team thread; otherwise the request shows as blocked). `researchConcurrency` caps requests in flight (default 2).

## Start and Done

Start sends an investment's saved brief (deliverable, scope, acceptance criteria, measurement, sources, and the command to report back) to its objective's team thread and marks it In progress. The panel's Start button, `bb plan investment start` and the `investment_start` tool action run the same check and send.

```bash
bb plan investment start --id <investment-id>
bb plan investment deliver --id <investment-id> --output delivery.json
```

- Start needs checked, ranked lift, an approved objective whose team thread still exists, a brief with a deliverable and acceptance criteria (one per line), and a team with nothing In progress under any objective. Each missing item is listed in the error.
- A team is its assigned thread. Only one of its investments can be starting or In progress at a time; two clicks or a click and a CLI call can't start two.
- When bb doesn't confirm the send, the Start stays reserved; starting again checks the team thread's messages before sending, so the brief is never sent twice. A refused send frees the team and shows the error.
- `deliver` works only from the team thread the brief went to, or one of its workers. `--output` is JSON (inline or a file path) with `deliverable`, one `{ "criterion", "evidence" }` entry for every acceptance criterion, and `measurement` when the brief has one. A valid delivery marks the investment Done and frees the team; the next investment never starts on its own.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-plan
bb plugin install "path:$PWD/plugins/plan" --yes
```
