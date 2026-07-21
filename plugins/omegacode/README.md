# Omegacode

[Omegacode](https://github.com/SawyerHood/omegacode) workflows can outlive the thread where they started. This plugin gives bb one place to see every local run, plus a compact view of the current thread's run above its composer.

![Omegacode global page with a live workflow and worker](docs/screenshot-global.png)

![An owner-scoped Omegacode banner with workflow phases and workers in a bb thread](docs/screenshot-thread.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/omegacode --yes
```

## Use

Open Omegacode from the bb sidebar to scan workflows across threads or jump back to the thread that owns one. In the CLI, `bb omegacode status` shows the current thread's run; add `--all` to see everything on the machine.

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
