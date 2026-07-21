# Thread Hover Cards

Thread Hover Cards shows a preview beside any sidebar thread — its status, latest agent message, execution context, repository, and pull request — so you can scan several active threads without opening each one.

![A bb thread hover card showing live worker context](docs/screenshot.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/thread-hover-cards --yes
```

## Use

Hover or keyboard-focus a thread row in the bb sidebar; the card appears beside the row without switching threads. A server RPC summarizes each thread on demand.

**Implementation note.** The current Plugin SDK has no thread-row hover slot, so a small frontend bridge anchors the card to bb's `data-sidebar-thread-id` attribute. That DOM dependency is the piece most likely to need attention if bb's sidebar markup changes.

**Maintenance model.** Maintained by hand; it is not derived from bb thread history and has no automated maintenance pass. Imported from `brsbl/bb-plugin-thread-hover-cards` at its final green `main`.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-thread-hover-cards
bb plugin install "path:$PWD/plugins/thread-hover-cards" --yes
```

**Adapt it.** Fork the repo and edit the summary RPC in `server.ts` to change what each card reports, or `app.tsx` and `styles.ts` for its layout and look; watch the `data-sidebar-thread-id` anchor if you retarget it to a different row.

See [import provenance](../../docs/provenance.md).
