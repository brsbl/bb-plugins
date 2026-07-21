# Design Doctrine

Design Doctrine turns direct product-design feedback from bb thread history into versioned rules that agents can browse and apply during design, implementation, and critique.

![Design Doctrine rule library in bb](docs/screenshot.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/design-doctrine --yes
```

## Use

Open the sidebar panel, ask an agent to apply your doctrine, or use `bb doctrine search <query>` and `bb doctrine show <rule-id>`.

Rules remain ordinary Markdown under `rules/`; Git provides their history and rollback. Independent repetitions can raise a rule's confidence, while evidence stays anonymous.

The [bounded maintenance workflow](maintenance/automation-prompt.md) scans only new user messages—by default at most 200 messages or 256 KiB—and changes no more than five rule files per pass. It refuses a dirty rules tree, validates tests, types, and the production build, stages only rules, and advances its cursor only after a commit or a verified no-change pass. [Governance](governance.md) defines the allowed evidence and rule changes.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-design-doctrine
bb plugin install "path:$PWD/plugins/design-doctrine" --yes
```
