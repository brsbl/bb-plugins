# Thread Organizer

Thread Organizer turns native bb thread sections into a configurable workflow.
It keeps unread agent output in Inbox and lets plugins have their own inboxes.

![Thread Organizer workflow sections in bb](docs/screenshot.png)

![Thread Organizer workflow settings](https://github.com/user-attachments/assets/4dba26ce-4033-4f4a-929d-98c630e72e57)

## Behavior

- New threads stay in the native Threads section until a user or agent explicitly
  moves them into a workflow stage. Reordering sections never assigns new work.
- Unclaimed running threads appear in their remembered workflow stage, or Threads when
  they have not been assigned one.
- Unclaimed idle unread threads appear in the main Inbox and stay after being marked
  read, unless the Inbox is set to move them back (below).
- Additional inboxes receive threads from a selected plugin. Claimed threads stay
  in that inbox until you move or archive them, even after reading or resuming work.
  Opening a thread marks it read normally; it never also appears in the main Inbox.
- Each additional inbox is **Filled by** a plugin or by **You**. A plugin inbox
  catches the threads that plugin creates; the list offers only plugins that
  have created threads. An inbox filled by You catches nothing automatically: it
  holds the threads you move there, even after reading or new agent output,
  until you move or archive them.
- After reading one, drag it to any workflow section to clear it from Inbox
  without starting another agent turn.
- Set any inbox to **Move back after reading** to skip that drag: as soon as you
  read an idle thread there, it returns to its remembered stage (or Threads when it has
  none) without sending an entry prompt. Turning the setting on also releases
  threads you had already read there. A thread moved out of a plugin inbox
  this way is not claimed by it again.
- Starting unclaimed work again restores the thread’s remembered stage.
- A user move changes the remembered stage. `bb organizer phase <stage-key>`
  moves it explicitly.
- Inbox keeps that system behavior even when its visible title changes.
- A stage title is used verbatim as its bb section name, so any emoji you want
  in the sidebar goes in the title itself. A section whose name differs from its
  title only by Unicode styling keeps the name you gave it.
- A section you or an agent creates in bb's own sidebar becomes a workflow
  stage as soon as bb reports it, so threads can be moved there immediately.
  Threads in a section the plugin does not yet own are never reconciled away.
- Every section created without a rule — from the panel, from `bb organizer
  section add`, or by adoption — starts as user-managed: agents are told to
  leave it alone until the rule describes real work. Set one afterwards with
  `bb organizer section rule <stage-key> --set <text>`.
- Section expansion and collapse are owned by bb and the user; Thread Organizer
  never changes them automatically.
- The sidebar and the workflow share one section order. Dragging any section in
  the sidebar, the main Inbox included, saves that order as the workflow order.
  Reordering in settings moves the sidebar's sections to match after Save;
  sections outside the workflow keep their places.
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
- give a workflow section an entry prompt that is sent when a thread lands there;
- choose **Inbox · <Plugin name>** in the Type column to receive that plugin’s threads.

The defaults are Planning, Spec Review, Building, Testing / Deploy, Handoff,
and On Hold. When an agent has enough context to determine that its current
work clearly matches a rule, the bundled skill tells it to move the thread. If
the context is insufficient, the thread stays where it is.

### Entry prompts

Workflow sections can have an **Entry prompt** beside their rule. Inboxes never send entry prompts. Clear an existing prompt before changing a workflow section into an inbox. Whenever a thread
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

Inboxes are managed automatically and cannot be selected by `bb organizer phase`. The bundled
`thread-phase-organizer` skill contains only the invariant movement protocol.
The plugin adds the current saved stage table—the source of truth for section
names and rules—to the agent’s dynamic instructions whenever a session starts
or resumes.

### Configure from the CLI

The same settings can be changed from a shell by an agent working inside a bb
thread, without opening Settings:

```bash
bb organizer section list
bb organizer section add "Review" --after testing-deploy --rule "A PR is complete and needs its one review."
bb organizer section add "Digests" --inbox --catches-plugin digests --rule "Published digest issues."
bb organizer section type digests
bb organizer section type digests --set stage
bb organizer section type digests --set inbox --catches-plugin digests
bb organizer section type handoff --set inbox
bb organizer section after-read inbox
bb organizer section after-read digests --set return
bb organizer prompt                      # every section and its prompt
bb organizer prompt review               # one section's prompt
bb organizer prompt review --set "Run /slop-cop on this PR, then /slim-pr, /write-pr, and /merge-ready."
bb organizer prompt review --clear
```

Every change asks for your approval in the thread the command runs in, showing
the text exactly as it will be stored, so run these from inside a bb thread.
The approval confirms that you meant the change; it is not an authorization
boundary for other local processes. `--set` takes the prompt as one quoted
argument. A new section is keyed by its title, gets the default rule unless
`--rule` is given, and is appended unless `--after` names the section it
should follow. Validation matches the settings page: Inbox cannot carry a
prompt, titles must be unique, rules are limited to 240 characters, and
prompts to 2000. Every save names the revision it was based on; a save based
on a workflow that changed since then is refused, the settings page holds Save
until you discard your edits and reload, and the sidebar refreshes its copy.
Each additional inbox needs a unique plugin id. Existing settings keep their
behavior without migration; configuration version 2 and thread-state version 5
remain supported. **Downgrading after adding another inbox requires converting
extra inboxes back to workflow sections first.** Older Organizer releases reject
configurations containing more than one inbox.

### Plugin integration

An inbox matches a root thread’s `originPluginId` or an explicit `{ inbox: true }`
marker in the matching plugin’s thread metadata. A plugin can mark an automation
run with `bb.sdk.threads.updatePluginMetadata({ threadId, set: { inbox: true } })`;
Organizer reads that namespace with `getPluginMetadata({ threadId, pluginId })`.
No title guessing or access to another plugin’s private storage is involved.
Unassigned matching threads are claimed automatically; a thread already filed in
a workflow section stays under the normal workflow rules. Moving a claimed thread
out dismisses that plugin’s claim. The main Inbox remains the protected catch-all.

## Install

Track releases (recommended; `bb plugin update` follows later 0.1.x tags):

```bash
bb plugin install "git:https://github.com/brsbl/bb-plugins.git@semver:thread-organizer/:^0.1.2" --subdirectory plugins/thread-organizer --yes
```

Or follow the prebuilt install branch, which CI republishes on every merge:

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/thread-organizer --yes
```

## Develop

```bash
npm ci
npm run check --workspace=bb-plugin-thread-organizer
bb plugin install "path:$PWD/plugins/thread-organizer" --yes
```
