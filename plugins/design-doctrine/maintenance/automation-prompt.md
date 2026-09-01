# Doctrine maintenance pass

One bounded pass over new bb design feedback. `governance.md` covers the rules;
this is the procedure.

Limits: change at most five rule files per run. Don't touch plugin code, the
skill, or `governance.md`. Only the user's own messages are evidence — never
agent output, including your own.

Run from the worktree bb provisioned for this run. It is a fresh checkout of
the repository on its own branch, so rule edits cannot disturb any other
checkout and nothing has to be configured by hand. Rules live at
`plugins/design-doctrine/rules`; every path below is relative to the worktree
root.

## Steps

1. Read completed, queued episodes through the plugin's thread-history API and
   retain the returned `lease_id`. Per-thread checkpoints prevent rereading old
   episodes, and the lease prevents concurrent runs from processing the same
   batch. The bounds shown are the defaults.

   ```bash
   bb doctrine history scan \
     --limit 400 \
     --max-bytes 1048576 \
     --max-message-bytes 8192
   ```

   Episodes whose user messages carry no design signal, and episodes older than
   the review window, are advanced automatically and never reach you; the
   result reports them as `skipped_episode_count`. A fresh install establishes a
   current baseline and does not replay feedback already represented by the
   existing doctrine. The plugin normally queues
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
   - write a new rule at `plugins/design-doctrine/rules/<domain>/ddr_NNN.md`;
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

6. If nothing changed, skip to step 8. Otherwise validate this worktree's rules
   and commit only rule files:

   ```bash
   git diff --check -- plugins/design-doctrine/rules
   bb doctrine validate plugins/design-doctrine
   git add -- plugins/design-doctrine/rules
   git commit -m "doctrine: <what changed>" -- plugins/design-doctrine/rules
   ```

   `bb doctrine validate <path>` parses every rule under that path and enforces
   the live schema, evidence counts, relations, and lifecycle constraints. Pass
   the worktree's own plugin directory so you validate what you just wrote
   rather than the published corpus.

7. Publish the batch as a pull request that merges itself once the
   repository's required checks pass. Do not wait for CI and do not merge by
   hand.

   ```bash
   git push -u origin HEAD
   gh pr create --fill
   gh pr merge --auto --squash
   ```

   The plugin picks the rules up on its next corpus refresh, a couple of
   minutes after the merge. If CI fails, leave the pull request open and say so
   in your report; the next run starts from a fresh worktree and is unaffected.

8. Advance every per-thread checkpoint in the leased batch after either a
   pushed pull request or a no-change decision:

   ```bash
   bb doctrine history advance --lease-id <lease-id>
   ```

   If the run cannot safely finish, release its lease without advancing so a
   later run can retry the same feedback:

   ```bash
   bb doctrine history release --lease-id <lease-id>
   ```

9. Check whether an earlier batch is stuck before you finish:

   ```bash
   bb doctrine status --json
   ```

   A `stalled_publication` means a previous run's pull request has not merged —
   a failing check, an unresolved review comment, or a conflict. Auto-merge
   waits indefinitely, so name it in your report; the corpus learns nothing
   further until it lands.

Report what changed, the pull request URL, any stalled publication, anything
left conflicted and the question it needs, and the rule count. Keep no-change
runs to one sentence.
