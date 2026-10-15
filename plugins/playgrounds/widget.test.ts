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
  expect(rejected!.base).toBeCloseTo(served!.top - 2);
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
  (dom.window as unknown as { playground: { params: { set(name: string, value: number): void } } }).playground.params.set("capacity", 130);
  expect(result()).toBe("Over 30 seconds, all 840 requests were served; this is the smallest bucket that does.");
  expect(chartIn(dom.window, "traffic").bars.filter((b) => b.fill === "var(--pg-bad)")).toHaveLength(0);
  dom.window.close();
});
