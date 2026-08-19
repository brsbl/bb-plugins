# Thread Organizer

Thread Organizer files bb work into the phase it is in now. The sidebar contains only phase sections that currently have threads:

- 📥 Inbox
- 📋 Planning
- 🔎 Spec Review
- 🛠️ Building
- ✅ Testing / Deploy
- 🤝 Handoff

![Thread Organizer development-phase sections in the bb sidebar](docs/screenshot.png)

Inbox is an ordinary named section, not the pinned area. Sections are created when first needed. Pre-existing sections with the same name are reused but never claimed or deleted by the plugin. Empty plugin-created sections are retained because the released SDK does not provide an atomic delete-if-empty operation.

The content script keeps those phase sections in the order above while leaving unrelated sections in their existing positions. Handoff is last because it represents packaging completed work for its next owner.

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

| Phase | Criteria |
| --- | --- |
| 📥 Inbox | The phase is unclear or mixed, work is blocked before it starts, or the thread is awaiting direction. |
| 📋 Planning | Discovering, scoping, researching, designing an approach, or writing requirements. |
| 🔎 Spec Review | Reviewing, critiquing, approving, or revising a specification or implementation plan. |
| 🛠️ Building | Implementing, debugging, refactoring, or changing code and artifacts. |
| ✅ Testing / Deploy | Running QA, tests, CI or release checks, shipping, or deploying. |
| 🤝 Handoff | Packaging current state and evidence so another agent or owner can continue. |

To preview automatic proposals without changing threads:

```bash
bb plugin config thread-organizer set inboxMode observe
```

## Behavior

Automatic organization preserves the plugin's existing safeguards: explicit creation-time sections remain locked, external changes lock subsequent automatic placement, ordinary visible root threads are the only managed threads, prompt-derived title repair remains available, and section destinations start collapsed unless the user deliberately expands them.

Manual transitions through `bb organizer phase` are immediate and remain plugin-managed, so later phase transitions continue to work. Hidden workers, children, forks, side chats, plugin-originated threads, archived threads, and deleted threads are excluded.

Ownership reconciliation removes stale registry entries for sections deleted elsewhere. Organizer does not compose a membership check with unconditional deletion because a thread could enter the section between those calls and lose its assignment.

## Develop

```bash
npm ci
npm run check --workspace=bb-plugin-thread-organizer
bb plugin install "path:$PWD/plugins/thread-organizer" --yes
```
