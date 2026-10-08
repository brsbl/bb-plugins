# Interactive Answers

Explore charts, calculations, illustrated guides, maps, and previews directly
in agent answers. Agents compose native controls or a custom HTML interface;
interacting updates the answer immediately without another model call.

![Savings calculator with sliders, live metrics, and a growth chart](https://github.com/user-attachments/assets/094bff99-5849-4f17-80db-521d32f6dd82)

![Bill splitter with editable inputs and a cost breakdown table](https://github.com/user-attachments/assets/2cafefe0-2246-49bf-be27-c43a21b49584)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/interactive-answers --yes
```

## Use

Ask for a calculator, scenario comparison, or interactive explanation. The
plugin gives agents an `interactive_answer` tool, a document guide, and examples.
Native documents can include number fields, sliders, choices, live metrics,
line and bar charts, tables, text, expandable explanations, and interactive
vector diagrams. Every chart also has a data table. Controls follow bb's theme
and support keyboard navigation.

For a CLI starter:

```bash
bb interactive-answers example bill > answer.json
bb interactive-answers publish --document-stdin < answer.json
bb interactive-answers example stepper | bb interactive-answers publish --answer-stdin
```

Emit the returned `::interactive-answer{id="…"}` directive on its own line in
an assistant message. `bb interactive-answers guide` prints the complete schema.

Inputs persist in the current browser, separately for each answer. Reset restores
the defaults. Inputs are never submitted to an agent and are not approvals.
Published answers are immutable; a revised answer gets a new ID. Documents are
stored in the plugin database, scoped to their thread, and removed when that
thread is deleted. Browser input copies remain in browser storage until cleared.

This is a bb implementation inspired by interactive answers, not an OpenAI
integration. It works with any bb agent that can call plugin tools. Answers
render after publication rather than token by token, and controls never take
external actions. Native documents use bounded arithmetic, never JavaScript;
division by zero and overflowing calculations display as unavailable.

## HTML answers

When an answer needs its own layout or illustration, the agent publishes HTML
with inline styles and scripts. bb renders it like an inline-vis preview: in a
sandboxed, opaque-origin frame that cannot reach bb, cookies, or the
conversation. The card sizes itself to the content, follows bb's light and
dark theme tokens and Inter type, saves its state in the browser, and opens web
links in a new tab.

`demos/` contains five complete answers recreating the interactive answers from
OpenAI's GPT-6 launch video: a youth-bike assembly guide with an exploded
schematic, a San Francisco day route on a live map with photos, a wall-color
preview, a 12-step origami fox, and a container-garden plan. The map uses
MapLibre with OpenFreeMap tiles (© OpenStreetMap contributors); photos are
Wikimedia Commons images credited in each file.

## Develop

From the repository root, install dependencies with `npm ci`. Remote CI runs
`npm run check --workspace=bb-plugin-interactive-answers`; use an isolated bb
web development app for the live publishing and interaction flow.
