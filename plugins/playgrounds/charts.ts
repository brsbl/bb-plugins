// The chart component. Declared in markup as <figure data-pg="chart" data-name="…">
// and filled with playground.ui.chart(name, spec). Line, area, step and bar series
// (bars side by side, or stacked with stack: true) in a muted, paper-like palette;
// focus keeps the series the sentence is about at full strength, labels its peaks
// in place and turns the rest into context; direct end labels for up to four lines,
// with a legend only as a fallback; a crosshair tooltip that lists every series at
// the hovered x, also on keyboard focus; one quiet reference line labeled at its
// end, shaded spans and a "now" marker; and a table view for screen readers. The
// agent reads the series with read() and points at an x with point(name, x).

export const CHART_CSS = String.raw`
.pg-surface:has(> .pg-chart:only-child) { padding: 0; background: none; border-radius: 0; }
.pg-chart { --pg-bad: var(--pg-chart-bad); position: relative; display: grid; gap: 10px; margin: 0; min-width: 0; }
body:has([data-pg]) > * + .pg-chart { margin-top: var(--pg-space-4); }
.pg-chart > svg { display: block; width: 100%; height: auto; overflow: visible; font-size: var(--pg-text-axis); outline: none; touch-action: pan-y; }
.pg-chart > svg:focus-visible { outline: 2px solid var(--ring); outline-offset: 4px; border-radius: 4px; }
.pg-chart text { fill: var(--pg-chart-tick); font-variant-numeric: tabular-nums; }
.pg-chart .tick { font-family: var(--pg-font-mono); }
.pg-chart .grid { stroke: var(--pg-chart-grid); stroke-width: 1; stroke-dasharray: 3 3; }
.pg-chart .axis { stroke: var(--pg-chart-axis); stroke-width: 1; }
.pg-chart .line { fill: none; stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
.pg-chart .line.muted { stroke-width: 1.5; }
.pg-chart .pt { stroke: var(--card); stroke-width: 1.5; }
.pg-chart .end { font-size: var(--pg-text-label); }
.pg-chart .end-name, .pg-chart .peak { fill: color-mix(in oklch, var(--k, var(--pg-ink)) 55%, var(--pg-ink)); font-weight: 500; }
.pg-chart .end.muted .end-name { fill: var(--pg-meta); font-weight: 400; }
.pg-chart .end-value { fill: var(--pg-chart-tick); font-weight: 400; }
.pg-chart .peak { font-size: var(--pg-text-axis); paint-order: stroke; stroke: var(--card); stroke-width: 3px; stroke-linejoin: round; }
.pg-chart .end-dot { stroke: var(--card); stroke-width: 2; }
.pg-chart .mark { stroke: var(--pg-chart-mark); stroke-width: 1; stroke-dasharray: 4 4; }
.pg-chart .mark-label { fill: var(--pg-chart-tick); paint-order: stroke; stroke: var(--card); stroke-width: 4px; stroke-linejoin: round; }
.pg-chart .band { fill: color-mix(in oklab, var(--foreground) 4%, transparent); }
.pg-chart .now { stroke: var(--pg-ink); stroke-width: 1.5; }
.pg-chart .event { fill: var(--pg-bad); stroke: var(--card); stroke-width: 2; }
.pg-chart[data-seek] svg { cursor: ew-resize; }
.pg-chart .cross { stroke: var(--pg-chart-axis); stroke-width: 1; stroke-dasharray: 3 3; opacity: 0; }
.pg-chart .dot { stroke: var(--card); stroke-width: 2; opacity: 0; }
.pg-chart .bar { transition: filter var(--pg-fast); }
.pg-chart .bar:hover, .pg-chart .bar[data-hot] { filter: brightness(1.08) saturate(1.1); }
.pg-chart[data-hover] .cross, .pg-chart[data-hover] .dot { opacity: 1; }
.pg-chart-legend { display: flex; flex-wrap: wrap; gap: 4px 14px; margin: 0; padding: 0; list-style: none; font-size: var(--pg-text-label); line-height: 1.4; }
.pg-chart-legend[hidden] { display: none; }
.pg-chart-legend li { display: inline-flex; align-items: center; gap: 6px; color: color-mix(in oklch, var(--k) 55%, var(--pg-ink)); font-weight: 500; }
.pg-chart-legend i { width: 12px; height: 2px; border-radius: 1px; background: var(--k); }
.pg-chart-legend i[data-fill] { width: 8px; height: 8px; border-radius: 2px; }
.pg-chart-legend i[data-event] { width: 7px; height: 7px; border-radius: 50%; }
.pg-tip { position: absolute; z-index: 2; top: 0; left: 0; min-width: 112px; padding: 5px 10px 6px; border-radius: 6px; background: color-mix(in oklch, var(--foreground) 3%, var(--card)); box-shadow: 0 0 0 1px var(--pg-chart-grid), 0 4px 14px -6px color-mix(in oklab, var(--foreground) 24%, transparent); font: 11px/1.5 var(--pg-font-mono); color: var(--pg-body); pointer-events: none; opacity: 0; transition: opacity var(--pg-fast); }
.pg-chart[data-hover] .pg-tip { opacity: 1; }

.pg-tip { display: grid; grid-template-columns: 6px minmax(0, 1fr) auto; align-items: center; gap: 1px 7px; }
.pg-tip > div { display: contents; }
.pg-tip > div > i { width: 6px; height: 6px; border-radius: 50%; background: var(--k); }
.pg-tip > div > b { padding-left: 10px; text-align: right; font-weight: 500; color: var(--pg-ink); font-variant-numeric: tabular-nums; }
.pg-tip > p { grid-column: 1 / -1; margin: 0 0 1px; font-weight: 500; color: var(--pg-ink); }
.pg-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
`;

