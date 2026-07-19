---
name: design-doctrine
description: Mandatory personal-judgment companion for product, UX, UI, visual-design, design-system, and AI-interaction work. Load it with architect, design, crit, product-design audit, prototype, UI Pattern Atlas, and implementation skills—even when the user does not mention doctrine—so plans, designs, names, implementations, and reviews use the installed evidence-backed principles, standards, guidelines, and taste. Also use for preference questions, taste checks, reviews against prior feedback, and learning new rules from bb history.
---

# Design Doctrine

Use the personal doctrine as a focused judgment layer over the existing design
workflow skills. It records durable preferences and standards learned from
direct user evidence; it does not replace product requirements, accessibility,
platform conventions, the Pattern Atlas, or explicit instructions in the
current task.

## Choose A Mode

| Mode | Trigger | Result |
| --- | --- | --- |
| Guide | Plan, design, prototype, or implement a product surface | Retrieve the smallest applicable active rule set and use it to shape decisions. |
| Review | Critique, QA, taste-check, or evaluate work | Report concrete findings tied to applicable active rules. |
| Explain | Ask what the user prefers or why a prior decision was made | Return the relevant rules, scope, exceptions, and evidence summary. |
| Maintain | Learn from thread history or run the doctrine maintainer | Add evidence or candidates without silently changing operative doctrine. |
| Operate | Check, rebuild, search, run now, retry, inspect output, or open the source | Use the bundled CLI and the exact automation metadata in maintenance state. |

## Sources Of Truth

Resolve the canonical repository root from `bb doctrine status --json` (field
`root`) or `bb plugin source design-doctrine --json`. Call it `<root>` below.
Do not infer the path from this bundled skill's staged location. Read only the
records returned by the query command unless maintenance requires a full-corpus
pass.

| Resource | Authority | Read when |
| --- | --- | --- |
| `<root>/rules/**/*.json` | Canonical doctrine records | Applying, reviewing, or maintaining a rule |
| `<root>/taxonomy.json` | Controlled classification and aliases | Classifying or filtering rules |
| `<root>/governance.md` | Promotion, conflict, evidence, and self-learning policy | Maintaining doctrine or resolving a conflict |
| Native **Design Doctrine** bb panel | Live repository-backed library with search, typed filters, Git state, deep links, and rule inspectors | Browsing, comparing, or sharing durable rules |
| `bb doctrine` | Bounded agent-facing status, active-rule search, and rule inspection | Routine retrieval from bb agents or terminals |
| `<root>/generated/browse.html` | Generated visual library with search, typed filters, and rule inspectors | Browsing the corpus or opening a durable rule link |
| `<root>/generated/DOCTRINE.md` | Generated long-form Markdown catalog | Reading or explaining the corpus without a browser |
| `<root>/generated/index.jsonl` | Generated compact search index | Retrieval tooling |
| `<root>/maintenance/state.json` | Local, untracked CLI-owned cursor, hashes, automation identity, and run state | Maintenance and operations |
| `<root>/maintenance/.runtime/lease-receipt.json` | CLI-owned ephemeral run attestation | Active maintenance only |
| `<root>/schema/*.schema.json` | Rule and taxonomy structural contracts | Validation or schema changes |

Generated files are projections. Never edit them directly.

The repository root is also the plugin’s live Git checkout. Git records diffs,
authorship, snapshots, and rollback; it does not change lifecycle authority.
The canonical working tree remains live, and the plugin surfaces uncommitted
changes explicitly.

## Guide Work

1. Describe the task with the fewest useful facets: activity, product, surface,
   artifact, and any explicit constraints.
2. Query before reading full records:

   ```bash
   python3 <root>/scripts/doctrine.py query \
     --text "<task and surface>" --product <product-id> --limit 12
   ```

3. Use `active` rules only. Candidates and rejected, superseded, or deprecated
   records are visible for maintenance and posterity but are not instructions.
4. Load the returned rule files. Apply matching exceptions before the general
   statement.
5. Treat strength consistently:

   | Strength | Treatment |
   | --- | --- |
   | `required` | Meet the rule or surface the blocking constraint. |
   | `default` | Follow it unless the current context provides a better reason not to. |
   | `preference` | Bias toward it while respecting stronger requirements. |
   | `warning` | Check explicitly for the named failure mode. |

6. Cite rule IDs when they materially explain a decision. Do not paste the
   whole catalog into ordinary design work.

Current user instructions and hard product, legal, accessibility, privacy, and
platform constraints outrank doctrine for the current task. A task-local
override is not automatically a new durable preference.

## Review Work

Retrieve applicable active rules first, then inspect the actual artifact. Keep
findings concrete and scoped.

| Field | Include |
| --- | --- |
| Rule | Stable ID and title |
| Observation | What is visible or behaves this way |
| Impact | Effect on clarity, speed, trust, fidelity, or consistency |
| Recommendation | Smallest useful correction |
| Confidence | Evidence quality and any unresolved scope question |

Use the existing `crit` rubric for generic design quality and Pattern Atlas for
neutral component vocabulary. Doctrine findings should add personal judgment,
not repeat those frameworks.

## Resolve Conflicts

Apply this order:

