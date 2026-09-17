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
- Inbox keeps that system behavior even when its visible title changes.
- A stage title is used verbatim as its bb section name, so any emoji you want
  in the sidebar goes in the title itself.
- Section expansion and collapse are owned by bb and the user; Thread Organizer
  never changes them automatically.
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

- rename Inbox while leaving its routing protected;
- add, remove, reorder, and rename other sections;
- describe what belongs in each section;
- give a section an entry prompt that is sent to a thread when it lands there.

The defaults are Planning, Spec Review, Building, Testing / Deploy, Handoff,
and On Hold. When an agent has enough context to determine that its current
work clearly matches a rule, the bundled skill tells it to move the thread. If
the context is insufficient, the thread stays where it is.

### Entry prompts

Every section has an **Entry prompt** field beside its rule. Whenever a thread
lands in that section — you dragged it there, `bb thread update --section`
moved it, or its agent ran `bb organizer phase <key>` — the plugin sends the
prompt to that thread as a follow-up message. It appears in the thread as a
user message with a `Thread Organizer — entering “<section>”:` prefix. An idle
thread starts a turn immediately; a running thread receives it once the current
turn ends. A prompt the host queued is retracted if the thread moves on before
it dispatches. A section without a prompt shows an **Add entry prompt** button instead of an
empty field; an empty field can be dismissed, and an empty field means no
prompt.

Prompts fire once per landing. The plugin’s own Inbox routing never counts, a
thread re-entering the same section fires again only after leaving it, the first
automatic placement of a new thread never fires, and neither do placements the
plugin merely records — a config save or moves made while the plugin was off.
No thread receives the same section’s prompt twice within ten minutes or more
than three entry prompts in half an hour; a refused prompt is logged as a
warning. If the thread cannot take a message yet, the prompt is retried on the
thread’s next change, at most every thirty seconds, for up to a day.

Prompts may use `{{thread.title}}`, `{{thread.id}}`, `{{section.title}}`, and
`{{section.key}}`; `{{stage.title}}` and `{{stage.key}}` are accepted aliases.

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

### Configure from the CLI

The same settings can be changed from a shell, for scripts and agents that set
up a workflow, without opening Settings:

```bash
bb organizer section list
bb organizer section add "Review" --after testing-deploy --rule "A PR is complete and needs its one review."
bb organizer prompt                      # every section and its prompt
bb organizer prompt review               # one section's prompt
bb organizer prompt review --set "Run /slop-cop on this PR, then /slim-pr, /write-pr, and /merge-ready."
bb organizer prompt review --clear
```

Every change asks for your approval in the thread the command runs in, showing
the exact text that will become an entry prompt or an agent rule, so run these
from inside a bb thread. `--set` takes the prompt as one quoted argument. A new
section is keyed by its title, gets the default rule unless `--rule` is given,
and is appended unless `--after` names the section it should follow.
Validation matches the settings page: Inbox cannot carry a prompt, titles must
be unique, and prompts are limited to 2000 characters. A save based on a
workflow that changed since it was loaded is refused, and the settings page
holds Save until you reload.

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
