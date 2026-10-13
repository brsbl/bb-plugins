---
name: timeline-comments
description: Address and resolve review comments attached to the current bb thread timeline. Use when a user asks to handle, fix, respond to, clear, or resolve timeline comments, review feedback, or open comment threads in bb.
---

# Timeline Comments

Work every open timeline comment through evidence, implementation, and resolution. Run commands from the affected bb thread so they use `BB_THREAD_ID`; add `--thread <id>` only when deliberately working on another thread.

## Workflow

1. List open comment threads as structured data:

   ```bash
   bb comments list --state open --json
   ```

2. Read each complete comment conversation. Follow `nextCursor` until it is null so later replies are not missed:

   ```bash
   bb comments get <comment-thread-id> --json
   bb comments get <comment-thread-id> --cursor <nextCursor> --json
   ```

3. Inspect the referenced timeline text and the current repository state. Decide whether the comment requests a code change, verification, explanation, or a user decision. Treat replies as part of the requirement, not as optional context.

4. Address the substance and run focused verification. Do not mark feedback resolved merely because you read it or disagree with it. Leave questions, blockers, and decision requests open until the needed answer or authority exists.

5. Reply with concise evidence describing what changed and what passed:

   ```bash
   bb comments reply <comment-thread-id> --body "Fixed in <file or commit>; <focused check> passes."
   ```

6. Resolve only after the change and verification are complete:

   ```bash
   bb comments resolve <comment-thread-id>
   ```

   If later evidence invalidates the resolution, reopen it before continuing:

   ```bash
   bb comments reopen <comment-thread-id>
   ```

7. Re-run the open list. Report any remaining comment IDs with the exact blocker or decision needed.

When a mutation reports that the comment thread changed, fetch it again before retrying. This preserves concurrent reviewer replies and prevents resolving stale feedback.
