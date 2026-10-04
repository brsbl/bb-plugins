# Inline Action Cards

Edit an email reply or approve a decision directly inside an agent message. Use a single card for one important item or a table to review a group in place.

![Minimal cards](https://github.com/user-attachments/assets/692e0678-252d-47cf-8e1f-01e2b5c3fa7e)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/inline-action-cards --yes
```

The install branch is published after the source PR merges. For a source checkout, install `path:/absolute/path/to/bb-plugins/plugins/inline-action-cards` in a development bb instance.

## Use

Ask an agent to use the **inline-action-cards** skill. It creates an item with `bb action-cards create` and emits `::action{id="esc-1"}`. Click Send, Yes/No, Later, or Skip (Save to Gmail drafts is in ⋯) to send the choice right away; if the agent is busy, it waits in the thread's queue. Once the message is sent, the card shows what you sent until the agent reports a result. Add note (the speech-bubble button, or ⋯ on table rows) opens a short field. Choose an action to include the note, or press Comment to send it without choosing; the card stays ready. Comment also replaces Reply’s Ask for changes. Finish or clear any existing composer message before clicking an action.

Reply cards show recipients, an expandable original excerpt, and an autosaving draft that edits like plain body text. Results collapse with the submitted note underneath, plus View and recovery in place. IDs travel in hidden mention context. Sending waits for pending saves. Agents claim each attempt once, honor its note as part of the approval, use the saved draft, and report its outcome through `bb action-cards report`. Verified failures offer Retry; uncertain outcomes offer Check outcome to avoid duplicate sends. The [agent skill](skills/inline-action-cards/SKILL.md) documents the full workflow.

A choice card lists 2–6 short options under one question. Pick one, then click “Use <option>”. A recommended option is tagged and preselected.

Use `bb action-cards create-table` with a title and existing item IDs to emit `::actions{id="..."}`. Reply rows open for review one at a time. Matching Decide operations can offer a bulk action; each row keeps its own result.

Items live in plugin-owned SQLite storage, scoped to their thread. Gmail access comes from the agent's connected tools. Later defers a card; it does not schedule a reminder.

### Editor choice

Docs was evaluated at `plugins/docs/app.tsx` and `document-session.ts` in bb. Its inline editor and flush handle are private, and the public Markdown component cannot mount another plugin's directive as a controlled editor. A separate Docs card cannot guarantee its pending autosave finishes before Send. V1 therefore uses a minimal plain-text editor with revision-checked autosave and save-before-submit. It preserves the same draft in place without copying Docs' rich editor or adding a core API dependency.

## Develop

```bash
npm ci
npm run check --workspace=bb-plugin-inline-action-cards
```

Run checks in remote CI. For local interaction verification, install the plugin only into an isolated source dev app. No settings or side panel are registered.
