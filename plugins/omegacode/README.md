# Omegacode

[Omegacode](https://github.com/SawyerHood/omegacode) is the underlying agent-workflow runner. This bb plugin surfaces its runs: every machine-local run on one page, plus an owner-scoped progress banner above the composer for runs that record which bb thread launched them. Use it to scan workflows across threads, or to follow the run your current thread owns.

![Omegacode global page with a live workflow and worker](docs/screenshot-global.png)

![An owner-scoped Omegacode banner with workflow phases and workers in a bb thread](docs/screenshot-thread.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/omegacode --yes
```

## Use

Open Omegacode from the bb sidebar to scan workflows across threads and jump to an owning thread. The compact banner appears only in the thread and environment a run recorded. From the CLI, `bb omegacode status` shows the owning run; add `--all` for the machine-wide view.

**How it reads data.** The plugin reads Omegacode's append-only `journal.jsonl` and `events.jsonl` files under `~/.omegacode/runs`; it does not implement the runner. The owner-scoped banner needs `bbContext.threadId` and `bbContext.environmentId` in a run's metadata. The installed Omegacode 0.0.6 runner stamps that context when it is launched with `BB_THREAD_ID` and `BB_ENVIRONMENT_ID` set — which bb does — so a run started from a bb thread is owner-scoped, while a run started without those variables stays global-only.

**Maintenance model.** Maintained by hand against that on-disk format and the owner-scoping contract, with focused unit tests in `ownership.ts` and `presentation.ts` to update alongside any change to how runs are matched to threads or rendered.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-omega
bb plugin install "path:$PWD/plugins/omegacode" --yes
```

**Adapt it.** Fork the repo and point the reader at your own `~/.omegacode/runs`, or edit `ownership.ts` and `presentation.ts` to change how runs are matched to threads and rendered above the composer. Both have focused unit tests (`ownership.test.ts`, `presentation.test.ts`) to adapt alongside.

See [import provenance](../../docs/provenance.md).
