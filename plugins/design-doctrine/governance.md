# Governance

How rules get made and changed.

## Where rules come from

Every learned rule comes from concrete design feedback in bb — something the
user asked for, corrected, approved, or rejected. Each rule records where it
applies, its evidence, and how sure it is. Repeated independent feedback raises
confidence.

Agent work produced while following a rule never counts as evidence for that
rule. Only feedback the user gave directly does.

## Evidence

- **One episode is not a requirement.** A rule may be `required` only with at
  least two independent supporting episodes. A rule backed by one episode is
  `default` (or weaker) at `low` confidence until more feedback arrives.
- **One piece of feedback backs one rule.** When the same feedback fits several
  rules, give its Evidence line to the most specific one and leave it out of
  the rest. Never count the same episode twice, in one rule or across rules.
- **Merges move evidence.** When rules merge, the surviving rule takes the
  evidence and `supersedes` the other, which is retired. A retired rule keeps
  its lines as history; only active rules count them.

## External standards

Some rules are seeded from cited external guidance — WCAG, platform guidelines,
and established design research — rather than learned from the user. They are
marked `origin: external`, use `kind: standard`, live in
`rules/<domain>/external/`, list their citations under `## Sources`, and carry
`supporting_episodes: 0`. They are not the user's taste: never count them as
evidence of a preference, and never cite them as "you said".

An external rule is `default` unless it encodes a normative requirement such as
WCAG 2.2 AA, which may be `required`. Only a deliberate, reviewed change adds or
edits external rules; maintenance leaves them alone.

## Updates are automatic

A rule goes `active` as soon as it's written, at whatever confidence its
evidence supports — one clearly scoped instruction is enough to start at `low`.
Nothing waits on a review step.

Maintenance may add, narrow, replace, or retire rules and append evidence. It
may move an Evidence line to the rule that owns it, but may not reword existing
evidence or change the plugin code, the skill, the evals, or this file.

## Evals

[`evals/scenarios.md`](evals/scenarios.md) holds a small set of held-out design
tasks with the rules that should apply and what a passing result looks like.
After a maintenance pass that changes rules, check that each scenario's
expected rules are still active and in scope, and report any scenario the
change affects. After a deliberate revision, run the full blind check the file
describes.

## Status

`active` is in use. `conflicted` means two of the user's explicit preferences
disagree and it's waiting on them. `retired` means replaced or no longer
supported. Retired rules stay searchable under `--all`, but they don't come
back.

## Conflicts

Prefer hard task constraints, then exceptions, then the more specific rule, then
direct feedback over inferred, then confidence. A learned rule outranks an
external `default` on matters of taste; an external `required` rule is a hard
constraint. Use recency only when the preference actually changed — retire the
old rule and point the new one at it. Never average two rules.

If that doesn't settle it, mark the rule `conflicted` and ask the user. That's
the only case that needs them.

## Rollback

Everything lands as a Git commit. Read the diff, revert what you don't want.

## Privacy

Rules carry short, anonymous evidence lines — never bb message IDs, thread IDs,
transcripts, or credentials.
