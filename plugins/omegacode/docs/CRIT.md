# omega plugin banner — design / architect / crit

A concise pass through three lenses (the /design, /architect, /crit skills' concerns),
applied to the composer banner. Codex workers flaked on the cross-directory context, so
this was done directly.

## Architect — does it earn its place, and is it the right primitive?
- The banner is a **read-only status mirror** of omegacode runs, scoped to one thread. That
  is the correct, minimal primitive: it reads journals (no control surface, no writes), so it
  cannot corrupt a run and has no failure mode beyond "shows nothing".
- Lifecycle is bounded by construction: backend returns only live/stalled runs; the banner
  auto-hides when idle; agent rows are capped. It cannot grow unbounded — the property that
  motivated the redesign.
- Removed the sidebar navPanel: a persistent nav entry for an ephemeral, thread-scoped status
  view was the wrong altitude. The banner alone matches the data's lifetime.

## Design — hierarchy and restraint
- One quiet line at rest: `Ω · name · phase pills · done/total · running · elapsed`. The
  workflow NAME appears once (not the filename on every row — the prior "blasted everywhere"
  problem). Run id is demoted to an expand-only footnote.
- Progressive disclosure: collapsed = glance; expanded = phase-grouped agent tree (Build /
  Verify), mirroring bb's own Claude Code workflow view.
- Color is used only as signal, never decoration: blue=running (pulse), emerald=done,
  destructive=failed/stalled, muted otherwise — all host tokens, no hardcoded values.

## Crit — what works, what was fixed, what's left
WORKS: flush top-strip integration with the prompt box (borderless, hairline divider, radius
matched to the composer); bb-native lucide chevron with a pointer cursor; live byte-growth as
the cheapest liveness signal.
FIXED THIS PASS: text-glyph caret → lucide ChevronRight/ChevronDown; added cursor-pointer;
removed the sidebar page.
OPEN / would-improve-with-more: a subtle progress bar could replace the `done/total` text for
faster scanning; the phase pills could show counts inline; verifying the flush placement across
BB's compact (drawer) composer layout.
