# Inline Action Cards

Edit an email reply or approve a decision directly inside an agent message. Use a single card for one important item or a table to review a group in place.

![Minimal cards](https://github.com/user-attachments/assets/692e0678-252d-47cf-8e1f-01e2b5c3fa7e)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/inline-action-cards --yes
```

The install branch is published after the source PR merges. For a source checkout, install `path:/absolute/path/to/bb-plugins/plugins/inline-action-cards` in a development bb instance.

## Use

Ask an agent to use the **inline-action-cards** skill. It creates an item with `bb action-cards create` and emits `::action{id="esc-1"}`. Pick an answer and press Submit to send it right away; if the agent is busy, it waits in the thread's queue. Once the message is sent, the card shows what you sent until the agent reports a result. Pick an answer, optionally add a note, and press Submit. A note with no answer is sent as a question, and the card stays open. Skip remains in the Action log's ⋯ menu. Comment also replaces Reply’s Ask for changes. Finish or clear any existing composer message before clicking an action.

Reply cards show recipients, an expandable original excerpt, and an autosaving draft that edits like plain body text. Results collapse with the submitted comment underneath, plus View and recovery in place. IDs travel in hidden mention context. Sending waits for pending saves. Agents claim each attempt once, honor its comment as part of the approval, use the saved draft, and report its outcome through `bb action-cards report`. Verified failures offer Retry; uncertain outcomes offer Check outcome to avoid duplicate sends. The [agent skill](skills/inline-action-cards/SKILL.md) documents the full workflow.

A choice card lists 2–6 short options under one question. Pick one, then click “Use <option>”. A recommended option is tagged and preselected.

Use `bb action-cards create-table` with a title and up to 20 existing item IDs (Reply, Decide, or Choice) to emit `::actions{id="..."}`. Every card is a plain form: the question is the label, the consequence and context are help text, the answer is a radio group, and there is an optional Note field and a Submit button. A table is one form with one Submit, and it sends every answered row in one message. A note with no answer is sent as a question; the agent answers it on the card with `bb action-cards answer`. Submitted cards show what you chose, your note, and where it stands, with Retry or Resend when something went wrong.

Any card can carry Markdown `context` (headings, lists, code, tables, links) and up to four images (`https://` URLs or absolute paths on the thread's host). A comment sent on its own asks a follow-up about one card; the agent answers on the card with `bb action-cards answer`.

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
