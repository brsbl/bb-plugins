# Coordinator Mode

Turn any thread into a coordinator that tracks your asks, starts sub-threads, and follows your rules.

![Coordinator panel with decisions waiting in Needs you](https://github.com/user-attachments/assets/d51eaa0b-c084-4dd6-968f-6593a4481ff6)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/coordinator-mode --yes
```

## Use

Open a thread's **Coordinator** panel and pick a template: Ship, Release, Bug
triage, or Content. You can also choose **Describe your process** and let an
agent draft one. Review the purpose, stages, coordinator rules, sub-thread
rules, and briefing schedule, then choose **Turn on**. To start a fresh
coordinator, use **New coordinator** in Settings → Coordinator Mode.

- **Items:** ask in chat as usual. The coordinator tracks an item for each
  ask, with a one-line summary and what it's waiting on. Sub-threads that
  already exist when you turn it on are tracked too, but Coordinator Mode
  never auto-approves their requests. A message that starts with the
  template's prefix (Ship uses `worker:`) creates the item and starts its
  sub-thread immediately. **Stop tracking** is in each row's ⋯ menu.
- **Stages:** an item moves forward only when its stage's check passes. A check
  can be a PR opening or merging, CI going green, your Approve, a review
  sub-thread's pass, or an added link. Reject or a failed check sends it back
  one stage with the reason.
- **Coordinator rules:** starting and archiving sub-threads, merging PRs, and
  `bb digest publish` each go in one of three columns: does alone, asks you
  first, or never. These are enforced, including when the coordinator or a
  sub-thread runs the command directly. Other rules you write are kept as
  instructions and marked as not enforced.
- **Decisions:** your QA approvals and "asks you first" actions sit at the top
  of the panel. With [Action Cards](../inline-action-cards) installed, each
  decision is also an Action Cards card in the briefing and the Action log;
  answering it anywhere resolves it everywhere.
- **Briefings:** say "catch me up" for what changed since you last opened the
  coordinator, what needs you, and what's next. Templates can also brief you on
  a schedule; with Briefs installed, scheduled briefs land in your Briefs inbox.

Coordinator Mode approves ordinary commands for a coordinator and its
sub-threads so they don't stall. You can turn that off in the panel, and every
approval is logged. The header's ⋯ menu holds **Pause** (stops checks,
briefings, and gated actions), the auto-approve switch, **Edit rules**, and
**Turn off** (keeps the thread and removes the tracker).

Limits: coordinator rules are guardrails against agent mistakes, not a
security boundary. Agents run commands as you, so a determined agent can find
a command form the check doesn't recognize. Rules are enforced through
Coordinator Mode's tools and the approval requests a provider raises before
running commands. Coordinator Mode never changes a thread's permission mode;
sub-threads use the coordinator's provider and permission mode. A provider that
runs commands without asking bypasses the command check: Codex in its sandbox,
or Claude Code when your settings already allow the command. Merges like that
are flagged as "Rule broken" afterwards. Commands that look like a
gated action but can't be parsed are left for you to answer. Review sub-threads are started
by the coordinator, so a review verdict is only as independent as its prompt.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-coordinator-mode
bb plugin install "path:$PWD/plugins/coordinator-mode" --yes
```
