---
name: interactive-answers
description: Compose native interactive calculators, charts, comparisons, and explorable explanations directly in a bb answer. Use when changing inputs or exploring scenarios helps the user understand or decide.
---

# Interactive Answers

Use `interactive_answer` with `action: "guide"` for the current schema and
complete savings and bill-splitting examples. Compose a small document, then
call `action: "publish"` with `document` containing its JSON string. Copy the
returned directive exactly once onto its own line in your response.

With the CLI, read `bb interactive-answers guide`, or print a starter with
`bb interactive-answers example savings` (also `bill`). Publish a file using
`bb interactive-answers publish --document-stdin < answer.json`.

- Start with the user's question and choose useful inputs. Name units and
  assumptions. Use plain prose if interaction would not improve the answer.
- Native controls: `number`, `range`, and `select`. Supply valid bounds,
  a positive step, and a default on that step. Numeric expressions can refer
  to numeric controls and earlier calculations, never select controls.
- Blocks: `text`, `metrics`, line/bar `chart`, `table`, and expandable `details`.
  An optional `when: {control, equals}` shows a block for one control value.
- Expressions: a number, `{ref: "name"}`, or `{op, args}`. Operations are
  `add`, `subtract`, `multiply`, `divide`, `power`, `min`, `max`, and `round`.
  Round takes one operand; subtract/divide/power take two; others take 2–12.
  No JavaScript, HTML, Markdown, network requests, or code execution.
- Keep charts small, label series, and make every series match its labels.
  Tables must have one cell per column. Numeric output formats accept
  `prefix`, `suffix`, and `decimals` (0–6). Chart data is also accessible as a table.
- Show sources and consequential assumptions in accompanying prose. Do not
  imply a scenario is a prediction or that sample values are live data.
- Inputs update immediately and persist in that browser. They are not sent
  to the agent, shared across devices, or approvals to take action.
- Answers render after publication, not progressively during generation.
  Published documents are immutable; publish a fresh answer for a revision.
  Old answers retain their original content. Do not reuse another thread's ID.

Use inline visualizations for custom HTML or games beyond this component set,
and use action cards for approvals or actions that need to reach an agent.
