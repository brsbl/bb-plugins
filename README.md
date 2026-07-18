# Prompt Shaper

Prompt Shaper adds **Enhance prompt** to the bb composer. It turns the current rough draft into a concise, context-complete prompt, puts the result back into the same composer, and leaves sending to you.

## How It Works

- Click **Enhance prompt** after writing a rough request.
- A hidden, sandboxed bb thread applies your Prompt Shaper skill.
- In an existing thread, the worker inherits that thread's semantic context. If session cloning is unavailable, it explicitly inspects the source thread.
- When enhancement finishes, it replaces the composer's current text and can be undone—even if you kept typing or the worker made an assumption.
- The draft stays visible while the text shimmers to show that enhancement is running.

Attachments stay attached. The plugin never sends the prompt or performs the drafted task.

## Use It

1. Write a rough prompt in any bb composer.
2. Click **Enhance prompt**.
3. Review the shaped draft in the composer, then send normally.

## Release Requirement

This source targets bb Plugin SDK `0.4.0`, where `useComposer()` exposes the shared draft through `text` and `setText()`. It is ready to build and install with that bb release; the current public `0.0.30` app cannot load it.

```bash
npm test
npm run typecheck
bb plugin build
bb plugin install .
```

## Maintenance

Prompt-shaping behavior lives entirely in `~/.bb/skills/prompt-shaper/SKILL.md`. A weekly bb automation reviews complete task episodes and updates that skill when it finds a recurring prompt-addressable pattern. The plugin only runs the skill and returns its output.
