# Inline Action Cards

Edit an email reply or approve a decision directly inside an agent message. Each card keeps its draft, recipients, buttons, and result together.

![Editable Reply and Decide cards inside a thread](https://github.com/user-attachments/assets/deef0d32-fda2-40bd-9351-0abe1d01d7c0)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/inline-action-cards --yes
```

The install branch is published after the source PR merges. For a source checkout, install `path:/absolute/path/to/bb-plugins/plugins/inline-action-cards` in a development bb instance.

## Use

Ask an agent to use the **inline-action-cards** skill. It creates an item with `bb action-cards create` and emits `::action{id="esc-1"}`. Click Send, Save to Gmail drafts, Yes/No, Later, or Skip to submit the choice immediately. Ask for changes fills the composer so you can type. Finish or clear any existing composer message before clicking an action.

Reply cards show all recipients, an expandable original email, and one autosaving plain-text draft. Sending waits for pending saves. Agents claim each attempt once, use the saved draft, and report its outcome through `bb action-cards report`. Verified failures offer Retry; uncertain outcomes offer Check outcome to avoid duplicate sends. The [agent skill](skills/inline-action-cards/SKILL.md) documents the full workflow.

Items live in plugin-owned SQLite storage, scoped to their thread. Gmail access comes from the agent's connected tools. Later defers a card; it does not schedule a reminder.

### Editor choice

Docs was evaluated at `plugins/docs/app.tsx` and `document-session.ts` in bb. Its inline editor and flush handle are private, and the public Markdown component cannot mount another plugin's directive as a controlled editor. A separate Docs card cannot guarantee its pending autosave finishes before Send. V1 therefore uses a minimal plain-text editor with revision-checked autosave and save-before-submit. It preserves the same draft in place without copying Docs' rich editor or adding a core API dependency.

## Develop

```bash
npm ci
npm run check --workspace=bb-plugin-inline-action-cards
```

Run checks in remote CI. For local interaction verification, install the plugin only into an isolated source dev app. No settings or side panel are registered.
