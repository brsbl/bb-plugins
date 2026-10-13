// The chart component. Declared in markup as <figure data-pg="chart" data-name="…">
// and filled with playground.ui.chart(name, spec). Line, area, step and bar series;
// a fixed categorical palette (validated for color vision deficiency, light and
// dark); a legend for two or more series with direct end labels when they fit;
// a crosshair tooltip that lists every series at the hovered x, also on keyboard
// focus; threshold marks, shaded spans and a "now" marker; and a table view for
// screen readers. The agent reads the series with read() and points at an x with
// point(name, x).

export const CHART_CSS = String.raw`
:root {
  --pg-series-1: #2a78d6; --pg-series-2: #eb6834; --pg-series-3: #1baf7a; --pg-series-4: #eda100;
  --pg-series-5: #e87ba4; --pg-series-6: #008300; --pg-series-7: #6250d6;
}
:root[data-scheme=dark] {
  --pg-series-1: #3987e5; --pg-series-2: #d95926; --pg-series-3: #199e70; --pg-series-4: #c98500;
  --pg-series-5: #d55181; --pg-series-6: #008300; --pg-series-7: #9085e9;
}
.pg-chart { position: relative; display: grid; gap: 8px; margin: 0; min-width: 0; }
.pg-chart > svg { display: block; width: 100%; height: auto; overflow: visible; font-size: 11px; outline: none; touch-action: pan-y; }
.pg-chart > svg:focus-visible { outline: 2px solid var(--ring); outline-offset: 4px; border-radius: 4px; }
.pg-chart text { fill: var(--pg-meta); font-variant-numeric: tabular-nums; }
.pg-chart .grid { stroke: var(--pg-hairline); stroke-width: 1; }
.pg-chart .axis { stroke: color-mix(in srgb, var(--foreground) 20%, var(--card)); stroke-width: 1; }
.pg-chart .line { fill: none; stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
.pg-chart .wash { stroke: none; opacity: .1; }
.pg-chart .end { fill: var(--pg-ink); font-weight: 500; }
.pg-chart .mark { stroke: var(--pg-meta); stroke-width: 1; stroke-dasharray: 3 3; }
.pg-chart .mark-label { fill: var(--pg-body); font-weight: 500; }
.pg-chart .band { fill: color-mix(in srgb, var(--foreground) 5%, transparent); }
.pg-chart .now { stroke: var(--pg-ink); stroke-width: 1; }
.pg-chart .cross { stroke: color-mix(in srgb, var(--foreground) 35%, var(--card)); stroke-width: 1; opacity: 0; }
.pg-chart .dot { stroke: var(--card); stroke-width: 2; opacity: 0; }
.pg-chart .bar:hover, .pg-chart .bar[data-hot] { filter: brightness(1.12); }
.pg-chart[data-hover] .cross, .pg-chart[data-hover] .dot { opacity: 1; }
.pg-chart-legend { display: flex; flex-wrap: wrap; gap: 4px 14px; margin: 0; padding: 0; list-style: none; font-size: 11px; color: var(--pg-body); }
.pg-chart-legend[hidden] { display: none; }
.pg-chart-legend li { display: inline-flex; align-items: center; gap: 6px; }
.pg-chart-legend i { width: 14px; height: 2px; border-radius: 1px; background: var(--k); }
.pg-chart-legend i[data-fill] { width: 10px; height: 10px; border-radius: 2px; }
.pg-tip { position: absolute; z-index: 2; top: 0; left: 0; min-width: 120px; padding: 7px 10px; border-radius: 8px; background: var(--card); box-shadow: 0 0 0 1px var(--pg-hairline), 0 4px 16px -4px color-mix(in srgb, var(--foreground) 22%, transparent); font-size: 11px; line-height: 1.4; color: var(--pg-meta); pointer-events: none; opacity: 0; transition: opacity .12s; }
.pg-chart[data-hover] .pg-tip { opacity: 1; }
.pg-tip > div { display: grid; grid-template-columns: 12px auto minmax(0, 1fr); align-items: center; gap: 6px; }
.pg-tip > div > i { width: 12px; height: 2px; border-radius: 1px; background: var(--k); }
.pg-tip > div > b { font-size: 12px; font-weight: 600; color: var(--pg-ink); font-variant-numeric: tabular-nums; }
.pg-tip > p { margin: 0 0 3px; font-weight: 500; color: var(--pg-body); }
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
    c.series.forEach((s, si) => {
      const v = s.byX.get(x);
      const dot = c.dots[si];
      if (dot) { dot.style.display = v === undefined ? "none" : ""; if (v !== undefined) { dot.setAttribute("cx", px); dot.setAttribute("cy", c.sy(v)); } }
      if (v === undefined) return;
      const row = document.createElement("div"); row.style.setProperty("--k", s.color);
      const key = document.createElement("i"); const val = document.createElement("b"); val.textContent = c.fy(v);
      const name = document.createElement("span"); name.textContent = s.label;
      row.append(key, val, name); c.tip.append(row);
    });
    c.svg.querySelectorAll("[data-hot]").forEach((b) => b.removeAttribute("data-hot"));
    c.svg.querySelectorAll('.bar[data-i="' + i + '"]').forEach((b) => b.setAttribute("data-hot", ""));
    c.host.dataset.hover = "";
    const box = c.svg.getBoundingClientRect(), hostBox = c.host.getBoundingClientRect(), tw = c.tip.offsetWidth;
    const left = box.left - hostBox.left + px + 12 + tw > hostBox.width ? box.left - hostBox.left + px - 12 - tw : box.left - hostBox.left + px + 12;
    c.tip.style.transform = "translate(" + Math.max(0, left) + "px, " + (box.top - hostBox.top + 4) + "px)";
  }
  // chart(name, { kind: "line|area|step|bars", height, x: { min, max, format, label }, y: { min, max, format, unit },
  //   series: [{ label, points: [[x, y], …], kind, color }], marks: [{ y, label }], bands: [{ x0, x1, label }], now })
  // x may be numbers or category strings (for bars). Two or more series get a legend.
  function chart(name, spec) {
    const el = document.querySelector('[data-pg="chart"][data-name="' + name + '"]');
    if (!el) throw new Error("No chart named " + name);
    const c = chartHost(el), svg = c.svg;
    const kindOf = (s) => s.kind || spec.kind || attr(c.host, "kind", "line");
    const raw = (spec.series || []).slice(0, 7);
    const single = raw.length === 1;
    c.series = raw.map((s, i) => ({ label: String(s.label || s.name || "Series " + (i + 1)), kind: kindOf(s), color: s.color || (single ? "var(--pg-accent)" : "var(--pg-series-" + (i + 1) + ")"), points: (s.points || []).filter((p) => Array.isArray(p) && Number.isFinite(Number(p[1]))).map((p) => [p[0], Number(p[1])]) }));
    c.series.forEach((s) => { s.byX = new Map(s.points); });
    const categorical = c.series.some((s) => s.points.some((p) => typeof p[0] === "string"));
    const xs = []; for (const s of c.series) for (const [x] of s.points) if (!xs.includes(x)) xs.push(x);
    if (!categorical) xs.sort((a, b) => a - b);
    c.xs = xs;
    const W = Math.round(svg.getBoundingClientRect().width) || 480, H = spec.height || num(c.host, "height", 160);
    const ys = c.series.flatMap((s) => s.points.map((p) => p[1]));
    const y0 = spec.y && spec.y.min !== undefined ? spec.y.min : Math.min(0, ...ys);
    let y1 = spec.y && spec.y.max !== undefined ? spec.y.max : Math.max(1, ...ys);
    const yt = niceTicks(y0, y1, 3); if (yt.length > 1 && yt.at(-1) < y1 && !(spec.y && spec.y.max !== undefined)) yt.push(Number((yt.at(-1) + yt[1] - yt[0]).toFixed(10))); y1 = Math.max(y1, yt.at(-1));
    const unit = (spec.y && spec.y.unit) || "";
    c.fy = (spec.y && spec.y.format) || ((v) => (unit === "$" ? "$" + compact(v) : compact(v) + (unit ? (/^[%/]/.test(unit) ? "" : " ") + unit : "")));
    c.fx = (spec.x && spec.x.format) || ((v) => (typeof v === "number" ? plainNum(v) : String(v)));
    const labelW = Math.max(28, ...yt.map((v) => c.fy(v).length * 6.2 + 8));
    const lines = c.series.filter((s) => s.kind !== "bars");
    const endLabels = lines.length >= 1 && lines.length <= 4 && (lines.length > 1 || attr(c.host, "label-end", "") === "true");
    const pad = { l: labelW, r: endLabels ? 64 : 10, t: 10, b: 22 };
    const host = svg.closest(".pg-surface");
    if (host) { host.style.setProperty("--pg-plot-l", pad.l + "px"); host.style.setProperty("--pg-plot-r", pad.r + "px"); }
    const band = categorical ? (W - pad.l - pad.r) / Math.max(1, xs.length) : 0;
    const x0 = categorical ? 0 : spec.x && spec.x.min !== undefined ? spec.x.min : xs[0], x1 = categorical ? 0 : spec.x && spec.x.max !== undefined ? spec.x.max : xs.at(-1);
    c.sx = categorical ? (v) => pad.l + band * (xs.indexOf(v) + .5) : (v) => pad.l + (v - x0) / ((x1 - x0) || 1) * (W - pad.l - pad.r);
    c.sy = (v) => H - pad.b - (v - y0) / ((y1 - y0) || 1) * (H - pad.t - pad.b);
    svg.setAttribute("viewBox", "0 0 " + W + " " + H); svg.replaceChildren();
    for (const b of spec.bands || []) svg.append(svgEl("rect", { class: "band", x: c.sx(b.x0), y: pad.t, width: Math.max(0, c.sx(b.x1) - c.sx(b.x0)), height: H - pad.t - pad.b }));
    for (const v of yt) { svg.append(svgEl("line", { class: v === y0 ? "axis" : "grid", x1: pad.l, x2: W - pad.r, y1: c.sy(v), y2: c.sy(v) })); svg.append(svgEl("text", { x: pad.l - 8, y: c.sy(v) + 3.5, "text-anchor": "end" }, c.fy(v))); }
    const xticks = categorical ? xs.filter((_, i) => xs.length <= 8 || i % Math.ceil(xs.length / 8) === 0) : [x0, ...niceTicks(x0, x1, 4).filter((v) => c.sx(v) - c.sx(x0) > 36 && c.sx(x1) - c.sx(v) > 36), x1];
    xticks.forEach((v, i) => svg.append(svgEl("text", { x: c.sx(v), y: H - 6, "text-anchor": categorical ? "middle" : i === 0 ? "start" : i === xticks.length - 1 ? "end" : "middle" }, c.fx(v))));
    const bars = c.series.filter((s) => s.kind === "bars");
    bars.forEach((s, bi) => {
      const slot = Math.min(24, (categorical ? band : (W - pad.l - pad.r) / Math.max(1, s.points.length)) * .7 / bars.length);
      s.points.forEach(([x, v]) => {
        const cx = c.sx(x) + (bi - (bars.length - 1) / 2) * (slot + 2), top = c.sy(Math.max(v, y0)), base = c.sy(Math.max(y0, 0)), h = Math.max(0, base - top), r = Math.min(4, h, slot / 2);
        const left = cx - slot / 2, right = cx + slot / 2;
        svg.append(svgEl("path", { class: "bar", "data-i": xs.indexOf(x), fill: s.color, d: "M" + left + " " + base + "V" + (top + r) + "Q" + left + " " + top + " " + (left + r) + " " + top + "H" + (right - r) + "Q" + right + " " + top + " " + right + " " + (top + r) + "V" + base + "Z" }));
      });
    });
    for (const s of lines) {
      const pts = s.points.slice(); if (!categorical) pts.sort((a, b) => a[0] - b[0]);
      if (!pts.length) continue;
      let d = ""; pts.forEach(([x, v], i) => { d += i === 0 ? "M" + c.sx(x).toFixed(1) + " " + c.sy(v).toFixed(1) : s.kind === "step" ? "H" + c.sx(x).toFixed(1) + "V" + c.sy(v).toFixed(1) : "L" + c.sx(x).toFixed(1) + " " + c.sy(v).toFixed(1); });
      if (s.kind === "area" || s.kind === "step") svg.append(svgEl("path", { class: "wash", fill: s.color, d: d + "V" + c.sy(Math.max(y0, 0)) + "H" + c.sx(pts[0][0]).toFixed(1) + "Z" }));
      svg.append(svgEl("path", { class: "line", stroke: s.color, d }));
    }
    for (const m of spec.marks || []) { svg.append(svgEl("line", { class: "mark", x1: pad.l, x2: W - pad.r, y1: c.sy(m.y), y2: c.sy(m.y) })); if (m.label) svg.append(svgEl("text", { class: "mark-label", x: pad.l + 4, y: c.sy(m.y) - 5 }, m.label)); }
    if (endLabels) {
      const ends = lines.map((s) => { const p = s.points.at(-1); return p ? { y: c.sy(p[1]) + 3.5, x: c.sx(p[0]) + 6, text: s.label } : null; }).filter(Boolean).sort((a, b) => a.y - b.y);
      for (let i = 1; i < ends.length; i++) ends[i].y = Math.max(ends[i].y, ends[i - 1].y + 13);
      const over = ends.length ? ends.at(-1).y - (H - pad.b) : 0;
      if (over > 0) for (const e of ends) e.y -= over;
      if (!ends.length || ends[0].y >= pad.t) for (const e of ends) svg.append(svgEl("text", { class: "end", x: e.x, y: e.y }, e.text));
    }
    if (Number.isFinite(spec.now) || (categorical && spec.now !== undefined)) { const x = c.sx(spec.now); svg.append(svgEl("line", { class: "now", x1: x, x2: x, y1: pad.t, y2: H - pad.b })); }
    c.cross = svgEl("line", { class: "cross", y1: pad.t, y2: H - pad.b }); svg.append(c.cross);
    c.dots = c.series.map((s) => (s.kind === "bars" ? null : svg.appendChild(svgEl("circle", { class: "dot", r: 4, fill: s.color }))));
    c.legend.replaceChildren(); c.legend.hidden = c.series.length < 2;
    for (const s of c.series) { const li = document.createElement("li"); const k = document.createElement("i"); k.style.setProperty("--k", s.color); if (s.kind !== "line") k.dataset.fill = ""; const t = document.createElement("span"); t.textContent = s.label; li.append(k, t); c.legend.append(li); }
    c.table.replaceChildren();
    const head = c.table.createTHead().insertRow(); const hx = document.createElement("th"); hx.textContent = (spec.x && spec.x.label) || "x"; head.append(hx);
    for (const s of c.series) { const th = document.createElement("th"); th.textContent = s.label; head.append(th); }
    const tb = c.table.createTBody();
    for (const x of xs.slice(0, 200)) { const tr = tb.insertRow(); tr.insertCell().textContent = c.fx(x); for (const s of c.series) tr.insertCell().textContent = s.byX.has(x) ? c.fy(s.byX.get(x)) : ""; }
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
