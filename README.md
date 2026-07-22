# Design Doctrine

Design Doctrine keeps the lessons that recur in design reviews from getting lost in old threads. It gives agents a set of rules they can search and apply while they design, build, or critique.

![Design Doctrine rule library in bb's sidebar](docs/screenshot.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/design-doctrine --yes
```

## Use

Open **Design Doctrine** from the bb sidebar when you want to browse the rules. Agents can apply the doctrine on their own, or query it directly:

```bash
bb doctrine search "<task and surface>"
bb doctrine show ddr_001
```

The bundled `design-doctrine` skill brings the right rules into the work at hand. The doctrine adds personal design judgment; it does not replace product requirements, accessibility guidance, or platform conventions.

## How it was built

The library grew out of feedback I kept giving in bb threads: direct requests, corrections, approvals, and rejections. The plugin queues visible user threads when they become idle, then its weekly maintenance pass reads only the unseen part of each episode through bb's timeline API. Agent output is not evidence by itself, and a pattern repeated across threads matters more than a one-off preference.

Rules are plain Markdown files under `rules/<domain>/`, so their reasoning and revisions remain easy to inspect in Git. [`governance.md`](governance.md) explains what qualifies as evidence and when it should become a rule.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-design-doctrine
bb plugin install "path:$PWD/plugins/design-doctrine" --yes
```
