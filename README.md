# bb plugins

Five personal plugins for product design engineering, plus the shared tooling that keeps them consistent. Each plugin is documented, forkable, and meant to be personalized. [![CI](https://github.com/brsbl/bb-plugins/actions/workflows/ci.yml/badge.svg)](https://github.com/brsbl/bb-plugins/actions/workflows/ci.yml)

[bb](https://getbb.app) is an agentic IDE for running coding agents across projects, threads, and environments. Plugins are full-trust packages that add focused UI, commands, skills, and server capabilities to it. This repository is their canonical source.

## Plugins

Each card below is generated from `catalog/plugins.json`, the canonical inventory — edit the catalog, not the list. Follow a card's **README** for what the plugin does, how it is maintained, and how to fork and personalize it.

<!-- plugin-catalog:start -->
### Design Doctrine

Turns repeated product-design feedback into reusable rules.

![Design Doctrine in bb](plugins/design-doctrine/docs/screenshot.png)

[Source](plugins/design-doctrine) · [README](plugins/design-doctrine/README.md)

Install: `bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/design-doctrine --yes`

### Improve Prompt

Rewrites a rough composer draft into a context-complete prompt.

![Improve Prompt in bb](plugins/improve-prompt/docs/screenshot-result.png)

[Source](plugins/improve-prompt) · [README](plugins/improve-prompt/README.md)

Install: `bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/improve-prompt --yes`

### Omegacode

Monitors Omegacode workflows globally while keeping live composer progress owner-scoped.

![Omegacode in bb](plugins/omegacode/docs/screenshot-global.png)

[Source](plugins/omegacode) · [README](plugins/omegacode/README.md)

Install: `bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/omegacode --yes`

### Thread Hover Cards

Previews thread status and repository context from the sidebar.

![Thread Hover Cards in bb](plugins/thread-hover-cards/docs/screenshot.png)

[Source](plugins/thread-hover-cards) · [README](plugins/thread-hover-cards/README.md)

Install: `bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/thread-hover-cards --yes`

### UI Patterns

Browses and queries approved-source UI components and interaction patterns.

![UI Patterns in bb](plugins/ui-patterns/docs/screenshot.png)

[Source](plugins/ui-patterns) · [README](plugins/ui-patterns/README.md)

Install: `bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/ui-patterns --yes`
<!-- plugin-catalog:end -->

The `plugin/*` install refs are generated from `main` after CI passes. bb installs a git repository root, not a nested monorepo directory, so these refs provide valid root-shaped plugin checkouts without spawning more repositories.

## Develop

Every plugin follows one build, validation, scaffolding, and publishing contract while owning its own runtime code. The shared tooling under `tooling/` enforces it.

```bash
npm ci
npm run check
npm run new:plugin -- --slug example --name "Example" --description "Adds an example capability."
```

`npm run check` runs repository hygiene, then each plugin's typecheck, build, and tests; `npm run new:plugin` scaffolds and catalogs a new plugin. To iterate on one plugin, install its workspace directly: `bb plugin install "path:$PWD/plugins/<slug>" --yes`.

See [contributor guidance](CONTRIBUTING.md), [repository tooling](tooling/README.md), and [import provenance](docs/provenance.md).
