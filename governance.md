# Design Doctrine Governance

The doctrine learns continuously but changes operative guidance deliberately:
automated maintenance may discover candidates and accumulate evidence, while
activation and semantic policy changes remain human decisions.

## Authority

| Material | Authority | Direct edits |
| --- | --- | --- |
| `rules/**/*.json` | Canonical personal doctrine | Reviewed semantic changes |
| `taxonomy.json` | Controlled classification | Human-approved changes |
| `schema/rule.schema.json` | Typed rule contract | Human-approved changes |
| `maintenance/state.json` | Local, untracked operational cursor and hashes | Doctrine CLI only |
| `maintenance/.runtime/lease-receipt.json` | Ephemeral run attestation | Doctrine CLI only |
| `generated/*` | Rebuildable projection | Never |
| bb task episodes | Evidence, not doctrine | Never through this system |

The doctrine adds one durable noun: a rule. A candidate is a rule with
`lifecycle.status: candidate`, not a separate object.

## Rule Kinds And Strength

Kind describes what a rule is. Strength describes how forcefully it applies.

| Kind | Meaning | Normal strength |
| --- | --- | --- |
| `principle` | Enduring decision logic or tradeoff | `default` |
| `standard` | Testable bar for applicable work | `required` or `default` |
| `guideline` | Context-sensitive practice | `default` |
| `taste` | Personal aesthetic or experiential preference | `preference` |
| `anti_pattern` | Named failure mode to detect and avoid | `warning` |

A `required` rule must be a standard and must include an objective verification
check. Automated maintenance may not increase strength.

## Lifecycle

| Status | Use in ordinary work | Meaning |
| --- | --- | --- |
| `candidate` | No | Evidence-backed proposal awaiting a decision |
| `active` | Yes | Approved operative doctrine |
| `contested` | No | Credible evidence conflicts and scope is unresolved |
| `rejected` | No | Reviewed and intentionally not adopted |
| `superseded` | No | Replaced by a newer rule |
| `deprecated` | No | Retired without a replacement |

Candidates do not auto-activate or expire. Rejected, superseded, and deprecated
records remain searchable in maintenance mode so history is not rediscovered or
silently rewritten.

## Evidence Bar

Evaluate complete task episodes. Prompt length and message count do not measure
quality or durability.

### Primary evidence

- A direct user instruction framed as a durable default or principle.
- A direct correction that identifies a design decision boundary.
- A direct approval or rejection where the relevant design choice was visible.
- A later direct statement that explicitly supersedes an earlier preference.

### Supporting context

- Cross-thread relays and worker summaries.
- Agent interpretations.
- Acceptance without a visible decision.
- Project requirements or implementation constraints.

Supporting context may explain evidence but does not count as an independent
user episode.

### Promotion guidance

| Evidence | Allowed automated result |
| --- | --- |
| One clear episode | Create or update a candidate |
| Repeated independent episodes | Raise candidate confidence or propose activation |
| Contradictory episode | Add challenging evidence and contest or narrow the proposal |
| Tool/agent/process failure without design judgment | No doctrine change |

The owner-requested initial bootstrap is the only historical activation
exception. A rule may start active when at least two independent direct owner
instructions or corrections establish the same durable decision boundary; mark
that decision `owner-direct-history-bootstrap`. The public corpus retains
reviewed evidence summaries and anonymous context labels, while a private
source snapshot retains the original resolvable locators. Everything else
starts as a candidate. This exception ends after the initial corpus and is
never available to the automated maintainer.

An explicit current user request may authorize a named rule directly. Otherwise
activation requires human approval after the semantic diff is visible.

## Prevent Feedback Loops

Every evidence record classifies doctrine influence as `pre-doctrine`,
`unseen`, `unknown`, or the exact `sha256:<corpus>` used by the agent or
artifact. Only `pre-doctrine` and demonstrably `unseen` evidence may increase
independent recurrence counts. Agent outputs created under a rule do not
independently confirm that rule. A later direct user correction or explicit
approval may still count.

For new local bb evidence, store every task episode's complete
direct-user-message span in `episode_source_keys`; derive `episode_id`
deterministically from its bb thread and ordered span. Overlapping source spans
must resolve to one episode. Count unique episode IDs, not evidence records,
when assessing recurrence.

Published bootstrap evidence uses `source.type: published_summary`. Its context,
scope, signal, span, and episode labels are anonymous but preserve independence
counts and cross-rule relationships. Published summaries are human-reviewed,
immutable to automation, and intentionally do not resolve back to private bb
records.

Automated maintenance may add evidence only when its bb thread, source span, and
content hash resolve to direct user messages. It may retain an existing
published summary but cannot add, rewrite, or remove one. External or otherwise
unverifiable evidence requires explicit human review. Deduplicate evidence by
source locator and content hash. Multiple observations from one task and relayed
copies of the same instruction remain one episode.

