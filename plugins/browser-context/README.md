# Browser Context

Select elements or drag over regions in BB's Browser, annotate the numbered captures, then add the batch to the current thread composer. A separate agent-control action lets the user or agent visibly enable control of one exact Browser tab.

![Inspectable Browser Context mention in bb](docs/screenshot.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/browser-context --yes
```

## Use

Open a Browser tab and click the Browser Context action to enter selection mode. Click an element or drag over a region, add an optional comment, and click the same Browser toolbar action again to build a numbered batch. Hover or focus a staged row to return its target to the live preview, edit any comment in place, or remove one selection without affecting the rest. Choose **Send to agent** once to preserve the existing draft and append one inspectable mention pill followed by its ordinary editable comment for every selection. Activate a pill to reopen its capture preview and exact metadata. Screenshots remain preview-only and are never sent; immutable DOM, React, accessibility, and geometry metadata resolves into hidden agent context at send time. The standard Send or Queue flow remains in control.

Click the AI Browser action to let the current thread's agent control that exact client, window, tab, and navigation epoch. The visible Browser frame marks the active mode; clicking the action again exits it. Navigation changes the target epoch, so stale control requests cannot silently move to a different page.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-browser-context
bb plugin install "path:$PWD/plugins/browser-context" --yes
```
