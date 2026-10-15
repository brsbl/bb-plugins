// The chart component. Declared in markup as <figure data-pg="chart" data-name="…">
// and filled with playground.ui.chart(name, spec). Line, area, step and bar series
// (bars side by side, or stacked with stack: true);
// a fixed categorical palette (validated for color vision deficiency, light and
// dark); a legend for two or more series with direct end labels when they fit;
// a crosshair tooltip that lists every series at the hovered x, also on keyboard
// focus; threshold marks, shaded spans and a "now" marker; and a table view for
// screen readers. The agent reads the series with read() and points at an x with
// point(name, x).

export const CHART_CSS = String.raw`
.pg-surface:has(> .pg-chart:only-child) { padding: 0; background: none; border-radius: 0; }
.pg-chart { position: relative; display: grid; gap: 12px; margin: 0; min-width: 0; }
body:has([data-pg]) > * + .pg-chart { margin-top: var(--pg-space-4); }
.pg-chart > svg { display: block; width: 100%; height: auto; overflow: visible; font-size: var(--pg-text-axis); outline: none; touch-action: pan-y; }
.pg-chart > svg:focus-visible { outline: 2px solid var(--ring); outline-offset: 4px; border-radius: 4px; }
.pg-chart text { fill: var(--pg-meta); font-variant-numeric: tabular-nums; }
.pg-chart .grid { stroke: var(--pg-hairline); stroke-width: 1; }
.pg-chart .axis { stroke: var(--pg-rule); stroke-width: 1; }
.pg-chart .line { fill: none; stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
.pg-chart .line.muted { stroke-width: 1.5; }
.pg-chart .wash { stroke: none; opacity: .1; }
.pg-chart .wash.muted { opacity: .06; }
.pg-chart .end { font-size: var(--pg-text-label); }
.pg-chart .end-name { fill: var(--pg-ink); font-weight: 500; }
.pg-chart .end.muted .end-name { fill: var(--pg-body); font-weight: 400; }
.pg-chart .end-value { fill: var(--pg-meta); }
.pg-chart .end-dot { stroke: var(--card); stroke-width: 2; }
.pg-chart .mark { stroke: var(--pg-body); stroke-width: 1; stroke-dasharray: 4 3; }
.pg-chart .mark-label { fill: var(--pg-body); font-weight: 500; paint-order: stroke; stroke: var(--card); stroke-width: 3px; stroke-linejoin: round; }
.pg-chart .band { fill: color-mix(in oklab, var(--foreground) 4%, transparent); }
.pg-chart .now { stroke: var(--pg-ink); stroke-width: 1.5; }
.pg-chart .event { fill: var(--pg-bad); stroke: var(--card); stroke-width: 2; }
.pg-chart[data-seek] svg { cursor: ew-resize; }
.pg-chart .cross { stroke: var(--pg-rule); stroke-width: 1; opacity: 0; }
.pg-chart .dot { stroke: var(--card); stroke-width: 2; opacity: 0; }
.pg-chart .bar { transition: filter var(--pg-fast); }
.pg-chart .bar:hover, .pg-chart .bar[data-hot] { filter: brightness(1.12); }
.pg-chart[data-hover] .cross, .pg-chart[data-hover] .dot { opacity: 1; }
.pg-chart-legend { display: flex; flex-wrap: wrap; gap: 4px 16px; margin: 0; padding: 0; list-style: none; font-size: var(--pg-text-label); line-height: 1.4; color: var(--pg-body); }
.pg-chart-legend[hidden] { display: none; }
.pg-chart-legend li { display: inline-flex; align-items: center; gap: 6px; }
.pg-chart-legend i { width: 14px; height: 2px; border-radius: 1px; background: var(--k); }
.pg-chart-legend i[data-fill] { width: 10px; height: 10px; border-radius: 3px; }
.pg-chart-legend i[data-event] { width: 8px; height: 8px; border-radius: 50%; }
.pg-tip { position: absolute; z-index: 2; top: 0; left: 0; min-width: 128px; padding: 8px 10px; border-radius: var(--pg-radius-control); background: var(--card); box-shadow: 0 0 0 1px var(--pg-hairline), 0 6px 18px -6px color-mix(in oklab, var(--foreground) 28%, transparent); font-size: var(--pg-text-axis); line-height: 1.4; color: var(--pg-meta); pointer-events: none; opacity: 0; transition: opacity var(--pg-fast); }
.pg-chart[data-hover] .pg-tip { opacity: 1; }

.pg-tip { display: grid; grid-template-columns: 12px auto minmax(0, 1fr); align-items: center; gap: 3px 6px; }
.pg-tip > div { display: contents; }
.pg-tip > div > i { width: 12px; height: 2px; border-radius: 1px; background: var(--k); }
.pg-tip > div > b { font-size: var(--pg-text-label); font-weight: 600; color: var(--pg-ink); font-variant-numeric: tabular-nums; }
.pg-tip > p { grid-column: 1 / -1; margin: 0 0 2px; font-weight: 500; color: var(--pg-body); }
.pg-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
`;

