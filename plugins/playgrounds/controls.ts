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
  --pg-accent: var(--foreground);
  --pg-good: #1f8a4c; --pg-bad: #d23f3f; --pg-warn: #b26b00;
  --pg-edge: inset 0 0 0 1px var(--pg-hairline);
  --pg-radius-panel: 14px; --pg-radius-group: 10px; --pg-radius-control: 8px;
  --pg-fast: .12s;
}
:root[data-scheme=dark] { --pg-good: #4cc282; --pg-bad: #f06a6a; --pg-warn: #e0a040; }

.pg-surface { padding: 12px; border-radius: var(--pg-radius-panel); background: var(--pg-stage); }
.pg-group { min-width: 0; padding: 9px 6px 8px; border-radius: var(--pg-radius-group); background: var(--card); box-shadow: var(--pg-edge); }
.pg-label { margin: 0; font-size: 10px; line-height: 1.3; font-weight: 500; letter-spacing: .04em; text-transform: uppercase; color: var(--pg-meta); }
.pg-group > .pg-label { margin: 0 0 6px 4px; }
.pg-value { font-size: 9.5px; line-height: 1.3; color: var(--pg-meta); font-variant-numeric: tabular-nums; }
.pg-icon { width: 16px; height: 10px; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linejoin: round; stroke-linecap: round; }
.pg-glyph { width: 14px; height: 14px; fill: currentColor; }
.pg-icon-btn { display: inline-grid; place-items: center; width: 32px; height: 32px; padding: 0; border-radius: 50%; border: 1px solid var(--pg-hairline); background: var(--card); color: var(--pg-ink); }
.pg-icon-btn[aria-pressed=true], .pg-icon-btn[data-primary] { background: var(--pg-ink); border-color: var(--pg-ink); color: var(--card); }
.pg-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--pg-bad); }
[data-live] > .pg-dot, .pg-dot[data-live] { animation: pg-blink 1s ease-in-out infinite alternate; }
@keyframes pg-blink { to { opacity: .3; } }

[data-pg] { --pg-c: var(--pg-accent); }
[data-pg][data-agent] { --pg-c: var(--pg-accent); }
[data-pg][data-agent]::after { content: "Agent"; position: absolute; top: -6px; left: 50%; transform: translateX(-50%); padding: 0 5px; border-radius: 999px; background: var(--pg-ink); color: var(--card); font-size: 8.5px; line-height: 13px; font-weight: 500; letter-spacing: .02em; pointer-events: none; }

.pg-dial { position: relative; display: grid; justify-items: center; gap: 2px; width: 46px; outline: none; touch-action: none; cursor: ns-resize; user-select: none; -webkit-user-select: none; }
.pg-dial svg { width: 38px; height: 38px; overflow: visible; transition: transform var(--pg-fast); }
.pg-dial.pg-grab svg { transform: scale(1.06); }
.pg-dial .pg-track { fill: none; stroke: var(--pg-hairline); stroke-width: 3.2; stroke-linecap: round; }
.pg-dial .pg-arc { fill: none; stroke: var(--pg-c); stroke-width: 3.2; stroke-linecap: round; }
.pg-dial .pg-cap { fill: var(--card); stroke: color-mix(in srgb, var(--foreground) 16%, transparent); }
.pg-dial.pg-grab .pg-cap, .pg-dial[data-agent] .pg-cap { stroke: var(--pg-c); }
.pg-dial .pg-pointer { stroke: var(--pg-ink); stroke-width: 2; stroke-linecap: round; }
.pg-dial .pg-name { font-size: 10px; font-weight: 500; color: var(--pg-ink); white-space: nowrap; }
.pg-dial .pg-value { min-height: 12px; }
.pg-dial.pg-grab .pg-value { color: var(--pg-ink); font-weight: 500; }
.pg-dial:focus-visible svg { outline: 2px solid var(--ring); outline-offset: 2px; border-radius: 50%; }

