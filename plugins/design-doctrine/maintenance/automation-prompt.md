# Doctrine maintenance pass

One bounded pass over new bb design feedback. `governance.md` covers the rules;
this is the procedure.

Limits: change at most five rule files per run. Don't touch plugin code, the
skill, or `governance.md`. Only the user's own messages are evidence — never
agent output, including your own.

## Steps

1. Read new feedback and retain the returned `lease_id`. The command refuses to
   start if `rules/` already contains tracked or untracked work, preserving it
   for its owner. The lease prevents a second maintenance run from processing
   the same messages concurrently. The bounds are optional and default to
   `--limit 200 --max-bytes 262144 --max-message-bytes 8192`.

   ```bash
   python3 scripts/scan-history.py scan
   ```

   If `lease_id` is `null`, history is already caught up. Report that there is
   no new feedback and stop; do not call `advance` or `release`.

2. Reconstruct whole task episodes around the user's own messages. Ignore
   `[bb system]` and `[bb message ...]` relays, tool failures, and temporary
   constraints. A relay repeating an instruction is the same episode, not a
   second one.

3. For each durable signal, take the smallest action that fits:

   - nothing;
   - add an Evidence line to an existing rule and bump `supporting_episodes`;
   - tighten "Use when" / "Do not use when", or add an Exceptions section;
   - write a new rule at `rules/<domain>/ddr_NNN.md`;
   - retire a replaced rule (`status: retired`) and point its replacement at it
     through `relations`;
   - set `status: conflicted`, add the challenging evidence, bump
     `challenging_episodes`, and ask the user.

   Update `confidence` to match the evidence and set `updated` to today.

4. A new rule needs the same frontmatter as its neighbours — `id`, `kind`,
   `strength`, `confidence`, `status`, `domain`, `products`, `activities`,
   `artifacts`, `surfaces`, `relations`, `supporting_episodes`,
   `challenging_episodes`, `updated` — and the sections Why, Prefer, Avoid,
   Use when, Do not use when, Evidence, Check.

5. Keep evidence lines short and anonymous: one line per episode, describing
   what the user asked for or corrected. Never paste transcripts, credentials,
   private URLs, thread IDs, or message IDs.

6. If nothing changed, skip to step 7. Otherwise check the result and commit:

   ```bash
   npm test && npm run typecheck && npm run build
   git add -- rules
   python3 scripts/scan-history.py verify-staged
   git commit --only -m "doctrine: <what changed>" -- rules
   ```

7. Advance the cursor after either a successful commit or a no-change decision,
   using the returned `cursor_commit` and `lease_id`:

   ```bash
   python3 scripts/scan-history.py advance \
     --created-at <created-at> --segment-id <segment-id> --lease-id <lease-id>
   ```

   If the run cannot safely finish, release its lease without advancing so a
   later run can retry the same feedback:

   ```bash
   python3 scripts/scan-history.py release --lease-id <lease-id>
   ```

Report what changed, anything left conflicted and the question it needs, and the
rule count. Keep no-change runs to one sentence.
