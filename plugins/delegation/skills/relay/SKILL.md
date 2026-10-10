---
name: relay
description: Pass the user's decision, answer, or new request to an existing bb thread in one batched `bb thread tell`, quoting their words. Use when the user says "tell X", "let the worker know", "pass this on", answers a question a worker raised, or approves or rejects something another thread is waiting on. Starting new work belongs to delegate; answering an agent that messaged you is a direct reply.
---

# Relay

Every message wakes the target and replays its whole context, so send each
thread one message that carries everything it needs.

## Read the settings first

```sh
bb delegation settings --json
```

Use `relayBatching` from its output: `batch` combines everything for one thread
into a single message; `each` sends each request as it arrives.

## Steps

1. **Find the target.** Use the thread the user names, or the worker whose
   question they are answering. If two threads could be meant, ask once with
   a choice card (`inline-action-cards`).
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

5. **Confirm in one line**, such as "Sent to @thread:thr_abc123." Don't wait
   for a reply unless the message asks for something.

## Example

```sh
bb thread tell thr_abc123 --mode queue --message-file - <<'MESSAGE'
Approved: ship the collapsed variant.

> From brsbl: "go with B, but keep the dot on the left"

Move the dot to the left edge, update the PR screenshots, and reply with the PR link when CI is green.
MESSAGE
```
