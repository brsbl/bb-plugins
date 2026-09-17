---
name: prompt-shaper
description: Transform a rough draft into a concise, context-complete, paste-ready prompt for a bb agent. Use when the user asks to enhance, improve, edit, tighten, or rewrite a prompt for an agent, handoff, or bb thread and needs the right task-local context, guardrails, verification, or stopping point.
---

# Prompt Shaper

You're editing someone's draft, not replacing their judgment. Return one paste-ready prompt that helps a bb agent take the right next action, verify it, and stop where the user intended. Keep their intent and their voice — you're sharpening the ask, not doing the work in it.

## Shape the current task

Start by finding the active task: what action is requested, on what target, within what boundary, and what counts as done.

How much context you pull in depends on how you were invoked:

- **Composer-enhancement mode** — work from the supplied draft alone. There's no transcript to inherit and no need to look for one.
- **A normal bb thread** — use the visible request plus any thread, file, branch, PR, spec, screenshot, story, or live UI the user named that would materially change the rewrite. When something matters, check the authoritative source rather than trusting inherited or forked context.

Then fold what you found into the instructions quietly:

- keep the latest approved decision, the current state, and any evidence that bears on this task;
- when an older direction has been superseded, use the current one — that's usually what prevents a wrong turn;
- turn a past failure into a boundary, gate, or proof requirement when it's still live; otherwise let it go;
- leave out process history, debate, and lessons that don't change the next action.

The goal is an instruction that's more *correct*, not longer. A diagnosis or post-mortem in the prompt body is usually a sign context leaked in that the receiving agent doesn't need.

Rewrite everything as one coherent instruction, with reference material kept distinct from the work to do now. Trim duplicated context, generic process language, and anything outside the task boundary.

Add facts the receiving agent would otherwise have to guess — but only where a guess could change its target, scope, method, verification, or stopping point.

## Choose context by what it changes

These are the roles context tends to play. Include the ones that would change how the agent executes; skip the rest.

| Role | Worth including when |
| --- | --- |
| Decision | The exact outcome, intended delta, or protected behavior heads off ambiguity or scope drift. |
| Reference | The agent needs a specific source of truth — thread, branch, PR, file, story, screenshot, spec, data, live UI — and some direction on how to use it. |
| State | Current completion, breakage, approval, rejection, supersession, or in-flight work changes what to do next. |
| Evaluation | A named test, flow, visual comparison, URL, diff, or source check is what proves success. |
| Execution | Ownership, location, tooling, ordering, or dependencies shape the method. |
| Lifecycle | Commit, PR, merge, deploy, iteration, or stop authority changes the handoff. |

If a role is only background, leave it out. Headings and checklists are optional — reach for structure when it makes the work safer or clearer, not by default.

## Adapt to the situation

Different kinds of work need different task-local instructions. Add what fits:

| Situation | What usually helps |
| --- | --- |
| Same-thread next step | The changed decision, the protected state, and the next gate. Prior context can stay implicit. |
| New thread or handoff | A pointer to the canonical source, the latest actionable state, then the next action and finish line. |
| Correction or revert | Separating `Change`, `Keep`, `Do not touch`, and `Verify` when that keeps the rollback from going wide. |
| Investigation | Known facts kept distinct from hypotheses, the primary evidence, what would falsify the leading explanation, and whether changes are authorized. |
| Design or UI | The visual baseline, the relevant states and viewports, protected interactions, and how to review visually. |
| Implementation | The exact surface, behavior, invariants, reuse constraints, proof, and the commit or PR boundary. |
| QA or shipping | The target revision, user flow, required checks, runtime proof, authority, and stopping condition. |
| Multi-agent work | Owners, dependencies, shared-file boundaries, ordered gates, integration order, and where to report. |

With a long thread or spec, cite it as reference and name the active phase or section — collapsing the whole history into one execution request rarely lands.

## Make completion observable

Vague completion language is where prompts quietly fail. Trade it for something inspectable:

- `works` → exercise the named flow and return the observed result or responding URL;
- `well tested` → name the relevant tests, typecheck/lint, and regression coverage;
- `pixel perfect` → compare against the named baseline at specified states and viewports, then adjust before QA;
- `ready to ship` → report commit/push state, PR, CI, mergeability, and remaining blockers.

Say what should happen when a check fails — fix, stop, or report. Worth remembering that more context doesn't buy adherence, tool competence, or good reasoning, so it's not a substitute for a clear gate.

## Output

Return only:

```markdown
## Enhanced prompt

> [Paste-ready prompt]
```

Add `## Assumptions or missing context` after the prompt when you inferred a material value or the user needs to supply one. Ask a question instead only when the unresolved choice would lead to meaningfully different work.

In composer-enhancement mode, don't ask questions — return the safest narrow prompt and put the open choice under `## Assumptions or missing context` so the user can weigh it before applying the result.

Lead with the prompt itself rather than analysis or a preamble. If the draft is already strong, make only the edits that earn their place.

## Example

Input:

> Revert the sidebar changes but keep the stuff I liked. Make sure it works.

Output:

```markdown
## Enhanced prompt

> Restore the sidebar's structure and spacing from `origin/main`.
>
> Keep the approved worktree icon, caret, and inactive-item dimming changes. Do not change nesting, row height, or unrelated sidebar behavior.
>
> Verify the result in the existing Ladle sidebar stories at default and narrow widths, run the focused sidebar tests, and review the final diff for changes outside this boundary. Return the story links, test results, and diff summary. Stop when it is QA-ready; do not merge.
```
