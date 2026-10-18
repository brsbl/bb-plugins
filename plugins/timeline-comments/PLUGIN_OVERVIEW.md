## Review a conversation in place

Select text in an agent message and choose **Comment**. The note stays beside the text through an underline and a gutter marker, so the feedback keeps its context as the conversation continues.

Reply to a comment, edit it, delete it, or resolve and reopen the discussion. The thread's **Comments List** brings open and resolved feedback together. If the original text is missing or ambiguous, the comment appears as **Unanchored** rather than attaching to a guess.

## Hand feedback to the agent

Add open comments to the current thread's draft, review the text, and send it when ready. Adding comments to the draft does not submit a message.

The bundled skill and `bb comments` commands let an agent read discussions, reply with evidence, and resolve feedback after addressing it.

## Requirements and storage

Requires bb 0.0.34 or newer and a compatible Plugin SDK in the 0.4 series. No external account or service is required. Comments are stored in plugin-owned SQLite on the bb server and belong to their conversation thread.
