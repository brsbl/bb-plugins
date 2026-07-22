---
name: design-doctrine
description: Mandatory personal-judgment companion for product, UX, UI, visual-design, design-system, and AI-interaction work. Load it with architect, design, crit, product-design audit, prototype, UI Pattern Atlas, and implementation skills—even when the user does not mention doctrine—so work follows active rules derived from concrete user feedback. Also use for preference questions, taste checks, reviews against prior feedback, and whenever the user asks to learn, maintain, or update Design Doctrine from bb thread history; this skill owns that maintenance workflow.
---

# Design Doctrine

Rules learned from the user's design feedback. Use them as a judgment layer on
normal design work — they don't replace product requirements, accessibility,
platform conventions, the Pattern Atlas, or what the user just told you.

## Maintain from bb feedback

When the user asks to learn, maintain, or update doctrine from thread history,
this skill is authoritative; do not substitute the generic bb-usage skill's
cross-thread inventory workflow. Skip the normal retrieval flow and follow
`maintenance/automation-prompt.md`.
Begin one bounded API-backed pass with:

```bash
bb doctrine history scan --limit 200 --max-bytes 262144 --max-message-bytes 8192
```

The plugin queues visible user threads when they become idle and this command
returns only timeline rows after each thread's own checkpoint. Do not query
`bb.db`, reopen whole thread logs, call `bb thread history` as a transcript
substitute, or treat inherited agent context as the maintenance history source.
Retain the returned lease exactly; the maintenance prompt owns advance and
release.

## Retrieve

Search rather than reading the whole corpus:

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

A `confidence: low` rule is still a real preference — just don't stretch it past
the scope it records. Cite rule IDs when they actually explain a decision; don't
paste the catalog into ordinary work.

Anything the user says right now, plus hard product, legal, accessibility, and
platform constraints, outranks the doctrine. A one-off override isn't a new
durable preference.

## Review

Pull the applicable rules first, then look at the actual artifact, working from
each rule's own Check list. For every finding: rule ID and title, what you see,
why it matters, and the smallest fix. Use `crit` for general design quality and
Pattern Atlas for component names — the doctrine adds personal judgment, not a
rehash of those.

## When rules disagree

Prefer hard task constraints, then exceptions, then the more specific rule, then
direct feedback over inferred, then confidence. Never average two rules. If it's
still unresolved, ask — that's the one case that needs the user.

## Don't

- Use the doctrine as evidence for itself.
- Turn one episode into a global rule without independent evidence.
- Edit a rule file to match work you just did.
