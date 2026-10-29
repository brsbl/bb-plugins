---
name: how-it-works
description: "Explain how a system, mechanism, protocol, pipeline or piece of architecture works by building a working figure of it the person can operate in bb: the parts drawn as a real machine, moved by one model, with inputs they can change. Use whenever someone asks how something works, wants it explained to them or their team, or wants to see what happens when part of it fails or is under load, even if they never ask for a figure. Publish the figure with Playgrounds. Based on Anatomy by Ryan (@wheresryan22)."
---

# Anatomy

Anatomy is by Ryan ([@wheresryan22](https://github.com/wheresryan22)), MIT
licensed (see `LICENSE`): [skills.wheresryan.sh/anatomy](https://skills.wheresryan.sh/anatomy).
This copy ships with the bb Playgrounds plugin, adapted from upstream commit
`dbf697a527bbf7d358668e1557cb1e35ff725d46`. The bb adaptation changes the name and
description, publication and workspace instructions, and the default workflow
to a quick figure; it retains the fuller Anatomy workflow for deeper requests.
Prebuilt example pages are omitted; each example's `build.mjs` writes them again.
Credit Ryan and Anatomy whenever you show a figure.

## Choose the mode

For an ordinary “how does this work?” or “explain this to my team” request, use
**quick figure** below. A complicated topic alone does not change the mode.
For an explicit “go deeper”, full Figure, Hero or Epic request, read
[references/full-mode.md](references/full-mode.md) and follow that workflow.
Do not load the full-mode reference for a quick figure.

## Quick figure

Make one mechanism the person can operate, in about **3 minutes**. This is a
working explanation, with no minimum detail count and **at most 40 parts**.
Use SVG, inline CSS and JavaScript; no canvas, WebGL, 3D runtime or audit pass.

1. **Show progress before tools.** Say which mechanism you will make interactive.
   Never ask a clarifying question: choose an ordinary case, state any necessary
   assumption, and proceed. Give another factual update after a minute if needed.
2. **Choose and build in one short pass.** Spend about 30 seconds choosing the
   mechanism and starter, then write the working page. Aim for 8–16 essential
   parts, one or two useful inputs, and one readout from the same model. Give
   the parts volume and visible contacts; omit decorative hardware. Choose a
   fixed view that exposes the action, rather than comparing camera angles.
   Verify uncertain facts when needed; label simplifying assumptions.
3. **Use thread storage, including in Personal threads.** Create a fresh copy:
   `figure_dir=$(mktemp -d "$BB_THREAD_STORAGE/figure-XXXXXX")`, then
   `cp -R <this skill folder>/. "$figure_dir/"`. Build and edit the copy, never
   the installed skill. No checkout or Git command is needed.
   Reuse the nearest bundled example if its mechanism/control fits:
   `examples/dial-indicator/build.mjs` is the smallest SVG example (drag/keys,
   readout and moving parts); `examples/desk-computer/build.mjs` has typing and
   on/off state. Read only the useful source, not every example. If neither
   fits, write a small SVG mechanism directly or use `kit/iso-kit.mjs` with
   `pageHtml`/`plateHtml`; consult `references/kit.md` only for an API you need.
   Examples ship as sources: run `node examples/<name>/build.mjs` before opening
   their generated page. The other examples and craft instructions are listed
   in the full-mode reference for deeper requests.
4. **Bind the controls once.** Use the parameter contract below. Every exposed
   input must change the mechanism or an explanatory readout. Keep native input
   keyboard behavior. Reduced motion must still draw each new state immediately:
   disabling animation must not disable Next, Reset, Replay or other actions.
5. **Publish, then check the actual card once.** Publish the standalone page with
   `bb playgrounds publish --playground-file /absolute/path/figure.html`.
   Before emitting the returned directive, use `scripts/drive.mjs` on the actual
   frame at `$BB_SERVER_URL/api/v1/plugins/playgrounds/http/frame?thread=$BB_THREAD_ID&id=<id from directive>`.
   Check at 390 px, operate every exposed input with real click/drag/key actions,
   and compare before/after screenshots. The published bridge normalizes inputs;
   a local file preview without it does not prove the card's controls work.
   Fix broken controls or unreadable content and republish only if needed. Skip
   geometry audits, line checks, 4× sweeps, alternate cameras and decorative
   revisions. Once the mechanism and controls work, emit the final directive
   and one concise takeaway with Ryan/Anatomy credit. If over target, say so
   honestly; do not keep polishing before showing the working explanation.

## Parameters for a quick figure

The published frame supplies `window.playground`. Declare each input before
using it, then let both UI events and agent commands update the same model:

```js
const P = playground.params;
P.define("position", {type: "number", min: 0, max: 100, step: 1, default: 0});
P.define("mode", {type: "select", options: [
  {value: "free", label: "Free"}, {value: "loaded", label: "Loaded"}
], default: "free"});
P.define("enabled", {type: "toggle", default: true});
const input = document.querySelector("#position");
input.min = P.spec("position").min; input.max = P.spec("position").max;
input.step = P.spec("position").step;
input.addEventListener("input", () => P.set("position", Number(input.value)));
function render() {
  const {position, mode, enabled} = P.all();
  input.value = position;
  // Draw the mechanism and its readout from these values.
}
P.on(render); render();
```

- Numeric inputs default to **0..1** unless explicit `min`/`max` are supplied.
  Match every slider and step sequence's complete intended range; use `step: 1`
  for an index. Read the shared value after setting it rather than keeping a
  separate unbounded index.
- Choices use `options: [{value, label}, ...]` with a default matching a value.
  Bare string/number options also work. Free text uses `type: "text"`; a boolean
  uses `type: "toggle"` (`string`/`boolean` are accepted aliases).
- `P.set(name, value)` and `P.set({name: value})` both work. `P.get(name)` reads
  a value; `P.on(render)` redraws on changes, including `setParams` from bb.
  Keep parameter declarations and bounds beside the HTML controls to avoid drift.
- Test choices beyond the first two, both range endpoints, and a complete
  advance/reset cycle when exposed. Confirm the figure or explanatory text
  changes, not just a button's color or selected value.

The card's `read` and `setParams` actions let the person and agent operate the
same model. Use the Playgrounds skill only for another API or form you need;
this quick path does not require reading its unrelated component sets.
