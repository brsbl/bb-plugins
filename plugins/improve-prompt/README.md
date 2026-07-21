# Improve Prompt

Improve Prompt rewrites a rough bb composer draft into a concise, context-complete request — without sending it. Reach for it when a prompt is underspecified or you want a cleaner handoff before it goes to an agent.

![Improve Prompt working on a draft in the bb composer](docs/screenshot-running.png)

![The improved prompt returned for review in the bb composer](docs/screenshot-result.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/improve-prompt --yes
```

## Use

Write a draft, choose **Improve prompt**, review the replacement in place, and send when ready. Attachments stay attached, and the text change can be undone.

Two parts own two jobs. The plugin owns the composer action, the hidden helper thread it runs the rewrite in, progress state, result insertion, and undo. The bundled [`prompt-shaper` skill](skills/prompt-shaper/SKILL.md) owns the shaping instructions and reads the current bb thread and its linked context for each run.

**Maintenance model.** The plugin runtime and the `prompt-shaper` skill are separate parts, and personalization lives in the skill. Observed thread and handoff behavior can both shape and maintain it: [`maintenance/skill-tuning.md`](maintenance/skill-tuning.md) is a reproducible, checkpointed pass that reads your recent handoffs as redacted evidence with [`tooling/bb-history.mjs`](../../tooling/bb-history.mjs), folds only repeating signal into `SKILL.md`, and validates the workspace before committing only the skill. It can run on a schedule (see [`maintenance/bootstrap-prompt.md`](maintenance/bootstrap-prompt.md)) so the skill keeps up with how your handoffs actually go. The stable plugin ID stays `prompt-shaper` even though the display name is Improve Prompt.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-prompt-shaper
bb plugin install "path:$PWD/plugins/improve-prompt" --yes
```

**Adapt it to your prompting style.** [`maintenance/bootstrap-prompt.md`](maintenance/bootstrap-prompt.md) is one copy/paste prompt that forks the repo, seeds evidence from your handoffs, rewrites [`skills/prompt-shaper/SKILL.md`](skills/prompt-shaper/SKILL.md) around your own context rules, guardrails, and stopping conventions, and schedules the recurring refresh — the composer runtime stays the same. [`maintenance/skill-tuning.md`](maintenance/skill-tuning.md) is the single checkpointed pass it repeats. Keep the `prompt-shaper` package and plugin ID for install compatibility.

See [import provenance](../../docs/provenance.md) — imported from `brsbl/bb-plugin-prompt-shaper`; the rejected bb core PR #808 was not brought over.
