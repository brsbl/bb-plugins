# Inline Action Cards

Edit an email reply or approve a decision directly inside an agent message. Use a single card for one important item or a table to review a group in place.

![Minimal cards](https://github.com/user-attachments/assets/692e0678-252d-47cf-8e1f-01e2b5c3fa7e)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/inline-action-cards --yes
```

The install branch is published after the source PR merges. For a source checkout, install `path:/absolute/path/to/bb-plugins/plugins/inline-action-cards` in a development bb instance.

## Use

Ask an agent to use the **inline-action-cards** skill. It creates an item with `bb action-cards create` and emits `::action{id="esc-1"}`. Click Send, Yes/No, Skip, or Save to Gmail drafts to send the choice right away; if the agent is busy, it waits in the thread's queue. Every action sits on one line, with the primary button rightmost. Once the message is sent, the card shows what you sent until the agent reports a result. The Comment button (speech bubble) on every ready card and table row opens a short field. Choose an action to send the comment with it, or press the send button in the field to send just the comment; the card stays ready. Comment also replaces Reply’s Ask for changes. Finish or clear any existing composer message before clicking an action.

Reply cards show recipients, an expandable original excerpt, and an autosaving draft that edits like plain body text. Results collapse with the submitted comment underneath, plus View and recovery in place. IDs travel in hidden mention context. Sending waits for pending saves. Agents claim each attempt once, honor its comment as part of the approval, use the saved draft, and report its outcome through `bb action-cards report`. Verified failures offer Retry; uncertain outcomes offer Check outcome to avoid duplicate sends. The [agent skill](skills/inline-action-cards/SKILL.md) documents the full workflow.

A choice card lists 2–6 short options under one question. Pick one, then click “Use <option>”. A recommended option is tagged and preselected.

Use `bb action-cards create-table` with a title and existing item IDs to emit `::actions{id="..."}`. Reply rows open for review one at a time. Matching Decide operations can offer a bulk action; each row keeps its own result.

Items live in plugin-owned SQLite storage, scoped to their thread. Gmail access comes from the agent's connected tools. Cards no longer offer Later; existing Later cards still load and can be resumed.

### Editor choice

Docs was evaluated at `plugins/docs/app.tsx` and `document-session.ts` in bb. Its inline editor and flush handle are private, and the public Markdown component cannot mount another plugin's directive as a controlled editor. A separate Docs card cannot guarantee its pending autosave finishes before Send. V1 therefore uses a minimal plain-text editor with revision-checked autosave and save-before-submit. It preserves the same draft in place without copying Docs' rich editor or adding a core API dependency.

## Action log

Open **Action log** in the sidebar for every thread, or in a thread’s panel launcher for that thread only. It lists cards **Waiting on you** first, including failures that need a retry and Later cards at the bottom with Resume, then a shorter **Done** history. Each row shows whether it is a reply or a decision, its title, thread and time, and either its result or one main action, with the rest in its ⋯ menu (or an Open thread button when that is the only other action). Choices go to the card’s own thread. A reply never goes out unseen: on a collapsed log or table row, Send, Save to Gmail drafts and Retry first open the row to show its recipients, subject, original excerpt and full draft (their tooltips read “Review and send”), and only a second click sends. Bulk “… all” buttons cover matching decisions only, never replies.

Agents can read the same log with `bb action-cards log [--thread <id>] [--json]`. Without `--thread`, it includes all threads.

## Develop

```bash
npm ci
npm run check --workspace=bb-plugin-inline-action-cards
```

Run checks in remote CI. For local interaction verification, install the plugin only into an isolated source dev app. The Action log page lists waiting and done cards across threads.
