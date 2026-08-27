# Thread Organizer

Thread Organizer turns native bb thread sections into a configurable workflow.
It keeps unread agent output in one attention queue without losing each
thread’s actual stage.

![Thread Organizer workflow sections in bb](docs/screenshot.png)

## Behavior

- Running threads appear in their remembered workflow stage.
- Idle unread threads appear in Inbox and stay there after being marked read.
- After reading one, drag it to any workflow section to clear it from Inbox
  without starting another agent turn.
- Starting work again restores the thread’s remembered stage.
- A user move changes the remembered stage. `bb organizer phase <stage-key>`
  moves it explicitly.
- Inbox keeps that system behavior even when its visible title or icon changes.
- The icon picker maps each semantic icon choice to an emoji section prefix on
  the released plugin SDK.
- Inbox starts expanded. Other configured sections start collapsed, while later
  user expansion and collapse choices are respected.
- Reordering a non-Inbox stage in the native sidebar saves the same workflow
  order used by plugin settings and future agent instructions.
- Automation-origin root threads follow the same workflow as ordinary roots.
- Thread Organizer never renames threads. Moving between workflow stages leaves
  the user’s thread title unchanged.

The plugin does not classify prompts to choose stages. Agents and users move
threads from the rules saved in plugin settings. The bundled skill contains
only the movement protocol and reads the current taxonomy from the dynamic
settings block. Agents apply clear stage changes autonomously, but a rule that
requires explicit user intent—such as the default Handoff rule—cannot be
inferred.

## Use

### Configure

Open Thread Organizer in bb’s plugin settings. The workflow editor lets you:

- rename and re-icon Inbox while leaving its routing protected;
- search and choose from bb’s full semantic icon catalog in a visual picker
  placed beside each editable title;
- add, remove, reorder, rename, and re-icon other stages;
- describe what belongs in each stage;

The defaults are Planning, Spec Review, Building, Testing / Deploy, Handoff,
and On Hold. When an agent has enough context to determine that its current
work clearly matches a rule, the bundled skill tells it to move the thread. If
the context is insufficient, the thread stays where it is.

### Move a thread

Run the configured stage key from inside a bb thread:

```bash
bb organizer phase building
bb organizer phase testing-deploy
bb organizer phase on-hold
```

Inbox is system-managed and cannot be selected by the CLI. The bundled
`thread-phase-organizer` skill contains only the invariant movement protocol.
The plugin adds the current saved stage table—the source of truth for section
names and rules—to the agent’s dynamic instructions whenever a session starts
or resumes.

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/thread-organizer --yes
```

## Develop

```bash
npm ci
npm run check --workspace=bb-plugin-thread-organizer
bb plugin install "path:$PWD/plugins/thread-organizer" --yes
```
