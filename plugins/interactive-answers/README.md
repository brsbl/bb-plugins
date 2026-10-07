# Interactive Answers

Explore charts, calculations, and explanations directly in agent answers.
Agents compose native controls and content; changing an input updates the
answer immediately without another model call.

![Savings calculator with sliders, live metrics, and a growth chart](https://github.com/user-attachments/assets/094bff99-5849-4f17-80db-521d32f6dd82)

![Bill splitter with editable inputs and a cost breakdown table](https://github.com/user-attachments/assets/2cafefe0-2246-49bf-be27-c43a21b49584)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/interactive-answers --yes
```

## Use

Ask for a calculator, scenario comparison, or interactive explanation. The
plugin gives agents an `interactive_answer` tool, a document guide, and examples.
Answers can include number fields, sliders, choices, live metrics, line and bar
charts, tables, text, expandable explanations, and interactive vector diagrams. Every chart also has a data
table. Controls follow bb's theme and support keyboard navigation.

For a CLI starter:

```bash
bb interactive-answers example bill > answer.json
bb interactive-answers publish --document-stdin < answer.json
```

Emit the returned `::interactive-answer{id="…"}` directive on its own line in
an assistant message. `bb interactive-answers guide` prints the complete schema.

Inputs persist in the current browser, separately for each answer. Reset restores
the defaults. Inputs are never submitted to an agent and are not approvals.
Published answers are immutable; a revised answer gets a new ID. Documents are
stored in the plugin database, scoped to their thread, and removed when that
thread is deleted. Browser input copies remain in browser storage until cleared.

This is a bb implementation inspired by interactive answers, not an OpenAI
integration. It works with any bb agent that can call plugin tools. It renders
after publication; token-by-token streaming, live map services, arbitrary HTML, games, and
external actions are outside this version. Expressions use bounded arithmetic
operations, never JavaScript evaluation. Division by zero and overflowing
calculations display as unavailable.

## Visual examples

`bb interactive-answers example <name>` prints a complete publishable document:

- `bike`: separate and rotate a bicycle wheel.
- `city`: choose a neighborhood on an illustrated San Francisco map.
- `room`: compare six wall palettes and daylight.
- `origami`: explore four schematic paper-folding stages.
- `garden`: change the planting plan and illustrative growth timeline.

These use the same bounded diagram primitives available to agents, with
keyboard-accessible selections and reduced-motion support. They are illustrative
recreations of the launch video's scenarios, not copies of its assets or live data.

## Develop

From the repository root, install dependencies with `npm ci`. Remote CI runs
`npm run check --workspace=bb-plugin-interactive-answers`; use an isolated bb
web development app for the live publishing and interaction flow.
