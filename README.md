# bb plugins

[bb](https://getbb.app) is an agentic IDE for running coding agents across projects, threads, and environments. bb plugins are full-trust packages that add focused UI, commands, skills, and server capabilities.

This repository is the canonical source for my personal plugins and their shared development tooling. [![CI](https://github.com/brsbl/bb-plugins/actions/workflows/ci.yml/badge.svg)](https://github.com/brsbl/bb-plugins/actions/workflows/ci.yml)

## Plugins

| Plugin | Purpose and when to use it | Surfaces and visual | Install and source | CI and maintenance |
| --- | --- | --- | --- | --- |
| **Design Doctrine** | Reuses product-design feedback while designing, building, or reviewing UI. | Sidebar rule cards; `bb doctrine`; agent skill. | `bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/design-doctrine --yes` · [Source](plugins/design-doctrine) | [CI](https://github.com/brsbl/bb-plugins/actions/workflows/ci.yml) · Active |
| **Improve Prompt** | Clarifies an underspecified composer draft before it is sent. | Composer action; progress shimmer; hidden helper thread. | `bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/improve-prompt --yes` · [Source](plugins/improve-prompt) | [CI](https://github.com/brsbl/bb-plugins/actions/workflows/ci.yml) · Active |
| **Omegacode** | Monitors workflows across threads while keeping live composer progress owner-scoped. | Global workflow page; live phase and worker card above the owning composer; `bb omegacode`. | `bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/omegacode --yes` · [Source](plugins/omegacode) | [CI](https://github.com/brsbl/bb-plugins/actions/workflows/ci.yml) · Active |
| **Thread Hover Cards** | Scans thread status and repository context without opening every thread. | Hover card beside each sidebar thread row. | `bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/thread-hover-cards --yes` · [Source](plugins/thread-hover-cards) | [CI](https://github.com/brsbl/bb-plugins/actions/workflows/ci.yml) · Active |
| **UI Patterns** | Chooses, compares, and cites approved-source UI patterns. | Interactive thread-panel cards; `bb ui-patterns`; agent skill. | `bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/ui-patterns --yes` · [Source](plugins/ui-patterns) | [CI](https://github.com/brsbl/bb-plugins/actions/workflows/ci.yml) · Experimental |

The `plugin/*` refs are generated from `main` after CI passes. bb currently installs a git repository root, not a nested monorepo directory, so these refs provide valid root-shaped plugin checkouts without creating more repositories.

## Develop

```bash
npm ci
npm run check
npm run new:plugin -- --slug example --name "Example" --description "Adds an example capability."
```

For local use, install a workspace directly: `bb plugin install "path:$PWD/plugins/<slug>" --yes`.

See [contributor guidance](CONTRIBUTING.md) and [import provenance](docs/provenance.md).
