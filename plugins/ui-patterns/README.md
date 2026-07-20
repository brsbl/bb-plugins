# UI Patterns

UI Patterns is a visual and agent-queryable browser for approved-source components and interaction guidance.

![Interactive UI pattern examples in a bb thread panel](docs/screenshot.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/ui-patterns --yes
```

## Use

Open the thread panel or use `bb ui-patterns search <query>`, `bb ui-patterns show <source-id>`, and the `ui-pattern-atlas` agent skill.

The focused visual gallery stays small while the full four-source Atlas remains available to search and agents. Provider data is pinned and generated at build time; the plugin never fetches it at runtime.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-ui-patterns
bb plugin install "path:$PWD/plugins/ui-patterns" --yes
```

Refresh pinned provider data explicitly with `npm run update:providers --workspace=bb-plugin-ui-patterns`.
