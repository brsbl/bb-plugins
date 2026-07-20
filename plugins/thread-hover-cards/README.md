# BB Thread Hover Cards

Thread Hover Cards is a plugin for [bb](https://getbb.app), the agentic IDE for running and managing coding agents across projects, threads, and environments. It turns the sidebar into a fast status overview: hover or keyboard-focus a thread to see what the agent last said and the context it is working in.

bb plugins are full-trust TypeScript packages that can add app UI, server capabilities, commands, and background services to a running bb instance. This plugin uses bb's existing Plugin SDK and thread-row semantics; it does not require new bb APIs.

## What it shows

- Provider, model, reasoning level, and access mode.
- Current thread status and turn runtime.
- The latest completed agent message, with Markdown-aware truncation.
- Project, branch, and linked pull-request state, or a compact local workspace path.

## Install

Enable **Plugins** under **Settings → Experiments**, then install the public, git-backed plugin:

```bash
bb plugin install git:https://github.com/brsbl/bb-plugin-thread-hover-cards.git@main
```

For local development, install the checkout instead:

```bash
bb plugin install .
```

## Development

```bash
npm ci
npm run check
bb plugin reload thread-hover-cards
```

## Compatibility

BB Plugin SDK 0.4 has no thread-row hover slot. The frontend therefore anchors to BB's stable `data-sidebar-thread-id` attribute; typed RPC supplies all thread, repository, and PR data. A future native slot should replace only this small DOM bridge.
