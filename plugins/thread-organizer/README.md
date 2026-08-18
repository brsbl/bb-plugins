# Thread Organizer

Thread Organizer files bb work into the phase it is in now. The sidebar contains only phase sections that currently have threads:

- 📋 Planning
- 🔎 Spec Review
- 🛠️ Building
- 🤝 Handoff
- ✅ Testing / Deploy
- 📥 Inbox

![Thread Organizer development-phase sections in the bb sidebar](docs/screenshot.png)

Inbox is an ordinary named section, not the pinned area. Sections are created when first needed. Plugin-created sections are removed after their last thread leaves; pre-existing sections with the same name are reused but never deleted by the plugin.

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/thread-organizer --yes
```

## Use

The plugin starts in `apply` mode, infers an initial phase from thread context, and periodically revisits plugin-managed placements. Agents can make an explicit transition for their own thread:

```bash
bb organizer phase planning
bb organizer phase spec-review
bb organizer phase building
bb organizer phase handoff
bb organizer phase testing-deploy
bb organizer phase inbox
```

The bundled `thread-phase-organizer` skill explains when to make each transition and falls back to Inbox when the current phase is unclear.

To preview automatic proposals without changing threads:

```bash
bb plugin config thread-organizer set inboxMode observe
```

## Behavior

Automatic organization preserves the plugin's existing safeguards: explicit creation-time sections remain locked, external changes lock subsequent automatic placement, ordinary visible root threads are the only managed threads, prompt-derived title repair remains available, and section destinations start collapsed unless the user deliberately expands them.

Manual transitions through `bb organizer phase` are immediate and remain plugin-managed, so later phase transitions continue to work. Hidden workers, children, forks, side chats, plugin-originated threads, archived threads, and deleted threads are excluded.

Empty cleanup uses only the shipped section APIs. Before deleting a plugin-owned section, Organizer performs a fresh one-row membership check and skips any section that still contains a thread. Failed cleanup is non-blocking and is retried during later reconciliation.

## Develop

```bash
npm ci
npm run check --workspace=bb-plugin-thread-organizer
bb plugin install "path:$PWD/plugins/thread-organizer" --yes
```
