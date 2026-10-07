---
name: messaging
description: Delegate work to quiet child threads that report to their parent only when done, blocked, or needing a decision. Use when spawning child threads through the Messaging plugin, reporting from a Messaging child, or checking on Messaging children.
---

# Quiet child threads

Native `bb thread spawn --parent-self` wakes the parent after every child turn.
Messaging children do not: the parent hears from a child only when the child
reports, fails, or waits on an approval.

## Parent

- Start a child: `messaging_spawn_child`, or
  `bb messaging spawn "<task>" [--title <title>] [--environment default|shared]`.
  `default` uses the project's default environment; `shared` reuses the
  parent's environment.
- List children with status and last report: `messaging_list_children` or
  `bb messaging children [--json]`.
- Ask a child for an update: `messaging_request_status` or
  `bb messaging request-status <child-id>`. The child answers with one
  `status` report.
- Send any other message with `bb thread tell <child-id> '<message>'`.
- Read a child's latest output with `bb thread output <child-id>`.
- Archiving the parent archives its Messaging children and their descendants.

## Child

A child's final responses are not delivered to the parent. Send exactly one
report per event with `messaging_report_to_parent` or
`bb messaging report <kind> '<message>'`:

| Kind | When |
| --- | --- |
| `done` | The task is complete. Include the result and links. |
| `blocked` | A new blocker you cannot resolve. |
| `decision` | The parent must choose before you continue. |
| `status` | Answering a status request. |

Never report routine progress, acknowledgements, or thanks. Reports are capped
at 8000 characters; link files or threads for detail.

## Automatic notices

The parent is told automatically only when a child fails or waits on an
approval or question, because a stuck child cannot report.

## Limits

- The native Parent field stays empty, so core child-thread views and
  sidebar nesting do not show Messaging children. The link lives in the
  child's Messaging metadata and its lifecycle owner.
- Completion reporting depends on the child following its instructions. Use
  `bb messaging children` to spot idle children with no report.