// Runs inside the bridge at controls.ts's /*SETS*/ slot, sharing its scope.
// It must not contain backticks or "${".
export const CHART_RUNTIME = String.raw`
  const compact = (v) => { const a = Math.abs(v); return a >= 1e9 ? plainNum(v / 1e9) + "B" : a >= 1e6 ? plainNum(v / 1e6) + "M" : a >= 1e3 ? plainNum(v / 1e3) + "K" : plainNum(v); };
  const plainNum = (v) => Number(v).toLocaleString("en-US", { maximumFractionDigits: Math.abs(v) < 10 && !Number.isInteger(v) ? 1 : 0 });
  const tint = (color, pct) => "color-mix(in oklch, " + color + " " + pct + "%, var(--card))";
  let gradients = 0;
  function curve(P) {
    const n = P.length, f = (v) => v.toFixed(1);
    if (n < 3) return P.map((p, i) => (i ? "L" : "M") + f(p[0]) + " " + f(p[1])).join("");
    const d = [], m = [];
    for (let i = 0; i < n - 1; i++) d.push((P[i + 1][1] - P[i][1]) / ((P[i + 1][0] - P[i][0]) || 1));
    m.push(d[0]);
    for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2);
    m.push(d[n - 2]);
    for (let i = 0; i < n - 1; i++) {
      if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
      const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
      if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
    }
    let out = "M" + f(P[0][0]) + " " + f(P[0][1]);
    for (let i = 0; i < n - 1; i++) {
      const h = (P[i + 1][0] - P[i][0]) / 3;
      out += "C" + f(P[i][0] + h) + " " + f(P[i][1] + m[i] * h) + " " + f(P[i + 1][0] - h) + " " + f(P[i + 1][1] - m[i + 1] * h) + " " + f(P[i + 1][0]) + " " + f(P[i + 1][1]);
    }
    return out;
  }
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
      const row = document.createElement("div"); row.style.setProperty("--k", s.key);
      const key = document.createElement("i"); const val = document.createElement("b"); val.textContent = c.fv(v);
      const name = document.createElement("span"); name.textContent = s.label;
      row.append(key, name, val); rows.push([v, row]);
    });
    rows.sort((a, b) => b[0] - a[0]).forEach(([, row]) => c.tip.append(row));
    if (c.events && c.events.has(x)) { const row = document.createElement("div"); row.style.setProperty("--k", "var(--pg-bad)"); const key = document.createElement("i"); const val = document.createElement("b"); val.textContent = plainNum(c.events.get(x)); const nm = document.createElement("span"); nm.textContent = c.eventLabel; row.append(key, nm, val); c.tip.append(row); }
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
  // don't collide; otherwise two or more series get a legend. focus keeps one series at full strength and turns the rest
  // into context; a focused bar series has its largest values labeled in place, so it needs no legend. focus with an x
  // category highlights and labels that bar.
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
      const label = labelOf(s, i), kind = kindOf(s), muted = focusSeries !== null && label !== focusSeries;
      const own = s.color || (single || (focusSeries !== null && kind !== "bars") ? "var(--pg-series-1)" : "var(--pg-series-" + (i + 1) + ")");
      const color = !muted ? own : kind === "bars" ? tint(own, 38) : "var(--pg-chart-context)";
      return { label, kind, muted, color, key: muted && kind === "bars" ? tint(own, 50) : color, points: (s.points || []).filter((p) => Array.isArray(p) && Number.isFinite(Number(p[1]))).map((p) => [p[0], Number(p[1])]) };
    });
    c.series.forEach((s) => { s.byX = new Map(s.points); });
    const categorical = c.series.some((s) => s.points.some((p) => typeof p[0] === "string"));
    const xs = []; for (const s of c.series) for (const [x] of s.points) if (!xs.includes(x)) xs.push(x);
    if (!categorical) xs.sort((a, b) => a - b);
    c.xs = xs;
    const focusX = focus !== null && focusSeries === null ? xs.find((x) => String(x) === focus) : undefined;
    const measure = (text, cls) => { const t = svg.appendChild(svgEl("text", { class: cls }, text)); let w = 0; try { w = t.getComputedTextLength(); } catch {} t.remove(); return w || text.length * (cls === "tick" ? 6.7 : cls ? 6.8 : 6.2); };
    const W = Math.round(svg.getBoundingClientRect().width) || 480;
    const H = Math.max(spec.height || num(c.host, "height", 0) || Math.round(clamp(W * 0.27, 150, 200)), Math.round(W / 4.6));
    const bars = c.series.filter((s) => s.kind === "bars");
    const stacked = spec.stack === true && bars.length > 1;
    const totals = new Map();
    if (stacked) for (const s of bars) for (const [x, v] of s.points) totals.set(x, (totals.get(x) || 0) + Math.max(0, v));
    const xMarks = (spec.marks || []).filter((m) => m.x !== undefined), yMarks = (spec.marks || []).filter((m) => Number.isFinite(Number(m.y)));
    const ys = (stacked ? c.series.filter((s) => s.kind !== "bars") : c.series).flatMap((s) => s.points.map((p) => p[1])).concat([...totals.values()], yMarks.map((m) => Number(m.y)));
    const fixedMax = spec.y && spec.y.max !== undefined;
    const y0 = spec.y && spec.y.min !== undefined ? spec.y.min : Math.min(0, ...ys);
    let y1 = fixedMax ? spec.y.max : Math.max(1, ...ys) * 1.04;
    const focusBars = focusSeries !== null ? bars.find((s) => !s.muted) : undefined;
    const pad = { l: 0, r: 4, t: xMarks.some((m) => m.label) || (spec.bands || []).some((b) => b.label) || focusBars || focusX !== undefined ? 20 : 10, b: 22 };
    let yt = null;
    for (const n of [2, 3, 4]) {
      let t = niceTicks(y0, y1, n);
      if (!fixedMax && t.length > 1 && t.at(-1) < y1) t = t.concat(Number((t.at(-1) + t[1] - t[0]).toFixed(10)));
      if (yt && (t.length < 2 || t.length - 1 > (H - pad.t - pad.b < 100 ? 3 : 4))) continue;
      if (!yt || yt.length < 2 || t.at(-1) < yt.at(-1) - 1e-9 || (Math.abs(t.at(-1) - yt.at(-1)) < 1e-9 && t.length < yt.length)) yt = t;
    }
    if (fixedMax && yt.at(-1) !== y1) { const step = yt.length > 1 ? yt[1] - yt[0] : y1 - y0; yt = yt.filter((v) => v <= y1 - step * .4).concat(y1); }
    y1 = Math.max(y1, yt.at(-1));
    const unit = (spec.y && spec.y.unit) || "";
    const withUnit = (text) => (!unit || unit === "$" ? text : text + (/^[%/]/.test(unit) ? "" : " ") + unit);
    const money = (text) => (unit === "$" ? "$" + text : text);
    c.fy = (spec.y && spec.y.format) || ((v) => money(compact(v)));
    c.fv = (spec.y && spec.y.format) || ((v) => withUnit(money(Number(v).toLocaleString("en-US"))));
    c.fx = (spec.x && spec.x.format) || ((v) => (typeof v === "number" ? plainNum(v) : String(v)));
    const tickText = (v) => (v === yt.at(-1) && !(spec.y && spec.y.format) ? withUnit(c.fy(v)) : c.fy(v));
    pad.l = Math.max(28, ...yt.map((v) => measure(tickText(v), "tick") + 10));
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
    if (endLabels) pad.r = 14 + Math.max(0, ...ends.map((e) => e.w));
    const plotW = W - pad.l - pad.r;
    const band = categorical ? plotW / Math.max(1, xs.length) : 0;
    const x0 = categorical ? 0 : spec.x && spec.x.min !== undefined ? spec.x.min : xs[0], x1 = categorical ? 0 : spec.x && spec.x.max !== undefined ? spec.x.max : xs.at(-1);
    c.sx = categorical ? (v) => pad.l + band * (xs.indexOf(v) + .5) : (v) => pad.l + (v - x0) / ((x1 - x0) || 1) * plotW;
    c.ix = categorical ? null : (px) => clamp(x0 + (px - pad.l) / (plotW || 1) * (x1 - x0), Math.min(x0, x1), Math.max(x0, x1));
    svg.setAttribute("viewBox", "0 0 " + W + " " + H); svg.replaceChildren();
    const defs = svg.appendChild(svgEl("defs"));
    for (const b of spec.bands || []) { svg.append(svgEl("rect", { class: "band", x: c.sx(b.x0), y: pad.t, width: Math.max(0, c.sx(b.x1) - c.sx(b.x0)), height: H - pad.t - pad.b })); if (b.label) svg.append(svgEl("text", { class: "mark-label", x: c.sx(b.x0) + 4, y: pad.t - 8 }, b.label)); }
    for (const v of yt) { svg.append(svgEl("line", { class: v === y0 ? "axis" : "grid", x1: pad.l, x2: W - pad.r, y1: c.sy(v), y2: c.sy(v) })); svg.append(svgEl("text", { class: "tick", x: pad.l - 10, y: c.sy(v) + 3.5, "text-anchor": "end" }, tickText(v))); }
    const xlabel = (v) => measure(c.fx(v), "tick");
    const every = categorical ? Math.max(1, Math.ceil((Math.max(...xs.map(xlabel)) + 14) / (band || 1))) : 1;
    const xticks = categorical
      ? xs.filter((_, i) => i % every === 0)
      : niceTicks(x0, x1, Math.max(2, Math.floor(plotW / Math.max(72, xlabel(x1) + 28)))).filter((v) => v >= x0 && v <= x1);
    xticks.forEach((v) => svg.append(svgEl("text", { class: "tick", x: c.sx(v), y: H - 5, "text-anchor": categorical ? "middle" : v === x0 ? "start" : v === x1 ? "end" : "middle" }, c.fx(v))));
    const bar = (s, x, left, right, top, base, r) => svg.append(svgEl("path", { class: "bar", "data-i": xs.indexOf(x), fill: focusX !== undefined && x !== focusX ? tint(s.color, 38) : s.color, d: "M" + left + " " + base + "V" + (top + r) + "Q" + left + " " + top + " " + (left + r) + " " + top + "H" + (right - r) + "Q" + right + " " + top + " " + right + " " + (top + r) + "V" + base + "Z" }));
    const step = categorical ? band : plotW / Math.max(1, xs.length);
    const peaks = [];
    let reach = 4;
    if (stacked) {
      const slot = Math.min(28, step * .6);
      reach = 1 + slot / 2;
      for (const x of xs) {
        const parts = bars.map((s) => [s, Math.max(0, s.byX.get(x) || 0)]).filter((p) => p[1] > 0);
        let sum = 0;
        parts.forEach(([s, v], k) => {
          const base = c.sy(Math.max(y0, sum)) - (k ? 1 : 0), top = c.sy(Math.max(y0, sum + v)), h = base - top;
          sum += v;
          if (h <= 0) return;
          bar(s, x, c.sx(x) - slot / 2, c.sx(x) + slot / 2, top, base, k === parts.length - 1 ? Math.min(2.5, h, slot / 2) : 0);
        });
        if (focusBars && focusBars.byX.get(x) > 0) peaks.push({ x: c.sx(x), y: c.sy(sum), v: focusBars.byX.get(x) });
      }
    } else {
      const gap = 3, group = Math.min(step * .62, 28 * bars.length + gap * (bars.length - 1));
      const slot = Math.max(1, (group - gap * (bars.length - 1)) / Math.max(1, bars.length));
      if (bars.length) reach = 1 + group / 2;
      bars.forEach((s, bi) => s.points.forEach(([x, v]) => {
        const cx = c.sx(x) + (bi - (bars.length - 1) / 2) * (slot + gap), top = c.sy(Math.max(v, y0)), base = c.sy(Math.max(y0, 0)), h = Math.max(0, base - top), r = Math.min(2.5, h, slot / 2);
        bar(s, x, cx - slot / 2, cx + slot / 2, top, base, r);
        if (s === focusBars && v > 0) peaks.push({ x: cx, y: top, v });
        if (focusX !== undefined && x === focusX) svg.append(svgEl("text", { class: "peak", x: cx, y: top - 6, "text-anchor": "middle", style: "--k: " + s.color }, c.fv(v)));
      }));
    }
    let peakLabels = 0;
    if (focusBars && peaks.length) {
      const top = Math.max(...peaks.map((p) => p.v));
      const word = /^[A-Z][a-z]*( [a-z]+)*$/.test(focusBars.label) ? focusBars.label.toLowerCase() : focusBars.label;
      const placed = [];
      for (const p of peaks.filter((q) => q.v >= top * .9).sort((a, b) => b.v - a.v)) {
        const text = money(plainNum(p.v)) + " " + word, w = measure(text, "peak");
        if (placed.length >= 3 || placed.some((q) => Math.abs(q.x - p.x) < (q.w + w) / 2 + 8)) continue;
        placed.push({ x: p.x, w });
        svg.append(svgEl("text", { class: "peak", x: clamp(p.x, pad.l + w / 2, W - pad.r - w / 2), y: Math.max(10, p.y - 6), "text-anchor": "middle", style: "--k: " + focusBars.color }, text));
      }
      peakLabels = placed.length;
    }
    for (const s of lines.slice().sort((a, b) => Number(b.muted) - Number(a.muted))) {
      const pts = s.points.slice(); if (!categorical) pts.sort((a, b) => a[0] - b[0]);
      if (!pts.length) continue;
      const P = pts.map(([x, v]) => [c.sx(x), c.sy(v)]);
      let d = "";
      if (s.kind === "step") P.forEach(([px, py], i) => { d += i === 0 ? "M" + px.toFixed(1) + " " + py.toFixed(1) : "H" + px.toFixed(1) + "V" + py.toFixed(1); });
      else d = curve(P);
      if (s.kind === "area" || s.kind === "step") {
        const id = "pg-wash-" + (++gradients), g = defs.appendChild(svgEl("linearGradient", { id, x1: 0, y1: 0, x2: 0, y2: 1 }));
        g.append(svgEl("stop", { offset: 0, style: "stop-color: " + s.color + "; stop-opacity: " + (s.muted ? .1 : .26) }), svgEl("stop", { offset: 1, style: "stop-color: " + s.color + "; stop-opacity: " + (s.muted ? 0 : .02) }));
        svg.append(svgEl("path", { class: s.muted ? "wash muted" : "wash", fill: "url(#" + id + ")", d: d + "V" + c.sy(Math.max(y0, 0)) + "H" + P[0][0].toFixed(1) + "Z" }));
      }
      svg.append(svgEl("path", { class: s.muted ? "line muted" : "line", stroke: s.color, d }));
      if (!s.muted && s.kind === "line" && P.length <= 16 && plotW / P.length >= 24) P.slice(0, -1).forEach(([px, py]) => svg.append(svgEl("circle", { class: "pt", cx: px, cy: py, r: 2.5, fill: s.color })));
    }
    const plotted = c.series.flatMap((s) => s.points.map(([x, v]) => { const top = c.sy(stacked && s.kind === "bars" ? (totals.get(x) || v) : v); return [c.sx(x), top, s.kind === "bars" ? c.sy(Math.max(y0, 0)) : top]; }));
    for (const m of yMarks) {
      const y = c.sy(m.y);
      svg.append(svgEl("line", { class: "mark", x1: pad.l, x2: W - pad.r, y1: y, y2: y }));
      if (!m.label) continue;
      const w = measure(m.label, "mark-label");
      const spots = [[W - pad.r, y - 6, "end"], [W - pad.r, y + 14, "end"], [pad.l, y - 6, "start"], [pad.l, y + 14, "start"]];
      const hits = ([x, ly, anchor]) => { const a = anchor === "end" ? x - w - reach : x - reach, b = anchor === "end" ? x + reach : x + w + reach; return ly - 12 < pad.t - 14 ? Infinity : plotted.filter(([px, top, base]) => px > a && px < b && top < ly + 4 && base > ly - 12).length; };
      const [x, ly, anchor] = spots.reduce((best, spot) => (hits(spot) < hits(best) ? spot : best));
      svg.append(svgEl("text", { class: "mark-label", x, y: ly, "text-anchor": anchor }, m.label));
    }
    for (const m of xMarks) { const x = c.sx(m.x); svg.append(svgEl("line", { class: "mark", x1: x, x2: x, y1: pad.t - 4, y2: H - pad.b })); if (m.label) svg.append(svgEl("text", { class: "mark-label", x, y: pad.t - 8, "text-anchor": x > W - pad.r - 60 ? "end" : x < pad.l + 60 ? "start" : "middle" }, m.label)); }
    if (endLabels) {
      const placed = ends.map((e) => ({ ...e, ty: e.y + 4 }));
      for (let i = 1; i < placed.length; i++) placed[i].ty = Math.max(placed[i].ty, placed[i - 1].ty + 14);
      const over = placed.length ? placed.at(-1).ty - (H - pad.b + 4) : 0;
      if (over > 0) for (const e of placed) e.ty -= over;
      for (const e of placed) {
        const x = c.sx(e.p[0]);
        svg.append(svgEl("circle", { class: "end-dot", cx: x, cy: e.y, r: e.s.muted ? 3 : 3.5, fill: e.s.color }));
        const text = svgEl("text", { class: e.s.muted ? "end muted" : "end", x: x + 9, y: e.ty, style: "--k: " + e.s.color });
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
    const named = endLabels || (peakLabels > 0 && mode !== "legend");
    c.legend.replaceChildren(); c.legend.hidden = (named ? 0 : c.series.length) + (ev ? 1 : 0) < (named ? 1 : 2);
    if (!named) for (const s of c.series) { const li = document.createElement("li"); li.style.setProperty("--k", s.key); const k = document.createElement("i"); if (s.kind !== "line") k.dataset.fill = ""; const t = document.createElement("span"); t.textContent = s.label; li.append(k, t); c.legend.append(li); }
    if (ev) { const li = document.createElement("li"); li.style.setProperty("--k", "var(--pg-bad)"); const k = document.createElement("i"); k.dataset.event = ""; const t = document.createElement("span"); t.textContent = c.eventLabel; li.append(k, t); c.legend.append(li); }
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
