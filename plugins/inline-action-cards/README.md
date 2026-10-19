# Inline Decisions

Answer everything agents need from you in one place: **Waiting on you**, a drawer above the prompt box that collects decisions, email replies and plain questions from every thread.

![Minimal cards](https://github.com/user-attachments/assets/692e0678-252d-47cf-8e1f-01e2b5c3fa7e)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/inline-action-cards --yes
```

The install branch is published after the source PR merges. For a source checkout, install `path:/absolute/path/to/bb-plugins/plugins/inline-action-cards` in a development bb instance.

## Use

Ask an agent to use the **inline-action-cards** skill. What a thread needs from you collects in **Waiting on you**, a drawer above that thread's prompt box: its decision cards from `bb action-cards create`, and its plain questions from `bb action-cards ask <id> "…" [--urgent] [--replaces <id>]`. Collapsed, it shows the top question; it lists the thread's items urgent first and then oldest, and disappears when nothing is waiting. The Decision log is the cross-thread view.

Click a row to answer it in place: the question, the options and Submit, or a written answer for a plain question. Submit sends your answer to that item's thread; if the agent is busy, it waits in the thread's queue. Use ‹ › to step through items, or Open thread for the full conversation. An item leaves the list once answered, or when the agent settles it with `bb action-cards resolve`. **Dismiss** settles an item without answering it, with an optional reason and a few seconds to Undo; its thread is told so the agent stops waiting. Dismiss is also on every waiting row in the Decision log.

In the timeline, an unanswered card is one line that opens it in Waiting on you, and an answered card shows its result with Retry or Resend when something went wrong. Reply cards show recipients, the original excerpt and an autosaving draft. Agents claim each attempt once, use the saved draft, and report its outcome through `bb action-cards report`; uncertain outcomes offer Check outcome to avoid duplicate sends. The [agent skill](skills/inline-action-cards/SKILL.md) documents the full workflow.

Any card can carry one short line of `context` (collapsed to a single line under the question, with more for the rest) and up to four images, and an optional `priority` (`urgent`, `normal` or `low`).

Items live in plugin-owned SQLite storage, scoped to their thread. Gmail access comes from the agent's connected tools. Cards no longer offer Later; existing Later cards still load and can be resumed.

### Editor choice

Docs was evaluated at `plugins/docs/app.tsx` and `document-session.ts` in bb. Its inline editor and flush handle are private, and the public Markdown component cannot mount another plugin's directive as a controlled editor. A separate Docs card cannot guarantee its pending autosave finishes before Send. V1 therefore uses a minimal plain-text editor with revision-checked autosave and save-before-submit. It preserves the same draft in place without copying Docs' rich editor or adding a core API dependency.

## Decision log

Open **Decision log** in the sidebar for every thread, or in a thread’s panel launcher for that thread only. It lists cards **Waiting on you** first, including failures that need a retry and Later cards at the bottom with Resume, then a shorter **Done** history. Each row shows whether it is a reply or a decision, its title, thread and time, and either its result or one main action, with the rest in its ⋯ menu (or an Open thread button when that is the only other action). Choices go to the card’s own thread. A reply never goes out unseen: on a collapsed log or table row, Send, Save to Gmail drafts and Retry first open the row to show its recipients, subject, original excerpt and full draft (their tooltips read “Review and send”), and only a second click sends. Bulk “… all” buttons cover matching decisions only, never replies.

Agents can read the same log with `bb action-cards log [--thread <id>] [--json]`. Without `--thread`, it includes all threads.

## Develop

```bash
npm ci
npm run check --workspace=bb-plugin-inline-action-cards
```

Run checks in remote CI. For local interaction verification, install the plugin only into an isolated source dev app. The Decision log page lists waiting and done cards across threads.
