# Design Doctrine

Design Doctrine turns repeated product-design feedback into rules that agents can browse and apply during design, implementation, and critique.

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/design-doctrine --yes
```

## Use

Open the sidebar panel, ask an agent to apply your doctrine, or use `bb doctrine search <query>` and `bb doctrine show <rule-id>`.

Rules remain ordinary Markdown under `rules/`; Git provides their history and rollback.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-design-doctrine
bb plugin install "path:$PWD/plugins/design-doctrine" --yes
```
