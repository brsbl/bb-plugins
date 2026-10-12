---
name: playground-product-building
description: Build playgrounds for product-building questions — rate limits, queues, retries, caches, load balancing, autoscaling, connection pools, state machines and workflows, rollouts, migrations and capacity plans. Use with the playgrounds skill whenever someone wants to see, tune, or decide how a system, API, flow or plan behaves.
---

# Product-building playgrounds

A product-building playground answers a decision about a running system: how
big, how fast, which plan, what happens when it fails. The hero is the system
**running** — requests moving, states changing, a plan unfolding over time —
driven by one small deterministic model. Every card ends in a readout that
answers the user's question ("Loss-free from 120 tokens", "Caught at 5%").

Read the `playgrounds` skill first for the frame and bridge, and
`../playground-design/SKILL.md` for type, spacing and the card budget. This
skill picks the pattern and gives you a reference to copy.

## 1. Pick the pattern

| The question is about… | Pattern | Copy |
| --- | --- | --- |
| Traffic through a system: rate limits, queues, load balancing, retries and backoff, circuit breakers, caches, autoscaling, connection pools | **Flow**: service cards joined by edges, sampled requests moving as dots, meters for tokens or queue depth, worker slots, rejected requests falling out; a time chart of the key quantity under it; a transport | `references/rate-limiter/` |
| A lifecycle or workflow: checkout, sign-up, auth, jobs, orders, approvals | **Product surface**: the real screen for the current state inside `.pg-window`, a rail of states beside it, the valid events as the screen's own buttons, external outcomes (gateway, network) as a seg, an event log | `references/checkout/` |
| A plan over time: rollouts, migrations, capacity, SLO burn, backfills | **Timeline**: stacked time charts sharing one x axis (exposure, error rate, load), threshold marks, an event marker where a gate fires, a transport scrubbing time, readouts with the verdict | `references/rollout/` |

Mix patterns only when the question needs both (a queue sim whose output is a
plan). Never draw a static boxes-and-arrows diagram: if it has arrows, things
move along them.

## 2. Model first

- Write the model as pure functions in `figure.mjs`: `normalize(state)`,
  `simulate(inputs)` or `step(state, event)`, plus the function that answers
  the question (`advise`, `verdict`). The card renders from these; agents read
  them through `expose`.
- Deterministic: fixed time step, seeded noise (`ui.rng(seed)`), integer
  requests with a fractional carry. The same inputs replay the same run.
- Precompute the run, then replay it with a transport. Scrubbing is cheap and
  every frame is true.
- Realistic numbers with units on every value (req/s, tokens, ms, h, %).
  Defaults pose the problem and are solvable: the bucket loses some requests
  and the answer says how big it must be; the release has a bug and the gate
  catches it late.
- Answer the decision by searching the model (smallest capacity with zero
  loss, earliest catch), not with a rule of thumb.

## 3. Components

All from the frame kit and `ui` (inlined by the builder):

- `flow(svg, spec)` — `meta.components: ['product-building/flow']`. Nodes
  `{ id, x, y, w, h, title, meter, slots }`, edges `{ from, to }`. Drive it
  per step: `send(from, to)` one dot per N requests (say so in the figure
  foot), `drop(at)` for rejections, `node(id).meter(f)`, `.slots(n)`,
  `.sub(text)`, `.value(text, tone)`, `.state('bad')`; call `tick(dt)` each
  frame.
- `ui.chart(svg, spec)` — line, step, area and bar series; `marks` for
  reference lines (`tone: 'bad'` for a threshold), `events` for "rolled back" style markers, `now` for the playhead.
  Charts sit inside the figure, share an x axis, and never repeat a pattern
  that stands in for data.
- `ui.loop(step)` plus `.pg-transport` (`.pg-icon-btn` play and replay with
  `ui.icons`, a range scrubber). It pauses offscreen; honor `ui.reduced` by
  opening on the answer frame without playing.
- `.pg-window` for product screens, `.pg-badge` for live status (one badge per
  scope: live state in the figure head, totals in readouts), `.pg-log` for
  events, `.pg-table` for small schedules, `.pg-readouts` for the answer.

## 4. Card recipe

Title and task subtitle → `figure.pg-fig` (Fig 1 + what it shows, live status
badge; flow or screen; charts; foot with the sampling note and the clock) →
transport → readouts (the answer first, then the two numbers that explain it)
→ controls (`.pg-row` + `.pg-seg` for scenarios, `.pg-fields` sliders for the
knobs). Width 540–560; about 700 px tall.

**First frame.** Open just before the interesting moment and play: two
seconds before the burst, the payment already declined, the rollout at the
stage where the gate fires. Never open on an idle system, an empty chart, or a
disabled main button.

## 5. Build and check

```sh
cp -R <this skill>/references/rate-limiter /absolute/workspace/my-limiter
node <this skill>/../playground-design/figure/build.mjs /absolute/workspace/my-limiter --out /absolute/workspace/my-limiter.json
```

`figure.mjs` exports `meta` (`title`, `width`, `components`) and the model;
`card.html` is the body; `live.js` wires it with `ui` and the model. The
builder inlines everything and runs the check. Publish the JSON as described in
`../playground-design/SKILL.md`, then read your first frame: is the system
visibly doing the thing the user asked about, and does a readout answer them?

Expose `set` (inputs), `read` (inputs + the answer), and the verbs of the
pattern: `play`, `pause`, `seek` for flows and timelines; `send(event)` and the
external outcome for state machines.
