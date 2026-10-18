---
name: relay
description: Pass the user's decision, answer, or new request to an existing bb thread, or to all of your reports, in one batched `bb thread tell` each, quoting their words. Use when the user or another lead says "tell X", "let the worker know", "pass this on", "pass this to your reports", or forwards a rule for your team, answers a question a worker raised, or approves or rejects something another thread is waiting on. Starting new work belongs to delegate; answering an agent that messaged you is a direct reply.
---

# Relay

Every message wakes the target and replays its whole context, so send each
thread one message that carries everything it needs.

## Read the settings first

```sh
bb delegation settings --json
```

The values come from the user's own instructions first. If `bb delegation sources --json` shows `checkedAt` as null, or `~/.bb/AGENTS.md`, `~/.claude/CLAUDE.md`, or a memory note changed after it, refresh them with `delegation-defaults` before using them, but only on the machine its `host` names (this machine is `thread.environment.hostId` in `bb status --json`). On any other machine, use the recorded values as they are: its files aren't the ones they came from.

Use `relayBatching` from its output: `batch` combines everything for one thread
into a single message; `each` sends each request as it arrives.

## Steps

1. **Find the target.** Use the thread the user names, or the worker whose
   question they are answering. If two threads could be meant, ask once with
   a choice card if `inline-action-cards` is installed, otherwise a concise
   question in the conversation.
2. **Batch.** With `batch`, collect every decision and request for that
   thread from the current turn into one message.
3. **Write it.**
   - Lead with the decision or request.
   - Quote the user's words in a blockquote when their wording matters,
     headed "From <user>:".
   - Add only context the target lacks, then what to do next and when it is
     done.
   - No greetings, thanks, acknowledgements, or recap of the target's own
     work.
4. **Pick the delivery** from `bb thread show <id> --json` (`.thread.status`):

   | Target | Send |
   | --- | --- |
   | Idle | `bb thread tell <id> --message-file -`, which starts a turn. |
   | Busy, and the message changes its current work: stop, a new hard constraint, or a conflicting change | The default mode, which steers the live turn. |
   | Busy, and it can wait for the turn to finish | `--mode queue`. |
   | Waiting on an interaction | Find it with `bb thread interactions list <id>` and resolve the one the user decided on: `answer` a question, `approve` or `deny` a command, file change, or plan, `grant` or `deny` a permission, or `respond` to a plugin form. Never resolve one the user hasn't decided. |
   | Errored | Follow `collect-results` before relaying. |

5. **Broadcast to your reports** when another lead or the user asks you to
   pass something on ("pass this to your reports"). List your direct reports
   with `bb delegation children`, and send each the same message, attributed
   as "From <user> via <lead>:" with their words quoted. Use `--mode queue`
   unless it changes what they're doing right now. Pass it only to your direct
   reports; they forward it further if it applies to theirs.
6. **Confirm in one line**, such as "Sent to @thread:thr_abc123." Don't wait
   for a reply unless the message asks for something.

## Example

```sh
bb thread tell thr_abc123 --mode queue --message-file - <<'MESSAGE'
Approved: add CSV export.

> From the user: "Use CSV and include column headers."

Add the CSV headers, verify the output, and reply with the review link.
MESSAGE
```
