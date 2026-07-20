# Improve Prompt

Improve Prompt rewrites a rough bb composer draft into a concise, context-complete request without sending it.

![An improved prompt ready for review in the bb composer](docs/screenshot.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/improve-prompt --yes
```

## Use

Write a draft, choose **Improve prompt**, review the replacement, and send when ready. Attachments remain attached, and the text change can be undone.

The behavior comes from the installed `prompt-shaper` skill; the stable plugin ID remains `prompt-shaper` for compatibility.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-prompt-shaper
bb plugin install "path:$PWD/plugins/improve-prompt" --yes
```
