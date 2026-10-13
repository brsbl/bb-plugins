// Higher-level component sets, composed from the base library in controls.ts.
// Calculator set: scrubbable numbers inside a sentence, one answer, a breakdown bar.
// Simulation set: a live system diagram, a run bar (play, pause, scrub), and the
// base chart with a "now" marker. The music set lives in controls.ts.

export const SETS_CSS = String.raw`
.pg-sentence { margin-bottom: 0; font-size: 15px; line-height: 1.7; color: var(--pg-body); text-wrap: pretty; }
.pg-scrub { position: relative; display: inline-block; padding: 0 2px; border-radius: 4px; color: var(--pg-accent-ink, var(--pg-ink)); font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; cursor: ew-resize; touch-action: none; user-select: none; -webkit-user-select: none; background: color-mix(in srgb, var(--pg-accent) 10%, transparent); box-shadow: inset 0 -1.5px 0 color-mix(in srgb, var(--pg-accent) 55%, transparent); transition: background .15s; }
.pg-scrub:hover, .pg-scrub.pg-grab { background: color-mix(in srgb, var(--pg-accent) 18%, transparent); }
.pg-scrub:focus-visible { outline: 2px solid var(--ring); outline-offset: 1px; }
.pg-scrub input { width: 6ch; padding: 0; border: 0; background: none; outline: none; font: inherit; color: inherit; text-align: center; }
.pg-scrub[data-agent]::after { top: -12px; }
.pg-answer { display: grid; gap: 2px; }
.pg-answer > .pg-label { margin: 0; }
.pg-answer > strong { display: flex; align-items: center; gap: 8px; font-size: 28px; line-height: 1.15; font-weight: 600; letter-spacing: -.02em; color: var(--pg-ink); font-variant-numeric: proportional-nums; }
.pg-answer > span { font-size: 12.5px; line-height: 1.45; color: var(--pg-body); }
.pg-answer > .pg-label + strong { margin-top: 2px; }
.pg-answer[data-long] > strong { font-size: 22px; letter-spacing: -.01em; }
.pg-tone { display: inline-grid; place-items: center; flex-shrink: 0; width: 18px; height: 18px; border-radius: 50%; background: var(--t); color: var(--card); font-size: 11px; font-style: normal; font-weight: 700; letter-spacing: 0; line-height: 1; }
.pg-tone[data-tone=good] { --t: var(--pg-good); } .pg-tone[data-tone=warn] { --t: var(--pg-warn); } .pg-tone[data-tone=bad] { --t: var(--pg-bad); }
.pg-breakdown { display: grid; gap: 10px; }
.pg-breakdown > .pg-bar { display: flex; height: 12px; gap: 2px; overflow: hidden; border-radius: 6px; background: var(--pg-hairline); }
.pg-breakdown > .pg-bar > i { min-width: 2px; background: var(--seg); transition: flex-grow .35s var(--pg-ease, ease); }
.pg-breakdown > ul { display: grid; gap: 6px; margin: 0; padding: 0; list-style: none; }
.pg-breakdown li { display: grid; grid-template-columns: 10px minmax(0, 1fr) auto; align-items: center; gap: 8px; font-size: 12px; color: var(--pg-body); }
.pg-breakdown li::before { content: ""; width: 10px; height: 10px; border-radius: 3px; background: var(--seg); }
.pg-breakdown li > b { font-weight: 500; color: var(--pg-ink); font-variant-numeric: tabular-nums; }
.pg-system { display: block; width: 100%; height: auto; overflow: visible; font-family: var(--font); }
.pg-system .card { fill: var(--card); stroke: color-mix(in srgb, var(--foreground) 14%, var(--card)); stroke-width: 1; }
.pg-system g[data-tone=bad] .card { stroke: var(--pg-bad); stroke-width: 1.5; }
.pg-system g[data-tone=good] .card { stroke: var(--pg-good); }
.pg-system .title { font-size: 11.5px; font-weight: 500; fill: var(--pg-ink); }
.pg-system .sub { font-size: 10.5px; fill: var(--pg-meta); font-variant-numeric: tabular-nums; }
.pg-system .meter { fill: var(--pg-stage); stroke: var(--pg-hairline); }
.pg-system .meter-fill { fill: var(--pg-accent); transition: y .12s linear, height .12s linear; }
.pg-system .meter-fill[data-low=true] { fill: var(--pg-bad); }
.pg-system .edge { fill: none; stroke: color-mix(in srgb, var(--foreground) 20%, var(--card)); stroke-width: 1.2; }
.pg-system .arrow { fill: none; stroke: color-mix(in srgb, var(--foreground) 32%, var(--card)); stroke-width: 1.2; stroke-linecap: round; stroke-linejoin: round; }
.pg-system .dot { fill: var(--pg-ink); }
.pg-system .drop { fill: var(--pg-bad); }
/* The run bar shares the chart's columns, so the scrubber starts at 0 and ends at the last tick. */
.pg-run { display: grid; grid-template-columns: var(--pg-plot-l, 40px) minmax(0, 1fr) var(--pg-plot-r, 56px); align-items: center; }
.pg-run > button { justify-self: start; width: 28px; height: 28px; }
.pg-run input[type=range] { width: 100%; height: 18px; margin: 0; accent-color: var(--pg-ink); }
.pg-run output { padding-left: 6px; font-size: 11px; font-weight: 500; color: var(--pg-meta); font-variant-numeric: tabular-nums; white-space: nowrap; }
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
      const done = (commit) => { if (commit && input.value !== "") set(name, Number(input.value)); el.__paint(); el.focus(); };
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

  // Simulation set: a system diagram. Nodes and edges come from markup:
  // data-nodes="clients:Clients,bucket:Token bucket:meter,api:API" data-edges="clients>bucket,bucket>api".
  function system(el) {
    el.classList.add("pg-system");
    const svg = el.tagName.toLowerCase() === "svg" ? el : el.appendChild(svgEl("svg"));
    svg.classList.add("pg-system"); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", attr(el, "label", "System"));
    const defs = attr(el, "nodes", "").split(",").filter(Boolean).map((n) => { const [id, title, kind] = n.split(":"); return { id: id.trim(), title: (title || id).trim(), meter: (kind || "").trim() === "meter" }; });
    const W = Math.round(svg.getBoundingClientRect().width) || 500, H = defs.some((d) => d.meter) ? 120 : 84, gap = (W - 20) / defs.length;
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    const layers = { edges: svgEl("g"), dots: svgEl("g"), nodes: svgEl("g"), drops: svgEl("g") };
    svg.replaceChildren(layers.edges, layers.dots, layers.nodes, layers.drops);
    const nodes = new Map();
    defs.forEach((d, i) => {
      const w = Math.min(gap - 40, d.meter ? 150 : 112), h = d.meter ? 96 : 48, x = 10 + gap * i + (gap - w) / 2, y = (H - h) / 2;
      const g = svgEl("g", { transform: "translate(" + x + " " + y + ")" });
      g.append(svgEl("rect", { class: "card", width: w, height: h, rx: 10 }));
      const mw = d.meter ? Math.round(w * .2) : 0, tx = 12 + (mw ? mw + 10 : 0);
      g.append(svgEl("text", { class: "title", x: tx, y: 21 }, d.title));
      const sub = svgEl("text", { class: "sub", x: tx, y: 36 }, ""); g.append(sub);
      let fill = null;
      if (d.meter) { g.append(svgEl("rect", { class: "meter", x: 12, y: 10, width: mw, height: h - 20, rx: 4 })); fill = svgEl("rect", { class: "meter-fill", x: 12, y: h - 10, width: mw, height: 0, rx: 4 }); g.append(fill); }
      layers.nodes.append(g);
      nodes.set(d.id, { g, x, y, w, h, sub, fill, mh: h - 20 });
    });
    const edges = attr(el, "edges", "").split(",").filter(Boolean).map((e) => {
      const [from, to] = e.split(">").map((s) => s.trim()), a = nodes.get(from), b = nodes.get(to);
      if (!a || !b) return null;
      const x1 = a.x + a.w, y1 = a.y + a.h / 2, x2 = b.x, y2 = b.y + b.h / 2;
      const path = svgEl("path", { class: "edge", d: "M" + x1 + " " + y1 + "L" + x2 + " " + y2 }); layers.edges.append(path);
      layers.edges.append(svgEl("path", { class: "arrow", d: "M" + (x2 - 5) + " " + (y2 - 3.5) + "L" + x2 + " " + y2 + "L" + (x2 - 5) + " " + (y2 + 3.5) }));
      return { from, to, path, length: path.getTotalLength() };
    }).filter(Boolean);
    const dots = [], drops = [];
    el.__system = {
      node(id) {
        const n = nodes.get(id);
        if (!n) throw new Error("No node " + id);
        return {
          meter(f) { if (!n.fill) return; const v = clamp(f, 0, 1); n.fill.setAttribute("y", String(10 + n.mh * (1 - v))); n.fill.setAttribute("height", String(n.mh * v)); n.fill.dataset.low = String(v < .15); },
          // Shorten text that would run past the card's edge.
          sub(text) {
            n.sub.textContent = text;
            const room = n.w - Number(n.sub.getAttribute("x")) - 10;
            let t = String(text);
            while (t.length > 1 && n.sub.getComputedTextLength && n.sub.getComputedTextLength() > room) { t = t.slice(0, -1); n.sub.textContent = t.trimEnd() + "…"; }
          },
          state(tone) { if (tone) n.g.dataset.tone = tone; else delete n.g.dataset.tone; },
        };
      },
      send(from, to, duration) {
        const edge = edges.find((e) => e.from === from && e.to === to); if (!edge) return;
        if (dots.some((d) => d.edge === edge && d.t < 12 / edge.length)) return;
        if (dots.length > 80) dots.shift().el.remove();
        const dot = svgEl("circle", { class: "dot", r: 3 }); layers.dots.append(dot); dots.push({ edge, el: dot, t: 0, duration: duration || .6 });
      },
      drop(at) {
        const n = nodes.get(at); if (!n) return;
        const dot = svgEl("circle", { class: "drop", r: 3 }); layers.drops.append(dot);
        drops.push({ el: dot, x: n.x + n.w / 2 + (Math.random() - .5) * n.w * .5, y: n.y + n.h, t: 0 });
        if (drops.length > 40) drops.shift().el.remove();
      },
      tick(dt) {
        for (let i = dots.length - 1; i >= 0; i--) { const d = dots[i]; d.t += dt / d.duration; if (d.t >= 1) { d.el.remove(); dots.splice(i, 1); continue; } const p = d.edge.path.getPointAtLength(d.edge.length * d.t); d.el.setAttribute("cx", p.x.toFixed(1)); d.el.setAttribute("cy", p.y.toFixed(1)); }
        for (let i = drops.length - 1; i >= 0; i--) { const d = drops[i]; d.t += dt / .9; if (d.t >= 1) { d.el.remove(); drops.splice(i, 1); continue; } d.el.setAttribute("cx", d.x.toFixed(1)); d.el.setAttribute("cy", (d.y + 6 + d.t * 18).toFixed(1)); d.el.setAttribute("opacity", (1 - d.t).toFixed(2)); }
      },
      clear() { for (const d of dots.concat(drops)) d.el.remove(); dots.length = 0; drops.length = 0; },
    };
  }
  // A run bar: play, pause, replay and scrub time. ui.run(name, { tick(dt, t), seek(t) }).
  const runs = {};
  function runBar(el) {
    el.classList.add("pg-run");
    const name = attr(el, "name", "run"), duration = num(el, "duration", 30), unit = attr(el, "unit", "s");
    el.innerHTML = '<button type="button" class="pg-icon-btn" data-primary></button><input type="range" min="0" step="0.01"><output></output>';
    const [play, scrub, out] = el.children;
    const REPLAY = '<svg class="pg-glyph" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5a5.5 5.5 0 1 1-5.2 3.8.8.8 0 1 1 1.5.5A4 4 0 1 0 8 4h-1l1.2 1.2-1.1 1.1L4.9 4.1 7.1 1.9l1.1 1.1L7.4 3H8Z"/></svg>';
    scrub.max = String(duration); scrub.setAttribute("aria-label", "Time");
    const r = { t: 0, playing: false, frame: 0, last: 0, visible: true, handlers: null, duration };
    const paint = () => { scrub.value = String(r.t); out.textContent = format(Number(r.t.toFixed(1)), { step: .1 }) + " " + unit; const ended = !r.playing && r.t >= r.duration; play.innerHTML = ended ? REPLAY : icon(r.playing ? "pause" : "play"); play.setAttribute("aria-label", ended ? "Replay" : r.playing ? "Pause" : "Play"); };
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
    runs[name] = r; paint();
  }
  function run(name, handlers) {
    ready();
    const r = runs[name];
    if (!r) throw new Error("No run bar named " + name);
    r.handlers = handlers || {};
    if (attr(document.querySelector('[data-pg="run"][data-name="' + name + '"]'), "autoplay", "true") !== "false" && !reduced) r.api.play();
    return r.api;
  }
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  Object.assign(SET_KINDS, { system, run: runBar });
  Object.assign(SET_UI, { answer: readyFirst(answer), breakdown: readyFirst(breakdown), system: (name) => { ready(); const el = document.querySelector('[data-pg="system"][data-name="' + name + '"]'); return el && el.__system; }, run });
  Object.assign(SET_ACTIONS, {
    seek: (name, t) => { const r = runs[String(name)]; if (!r) throw new Error("No run bar " + name); r.api.pause(); r.api.seek(t); lane("Moved to " + format(Number(t), { step: .1 }) + "."); return { t: r.t }; },
    run: (name, on) => { const r = runs[String(name)]; if (!r) throw new Error("No run bar " + name); if (on === false) r.api.pause(); else r.api.play(); return { playing: r.playing }; },
  });
`;
