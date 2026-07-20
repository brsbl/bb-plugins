# bb plugins

[bb](https://getbb.app) is an agentic IDE for running coding agents across projects, threads, and environments. bb plugins are full-trust packages that add focused UI, commands, skills, and server capabilities.

This repository is the canonical source for my personal plugins and their shared development tooling. [![CI](https://github.com/brsbl/bb-plugins/actions/workflows/ci.yml/badge.svg)](https://github.com/brsbl/bb-plugins/actions/workflows/ci.yml)

## Plugins

<!-- plugin-catalog:start -->
| Plugin | Purpose and when to use it | Surfaces and visual | Install and source | CI and maintenance |
| --- | --- | --- | --- | --- |
| **Design Doctrine** | Turns repeated product-design feedback into reusable rules. When designing, building, or reviewing product UI against personal design judgment. | Sidebar panel; bb doctrine; Agent skill. Rule cards in a sidebar panel. [Screenshot](plugins/design-doctrine/docs/screenshot.png) | `bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/design-doctrine --yes` · [Source](plugins/design-doctrine) | [CI](https://github.com/brsbl/bb-plugins/actions/workflows/ci.yml) · Active |
| **Improve Prompt** | Rewrites a rough composer draft into a context-complete prompt. When a request is underspecified or needs a clearer handoff before sending. | Composer action; Hidden helper thread; Agent skill. Improve action with an in-composer progress shimmer. [Screenshot](plugins/improve-prompt/docs/screenshot.png) | `bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/improve-prompt --yes` · [Source](plugins/improve-prompt) | [CI](https://github.com/brsbl/bb-plugins/actions/workflows/ci.yml) · Active |
| **Omegacode** | Monitors Omegacode workflows globally while keeping live composer progress owner-scoped. When scanning workflows across threads or following the run owned by the current thread. | Sidebar plugin page; Composer banner; bb omegacode. Global workflow list plus a live phase and worker card above the owning composer. [Screenshot](plugins/omegacode/docs/screenshot.png) | `bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/omegacode --yes` · [Source](plugins/omegacode) | [CI](https://github.com/brsbl/bb-plugins/actions/workflows/ci.yml) · Active |
| **Thread Hover Cards** | Previews thread status and repository context from the sidebar. When scanning several active threads without opening each one. | Sidebar thread rows; Thread summary RPC. Hover card beside a sidebar thread row. [Screenshot](plugins/thread-hover-cards/docs/screenshot.png) | `bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/thread-hover-cards --yes` · [Source](plugins/thread-hover-cards) | [CI](https://github.com/brsbl/bb-plugins/actions/workflows/ci.yml) · Active |
| **UI Patterns** | Browses and queries approved-source UI components and interaction patterns. When choosing, comparing, or citing established UI patterns. | Thread panel; bb ui-patterns; Agent skill. Interactive component cards in a thread panel. [Screenshot](plugins/ui-patterns/docs/screenshot.png) | `bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/ui-patterns --yes` · [Source](plugins/ui-patterns) | [CI](https://github.com/brsbl/bb-plugins/actions/workflows/ci.yml) · Experimental |
<!-- plugin-catalog:end -->

The `plugin/*` refs are generated from `main` after CI passes. bb currently installs a git repository root, not a nested monorepo directory, so these refs provide valid root-shaped plugin checkouts without creating more repositories.

## Develop

```bash
npm ci
npm run check
npm run new:plugin -- --slug example --name "Example" --description "Adds an example capability."
```

For local use, install a workspace directly: `bb plugin install "path:$PWD/plugins/<slug>" --yes`.

See [contributor guidance](CONTRIBUTING.md), [repository tooling](tooling/README.md), and [import provenance](docs/provenance.md).
