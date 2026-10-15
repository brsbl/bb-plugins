// Higher-level component sets, composed from the base library in controls.ts.
// Calculator set: scrubbable numbers inside a sentence, one answer, a breakdown bar.
// Simulation set: a flow that shows the items moving through the system, a run bar
// (play, pause, scrub) driving a compact timeline chart, and one outcome sentence.
// The music set lives in controls.ts.

export const SETS_CSS = String.raw`
.pg-sentence { margin-bottom: 0; font-size: 15px; line-height: 1.7; color: var(--pg-body); text-wrap: pretty; }
.pg-scrub { position: relative; display: inline-block; padding: 0 2px; border-radius: 4px; color: var(--pg-accent-ink, var(--pg-ink)); font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; cursor: ew-resize; touch-action: none; user-select: none; -webkit-user-select: none; background: color-mix(in srgb, var(--pg-accent) 10%, transparent); box-shadow: inset 0 -1.5px 0 color-mix(in srgb, var(--pg-accent) 55%, transparent); transition: background .15s; }
.pg-scrub:hover, .pg-scrub.pg-grab { background: color-mix(in srgb, var(--pg-accent) 18%, transparent); }
.pg-scrub:focus-visible { outline: 2px solid var(--ring); outline-offset: 1px; }
.pg-scrub input { width: 6ch; padding: 0; border: 0; background: none; outline: none; font: inherit; color: inherit; text-align: center; }
.pg-scrub[data-agent]::after { top: -12px; }
.pg-answer { display: grid; gap: 2px; }
.pg-answer > .pg-label { margin: 0; }
.pg-answer > strong { display: flex; align-items: center; gap: 8px; font-size: 24px; line-height: 1.2; font-weight: 600; letter-spacing: -.015em; color: var(--pg-ink); font-variant-numeric: proportional-nums; }
.pg-answer > span { font-size: 12.5px; line-height: 1.45; color: var(--pg-body); }
.pg-answer > .pg-label + strong { margin-top: 2px; }
.pg-answer[data-long] > strong { font-size: 20px; letter-spacing: -.01em; }
.pg-tone { display: inline-grid; place-items: center; flex-shrink: 0; width: 16px; height: 16px; border-radius: 50%; background: var(--t); color: var(--card); font-size: 10px; font-style: normal; font-weight: 700; letter-spacing: 0; line-height: 1; }
.pg-tone[data-tone=good] { --t: var(--pg-good); } .pg-tone[data-tone=warn] { --t: var(--pg-warn); } .pg-tone[data-tone=bad] { --t: var(--pg-bad); }
.pg-breakdown { display: grid; gap: 10px; }
.pg-breakdown > .pg-bar { display: flex; height: 12px; gap: 2px; overflow: hidden; border-radius: 6px; background: var(--pg-hairline); }
.pg-breakdown > .pg-bar > i { min-width: 2px; background: var(--seg); transition: flex-grow .35s var(--pg-ease, ease); }
.pg-breakdown > ul { display: grid; gap: 6px; margin: 0; padding: 0; list-style: none; }
.pg-breakdown li { display: grid; grid-template-columns: 10px minmax(0, 1fr) auto; align-items: center; gap: 8px; font-size: 12px; color: var(--pg-body); }
.pg-breakdown li::before { content: ""; width: 10px; height: 10px; border-radius: 3px; background: var(--seg); }
.pg-breakdown li > b { font-weight: 500; color: var(--pg-ink); font-variant-numeric: tabular-nums; }
/* The run bar: play and the time. On its own it has a scrubber; tied to a chart (data-chart), you scrub by dragging on the chart. */
.pg-run { display: flex; align-items: center; gap: 10px; }
.pg-run > button { flex-shrink: 0; width: 28px; height: 28px; }
.pg-run input[type=range] { flex: 1; min-width: 0; height: 18px; margin: 0; accent-color: var(--pg-ink); }
.pg-run[data-chart] input[type=range] { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
.pg-run output { font-size: 12px; font-weight: 500; color: var(--pg-ink); font-variant-numeric: tabular-nums; white-space: nowrap; }
.pg-run[data-chart] { gap: 8px; }
.pg-run[data-chart] > button { width: 26px; height: 26px; }
.pg-run[data-chart] output { font-weight: 400; color: var(--pg-body); }
.pg-chart-head { display: flex; align-items: center; gap: 12px; min-height: 26px; }
.pg-chart-head > .pg-chart-legend { margin-left: auto; justify-content: flex-end; }
/* Result: the answer beside what explains it (a breakdown, or a few stats). */
.pg-result { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); column-gap: 24px; row-gap: 14px; align-items: start; }
.pg-result.pg-surface { padding: 16px; }
.pg-result > * { margin-top: 0 !important; }
.pg-result > .pg-breakdown { padding-top: 3px; }
.pg-result > .pg-notes, .pg-result > p { grid-column: 1 / -1; margin: 0; font-size: 12px; line-height: 1.45; color: var(--pg-meta); }
.pg-result:has(> .pg-stats) { grid-template-columns: minmax(0, 1fr) auto; align-items: end; }
.pg-stats { display: grid; gap: 8px; margin: 0; text-align: right; }
.pg-stats dt { font-size: 11px; font-weight: 500; color: var(--pg-meta); }
.pg-stats dd { margin: 1px 0 0; font-size: 15px; font-weight: 500; color: var(--pg-ink); font-variant-numeric: tabular-nums; }
@container (max-width: 420px) {
  .pg-result, .pg-result:has(> .pg-stats) { grid-template-columns: 1fr; }
  .pg-stats { grid-template-columns: 1fr 1fr; text-align: left; }
}
.pg-sentence { max-width: 62ch; }
/* Simulation set: the flow (stations left to right, items travelling the links) and the outcome sentence. */
.pg-flow { position: relative; min-width: 0; }
.pg-flow > svg { display: block; width: 100%; height: auto; overflow: visible; font-size: 11.5px; }
.pg-flow .link { fill: none; stroke: color-mix(in srgb, var(--foreground) 20%, var(--card)); stroke-width: 1.5; stroke-linecap: round; }
.pg-flow .link[data-drop] { stroke-dasharray: 3 4; }
.pg-flow .head { fill: color-mix(in srgb, var(--foreground) 20%, var(--card)); }
.pg-flow .link-label { fill: var(--pg-meta); font-size: 10.5px; }
.pg-flow .shell { fill: var(--card); stroke: color-mix(in srgb, var(--foreground) 11%, var(--card)); }
.pg-flow [data-kind=drop] .shell { fill: color-mix(in srgb, var(--pg-bad) 7%, var(--card)); stroke: color-mix(in srgb, var(--pg-bad) 30%, var(--card)); }
.pg-flow [data-kind=sink] .shell { fill: color-mix(in srgb, var(--pg-good) 6%, var(--card)); stroke: color-mix(in srgb, var(--pg-good) 28%, var(--card)); }
.pg-flow [data-status=down] .shell { fill: var(--card); stroke: var(--pg-bad); stroke-dasharray: 4 3; }
.pg-flow [data-status=down] :is(.label, .value, .n, .wait):not([data-state]) { opacity: .45; }
.pg-flow [data-status=up] .value[data-state] { fill: var(--pg-good); }
.pg-flow [data-status=busy] .value[data-state] { fill: var(--pg-warn); }
.pg-flow [data-status=down] .value[data-state] { fill: var(--pg-bad); }
.pg-flow .label { fill: var(--pg-body); font-weight: 500; }
.pg-flow .value { fill: var(--pg-ink); font-size: 16px; font-weight: 600; letter-spacing: -.01em; font-variant-numeric: tabular-nums; }
.pg-flow .n { fill: var(--pg-meta); font-variant-numeric: tabular-nums; }
.pg-flow .wait { fill: var(--pg-accent); }
.pg-flow .more { fill: var(--pg-meta); font-size: 10.5px; font-variant-numeric: tabular-nums; }
.pg-flow .track { fill: var(--pg-hairline); }
.pg-flow .fill { fill: var(--pg-accent); }
.pg-flow .badge { stroke: var(--card); stroke-width: 2; }
.pg-flow [data-status=up] .badge { fill: var(--pg-good); }
.pg-flow [data-status=busy] .badge { fill: var(--pg-warn); }
.pg-flow [data-status=down] .badge { fill: var(--pg-bad); }
.pg-flow .item { fill: var(--pg-accent); }
.pg-flow .item[data-tone=good] { fill: var(--pg-good); }
.pg-flow .item[data-tone=bad] { fill: var(--pg-bad); }
.pg-flow .item[data-tone=warn] { fill: var(--pg-warn); }
:where(body:has([data-pg]) > .pg-outcome) { margin-top: 22px; }
.pg-outcome { margin-bottom: 0; max-width: 62ch; font-size: 14px; line-height: 1.5; color: var(--pg-body); text-wrap: pretty; }
.pg-form > .pg-field > :is(.pg-stepper, .pg-seg) { justify-self: start; }
.pg-outcome b { font-weight: 600; color: var(--pg-ink); }
.pg-surface:has(> .pg-flow) { display: grid; gap: 14px; padding: 16px; }
.pg-surface > .pg-flow + .pg-chart { padding-top: 12px; border-top: 1px solid var(--pg-hairline); }
.pg-chart[data-compact] { gap: 6px; }
.pg-chart[data-compact] .pg-chart-head { min-height: 22px; }
.pg-chart[data-compact] .pg-run { gap: 6px; }
.pg-chart[data-compact] .pg-run > button { width: 22px; height: 22px; }
.pg-chart[data-compact] .pg-run > button .pg-glyph { width: 10px; height: 10px; }
.pg-chart[data-compact] .pg-run output { font-size: 11.5px; color: var(--pg-meta); }
.pg-chart[data-compact] > svg { font-size: 10.5px; }
/* Game set: whose turn it is, and a new-game button, above the board. */
.pg-turn { max-width: 420px; display: flex; align-items: center; gap: 8px; min-height: 30px; font-size: 13px; font-weight: 500; color: var(--pg-ink); }
.pg-turn > i { width: 10px; height: 10px; border-radius: 50%; background: var(--piece, var(--pg-meta)); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--foreground) 15%, transparent); }
.pg-turn[data-turn=me] > i { animation: pg-blink .9s ease-in-out infinite alternate; }
.pg-turn > span { flex-shrink: 0; white-space: nowrap; }
.pg-turn > small { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; font-weight: 400; color: var(--pg-meta); }
.pg-turn > button { flex-shrink: 0; white-space: nowrap; }
.pg-turn > .pg-btn[data-primary] { background: var(--pg-ink); border-color: var(--pg-ink); color: var(--card); }
.pg-turn > button { margin-left: auto; }
.pg-turn > button + button { margin-left: 0; }
.pg-turn > .pg-tone { width: 16px; height: 16px; animation: none; box-shadow: none; }
/* Guide set: one step at a time, with progress and Back/Next. */
.pg-guide { display: grid; gap: 14px; }
.pg-guide-head { display: grid; gap: 8px; }
.pg-guide-head > p { margin: 0; font-size: 11px; font-weight: 600; letter-spacing: .05em; text-transform: uppercase; color: var(--pg-accent); }
.pg-guide-bar { display: grid; grid-template-columns: repeat(var(--n), minmax(0, 1fr)); gap: 4px; }
.pg-guide-bar > i { height: 4px; border-radius: 2px; background: var(--pg-hairline); }
.pg-guide-bar > i[data-on] { background: var(--pg-accent); }
.pg-guide > section[data-step] { display: grid; gap: 10px; }
.pg-guide > section[data-step][hidden] { display: none; }
.pg-guide > section > :is(h3, h4) { margin: 0; font-size: 15px; font-weight: 600; color: var(--pg-ink); }
.pg-guide > section > p { margin: 0; font-size: 13px; line-height: 1.5; color: var(--pg-body); }
.pg-guide > section > :is(svg, figure, .pg-figure) { display: block; width: 100%; height: auto; margin: 0; border-radius: var(--pg-radius-group); background: var(--pg-stage); }
.pg-guide-nav { display: flex; align-items: center; gap: 8px; padding-top: 12px; border-top: 1px solid var(--pg-hairline); }
.pg-guide-nav > span { margin-right: auto; font-size: 12px; color: var(--pg-meta); font-variant-numeric: tabular-nums; }
.pg-guide-nav > button[data-primary] { background: var(--pg-ink); border-color: var(--pg-ink); color: var(--card); }
/* Photos: one tall photo beside two stacked ones (or one or two). Broken links disappear. */
[data-pg=photos] { display: grid; grid-template-columns: 3fr 2fr; grid-template-rows: 1fr 1fr; gap: 4px; height: 240px; border-radius: var(--pg-radius-panel); overflow: hidden; }
[data-pg=photos] > img { width: 100%; height: 100%; min-height: 0; aspect-ratio: auto; border-radius: 0; object-fit: cover; display: block; background: var(--pg-stage); }
[data-pg=photos] > img:first-child { grid-row: span 2; }
[data-pg=photos]:has(> img:only-child) { grid-template-columns: 1fr; }
[data-pg=photos]:has(> img:nth-child(2):last-child) > img { grid-row: span 2; }
/* Anatomy figures (skills.wheresryan.sh/anatomy) sit in the card instead of on their own page. */
body.iso { background: transparent; }
body.iso .iso-page { width: 100%; margin: 0 auto; }
:where(.pg-turn + [data-pg=board]) { max-width: 420px; margin-top: 10px; }
`;

