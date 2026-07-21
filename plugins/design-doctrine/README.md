# Design Doctrine

Design Doctrine turns repeated product-design feedback into rules that agents can browse and apply while they design, build, and critique.

![Design Doctrine rule library in bb's sidebar](docs/screenshot.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/design-doctrine --yes
```

## Use

Open **Design Doctrine** from the bb sidebar, ask an agent to apply the doctrine, or query the library directly:

```bash
bb doctrine search "<task and surface>"
bb doctrine show ddr_001
```

The bundled `design-doctrine` skill brings the relevant rules into design work. It complements product requirements, accessibility guidance, and platform conventions rather than replacing them.

## How it was built

The rule library was distilled from repeated design feedback in bb thread history: direct requests, corrections, approvals, and rejections. Agent output is not treated as evidence, and repeated signals carry more weight than one-off preferences.

Each rule is an ordinary Markdown file under `rules/<domain>/`, so its rationale and revisions stay inspectable in Git. [`governance.md`](governance.md) defines how evidence becomes a rule.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-design-doctrine
bb plugin install "path:$PWD/plugins/design-doctrine" --yes
```
