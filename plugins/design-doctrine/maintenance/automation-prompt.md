# Doctrine maintenance pass

One bounded pass over new bb design feedback. `governance.md` covers the rules;
this is the procedure.

Limits: change at most five rule files per run. Don't touch plugin code, the
skill, or `governance.md`. Only the user's own messages are evidence — never
agent output, including your own.

## Steps

1. Read completed, queued episodes through the plugin's thread-history API and
   retain the returned `lease_id`. The command refuses to start if `rules/`
   already contains tracked or untracked work. Per-thread checkpoints prevent
   rereading old episodes, and the lease prevents concurrent runs from
   processing the same batch. The bounds shown are the defaults.

   ```bash
   bb doctrine history scan \
     --limit 200 \
     --max-bytes 262144 \
     --max-message-bytes 8192
   ```

   A fresh install establishes a current baseline and does not replay feedback
   already represented by the existing doctrine. The plugin normally queues
   visible user threads as they become idle; a startup and monthly inventory
   reconciliation recovers idle events missed during downtime. If `lease_id`
   is `null`, history is caught up. Report that there is no new feedback and
   stop; do not call `advance` or `release`.

2. Review the returned `episodes` directly. Each episode contains the unseen
   user and assistant conversation rows after that thread's checkpoint, ending
   at an idle boundary. User messages can be evidence; assistant messages are
   context for the attempted result and outcome, never evidence by themselves.
   Do not reopen the whole thread log. Ignore tool failures and temporary
   constraints. When an episode has `complete: false`, assess only the returned
   slice; the next pass will receive the remainder after a successful advance.

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

6. If nothing changed, skip to step 7. Otherwise validate the personalized
   corpus through the running plugin, then commit only the rule files:

   ```bash
   git diff --check -- rules
   bb doctrine validate
   git add -- rules
   git commit --only -m "doctrine: <what changed>" -- rules
   ```

   `git commit --only -- rules` leaves unrelated staged or working-tree changes
   untouched. The scan already refuses to start when `rules/` contains any
   pre-existing work. Rule-only maintenance does not rebuild or test plugin
   code; `bb doctrine validate` parses every rule and enforces the live schema,
   evidence counts, relations, and lifecycle constraints.

7. Advance every per-thread checkpoint in the leased batch after either a
   successful commit or a no-change decision:

   ```bash
   bb doctrine history advance --lease-id <lease-id>
   ```

   If the run cannot safely finish, release its lease without advancing so a
   later run can retry the same feedback:

   ```bash
   bb doctrine history release --lease-id <lease-id>
   ```

Report what changed, anything left conflicted and the question it needs, and the
rule count. Keep no-change runs to one sentence.
