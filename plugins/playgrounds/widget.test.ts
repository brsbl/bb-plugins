import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { expect, it } from "vitest";
import { SETS_CSS } from "./sets.js";
import { kitProblems } from "./validate.js";
import { WIDGET_MESSAGE_SOURCE, buildWidgetDocument, fallbackTheme, pageParts } from "./widget.js";

it("keeps stored state and theme values from closing the bridge script", () => {
  const doc = buildWidgetDocument({
    id: "a",
    html: "<p>Body</p>",
    state: { note: "</script><script>alert(1)</script>" },
    theme: fallbackTheme,
  });
  expect(doc.match(/<\/script>/g)).toHaveLength(1);
  expect(doc).toContain("<body><p>Body</p></body>");
});

it("keeps cards written for Interactive Answers working", () => {
  const legacy = buildWidgetDocument({
    id: "a",
    html: '<div class="ia-seg"><button>Sine</button></div><script>window.answer.save({})</script>',
    state: null,
    theme: fallbackTheme,
  });
  expect(legacy).toContain("window.answer = window.playground");
  expect(legacy).toContain(".ia-seg {");
  expect(legacy).toContain("--ia-hairline:");
  const current = buildWidgetDocument({ id: "b", html: '<div class="pg-seg"></div>', state: null, theme: fallbackTheme });
  expect(current).not.toContain(".ia-seg {");
});

it("ships the component kit inside the frame bridge", () => {
  const doc = buildWidgetDocument({
    id: "a",
    html: '<div data-pg="dial" data-param="cutoff"></div>',
    state: { params: { cutoff: 900 } },
    theme: fallbackTheme,
  });
  expect(doc).toContain(".pg-dial {");
  expect(doc).toContain("setParams");
  expect(doc.indexOf("api.params = params")).toBeLessThan(doc.indexOf("window.playground = Object.freeze(api)"));
});

function frame(html: string) {
  const audioContexts: unknown[] = [];
  const dom = new JSDOM(buildWidgetDocument({ id: "a", html, state: null, theme: fallbackTheme }), {
    runScripts: "dangerously",
    pretendToBeVisual: true,
    beforeParse(window) {
      window.Element.prototype.setPointerCapture = () => {};
      Object.assign(window, {
        matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
        ResizeObserver: class { observe() {} disconnect() {} },
        IntersectionObserver: class { observe() {} disconnect() {} },
        AudioContext: class {
          state = "suspended";
          constructor() { audioContexts.push(this); }
          resume() { return Promise.resolve(); }
        },
      });
    },
  });
  return { dom, audioContexts };
}

