# Launch eval

Twenty ordinary prompts: twelve everyday objects and eight developer concepts.
Keep this corpus out of the generation skills and references. The CDN wording is
from PR #503. All prompts are sent unchanged; no hidden request to use a tool,
name a skill, avoid questions, or satisfy a timer is appended.

## Run

The owner provisions a **fresh isolated dev bb**, installs Playgrounds from the
exact source path being measured, and enables the default Claude Code and Codex
providers. Use a fresh bb data directory inside the worktree, never production
data. Record the bb core revision and plugin installation command alongside the
results. Do not serve this eval from production bb.

Launch the dev bb and this runner through `bb host-care start`. The runner is
serial and owns all driver/browser descendants; it does not bypass the resource
queue. Release the jobs when finished. `CHROME_PATH` must name an executable
Chrome/Chromium (a local wrapper is supported). Node must support WebSocket or
`--experimental-websocket`; `drive.mjs` handles the latter. `pngjs` is already a
repository development dependency; `LAUNCH_PNGJS` may point to an existing
absolute module path if the worktree has not installed dependencies.

```sh
node plugins/playgrounds/evals/launch/run.mjs \
  --url http://127.0.0.1:48992 --host <isolated-host-id> \
  --plugin-root /absolute/path/to/plugins/playgrounds \
  --commit <exact-plugin-git-sha> --label baseline \
  --out /absolute/worktree/.launch/results/baseline
```

For an archived baseline, **always pass `--commit`**: `git -C` inside an archive
could otherwise report the surrounding worktree's revision. Use a different
output directory for the prototype. `--providers claude-code,codex` is the
default. `--only bicycle-pump,cdn` runs a bounded preflight subset; omit `--only`
to resume the remaining full corpus in the same directory. `--cap-minutes 15`
is the default and maximum. Never compare different caps as one baseline.

Before sending any scored prompt, preflight checks the Personal project, plugin
presence, both providers' model catalogs, Chrome, real input dispatch, PNG diffs,
and the actual dev UI. Infrastructure failures here abort without counting
forty spurious product failures. The tiny preflight fixture is not an eval prompt
and is never given to an agent.

Each prompt creates a fresh `proj_personal` thread with a new personal environment
and no Git checkout. The request omits `model`; the actual resolved model and
provider, execution options, catalog and thread/environment response are saved.
No model or permission setting is silently forced. If the instance remembers a
non-default model for Personal, reset the **isolated instance** before measuring.

## Evidence and scoring

- Time starts immediately before the HTTP prompt send. The real thread page is
  opened in Chrome. A loaded iframe or native card must be on screen, with a
  nonblank screenshot. A tool return or stored HTML alone never counts. The
  observer polls at 150 ms; loading and browser startup stay in the measurement.
- Progress evidence contains assistant text observed in visible message columns
  before the card, matched to real timeline rows. Tool logs are not progress.
- Question evidence includes structured `user_question` interactions and assistant
  question sentences, excluding fenced code. Unclassified question marks require
  review; a rhetorical heading cannot silently be called a clarification or a
  zero-question pass. Read `timeline.json`, `interactions.json`, and `result.json`.
  Counts are conservative evidence counts, not a semantic classifier's verdict.
- A missing card, interrupted run, or capped run is a failure at the cap time,
  including an agent that finishes early without a card. `wallMs` records actual
  elapsed time separately. Idle plus an assistant response ends a no-card run
  early. A visible card with a dead control retains its measured delivery time
  and fails the control criterion.
- The bundled `scripts/drive.mjs` opens the actual served frame URL and uses real
  pointer/keyboard input. Range controls are dragged; toggles/buttons clicked;
  text/select controls receive key events. HTML is not reconstructed. Native
  controls are driven in the real thread UI. Narrow-toggle is tested at 360,
  390, and 480 px. Every exposed control must be proven, including newly exposed,
  disabled, and unsupported custom controls: unproven behavior fails with a reason.
- Three no-input and two post-input screenshots are retained per control. The
  diff masks control/label regions, ignores pixels already moving before input,
  requires persistent output change, and requires changed output to exceed the
  measured ambient movement by 4x. A changed checkbox or thumb alone cannot pass.
  This is deliberately conservative: purely animated responses and controls whose
  only legitimate output is their own appearance require investigation, not an
  automatic pass. PNG dimension changes are also unproven, never assumed live.

`summary.json` and `summary.md` update after each case. Per-provider percentiles
appear only after all twenty cases: median is the middle-pair mean, p90 is
nearest rank. Gate: at least 18/20 cards with all controls live, zero clarifying
questions or outstanding question reviews, median <=3 minutes, p90 <=6 minutes,
and progress on all twenty. A preflight subset is explicitly incomplete.

Completed cases are never overwritten on resume. Revision, source path, cap,
prompts and provider list must match the manifest. An interrupted in-flight case
is stopped and counted as capped; a fresh measurement needs a separate output
directory. Keep raw evidence and document any human adjudication beside the
summary; do not silently drop failures or edit the prompt corpus between rounds.

The runner stops only threads it created. Driver PIDs and actions are recorded;
its private Chrome profiles use the result directory's `.tmp` via `TMPDIR`.
