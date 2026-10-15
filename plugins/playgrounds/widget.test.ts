import { JSDOM } from "jsdom";
import { expect, it } from "vitest";
import { SETS_CSS } from "./sets.js";
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

function frame(html: string, { reducedMotion = false } = {}) {
  const audioContexts: unknown[] = [];
  const dom = new JSDOM(buildWidgetDocument({ id: "a", html, state: null, theme: fallbackTheme }), {
    runScripts: "dangerously",
    pretendToBeVisual: true,
    beforeParse(window) {
      window.Element.prototype.setPointerCapture = () => {};
      Object.assign(window, {
        matchMedia: (query: string) => ({ matches: reducedMotion && query.includes("reduce"), addEventListener() {}, removeEventListener() {} }),
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

const FLOW_CARD =
  '<div data-pg="flow" data-name="jobs" data-label="Jobs through the queue"></div>' +
  "<script>window.flow = window.playground.ui.flow(\"jobs\", { stations: [" +
  '{ id: "in", label: "Jobs", kind: "source" }, { id: "q", label: "Queue", kind: "queue" }, { id: "w", label: "Worker", kind: "worker" },' +
  '{ id: "done", label: "Done", kind: "sink" }, { id: "failed", label: "Failed", kind: "drop" }],' +
  ' links: [["in", "q"], ["q", "w"], ["w", "done"], ["w", "q", "retry"], ["w", "failed", "gave up"]] });</script>';
type Flow = {
  send: (...args: unknown[]) => boolean;
  count: (id: string, n: number, more?: { max?: number; text?: string }) => void;
  status: (id: string, value: string | null) => void;
  clear: () => void;
};
const flowOf = (window: JSDOM["window"]) => (window as unknown as { flow: Flow }).flow;

it("draws a flow from its markup, with every station and link", () => {
  const { dom } = frame(FLOW_CARD);
  const { document } = dom.window;
  const host = document.querySelector('[data-pg="flow"]')!;
  expect(host.classList.contains("pg-flow")).toBe(true);
  expect(host.querySelector("svg")?.getAttribute("aria-label")).toBe("Jobs through the queue");
  expect([...host.querySelectorAll(".node")].map((n) => n.getAttribute("data-kind"))).toEqual(["source", "queue", "worker", "sink", "drop"]);
  expect([...host.querySelectorAll(".node .label")].map((n) => n.textContent)).toEqual(["Jobs", "Queue", "Worker", "Done", "Failed"]);
  expect(host.querySelectorAll(".link")).toHaveLength(5);
  expect([...host.querySelectorAll(".link-label")].map((n) => n.textContent)).toEqual(["retry", "gave up"]);
  dom.window.close();
});

it("shows counts and status on a flow's stations, and returns them from read", async () => {
  const { dom } = frame(FLOW_CARD);
  const flow = flowOf(dom.window);
  flow.count("q", 40);
  flow.count("done", 1250);
  flow.status("w", "down");
  const host = dom.window.document.querySelector('[data-pg="flow"]')!;
  const queue = host.querySelector('.node[data-kind="queue"]')!;
  expect(queue.querySelector(".n")?.textContent).toBe("40");
  expect(queue.querySelectorAll(".wait").length).toBeGreaterThan(0);
  expect(queue.querySelectorAll(".wait").length).toBeLessThan(40);
  expect(queue.querySelector(".more")?.textContent).toBe("+" + (40 - queue.querySelectorAll(".wait").length));
  expect(host.querySelector('.node[data-kind="sink"] .value')?.textContent).toBe("1,250");
  const worker = host.querySelector('.node[data-kind="worker"]')!;
  expect(worker.getAttribute("data-status")).toBe("down");
  expect(worker.querySelector(".value")?.textContent).toBe("Down");
  flow.count("q", 12, { max: 80 });
  expect(queue.querySelector(".n")?.textContent).toBe("12 / 80");
  expect(queue.querySelector(".fill")).not.toBeNull();
  expect(() => flow.count("nowhere", 1)).toThrow(/No station nowhere/);
  expect(() => flow.status("w", "sleeping")).toThrow(/up, down or busy/);
  const result = await command(dom.window, "read", []);
  expect(result).toMatchObject({ ok: true });
  const stations = (result?.value as { outputs: { jobs: { value: { stations: Record<string, unknown> } } } }).outputs.jobs.value.stations;
  expect(stations.q).toEqual({ label: "Queue", kind: "queue", count: 12, max: 80, text: null, status: null });
  expect(stations.w).toMatchObject({ status: "down" });
  expect(stations.done).toMatchObject({ count: 1250 });
  dom.window.close();
});

it("sends an item along a flow's links and removes it when it arrives", async () => {
  const { dom } = frame(FLOW_CARD);
  const flow = flowOf(dom.window);
  const items = () => dom.window.document.querySelectorAll('[data-pg="flow"] .item');
  expect(flow.send("w", "failed", { tone: "bad" })).toBe(true);
  expect(items()).toHaveLength(1);
  expect(items()[0]!.getAttribute("data-tone")).toBe("bad");
  expect(() => flow.send("in", "done")).toThrow(/No link from in to done/);
  await new Promise((resolve) => setTimeout(resolve, 1600));
  expect(items()).toHaveLength(0);
  expect(flow.send("in", "q", "w", "done")).toBe(true);
  flow.clear();
  expect(items()).toHaveLength(0);
  dom.window.close();
});

it("draws a burst as a capped cluster instead of an endless stream", () => {
  const { dom } = frame(FLOW_CARD);
  const flow = flowOf(dom.window);
  const sent = Array.from({ length: 200 }, () => flow.send("in", "q"));
  expect(sent.filter(Boolean).length).toBeGreaterThan(1);
  expect(sent.filter(Boolean).length).toBeLessThanOrEqual(10);
  expect(dom.window.document.querySelectorAll('[data-pg="flow"] .item').length).toBe(sent.filter(Boolean).length);
  dom.window.close();
});

it("moves nothing in a flow when the person prefers reduced motion, but still counts", () => {
  const { dom } = frame(FLOW_CARD, { reducedMotion: true });
  const flow = flowOf(dom.window);
  expect(flow.send("in", "q")).toBe(false);
  expect(dom.window.document.querySelectorAll('[data-pg="flow"] .item')).toHaveLength(0);
  flow.count("failed", 7);
  expect(dom.window.document.querySelector('[data-pg="flow"] .node[data-kind="drop"] .value')?.textContent).toBe("7");
  dom.window.close();
});

it("names a run's time in the model's units when the card gives a format", async () => {
  const { dom } = frame(
    '<div data-pg="run" data-name="sim" data-duration="120" data-autoplay="false"></div>' +
      '<script>window.sim = window.playground.ui.run("sim", { format: (t) => "minute " + Math.floor(t), seek() {} })</script>',
  );
  const out = dom.window.document.querySelector('[data-pg="run"] output')!;
  expect(out.textContent).toBe("minute 0");
  const result = await command(dom.window, "seek", ["sim", 42.5]);
  expect(result).toMatchObject({ ok: true, value: { t: 42.5 } });
  expect(out.textContent).toBe("minute 42");
  dom.window.close();
});

it("keeps a run without a format on its seconds readout", () => {
  const { dom } = frame('<div data-pg="run" data-name="sim" data-duration="30" data-autoplay="false"></div><script>window.playground.ui.run("sim", {}).seek(12)</script>');
  expect(dom.window.document.querySelector('[data-pg="run"] output')?.textContent).toBe("12 s");
  dom.window.close();
});

it("writes the outcome as one sentence with its key numbers in bold", async () => {
  const { dom } = frame('<p data-pg="outcome" data-name="result"></p><script>window.playground.ui.outcome("result", "Over 30 seconds, **82 requests were rejected**.")</script>');
  const p = dom.window.document.querySelector('[data-pg="outcome"]')!;
  expect(p.classList.contains("pg-outcome")).toBe(true);
  expect(p.querySelector("b")?.textContent).toBe("82 requests were rejected");
  expect(p.textContent).toBe("Over 30 seconds, 82 requests were rejected.");
  const result = await command(dom.window, "read", []);
  expect((result?.value as { outputs: Record<string, unknown> }).outputs.result).toEqual({ value: "Over 30 seconds, 82 requests were rejected.", tone: null });
  dom.window.close();
});
