// The Playgrounds component kit, for apps a person uses together with the agent.
// Base library, for any app:
//   0 tokens · 1 primitives and behaviors ·
//   2 controls bound to named parameters (field, select, segmented, slider, dial,
//     stepper, toggle, tabs, list, picker, board) and outputs (readouts, table,
//     chart, meter, badge) ·
//   3 patterns (form, banks, presets, toolbar, agent lane, conditional panels).
// Optional sets on top: music (keyboard, pads, step sequencer, scope, record/send).
// Whole apps are built from these in the skill's references, not here.
//
// Controls are declared in markup (`<div data-pg="dial" data-param="cutoff" …>`).
// Each parameter lives in shared state under `params`, is readable and settable by
// the agent through the `getParams` and `setParams` actions, and shows when the
// agent moves it.

export const CONTROLS_CSS = String.raw`
:root {
  --pg-edge: inset 0 0 0 1px var(--pg-hairline);
  --pg-edge-control: inset 0 0 0 1px var(--pg-rule);
  --pg-radius-panel: 14px; --pg-radius-group: 10px; --pg-radius-control: 8px;
}

.pg-surface { padding: 16px; border-radius: var(--pg-radius-panel); background: var(--pg-stage); }
.pg-group { min-width: 0; padding: 10px 8px 10px; border-radius: var(--pg-radius-group); background: var(--card); box-shadow: var(--pg-edge); }
.pg-label { margin: 0; font-size: var(--pg-text-label); line-height: 1.3; font-weight: 500; color: var(--pg-meta); }
.pg-group > .pg-label { margin: 0 0 8px 4px; }
.pg-value { font-size: var(--pg-text-axis); line-height: 1.3; color: var(--pg-meta); font-variant-numeric: tabular-nums; }
.pg-icon { width: 16px; height: 10px; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linejoin: round; stroke-linecap: round; }
.pg-glyph { width: 14px; height: 14px; fill: currentColor; }
.pg-icon-btn { display: inline-grid; place-items: center; width: 32px; height: 32px; padding: 0; border-radius: 50%; border: 1px solid var(--pg-rule); background: var(--card); color: var(--pg-ink); transition: background var(--pg-fast); }
.pg-icon-btn:hover { background: var(--pg-hover); }
.pg-icon-btn[aria-pressed=true], .pg-icon-btn[data-primary] { background: var(--pg-ink); border-color: var(--pg-ink); color: var(--card); }
.pg-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--pg-bad); }
[data-live] > .pg-dot, .pg-dot[data-live] { animation: pg-blink 1s ease-in-out infinite alternate; }
@keyframes pg-blink { to { opacity: .3; } }

[data-pg] { --pg-c: var(--pg-accent); }
[data-pg][data-agent] { --pg-c: var(--pg-accent); }
[data-pg][data-agent]::after { content: "Agent"; position: absolute; top: -7px; left: 50%; transform: translateX(-50%); padding: 0 6px; border-radius: 999px; background: var(--pg-ink); color: var(--card); font-size: 10px; line-height: 14px; font-weight: 500; pointer-events: none; }

.pg-dial { position: relative; display: grid; justify-items: center; gap: 2px; min-width: 48px; outline: none; touch-action: none; cursor: ns-resize; user-select: none; -webkit-user-select: none; }
.pg-dial svg { width: 40px; height: 40px; overflow: visible; transition: transform var(--pg-fast); }
.pg-dial.pg-grab svg { transform: scale(1.06); }
.pg-dial .pg-track { fill: none; stroke: var(--pg-hairline); stroke-width: 3.2; stroke-linecap: round; }
.pg-dial .pg-arc { fill: none; stroke: var(--pg-c); stroke-width: 3.2; stroke-linecap: round; }
.pg-dial .pg-cap { fill: var(--card); stroke: var(--pg-rule); }
.pg-dial.pg-grab .pg-cap, .pg-dial[data-agent] .pg-cap { stroke: var(--pg-c); }
.pg-dial .pg-pointer { stroke: var(--pg-ink); stroke-width: 2; stroke-linecap: round; }
.pg-dial .pg-name { margin-top: 2px; font-size: var(--pg-text-label); font-weight: 500; color: var(--pg-ink); white-space: nowrap; }
.pg-dial .pg-value { min-height: 14px; }
.pg-dial.pg-grab .pg-value { color: var(--pg-ink); font-weight: 500; }
.pg-dial:focus-visible svg { outline: 2px solid var(--ring); outline-offset: 2px; border-radius: 50%; }

.pg-fader, .pg-slider { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 4px 10px; align-items: baseline; font-size: var(--pg-text-label); line-height: 1.3; font-weight: 500; color: var(--pg-ink); }
:is(.pg-slider, .pg-fader) output { font-weight: 400; color: var(--pg-body); font-variant-numeric: tabular-nums; white-space: nowrap; }
:is(.pg-slider, .pg-fader, .pg-run) input[type=range] { --pg-track: var(--pg-chart-grid); --pg-track-fill: var(--pg-chart-mark); --pg-thumb-edge: 0 0 0 2px var(--card), 0 1px 2px 2px color-mix(in oklab, var(--foreground) 14%, transparent); grid-column: 1 / -1; width: 100%; height: 24px; margin: 0; background: transparent; cursor: pointer; -webkit-appearance: none; appearance: none; }
:is(.pg-slider, .pg-fader, .pg-run) input[type=range]::-webkit-slider-runnable-track { height: 3px; border-radius: 2px; background: linear-gradient(to right, var(--pg-track-fill) var(--pg-fill, 0%), var(--pg-track) var(--pg-fill, 0%)); }
:is(.pg-slider, .pg-fader, .pg-run) input[type=range]::-moz-range-track { height: 3px; border-radius: 2px; background: var(--pg-track); }
:is(.pg-slider, .pg-fader, .pg-run) input[type=range]::-moz-range-progress { height: 3px; border-radius: 2px; background: var(--pg-track-fill); }
:is(.pg-slider, .pg-fader, .pg-run) input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 13px; height: 13px; margin-top: -5px; border: 0; border-radius: 50%; background: var(--pg-ink); box-shadow: var(--pg-thumb-edge); transition: transform var(--pg-fast), box-shadow var(--pg-fast); }
:is(.pg-slider, .pg-fader, .pg-run) input[type=range]::-moz-range-thumb { width: 13px; height: 13px; border: 0; border-radius: 50%; background: var(--pg-ink); box-shadow: var(--pg-thumb-edge); transition: transform var(--pg-fast), box-shadow var(--pg-fast); }
:is(.pg-slider, .pg-fader, .pg-run) input[type=range]:hover::-webkit-slider-thumb { transform: scale(1.15); }
:is(.pg-slider, .pg-fader, .pg-run) input[type=range]:hover::-moz-range-thumb { transform: scale(1.15); }
:is(.pg-slider, .pg-fader, .pg-run) input[type=range]:active::-webkit-slider-thumb { transform: scale(1.25); }
:is(.pg-slider, .pg-fader, .pg-run) input[type=range]:active::-moz-range-thumb { transform: scale(1.25); }
:is(.pg-slider, .pg-fader, .pg-run) input[type=range]:focus-visible { outline: none; --pg-thumb-edge: 0 0 0 2px var(--card), 0 0 0 4px var(--ring); }
.pg-stepper { position: relative; display: inline-flex; align-items: center; gap: 2px; padding: 2px; border-radius: 999px; box-shadow: var(--pg-edge-control); background: var(--card); }
.pg-stepper button { width: 28px; height: 28px; border: 0; border-radius: 50%; background: transparent; color: var(--pg-ink); }
.pg-stepper button:hover { background: var(--pg-hover); }
.pg-stepper output { min-width: 3.5em; text-align: center; font-size: var(--pg-text-label); font-weight: 500; font-variant-numeric: tabular-nums; }
.pg-picker { position: relative; display: grid; justify-items: center; gap: 4px; }
.pg-picker > [role=group] { display: grid; grid-template-columns: repeat(var(--pg-picker-cols, 2), 26px); gap: 2px; padding: 2px; border-radius: 9px; box-shadow: var(--pg-edge-control); background: var(--card); }
.pg-picker button { display: grid; place-items: center; width: 26px; height: 24px; padding: 0; border: 0; border-radius: 7px; background: transparent; color: var(--pg-ink); }
.pg-picker button:hover:not([aria-pressed=true]) { background: var(--pg-hover); }
.pg-picker button[aria-pressed=true] { background: var(--pg-ink); color: var(--card); }
.pg-picker > .pg-value { font-size: var(--pg-text-axis); }
[data-pg=toggle].pg-toggle { position: relative; min-width: 0; max-width: 100%; height: auto; align-self: start; white-space: normal; overflow-wrap: anywhere; text-align: center; border-radius: var(--pg-radius-control); }
.pg-toggle:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
.pg-pad { position: relative; display: grid; place-items: center; min-height: 44px; padding: 6px; border-radius: var(--pg-radius-control); border: 0; background: var(--card); box-shadow: var(--pg-edge-control), inset 0 -3px 0 var(--pg-hairline); color: var(--pg-ink); font-size: var(--pg-text-label); font-weight: 500; touch-action: none; user-select: none; -webkit-user-select: none; transition: transform var(--pg-fast), background var(--pg-fast); }
.pg-pad.pg-on { background: color-mix(in oklab, var(--pg-c) 22%, var(--card)); transform: scale(.98); }
.pg-pad small { display: block; font-size: var(--pg-text-axis); font-weight: 400; color: var(--pg-meta); }
.pg-meter { position: relative; height: 6px; border-radius: 3px; background: var(--pg-hairline); overflow: hidden; }
.pg-meter > i { position: absolute; inset: 0 auto 0 0; width: var(--v, 0%); background: var(--pg-c); transition: width var(--pg-fast) linear; }
.pg-scope { position: relative; height: 84px; border-radius: var(--pg-radius-group); background: var(--card); box-shadow: var(--pg-edge); overflow: hidden; }
.pg-scope canvas { display: block; width: 100%; height: 100%; }
.pg-scope > .pg-label { position: absolute; left: 12px; top: 9px; }
.pg-scope > output { position: absolute; right: 12px; top: 8px; font-size: var(--pg-text-label); font-weight: 500; color: var(--pg-ink); font-variant-numeric: tabular-nums; }
.pg-record[aria-pressed=true] { border-color: var(--pg-bad); color: var(--pg-bad); }
[data-pg="send"]:disabled { display: none; }
.pg-record[aria-pressed=true] .pg-dot { animation: pg-blink 1s ease-in-out infinite alternate; }

/* Block rhythm and disclosures, only in cards built with the kit (so older cards don't shift). */
:where(body:has([data-pg]) > * + *) { margin-top: var(--pg-space-4); }
:where(body:has([data-pg]) .pg-title + .pg-subtitle) { margin-top: var(--pg-space-1); }
:where(body:has([data-pg]) :is(.pg-title, .pg-subtitle) + .pg-sentence) { margin-top: var(--pg-space-3); }
:where(body:has([data-pg]) .pg-surface + [data-pg=run]) { margin-top: var(--pg-space-2); }
:where(body:has([data-pg]) [data-pg=tabs] + .pg-surface) { margin-top: var(--pg-space-2); }
:where(body:has([data-pg])) { container-type: inline-size; }
:where(body:has([data-pg]) > :is(details, [data-pg=agent], .pg-foot)) { margin-top: 20px; }
/* Footer row: a disclosure on the left, the agent's last move on the right. */
.pg-foot { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; column-gap: 12px; padding-top: 2px; border-top: 1px solid var(--pg-hairline); }
.pg-foot > details { border-top: 0; }
.pg-foot > details[open] { grid-column: 1 / -1; }
.pg-foot > .pg-agent { justify-self: end; padding: 10px 0; background: none; text-align: right; }
.pg-foot > .pg-agent { max-height: calc(2.9em + 16px); overflow: hidden; }
.pg-foot > .pg-agent:only-child { grid-column: 1 / -1; justify-self: start; text-align: left; }
@container (max-width: 460px) { .pg-foot { grid-template-columns: minmax(0, 1fr); } .pg-foot > .pg-agent { justify-self: start; padding-top: 0; text-align: left; } }
:where(body:has([data-pg]) > details + details) { margin-top: 0; }
:where(body:has([data-pg]) details) { border-top: 1px solid var(--pg-hairline); }
:where(body:has([data-pg]) summary) { display: flex; align-items: center; gap: 8px; min-height: 24px; padding: 10px 0; list-style: none; font-size: var(--pg-text-label); font-weight: 500; color: var(--pg-body); cursor: pointer; }
:where(body:has([data-pg]) summary:hover) { color: var(--pg-ink); }
:where(body:has([data-pg]) summary)::-webkit-details-marker { display: none; }
:where(body:has([data-pg]) summary)::before { content: ""; width: 5px; height: 5px; border: solid var(--pg-meta); border-width: 0 1.5px 1.5px 0; transform: rotate(-45deg); transition: transform .15s; }
:where(body:has([data-pg]) details[open] > summary)::before { transform: rotate(45deg); }
:where(body:has([data-pg]) details > :not(summary)) { margin: 0 0 12px; font-size: var(--pg-text-body); line-height: 1.5; color: var(--pg-body); }
.pg-form { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px 20px; }
.pg-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.pg-toolbar > .pg-spacer { flex: 1; }
.pg-field { position: relative; display: grid; gap: 6px; min-width: 0; font-size: var(--pg-text-label); line-height: 1.3; font-weight: 500; color: var(--pg-ink); }
.pg-field > .pg-seg, .pg-field > .pg-tabs { justify-self: start; }
.pg-box { position: relative; display: flex; align-items: center; gap: 6px; min-height: 32px; padding: 0 10px; border-radius: var(--pg-radius-control); background: var(--card); box-shadow: var(--pg-edge-control); }
.pg-box:focus-within { outline: 2px solid var(--ring); outline-offset: 1px; }
.pg-box input, .pg-box select { flex: 1; min-width: 0; height: 30px; padding: 0; border: 0; background: none; outline: none; font-size: var(--pg-text-body); font-weight: 400; color: var(--pg-ink); font-variant-numeric: tabular-nums; -webkit-appearance: none; appearance: none; }
.pg-box select { padding-right: 14px; cursor: pointer; }
.pg-box.pg-menu::after { content: ""; position: absolute; right: 11px; top: 50%; width: 5px; height: 5px; margin-top: -4px; border: solid var(--pg-meta); border-width: 0 1.5px 1.5px 0; transform: rotate(45deg); pointer-events: none; }
.pg-unit { flex-shrink: 0; white-space: nowrap; font-size: var(--pg-text-label); font-weight: 400; color: var(--pg-meta); }
/* The body lets words break anywhere; control labels wrap between words instead. */
:is(.pg-field, .pg-slider, .pg-fader) > span:first-child { overflow-wrap: break-word; }
.pg-field > small { font-size: var(--pg-text-axis); font-weight: 400; color: var(--pg-meta); }
.pg-tabs { position: relative; display: flex; flex-wrap: wrap; gap: 2px; padding: 2px; border-radius: 999px; background: var(--pg-stage); box-shadow: inset 0 0 0 1px var(--pg-hairline); width: max-content; max-width: 100%; }
.pg-tabs button { min-height: 28px; padding: 4px 12px; border: 0; border-radius: 999px; background: transparent; font-size: var(--pg-text-label); font-weight: 500; color: var(--pg-body); white-space: nowrap; max-width: 100%; overflow: hidden; text-overflow: ellipsis; transition: background var(--pg-base), color var(--pg-base); }
.pg-tabs button:hover:not([aria-selected=true]) { background: var(--pg-hover); color: var(--pg-ink); }
.pg-tabs button[aria-selected=true] { background: var(--pg-ink); color: var(--card); }
.pg-list { position: relative; display: grid; gap: 4px; }
.pg-list button { display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%; min-height: 36px; padding: 8px 12px; border: 0; border-radius: var(--pg-radius-control); background: var(--card); box-shadow: var(--pg-edge); text-align: left; font-size: var(--pg-text-body); color: var(--pg-ink); }
.pg-list button:hover { background: var(--pg-hover); }
.pg-list button small { font-size: var(--pg-text-meta); color: var(--pg-meta); }
.pg-list button[aria-pressed=true] { box-shadow: inset 0 0 0 1.5px var(--pg-ink); font-weight: 500; }
.pg-readouts { display: grid; grid-template-columns: repeat(auto-fit, minmax(96px, 1fr)); gap: 0; margin: 0; }
.pg-readouts > div { min-width: 0; padding: 0 12px; border-left: 1px solid var(--pg-hairline); }
.pg-readouts > div:first-child { padding-left: 0; border-left: 0; }
.pg-readouts dt { font-size: var(--pg-text-label); line-height: 1.35; font-weight: 500; color: var(--pg-meta); }
.pg-readouts dd { margin: 4px 0 0; font-size: 16px; line-height: 1.25; font-weight: 600; color: var(--pg-ink); }
.pg-readouts dd small { display: block; margin-top: 2px; font-size: var(--pg-text-meta); font-weight: 400; color: var(--pg-meta); }
.pg-readouts > [data-answer] dd { font-size: 24px; letter-spacing: -.015em; }
.pg-readouts > [data-answer][data-tone=bad] dd { color: var(--pg-bad); }
.pg-readouts > [data-answer][data-tone=warn] dd { color: var(--pg-warn); }
.pg-badge { display: inline-flex; align-items: center; gap: 4px; padding: 1px 8px; border-radius: 999px; border: 1px solid var(--pg-hairline); background: var(--card); font-size: var(--pg-text-axis); line-height: 1.5; font-weight: 500; white-space: nowrap; color: var(--pg-ink); }
.pg-badge[data-tone]:not([data-tone=""]) { border-color: transparent; }
.pg-badge[data-tone=good] { color: var(--pg-good); background: color-mix(in oklab, var(--pg-good) 12%, transparent); }
.pg-badge[data-tone=bad] { color: var(--pg-bad); background: color-mix(in oklab, var(--pg-bad) 12%, transparent); }
.pg-badge[data-tone=warn] { color: var(--pg-warn); background: color-mix(in oklab, var(--pg-warn) 14%, transparent); }
[data-pg=table] { max-width: 100%; overflow-x: auto; }
.pg-table :is(th, td) { overflow-wrap: normal; }
.pg-table [data-num] { white-space: nowrap; }
.pg-table { width: 100%; border-collapse: collapse; font-size: var(--pg-text-body); font-variant-numeric: tabular-nums; }
.pg-table th { padding: 0 8px 6px; text-align: left; font-size: var(--pg-text-label); font-weight: 500; color: var(--pg-meta); }
.pg-table td { padding: 8px; border-top: 1px solid var(--pg-hairline); color: var(--pg-ink); }
.pg-table th:first-child, .pg-table td:first-child { padding-left: 0; }
.pg-table [data-num] { text-align: right; }
.pg-table tr[aria-current] td { font-weight: 600; }
.pg-board { position: relative; display: grid; grid-template-columns: repeat(var(--pg-board-cols, 3), minmax(0, 1fr)); gap: 6px; padding: 8px; border-radius: var(--pg-radius-panel); background: var(--pg-board, var(--pg-stage)); }
.pg-board button { position: relative; display: grid; place-items: center; aspect-ratio: 1; min-width: 0; padding: 0; border: 0; border-radius: var(--pg-cell-radius, 8px); background: var(--pg-cell, var(--card)); box-shadow: var(--pg-cell-edge, var(--pg-edge)); font-size: 18px; font-weight: 600; color: var(--pg-ink); cursor: pointer; transition: background var(--pg-fast); }
.pg-board button:not(:has(> *)):hover { background: var(--pg-cell-hover, color-mix(in oklch, var(--foreground) 6%, var(--pg-cell, var(--card)))); }
.pg-board[data-shape=round] { --pg-cell-radius: 50%; }
.pg-board button > i { position: absolute; inset: 10%; border-radius: inherit; background: var(--piece); box-shadow: inset 0 -3px 0 color-mix(in oklab, var(--foreground) 14%, transparent); animation: pg-drop .28s var(--pg-ease, ease-out) both; }
.pg-board button > b { position: relative; }
.pg-board button > i + b { font-size: 16px; color: var(--card); }
.pg-board button[data-last] { outline: 2px solid var(--pg-ink); outline-offset: -2px; }
@keyframes pg-drop { from { transform: translateY(-40%); opacity: 0; } }
.pg-agent { display: grid; grid-template-columns: 6px minmax(0, 1fr); gap: 2px 10px; align-items: start; padding: 8px 12px; border-radius: var(--pg-radius-group); background: var(--pg-stage); font-size: var(--pg-text-meta); line-height: 1.45; color: var(--pg-meta); }
.pg-agent::before { content: ""; width: 6px; height: 6px; margin-top: 6px; border-radius: 50%; background: var(--pg-chart-mark); }
.pg-agent[data-fresh] { animation: pg-fresh .6s ease-out; }
@keyframes pg-fresh { from { box-shadow: inset 0 0 0 1.5px var(--pg-ink); } }
[data-show][hidden] { display: none !important; }
.pg-bank { display: flex; flex-wrap: wrap; justify-content: space-around; align-items: center; gap: 12px 8px; }
.pg-banks { display: grid; grid-template-columns: var(--cols, 1fr 1fr); gap: 12px; }
.pg-banks > :only-child { grid-column: 1 / -1; }
.pg-banks:not([style*="--cols"]) { display: flex; flex-wrap: wrap; }
.pg-banks:not([style*="--cols"]) > * { flex: 1 1 auto; }
.pg-banks + .pg-banks, .pg-surface > * + * { margin-top: 12px; }
@media (max-width: 460px) { .pg-banks { grid-template-columns: 1fr; } .pg-banks:not([style*="--cols"]) > * { flex-basis: 100%; } }
.pg-presets { display: flex; flex-wrap: wrap; gap: 6px; }
.pg-transport { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.pg-transport > div { display: flex; gap: 6px; }
.pg-transport > .pg-hint { flex: 1; min-width: 0; text-align: center; font-size: var(--pg-text-meta); color: var(--pg-meta); }
.pg-transport > .pg-hint b { font-weight: 500; color: var(--pg-body); }
@container (max-width: 520px) { .pg-transport { flex-wrap: wrap; } .pg-transport > .pg-hint { order: 3; flex-basis: 100%; text-align: left; } }
.pg-keyboard { position: relative; height: 112px; user-select: none; -webkit-user-select: none; touch-action: none; }
.pg-keyboard > div { position: absolute; top: 0; }
.pg-keyboard .pg-w { bottom: 0; border-radius: 0 0 7px 7px; background: #fbfaf7; box-shadow: inset 0 0 0 1px rgba(0,0,0,.14), inset 0 -3px 0 rgba(0,0,0,.06); transition: background .06s, transform .06s; transform-origin: top; }
.pg-keyboard .pg-b { z-index: 1; height: 62%; border-radius: 0 0 5px 5px; background: #1d1d1f; box-shadow: inset 0 -3px 0 rgba(255,255,255,.08), 0 2px 3px rgba(0,0,0,.25); transition: background .06s, transform .06s; transform-origin: top; }
.pg-keyboard .pg-w.pg-on { background: color-mix(in oklab, var(--pg-c) 30%, #fbfaf7); transform: scaleY(.985); }
.pg-keyboard .pg-b.pg-on { background: var(--pg-c); transform: scaleY(.97); }
.pg-keyboard span { position: absolute; left: 0; right: 0; bottom: 6px; text-align: center; font-size: 10px; color: #9a968e; pointer-events: none; }
.pg-keyboard .pg-b span { bottom: 5px; color: #8a8a8e; }
.pg-keyboard .pg-c span { color: #5f5b54; font-weight: 500; }
.pg-keyboard > .pg-gesture { inset: 0; z-index: 2; display: grid; place-items: center; border: 0; border-radius: 8px; background: color-mix(in oklab, var(--card) 72%, transparent); color: var(--pg-ink); font-size: var(--pg-text-label); font-weight: 500; }
@media (pointer: coarse) { .pg-keyboard span.pg-key { display: none; } }
.pg-pads { display: grid; grid-template-columns: repeat(var(--pg-pad-cols, 4), minmax(0, 1fr)); gap: 6px; }
.pg-steps { display: grid; grid-template-columns: 56px repeat(var(--steps, 16), minmax(0, 1fr)); gap: 3px; align-items: center; font-size: var(--pg-text-axis); color: var(--pg-meta); }
.pg-steps button { aspect-ratio: 1; min-width: 0; padding: 0; border: 0; border-radius: 4px; background: var(--pg-hairline); }
.pg-steps button:nth-of-type(4n+1) { background: color-mix(in oklch, var(--foreground) 16%, var(--card)); }
.pg-steps button[aria-pressed=true] { background: var(--pg-c); }
.pg-steps button.pg-now { outline: 2px solid var(--pg-ink); outline-offset: -2px; }
`;

