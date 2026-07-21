# Improve Prompt

Improve Prompt rewrites a rough bb composer draft into a concise, context-complete request without sending it.

![Improve Prompt working on a draft in the bb composer](docs/screenshot-running.png)

![An improved prompt returned for review in the bb composer](docs/screenshot-result.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/improve-prompt --yes
```

## Use

Write a draft, choose **Improve prompt**, review the replacement, and send when ready. Attachments remain attached, and the text change can be undone.

The plugin owns the composer action, hidden helper-thread lifecycle, progress state, result insertion, and undo. Its bundled [`prompt-shaper` skill](skills/prompt-shaper/SKILL.md) separately owns the shaping instructions and uses the current bb thread and linked context for each run.

Skill maintenance is a separate, manual Git change informed by observed bb thread and handoff behavior; the plugin does not mine history to rewrite the skill. The stable plugin ID remains `prompt-shaper` for compatibility.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-prompt-shaper
bb plugin install "path:$PWD/plugins/improve-prompt" --yes
```
