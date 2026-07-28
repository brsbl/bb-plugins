# Thread Organizer

Thread Organizer turns BB’s pinned area into an inbox and files active work into semantic sections. Idle and failed threads rise to the inbox; resumed work returns to its preserved section.

![Thread Organizer settings in bb](docs/screenshot.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/thread-organizer --yes
```

## Use

The plugin starts in `apply` mode and organizes threads automatically. Follow its decisions and lifecycle changes with:

```bash
bb plugin logs thread-organizer -f
```

To preview proposals without changing threads, switch to `observe` mode:

```bash
bb plugin config thread-organizer set inboxMode observe
```

The setting takes effect immediately.

| Existing section | Automatic use |
| --- | --- |
| `bb` or `bb quick fixes` | bb engineering work |
| `bb Extensions` or `Extensions` | Plugins, skills, automations, and agent tooling |
| `Design` | Design systems, UI patterns, information architecture, and API-surface work |
| `moss` | Moss product and engineering work that is not more specifically design, writing, QA, or extension work |
| `QA` | Explicit code review, regression, test, coverage, and release-audit work |
| `Writing` | Articles, positioning, copy, and editorial work |

Threads that do not clear the confidence threshold stay unsectioned. The plugin never creates sections.

## Behavior

| Moment | Inbox and organization behavior |
| --- | --- |
| Startup and every five seconds | Adopts visible root threads and reconciles their current state |
| Creation | Uses project identity and the prompt-derived title fallback for an early section proposal |
| Activation | Applies any missing semantic section before removing an organizer-owned inbox pin |
| Idle or failed | Pins the thread into the top inbox area without clearing its semantic section |
| Manual pin | Preserves the pin until the user removes it |
| Manual unpin | Keeps the idle thread out of the inbox until its next run completes and collapses its destination section |
| First completed turn | Refines the section and repairs a still-missing title |
| Later turns | Re-evaluates at turns 5, 15, 25, and every ten completed turns thereafter |

New placements require at least `0.85` confidence with a `0.20` lead over the next rule. Moving a plugin-managed thread requires `0.92` confidence, a `0.25` lead, and the same result at two consecutive scheduled evaluations.

Only visible, ordinary user root threads are tracked. Hidden workers, children, forks, side chats, plugin-originated threads, archived threads, and deleted threads are excluded.

An explicit creation-time title or section is locked. After the plugin writes a field, any different value is treated as a manual or external override and locks that field permanently. Native BB titles therefore win, and section changes are never cleared automatically.

Pin ownership is tracked separately from pin visibility. Thread Organizer only removes pins it created; a manual pin or re-pin is preserved. Recurring reconciliation also detects manual unpins that do not emit a thread lifecycle event.

Section decisions are persisted with the classifier version, completed-turn count, confidence, margin, reasons, and evaluation time. Pinning and unpinning reuse that record instead of rerunning categorization; new conversational evidence and classifier upgrades are the only automatic reevaluation triggers. New decisions are written to the plugin log.

Every non-pinned sidebar section starts collapsed. If BB expands a destination while moving an unpinned thread, the plugin collapses it again; a section the user deliberately expands remains open.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-thread-organizer
bb plugin install "path:$PWD/plugins/thread-organizer" --yes
```
