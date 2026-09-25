# Governance

How rules get made and changed.

## Where rules come from

Every rule comes from concrete design feedback in bb — something the user asked
for, corrected, approved, or rejected. Each rule records where it applies, its
evidence, and how sure it is. Repeated independent feedback raises confidence.

Agent work produced while following a rule never counts as evidence for that
rule. Only feedback the user gave directly does.

## Updates are automatic

A rule goes `active` as soon as it's written, at whatever confidence its
evidence supports — one clearly scoped instruction is enough to start at `low`.
Nothing waits on a review step.

Maintenance may add, narrow, replace, or retire rules and append evidence. It
may not rewrite existing evidence, or change the plugin code, the skill, or this
file.

## Status

`active` is in use. `conflicted` means two of the user's explicit preferences
disagree and it's waiting on them. `retired` means replaced or no longer
supported. Retired rules stay searchable under `--all`, but they don't come
back.

## Conflicts

Prefer hard task constraints, then exceptions, then the more specific rule, then
direct feedback over inferred, then confidence. Use recency only when the
preference actually changed — retire the old rule and point the new one at it.
Never average two rules.

If that doesn't settle it, mark the rule `conflicted` and ask the user. That's
the only case that needs them.

## Rollback

Everything lands as a Git commit. Read the diff, revert what you don't want.

## Privacy

Rules carry short, anonymous evidence lines — never bb message IDs, thread IDs,
transcripts, or credentials.
