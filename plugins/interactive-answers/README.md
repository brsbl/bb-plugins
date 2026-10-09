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

Inputs are saved with each answer on the bb server, so they follow you across
devices and every open copy updates live. Reset restores the defaults. Inputs
are context the agent can read, never approvals. Published answers are
immutable; a revised answer gets a new ID. Answers, their state, and their
event logs are stored in the plugin database, scoped to their thread, and
removed when that thread is deleted.

## Agents can use answers too

An agent can read and drive an answer it published, the way a person would:

```sh
bb interactive-answers state <id>                  # current state
bb interactive-answers watch <id> --since 0 --wait 20  # what changed, as JSON lines
bb interactive-answers actions <id>                # open copies and their actions
bb interactive-answers do <id> set --args '{"people": 6}'
```

Native calculators expose `set` and `reset`. HTML answers expose their own
actions with `window.answer.expose()`, such as `play` on a synth. An answer can
also hand something to the agent on purpose: `window.answer.send()` attaches it
to your next message as a pill, such as a phrase you recorded on the synth. Commands run
in the copy you used most recently, and the card shows "Agent · <action>" each
time the agent acts.

This is a bb implementation inspired by interactive answers, not an OpenAI
integration. It works with any bb agent that can call plugin tools. Answers
render after publication rather than token by token, and controls never take
external actions. Native documents use bounded arithmetic, never JavaScript;
division by zero and overflowing calculations display as unavailable.

## HTML answers

When an answer needs its own layout or illustration, the agent publishes HTML
with inline styles and scripts. bb renders it like an inline-vis preview: in a
sandboxed, opaque-origin frame that cannot reach bb, cookies, or the
conversation. Like inline-vis, its scripts can load remote content and use the
network, so agents are told never to send user input anywhere else. The card sizes itself to the content, follows bb's light and
dark theme tokens and Inter type, syncs its state through bb, and opens web
links in a new tab.

## Develop

From the repository root, install dependencies with `npm ci`. Remote CI runs
`npm run check --workspace=bb-plugin-interactive-answers`; use an isolated bb
web development app for the live publishing and interaction flow.
