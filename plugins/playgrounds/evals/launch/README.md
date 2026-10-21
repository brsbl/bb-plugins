# Launch eval

Twenty ordinary prompts: twelve everyday objects and eight developer concepts.
Keep this corpus out of the generation skills and references. The CDN wording is
from PR #503. All prompts are sent unchanged; no hidden request to use a tool,
name a skill, avoid questions, or satisfy a timer is appended.

## Run

The owner provisions a **fresh isolated dev bb**, installs Playgrounds from the
exact source path being measured, and enables the default Claude Code and Codex
providers. Use a fresh bb data directory inside the worktree, never production
data. Since the data directory is nested in a worktree, launch the isolated
server and host daemon with `GIT_CEILING_DIRECTORIES` set to its absolute data
directory. This stops Personal workspaces from discovering the outer Git checkout.
The runner verifies `workspaceProvisionType: personal` and `isGitRepo: false`
after provisioning, and aborts an invalid setup without producing a summary.
Preserve invalid setup evidence separately; never mix it with launch results.
Record the bb core revision and plugin installation command alongside the
results. Do not serve this eval from production bb.

Every setup/QA CLI command must explicitly set `BB_SERVER_URL` to the isolated
origin; bare `bb` inside an agent thread targets production. Before each write,
check `/api/v1/system/config` against the expected isolated data directory and
host ID. The runner requires `--data-dir`, records this identity in preflight,
rechecks it before every HTTP write, and refuses redirects.

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
  --data-dir /absolute/worktree/.launch/data \
  --plugin-root /absolute/path/to/plugins/playgrounds \
  --commit <exact-plugin-git-sha> --label baseline
