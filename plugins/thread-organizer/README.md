# Thread Organizer

Thread Organizer files new bb threads into existing work sections while leaving manual organization in control. It starts in observe mode and never creates sections, backfills old threads, or runs a hidden classification agent.

![Thread Organizer settings in bb](docs/screenshot.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/thread-organizer --yes
```

## Use

Leave the plugin in its default `observe` mode first and inspect its decisions:

```bash
bb plugin logs thread-organizer -f
```

When the proposals look right, enable changes:

```bash
bb plugin config thread-organizer set mode apply
```

The setting takes effect immediately.

| Existing section | Automatic use |
| --- | --- |
| `bb` or `bb quick fixes` | bb engineering work |
| `Extensions` | Plugins, skills, automations, and agent tooling |
| `Design` | Design systems, UI patterns, information architecture, and API-surface work |
| `Writing` | Articles, positioning, copy, and editorial work |
| `QA` | Never; reserved for manual phase management |

Threads that do not clear the confidence threshold stay unsectioned. Pinning remains independent priority state, and archiving remains completion state.

## Behavior

| Moment | Evaluation |
| --- | --- |
| Creation | Uses project identity and the prompt-derived title fallback for an early section proposal |
| Activation | Retries prompt history briefly when the initial prompt was not yet available |
| First completed turn | Refines the section and repairs a still-missing title |
| Later turns | Re-evaluates at turns 5, 15, 25, and every ten completed turns thereafter |

New placements require at least `0.85` confidence with a `0.20` lead over the next rule. Moving a plugin-managed thread requires `0.92` confidence, a `0.25` lead, and the same result at two consecutive scheduled evaluations.

Only visible, ordinary user root threads created while the plugin is loaded are tracked. Hidden workers, children, forks, side chats, plugin-originated threads, archived threads, deleted threads, and terminal error states are excluded.

An explicit creation-time title or section is locked. After the plugin writes a field, any different value is treated as a manual or external override and locks that field permanently. Native bb titles therefore win, and section changes are never cleared automatically.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-thread-organizer
bb plugin install "path:$PWD/plugins/thread-organizer" --yes
```