## Applicability

Classify a rule by the decision it governs, not the screen or project where it
was first observed.

- Give each rule one primary taxonomy leaf and at most two secondary leaves.
- Put products, components, surfaces, and tasks in applicability or retrieval.
- Keep `when` and `not_when` concrete.
- Encode a repeated counterexample as an exception or scope boundary, not a
  vague reduction in confidence.
- Keep project-only constraints out of global scope.

## Taxonomy Evolution

Taxonomy IDs are durable interfaces. Add a new canonical leaf before migrating
rules or callers. Record a rename in `id_aliases`; queries resolve the old ID to
its canonical replacement. Record a retired or split concept in `deprecations`
with zero or more successor IDs. Never reuse a retired ID for a different
meaning.

Canonical rule records use active leaf IDs only. Aliases preserve query
compatibility; deprecations preserve historical meaning and force callers to
choose an active successor. The taxonomy schema and semantic validator enforce
unique roots, leaves, aliases, retirements, and valid successor targets.

## Exceptions

An exception must state:

1. The condition that makes the general rule inappropriate.
2. The behavior to use instead.
3. The rationale.
4. Evidence references when the exception came from history.

Exceptions apply before the general statement.

## Relationships

| Type | Use |
| --- | --- |
| `supports` | One rule reinforces another |
| `qualifies` | One rule narrows or conditions another |
| `tensions_with` | Both may be valid under different boundaries |
| `depends_on` | One rule requires another to make sense |
| `supersedes` | A newer rule replaces an older decision |

Relationship targets must exist. Supersession and dependency graphs must be
acyclic. Two active rules with the same applicability may not remain in
unresolved tension.

## Contradiction Resolution

Do not average rules or let the newest timestamp win.

1. Apply hard current-task constraints.
2. Apply explicit exceptions and qualifiers.
3. Prefer the more specifically applicable rule.
4. Prefer direct human evidence over inferred evidence.
5. Prefer stronger normativity, then confidence.
6. Use recency only when it demonstrates a changed preference.
7. If conflict remains, mark the affected rule contested and ask.

Clarification that preserves the decision increments the same rule revision. A
changed decision, rationale, or material scope receives a new ID and supersedes
the old record.

## Agent Authority

| Action | Automated maintainer |
| --- | --- |
| Read, query, validate, and rebuild generated views | Allowed |
| Create a candidate | Allowed |
| Append new supporting or challenging evidence | Allowed |
| Rewrite or remove existing active-rule evidence | Not allowed |
| Recompute active `confidence.basis` exactly from validated evidence | Allowed |
| Change active confidence level, note, or assessment date | Not allowed |
| Add external, published-summary, or otherwise unverifiable evidence | Not allowed |
| Write maintenance state or lease receipts through doctrine CLI commands | Allowed |
| Edit maintenance state or lease receipts directly | Not allowed |
| Repair deterministic formatting | Allowed after validation |
| Activate, reject, deprecate, delete, or supersede | Not allowed |
| Change statement, strength, scope, exception, or taxonomy | Propose only |
| Change an automation, plugin, setting, or another skill | Not allowed |

Every automated run must use a row- and byte-bounded input window, high-water
mark, lease receipt, and content hashes. The CLI-owned receipt snapshots all
rule hashes, active-rule authority, existing active evidence, and locked
doctrine files. The scan stores its exact cursor commit and evidence fingerprint
in that receipt; the recorder accepts only that cursor, append-only active
evidence, verified source locators, the exact canonical diff, matching counts,
and no more than five changed rules. Advance the cursor only after validation
and a successful no-change or update result.

## Privacy

- Publish short evidence summaries and anonymous context labels, not source IDs.
- Keep `maintenance/state.json`, lease receipts, and new resolvable bb locators out of public commits.
- Store short excerpts only when they add meaning.
- Never copy full transcripts, credentials, private URLs, or irrelevant paths.
- Hash new local evidence for verification; published records hash only their public summary.
- Mark missing source material unavailable rather than fabricating it.
- Permit excluded projects and threads in maintenance state.

## Validation Gates

1. Structural: schema, enums, dates, IDs, filenames, and required fields.
2. Graph: references, cycles, active tensions, supersession, and dependencies.
3. Governance: active approval, required-standard checks, and authority limits.
4. Provenance: evidence presence, hashes, minimal excerpts, and deduplication.
5. Projection: generated manifest hash matches canonical inputs and the exact
   bytes of every generated browse/search artifact.
6. Behavior: bounded retrieval, conflict, application, and near-miss tests.

If any gate fails, keep the prior operative corpus and do not advance the
maintenance cursor.
