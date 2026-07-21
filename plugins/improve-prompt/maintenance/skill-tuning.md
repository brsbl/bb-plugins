# Prompt Shaper skill tuning

A bounded, manual pass for adapting the `prompt-shaper` skill to how your own
handoffs actually go. There is no history mining and no automation — you read
real evidence, make one small edit, validate it, and commit.

## When to run

After a stretch of handoffs where the improved prompt repeatedly missed or
over-included something — not for a single off case.

## Steps

1. **Gather evidence from your own bb work.** Look at recent threads and
   handoffs where you used Improve Prompt: the draft, the prompt it returned,
   and how the receiving agent actually did. Search your history for the drafts
   and corrections:

   ```bash
   bb thread search "<what you kept correcting>"
   bb thread history <thread-id>
   ```

2. **Keep only durable signal.** Count a signal only if it repeats — a
   correction you made more than once, or a shape you consistently accept or
   reject. Ignore one-off asks, temporary constraints, and anything an agent
   produced. Only your own messages are evidence.

3. **Make the smallest edit.** Encode the signal in
   [`../skills/prompt-shaper/SKILL.md`](../skills/prompt-shaper/SKILL.md) —
   tighten a role's "include when", add or narrow a rule, or fix a stopping
   convention. Do not touch the plugin runtime.

4. **Validate and commit** from the monorepo root:

   ```bash
   npm run check --workspace=bb-plugin-prompt-shaper
   git add -- plugins/improve-prompt/skills/prompt-shaper/SKILL.md
   git commit -m "prompt-shaper: <what changed>"
   ```

Keep the change reviewable: one signal, one small diff. This file is
repo-only guidance and does not ship in the installed plugin.
