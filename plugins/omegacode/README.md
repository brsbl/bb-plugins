# Omegacode

[Omegacode](https://github.com/SawyerHood/omegacode) workflows can outlive the thread where they started. This plugin gives bb one place to see every local run, plus a compact view of the current thread's run above its composer.

![Omegacode global page with a live workflow and worker](docs/screenshot-global.png)

![An owner-scoped Omegacode banner with workflow phases and workers in a bb thread](docs/screenshot-thread.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/omegacode --yes
```

## Use

Open Omegacode from the bb sidebar to scan workflows across threads and jump to an owning thread. A compact banner appears in bb's composer card stack only for the thread that launched an active run. BB owns the card chrome and stack layout, while the plugin supplies the live workflow content and expandable worker details. Use `bb omegacode status`; add `--all` for the machine-wide CLI view.

## How it was built

The plugin reads Omegacode's append-only `journal.jsonl` and `events.jsonl` files under `~/.omegacode/runs` and turns them into bb UI.

The global page can summarize every local journal. A run appears above a composer only when its journal carries matching `bbContext.threadId` and `bbContext.environmentId` metadata; unowned runs stay global. The matching and presentation rules live in `ownership.ts` and `presentation.ts`, with focused tests around both.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-omega
bb plugin install "path:$PWD/plugins/omegacode" --yes
```
