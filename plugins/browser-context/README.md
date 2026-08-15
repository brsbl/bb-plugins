# Browser Context

Select elements or drag over regions in BB's Browser, annotate the numbered captures, then add the batch to the current thread composer.

![Inspectable Browser Context mention in bb](docs/screenshot.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/browser-context --yes
```

## Use

Open a Browser tab and click the Browser Context action to enter selection mode. Click an element or drag over a region, add an optional comment, and use **Select another** to build a numbered batch. Hover or focus a staged row to return its target to the live preview, edit any comment in place, or remove one selection without affecting the rest. Choose **Add to prompt** once to preserve the existing draft and append one inspectable mention pill followed by its ordinary editable comment for every selection. Activate a pill to reopen its capture preview and exact metadata. Screenshots remain preview-only and are never sent; immutable DOM, React, accessibility, and geometry metadata resolves into hidden agent context at send time. The standard Send or Queue flow remains in control.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-browser-context
bb plugin install "path:$PWD/plugins/browser-context" --yes
```