// Inserted into the bridge before the API object is frozen. It may use `api`
// (the object that becomes window.playground), `state`, and `actions`.
// It must not contain backticks or "${" because it lives in a template string.
export const CONTROLS_RUNTIME = String.raw`
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const WAVES = { sine: "M1 5 C3 0 5 0 7.5 5 S12 10 15 5", triangle: "M1 8 L4.5 2 L8 8 L11.5 2 L15 8", sawtooth: "M1 8 L7 2 L7 8 L13 2 L13 8", square: "M1 8 L1 2 L6 2 L6 8 L11 8 L11 2 L15 2", noise: "M1 5 L3 2 L4 8 L6 3 L7 7 L9 1 L10 9 L12 4 L13 6 L15 5" };
  const GLYPHS = { play: "M4.5 2.8v10.4c0 .5.5.8.9.5l8-5.2c.4-.2.4-.8 0-1l-8-5.2c-.4-.3-.9 0-.9.5Z", stop: "M4 4h8v8H4z", pause: "M3.5 2.5h3v11h-3zM9.5 2.5h3v11h-3z", send: "M2 8 14 2 10 14 8.5 9.5Z" };
  function icon(name) {
    if (WAVES[name]) return '<svg class="pg-icon" viewBox="0 0 16 10" aria-hidden="true"><path d="' + WAVES[name] + '"/></svg>';
    if (GLYPHS[name]) return '<svg class="pg-glyph" viewBox="0 0 16 16" aria-hidden="true"><path d="' + GLYPHS[name] + '"/></svg>';
    return "";
  }
  const decimals = (step) => { const s = String(step || 1); return s.includes(".") ? s.split(".")[1].length : 0; };
  function format(v, s) {
    if (s.options) { const o = s.options.find((x) => x.value === v); return o ? o.label : String(v); }
    if (typeof v === "boolean") return v ? "On" : "Off";
    const u = s.unit || "";
    if (u === "%" && s.max <= 1) return Math.round(v * 100) + "%";
    if (u === "Hz") return v >= 1000 ? (v / 1000).toFixed(1) + "k" : v < 10 ? v.toFixed(1) + "Hz" : Math.round(v) + "Hz";
    // Thousands separators, and no trailing zeros: 140,000 · 6.5% · 1.2s.
    const plain = (x, most) => Number(x).toLocaleString("en-US", { maximumFractionDigits: most, minimumFractionDigits: 0 });
    if (u === "s") return v < 1 ? Math.round(v * 1000) + "ms" : plain(v, 1) + "s";
    const n = plain(v, s.step ? decimals(s.step) : Number.isInteger(Number(v)) ? 0 : Math.abs(v) < 10 ? 1 : 0);
    return u ? n + (/^[%¢°/]/.test(u) ? "" : " ") + u : n;
  }

  // Layer 1 behaviors.
  function dragValue(el, ctl) {
    let drag = null;
    el.addEventListener("pointerdown", (e) => { if (e.button !== 0) return; e.preventDefault(); el.focus(); el.setPointerCapture(e.pointerId); drag = { y: e.clientY, t: ctl.t() }; el.classList.add("pg-grab"); });
    el.addEventListener("pointermove", (e) => { if (drag) ctl.set(drag.t + (drag.y - e.clientY) / (e.shiftKey ? 600 : 160)); });
    const end = () => { drag = null; el.classList.remove("pg-grab"); };
    el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end);
    el.addEventListener("dblclick", () => ctl.reset());
    el.addEventListener("wheel", (e) => { e.preventDefault(); ctl.set(ctl.t() - Math.sign(e.deltaY) * .02); }, { passive: false });
    el.addEventListener("keydown", (e) => {
      const step = { ArrowUp: .02, ArrowRight: .02, ArrowDown: -.02, ArrowLeft: -.02, PageUp: .1, PageDown: -.1 }[e.key];
      if (step) { e.preventDefault(); ctl.set(ctl.t() + step); }
      else if (e.key === "Home") { e.preventDefault(); ctl.set(0); }
      else if (e.key === "End") { e.preventDefault(); ctl.set(1); }
    });
  }
  function pressable(el, down, up) {
    const ids = new Set();
    el.addEventListener("pointerdown", (e) => { e.preventDefault(); el.setPointerCapture(e.pointerId); if (!ids.size) down(); ids.add(e.pointerId); });
    const end = (e) => { if (!ids.delete(e.pointerId)) return; if (!ids.size) up(); };
    el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end);
    el.addEventListener("keydown", (e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); down(); } });
    el.addEventListener("keyup", (e) => { if (e.key === " " || e.key === "Enter") up(); });
  }

  // Sound needs a click inside the card first. ui.audio() returns the shared
  // context; ui.onAudio runs once it can play.
  let audioCtx = null;
  const audioWaiters = new Set();
  function audio() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!audioCtx && Ctx) audioCtx = new Ctx();
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
    return audioCtx;
  }
  const audioReady = () => Boolean(audioCtx && audioCtx.state === "running");
  // Only cards that make sound get an AudioContext; a tap on any other card leaves audio alone.
  addEventListener("pointerdown", () => {
    if (!audioCtx && !audioWaiters.size && !document.querySelector('[data-pg="keyboard"],[data-pg="pads"]')) return;
    const ctx = audio(); if (ctx) ctx.resume().then(() => { for (const fn of audioWaiters) fn(); audioWaiters.clear(); }).catch(() => {});
  }, true);

  // Events: press, release, change, take.
  const handlers = new Map();
  const on = (type, fn) => { if (!handlers.has(type)) handlers.set(type, new Set()); handlers.get(type).add(fn); return () => handlers.get(type).delete(fn); };
  const fire = (type, detail) => { for (const fn of handlers.get(type) || []) { try { fn(detail); } catch (error) { console.error(error); } } };

  // Layer 2: parameters.
  const specs = Object.create(null), values = Object.create(null);
  const restored = state && typeof state === "object" && state.params && typeof state.params === "object" ? state.params : {};
  const norm = (s, v) => s.scale === "log" ? Math.log(v / s.min) / Math.log(s.max / s.min) : (v - s.min) / (s.max - s.min);
  const denorm = (s, t) => { t = clamp(t, 0, 1); return s.scale === "log" ? s.min * Math.pow(s.max / s.min, t) : s.min + t * (s.max - s.min); };
  function valid(s, v) {
    if (s.options) return s.options.some((o) => o.value === v) ? v : s.default;
    if (s.type === "toggle") return Boolean(v);
    if (s.type === "text") return String(v ?? "").slice(0, s.maxLength || 200);
    if (s.type === "board") return Array.isArray(v) && v.length === s.rows && v.every((r) => Array.isArray(r) && r.length === s.cols) ? v.map((r) => r.map((c) => (typeof c === "string" ? c.slice(0, 12) : ""))) : s.default;
    if (s.type === "grid") return Array.isArray(v) && v.length === s.rows && v.every((r) => Array.isArray(r) && r.length === s.steps) ? v.map((r) => r.map(Boolean)) : s.default;
    const n = Number(v);
    if (!Number.isFinite(n)) return s.default;
    const c = clamp(n, s.min, s.max);
    return s.step ? Number((Math.round((c - s.min) / s.step) * s.step + s.min).toFixed(6)) : c;
  }
  function define(name, spec) {
    if (!/^[A-Za-z][\w-]*$/.test(name)) throw new Error("Parameter names are letters, digits, - and _: " + name);
    const s = { label: name, ...spec };
    // Programmatic declarations commonly use JavaScript type names and bare
    // choices. Normalize them to the same schema as data-pg controls before
    // validating values, so a valid choice cannot silently reset to default.
    if (s.type === "string") s.type = "text";
    if (s.type === "boolean") s.type = "toggle";
    if (Array.isArray(s.options)) s.options = s.options.map((option) =>
      typeof option === "string" || typeof option === "number" ? { value: option, label: String(option) } : option);
    if (s.type === "grid") s.default = s.default || Array.from({ length: s.rows }, () => Array(s.steps).fill(false));
    else if (s.type === "board") s.default = Array.isArray(s.default) ? s.default : Array.from({ length: s.rows }, () => Array(s.cols).fill(""));
    else if (s.type === "text") s.default = s.default === undefined ? "" : String(s.default);
    else if (s.type !== "toggle" && !s.options) { s.min = Number(s.min ?? 0); s.max = Number(s.max ?? 1); }
    if (s.default === undefined) s.default = s.options ? s.options[0].value : s.type === "toggle" ? false : s.min;
    specs[name] = s;
    if (!(name in values)) values[name] = valid(s, name in restored ? restored[name] : s.default);
    return values[name];
  }
  let saveTimer = 0;
  const rawSave = api.save;
  const current = () => (api.state && typeof api.state === "object" && !Array.isArray(api.state) ? api.state : {});
  let laneText = state && typeof state === "object" && typeof state.lane === "string" ? state.lane : "";
  const persist = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => rawSave({ ...current(), params: { ...values }, lane: laneText }), 150); };
  api.save = (value) => rawSave(value && typeof value === "object" && !Array.isArray(value) && Object.keys(specs).length && !("params" in value) ? { ...value, params: { ...values }, lane: laneText } : value);
  function requireParam(name) {
    if (typeof name !== "string" || !Object.hasOwn(specs, name)) throw new Error("Unknown playground parameter " + JSON.stringify(name) + ". Declare it with data-pg/data-param or params.define(name, spec) before using it.");
    return specs[name];
  }
  function setMany(next, from) {
    if (!next || typeof next !== "object" || Array.isArray(next)) throw new Error("Use params.set(name, value), params.set({ name: value }), or setParams({ name: value }).");
    const entries = Object.entries(next);
    for (const [name] of entries) requireParam(name);
    return Object.fromEntries(entries.map(([name, value]) => [name, set(name, value, from)]));
  }
  function set(name, value, from) {
    const s = requireParam(name);
    const next = valid(s, value);
    if (JSON.stringify(next) === JSON.stringify(values[name])) return next;
    values[name] = next;
    fire("change", { name, value: next, from: from || "user" });
    if (from === "agent") { flag(name); lane("Set " + s.label + " to " + (s.type === "board" || s.type === "grid" ? "a new layout" : format(next, s)) + "."); }
    showWhen();
    if (from !== "remote") persist();
    record("change", { name, value: next, from });
    return next;
  }
  // A card's own script runs as soon as the parser reaches it, before DOMContentLoaded.
  // Reading or writing anything hydrates the controls parsed so far, so its first read
  // already sees every control declared above it.
  const ready = () => { if (document.body) hydrate(document); };
  const params = Object.freeze({
    define: (name, spec) => { ready(); return define(name, spec); },
    set: (...args) => { ready(); if (args.length === 1 && args[0] && typeof args[0] === "object") return setMany(args[0], "user"); if (args.length !== 2 || typeof args[0] !== "string") throw new Error("Use params.set(name, value) or params.set({ name: value })."); return set(args[0], args[1], "user"); },
    get: (name) => { ready(); requireParam(name); return values[name]; },
    all: () => { ready(); return { ...values }; },
    spec: (name) => { ready(); return specs[name]; },
    format: (name, v) => { ready(); return format(v === undefined ? values[name] : v, specs[name] || {}); },
    on: (fn) => on("change", fn),
  });
  function flag(name) {
    for (const el of document.querySelectorAll('[data-param="' + name + '"]')) {
      el.dataset.agent = ""; clearTimeout(el.__agentTimer);
      el.__agentTimer = setTimeout(() => { delete el.dataset.agent; }, 1600);
    }
  }
  stateListeners.add((next) => {
    if (next && typeof next === "object" && typeof next.lane === "string" && next.lane !== laneText) { laneText = next.lane; paintLane(); }
    const incoming = next && typeof next === "object" && next.params;
    if (!incoming) return;
    for (const name in specs) if (name in incoming) set(name, incoming[name], "remote");
  });

  // Takes: what the person played and changed, with timing, ready to send.
  let recording = null, lastTake = null;
  function record(kind, detail) {
    if (!recording || detail.from === "agent") return;
    const t = Math.round(performance.now() - recording.t0) / 1000;
    if (kind === "press") recording.open.set(detail.id, t);
    else if (kind === "release" && recording.open.has(detail.id)) { const t0 = recording.open.get(detail.id); recording.open.delete(detail.id); recording.notes.push([detail.id, t0, Number((t - t0).toFixed(3))]); }
    else if (kind === "change") recording.changes.push([t, detail.name, detail.value]);
  }
  function startTake() { recording = { t0: performance.now(), open: new Map(), notes: [], changes: [] }; syncRecorders(); }
  function stopTake() {
    if (!recording) return lastTake;
    const t = Math.round(performance.now() - recording.t0) / 1000;
    for (const [id, t0] of recording.open) recording.notes.push([id, t0, Number((t - t0).toFixed(3))]);
    lastTake = { seconds: t, notes: recording.notes.sort((a, b) => a[1] - b[1]), changes: recording.changes, params: { ...values } };
    recording = null; syncRecorders(); fire("take", lastTake);
    return lastTake;
  }
  function syncRecorders() {
    for (const el of document.querySelectorAll('[data-pg="record"]')) { el.setAttribute("aria-pressed", String(Boolean(recording))); el.lastChild.textContent = recording ? "Stop" : "Record"; }
    for (const el of document.querySelectorAll('[data-pg="send"]')) el.disabled = !lastTake || Boolean(recording);
  }

  // Presses from people and from the agent go through one path.
  const pressed = new Map();
  function press(id, from, velocity) {
    pressed.set(id, (pressed.get(id) || 0) + 1);
    for (const el of document.querySelectorAll('[data-press="' + CSS.escape(String(id)) + '"]')) el.classList.add("pg-on");
    fire("press", { id, from: from || "user", velocity: velocity ?? 1 });
    record("press", { id, from });
  }
  function release(id, from) {
    const n = (pressed.get(id) || 1) - 1;
    if (n > 0) { pressed.set(id, n); return; }
    pressed.delete(id);
    for (const el of document.querySelectorAll('[data-press="' + CSS.escape(String(id)) + '"]')) el.classList.remove("pg-on");
    fire("release", { id, from: from || "user" });
    record("release", { id, from });
  }
  let agentTimers = [], unheard = null;
  // play([[id, startBeat, lengthBeats], ...], bpm): the agent performs on the card's own controls.
  function play(notes, bpm) {
    const beat = 60 / clamp(Number(bpm) || 120, 30, 300);
    for (const t of agentTimers) clearTimeout(t);
    agentTimers = [];
    const list = (Array.isArray(notes) ? notes : []).slice(0, 512).filter((n) => Array.isArray(n) && n.length >= 2);
    for (const [id, start, length] of list) {
      agentTimers.push(setTimeout(() => press(id, "agent"), Math.max(0, Number(start) * beat * 1000)));
      agentTimers.push(setTimeout(() => release(id, "agent"), Math.max(0, (Number(start) + Math.max(.05, Number(length) || .5)) * beat * 1000)));
    }
    const seconds = list.reduce((m, [, s, l]) => Math.max(m, (Number(s) + (Number(l) || .5)) * beat), 0);
    lane("Played " + list.length + (list.length === 1 ? " note." : " notes."));
    const audible = audioReady();
    unheard = audible ? null : [list, bpm];
    if (!audible) for (const kb of document.querySelectorAll('[data-pg="keyboard"],[data-pg="pads"]')) kb.__gesture?.();
    return { notes: list.length, seconds: Number(seconds.toFixed(2)), audible };
  }

  // Layer 2 controls and layer 3 patterns, hydrated from markup.
  const attr = (el, name, fallback) => (el.dataset[name] === undefined ? fallback : el.dataset[name]);
  const num = (el, name, fallback) => (el.dataset[name] === undefined ? fallback : Number(el.dataset[name]));
  function optionsOf(el) {
    const raw = el.dataset.options;
    if (!raw) return null;
    return raw.split(",").map((part) => { const [value, label] = part.split(":"); return { value: value.trim(), label: (label || value).trim() }; });
  }
  function specFrom(el, extra) {
    const options = optionsOf(el);
    return {
      label: attr(el, "label", el.dataset.param), unit: attr(el, "unit", ""), scale: attr(el, "scale", "lin"),
      min: num(el, "min", 0), max: num(el, "max", 1), step: num(el, "step", undefined),
      default: el.dataset.value === undefined ? undefined : options ? el.dataset.value : extra && extra.type === "toggle" ? el.dataset.value === "true" : Number(el.dataset.value),
      options, ...extra,
    };
  }
  const ARC = (t) => { const a0 = -225 * Math.PI / 180, a = a0 + t * 270 * Math.PI / 180, r = 15, p = (g) => (19 + r * Math.cos(g)).toFixed(2) + " " + (19 + r * Math.sin(g)).toFixed(2); return "M " + p(a0) + " A " + r + " " + r + " 0 " + (t > 2 / 3 ? 1 : 0) + " 1 " + p(a); };
  const BUILD = {
    field(el, name) {
      const s = specs[name];
      el.classList.add("pg-field");
      el.innerHTML = '<span></span><span class="pg-box"><input><span class="pg-unit"></span></span>';
      el.firstChild.textContent = s.label;
      const input = el.querySelector("input"), unit = el.querySelector(".pg-unit");
      input.setAttribute("aria-label", s.label);
      if (s.type === "text") { input.type = "text"; if (el.dataset.placeholder) input.placeholder = el.dataset.placeholder; }
      else { input.type = "number"; input.inputMode = "decimal"; input.min = String(s.min); input.max = String(s.max); input.step = String(s.step || "any"); }
      const prefix = attr(el, "prefix", "");
      if (prefix) { const p = document.createElement("span"); p.className = "pg-unit"; p.textContent = prefix; input.before(p); }
      unit.textContent = s.type === "text" ? "" : s.unit || "";
      if (!unit.textContent) unit.remove();
      if (el.dataset.help) { const h = document.createElement("small"); h.textContent = el.dataset.help; el.append(h); }
      input.addEventListener("change", () => set(name, s.type === "text" ? input.value : Number(input.value)));
      input.addEventListener("input", () => { if (s.type === "text") return; const n = Number(input.value); if (input.value !== "" && Number.isFinite(n) && n >= s.min && n <= s.max) set(name, n); });
      return () => { if (document.activeElement !== input) input.value = String(values[name]); };
    },
    select(el, name) {
      const s = specs[name];
      el.classList.add("pg-field");
      el.innerHTML = '<span></span><span class="pg-box pg-menu"><select></select></span>';
      el.firstChild.textContent = s.label;
      const select = el.querySelector("select"); select.setAttribute("aria-label", s.label);
      for (const o of s.options) { const opt = document.createElement("option"); opt.value = o.value; opt.textContent = o.label; select.append(opt); }
      select.onchange = () => set(name, select.value);
      return () => { select.value = values[name]; };
    },
    slider(el, name) {
      const s = specs[name];
      el.classList.add("pg-slider");
      el.innerHTML = '<span></span><output></output><input type="range" min="0" max="1000" step="1">';
      el.firstChild.textContent = s.label;
      const input = el.querySelector("input"); input.setAttribute("aria-label", s.label);
      input.addEventListener("input", () => set(name, denorm(s, Number(input.value) / 1000)));
      return () => { const t = clamp(norm(s, values[name]), 0, 1); input.value = String(Math.round(t * 1000)); input.style.setProperty("--pg-fill", (t * 100).toFixed(1) + "%"); el.querySelector("output").textContent = format(values[name], s); };
    },
    tabs(el, name) {
      const s = specs[name];
      el.classList.add("pg-tabs"); el.setAttribute("role", "tablist"); el.setAttribute("aria-label", s.label);
      el.innerHTML = s.options.map(() => '<button type="button" role="tab"></button>').join("");
      [...el.children].forEach((b, i) => { b.textContent = s.options[i].label; b.onclick = () => set(name, s.options[i].value); });
      el.addEventListener("keydown", (e) => { const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (!d) return; e.preventDefault(); const i = s.options.findIndex((o) => o.value === values[name]); const n = s.options[(i + d + s.options.length) % s.options.length]; set(name, n.value); el.querySelector('[aria-selected="true"]')?.focus(); });
      return () => [...el.children].forEach((b, i) => { const on = s.options[i].value === values[name]; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; });
    },
    list(el, name) {
      const s = specs[name];
      el.classList.add("pg-list"); el.setAttribute("role", "group"); el.setAttribute("aria-label", s.label);
      const notes = attr(el, "notes", "").split("|");
      el.innerHTML = s.options.map(() => '<button type="button" aria-pressed="false"><span></span><small></small></button>').join("");
      [...el.children].forEach((b, i) => { b.firstChild.textContent = s.options[i].label; b.lastChild.textContent = notes[i] || ""; b.onclick = () => set(name, s.options[i].value); });
      return () => [...el.children].forEach((b, i) => b.setAttribute("aria-pressed", String(s.options[i].value === values[name])));
    },
    board(el, name) {
      const s = specs[name];
      el.classList.add("pg-board"); el.setAttribute("role", "grid"); el.setAttribute("aria-label", s.label);
      el.style.setProperty("--pg-board-cols", String(s.cols));
      const pieces = Object.fromEntries(attr(el, "pieces", "").split(",").filter(Boolean).map((p) => { const [key, color, label, mark] = p.split(":"); return [key.trim(), { color: (color || "").trim(), label: (label || key).trim(), mark: (mark || "").trim() }]; }));
      el.innerHTML = Array.from({ length: s.rows * s.cols }, (_, i) => '<button type="button" data-r="' + Math.floor(i / s.cols) + '" data-c="' + (i % s.cols) + '"></button>').join("");
      el.onclick = (e) => { const b = e.target.closest("button"); if (b) choose(name, +b.dataset.r, +b.dataset.c, "user"); };
      let previous = null;
      return () => {
        const grid = values[name];
        el.querySelectorAll("button").forEach((b) => {
          const r = +b.dataset.r, c = +b.dataset.c, v = grid[r][c], p = pieces[v];
          const key = v + "|" + (p ? p.color + p.mark : "");
          if (b.__key === key) return;
          b.__key = key; b.innerHTML = "";
          if (v && p && p.color) { const i = document.createElement("i"); i.style.setProperty("--piece", p.color); b.append(i); if (p.mark) { const m = document.createElement("b"); m.setAttribute("aria-hidden", "true"); m.textContent = p.mark; b.append(m); } }
          else if (v) { const t = document.createElement("b"); t.textContent = p ? p.label : v; b.append(t); }
          b.setAttribute("aria-label", "Row " + (r + 1) + ", column " + (c + 1) + (v ? ", " + (p ? p.label : v) : ", empty"));
        });
        const changed = [];
        if (previous) for (let r = 0; r < s.rows; r++) for (let c = 0; c < s.cols; c++) if (previous[r][c] !== grid[r][c]) changed.push([r, c]);
        if (changed.length) el.querySelector("[data-last]")?.removeAttribute("data-last");
        if (changed.length === 1) el.querySelector('[data-r="' + changed[0][0] + '"][data-c="' + changed[0][1] + '"]').setAttribute("data-last", "");
        previous = grid.map((row) => row.slice());
      };
    },
    dial(el, name) {
      const s = specs[name];
      el.classList.add("pg-dial"); el.tabIndex = 0; el.setAttribute("role", "slider"); el.setAttribute("aria-label", s.label);
      el.innerHTML = '<svg viewBox="0 0 38 38" aria-hidden="true"><path class="pg-track" d="' + ARC(1) + '"/><path class="pg-arc"/><circle class="pg-cap" cx="19" cy="19" r="10.5"/><line class="pg-pointer" x1="19" y1="19" x2="19" y2="11"/></svg><div class="pg-name"></div><div class="pg-value"></div>';
      el.querySelector(".pg-name").textContent = s.label;
      dragValue(el, { t: () => norm(s, values[name]), set: (t) => set(name, denorm(s, t)), reset: () => set(name, s.default) });
      return () => {
        const t = clamp(norm(s, values[name]), 0, 1), g = (-225 + t * 270) * Math.PI / 180;
        el.querySelector(".pg-arc").setAttribute("d", t > .001 ? ARC(t) : "");
        const p = el.querySelector(".pg-pointer"); p.setAttribute("x2", (19 + 8 * Math.cos(g)).toFixed(2)); p.setAttribute("y2", (19 + 8 * Math.sin(g)).toFixed(2));
        el.querySelector(".pg-value").textContent = format(values[name], s);
        el.setAttribute("aria-valuenow", String(values[name])); el.setAttribute("aria-valuetext", format(values[name], s));
      };
    },
    fader(el, name) {
      const s = specs[name];
      el.classList.add("pg-fader");
      el.innerHTML = '<span></span><output></output><input type="range" min="0" max="1000" step="1">';
      el.firstChild.textContent = s.label;
      const input = el.querySelector("input"); input.setAttribute("aria-label", s.label);
      input.addEventListener("input", () => set(name, denorm(s, Number(input.value) / 1000)));
      return () => { const t = clamp(norm(s, values[name]), 0, 1); input.value = String(Math.round(t * 1000)); input.style.setProperty("--pg-fill", (t * 100).toFixed(1) + "%"); el.querySelector("output").textContent = format(values[name], s); };
    },
    stepper(el, name) {
      const s = specs[name], step = s.step || (s.max - s.min) / 20;
      el.classList.add("pg-stepper"); el.setAttribute("role", "group"); el.setAttribute("aria-label", s.label);
      el.innerHTML = '<button type="button" aria-label="Decrease">−</button><output></output><button type="button" aria-label="Increase">+</button>';
      el.firstChild.onclick = () => set(name, values[name] - step); el.lastChild.onclick = () => set(name, values[name] + step);
      return () => { el.querySelector("output").textContent = format(values[name], s); };
    },
    segmented(el, name) {
      const s = specs[name];
      el.classList.add("pg-seg"); el.setAttribute("role", "group"); el.setAttribute("aria-label", s.label);
      el.innerHTML = s.options.map((o) => '<button type="button" aria-pressed="false"></button>').join("");
      [...el.children].forEach((b, i) => { b.textContent = s.options[i].label; b.onclick = () => set(name, s.options[i].value); });
      return () => [...el.children].forEach((b, i) => b.setAttribute("aria-pressed", String(s.options[i].value === values[name])));
    },
    picker(el, name) {
      const s = specs[name];
      el.classList.add("pg-picker");
      el.innerHTML = '<div role="group"></div><div class="pg-value"></div>';
      const grid = el.firstChild; grid.setAttribute("aria-label", s.label);
      grid.innerHTML = s.options.map((o) => '<button type="button" aria-pressed="false">' + icon(o.value) + "</button>").join("");
      [...grid.children].forEach((b, i) => { b.setAttribute("aria-label", s.options[i].label); if (!icon(s.options[i].value)) b.textContent = s.options[i].label; b.onclick = () => set(name, s.options[i].value); });
      el.lastChild.textContent = attr(el, "caption", s.label);
      return () => [...grid.children].forEach((b, i) => b.setAttribute("aria-pressed", String(s.options[i].value === values[name])));
    },
    toggle(el, name) {
      const s = specs[name];
      el.classList.add(el.classList.contains("pg-btn") ? "pg-toggle" : "pg-chip", "pg-toggle");
      if (el.tagName !== "BUTTON") { el.tabIndex = 0; el.setAttribute("role", "button"); el.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (!e.repeat) el.click(); } }; }
      else if (!el.hasAttribute("type")) el.type = "button";
      if (!el.textContent.trim()) el.textContent = s.label;
      el.onclick = () => set(name, !values[name]);
      return () => el.setAttribute("aria-pressed", String(Boolean(values[name])));
    },
    steps(el, name) {
      const s = specs[name], rows = attr(el, "rows", "").split(",").map((r) => r.trim());
      el.classList.add("pg-steps"); el.style.setProperty("--steps", String(s.steps));
      el.innerHTML = rows.map((r, ri) => "<span></span>" + Array.from({ length: s.steps }, (_, si) => '<button type="button" aria-pressed="false" data-r="' + ri + '" data-s="' + si + '"></button>').join("")).join("");
      [...el.querySelectorAll("span")].forEach((sp, i) => { sp.textContent = rows[i]; });
      el.onclick = (e) => { const b = e.target.closest("button"); if (!b) return; const grid = values[name].map((r) => r.slice()); grid[+b.dataset.r][+b.dataset.s] = !grid[+b.dataset.r][+b.dataset.s]; set(name, grid); };
      el.__now = (i) => el.querySelectorAll("button").forEach((b) => b.classList.toggle("pg-now", +b.dataset.s === i));
      return () => el.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(Boolean(values[name][+b.dataset.r][+b.dataset.s]))));
    },
  };
  const NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
  const noteName = (m) => NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
  function keyboard(el) {
    const keymap = attr(el, "keys", "awsedftgyhujkolp;'"), count = num(el, "count", 25), whites = [0, 2, 4, 5, 7, 9, 11];
    let base = num(el, "from", 48);
    el.classList.add("pg-keyboard"); el.setAttribute("role", "group"); el.setAttribute("aria-label", attr(el, "label", "Keyboard"));
    function build() {
      el.innerHTML = "";
      const nWhite = Array.from({ length: count }, (_, i) => i).filter((i) => whites.includes(((base + i) % 12 + 12) % 12)).length, w = 100 / nWhite;
      let wi = 0;
      for (let i = 0; i < count; i++) {
        const m = base + i, white = whites.includes(((m % 12) + 12) % 12), key = document.createElement("div");
        key.dataset.press = String(m); key.setAttribute("aria-label", noteName(m));
        if (white) { key.className = "pg-w" + (m % 12 === 0 ? " pg-c" : ""); key.style.left = "calc(" + (wi * w) + "% + 1px)"; key.style.width = "calc(" + w + "% - 2px)"; wi++; }
        else { key.className = "pg-b"; key.style.left = (wi * w - w * .3) + "%"; key.style.width = (w * .6) + "%"; }
        const q = keymap[i] ? keymap[i].toUpperCase() : "";
        key.innerHTML = m % 12 === 0 ? "<span></span>" : q ? '<span class="pg-key"></span>' : "";
        if (key.firstChild) key.firstChild.textContent = m % 12 === 0 ? noteName(m) : q;
        if (pressed.has(m)) key.classList.add("pg-on");
        el.append(key);
      }
    }
    build();
    const pointers = new Map();
    const at = (x, y) => { const k = document.elementFromPoint(x, y)?.closest("[data-press]"); return k && el.contains(k) ? Number(k.dataset.press) : null; };
    el.addEventListener("pointerdown", (e) => { e.preventDefault(); el.setPointerCapture(e.pointerId); const m = at(e.clientX, e.clientY); pointers.set(e.pointerId, m); if (m != null) press(m); });
    el.addEventListener("pointermove", (e) => { if (!pointers.has(e.pointerId)) return; const m = at(e.clientX, e.clientY), prev = pointers.get(e.pointerId); if (m !== prev) { if (prev != null) release(prev); if (m != null) press(m); pointers.set(e.pointerId, m); } });
    const up = (e) => { if (!pointers.has(e.pointerId)) return; const m = pointers.get(e.pointerId); pointers.delete(e.pointerId); if (m != null) release(m); };
    el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
    addEventListener("keydown", (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.("input,textarea,[role=slider]")) return;
      const k = e.key.toLowerCase();
      if ((k === "z" || k === "x") && el.dataset.octaves !== "false") { e.preventDefault(); base = clamp(base + (k === "z" ? -12 : 12), 12, 96); build(); return; }
      const i = keymap.indexOf(k); if (i < 0 || e.repeat || i >= count) return; e.preventDefault(); press(base + i);
    });
    addEventListener("keyup", (e) => { const i = keymap.indexOf(e.key.toLowerCase()); if (i >= 0 && i < count) release(base + i); });
    gesture(el);
  }
  function gesture(el) {
    el.__gesture = () => {
      if (audioReady() || el.querySelector(".pg-gesture")) return;
      const b = document.createElement("button"); b.type = "button"; b.className = "pg-gesture"; b.textContent = "Tap to hear the agent play";
      b.onclick = () => { const ctx = audio(); b.remove(); const again = unheard; unheard = null; if (again && ctx) ctx.resume().then(() => play(again[0], again[1])).catch(() => {}); }; el.append(b);
      audioWaiters.add(() => b.remove());
    };
  }
  function pads(el) {
    el.classList.add("pg-pads");
    const list = attr(el, "pads", "").split(",").map((p) => { const [label, key] = p.split(":"); return { id: label.trim(), key: (key || "").trim().toLowerCase() }; }).filter((p) => p.id);
    el.style.setProperty("--pg-pad-cols", attr(el, "cols", String(Math.min(4, list.length))));
    for (const p of list) {
      const b = document.createElement("button"); b.type = "button"; b.className = "pg-pad"; b.dataset.press = p.id;
      b.innerHTML = "<span></span><small></small>"; b.firstChild.textContent = p.id; b.lastChild.textContent = p.key.toUpperCase();
      pressable(b, () => press(p.id), () => release(p.id)); el.append(b);
    }
    addEventListener("keydown", (e) => { if (e.repeat || e.metaKey || e.ctrlKey || e.target.closest?.("input,textarea")) return; const p = list.find((x) => x.key === e.key.toLowerCase()); if (p) { e.preventDefault(); press(p.id); } });
    addEventListener("keyup", (e) => { const p = list.find((x) => x.key === e.key.toLowerCase()); if (p) release(p.id); });
    el.style.position = "relative"; gesture(el);
  }
  function presets(el) {
    const source = el.querySelector('script[type="application/json"]');
    let table = {};
    try { table = JSON.parse(source ? source.textContent : "{}"); } catch {}
    el.classList.add("pg-presets"); el.setAttribute("role", "group"); el.setAttribute("aria-label", attr(el, "label", "Presets"));
    const names = Object.keys(table);
    el.innerHTML = names.map(() => '<button type="button" class="pg-chip" aria-pressed="false"></button>').join("");
    [...el.children].forEach((b, i) => { b.textContent = names[i]; b.onclick = () => { for (const [k, v] of Object.entries(table[names[i]])) set(k, v); fire("preset", { name: names[i] }); }; });
    const matches = (preset) => { const known = Object.entries(preset).filter(([k]) => k in specs); return known.length > 0 && known.every(([k, v]) => JSON.stringify(values[k]) === JSON.stringify(valid(specs[k], v))); };
    const sync = () => [...el.children].forEach((b, i) => b.setAttribute("aria-pressed", String(matches(table[names[i]]))));
    on("change", sync); afterHydrate.push(sync);
  }
  function scope(el) {
    el.classList.add("pg-scope");
    if (!el.querySelector("canvas")) el.insertAdjacentHTML("afterbegin", "<canvas></canvas>");
    const canvas = el.querySelector("canvas"), g = canvas.getContext("2d");
    let analyser = null, buf = null;
    const draw = (samples) => {
      const w = canvas.width = canvas.clientWidth * devicePixelRatio, h = canvas.height = canvas.clientHeight * devicePixelRatio;
      g.clearRect(0, 0, w, h); g.lineWidth = 1.5 * devicePixelRatio; g.strokeStyle = getComputedStyle(el).getPropertyValue("--pg-c") || "#000"; g.beginPath();
      const n = samples ? samples.length : 0;
      for (let i = 0; i < Math.max(2, n); i++) { const x = (i / Math.max(1, n - 1)) * w, y = h / 2 - (n ? samples[i] : 0) * h * .38; i ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    };
    const loop = () => { if (analyser) { analyser.getFloatTimeDomainData(buf); draw(buf); requestAnimationFrame(loop); } };
    el.__scope = { draw, attach(node) { analyser = node; buf = new Float32Array(node.fftSize); requestAnimationFrame(loop); }, readout(text) { const o = el.querySelector("output"); if (o) o.textContent = text; } };
    draw(null);
  }
  // Outputs: values the app computes and shows. The agent reads them with read().
  const outputs = {};
  function readouts(el) {
    if (el.tagName !== "DL") el.setAttribute("role", "list");
    el.classList.add("pg-readouts");
    for (const item of el.querySelectorAll("[data-readout]")) {
      if (!item.querySelector("dt")) { const dt = document.createElement("dt"); dt.textContent = attr(item, "label", item.dataset.readout); item.prepend(dt); }
      if (!item.querySelector("dd")) item.append(document.createElement("dd"));
    }
  }
  function show(name, value, opts) {
    const o = opts || {};
    outputs[name] = { value, note: o.note || null, tone: o.tone || null };
    for (const item of document.querySelectorAll('[data-readout="' + name + '"]')) {
      const dd = item.querySelector("dd") || item.appendChild(document.createElement("dd"));
      dd.textContent = typeof value === "number" ? format(value, { unit: attr(item, "unit", ""), step: num(item, "step", undefined) }) : String(value);
      if (o.note) { const sm = document.createElement("small"); sm.textContent = o.note; dd.append(sm); }
      if (o.tone) item.dataset.tone = o.tone; else delete item.dataset.tone;
    }
  }
  function table(name, data) {
    const el = document.querySelector('[data-pg="table"][data-name="' + name + '"]');
    if (!el) return;
    const t = document.createElement("table"); t.className = "pg-table";
    const head = t.createTHead().insertRow();
    for (const col of data.columns || []) { const th = document.createElement("th"); th.textContent = col.label || col; if (col.num) th.dataset.num = ""; head.append(th); }
    const body = t.createTBody();
    (data.rows || []).forEach((row, i) => {
      const tr = body.insertRow(); if (data.current === i) tr.setAttribute("aria-current", "true");
      row.forEach((cell, j) => { const td = tr.insertCell(); td.textContent = typeof cell === "number" ? format(cell, { unit: (data.columns[j] || {}).unit || "", step: (data.columns[j] || {}).step }) : String(cell ?? ""); if ((data.columns[j] || {}).num) td.dataset.num = ""; });
    });
    el.replaceChildren(t);
    outputs[name] = { value: { columns: (data.columns || []).map((c) => c.label || c), rows: data.rows || [] } };
  }
  const SVGNS = "http://www.w3.org/2000/svg";
  const svgEl = (n, a, text) => { const e = document.createElementNS(SVGNS, n); for (const [k, v] of Object.entries(a || {})) if (v !== undefined && v !== false) e.setAttribute(k, String(v)); if (text !== undefined) e.textContent = text; return e; };
  function niceTicks(min, max, count) {
    const span = max - min; if (!(span > 0)) return [min];
    const raw = span / count, p = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 5, 10].map((m) => m * p).find((x) => span / x <= count) || p * 10;
    const out = []; for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-9; v += step) out.push(Number(v.toFixed(10))); return out;
  }
  // Boards: clicking a cell, or the agent's select action, both arrive as one "select" event.
  function choose(name, r, c, from) {
    const s = specs[name];
    if (!s || s.type !== "board" || !(r >= 0 && r < s.rows && c >= 0 && c < s.cols)) throw new Error("No cell at row " + r + ", column " + c);
    const detail = { name, row: r, col: c, value: values[name][r][c], from };
    if (from !== "agent") { fire("select", detail); return { board: values[name] }; }
    // The agent's select runs the handlers directly, so a rule that rejects the move reaches the action result.
    const before = laneText;
    flag(name); lane("Chose row " + (r + 1) + ", column " + (c + 1) + ".");
    try { for (const fn of [...(handlers.get("select") || [])]) fn(detail); } catch (error) { laneText = before; paintLane(); persist(); throw error; }
    return { board: values[name] };
  }
  // The agent lane shows what the agent last did on this card.
  let laneTimer = 0;
  function paintLane() {
    for (const el of document.querySelectorAll('[data-pg="agent"]')) {
      el.textContent = laneText || attr(el, "empty", "Ask me to change anything here."); el.title = laneText || ""; el.removeAttribute("data-fresh"); void el.offsetWidth; el.setAttribute("data-fresh", "");
    }
  }
  function lane(text) { laneText = String(text).slice(0, 240); paintLane(); persist(); }
  // Panels with data-show="param=value" (or "param!=value") appear only when it holds.
  function showWhen() {
    for (const el of document.querySelectorAll("[data-show]")) {
      const m = /^([A-Za-z][\w-]*)(!?=)(.*)$/.exec(el.dataset.show);
      if (!m) continue;
      const hit = String(values[m[1]]) === m[3];
      el.hidden = m[2] === "=" ? !hit : hit;
    }
  }
  const SET_KINDS = {}, SET_UI = {}, SET_ACTIONS = {};
  const afterHydrate = [];
  function hydrate(root) {
    const binders = [];
    for (const el of root.querySelectorAll("[data-pg]")) {
      if (el.__pg) continue;
      el.__pg = true;
      const kind = el.dataset.pg, name = el.dataset.param;
      if (BUILD[kind] && name) {
        const extra = kind === "toggle" ? { type: "toggle" } : kind === "steps" ? { type: "grid", rows: attr(el, "rows", "").split(",").length, steps: num(el, "steps", 16) } : kind === "board" ? { type: "board", rows: num(el, "rows", 3), cols: num(el, "cols", 3) } : kind === "field" && el.dataset.input === "text" ? { type: "text", default: el.dataset.value } : {};
        if (["picker", "segmented", "select", "tabs", "list"].includes(kind)) { if (!optionsOf(el)) continue; }
        if (!specs[name]) define(name, specFrom(el, extra));
        const paint = BUILD[kind](el, name);
        el.__paint = paint; binders.push(paint); paint();
      } else if (kind === "keyboard") keyboard(el);
      else if (kind === "pads") pads(el);
      else if (kind === "presets") presets(el);
      else if (kind === "scope") scope(el);
      else if (SET_KINDS[kind]) SET_KINDS[kind](el);
      else if (kind === "readouts") readouts(el);
      else if (kind === "table") { el.classList.add("pg-table-wrap"); }
      else if (kind === "chart") chartHost(el);
      else if (kind === "agent") { el.classList.add("pg-agent"); el.setAttribute("aria-live", "polite"); if (laneText) el.textContent = laneText; else if (!el.textContent.trim()) el.textContent = attr(el, "empty", "Ask me to change anything here."); }
      else if (kind === "meter") { el.classList.add("pg-meter"); el.innerHTML = "<i></i>"; el.__set = (t) => el.style.setProperty("--v", (clamp(t, 0, 1) * 100) + "%"); }
      else if (kind === "record") { el.classList.add("pg-btn", "pg-record"); el.innerHTML = '<i class="pg-dot"></i><span>Record</span>'; el.setAttribute("aria-pressed", "false"); el.onclick = () => (recording ? stopTake() : startTake()); }
      else if (kind === "send") { el.classList.add("pg-btn"); if (!el.textContent.trim()) el.textContent = "Send to agent"; el.disabled = true; el.onclick = () => { if (lastTake) api.send(attr(el, "label", "Take") + " · " + lastTake.notes.length + " notes · " + lastTake.seconds.toFixed(1) + "s", lastTake); }; }
    }
    for (const fn of afterHydrate.splice(0)) fn();
    showWhen();
  }
  on("change", ({ name }) => { for (const el of document.querySelectorAll('[data-param="' + name + '"]')) el.__paint?.(); });

  const readyFirst = (fn) => (...args) => { ready(); return fn(...args); };
/*SETS*/
  const autoActions = {
    ...SET_ACTIONS,
    read: () => ({ params: { ...values }, outputs: JSON.parse(JSON.stringify(outputs)) }),
    select: (name, row, col) => choose(String(name), Number(row), Number(col), "agent"),
    say: (text) => { lane(text); return { ok: true }; },
    getParams: () => ({ values: { ...values }, outputs: JSON.parse(JSON.stringify(outputs)), specs: Object.fromEntries(Object.entries(specs).map(([k, s]) => [k, { label: s.label, unit: s.unit, min: s.min, max: s.max, options: s.options && s.options.map((o) => o.value), type: s.type, rows: s.rows, cols: s.cols }])) }),
    setParams: (next) => ({ set: setMany(next, "agent") }),
    play: (notes, bpm) => play(notes, bpm),
    take: () => lastTake,
  };
  api.params = params;
  api.ui = Object.freeze({ ...SET_UI, show: readyFirst(show), table: readyFirst(table), chart: readyFirst(chart), say: lane, icon, format: (v, spec) => format(v, spec || {}), dragValue, pressable, audio, audioReady, onAudio: (fn) => (audioReady() ? fn() : audioWaiters.add(fn)), on, press: (id) => press(id, "user"), release: (id) => release(id, "user"), play, scope: (el) => el.__scope, meter: (el) => el.__set, steps: (el) => el.__now, noteName, hydrate: () => hydrate(document), take: () => lastTake });
  // Anatomy figures: follow bb's theme, and let the agent read the live readout and
  // step the figure the way its keyboard controls do.
  function figure() {
    const sync = () => { for (const el of document.querySelectorAll(".iso[data-theme]")) el.dataset.theme = theme.scheme; };
    sync(); listeners.add(sync);
    const stage = document.querySelector(".iso-stage");
    if (!stage) return;
    const read = () => ({
      label: stage.getAttribute("aria-label"),
      readout: (document.querySelector("[data-readout]")?.textContent || "").trim() || null,
      value: stage.hasAttribute("aria-valuenow") ? Number(stage.getAttribute("aria-valuenow")) : null,
      min: stage.hasAttribute("aria-valuemin") ? Number(stage.getAttribute("aria-valuemin")) : null,
      max: stage.hasAttribute("aria-valuemax") ? Number(stage.getAttribute("aria-valuemax")) : null,
    });
    const key = async (name, times) => {
      const n = clamp(Math.round(Number(times) || 1), 1, 50);
      for (let i = 0; i < n; i++) stage.dispatchEvent(new KeyboardEvent("keydown", { key: String(name), bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 400));
      return read();
    };
    api.expose(Object.fromEntries(Object.entries({ read, key }).filter(([name]) => !actions.has(name))));
  }
  const start = () => {
    hydrate(document);
    // A card's own actions win over the kit's built-in ones with the same name.
    if (Object.keys(specs).length || document.querySelector("[data-pg]")) api.expose(Object.fromEntries(Object.entries(autoActions).filter(([name]) => !actions.has(name))));
    figure();
    syncRecorders();
  };
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", start); else start();
`;