// Runs inside the bridge at controls.ts's /*SETS*/ slot, sharing its scope.
// It must not contain backticks or "${".
export const CHART_RUNTIME = String.raw`
  const compact = (v) => { const a = Math.abs(v); return a >= 1e9 ? plainNum(v / 1e9) + "B" : a >= 1e6 ? plainNum(v / 1e6) + "M" : a >= 1e3 ? plainNum(v / 1e3) + "K" : plainNum(v); };
  const plainNum = (v) => Number(v).toLocaleString("en-US", { maximumFractionDigits: Math.abs(v) < 10 && !Number.isInteger(v) ? 1 : 0 });
  function chartHost(el) {
    if (el.__chart) return el.__chart;
    let host = el;
    if (el.tagName.toLowerCase() === "svg") {
      host = document.createElement("figure");
      for (const a of ["data-pg", "data-name", "data-kind", "data-height", "class", "style", "aria-label"]) if (el.hasAttribute(a)) { host.setAttribute(a, el.getAttribute(a)); el.removeAttribute(a); }
      el.replaceWith(host); host.append(el);
      host.__pg = true;
    }
    host.classList.add("pg-chart");
    const svg = host.querySelector("svg") || host.appendChild(svgEl("svg"));
    svg.setAttribute("role", "img"); svg.setAttribute("tabindex", "0");
    if (!svg.getAttribute("aria-label")) svg.setAttribute("aria-label", attr(host, "label", attr(host, "name", "Chart")));
    const legend = document.createElement("ul"); legend.className = "pg-chart-legend"; legend.hidden = true; host.prepend(legend);
    const tip = document.createElement("div"); tip.className = "pg-tip"; tip.setAttribute("aria-hidden", "true"); host.append(tip);
    const sr = document.createElement("div"); sr.className = "pg-sr"; const table = sr.appendChild(document.createElement("table")); host.append(sr);
    const c = { host, svg, legend, tip, table, spec: null, xs: [], hover: -1 };
    host.__chart = c;
    const pick = (clientX) => {
      if (!c.xs.length) return -1;
      const box = svg.getBoundingClientRect(), x = clientX - box.left;
      let best = 0; c.xs.forEach((v, i) => { if (Math.abs(c.sx(v) - x) < Math.abs(c.sx(c.xs[best]) - x)) best = i; });
      return best;
    };
    svg.addEventListener("pointermove", (e) => showAt(c, pick(e.clientX)));
    svg.addEventListener("pointerleave", () => hideTip(c));
    svg.addEventListener("focus", () => showAt(c, c.hover >= 0 ? c.hover : c.xs.length - 1));
    svg.addEventListener("blur", () => hideTip(c));
    svg.addEventListener("keydown", (e) => {
      const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (d) { e.preventDefault(); showAt(c, clamp((c.hover < 0 ? 0 : c.hover) + d, 0, c.xs.length - 1)); }
      if (e.key === "Home") { e.preventDefault(); showAt(c, 0); }
      if (e.key === "End") { e.preventDefault(); showAt(c, c.xs.length - 1); }
      if (e.key === "Escape") hideTip(c);
    });
    return c;
  }
  const hideTip = (c) => { delete c.host.dataset.hover; c.hover = -1; c.svg.querySelectorAll("[data-hot]").forEach((b) => b.removeAttribute("data-hot")); };
  function showAt(c, i) {
    if (i < 0 || !c.spec) return;
    c.hover = i;
    const x = c.xs[i], px = c.sx(x);
    c.cross.setAttribute("x1", px); c.cross.setAttribute("x2", px);
    c.tip.replaceChildren();
    const head = document.createElement("p"); head.textContent = c.fx(x); c.tip.append(head);
    const rows = [];
    c.series.forEach((s, si) => {
      const v = s.byX.get(x);
      const dot = c.dots[si];
      if (dot) { dot.style.display = v === undefined ? "none" : ""; if (v !== undefined) { dot.setAttribute("cx", px); dot.setAttribute("cy", c.sy(v)); } }
      if (v === undefined) return;
      const row = document.createElement("div"); row.style.setProperty("--k", s.color);
      const key = document.createElement("i"); const val = document.createElement("b"); val.textContent = c.fv(v);
      const name = document.createElement("span"); name.textContent = s.label;
      row.append(key, val, name); rows.push([v, row]);
    });
    rows.sort((a, b) => b[0] - a[0]).forEach(([, row]) => c.tip.append(row));
    if (c.events && c.events.has(x)) { const row = document.createElement("div"); row.style.setProperty("--k", "var(--pg-bad)"); const key = document.createElement("i"); const val = document.createElement("b"); val.textContent = plainNum(c.events.get(x)); const nm = document.createElement("span"); nm.textContent = c.eventLabel; row.append(key, val, nm); c.tip.append(row); }
    c.svg.querySelectorAll("[data-hot]").forEach((b) => b.removeAttribute("data-hot"));
    c.svg.querySelectorAll('.bar[data-i="' + i + '"]').forEach((b) => b.setAttribute("data-hot", ""));
    c.host.dataset.hover = "";
    const box = c.svg.getBoundingClientRect(), hostBox = c.host.getBoundingClientRect(), tw = c.tip.offsetWidth;
    const at = box.left - hostBox.left + px, flip = px > box.width / 2 || at + 14 + tw > hostBox.width;
    c.tip.style.transform = "translate(" + Math.max(0, flip ? at - 14 - tw : at + 14) + "px, " + (box.top - hostBox.top) + "px)";
  }
  // chart(name, { kind: "line|area|step|bars", height, x: { min, max, format, label }, y: { min, max, format, unit },
  //   series: [{ label, points: [[x, y], …], kind, color }], stack, marks: [{ y, label } | { x, label }], bands: [{ x0, x1, label }], now,
  //   labels: "auto" | "end" | "legend", focus: "<series label or x category>", events: { label, points: [[x, y, count], …] } })
  // x may be numbers or category strings (for bars). Up to four line series are named at their ends when the names fit and
  // don't collide; otherwise two or more series get a legend. focus keeps one series (or one category's bars) in color and mutes the rest.
  function chart(name, spec) {
    const el = document.querySelector('[data-pg="chart"][data-name="' + name + '"]');
    if (!el) throw new Error("No chart named " + name);
    const c = chartHost(el), svg = c.svg;
    const kindOf = (s) => s.kind || spec.kind || attr(c.host, "kind", "line");
    const raw = (spec.series || []).slice(0, 7);
    const single = raw.length === 1;
    const labelOf = (s, i) => String(s.label || s.name || "Series " + (i + 1));
    const focus = spec.focus === undefined || spec.focus === null ? null : String(spec.focus);
    const focusSeries = focus !== null && raw.some((s, i) => labelOf(s, i) === focus) ? focus : null;
    c.series = raw.map((s, i) => {
      const label = labelOf(s, i), muted = focusSeries !== null && label !== focusSeries;
      const color = muted ? "var(--pg-mark-muted)" : s.color || (single || focusSeries !== null ? "var(--pg-accent)" : "var(--pg-series-" + (i + 1) + ")");
      return { label, kind: kindOf(s), muted, color, points: (s.points || []).filter((p) => Array.isArray(p) && Number.isFinite(Number(p[1]))).map((p) => [p[0], Number(p[1])]) };
    });
    c.series.forEach((s) => { s.byX = new Map(s.points); });
    const categorical = c.series.some((s) => s.points.some((p) => typeof p[0] === "string"));
    const xs = []; for (const s of c.series) for (const [x] of s.points) if (!xs.includes(x)) xs.push(x);
    if (!categorical) xs.sort((a, b) => a - b);
    c.xs = xs;
    const focusX = focus !== null && focusSeries === null ? xs.find((x) => String(x) === focus) : undefined;
    const measure = (text, cls) => { const t = svg.appendChild(svgEl("text", { class: cls }, text)); let w = 0; try { w = t.getComputedTextLength(); } catch {} t.remove(); return w || text.length * (cls ? 6.8 : 6.2); };
    const W = Math.round(svg.getBoundingClientRect().width) || 480;
    const H = Math.max(spec.height || num(c.host, "height", 0) || Math.round(clamp(W / 2.4, 160, 260)), Math.round(W / 3.4));
    const bars = c.series.filter((s) => s.kind === "bars");
    const stacked = spec.stack === true && bars.length > 1;
    const totals = new Map();
    if (stacked) for (const s of bars) for (const [x, v] of s.points) totals.set(x, (totals.get(x) || 0) + Math.max(0, v));
    const xMarks = (spec.marks || []).filter((m) => m.x !== undefined), yMarks = (spec.marks || []).filter((m) => Number.isFinite(Number(m.y)));
    const ys = (stacked ? c.series.filter((s) => s.kind !== "bars") : c.series).flatMap((s) => s.points.map((p) => p[1])).concat([...totals.values()], yMarks.map((m) => Number(m.y)));
    const fixedMax = spec.y && spec.y.max !== undefined;
    const y0 = spec.y && spec.y.min !== undefined ? spec.y.min : Math.min(0, ...ys);
    let y1 = fixedMax ? spec.y.max : Math.max(1, ...ys) * 1.06;
    const pad = { l: 0, r: 10, t: xMarks.some((m) => m.label) || (spec.bands || []).some((b) => b.label) ? 22 : 12, b: 24 };
    const count = clamp(Math.round((H - pad.t - pad.b) / 36), 2, 5);
    let yt = niceTicks(y0, y1, count);
    if (fixedMax && yt.at(-1) !== y1) { const step = yt.length > 1 ? yt[1] - yt[0] : y1 - y0; yt = yt.filter((v) => v <= y1 - step * .4).concat(y1); }
    else if (yt.length > 1 && yt.at(-1) < y1) yt.push(Number((yt.at(-1) + yt[1] - yt[0]).toFixed(10)));
    y1 = Math.max(y1, yt.at(-1));
    const unit = (spec.y && spec.y.unit) || "";
    const withUnit = (text) => (!unit || unit === "$" ? text : text + (/^[%/]/.test(unit) ? "" : " ") + unit);
    const money = (text) => (unit === "$" ? "$" + text : text);
    c.fy = (spec.y && spec.y.format) || ((v) => money(compact(v)));
    c.fv = (spec.y && spec.y.format) || ((v) => withUnit(money(Number(v).toLocaleString("en-US"))));
    c.fx = (spec.x && spec.x.format) || ((v) => (typeof v === "number" ? plainNum(v) : String(v)));
    const tickText = (v) => (v === yt.at(-1) && !(spec.y && spec.y.format) ? withUnit(c.fy(v)) : c.fy(v));
    pad.l = Math.max(32, ...yt.map((v) => measure(tickText(v)) + 10));
    c.sy = (v) => H - pad.b - (v - y0) / ((y1 - y0) || 1) * (H - pad.t - pad.b);
    const lines = c.series.filter((s) => s.kind !== "bars");
    const mode = spec.labels === "end" || spec.labels === "legend" ? spec.labels : "auto";
    const ends = lines.map((s) => {
      const p = categorical ? s.points.at(-1) : s.points.slice().sort((a, b) => a[0] - b[0]).at(-1);
      if (!p) return null;
      const name = single ? "" : s.label, value = c.fv(p[1]);
      return { s, p, name, value, y: c.sy(p[1]), w: (name ? measure(name, "end") + 5 : 0) + measure(value, "end") };
    }).filter(Boolean).sort((a, b) => a.y - b.y);
    let endLabels = lines.length >= 1 && lines.length <= 4 && (mode === "end" || (mode === "auto" && lines.length === c.series.length));
    if (endLabels && mode === "auto" && (ends.some((e, i) => i > 0 && e.y - ends[i - 1].y < 14) || 16 + Math.max(...ends.map((e) => e.w)) > W * .34)) endLabels = false;
    if (endLabels) pad.r = 16 + Math.max(0, ...ends.map((e) => e.w));
    const band = categorical ? (W - pad.l - pad.r) / Math.max(1, xs.length) : 0;
    const x0 = categorical ? 0 : spec.x && spec.x.min !== undefined ? spec.x.min : xs[0], x1 = categorical ? 0 : spec.x && spec.x.max !== undefined ? spec.x.max : xs.at(-1);
    c.sx = categorical ? (v) => pad.l + band * (xs.indexOf(v) + .5) : (v) => pad.l + (v - x0) / ((x1 - x0) || 1) * (W - pad.l - pad.r);
    c.ix = categorical ? null : (px) => clamp(x0 + (px - pad.l) / ((W - pad.l - pad.r) || 1) * (x1 - x0), Math.min(x0, x1), Math.max(x0, x1));
    svg.setAttribute("viewBox", "0 0 " + W + " " + H); svg.replaceChildren();
    for (const b of spec.bands || []) { svg.append(svgEl("rect", { class: "band", x: c.sx(b.x0), y: pad.t, width: Math.max(0, c.sx(b.x1) - c.sx(b.x0)), height: H - pad.t - pad.b })); if (b.label) svg.append(svgEl("text", { class: "mark-label", x: c.sx(b.x0) + 4, y: pad.t - 8 }, b.label)); }
    for (const v of yt) { svg.append(svgEl("line", { class: v === y0 ? "axis" : "grid", x1: pad.l, x2: W - pad.r, y1: c.sy(v), y2: c.sy(v) })); svg.append(svgEl("text", { x: pad.l - 10, y: c.sy(v) + 3.5, "text-anchor": "end" }, tickText(v))); }
    const xticks = categorical ? xs.filter((_, i) => xs.length <= 8 || i % Math.ceil(xs.length / 8) === 0) : niceTicks(x0, x1, Math.max(2, Math.floor((W - pad.l - pad.r) / 64))).filter((v) => v >= x0 && v <= x1);
    xticks.forEach((v) => svg.append(svgEl("text", { x: c.sx(v), y: H - 6, "text-anchor": categorical ? "middle" : v === x0 ? "start" : v === x1 ? "end" : "middle" }, c.fx(v))));
    const bar = (s, x, left, right, top, base, r) => svg.append(svgEl("path", { class: "bar", "data-i": xs.indexOf(x), fill: focusX !== undefined && x !== focusX ? "var(--pg-mark-muted)" : s.color, d: "M" + left + " " + base + "V" + (top + r) + "Q" + left + " " + top + " " + (left + r) + " " + top + "H" + (right - r) + "Q" + right + " " + top + " " + right + " " + (top + r) + "V" + base + "Z" }));
    if (stacked) {
      const slot = Math.min(24, (categorical ? band : (W - pad.l - pad.r) / Math.max(1, xs.length)) * .7);
      for (const x of xs) {
        const parts = bars.map((s) => [s, Math.max(0, s.byX.get(x) || 0)]).filter((p) => p[1] > 0);
        let sum = 0;
        parts.forEach(([s, v], k) => {
          const base = c.sy(Math.max(y0, sum)) - (k ? 2 : 0), top = c.sy(Math.max(y0, sum + v)), h = base - top;
          sum += v;
          if (h <= 0) return;
          bar(s, x, c.sx(x) - slot / 2, c.sx(x) + slot / 2, top, base, k === parts.length - 1 ? Math.min(4, h, slot / 2) : 0);
        });
      }
    } else bars.forEach((s, bi) => {
      const slot = Math.min(24, (categorical ? band : (W - pad.l - pad.r) / Math.max(1, s.points.length)) * .7 / bars.length);
      s.points.forEach(([x, v]) => {
        const cx = c.sx(x) + (bi - (bars.length - 1) / 2) * (slot + 2), top = c.sy(Math.max(v, y0)), base = c.sy(Math.max(y0, 0)), h = Math.max(0, base - top), r = Math.min(4, h, slot / 2);
        bar(s, x, cx - slot / 2, cx + slot / 2, top, base, r);
        if (focusX !== undefined && x === focusX) { const t = svgEl("text", { class: "end", x: cx, y: top - 6, "text-anchor": "middle" }); t.append(svgEl("tspan", { class: "end-name" }, c.fv(v))); svg.append(t); }
      });
    });
    for (const s of lines.slice().sort((a, b) => Number(b.muted) - Number(a.muted))) {
      const pts = s.points.slice(); if (!categorical) pts.sort((a, b) => a[0] - b[0]);
      if (!pts.length) continue;
      let d = ""; pts.forEach(([x, v], i) => { d += i === 0 ? "M" + c.sx(x).toFixed(1) + " " + c.sy(v).toFixed(1) : s.kind === "step" ? "H" + c.sx(x).toFixed(1) + "V" + c.sy(v).toFixed(1) : "L" + c.sx(x).toFixed(1) + " " + c.sy(v).toFixed(1); });
      if (s.kind === "area" || s.kind === "step") svg.append(svgEl("path", { class: s.muted ? "wash muted" : "wash", fill: s.color, d: d + "V" + c.sy(Math.max(y0, 0)) + "H" + c.sx(pts[0][0]).toFixed(1) + "Z" }));
      svg.append(svgEl("path", { class: s.muted ? "line muted" : "line", stroke: s.color, d }));
    }
    for (const m of yMarks) { svg.append(svgEl("line", { class: "mark", x1: pad.l, x2: W - pad.r, y1: c.sy(m.y), y2: c.sy(m.y) })); if (m.label) svg.append(svgEl("text", { class: "mark-label", x: pad.l + 4, y: c.sy(m.y) - 5 }, m.label)); }
    for (const m of xMarks) { const x = c.sx(m.x); svg.append(svgEl("line", { class: "mark", x1: x, x2: x, y1: pad.t - 4, y2: H - pad.b })); if (m.label) svg.append(svgEl("text", { class: "mark-label", x, y: pad.t - 8, "text-anchor": x > W - pad.r - 60 ? "end" : x < pad.l + 60 ? "start" : "middle" }, m.label)); }
    if (endLabels) {
      const placed = ends.map((e) => ({ ...e, ty: e.y + 4 }));
      for (let i = 1; i < placed.length; i++) placed[i].ty = Math.max(placed[i].ty, placed[i - 1].ty + 14);
      const over = placed.length ? placed.at(-1).ty - (H - pad.b + 4) : 0;
      if (over > 0) for (const e of placed) e.ty -= over;
      for (const e of placed) {
        const x = c.sx(e.p[0]);
        svg.append(svgEl("circle", { class: "end-dot", cx: x, cy: e.y, r: 3.5, fill: e.s.color }));
        const text = svgEl("text", { class: e.s.muted ? "end muted" : "end", x: x + 8, y: e.ty });
        if (e.name) text.append(svgEl("tspan", { class: "end-name" }, e.name), document.createTextNode(" "));
        text.append(svgEl("tspan", { class: "end-value" }, e.value));
        svg.append(text);
      }
    }
    const ev = spec.events && Array.isArray(spec.events.points) ? spec.events : null;
    c.events = new Map();
    if (ev) for (const [x, y, n] of ev.points.slice(0, 400)) { c.events.set(x, (c.events.get(x) || 0) + (Number(n) || 1)); svg.append(svgEl("circle", { class: "event", cx: c.sx(x), cy: c.sy(Number(y) || y0), r: 3.5 })); }
    c.eventLabel = ev ? String(ev.label || "Events") : "";
    if (Number.isFinite(spec.now) || (categorical && spec.now !== undefined)) { const x = c.sx(spec.now); svg.append(svgEl("line", { class: "now", x1: x, x2: x, y1: pad.t, y2: H - pad.b })); }
    c.cross = svgEl("line", { class: "cross", y1: pad.t, y2: H - pad.b }); svg.append(c.cross);
    c.dots = c.series.map((s) => (s.kind === "bars" ? null : svg.appendChild(svgEl("circle", { class: "dot", r: 4, fill: s.color }))));
    c.legend.replaceChildren(); c.legend.hidden = (endLabels ? 0 : c.series.length) + (ev ? 1 : 0) < (endLabels ? 1 : 2);
    if (!endLabels) for (const s of c.series) { const li = document.createElement("li"); const k = document.createElement("i"); k.style.setProperty("--k", s.color); if (s.kind !== "line") k.dataset.fill = ""; const t = document.createElement("span"); t.textContent = s.label; li.append(k, t); c.legend.append(li); }
    if (ev) { const li = document.createElement("li"); const k = document.createElement("i"); k.style.setProperty("--k", "var(--pg-bad)"); k.dataset.event = ""; const t = document.createElement("span"); t.textContent = c.eventLabel; li.append(k, t); c.legend.append(li); }
    c.table.replaceChildren();
    const head = c.table.createTHead().insertRow(); const hx = document.createElement("th"); hx.textContent = (spec.x && spec.x.label) || "x"; head.append(hx);
    for (const s of c.series) { const th = document.createElement("th"); th.textContent = s.label; head.append(th); }
    const tb = c.table.createTBody();
    for (const x of xs.slice(0, 200)) { const tr = tb.insertRow(); tr.insertCell().textContent = c.fx(x); for (const s of c.series) tr.insertCell().textContent = s.byX.has(x) ? c.fv(s.byX.get(x)) : ""; }
    c.spec = spec;
    outputs[name] = { value: { series: c.series.map((s) => ({ label: s.label, points: s.points.slice(0, 200) })) } };
    if (c.hover >= 0 && c.hover < xs.length) showAt(c, c.hover);
  }
  function pointAt(name, x) {
    const el = document.querySelector('[data-pg="chart"][data-name="' + name + '"]');
    if (!el || !el.__chart) throw new Error("No chart named " + name);
    const c = el.__chart;
    let i = c.xs.indexOf(x);
    if (i < 0 && typeof x === "number") c.xs.forEach((v, j) => { if (i < 0 || Math.abs(v - x) < Math.abs(c.xs[i] - x)) i = j; });
    showAt(c, i);
    lane("Pointed at " + c.fx(c.xs[i]) + " on the chart.");
    return { x: c.xs[i], values: Object.fromEntries(c.series.map((s) => [s.label, s.byX.get(c.xs[i])])) };
  }
  Object.assign(SET_ACTIONS, { point: (name, x) => { ready(); return pointAt(String(name), x); } });
`;
