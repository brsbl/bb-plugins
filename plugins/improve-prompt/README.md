# Improve Prompt

Improve Prompt rewrites a rough bb composer draft into a concise, context-complete request without sending it.

![Improve Prompt working on a draft in the bb composer](docs/screenshot-running.png)

![The improved prompt returned for review in the bb composer](docs/screenshot-result.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/improve-prompt --yes
```

## Use

Write a draft, choose **Improve prompt**, review the replacement in place, and send when ready. Attachments stay attached, and the text change can be undone.

## How it was built

The runtime plugin and the [`prompt-shaper` skill](skills/prompt-shaper/SKILL.md) have separate jobs. The plugin owns the composer action, hidden helper thread, progress state, result insertion, and undo. The skill owns the shaping instructions and reads the current thread and linked context for each rewrite.

The skill was refined from observed prompt and handoff behavior in bb threads: missing context, ambiguous scope, unnecessary verbosity, and prompts that did not give an agent a clear stopping point. The stable plugin ID remains `prompt-shaper`; Improve Prompt is its display name.

[Repository provenance](../../docs/provenance.md) records the standalone source and the rejected bb core experiment that was deliberately not imported.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-prompt-shaper
bb plugin install "path:$PWD/plugins/improve-prompt" --yes
```
