---
name: design-doctrine
description: The user's personal design rules, learned from their bb feedback, plus cited external standards. Use for product, UX, UI, visual, design-system, and AI-interaction work, and for questions about their taste or past design feedback. The architect, design, crit, and prototype skills load it. Also owns learning, maintaining, or updating Design Doctrine from bb thread history.
---

# Design Doctrine

Rules learned from the user's design feedback. Use them as a judgment layer on
normal design work — they don't replace product requirements, accessibility,
platform conventions, or what the user just told you.

## Record a rule now

When the user states a durable design rule, record it right away with
`bb doctrine add` or `design_doctrine_add`. Do not wait for archival or hand-write
rule files. A one-off task constraint is not a durable rule.

```bash
bb doctrine add --json '<rule JSON>'
```

Use the harvest rule fields: `title`, `statement`, `kind`, `strength`, `domain`,
`products`, `activities`, `artifacts`, `surfaces`, `why`, `prefer`, `avoid`,
`use_when`, `not_when`, `exceptions`, and `checks`. For direct recording,
`evidence` is an object, not the harvest's list:

```json
{
  "thread": "@thread:thr_source",
  "quote": "The exact words the user said.",
  "summary": "A short anonymous description of that design feedback."
}
```

The CLI and agent tool supply the originating thread. Outside a thread, include
`originThreadId` in the JSON. The typed plugin RPC/SDK surface is
`experimental_addRule` in the exported `rpcContract`, with the same fields and
an explicit `originThreadId`.

The exact quote and source link stay in private plugin storage. The independent
harvest reviewer verifies the quote against a user message and checks the same
existing-rule catalog for duplicates and conflicts. Only the anonymous summary
is published. Missing quotes fail validation; unsupported quotes fail review.
A single source thread still caps strength at `default` and confidence at `low`.

The command returns a durable proposal ID immediately after queueing, not a
promise that review passed. Check `bb doctrine harvest status --thread <source-id>`
and `bb doctrine harvest activity --json` for its verdict and publication. A
repeat submission returns the existing proposal. Another distinct rule from the
same thread is allowed. Direct rule PRs use the shared validated publisher and
wait for explicit merge approval; the command never merges them. If earlier
rule PRs are open, a direct submission is published above their linear chain
and registered with GitHub's native stack. Review and ID allocation include the
pending rules, so duplicates, conflicts, and ID collisions remain checked.
Ambiguous parallel publication branches must be resolved before adding a layer.

## Maintain from bb feedback

When the user asks to learn, maintain, or update doctrine from thread history,
this skill is authoritative; do not substitute the generic bb-usage skill's
cross-thread inventory workflow. Skip the normal retrieval flow and follow
`maintenance/automation-prompt.md`.
Maintenance runs in the worktree bb provisions for it and publishes its rules
as a pull request that merges itself once required checks pass, so no checkout
has to be configured or kept clean by hand.
Begin one bounded API-backed pass with:

```bash
bb doctrine history scan --limit 400 --max-bytes 1048576 --max-message-bytes 8192
```

The plugin queues visible user threads when they become idle and this command
returns only timeline rows after each thread's own checkpoint. Do not query
`bb.db`, reopen whole thread logs, call `bb thread history` as a transcript
substitute, or treat inherited agent context as the maintenance history source.
Retain the returned lease exactly; the maintenance prompt owns advance and
release.

Archived threads are also harvested automatically. To see the rules that
harvest proposed and what became of each, run
`bb doctrine harvest activity [--limit N] [--json]`. To withdraw a rule that is
still waiting to publish, run `bb doctrine harvest cancel --proposal <id> [--json]`
with a proposal ID from the JSON feed; a published rule is retired instead.

## Retrieve

BB may provide a few rule candidates inferred from the thread title. Treat that
as a bounded shortlist, not proof that every rule applies. Check each rule's
scope against the exact current request.

For the exact task, use the native `design_doctrine_search` tool with a natural
description of the work and surface. It returns ranked active rules with their
applicability, exceptions, and checks. If the tool is unavailable, use the CLI:

```bash
bb doctrine search "<task and surface>"
bb doctrine show ddr_001
```

Each rule is a Markdown file under `rules/<domain>/`. Frontmatter carries `kind`,
`strength`, `confidence`, `status`, `domain`, and the applicability lists; the
body carries Why, Prefer, Avoid, Use when, Do not use when, Evidence, and Check.
The **Design Doctrine** panel in bb's sidebar browses the same files.

Only `status: active` rules are instructions. `conflicted` and `retired` ones are
history, and `--all` is the only way to see them.

## Apply

"Use when" and "Do not use when" decide whether a rule is in scope. An
`Exceptions` section beats the general statement. Then treat strength
consistently:

| Strength | What it means |
| --- | --- |
| `required` | Meet it, or say what's blocking. |
| `default` | Follow it unless this context gives a better reason not to. |
| `preference` | Lean toward it; stronger rules win. |
| `warning` | Check explicitly for that failure mode. |

Rules marked `external standard` (`origin: external`) are cited outside
guidance such as WCAG, not the user's preferences. Apply them on their
strength, but never present them as the user's taste.

A `confidence: low` rule is still a real preference — just don't stretch it past
the scope it records. Cite rule IDs when they actually explain a decision; don't
paste the catalog into ordinary work.

Anything the user says right now, plus hard product, legal, accessibility, and
platform constraints, outranks the doctrine. A one-off override isn't a new
durable preference.

## Review

Pull the applicable rules first, then look at the actual artifact, working from
each rule's own Check list. For every finding: rule ID and title, what you see,
why it matters, and the smallest fix. Use `crit` for general design quality —
the doctrine adds personal judgment rather than replacing the broader review.

## When rules disagree

Prefer hard task constraints, then exceptions, then the more specific rule, then
direct feedback over inferred, then confidence. Never average two rules. If it's
still unresolved, ask — that's the one case that needs the user.

## Don't

- Use the doctrine as evidence for itself.
- Turn one episode into a global rule without independent evidence.
- Edit a rule file to match work you just did.
