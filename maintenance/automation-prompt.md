# Maintain The Personal Design Doctrine

Run one bounded, evidence-first maintenance pass. Learn from new bb task
episodes without silently changing operative product-design guidance.

## Resolve The Repository

Use `bb plugin source design-doctrine --json` to resolve the installed plugin
root. Call that directory `<root>` below. Stop if bb resolves the plugin or its
bundled `design-doctrine` skill to a different source.

## Scope

| May change | Must not change |
| --- | --- |
| Candidate rules under `<root>/rules/` | Active rule statement, strength, applicability, exception, or lifecycle |
| Append-only, directly resolvable bb evidence on an existing rule | Existing evidence or published summaries |
| Generated views through the doctrine CLI | Bundled skill, governance, taxonomy, schema, prompt, or scripts |
| CLI-owned local maintenance state | Automation identity, schedule, provider, model, or permissions |

Never activate, reject, contest, supersede, deprecate, delete, or strengthen a
rule. Propose prohibited changes in the run result for human review. Never edit
`maintenance/state.json` or `.runtime/lease-receipt.json` directly.

## Run

1. Use `design-doctrine` in maintenance mode and the available bb task-episode
   mining guidance.
2. Acquire a lease:

   ```bash
   python3 <root>/scripts/doctrine.py begin-run
   ```

   Stop and report if another lease is active. Do not replace a stale lease
   without human inspection.
3. Scan the leased incremental window:

   ```bash
   python3 <root>/scripts/doctrine.py scan \
     --limit 200 \
     --max-bytes 524288 \
     --max-message-bytes 32768
   ```

   Save the output outside the repository. Use its `cursor_commit` and
   `evidence_sha256` exactly. Reconstruct a truncated task episode before using
   it as evidence.
4. Reconstruct complete relevant task episodes around high-signal direct user
   messages. Exclude `[bb system]` and `[bb message ...]` relays from recurrence.
   Ignore tool failures, false verification, agent nonadherence, orchestration
   races, and temporary constraints unless they contain durable design judgment.
5. Compare each durable signal against nearby rules. Prefer, in order:

   - no change;
   - attach supporting or challenging evidence;
   - narrow or expand a candidate;
   - add a candidate;
   - propose a human decision in the result.

   Change at most five canonical rule files.
6. Store the complete direct-user-message source span in
   `episode_source_keys`, then derive the stable episode ID:

   ```bash
   python3 <root>/scripts/doctrine.py episode-id \
     --thread-id <thread-id> \
     --source-key <source-key>
   ```

   Repeat `--source-key` in source order for a multi-message episode. Automated
   evidence must have a nonempty bb thread and source-key locator. Existing
   `published_summary` evidence is immutable; external evidence requires human
   review.
7. Store minimal summaries, exact local source locators, content hashes, and a
   typed `doctrine_version_seen` value:

   - `pre-doctrine` only for evidence predating the initial doctrine;
   - `unseen` only when no doctrine-guided agent or artifact was involved;
   - `unknown` when influence cannot be established;
   - `sha256:<corpus>` when the agent or artifact used that doctrine version.

   `unknown` and corpus-hash evidence may not increase independent recurrence.
   Do not copy transcripts, credentials, private URLs, or irrelevant paths.
8. After changing evidence, replace `confidence.basis` with the exact output of:

   ```bash
   python3 <root>/scripts/doctrine.py basis --rule-id <rule-id>
   ```

9. Validate and rebuild:

   ```bash
   python3 <root>/scripts/doctrine.py validate
   python3 <root>/scripts/doctrine.py verify-evidence
   python3 <root>/scripts/doctrine.py build
   ```

10. If a rule changed, run at most two fresh readonly smoke-test threads: one
    realistic design/review prompt and one near miss. Inspect the transcripts,
    not only final output. Do not let test agents edit files.
11. Follow any applicable local skill-change reporting instructions. Do not
    create a report-only thread or edit app-owned sidecars.
12. Record the run atomically using the lease ID, exact cursor, scan fingerprint,
    final corpus hash, counts, and every changed rule ID:

    ```bash
    python3 <root>/scripts/doctrine.py record-run \
      --lease-id <lease-id> \
      --result <updated|no-change> \
      --cursor-created-at <cursor-created-at> \
      --cursor-segment-id <cursor-segment-id> \
      --scanned <count> \
      --added <count> \
      --updated <count> \
      --contested 0 \
      --evidence-hash <scan-evidence-sha256> \
      --expected-corpus-hash <final-corpus-sha256> \
      --changed-rule-id <id> \
      --note "<short result>"
    ```

    Repeat `--changed-rule-id` once per changed rule and omit it for no change.
    On failure, revert rule changes before recording `--result failed`; never
    advance the cursor after failed validation or smoke tests.

## Result

Report whether doctrine changed, rules or evidence added, human decisions
proposed, validation and smoke-test outcomes, and the new cursor and corpus
hash. Keep no-change runs concise.
