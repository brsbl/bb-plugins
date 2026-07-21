# Omegacode

[Omegacode](https://github.com/SawyerHood/omegacode) is the underlying agent-workflow system. This bb plugin shows every machine-local run on one page and owner-scoped progress above the composer for runs that record bb ownership.

![Omegacode global page with a real active workflow and worker](docs/screenshot-global.png)

![An owner-scoped Omegacode banner with workflow phases and workers in a bb thread](docs/screenshot-thread.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/omegacode --yes
```

## Use

Open Omegacode from the bb sidebar to scan workflows across threads and jump to an owning thread. A compact banner appears only in the thread and environment recorded by a run. Use `bb omegacode status`; add `--all` for the machine-wide CLI view.

The plugin reads Omegacode's append-only `journal.jsonl` and `events.jsonl` files under `~/.omegacode/runs`; it does not implement the workflow runner. Run metadata must contain `bbContext.threadId` and `bbContext.environmentId` to appear in an owning composer. Journals without that context remain global-only. The published upstream Omegacode 0.0.6 package does not yet write this bb context itself, so the launcher integration remains upstream work.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-omega
bb plugin install "path:$PWD/plugins/omegacode" --yes
```