1. Current-task facts and hard constraints.
2. Matching exceptions and qualifiers.
3. More specific applicability.
4. Human-approved evidence over inferred evidence.
5. Stronger normativity, then confidence.
6. Recency only when it represents a demonstrated preference change.

If a conflict remains, surface it. Do not average incompatible rules or let the
newest timestamp win. Read `<root>/governance.md` for relationship and
supersession rules.

## Maintain Doctrine

Maintenance is evidence work, not freeform style-guide writing.

1. Read `<root>/governance.md`, `<root>/taxonomy.json`, and the current corpus.
2. Use the task-episode method from `bb-usage-skill-maintainer`; reconstruct the
   goal, correction, outcome, and finish line rather than mining isolated
   phrases.
3. Acquire the maintenance lease, snapshot the database high-water mark, then
   collect incremental evidence:

   ```bash
   python3 <root>/scripts/doctrine.py begin-run
   python3 <root>/scripts/doctrine.py scan \
     --limit 200 \
     --max-bytes 524288 \
     --max-message-bytes 32768
   ```

4. Treat direct user messages as primary evidence. Cross-thread relays and
   system summaries may explain an episode but do not count as independent
   recurrence.
5. Exclude tool failures, false verification, agent nonadherence,
   orchestration races, and temporary project constraints unless they expose a
   durable design judgment.
6. Compare every signal with nearby rules before creating a new record. Prefer:
   add evidence, narrow applicability, add an exception, or add a relationship.
7. Automated runs may create or update `candidate` records and append
   supporting or challenging evidence. Existing active-rule evidence is
   immutable. Automated runs may not activate, reject, supersede, deprecate,
   delete, strengthen, or materially rewrite a rule.
8. Store the complete direct-user-message episode span in
   `episode_source_keys` and derive `episode_id` with the CLI’s `episode-id`
   command. Recurrence counts unique deterministic episodes, not evidence
   records. Automated evidence must resolve to direct bb user messages;
   external evidence requires explicit human review.
9. Store minimal evidence summaries and hashes, not whole transcripts or
   secrets. Record the doctrine manifest seen by the source agent when known so
   agent compliance cannot reinforce its own doctrine. After changing evidence,
   replace `confidence.basis` with the CLI’s exact `basis --rule-id <id>`
   output; those counters are derived, while the active confidence judgment is
   protected.
10. Validate and rebuild:

   ```bash
   python3 <root>/scripts/doctrine.py validate
   python3 <root>/scripts/doctrine.py verify-evidence
   python3 <root>/scripts/doctrine.py build
   ```

11. Advance the cursor only after a verified update or a verified no-change
    decision. Use `record-run --lease-id <lease> ...` with the scan’s exact
    `cursor_commit`, `evidence_sha256`, final corpus hash, counts, and repeated
    `--changed-rule-id` values. The recorder rejects active semantic or
    provenance changes, locked-file changes, unverifiable evidence, undeclared
    diffs, and cursor drift. Never edit maintenance state or lease receipts
    directly. Record failures without cursor fields after reverting canonical
    changes.
12. When a skill file changes, follow the applicable local skill-maintenance
    instructions and run bounded fresh-thread smoke tests. Do not spawn a
    report-only thread.
13. Never create, edit, pause, resume, or delete automations from an automated
    maintenance run.

## Operate It

Use the native bb command for routine retrieval:

```bash
# Corpus and Git status
bb doctrine status

# Active rules only by default
bb doctrine search "empty state"
bb doctrine search "compact utilities"

# Include candidates and historical states only when needed
bb doctrine search "explicit click" --all

# Inspect one complete record
bb doctrine show ddr_001
```

Open **Design Doctrine** in the bb sidebar for the native searchable library.
The panel reads the canonical repository directly, refreshes when the corpus or
Git state changes, and supports durable `/rule/<id>` deep links.

The maintenance CLI exposes validation, generation, and scheduled-run controls:

```bash
# Local integrity and corpus status
python3 <root>/scripts/doctrine.py status
python3 <root>/scripts/doctrine.py validate
python3 <root>/scripts/doctrine.py verify-evidence
python3 <root>/scripts/doctrine.py test

# Regenerate the visual library, Markdown catalog, and search index
python3 <root>/scripts/doctrine.py build

# Advanced typed search and generated HTML fallback
python3 <root>/scripts/doctrine.py query --text "empty state"
python3 <root>/scripts/doctrine.py query \
  --text "compact utilities" --activity critique --artifact component \
  --surface toolbars
# Opens generated/browse.html
python3 <root>/scripts/doctrine.py open

# Scheduled maintainer operations
python3 <root>/scripts/doctrine.py automation-status
python3 <root>/scripts/doctrine.py run-now
python3 <root>/scripts/doctrine.py last-output
```

`run-now` is also the retry path. It uses a fresh idempotency key by default;
pass `--idempotency-key` when the caller needs retry deduplication.

## Boundaries

- Keep general product theory in `architect`, `design`, and `crit`.
- Keep neutral component definitions in UI Pattern Atlas.
- Keep product-specific requirements in product specs and design systems.
- Keep candidates non-operative until human approval.
- Never use doctrine as evidence for itself.
- Never broaden one product episode into a global rule without independent
  evidence.
- Preserve superseded and rejected records for audit and posterity.
