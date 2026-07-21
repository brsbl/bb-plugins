# UI Patterns

UI Patterns is a visual and agent-queryable browser for approved-source components and interaction guidance.

![Interactive UI pattern examples in a bb thread panel](docs/screenshot.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/ui-patterns --yes
```

## Use

Open the thread panel or use `bb ui-patterns search <query>`, `bb ui-patterns show <source-id>`, and the `ui-pattern-atlas` agent skill.

The focused visual gallery stays small while the full four-source Atlas remains available to search and agents. It is assembled only from pinned, approved revisions of shadcn/ui, Base UI, assistant-ui, and the WAI-ARIA Authoring Practices Guide. [`providers/upstreams.json`](providers/upstreams.json) preserves each repository, revision, allowed source paths, license link, and attribution notice; generated provider output carries that attribution into the plugin.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-ui-patterns
bb plugin install "path:$PWD/plugins/ui-patterns" --yes
```

To update the data, change an approved pin and run `npm run update:providers --workspace=bb-plugin-ui-patterns`. That command refreshes normalized source records and lock hashes; the regular build then regenerates the provider snapshot, index, and preview CSS. `check:providers` detects snapshot drift, and the plugin never fetches provider data at runtime.
