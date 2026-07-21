# Prompt Shaper skill tuning

One bounded, checkpointed pass that adapts the `prompt-shaper` skill to how your
own handoffs actually go. It reads new bb history through a saved cursor, folds
only repeating signal into `SKILL.md`, validates, and commits — safe to run by
hand or on a schedule.

Change only `skills/prompt-shaper/SKILL.md`; never touch the composer runtime.
Only your own messages are evidence — never agent output, including your own.

## Steps

1. Read new evidence and keep the returned `lease_id`. The reader refuses to
   start if the skill tree already has uncommitted work (preserving it) and
   holds a lease so two runs never process the same messages. Run from the
   plugin directory:

   ```bash
   node ../../tooling/bb-history.mjs scan \
     --state maintenance/state.json \
     --require-clean skills/prompt-shaper
   ```

   The reader redacts identifiers, URLs, secrets, and local paths and skips
   relayed `[bb ...]` messages. If it returns no messages, history is caught up:
   report that and stop; do not call `advance`.

2. Keep only durable signal. Count a signal only if it repeats — a correction
   you made more than once, or a shape you consistently accept or reject. Ignore
   one-offs, temporary constraints, and anything an agent produced.

3. Make the smallest edit. Fold the signal into `skills/prompt-shaper/SKILL.md`
   — tighten a role's "include when", add or narrow a rule, or fix a stopping
   convention. Keep it to one signal and one small diff.

4. Validate and commit only the skill, from the monorepo root:

   ```bash
   npm run check --workspace=bb-plugin-prompt-shaper
   git commit --only -m "prompt-shaper: <what changed>" \
     -- plugins/improve-prompt/skills/prompt-shaper/SKILL.md
   ```

5. Advance the cursor only after a successful commit or a no-change decision,
   using the `cursor_commit` and `lease_id` the scan returned:

   ```bash
   node ../../tooling/bb-history.mjs advance \
     --state maintenance/state.json \
     --created-at <created-at> --segment-id <segment-id> --lease-id <lease-id>
   ```

   If the run cannot finish safely, release the lease without advancing so a
   later run retries the same evidence:

   ```bash
   node ../../tooling/bb-history.mjs release \
     --state maintenance/state.json --lease-id <lease-id>
   ```

Report what changed and the rule of thumb it encodes; keep no-change runs to one
sentence. This file is repo-only guidance and does not ship in the installed
plugin. To run it on a schedule instead of by hand, see
[`bootstrap-prompt.md`](bootstrap-prompt.md).