```

Raw output defaults to `evals/launch/reports/<label>/` beside this runner. That
entire folder is gitignored: manifests, timelines, thread IDs, absolute paths,
screenshots, summaries and local adjudications stay private. Optional `--out`
must name a subdirectory of that same `reports/` folder; other paths (including
symlink escapes) are refused. Existing runs outside it must be moved there before
resuming. Never force-add raw reports. Publish only a manually reviewed aggregate
like [the gate 1 table](gate-1-summary.md), without per-run links or identifiers.
The repository privacy check also rejects private paths and real thread IDs in
tracked files, including force-added reports.

For a no-network dry run, add `--dry-run true` to the command above (use synthetic
host/data-dir values and the actual local plugin root). It validates arguments,
the output location, driver presence and prompt selection, then writes only
`dry-run.json`. It sends no prompt, produces no scores and does not validate the
server, browser or provider setup. Omit the flag for a scored run.

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
and is never given to an agent. Generic fixtures also verify live pointer,
click-only and keyboard-only surfaces, output changes while a page resizes, and
geometry inside the tested drawing, and independent `role="status"` readouts. Matching inert fixtures change only
hover/focus/color/padding; they must stay unproven.
Mixed stable/ticking readouts, selected sibling choices, and a runtime exception
with an otherwise working control are covered too. Saved-card replay scripts can
import `proofFixtures` from `fixtures.mjs`; each has `name`, `html`, `expectedPass`
and optional `liveMode`, `controlCount` (default 1), and `expectedStatus`.
Each invocation keeps its preflight evidence in a separate timestamped directory.

Each prompt creates a fresh `proj_personal` thread with a new personal environment
and no Git checkout. The request omits `model`; the actual resolved model and
provider, execution options, catalog and thread/environment response are saved.
No model or permission setting is silently forced. If the instance remembers a
non-default model for Personal, reset the **isolated instance** before measuring.

## Evidence and scoring

- Time starts immediately before the HTTP prompt send. The real thread page is
  opened in Chrome. A loaded iframe or native card must be on screen, with a
  nonblank screenshot of its exposed interior. The capture keeps the same DOM
  node, source, bounds, scroll position and layout version before and after the
  screenshot; a replaced/moved frame is retried, never replaced by a body capture.
  Surrounding thread text and host overlays cannot supply the required pixels.
  Time ends at accepted screenshot completion, an observed upper bound. The
  iframe load time is retained separately. A tool return or stored HTML alone
  never counts; loading and browser startup stay in the measurement. Generic
  preflight cases cover blank frames, delayed paint, replacement and scrolling.
  `visible-capture.json` records every attempt and rejection.
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
  early, after a fixed render grace of at most 30 seconds. The grace ends at the
  original run cap if that comes first; it never extends or subtracts from
  send-to-card latency. `agentCompletedAt`, `terminalObservedAt`,
  `renderGraceUsed`, `renderDelayMs`, and `renderGraceRetainedCard` distinguish
  agent time from delayed UI rendering. Every affected case appears in the
  console log and both summaries. Completion time comes from the timeline turn
  when available, otherwise the first observed terminal status is labeled as
  the source. A visible card with a dead control retains its measured delivery time
  and fails the control criterion.
- The bundled `scripts/drive.mjs` opens the actual served frame URL and uses real
  pointer/keyboard input. Native ranges are dragged diagonally to exercise either
  horizontal or vertical input. Native toggles, buttons and disclosure summaries
  are clicked (summary discovery does not depend on cursor styling); text/select
  controls receive keys. Custom focusable/drawing surfaces receive **separate**
  drag, click, Home, End, arrow, Space and Enter attempts. A slider role does not
  imply a working drag handler. Every attempt retains five PNGs, actions, output
  evidence and its own live/unproven status; success by one route never labels
  the other routes live. At least one route must prove the control's output. Button groups prepare a
  sibling choice before measuring the target, so selecting an already selected
  option does not hide its effect; the preparation itself supplies no proof.
- HTML is not reconstructed. Native controls are driven in the real thread UI.
  Narrow-toggle is tested at 360, 390 and 480 px. Disabled, unknown, conditionally
  ineffective and newly exposed controls remain **unproven**, never automatically
  called dead. Inventory is captured after every click, drag, key, move, scroll
  and wait. Stable DOM identities prevent reassignment when controls disappear;
  newly exposed controls remain unproven failures even if a later tab hides them.
  `controls.json` retains these intermediate inventories. Runtime exceptions still
  fail the entire card, even if a separately working control can be demonstrated.
- Each screenshot has matching bounds and content signatures for independent
  output regions: SVG figures, readouts, paragraphs, table cells and definition
  values. The scorer aligns each region at its own origin and compares its common
  extent without stretching pixels. Whole-page height changes and translations
  supply no proof; a reflowed explanation or changed figure can still be measured.
  Legacy resized screenshots without region metadata require a fresh controlled
  replay, not an inferred pass.
- A region needs **both** persistent text-token/SVG geometry changes and persistent
  pixel changes. Control values, selected state, colors, borders, focus, hover and
  class/style changes alone cannot satisfy the content check. Native control
  chrome stays masked in every frame. Actual SVG geometry inside a custom input
  surface remains observable, so masking the surface no longer hides its own
  mechanism. Content evidence alone never passes invisible or unchanged pixels.
- Three no-input and two post-input screenshots detect baseline motion. Changed
  pixels must remain changed in both post-input images, were stable beforehand,
  and exceed the region's baseline motion by 4x (at least 24 pixels). A stable
  numerical result can prove a response without being drowned out by unrelated
  animation in another region. Text tokens are compared separately so a stable
  mode label can remain eligible beside a ticking counter; that region must still
  meet the same pixel threshold. These thresholds remain deliberately conservative.
  Five finite samples cannot rule out a coincident autonomous transition that is
  stable in both sampling windows; inspect per-attempt evidence for ambiguous cases.
  Unsupported canvas-only effects, continuously changing readouts, preconditions
  such as a speed control while playback is idle, replaced output nodes, and
  controls whose only response is their own styling remain unproven. The harness
  does not invent an initial scenario or claim it has proved those controls dead.
- For drag attempts the pointer stays at each endpoint during capture: leaving
  the surface can reset a legitimate hover/drag output. The original pointer
  restoration after each screenshot is preserved. An immediate capture-induced
  reset still requires investigation; it is not excused by lower thresholds.
  Delivery timings, caps, Personal isolation, terminal render grace and original
  records are unchanged by these later control replays.

`summary.json` and `summary.md` update after each case. Per-provider percentiles
appear only after all twenty cases: median is the middle-pair mean, p90 is
nearest rank. Gate: at least 18/20 cards with all controls live, zero clarifying
questions or outstanding question reviews, median <=3 minutes, p90 <=6 minutes,
and progress on all twenty. A preflight subset is explicitly incomplete.

Completed cases are never overwritten on resume. Revision, source path, cap, render grace,
prompts and provider list must match the manifest. An interrupted in-flight case
is stopped and counted as capped; a fresh measurement needs a separate output
directory. Keep raw evidence and document any human adjudication beside the
summary; do not silently drop failures or edit the prompt corpus between rounds.

The runner stops only threads it created. Driver PIDs and actions are recorded;
its private Chrome profiles use the result directory's `.tmp` via `TMPDIR`.
On Linux a short `/proc/<runner-pid>/fd/<directory-fd>` alias avoids Chrome's
Unix socket path limit; the data remains physically inside that `.tmp` directory.