it("keeps the shipped .pg-photos row layout for cards that don't use the photos component", () => {
  expect(SETS_CSS).not.toMatch(/(^|\n)\.pg-photos[\s{:>]/);
  expect(SETS_CSS).toContain("[data-pg=photos] {");
  const doc = buildWidgetDocument({ id: "a", html: '<div class="pg-photos"><img alt=""></div>', state: null, theme: fallbackTheme });
  expect(doc).toContain(".pg-photos { display: grid; grid-template-columns: repeat(3, 1fr);");
});

it("keeps buttons and segments whole at narrow widths, and scrolls wide tables", () => {
  const doc = buildWidgetDocument({ id: "a", html: '<div data-pg="table" data-name="t"></div>', state: null, theme: fallbackTheme });
  expect(doc).toMatch(/\.pg-btn, \.pg-btn-primary \{[^}]*white-space: nowrap/);
  expect(doc).toMatch(/\.pg-seg \{[^}]*flex-wrap: wrap/);
  expect(doc).toContain("[data-pg=table] { max-width: 100%; overflow-x: auto; }");
});

it("doesn't start audio when someone taps a card without sound", () => {
  const { dom, audioContexts } = frame('<label data-pg="field" data-param="income" data-label="Income"></label>');
  dom.window.document.body.dispatchEvent(new dom.window.Event("pointerdown", { bubbles: true }));
  expect(audioContexts).toHaveLength(0);
  dom.window.close();
});

async function command(window: JSDOM["window"], action: string, args: unknown[]) {
  if (window.document.readyState !== "complete") await new Promise((resolve) => window.addEventListener("load", resolve));
  const results: { type?: string; cmdId?: string; ok?: boolean; value?: unknown; error?: string }[] = [];
  window.addEventListener("message", (event: Event) => {
    const data = (event as MessageEvent).data as (typeof results)[number] | null;
    if (data?.type === "result") results.push(data);
  });
  const cmdId = "c" + Math.random();
  window.dispatchEvent(new window.MessageEvent("message", { data: { source: WIDGET_MESSAGE_SOURCE, type: "command", cmdId, action, args }, source: window }));
  await new Promise((resolve) => setTimeout(resolve, 20));
  return results.find((result) => result.cmdId === cmdId);
}

it("returns to text after a scrub number is typed in", async () => {
  const { dom } = frame('<p><span data-pg="scrub" data-param="income" data-min="0" data-max="500000" data-step="1000" data-value="140000" data-prefix="$"></span></p>');
  const { window } = dom;
  if (window.document.readyState !== "complete") await new Promise((resolve) => window.addEventListener("load", resolve));
  const scrub = window.document.querySelector(".pg-scrub") as HTMLElement;
  scrub.dispatchEvent(new window.MouseEvent("pointerdown", { bubbles: true, button: 0 }));
  scrub.dispatchEvent(new window.MouseEvent("pointerup", { bubbles: true, button: 0 }));
  const input = scrub.querySelector("input") as HTMLInputElement;
  expect(input).not.toBeNull();
  input.value = "150000";
  input.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  expect(scrub.querySelector("input")).toBeNull();
  expect(scrub.textContent).toBe("$150,000");
  window.close();
});

it("reports an agent's illegal board move as an error", async () => {
  const { dom } = frame(
    '<div data-pg="turn"></div><div data-pg="board" data-param="board" data-rows="3" data-cols="3"></div>' +
      '<script>window.playground.ui.game({ you: "X", me: "O", fromCell: (r, c) => r * 3 + c, move(b, i, who) { const r = Math.floor(i / 3), c = i % 3; if (b[r][c]) return null; b[r][c] = who; return b; } })</script>',
  );
  const result = await command(dom.window, "select", ["board", 0, 0]);
  expect(result).toMatchObject({ ok: false });
  expect(result?.error).toMatch(/player's turn/);
  dom.window.close();
});

it("lets a card's own actions win over the kit's built-in actions", async () => {
  const { dom } = frame(
    '<label data-pg="field" data-param="income" data-label="Income"></label>' +
      '<script>window.playground.expose({ select: (stop) => "picked " + stop })</script>',
  );
  const { window } = dom;
  if (window.document.readyState !== "complete") await new Promise((resolve) => window.addEventListener("load", resolve));
  const results: unknown[] = [];
  window.addEventListener("message", (event: Event) => {
    const data = (event as MessageEvent).data as { type?: string } | null;
    if (data?.type === "result") results.push(data);
  });
  window.dispatchEvent(new window.MessageEvent("message", {
    data: { source: WIDGET_MESSAGE_SOURCE, type: "command", cmdId: "c1", action: "select", args: ["Ferry"] },
    source: window,
  }));
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(results).toContainEqual(expect.objectContaining({ cmdId: "c1", ok: true, value: "picked Ferry" }));
  window.close();
});

it("keeps a whole page's styles, scripts and body theme when it's shown as a card", () => {
  const page = '<!doctype html><html><head><title>Dial</title><meta charset="utf-8"><style>.iso{color:red}</style></head><body class="iso" data-theme="dark" onload="x()"><main class="iso-page">gauge</main><script type="module">go()</script></body></html>';
  const { markup, bodyAttributes } = pageParts(page);
  expect(bodyAttributes).toBe(' class="iso" data-theme="dark"');
  expect(markup).toBe('<style>.iso{color:red}</style><main class="iso-page">gauge</main><script type="module">go()</script>');
  expect(pageParts("<p>Body</p>")).toEqual({ markup: "<p>Body</p>", bodyAttributes: "" });
  const doc = buildWidgetDocument({ id: "a", html: page, state: null, theme: fallbackTheme });
  expect(doc).toContain('<body class="iso" data-theme="dark"><script>');
  expect(doc).toContain('</script><style>.iso{color:red}</style>');
  expect(doc).not.toContain("onload");
});

it("passes a whole page without a complete body through unchanged, quickly", () => {
  for (const page of ["<!doctype html><title>x</title><p>hi</p>", '<!doctype html><body class="x"><p>hi']) {
    expect(pageParts(page)).toEqual({ markup: page, bodyAttributes: "" });
  }
  const started = performance.now();
  pageParts("<!doctype html>" + "<head".repeat(200_000));
  pageParts("<!doctype html><body>" + "<body".repeat(200_000));
  const head = (tag: string) => `<!doctype html><html><head>${tag.repeat(200_000)}</head><body><p>x</p></body></html>`;
  expect(pageParts(head("<title")).markup).toContain("<p>x</p>");
  expect(pageParts(head("<meta")).markup).toContain("<p>x</p>");
  expect(performance.now() - started).toBeLessThan(1_000);
});

it("gives an Anatomy page bb's theme before its own scripts read it", async () => {
  const { dom } = frame(
    '<!doctype html><html><head></head><body class="iso" data-theme="dark"><main class="iso-page"></main>' +
      "<script>window.seen = document.body.dataset.theme</script></body></html>",
  );
  expect((dom.window as unknown as { seen?: string }).seen).toBe(fallbackTheme.scheme);
  dom.window.close();
});

function chartIn(window: JSDOM["window"], name: string) {
  const svg = window.document.querySelector(`[data-name="${name}"] svg`)!;
  const bars = Array.from(svg.querySelectorAll("path.bar")).map((bar) => {
    const [, left, base] = /^M([\d.-]+) ([\d.-]+)V/.exec(bar.getAttribute("d")!)!;
    const top = Math.min(...[...bar.getAttribute("d")!.matchAll(/[ QH]([\d.-]+) ([\d.-]+)/g)].map((m) => Number(m[2])), Number(base));
    return { i: bar.getAttribute("data-i"), fill: bar.getAttribute("fill"), left: Number(left), base: Number(base), top };
  });
  const ticks = Array.from(svg.querySelectorAll('text[text-anchor="end"]')).map((t) => Number.parseFloat(t.textContent!)).filter(Number.isFinite);
  return { bars, top: Math.max(...ticks) };
}

it("stacks bar series on request and keeps side-by-side bars by default", () => {
  const series = '[{ label: "Served", points: [["a", 3], ["b", 1]] }, { label: "Rejected", points: [["a", 2], ["b", 0]] }]';
  const { dom } = frame(
    '<figure data-pg="chart" data-name="stacked"></figure><figure data-pg="chart" data-name="grouped"></figure>' +
      `<script>window.playground.ui.chart("stacked", { kind: "bars", stack: true, series: ${series} });` +
      `window.playground.ui.chart("grouped", { kind: "bars", series: ${series} })</script>`,
  );
  const stacked = chartIn(dom.window, "stacked");
  expect(stacked.bars.map((b) => b.i)).toEqual(["0", "0", "1"]);
  const [served, rejected] = stacked.bars;
  expect(rejected!.left).toBe(served!.left);
  expect(rejected!.base).toBeCloseTo(served!.top - 1);
  expect(stacked.top).toBeGreaterThanOrEqual(5);
  const grouped = chartIn(dom.window, "grouped");
  expect(grouped.bars).toHaveLength(4);
  expect(grouped.bars[0]!.left).not.toBe(grouped.bars[2]!.left);
  expect(grouped.top).toBeLessThan(5);
  dom.window.close();
});

it("extends the y axis to a reference line above every value", () => {
  const { dom } = frame(
    '<figure data-pg="chart" data-name="load"></figure>' +
      '<script>window.playground.ui.chart("load", { series: [{ label: "Load", points: [[0, 4], [1, 10]] }], marks: [{ y: 50, label: "Capacity" }] })</script>',
  );
  expect(chartIn(dom.window, "load").top).toBeGreaterThanOrEqual(50);
  dom.window.close();
});

it("draws the rate-limiter reference at once and recomputes it from its controls", () => {
  const html = readFileSync(new URL("./skills/playgrounds/references/rate-limiter.html", import.meta.url), "utf8");
  expect(kitProblems(html)).toEqual([]);
  const { dom } = frame(html);
  const { document } = dom.window;
  const result = () => document.getElementById("result")!.textContent;
  expect(result()).toBe("Over 30 seconds, 82 of 840 requests were rejected; a bucket of 130 tokens would serve them all.");
  const before = chartIn(dom.window, "traffic");
  expect(before.bars.filter((b) => b.fill === "var(--pg-bad)")).toHaveLength(2);
  expect(document.querySelector('[data-name="traffic"] .mark-label')!.textContent).toBe("Refill rate 35/s");
  expect(Array.from(document.querySelectorAll('[data-name="traffic"] text.peak')).map((t) => t.textContent)).toEqual(["41 rejected", "41 rejected"]);
  expect((document.querySelector('[data-name="traffic"] .pg-chart-legend') as HTMLElement).hidden).toBe(true);
  (dom.window as unknown as { playground: { params: { set(name: string, value: number): void } } }).playground.params.set("capacity", 130);
  expect(result()).toBe("Over 30 seconds, all 840 requests were served; this is the smallest bucket that does.");
  expect(chartIn(dom.window, "traffic").bars.filter((b) => b.fill === "var(--pg-bad)")).toHaveLength(0);
  dom.window.close();
});

function chartParts(window: JSDOM["window"], name: string) {
  const fig = window.document.querySelector(`[data-name="${name}"]`)!;
  return {
    legend: fig.querySelector(".pg-chart-legend") as HTMLElement,
    lines: Array.from(fig.querySelectorAll("path.line")).map((line) => ({ stroke: line.getAttribute("stroke"), muted: line.classList.contains("muted") })),
    ends: Array.from(fig.querySelectorAll("text.end")).map((text) => text.textContent),
    peaks: Array.from(fig.querySelectorAll("text.peak")).map((text) => text.textContent),
    bars: Array.from(fig.querySelectorAll("path.bar")).map((bar) => bar.getAttribute("fill")),
  };
}

it("names up to four lines at their ends instead of a legend, and falls back to the legend past that", () => {
  const lines = (n: number) => JSON.stringify(Array.from({ length: n }, (_, k) => ({ label: "S" + k, points: [[0, 10 * k], [1, 10 * k + 40]] })));
  const { dom } = frame(
    '<figure data-pg="chart" data-name="few"></figure><figure data-pg="chart" data-name="many"></figure><figure data-pg="chart" data-name="legend"></figure>' +
      `<script>window.playground.ui.chart("few", { y: { unit: "ms" }, series: ${lines(3)} });` +
      `window.playground.ui.chart("many", { series: ${lines(5)} });` +
      `window.playground.ui.chart("legend", { labels: "legend", series: ${lines(2)} })</script>`,
  );
  const few = chartParts(dom.window, "few");
  expect(few.legend.hidden).toBe(true);
  expect(few.ends).toEqual(["S2 60 ms", "S1 50 ms", "S0 40 ms"]);
  const many = chartParts(dom.window, "many");
  expect(many.legend.hidden).toBe(false);
  expect(many.legend.children).toHaveLength(5);
  expect(many.ends).toEqual([]);
  expect(chartParts(dom.window, "legend").ends).toEqual([]);
  dom.window.close();
});

it("keeps the focused series in color and mutes the rest, or one category's bars", () => {
  const { dom } = frame(
    '<figure data-pg="chart" data-name="regions"></figure><figure data-pg="chart" data-name="days"></figure>' +
      '<script>window.playground.ui.chart("regions", { focus: "Europe", series: [{ label: "Asia", points: [[0, 1], [1, 2]] }, { label: "Europe", points: [[0, 3], [1, 9]] }, { label: "US", points: [[0, 2], [1, 5]] }] });' +
      'window.playground.ui.chart("days", { kind: "bars", focus: "Thu", y: { unit: "$" }, series: [{ label: "Spend", points: [["Wed", 140], ["Thu", 260], ["Fri", 110]] }] })</script>',
  );
  const regions = chartParts(dom.window, "regions");
  expect(regions.lines).toEqual([
    { stroke: "var(--pg-chart-context)", muted: true },
    { stroke: "var(--pg-chart-context)", muted: true },
    { stroke: "var(--pg-series-1)", muted: false },
  ]);
  expect(regions.ends).toContain("Europe 9");
  const days = chartParts(dom.window, "days");
  const context = "color-mix(in oklch, var(--pg-series-1) 38%, var(--card))";
  expect(days.bars).toEqual([context, "var(--pg-series-1)", context]);
  expect(days.peaks).toEqual(["$260"]);
  dom.window.close();
});

it("labels a focused bar series' peaks in place instead of a legend, and tints the rest", () => {
  const series = '[{ label: "Served", points: [["a", 3], ["b", 1], ["c", 2]] }, { label: "Rejected", points: [["a", 2], ["b", 0], ["c", 2]], color: "var(--pg-bad)" }]';
  const { dom } = frame(
    '<figure data-pg="chart" data-name="focused"></figure><figure data-pg="chart" data-name="keyed"></figure>' +
      `<script>window.playground.ui.chart("focused", { kind: "bars", stack: true, focus: "Rejected", series: ${series} });` +
      `window.playground.ui.chart("keyed", { kind: "bars", stack: true, focus: "Rejected", labels: "legend", series: ${series} })</script>`,
  );
  const focused = chartParts(dom.window, "focused");
  expect(focused.peaks).toEqual(["2 rejected", "2 rejected"]);
  expect(focused.legend.hidden).toBe(true);
  expect(new Set(focused.bars)).toEqual(new Set(["color-mix(in oklch, var(--pg-series-1) 38%, var(--card))", "var(--pg-bad)"]));
  const keyed = chartParts(dom.window, "keyed");
  expect(keyed.legend.hidden).toBe(false);
  expect(Array.from(keyed.legend.children).map((li) => li.textContent)).toEqual(["Served", "Rejected"]);
  dom.window.close();
});

it("labels a reference line at its end and moves the label off the data there", () => {
  const { dom } = frame(
    '<figure data-pg="chart" data-name="clear"></figure><figure data-pg="chart" data-name="crowded"></figure>' +
      '<script>window.playground.ui.chart("clear", { series: [{ label: "Load", points: [[0, 10], [1, 20], [2, 10], [3, 12]] }], marks: [{ y: 50, label: "Limit" }] });' +
      'window.playground.ui.chart("crowded", { series: [{ label: "Load", points: [[0, 10], [1, 10], [2, 10], [3, 52]] }], marks: [{ y: 50, label: "Limit" }] })</script>',
  );
  for (const [name, below] of [["clear", false], ["crowded", true]] as const) {
    const fig = dom.window.document.querySelector(`[data-name="${name}"]`)!;
    const line = fig.querySelector("line.mark")!, label = fig.querySelector(".mark-label")!;
    expect(label.getAttribute("text-anchor")).toBe("end");
    expect(label.getAttribute("x")).toBe(line.getAttribute("x2"));
    expect(Number(label.getAttribute("y")) > Number(line.getAttribute("y1"))).toBe(below);
  }
  dom.window.close();
});

it("draws a piece's mark on top of its color so pieces don't differ by color alone", () => {
  const { dom } = frame(
    '<div data-pg="board" data-param="b" data-rows="1" data-cols="3" data-pieces="X:var(--pg-bad):Hit:×,O:var(--pg-mark-muted):Miss:•,S:var(--pg-accent):Ship"></div>' +
      '<script>window.playground.params.set("b", [["X", "O", "S"]])</script>',
  );
  const cells = Array.from(dom.window.document.querySelectorAll(".pg-board button"));
  expect(cells.map((cell) => cell.querySelector("b")?.textContent ?? null)).toEqual(["×", "•", null]);
  expect(cells.map((cell) => cell.getAttribute("aria-label"))).toEqual(["Row 1, column 1, Hit", "Row 1, column 2, Miss", "Row 1, column 3, Ship"]);
  dom.window.close();
});

it("updates mock-up outputs with both setter forms and rejects unknown inputs atomically", async () => {
  const { dom } = frame('<button data-pg="toggle" data-param="email"></button><button data-pg="toggle" data-param="push"></button><output id="preview"></output>' +
    '<script>const P = playground.params; const update = () => document.querySelector("#preview").textContent = JSON.stringify(P.all()); P.on(update); update();</script>');
  const P = (dom.window as unknown as { playground: { params: { set(...args: unknown[]): unknown; get(name: string): unknown } } }).playground.params;
  expect(P.set({ email: true, push: true })).toEqual({ email: true, push: true });
  expect(dom.window.document.querySelector("#preview")!.textContent).toBe('{"email":true,"push":true}');
  expect(P.set("email", false)).toBe(false);
  expect(() => P.set({ email: true, typo: false })).toThrow(/Unknown playground parameter "typo".*Declare it/);
  expect(P.get("email")).toBe(false);
  expect(() => P.get("missing")).toThrow(/Unknown playground parameter/);
  expect(() => P.set("email")).toThrow(/params.set\(name, value\)/);
  expect(() => P.set([])).toThrow(/params.set\(name, value\)/);
  expect(() => P.set("constructor", true)).toThrow(/Unknown playground parameter/);
  expect(await command(dom.window, "setParams", [{ email: true, typo: true }])).toMatchObject({ ok: false, error: expect.stringContaining('"typo"') });
  expect(P.get("email")).toBe(false);
  expect(await command(dom.window, "setParams", [{ email: true }])).toMatchObject({ ok: true, value: { set: { email: true } } });
  expect(dom.window.document.querySelector('[data-param="email"]')!.getAttribute("aria-pressed")).toBe("true");
  dom.window.close();
});

it("drives programmatic choices and text/boolean aliases through user and agent input", async () => {
  const { dom } = frame('<button id="change">Change</button><output></output><script>' +
    'const P = playground.params; P.define("mode", {type:"select",options:["near","far"],default:"near"});' +
    'P.define("caption", {type:"string",default:"Ready"}); P.define("enabled", {type:"boolean",default:false});' +
    'const draw = () => { document.querySelector("output").textContent = JSON.stringify(P.all()); document.querySelector("button").setAttribute("aria-pressed", String(P.get("enabled"))); };' +
    'P.on(draw); draw(); document.querySelector("button").onclick = () => P.set({mode:"far",caption:"Changed",enabled:true});</script>');
  dom.window.document.querySelector("button")!.click();
  const output = () => JSON.parse(dom.window.document.querySelector("output")!.textContent!);
  expect(output()).toEqual({ mode: "far", caption: "Changed", enabled: true });
  expect(dom.window.document.querySelector("button")!.getAttribute("aria-pressed")).toBe("true");
  expect(await command(dom.window, "setParams", [{ mode: "near", caption: "From agent", enabled: false }])).toMatchObject({ ok: true });
  expect(output()).toEqual({ mode: "near", caption: "From agent", enabled: false });
  expect(dom.window.document.querySelector("button")!.getAttribute("aria-pressed")).toBe("false");
  dom.window.close();
});

it("preserves typed choices and explicit numeric bounds through the card bridge", async () => {
  const { dom } = frame('<output></output><script>const P = playground.params;' +
    'P.define("step", {type:"number",min:0,max:4,step:1,default:0});' +
    'P.define("size", {options:[2,8],default:2}); P.define("mode", {options:[{value:"a",label:"A"},{value:"b",label:"B"}],default:"a"});' +
    'P.on(() => document.querySelector("output").textContent = JSON.stringify(P.all()));</script>');
  expect(await command(dom.window, "setParams", [{ step: 4, size: 8, mode: "b" }])).toMatchObject({ ok: true });
  expect(JSON.parse(dom.window.document.querySelector("output")!.textContent!)).toEqual({ step: 4, size: 8, mode: "b" });
  expect(await command(dom.window, "setParams", [{ step: 12, size: "8" }])).toMatchObject({ ok: true });
  expect(JSON.parse(dom.window.document.querySelector("output")!.textContent!)).toEqual({ step: 4, size: 2, mode: "b" });
  dom.window.close();
});

it("keeps native and non-button toggles operable with visible wrapping labels", async () => {
  const { dom } = frame('<div class="pg-form"><button data-pg="toggle" data-param="email" data-label="Email notifications for important release changes"></button><div data-pg="toggle" data-param="push" data-label="Push notifications for important release changes"></div></div>');
  const { window } = dom;
  if (window.document.readyState !== "complete") await new Promise((resolve) => window.addEventListener("load", resolve));
  const button = window.document.querySelector("button")!;
  const div = window.document.querySelector('[data-param="push"]') as HTMLElement;
  expect(button.type).toBe("button");
  button.click();
  expect(button.getAttribute("aria-pressed")).toBe("true");
  for (const key of ["Enter", " "]) {
    div.dispatchEvent(new window.KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
    expect(div.getAttribute("aria-pressed")).toBe(key === "Enter" ? "true" : "false");
  }
  expect(div.getAttribute("role")).toBe("button");
  expect(div.tabIndex).toBe(0);
  for (const el of [button, div]) {
    const css = window.getComputedStyle(el);
    expect(css.whiteSpace).toBe("normal");
    expect(css.overflowWrap).toBe("anywhere");
    expect(css.minWidth).toMatch(/^0(px)?$/);
    expect(css.maxWidth).toBe("100%");
    expect(el.textContent).toContain("notifications for important release changes");
  }
  window.close();
});

it("does not apply a standalone frame's queued save messages as remote state", async () => {
  const { dom } = frame('<button data-pg="toggle" data-param="enabled"></button><output></output><script>' +
    'const P=playground.params;P.get("enabled");P.on(()=>{document.querySelector("output").textContent=String(P.get("enabled"));playground.save({note:"saved"});});</script>');
  const { window } = dom;
  if (window.document.readyState !== "complete") await new Promise((resolve) => window.addEventListener("load", resolve));
  window.document.querySelector("button")!.click();
  const output = window.document.querySelector("output")!;
  expect(output.textContent).toBe("true");
  window.dispatchEvent(new window.MessageEvent("message", {
    source: window, data: { source: WIDGET_MESSAGE_SOURCE, type: "state", state: { params: { enabled: false } }, base: 0 },
  }));
  expect(output.textContent).toBe("true");
  expect(await command(window, "setParams", [{ enabled: false }])).toMatchObject({ ok: true });
  expect(output.textContent).toBe("false");
  window.close();
});

it("still applies shared state sent by an embedded card's parent", () => {
  const { dom } = frame('<button data-pg="toggle" data-param="enabled"></button><output></output><script>' +
    'const P=playground.params;P.get("enabled");P.on(()=>document.querySelector("output").textContent=String(P.get("enabled")));</script>');
  const host = new JSDOM("");
  Object.defineProperty(dom.window, "parent", { value: host.window });
  dom.window.dispatchEvent(new dom.window.MessageEvent("message", {
    source: host.window, data: { source: WIDGET_MESSAGE_SOURCE, type: "state", state: { params: { enabled: true } }, version: 1 },
  }));
  expect(dom.window.document.querySelector("output")!.textContent).toBe("true");
  dom.window.close(); host.window.close();
});