// Runs inside the bridge, after controls.ts's runtime, sharing its scope.
// It must not contain backticks or "${".
export const SETS_RUNTIME = String.raw`
  // Calculator set: a number inside a sentence that you drag left or right, or click to type.
  BUILD.scrub = function (el, name) {
    const s = specs[name];
    el.classList.add("pg-scrub"); el.tabIndex = 0; el.setAttribute("role", "slider"); el.setAttribute("aria-label", s.label);
    let drag = null, moved = false;
    const t = () => norm(s, values[name]);
    el.addEventListener("pointerdown", (e) => { if (e.button !== 0 || el.querySelector("input")) return; e.preventDefault(); el.setPointerCapture(e.pointerId); drag = { x: e.clientX, t: t() }; moved = false; el.classList.add("pg-grab"); });
    el.addEventListener("pointermove", (e) => { if (!drag) return; const dx = e.clientX - drag.x; if (Math.abs(dx) > 2) moved = true; if (moved) set(name, denorm(s, drag.t + dx / (e.shiftKey ? 900 : 300))); });
    el.addEventListener("pointerup", () => {
      el.classList.remove("pg-grab"); const was = drag; drag = null;
      if (!was || moved) return;
      const input = document.createElement("input"); input.type = "number"; input.value = String(values[name]); input.step = String(s.step || "any");
      el.replaceChildren(input); input.focus(); input.select();
      let closed = false;
      const done = (commit) => { if (closed) return; closed = true; const typed = input.value; input.remove(); if (commit && typed !== "") set(name, Number(typed)); el.__paint(); el.focus(); };
      input.addEventListener("keydown", (e) => { if (e.key === "Enter") done(true); if (e.key === "Escape") done(false); });
      input.addEventListener("blur", () => done(true), { once: true });
    });
    el.addEventListener("pointercancel", () => { drag = null; el.classList.remove("pg-grab"); });
    el.addEventListener("keydown", (e) => { const step = { ArrowUp: .02, ArrowRight: .02, ArrowDown: -.02, ArrowLeft: -.02 }[e.key]; if (step) { e.preventDefault(); set(name, denorm(s, t() + step)); } });
    return () => {
      if (el.querySelector("input")) return;
      const prefix = attr(el, "prefix", "");
      el.textContent = prefix + format(values[name], { ...s, unit: s.unit });
      el.setAttribute("aria-valuetext", el.textContent);
    };
  };
  const TONES = { good: "\u2713", warn: "!", bad: "\u00d7" };
  function answer(name, a) {
    const o = a || {};
    outputs[name] = { value: o.value, label: o.label || null, detail: o.detail || null, tone: o.tone || null };
    for (const el of document.querySelectorAll('[data-pg="answer"][data-name="' + name + '"]')) {
      el.classList.add("pg-answer"); el.setAttribute("aria-live", "polite");
      const label = document.createElement("p"); label.className = "pg-label"; label.textContent = o.label || attr(el, "label", "");
      const value = document.createElement("strong");
      if (TONES[o.tone]) { const t = document.createElement("i"); t.className = "pg-tone"; t.dataset.tone = o.tone; t.setAttribute("aria-hidden", "true"); t.textContent = TONES[o.tone]; value.append(t); }
      value.append(String(o.value ?? ""));
      const detail = document.createElement("span"); detail.textContent = o.detail || "";
      el.replaceChildren(...[label.textContent ? label : null, value, o.detail ? detail : null].filter(Boolean));
      if (o.tone) el.dataset.tone = o.tone; else delete el.dataset.tone;
      if (String(o.value ?? "").length > 14) el.dataset.long = ""; else delete el.dataset.long;
    }
  }
  const SEGMENTS = ["var(--pg-accent)", "color-mix(in srgb, var(--pg-accent) 62%, var(--card))", "color-mix(in srgb, var(--pg-accent) 36%, var(--card))", "color-mix(in srgb, var(--foreground) 35%, var(--card))", "color-mix(in srgb, var(--foreground) 18%, var(--card))"];
  // breakdown(name, [{ label, value, display }]): where a total goes, as one bar and a legend.
  function breakdown(name, parts) {
    const list = (Array.isArray(parts) ? parts : []).filter((p) => p && Number(p.value) > 0);
    outputs[name] = { value: list.map((p) => ({ label: p.label, value: p.value })) };
    for (const el of document.querySelectorAll('[data-pg="breakdown"][data-name="' + name + '"]')) {
      el.classList.add("pg-breakdown");
      const bar = document.createElement("div"); bar.className = "pg-bar"; bar.setAttribute("aria-hidden", "true");
      const legend = document.createElement("ul");
      list.forEach((p, i) => {
        const seg = p.color || SEGMENTS[i % SEGMENTS.length];
        const piece = document.createElement("i"); piece.style.setProperty("--seg", seg); piece.style.flexGrow = String(p.value); bar.append(piece);
        const li = document.createElement("li"); li.style.setProperty("--seg", seg);
        const label = document.createElement("span"); label.textContent = p.label;
        const value = document.createElement("b"); value.textContent = p.display || format(p.value, {});
        li.append(label, value); legend.append(li);
      });
      el.replaceChildren(bar, legend);
    }
  }

  // A run bar: play, pause, replay and scrub time. ui.run(name, { tick(dt, t), seek(t), end(), format(t) }),
  // where format turns t into the model's own time ("minute 42") for the readout.
  // With data-chart="<chart name>" it sits above that chart and dragging on the chart scrubs.
  const runs = {};
  function runBar(el) {
    el.classList.add("pg-run");
    const name = attr(el, "name", "run"), duration = num(el, "duration", 30), unit = attr(el, "unit", "s");
    const target = attr(el, "chart", "");
    el.innerHTML = (target ? '<button type="button" class="pg-icon-btn">' : '<button type="button" class="pg-icon-btn" data-primary>') + '</button><input type="range" min="0" step="0.01"><output></output>';
    const [play, scrub, out] = el.children;
    const REPLAY = '<svg class="pg-glyph" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5a5.5 5.5 0 1 1-5.2 3.8.8.8 0 1 1 1.5.5A4 4 0 1 0 8 4h-1l1.2 1.2-1.1 1.1L4.9 4.1 7.1 1.9l1.1 1.1L7.4 3H8Z"/></svg>';
    scrub.max = String(duration); scrub.setAttribute("aria-label", "Time");
    const r = { t: 0, playing: false, frame: 0, last: 0, visible: true, handlers: null, duration };
    const paint = () => { scrub.value = String(r.t); out.textContent = r.handlers && typeof r.handlers.format === "function" ? String(r.handlers.format(r.t)) : format(Number(r.t.toFixed(1)), { step: .1 }) + " " + unit; scrub.setAttribute("aria-valuetext", out.textContent); const ended = !r.playing && r.t >= r.duration; play.innerHTML = ended ? REPLAY : icon(r.playing ? "pause" : "play"); play.setAttribute("aria-label", ended ? "Replay" : r.playing ? "Pause" : "Play"); };
    const tick = (now) => {
      r.frame = 0;
      if (!r.playing || !r.visible || document.hidden) { r.last = 0; return; }
      const dt = r.last ? Math.min(.05, (now - r.last) / 1000) : 1 / 60; r.last = now;
      r.t += dt * num(el, "speed", 1);
      if (r.t >= r.duration) { r.t = r.duration; r.playing = false; r.handlers && r.handlers.end && r.handlers.end(); }
      r.handlers && r.handlers.tick && r.handlers.tick(dt * num(el, "speed", 1), r.t);
      paint();
      if (r.playing) r.frame = requestAnimationFrame(tick);
    };
    const kick = () => { if (r.playing && r.visible && !r.frame) r.frame = requestAnimationFrame(tick); };
    new IntersectionObserver((entries) => { r.visible = entries[entries.length - 1].isIntersecting; kick(); }).observe(el);
    document.addEventListener("visibilitychange", kick);
    r.api = {
      get t() { return r.t; }, get playing() { return r.playing; },
      play() { if (r.t >= r.duration) r.t = 0; r.playing = true; paint(); kick(); },
      pause() { r.playing = false; if (r.frame) cancelAnimationFrame(r.frame); r.frame = 0; r.last = 0; paint(); },
      seek(t) { r.t = clamp(Number(t) || 0, 0, r.duration); r.handlers && r.handlers.seek && r.handlers.seek(r.t); paint(); },
      length(seconds) { r.duration = Math.max(1, Number(seconds) || r.duration); scrub.max = String(r.duration); paint(); },
    };
    play.onclick = () => (r.playing ? r.api.pause() : r.api.play());
    scrub.addEventListener("input", () => { r.api.pause(); r.api.seek(Number(scrub.value)); });
    if (target) afterHydrate.push(() => {
      const fig = document.querySelector('[data-pg="chart"][data-name="' + target + '"]'), c = fig && fig.__chart;
      if (!c) return;
      fig.dataset.seek = "";
      const head = document.createElement("div"); head.className = "pg-chart-head"; fig.insertBefore(head, c.legend); head.append(el, c.legend);
      const at = (e) => { if (!c.ix) return; r.api.pause(); r.api.seek(c.ix(e.clientX - c.svg.getBoundingClientRect().left)); };
      c.svg.addEventListener("pointerdown", (e) => { c.svg.setPointerCapture(e.pointerId); at(e); });
      c.svg.addEventListener("pointermove", (e) => { if (c.svg.hasPointerCapture(e.pointerId)) at(e); });
    });
    runs[name] = r; r.paint = paint; paint();
  }
  function run(name, handlers) {
    ready();
    const r = runs[name];
    if (!r) throw new Error("No run bar named " + name);
    r.handlers = handlers || {};
    r.paint();
    if (attr(document.querySelector('[data-pg="run"][data-name="' + name + '"]'), "autoplay", "true") !== "false" && !reduced) r.api.play();
    return r.api;
  }
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Simulation set: the flow. ui.flow(name, { stations: [{ id, label, kind }], links: [[from, to, label]] })
  // draws the system (kinds: source, queue, worker, sink, drop) left to right, or stacked when the card is
  // narrow, and returns send (an item travels a link), count, status and clear. read() includes it.
  const FLOW_KINDS = ["source", "queue", "worker", "sink", "drop"];
  const FLOW_MAX_DOTS = 60, FLOW_SPACING = 100, FLOW_BACKLOG = 420, FLOW_CLUSTER = 8;
  const flowDots = new Set();
  let flowFrame = 0, flowBatch = 0, flowBatchQueued = false;
  const bez = (p, k) => { const u = 1 - k; return [0, 1].map((i) => u * u * u * p[0][i] + 3 * u * u * k * p[1][i] + 3 * u * k * k * p[2][i] + k * k * k * p[3][i]); };
  const ease = (k) => (k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  function flowTick(now) {
    flowFrame = 0;
    for (const d of flowDots) {
      if (now < d.start) continue;
      let k = (now - d.start) / d.hop.dur;
      if (k >= 1 && d.i < d.hops.length - 1) { d.i++; d.hop = d.hops[d.i]; d.start = now; k = 0; if (d.i === d.hops.length - 1 && d.tone) d.el.dataset.tone = d.tone; }
      if (k >= 1) { d.el.remove(); flowDots.delete(d); d.flow.dots--; continue; }
      const p = bez(d.hop.path, ease(k)), off = d.off * Math.sin(Math.PI * k);
      d.el.setAttribute("cx", (p[0] + d.hop.nx * off).toFixed(1)); d.el.setAttribute("cy", (p[1] + d.hop.ny * off).toFixed(1)); d.el.removeAttribute("visibility");
    }
    if (flowDots.size) flowFrame = requestAnimationFrame(flowTick);
  }
  function dropDots(f) { for (const d of flowDots) if (d.flow === f) { d.el.remove(); flowDots.delete(d); } f.dots = 0; for (const l of f.links.values()) l.next = 0; f.groups = {}; }
  function flowHost(el) {
    if (el.__flow) return el.__flow;
    el.classList.add("pg-flow");
    const svg = svgEl("svg", { role: "img", "aria-label": attr(el, "label", attr(el, "name", "Flow")) });
    const sr = document.createElement("ul"); sr.className = "pg-sr";
    el.replaceChildren(svg, sr);
    const f = { el, svg, sr, name: attr(el, "name", "flow"), stations: [], at: {}, links: new Map(), groups: {}, dots: 0, visible: true, width: 0 };
    el.__flow = f;
    new IntersectionObserver((entries) => { f.visible = entries[entries.length - 1].isIntersecting; if (!f.visible) dropDots(f); }).observe(el);
    new ResizeObserver(() => { const w = Math.round(el.getBoundingClientRect().width); if (f.stations.length && w && Math.abs(w - f.width) > 1) layoutFlow(f); }).observe(el);
    return f;
  }
  function layoutFlow(f) {
    dropDots(f);
    const W = Math.round(f.el.getBoundingClientRect().width) || 480; f.width = W;
    const main = f.stations.filter((s) => s.kind !== "drop"), drops = f.stations.filter((s) => s.kind === "drop");
    const idx = (id) => main.findIndex((s) => s.id === id);
    const arcs = f.spec.links.some(([a, b]) => idx(a) >= 0 && idx(b) >= 0 && idx(b) !== idx(a) + 1);
    const NH = 56, n = Math.max(1, main.length);
    const wide = Math.min(140, (W - (n - 1) * 40) / n);
    const vertical = n > 1 && wide < 92;
    const box = {}, used = {};
    const feeder = (id) => { const l = f.spec.links.find(([a, b]) => b === id && idx(a) >= 0); return l ? l[0] : main.length ? main[main.length - 1].id : null; };
    if (!vertical) {
      const top = arcs ? 34 : 1, gap = n > 1 ? (W - n * wide) / (n - 1) : 0;
      main.forEach((s, i) => { box[s.id] = { x: n > 1 ? i * (wide + gap) : (W - wide) / 2, y: top, w: wide, h: NH }; });
      drops.forEach((s) => { const fb = box[feeder(s.id)] || { x: 0 }; const k = used[fb.x] = (used[fb.x] || 0) + 1; box[s.id] = { x: clamp(fb.x + (k - 1) * (wide + 12), 0, W - wide), y: top + NH + 44, w: wide, h: NH }; });
    } else {
      const side = arcs ? 30 : 0, dw = drops.length ? clamp((W - side) * .34, 92, 150) : 0;
      const mw = Math.min(240, W - side - (drops.length ? dw + 72 : 0));
      main.forEach((s, i) => { box[s.id] = { x: side, y: 1 + i * (NH + 48), w: mw, h: NH }; });
      drops.forEach((s) => { const fb = box[feeder(s.id)] || { y: 1 }; const k = used[fb.y] = (used[fb.y] || 0) + 1; box[s.id] = { x: W - dw, y: fb.y + (k - 1) * (NH + 10), w: dw, h: NH }; });
    }
    const H = Math.ceil(Math.max(...Object.values(box).map((b) => b.y + b.h)) + 1);
    const svg = f.svg; svg.setAttribute("viewBox", "0 0 " + W + " " + H); svg.replaceChildren();
    f.layer = svgEl("g"); f.vertical = vertical;
    const side = (b, at) => (at === "r" ? [b.x + b.w, b.y + b.h / 2] : at === "l" ? [b.x, b.y + b.h / 2] : at === "t" ? [b.x + b.w / 2, b.y] : [b.x + b.w / 2, b.y + b.h]);
    const lerp = (p, q, k) => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k];
    f.links = new Map();
    for (const [from, to, label] of f.spec.links) {
      const A = box[from], B = box[to];
      if (!A || !B) continue;
      const ia = idx(from), ib = idx(to);
      let p0, p3, p1, p2;
      if (ia >= 0 && ib === ia + 1) { p0 = side(A, vertical ? "b" : "r"); p3 = side(B, vertical ? "t" : "l"); p1 = lerp(p0, p3, 1 / 3); p2 = lerp(p0, p3, 2 / 3); }
      else if (ib < 0 || ia < 0) {
        if (vertical) { p0 = side(A, "r"); p3 = side(B, "l"); const m = (p0[0] + p3[0]) / 2; p1 = [m, p0[1]]; p2 = [m, p3[1]]; }
        else { p0 = side(A, "b"); p3 = side(B, "t"); const m = (p0[1] + p3[1]) / 2; p1 = [p0[0], m]; p2 = [p3[0], m]; }
      } else if (vertical) { p0 = side(A, "l"); p3 = side(B, "l"); p1 = [A.x - 30, p0[1]]; p2 = [B.x - 30, p3[1]]; }
      else { p0 = side(A, "t"); p3 = side(B, "t"); p1 = [p0[0], A.y - 40]; p2 = [p3[0], B.y - 40]; }
      const path = [p0, p1, p2, p3], drop = ib < 0;
      const length = Math.hypot(p3[0] - p0[0], p3[1] - p0[1]) + (ia >= 0 && ib >= 0 && ib !== ia + 1 ? 60 : 0);
      svg.append(svgEl("path", { class: "link", "data-drop": drop ? "" : undefined, d: "M" + p0.join(" ") + "C" + p1.join(" ") + " " + p2.join(" ") + " " + p3.join(" ") }));
      const dx = p3[0] - p2[0] || p3[0] - p0[0], dy = p3[1] - p2[1] || p3[1] - p0[1], len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
      const tip = [p3[0] - ux * 1, p3[1] - uy * 1];
      svg.append(svgEl("path", { class: "head", d: "M" + tip.join(" ") + "L" + (tip[0] - ux * 6 - uy * 3.5) + " " + (tip[1] - uy * 6 + ux * 3.5) + "L" + (tip[0] - ux * 6 + uy * 3.5) + " " + (tip[1] - uy * 6 - ux * 3.5) + "Z" }));
      if (label) {
        const mid = bez(path, .5), flat = Math.abs(p3[0] - p0[0]) >= Math.abs(p3[1] - p0[1]);
        svg.append(svgEl("text", flat ? { class: "link-label", x: mid[0], y: mid[1] - 13, "text-anchor": "middle" } : { class: "link-label", x: mid[0] + 15, y: mid[1] + 3.5 }, String(label)));
      }
      f.links.set(from + ">" + to, { path, nx: -uy, ny: ux, dur: clamp(length / 200, .45, 1.2) * 1000, next: 0 });
    }
    for (const s of f.stations) {
      const b = box[s.id], g = svgEl("g", { class: "node", "data-kind": s.kind });
      const round = s.kind === "source" || s.kind === "sink" || s.kind === "drop";
      g.append(svgEl("rect", { class: "shell", x: b.x + .5, y: b.y + .5, width: b.w - 1, height: b.h - 1, rx: round ? 16 : 10 }));
      const pad = 14, fit = Math.max(4, Math.floor((b.w - pad * 2) / 6.4));
      const name = s.label.length > fit ? s.label.slice(0, fit - 1).trimEnd() + "…" : s.label;
      const label = svgEl("text", { class: "label", x: b.x + pad, y: b.y + 21 }, name);
      if (name !== s.label) label.append(svgEl("title", {}, s.label));
      const n = svgEl("text", { class: "n", x: b.x + b.w - pad, y: b.y + 21, "text-anchor": "end" });
      const value = svgEl("text", { class: "value", x: b.x + pad, y: b.y + 43 });
      const line = svgEl("g");
      const badge = svgEl("circle", { class: "badge", cx: b.x + b.w - 5, cy: b.y + 5, r: 4.5, visibility: "hidden" });
      g.append(label, n, value, line, badge); svg.append(g);
      const at = f.at[s.id]; Object.assign(at, { b, g, label, n, value, line, badge, pad });
      paintStation(f, s.id);
    }
    svg.append(f.layer);
  }
  function paintStation(f, id) {
    const a = f.at[id], s = a.s;
    if (!a.g) return;
    const b = a.b, pad = a.pad, shown = a.text !== null ? a.text : format(a.count, {});
    if (a.status) a.g.dataset.status = a.status; else delete a.g.dataset.status;
    a.badge.setAttribute("visibility", a.status ? "visible" : "hidden");
    a.line.replaceChildren();
    if (s.kind === "queue") {
      a.value.textContent = "";
      a.n.textContent = a.max !== null ? shown + " / " + format(a.max, {}) : shown;
      const y = b.y + 38, room = b.w - pad * 2;
      if (a.max !== null) {
        a.line.append(svgEl("rect", { class: "track", x: b.x + pad, y, width: room, height: 6, rx: 3 }));
        const w = room * clamp(a.count / (a.max || 1), 0, 1);
        if (w > 0) a.line.append(svgEl("rect", { class: "fill", x: b.x + pad, y, width: Math.max(6, w), height: 6, rx: 3 }));
      } else {
        const fit = Math.max(1, Math.floor((room + 3) / 9)), whole = Math.max(0, Math.round(a.count)), over = whole > fit;
        const dots = over ? fit - 3 : whole;
        for (let i = 0; i < dots; i++) a.line.append(svgEl("circle", { class: "wait", cx: b.x + pad + 3 + i * 9, cy: y + 3, r: 3 }));
        if (over) a.line.append(svgEl("text", { class: "more", x: b.x + b.w - pad, y: y + 7, "text-anchor": "end" }, "+" + format(whole - dots, {})));
        if (!whole) a.line.append(svgEl("text", { class: "more", x: b.x + pad, y: y + 7 }, "empty"));
      }
    } else {
      a.n.textContent = "";
      const word = a.text === null && a.count === null && a.status ? { up: "Up", down: "Down", busy: "Busy" }[a.status] : "";
      a.value.textContent = word || (a.text !== null || a.count !== null ? shown : "");
      if (word) a.value.dataset.state = ""; else delete a.value.dataset.state;
    }
    if (a.li) a.li.textContent = s.label + ": " + (a.count === null ? "" : shown) + (a.max !== null ? " of " + a.max : "") + (a.status ? ", " + a.status : "");
  }
  function flowRead(f) {
    outputs[f.name] = { value: { stations: Object.fromEntries(f.stations.map((s) => { const a = f.at[s.id]; return [s.id, { label: s.label, kind: s.kind, count: a.count, max: a.max, text: a.text, status: a.status }]; })) } };
  }
  function flow(name, spec) {
    const el = document.querySelector('[data-pg="flow"][data-name="' + name + '"]');
    if (!el) throw new Error("No flow named " + name);
    const f = flowHost(el), o = spec || {};
    const stations = (Array.isArray(o.stations) ? o.stations : []).slice(0, 12).map((s) => ({ id: String(s.id), label: String(s.label ?? s.id), kind: FLOW_KINDS.includes(s.kind) ? s.kind : "worker" }));
    const ids = new Set(stations.map((s) => s.id));
    f.spec = { links: (Array.isArray(o.links) ? o.links : []).filter((l) => Array.isArray(l) && ids.has(String(l[0])) && ids.has(String(l[1]))).map((l) => [String(l[0]), String(l[1]), l[2] === undefined ? "" : String(l[2])]) };
    f.stations = stations; f.at = {};
    for (const s of stations) f.at[s.id] = { s, li: document.createElement("li"), count: s.kind === "queue" || s.kind === "sink" || s.kind === "drop" ? 0 : null, max: null, text: null, status: null };
    f.sr.replaceChildren(...stations.map((s) => f.at[s.id].li));
    layoutFlow(f); flowRead(f);
    const station = (id) => { const a = f.at[String(id)]; if (!a) throw new Error("No station " + id + " in flow " + name); return a; };
    return Object.freeze({
      send(...args) {
        const opts = args.length && args[args.length - 1] && typeof args[args.length - 1] === "object" ? args.pop() : {};
        const route = args.map(String);
        if (route.length < 2) throw new Error("send needs the station it leaves and the one it reaches");
        const hops = route.slice(1).map((to, i) => { const l = f.links.get(route[i] + ">" + to); if (!l) throw new Error("No link from " + route[i] + " to " + to + " in flow " + name); return l; });
        if (reduced || !f.visible || document.hidden || f.dots >= FLOW_MAX_DOTS) return false;
        const tone = ["good", "bad", "warn"].includes(opts.tone) ? opts.tone : "";
        const now = performance.now(), first = hops[0], key = route.join(">"), group = f.groups[key] || (f.groups[key] = { batch: -1, n: 0, start: 0 });
        let start, off = 0;
        if (group.batch === flowBatch) {
          if (++group.n > FLOW_CLUSTER) return false;
          start = group.start + group.n * 45; off = (group.n % 2 ? 1 : -1) * (2 + (group.n % 3) * 2.5);
        } else {
          start = Math.max(now, first.next);
          if (start - now > FLOW_BACKLOG) { if (!tone) return false; start = now; }
          group.batch = flowBatch; group.n = 0; group.start = start;
        }
        first.next = Math.max(first.next, start + FLOW_SPACING);
        if (!flowBatchQueued) { flowBatchQueued = true; Promise.resolve().then(() => { flowBatch++; flowBatchQueued = false; }); }
        const dot = svgEl("circle", { class: "item", r: 3.5, visibility: "hidden" });
        if (tone && hops.length === 1) dot.dataset.tone = tone;
        f.layer.append(dot); f.dots++;
        flowDots.add({ flow: f, el: dot, hops, hop: first, i: 0, start, tone, off });
        if (!flowFrame) flowFrame = requestAnimationFrame(flowTick);
        return true;
      },
      count(id, n, more) {
        const a = station(id), m = more || {};
        a.count = n === null || n === undefined ? null : Number(n) || 0;
        if ("max" in m) a.max = m.max === null ? null : Number(m.max);
        if ("text" in m) a.text = m.text === null ? null : String(m.text);
        paintStation(f, String(id)); flowRead(f);
      },
      status(id, value) {
        const a = station(id);
        if (value !== null && value !== undefined && !["up", "down", "busy"].includes(value)) throw new Error("A station's status is up, down or busy");
        a.status = value || null; paintStation(f, String(id)); flowRead(f);
      },
      clear() {
        dropDots(f);
        for (const s of f.stations) { const a = f.at[s.id]; a.count = s.kind === "queue" || s.kind === "sink" || s.kind === "drop" ? 0 : null; a.text = null; a.status = null; paintStation(f, s.id); }
        flowRead(f);
      },
    });
  }
  // The outcome: one plain sentence that says what happened. **Bold** marks the number that matters.
  function outcome(name, text, more) {
    const t = String(text ?? ""), o = more || {};
    outputs[name] = { value: t.replace(/\*\*/g, ""), tone: o.tone || null };
    for (const el of document.querySelectorAll('[data-pg="outcome"][data-name="' + name + '"]')) {
      el.classList.add("pg-outcome"); el.setAttribute("aria-live", "polite");
      el.replaceChildren(...t.split("**").map((part, i) => { if (i % 2 === 0) return document.createTextNode(part); const b = document.createElement("b"); b.textContent = part; return b; }));
    }
  }
  // Game set: ui.game({ board, you, me, first, move(board, move, who), winner(board), fromCell(row, col), say(move) }).
  // A tap on the board and the agent's move action take one path. Each of your moves is
  // emitted as a "move" event, so the agent waiting on watch answers without a chat message.
  let theGame = null;
  const allValues = () => JSON.parse(JSON.stringify(values));
  function paintTurn() {
    const g = theGame; if (!g) return;
    const turn = values.turn, w = g.winner(values[g.board], allValues());
    const piece = (who) => { const el = document.querySelector('[data-pg="board"][data-param="' + g.board + '"]'); const hit = attr(el || document.body, "pieces", "").split(",").map((x) => x.split(":")).find((x) => x[0].trim() === who); return hit ? (hit[1] || "").trim() : ""; };
    for (const el of document.querySelectorAll('[data-pg="turn"]')) {
      el.dataset.turn = turn === g.you ? "you" : turn === g.me ? "me" : turn === "setup" ? "setup" : "done";
      const dot = document.createElement("i");
      const text = document.createElement("span"), note = document.createElement("small");
      const buttons = [];
      if (turn === "setup") {
        dot.style.setProperty("--piece", "var(--pg-meta)");
        text.textContent = g.setupText;
        const go = document.createElement("button"); go.type = "button"; go.className = "pg-btn"; go.dataset.primary = ""; go.textContent = g.startLabel; go.onclick = () => startGame("user");
        buttons.push(go);
      } else if (turn === "done") {
        const tone = w === g.you ? "good" : w === g.me ? "bad" : "";
        text.textContent = w === g.you ? "You win" : w === g.me ? "I win" : "Draw";
        if (tone) { dot.className = "pg-tone"; dot.dataset.tone = tone; dot.textContent = tone === "good" ? "✓" : "×"; } else dot.style.setProperty("--piece", "var(--pg-meta)");
      } else {
        dot.style.setProperty("--piece", piece(turn) || "var(--pg-meta)");
        text.textContent = turn === g.you ? "Your turn" : "My turn";
        note.textContent = turn === g.me ? "thinking" : g.last ? "I played " + g.last : "";
      }
      if (turn !== "setup") { const again = document.createElement("button"); again.type = "button"; again.className = "pg-btn"; again.textContent = "New game"; again.onclick = () => newGame("user"); buttons.push(again); }
      el.replaceChildren(...[dot, text, note.textContent ? note : null, ...buttons].filter(Boolean));
      el.setAttribute("aria-live", "polite");
    }
    outputs.game = { value: { turn, winner: w || null, last: g.last || null } };
  }
  function applyAll(all, from) { for (const k of Object.keys(all)) if (specs[k] && JSON.stringify(all[k]) !== JSON.stringify(values[k])) set(k, all[k], from); }
  function newGame(from) {
    const g = theGame;
    const all = allValues(); all[g.board] = g.start(all); applyAll(all, "remote");
    set("turn", g.setup ? "setup" : g.first, "remote"); g.last = null; persist(); paintTurn();
    if (from === "user") api.emit("new-game", { turn: values.turn });
    else lane("Started a new game.");
    return { turn: values.turn };
  }
  function startGame(from) {
    const g = theGame;
    if (values.turn !== "setup") throw new Error("The game has already started");
    set("turn", g.first, "remote"); persist(); paintTurn();
    if (from === "user") api.emit("start", { turn: values.turn }); else lane("Started.");
    return { turn: values.turn };
  }
  function playMove(m, who) {
    const g = theGame;
    if (!g) throw new Error("No game on this card");
    if (values.turn === "done") throw new Error("The game is over; start a new one");
    if (values.turn === "setup") throw new Error("The game hasn't started yet");
    if (values.turn !== who) throw new Error(who === g.me ? "It's the player's turn" : "It's not your turn");
    const all = allValues();
    const next = g.move(all[g.board], m, who, all);
    if (!next) throw new Error("That move isn't allowed");
    all[g.board] = next;
    const w = g.winner(next, all), said = g.say(m, all, who);
    applyAll(all, "remote");
    set("turn", w ? "done" : g.again && g.again(m, all, who) ? who : who === g.you ? g.me : g.you, "remote");
    persist();
    if (who === g.me) { g.last = said; lane("Played " + said + "."); }
    paintTurn();
    if (who === g.you) api.emit("move", { move: m, said, turn: values.turn, winner: w || null });
    return { played: said, turn: values.turn, winner: w || null };
  }
  function game(spec) {
    ready();
    const g = theGame = { board: "board", you: "you", me: "me", say: (m) => (typeof m === "number" ? "column " + (m + 1) : String(m)), fromCell: (r, c) => c, winner: () => null, setupText: "Set up", startLabel: "Start", ...spec };
    if (!specs[g.board]) throw new Error("No board parameter " + g.board);
    g.first = g.first || g.you;
    g.start = g.start || (() => specs[g.board].default);
    const fresh = !("turn" in restored);
    define("turn", { label: "Turn", options: [{ value: g.you }, { value: g.me }, { value: "done" }, { value: "setup" }], default: g.setup ? "setup" : g.first });
    if (fresh) { const all = allValues(); all[g.board] = g.start(all); applyAll(all, "remote"); persist(); }
    on("select", ({ name, row, col, from }) => {
      if (name !== g.board) return;
      if (values.turn === "setup") { if (from === "agent") throw new Error("The game hasn't started yet"); return; }
      try { playMove(g.fromCell(row, col), from === "agent" ? g.me : g.you); } catch (e) { if (from === "agent") throw e; }
    });
    on("change", ({ name }) => { if (name === "turn") paintTurn(); });
    paintTurn();
    return { play: (m) => playMove(m, g.you), newGame: () => newGame("user"), start: () => startGame("user") };
  }

  // Guide set: <div data-pg="guide" data-param="step"> with <section data-step> children.
  // The step is a parameter, so you jump with setParams({ step: 5 }).
  function guide(el) {
    const name = el.dataset.param || "step", steps = [...el.querySelectorAll(":scope > [data-step]")];
    if (!steps.length) return;
    el.classList.add("pg-guide");
    if (!specs[name]) define(name, { label: attr(el, "label", "Step"), min: 1, max: steps.length, step: 1, default: 1 });
    const head = document.createElement("div"); head.className = "pg-guide-head";
    const count = document.createElement("p"), bar = document.createElement("div"); bar.className = "pg-guide-bar"; bar.style.setProperty("--n", String(steps.length));
    bar.innerHTML = steps.map(() => "<i></i>").join(""); head.append(count, bar); el.prepend(head);
    const nav = document.createElement("div"); nav.className = "pg-guide-nav";
    const where = document.createElement("span");
    const back = document.createElement("button"); back.type = "button"; back.className = "pg-btn"; back.textContent = "Back";
    const next = document.createElement("button"); next.type = "button"; next.className = "pg-btn"; next.dataset.primary = "";
    nav.append(where, back, next); el.append(nav);
    back.onclick = () => set(name, values[name] - 1, "user");
    next.onclick = () => set(name, Math.min(steps.length, values[name] + 1), "user");
    const paint = () => {
      const at = clamp(Math.round(values[name]), 1, steps.length);
      steps.forEach((sec, i) => { sec.hidden = i + 1 !== at; });
      count.textContent = attr(el, "label", "Step") + " " + at + " of " + steps.length;
      [...bar.children].forEach((b, i) => { if (i < at) b.dataset.on = ""; else delete b.dataset.on; });
      where.textContent = at + " / " + steps.length;
      back.disabled = at === 1; next.disabled = at === steps.length;
      next.textContent = at === steps.length ? "Done" : "Next";
      el.dataset.param = name;
    };
    el.__paint = paint; paint();
    on("change", (e) => { if (e.name === name) paint(); });
  }
  function photos(el) {
    el.classList.add("pg-photos");
    for (const img of el.querySelectorAll("img")) {
      img.loading = "lazy"; img.decoding = "async";
      img.addEventListener("error", () => { if (img.dataset.retry === "") { img.dataset.retry = "done"; return; } img.remove(); if (!el.querySelector("img")) el.hidden = true; });
    }
  }
  addEventListener("error", (e) => {
    const img = e.target;
    if (img && img.tagName === "IMG" && /^https:\/\/thumb\.wikimedia\.org\//.test(img.src)) { img.dataset.retry = ""; img.src = img.src.replace("https://thumb.wikimedia.org/", "https://upload.wikimedia.org/"); }
  }, true);
  Object.assign(SET_KINDS, { run: runBar, turn: (el) => el.classList.add("pg-turn"), guide, photos, flow: flowHost, outcome: (el) => el.classList.add("pg-outcome") });
  Object.assign(SET_UI, { answer: readyFirst(answer), breakdown: readyFirst(breakdown), run, game, flow: readyFirst(flow), outcome: readyFirst(outcome) });
  Object.assign(SET_ACTIONS, {
    move: (m) => playMove(m, theGame ? theGame.me : null),
    newGame: () => newGame("agent"),
    start: () => startGame("agent"),
    seek: (name, t) => { const r = runs[String(name)]; if (!r) throw new Error("No run bar " + name); r.api.pause(); r.api.seek(t); lane("Moved to " + (r.handlers && typeof r.handlers.format === "function" ? String(r.handlers.format(r.t)) : format(Number(t), { step: .1 })) + "."); return { t: r.t }; },
    run: (name, on) => { const r = runs[String(name)]; if (!r) throw new Error("No run bar " + name); if (on === false) r.api.pause(); else r.api.play(); return { playing: r.playing }; },
  });
`;
