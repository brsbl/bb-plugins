# UI Patterns

UI Patterns is a visual and agent-queryable browser for approved-source UI components and interaction guidance.

![Interactive UI pattern examples in a bb thread panel](docs/screenshot.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/ui-patterns --yes
```

## Use

Open the thread panel to browse the visual gallery, or query the full Atlas from an agent:

```bash
bb ui-patterns search "<term>" --json
bb ui-patterns show <source-id>
```

The gallery stays focused, while the full four-source Atlas remains available to search and agents through the bundled `ui-pattern-atlas` skill.

## How it was built

The Atlas is assembled from pinned revisions of four approved upstream sources: shadcn/ui, Base UI, assistant-ui, and the WAI-ARIA Authoring Practices Guide. [`providers/upstreams.json`](providers/upstreams.json) records each repository, revision, allowed source paths, license, and attribution notice.

Source adapters normalize the approved material into generated records, a search index, and preview CSS. Attribution stays attached to the generated output, and the plugin does not fetch provider data at runtime. `npm run update:providers` refreshes those artifacts after a pin changes; `check:providers` detects drift.

See [repository provenance](../../docs/provenance.md) for source and licensing details.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-ui-patterns
bb plugin install "path:$PWD/plugins/ui-patterns" --yes
```