.pg-fader { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 6px 10px; align-items: baseline; font-size: 11px; font-weight: 500; color: var(--pg-ink); }
.pg-fader input { grid-column: 1 / -1; width: 100%; margin: 0; accent-color: var(--pg-c); }
.pg-stepper { position: relative; display: inline-flex; align-items: center; gap: 2px; padding: 2px; border-radius: 999px; box-shadow: var(--pg-edge); background: var(--card); }
.pg-stepper button { width: 24px; height: 24px; border: 0; border-radius: 50%; background: transparent; color: var(--pg-ink); }
.pg-stepper button:hover { background: var(--pg-stage); }
.pg-stepper output { min-width: 3.5em; text-align: center; font-size: 11.5px; font-weight: 500; }
.pg-picker { position: relative; display: grid; justify-items: center; gap: 4px; }
.pg-picker > [role=group] { display: grid; grid-template-columns: repeat(var(--pg-picker-cols, 2), 24px); gap: 2px; padding: 2px; border-radius: 9px; box-shadow: var(--pg-edge); background: var(--card); }
.pg-picker button { display: grid; place-items: center; width: 24px; height: 18px; padding: 0; border: 0; border-radius: 6px; background: transparent; color: var(--pg-ink); }
.pg-picker button[aria-pressed=true] { background: var(--pg-ink); color: var(--card); }
.pg-picker > .pg-value { font-size: 9.5px; }
.pg-toggle { position: relative; }
.pg-pad { position: relative; display: grid; place-items: center; min-height: 44px; padding: 6px; border-radius: var(--pg-radius-control); border: 0; background: var(--card); box-shadow: var(--pg-edge), inset 0 -3px 0 var(--pg-hairline); color: var(--pg-ink); font-size: 11px; font-weight: 500; touch-action: none; user-select: none; -webkit-user-select: none; transition: transform var(--pg-fast), background var(--pg-fast); }
.pg-pad.pg-on { background: color-mix(in srgb, var(--pg-c) 22%, var(--card)); transform: scale(.98); }
.pg-pad small { display: block; font-size: 9px; font-weight: 400; color: var(--pg-meta); }
.pg-meter { position: relative; height: 6px; border-radius: 3px; background: var(--pg-hairline); overflow: hidden; }
.pg-meter > i { position: absolute; inset: 0 auto 0 0; width: var(--v, 0%); background: var(--pg-c); transition: width var(--pg-fast) linear; }
.pg-scope { position: relative; height: 84px; border-radius: var(--pg-radius-group); background: var(--card); box-shadow: var(--pg-edge); overflow: hidden; }
.pg-scope canvas { display: block; width: 100%; height: 100%; }
.pg-scope > .pg-label { position: absolute; left: 10px; top: 8px; }
.pg-scope > output { position: absolute; right: 10px; top: 7px; font-size: 11px; font-weight: 500; color: var(--pg-ink); font-variant-numeric: tabular-nums; }
.pg-record[aria-pressed=true] { border-color: var(--pg-bad); color: var(--pg-bad); }
[data-pg="send"]:disabled { display: none; }
.pg-record[aria-pressed=true] .pg-dot { animation: pg-blink 1s ease-in-out infinite alternate; }

