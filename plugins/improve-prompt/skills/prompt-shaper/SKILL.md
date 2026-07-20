---
name: prompt-shaper
description: Transform a rough draft into a concise, context-complete, paste-ready prompt for a bb agent. Use when the user asks to enhance, improve, edit, tighten, or rewrite a prompt for an agent, handoff, or bb thread and needs the right task-local context, guardrails, verification, or stopping point.
---

# Prompt Shaper

Return one paste-ready prompt that lets a bb agent take the right next action, verify it, and stop at the intended boundary. Preserve the user's intent and tone. Do not perform the task in the draft.

## Shape The Current Task

1. Identify the active task: its requested action, target, boundary, and finish line.
2. Read the surrounding thread and any available linked thread, file, branch, PR, spec, screenshot, story, or live UI. Treat authoritative inherited context as input; do not make the user repeat it.
3. Resolve history into the instructions silently:
   - retain the latest approved decision, current state, and evidence that affect this task;
   - replace stale or superseded directions with the current decision when that prevents a wrong turn;
   - convert a prior failure into a specific boundary, gate, or proof requirement only when it is relevant now;
   - omit process history, debate, and lessons that do not change the next action.
4. Add only facts the receiving agent would otherwise have to guess and that could change its target, scope, method, verification, or stopping point.
5. Rewrite the result as one coherent instruction. Keep reference material separate from the work to do now.
6. Remove duplicated context, generic process language, and details outside the active task boundary.

Do not turn thread history into a diagnosis, post-mortem, or research report. Use it to make the instruction more correct, not longer.

## Include Context Selectively

Consider these roles, then include only the ones needed for the current task.

| Role | Include when it changes execution |
| --- | --- |
| Decision | The exact outcome, intended delta, or protected behavior prevents ambiguity or scope drift. |
| Reference | The agent needs an exact source of truth—thread, branch, PR, file, story, screenshot, spec, data, or live UI—and direction for how to use it. |
| State | Current completion, breakage, approval, rejection, supersession, or running work changes what to do next. |
| Evaluation | A named test, flow, visual comparison, URL, diff, or source check proves success. |
| Execution | Ownership, location, tool, ordering, or dependency constraints affect the method. |
| Lifecycle | Commit, PR, merge, deploy, iteration, or stop authority changes the handoff. |

Leave a role out when it merely adds background. Do not force headings or a checklist into the finished prompt; use structure only when it makes the work safer or clearer.

## Adapt The Prompt

| Situation | Add only the task-local instruction needed |
| --- | --- |
| Same-thread next step | State the changed decision, protected state, and next gate; keep prior context implicit. |
| New thread or handoff | Point to the canonical source, summarize the latest actionable state, then name the next action and finish line. |
| Correction or revert | Separate `Change`, `Keep`, `Do not touch`, and `Verify` when that prevents a broader rollback. |
| Investigation | Distinguish known facts from hypotheses, name the primary evidence and what would falsify the leading explanation, and state whether changes are authorized. |
| Design or UI | Name the visual baseline, relevant state and viewport, protected interaction, and visual review method. |
| Implementation | Name the exact surface, behavior, invariants, reuse constraints, proof, and commit or PR boundary. |
| QA or shipping | Name the target revision, user flow, required checks, runtime proof, authority, and stopping condition. |
| Multi-agent work | Define owners, dependencies, shared-file boundaries, ordered gates, integration order, and reporting point. |

For a long thread or spec, cite it as reference context and name the active phase or section. Do not collapse the entire history into one execution request.

## Make Completion Observable

Replace vague completion language with inspectable evidence:

- `works` → exercise the named flow and return the observed result or responding URL;
- `well tested` → name the relevant tests, typecheck/lint, and regression coverage;
- `pixel perfect` → compare the named baseline at specified states and viewports, then adjust before QA;
- `ready to ship` → report commit/push state, PR, CI, mergeability, and remaining blockers.

Require the agent to fix, stop, or report when a check fails. Do not imply that more context guarantees adherence, tool competence, or correct reasoning.

## Output

Return only:

```markdown
## Enhanced prompt

> [Paste-ready prompt]
```

Add `## Assumptions or missing context` after the prompt only when a material value was inferred or the user must supply it. Ask a question instead only when the unresolved choice would produce meaningfully different work.

When invoked in composer-enhancement mode, never ask a question. Return the safest narrow prompt and put the unresolved choice under `## Assumptions or missing context` so the user can review it before applying the result.

Do not lead with analysis, a diagnosis, or a generic checklist.

If the draft is already strong, make only edits that earn their place.

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
