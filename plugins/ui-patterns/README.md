# UI Patterns

UI Patterns keeps proven interface examples close while you work. Designers can browse them visually, and agents can search the same approved-source material directly.

![Interactive UI pattern examples in a bb thread panel](docs/screenshot.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/ui-patterns --yes
```

## Use

Open the thread panel when you want to browse examples. For a specific question, query the full Atlas from an agent:

```bash
bb ui-patterns search "<term>" --json
bb ui-patterns show <source-id>
```

The gallery is intentionally selective, but the full four-source Atlas remains available to search and agents through the bundled `ui-pattern-atlas` skill.

## How it was built

The Atlas brings together pinned revisions of four approved upstream sources: shadcn/ui, Base UI, assistant-ui, and the WAI-ARIA Authoring Practices Guide. [`providers/upstreams.json`](providers/upstreams.json) records exactly where each source came from, which paths are allowed, and the license and attribution it requires.

Source adapters turn that material into generated records, a search index, and preview CSS while keeping attribution attached. Nothing is fetched at runtime. After an upstream pin changes, `npm run update:providers` rebuilds the artifacts and `check:providers` catches drift.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-ui-patterns
bb plugin install "path:$PWD/plugins/ui-patterns" --yes
```