.pg-form { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px 16px; }
.pg-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.pg-toolbar > .pg-spacer { flex: 1; }
.pg-field { position: relative; display: grid; gap: 5px; min-width: 0; font-size: 11px; line-height: 1.3; font-weight: 500; color: var(--pg-ink); }
.pg-box { position: relative; display: flex; align-items: center; gap: 6px; min-height: 32px; padding: 0 10px; border-radius: var(--pg-radius-control); background: var(--card); box-shadow: var(--pg-edge); }
.pg-box:focus-within { outline: 2px solid var(--ring); outline-offset: 1px; }
.pg-box input, .pg-box select { flex: 1; min-width: 0; height: 30px; padding: 0; border: 0; background: none; outline: none; font-size: 12.5px; font-weight: 400; color: var(--pg-ink); font-variant-numeric: tabular-nums; -webkit-appearance: none; appearance: none; }
.pg-box select { padding-right: 14px; cursor: pointer; }
.pg-box.pg-menu::after { content: ""; position: absolute; right: 11px; top: 50%; width: 5px; height: 5px; margin-top: -4px; border: solid var(--pg-meta); border-width: 0 1.4px 1.4px 0; transform: rotate(45deg); pointer-events: none; }
.pg-unit { flex-shrink: 0; white-space: nowrap; font-size: 11px; font-weight: 400; color: var(--pg-meta); }
.pg-field > small { font-size: 10.5px; font-weight: 400; color: var(--pg-meta); }
.pg-slider { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 6px 10px; align-items: baseline; font-size: 11px; font-weight: 500; color: var(--pg-ink); }
.pg-slider output { font-variant-numeric: tabular-nums; white-space: nowrap; }
.pg-slider input { grid-column: 1 / -1; width: 100%; height: 18px; margin: 0; accent-color: var(--pg-c); }
.pg-tabs { position: relative; display: flex; flex-wrap: wrap; gap: 2px; padding: 3px; border-radius: 999px; box-shadow: var(--pg-edge); background: var(--card); width: max-content; max-width: 100%; }
.pg-tabs button { padding: 5px 11px; border: 0; border-radius: 999px; background: transparent; font-size: 11.5px; color: var(--pg-meta); white-space: nowrap; }
.pg-tabs button[aria-selected=true] { background: var(--pg-ink); color: var(--card); font-weight: 500; }
.pg-list { position: relative; display: grid; gap: 4px; }
.pg-list button { display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%; padding: 8px 10px; border: 0; border-radius: var(--pg-radius-control); background: var(--card); box-shadow: var(--pg-edge); text-align: left; font-size: 12px; color: var(--pg-ink); }
.pg-list button small { font-size: 11px; color: var(--pg-meta); }
.pg-list button[aria-pressed=true] { box-shadow: inset 0 0 0 1.5px var(--pg-ink); font-weight: 500; }
.pg-readouts { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px; margin: 0; }
.pg-readouts > div { min-width: 0; padding: 10px 12px; border-radius: var(--pg-radius-group); background: var(--card); box-shadow: var(--pg-edge); }
.pg-readouts dt { font-size: 10.5px; line-height: 1.3; color: var(--pg-meta); }
.pg-readouts dd { margin: 3px 0 0; font-size: 18px; line-height: 1.2; font-weight: 500; letter-spacing: -.01em; color: var(--pg-ink); font-variant-numeric: tabular-nums; }
.pg-readouts dd small { display: block; margin-top: 2px; font-size: 10.5px; font-weight: 400; letter-spacing: 0; color: var(--pg-meta); }
.pg-readouts > [data-answer] { background: var(--pg-stage); box-shadow: none; }
.pg-readouts > [data-answer] dt { color: var(--pg-ink); font-weight: 500; }
.pg-readouts > [data-answer] dd { font-size: 22px; }
.pg-readouts > [data-tone=good] dd { color: var(--pg-good); }
.pg-readouts > [data-tone=bad] dd { color: var(--pg-bad); }
.pg-readouts > [data-tone=warn] dd { color: var(--pg-warn); }
.pg-badge { display: inline-flex; align-items: center; gap: 4px; padding: 1px 7px; border-radius: 999px; border: 1px solid var(--pg-hairline); background: var(--card); font-size: 10.5px; line-height: 1.4; font-weight: 500; white-space: nowrap; color: var(--pg-ink); }
.pg-badge[data-tone]:not([data-tone=""]) { border-color: transparent; }
.pg-badge[data-tone=good] { color: var(--pg-good); background: color-mix(in srgb, var(--pg-good) 12%, var(--card)); }
.pg-badge[data-tone=bad] { color: var(--pg-bad); background: color-mix(in srgb, var(--pg-bad) 12%, var(--card)); }
.pg-badge[data-tone=warn] { color: var(--pg-warn); background: color-mix(in srgb, var(--pg-warn) 14%, var(--card)); }
.pg-table { width: 100%; border-collapse: collapse; font-size: 12px; font-variant-numeric: tabular-nums; }
.pg-table th { padding: 0 8px 6px; text-align: left; font-size: 10.5px; font-weight: 400; color: var(--pg-meta); }
.pg-table td { padding: 7px 8px; border-top: 1px solid var(--pg-hairline); color: var(--pg-ink); }
.pg-table th:first-child, .pg-table td:first-child { padding-left: 0; }
.pg-table [data-num] { text-align: right; }
.pg-table tr[aria-current] td { font-weight: 500; }
.pg-chart { display: block; width: 100%; height: auto; overflow: visible; font-size: 10.5px; }
.pg-chart text { fill: var(--pg-meta); font-variant-numeric: tabular-nums; }
.pg-chart .grid { stroke: var(--pg-hairline); }
.pg-chart .axis { stroke: color-mix(in srgb, var(--foreground) 22%, var(--card)); }
.pg-chart .series { fill: none; stroke: var(--pg-ink); stroke-width: 1.6; stroke-linejoin: round; stroke-linecap: round; }
.pg-chart .series[data-tone=accent] { stroke: var(--pg-accent); }
.pg-chart .series[data-tone=meta] { stroke: var(--pg-meta); }
.pg-chart .series[data-dashed] { stroke-dasharray: 4 3; }
.pg-chart .area { fill: color-mix(in srgb, var(--pg-ink) 8%, transparent); }
.pg-chart .bar { fill: var(--pg-ink); }
.pg-chart .bar[data-tone=accent] { fill: var(--pg-accent); }
.pg-chart .bar[data-tone=meta] { fill: color-mix(in srgb, var(--foreground) 22%, var(--card)); }
.pg-chart .mark { stroke: var(--pg-bad); stroke-dasharray: 3 3; }
.pg-chart .mark-label { fill: var(--pg-bad); font-weight: 500; }
.pg-chart .now { stroke: var(--pg-ink); }
.pg-chart .now-dot { fill: var(--pg-ink); stroke: var(--card); stroke-width: 2; }
.pg-chart .label { fill: var(--pg-ink); font-weight: 500; }
.pg-board { position: relative; display: grid; grid-template-columns: repeat(var(--pg-board-cols, 3), minmax(0, 1fr)); gap: 6px; padding: 8px; border-radius: 12px; background: var(--pg-board, var(--pg-stage)); }
.pg-board button { position: relative; display: grid; place-items: center; aspect-ratio: 1; min-width: 0; padding: 0; border: 0; border-radius: var(--pg-cell-radius, 8px); background: var(--pg-cell, var(--card)); box-shadow: inset 0 1px 2px color-mix(in srgb, var(--foreground) 18%, transparent); font-size: 18px; font-weight: 600; color: var(--pg-ink); cursor: pointer; }
.pg-board[data-shape=round] { --pg-cell-radius: 50%; }
.pg-board button > i { position: absolute; inset: 8%; border-radius: inherit; background: var(--piece); box-shadow: inset 0 -3px 0 color-mix(in srgb, #000 18%, transparent); animation: pg-drop .28s var(--pg-ease, ease-out) both; }
.pg-board button > b { position: relative; }
.pg-board button[data-last] { outline: 2px solid var(--pg-ink); outline-offset: -2px; }
@keyframes pg-drop { from { transform: translateY(-40%); opacity: 0; } }
.pg-agent { display: grid; grid-template-columns: 18px minmax(0, 1fr); gap: 2px 9px; align-items: start; padding: 9px 12px; border-radius: var(--pg-radius-group); background: var(--card); box-shadow: var(--pg-edge); font-size: 12px; line-height: 1.45; color: var(--pg-body); }
.pg-agent::before { content: ""; width: 18px; height: 18px; border-radius: 50%; background: radial-gradient(circle, var(--card) 0 2.5px, transparent 3px), var(--pg-ink); }
.pg-agent[data-fresh] { animation: pg-fresh .6s ease-out; }
@keyframes pg-fresh { from { box-shadow: inset 0 0 0 1.5px var(--pg-ink); } }
[data-show][hidden] { display: none !important; }
.pg-bank { display: flex; justify-content: space-around; align-items: center; gap: 4px; }
.pg-banks { display: grid; grid-template-columns: var(--cols, 1fr 1fr); gap: 10px; }
.pg-banks + .pg-banks, .pg-surface > * + * { margin-top: 10px; }
@media (max-width: 460px) { .pg-banks { grid-template-columns: 1fr; } }
.pg-presets { display: flex; flex-wrap: wrap; gap: 6px; }
.pg-transport { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.pg-transport > div { display: flex; gap: 6px; }
.pg-transport > .pg-hint { flex: 1; min-width: 0; text-align: center; font-size: 11px; color: var(--pg-meta); }
.pg-keyboard { position: relative; height: 112px; user-select: none; -webkit-user-select: none; touch-action: none; }
.pg-keyboard > div { position: absolute; top: 0; }
.pg-keyboard .pg-w { bottom: 0; border-radius: 0 0 7px 7px; background: #fbfaf7; box-shadow: inset 0 0 0 1px rgba(0,0,0,.14), inset 0 -3px 0 rgba(0,0,0,.06); transition: background .06s, transform .06s; transform-origin: top; }
.pg-keyboard .pg-b { z-index: 1; height: 62%; border-radius: 0 0 5px 5px; background: #1d1d1f; box-shadow: inset 0 -3px 0 rgba(255,255,255,.08), 0 2px 3px rgba(0,0,0,.25); transition: background .06s, transform .06s; transform-origin: top; }
.pg-keyboard .pg-w.pg-on { background: color-mix(in srgb, var(--pg-c) 30%, #fbfaf7); transform: scaleY(.985); }
.pg-keyboard .pg-b.pg-on { background: var(--pg-c); transform: scaleY(.97); }
.pg-keyboard span { position: absolute; left: 0; right: 0; bottom: 6px; text-align: center; font-size: 9px; color: #9a968e; pointer-events: none; }
.pg-keyboard .pg-b span { bottom: 5px; color: #8a8a8e; }
.pg-keyboard .pg-c span { color: #5f5b54; font-weight: 500; }
.pg-keyboard > .pg-gesture { inset: 0; z-index: 2; display: grid; place-items: center; border: 0; border-radius: 8px; background: color-mix(in srgb, var(--card) 72%, transparent); color: var(--pg-ink); font-size: 12px; font-weight: 500; }
@media (pointer: coarse) { .pg-keyboard span.pg-key { display: none; } }
.pg-pads { display: grid; grid-template-columns: repeat(var(--pg-pad-cols, 4), minmax(0, 1fr)); gap: 6px; }
.pg-steps { display: grid; grid-template-columns: 56px repeat(var(--steps, 16), minmax(0, 1fr)); gap: 3px; align-items: center; font-size: 10px; color: var(--pg-meta); }
.pg-steps button { aspect-ratio: 1; min-width: 0; padding: 0; border: 0; border-radius: 4px; background: var(--pg-hairline); }
.pg-steps button:nth-of-type(4n+1) { background: color-mix(in srgb, var(--foreground) 14%, var(--card)); }
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
    if (u === "s") return v < 1 ? Math.round(v * 1000) + "ms" : v.toFixed(1) + "s";
    const n = Number(v).toFixed(s.step ? decimals(s.step) : Number.isInteger(Number(v)) ? 0 : Math.abs(v) < 10 ? 1 : 0);
    return u ? n + (/^[%¢°]/.test(u) ? "" : " ") + u : n;
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
  addEventListener("pointerdown", () => { const ctx = audio(); if (ctx) ctx.resume().then(() => { for (const fn of audioWaiters) fn(); audioWaiters.clear(); }).catch(() => {}); }, true);

  // Events: press, release, change, take.
  const handlers = new Map();
  const on = (type, fn) => { if (!handlers.has(type)) handlers.set(type, new Set()); handlers.get(type).add(fn); return () => handlers.get(type).delete(fn); };
  const fire = (type, detail) => { for (const fn of handlers.get(type) || []) { try { fn(detail); } catch (error) { console.error(error); } } };

  // Layer 2: parameters.
  const specs = {}, values = {};
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
  const persist = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => rawSave({ ...current(), params: { ...values } }), 150); };
  api.save = (value) => rawSave(value && typeof value === "object" && !Array.isArray(value) && Object.keys(specs).length && !("params" in value) ? { ...value, params: { ...values } } : value);
  function set(name, value, from) {
    const s = specs[name];
    if (!s) return undefined;
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
    set: (name, value) => { ready(); return set(name, value, "user"); },
    get: (name) => { ready(); return values[name]; },
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
      return () => { input.value = String(Math.round(norm(s, values[name]) * 1000)); el.querySelector("output").textContent = format(values[name], s); };
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
      const pieces = Object.fromEntries(attr(el, "pieces", "").split(",").filter(Boolean).map((p) => { const [key, color, label] = p.split(":"); return [key.trim(), { color: (color || "").trim(), label: (label || key).trim() }]; }));
      el.innerHTML = Array.from({ length: s.rows * s.cols }, (_, i) => '<button type="button" data-r="' + Math.floor(i / s.cols) + '" data-c="' + (i % s.cols) + '"></button>').join("");
      el.onclick = (e) => { const b = e.target.closest("button"); if (b) choose(name, +b.dataset.r, +b.dataset.c, "user"); };
      let previous = null;
      return () => {
        const grid = values[name];
        el.querySelectorAll("button").forEach((b) => {
          const r = +b.dataset.r, c = +b.dataset.c, v = grid[r][c], p = pieces[v];
          const key = v + "|" + (p ? p.color : "");
          if (b.__key === key) return;
          b.__key = key; b.innerHTML = "";
          if (v && p && p.color) { const i = document.createElement("i"); i.style.setProperty("--piece", p.color); b.append(i); }
          else if (v) { const t = document.createElement("b"); t.textContent = p ? p.label : v; b.append(t); }
          b.setAttribute("aria-label", "Row " + (r + 1) + ", column " + (c + 1) + (v ? ", " + (p ? p.label : v) : ", empty"));
        });
        if (previous) for (let r = 0; r < s.rows; r++) for (let c = 0; c < s.cols; c++) if (previous[r][c] !== grid[r][c]) { el.querySelector("[data-last]")?.removeAttribute("data-last"); el.querySelector('[data-r="' + r + '"][data-c="' + c + '"]').setAttribute("data-last", ""); }
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
      return () => { input.value = String(Math.round(norm(s, values[name]) * 1000)); el.querySelector("output").textContent = format(values[name], s); };
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
      if (el.tagName !== "BUTTON") { el.tabIndex = 0; el.setAttribute("role", "button"); }
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
  // chart(name, { x: { min, max, format }, y: { min, max, format }, series: [{ points, kind, tone, label, dashed }], marks: [{ y, label }], now })
  function chart(name, spec) {
    const el = document.querySelector('[data-pg="chart"][data-name="' + name + '"]');
    if (!el) return;
    const svg = el.tagName.toLowerCase() === "svg" ? el : el.querySelector("svg") || el.appendChild(svgEl("svg"));
    const W = spec.width || 480, H = spec.height || 160, pad = { l: 40, r: 56, t: 10, b: 20 };
    const all = (spec.series || []).flatMap((s) => s.points.map((p) => p[1])).filter(Number.isFinite);
    const y0 = spec.y && spec.y.min !== undefined ? spec.y.min : Math.min(0, ...all), y1 = spec.y && spec.y.max !== undefined ? spec.y.max : Math.max(1, ...all);
    const xs = (spec.series || []).flatMap((s) => s.points.map((p) => p[0]));
    const x0 = spec.x && spec.x.min !== undefined ? spec.x.min : Math.min(...xs), x1 = spec.x && spec.x.max !== undefined ? spec.x.max : Math.max(...xs);
    const yt = niceTicks(y0, y1, 3), yTop = Math.max(y1, yt.at(-1));
    const sx = (v) => pad.l + (v - x0) / ((x1 - x0) || 1) * (W - pad.l - pad.r), sy = (v) => H - pad.b - (v - y0) / ((yTop - y0) || 1) * (H - pad.t - pad.b);
    const fx = (spec.x && spec.x.format) || ((v) => format(v, {})), fy = (spec.y && spec.y.format) || ((v) => format(v, {}));
    svg.setAttribute("viewBox", "0 0 " + W + " " + H); svg.classList.add("pg-chart"); svg.replaceChildren();
    for (const v of yt) { svg.append(svgEl("line", { class: v === y0 ? "axis" : "grid", x1: pad.l, x2: W - pad.r, y1: sy(v), y2: sy(v) })); svg.append(svgEl("text", { x: pad.l - 6, y: sy(v) + 3.5, "text-anchor": "end" }, fy(v))); }
    const xt = niceTicks(x0, x1, 4);
    xt.forEach((v, i) => svg.append(svgEl("text", { x: sx(v), y: H - 5, "text-anchor": i === 0 ? "start" : i === xt.length - 1 ? "end" : "middle" }, fx(v))));
    const labels = [];
    for (const s of spec.series || []) {
      const pts = s.points.filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]));
      if (!pts.length) continue;
      if (s.kind === "bars") { const w = Math.max(2, (W - pad.l - pad.r) / pts.length * .7); for (const [x, y] of pts) svg.append(svgEl("rect", { class: "bar", "data-tone": s.tone, x: sx(x) - w / 2, y: sy(Math.max(y, y0)), width: w, height: Math.max(0, sy(y0) - sy(y)), rx: 2 })); continue; }
      let d = ""; pts.forEach(([x, y], i) => { d += i === 0 ? "M" + sx(x).toFixed(1) + " " + sy(y).toFixed(1) : s.kind === "step" ? "H" + sx(x).toFixed(1) + "V" + sy(y).toFixed(1) : "L" + sx(x).toFixed(1) + " " + sy(y).toFixed(1); });
      if (s.kind === "area") svg.append(svgEl("path", { class: "area", d: d + "V" + sy(y0) + "H" + sx(pts[0][0]).toFixed(1) + "Z" }));
      svg.append(svgEl("path", { class: "series", "data-tone": s.tone, "data-dashed": s.dashed, d }));
      if (s.label) labels.push({ x: sx(pts.at(-1)[0]) + 5, y: sy(pts.at(-1)[1]) + 3.5, text: s.label, tone: s.tone });
    }
    labels.sort((a, b) => a.y - b.y); for (let i = 1; i < labels.length; i++) labels[i].y = Math.max(labels[i].y, labels[i - 1].y + 12);
    // A label wider than the right margin sits above the line's end instead of past it.
    for (const l of labels) { const wide = l.text.length * 6 > pad.r - 6; svg.append(svgEl("text", { class: "label", x: wide ? l.x - 8 : Math.min(l.x, W - pad.r + 5), y: wide ? l.y - 10 : l.y, "text-anchor": wide ? "end" : "start" }, l.text)); }
    for (const m of spec.marks || []) { svg.append(svgEl("line", { class: "mark", x1: pad.l, x2: W - pad.r, y1: sy(m.y), y2: sy(m.y) })); if (m.label) svg.append(svgEl("text", { class: "mark-label", x: pad.l + 4, y: sy(m.y) - 4 }, m.label)); }
    if (Number.isFinite(spec.now)) { const x = sx(spec.now); svg.append(svgEl("line", { class: "now", x1: x, x2: x, y1: pad.t, y2: H - pad.b })); }
  }
  // Boards: clicking a cell, or the agent's select action, both arrive as one "select" event.
  function choose(name, r, c, from) {
    const s = specs[name];
    if (!s || s.type !== "board" || !(r >= 0 && r < s.rows && c >= 0 && c < s.cols)) throw new Error("No cell at row " + r + ", column " + c);
    if (from === "agent") { flag(name); lane("Chose row " + (r + 1) + ", column " + (c + 1) + "."); }
    fire("select", { name, row: r, col: c, value: values[name][r][c], from });
    return { board: values[name] };
  }
  // The agent lane shows what the agent last did on this card.
  let laneTimer = 0;
  function lane(text) {
    for (const el of document.querySelectorAll('[data-pg="agent"]')) {
      el.textContent = String(text).slice(0, 240); el.removeAttribute("data-fresh"); void el.offsetWidth; el.setAttribute("data-fresh", "");
    }
  }
  // Panels with data-show="param=value" (or "param!=value") appear only when it holds.
  function showWhen() {
    for (const el of document.querySelectorAll("[data-show]")) {
      const m = /^([A-Za-z][\w-]*)(!?=)(.*)$/.exec(el.dataset.show);
      if (!m) continue;
      const hit = String(values[m[1]]) === m[3];
      el.hidden = m[2] === "=" ? !hit : hit;
    }
  }
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
      else if (kind === "readouts") readouts(el);
      else if (kind === "table") { el.classList.add("pg-table-wrap"); }
      else if (kind === "chart") { el.classList.add("pg-chart"); }
      else if (kind === "agent") { el.classList.add("pg-agent"); el.setAttribute("aria-live", "polite"); if (!el.textContent.trim()) el.textContent = attr(el, "empty", "Ask me to change anything here."); }
      else if (kind === "meter") { el.classList.add("pg-meter"); el.innerHTML = "<i></i>"; el.__set = (t) => el.style.setProperty("--v", (clamp(t, 0, 1) * 100) + "%"); }
      else if (kind === "record") { el.classList.add("pg-btn", "pg-record"); el.innerHTML = '<i class="pg-dot"></i><span>Record</span>'; el.setAttribute("aria-pressed", "false"); el.onclick = () => (recording ? stopTake() : startTake()); }
      else if (kind === "send") { el.classList.add("pg-btn"); if (!el.textContent.trim()) el.textContent = "Send to agent"; el.disabled = true; el.onclick = () => { if (lastTake) api.send(attr(el, "label", "Take") + " · " + lastTake.notes.length + " notes · " + lastTake.seconds.toFixed(1) + "s", lastTake); }; }
    }
    for (const fn of afterHydrate.splice(0)) fn();
    showWhen();
  }
  on("change", ({ name }) => { for (const el of document.querySelectorAll('[data-param="' + name + '"]')) el.__paint?.(); });

  const autoActions = {
    read: () => ({ params: { ...values }, outputs: JSON.parse(JSON.stringify(outputs)) }),
    select: (name, row, col) => choose(String(name), Number(row), Number(col), "agent"),
    say: (text) => { lane(text); return { ok: true }; },
    getParams: () => ({ values: { ...values }, outputs: JSON.parse(JSON.stringify(outputs)), specs: Object.fromEntries(Object.entries(specs).map(([k, s]) => [k, { label: s.label, unit: s.unit, min: s.min, max: s.max, options: s.options && s.options.map((o) => o.value), type: s.type, rows: s.rows, cols: s.cols }])) }),
    setParams: (next) => { const out = {}; for (const [k, v] of Object.entries(next && typeof next === "object" ? next : {})) if (specs[k]) out[k] = set(k, v, "agent"); return { set: out }; },
    play: (notes, bpm) => play(notes, bpm),
    take: () => lastTake,
  };
  api.params = params;
  const readyFirst = (fn) => (...args) => { ready(); return fn(...args); };
  api.ui = Object.freeze({ show: readyFirst(show), table: readyFirst(table), chart: readyFirst(chart), say: lane, icon, format: (v, spec) => format(v, spec || {}), dragValue, pressable, audio, audioReady, onAudio: (fn) => (audioReady() ? fn() : audioWaiters.add(fn)), on, press: (id) => press(id, "user"), release: (id) => release(id, "user"), play, scope: (el) => el.__scope, meter: (el) => el.__set, steps: (el) => el.__now, noteName, hydrate: () => hydrate(document), take: () => lastTake });
  const start = () => {
    hydrate(document);
    if (Object.keys(specs).length || document.querySelector("[data-pg]")) api.expose(autoActions);
    syncRecorders();
  };
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", start); else start();
`;
