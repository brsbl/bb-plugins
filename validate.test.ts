import { readdirSync, readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { expect, it } from "vitest";
import { CHART_RUNTIME } from "./charts.js";
import { CONTROLS_RUNTIME } from "./controls.js";
import { SETS_RUNTIME } from "./sets.js";
import { KIT_ATTRIBUTES, SHARED_ATTRIBUTES, assertKitMarkup, kitProblems } from "./validate.js";
import { buildWidgetDocument, fallbackTheme } from "./widget.js";

const RUNTIME = CONTROLS_RUNTIME + CHART_RUNTIME + SETS_RUNTIME;
const allowed = (kind: string, attr: string) => SHARED_ATTRIBUTES.includes(attr) || attr in (KIT_ATTRIBUTES[kind] ?? {});

it("accepts every reference card the skill tells agents to copy", () => {
  const dir = new URL("./skills/playgrounds/references/", import.meta.url);
  const cards = readdirSync(dir).filter((name) => name.endsWith(".html"));
  expect(cards.length).toBeGreaterThan(0);
  for (const name of cards) expect({ name, problems: kitProblems(readFileSync(new URL(name, dir), "utf8")) }).toEqual({ name, problems: [] });
});

it("rejects data-suffix, which the kit ignores, and names data-unit instead", () => {
  const html =
    '<p class="pg-sentence">We have <span data-pg="scrub" data-param="users" data-label="Daily users" data-suffix="k" data-min="10" data-max="5000" data-step="10" data-value="1000"></span> daily users,\n' +
    'holding each step <span data-pg="scrub" data-param="hold" data-label="Days per step" data-suffix=" days" data-min="1" data-max="7" data-step="1" data-value="2"></span>.</p>';
  expect(kitProblems(html)).toEqual([
    expect.stringMatching(/^line 1, <span data-pg="scrub" data-param="users">: data-suffix .*use data-unit="k"/),
    expect.stringMatching(/^line 2, <span data-pg="scrub" data-param="hold">: data-suffix .*use data-unit="days"/),
  ]);
});

it("rejects option labels with commas, which split one control into many", () => {
  const html =
    '<div data-pg="segmented" data-param="prog" data-label="Spacing steps" data-options="linear:Linear ×1–8,tshirt:Stepped 1,2,3,4,6,8,12,16,geo:Doubling 1,2,4,8,16" data-value="tshirt"></div>';
  const problems = kitProblems(html);
  expect(problems).toHaveLength(1);
  expect(problems[0]).toContain('extra options ("2", "3", "4", "6", "8", "12", "16")');
  expect(kitProblems(html.replace("Stepped 1,2,3,4,6,8,12,16", "Stepped 1–16").replace("Doubling 1,2,4,8,16", "Doubling 1–16"))).toEqual([]);
});

it("lists every problem in one error", () => {
  const html = [
    '<label data-pg="field" data-param="income" data-value="140000"></label>',
    '<div data-pg="slidr" data-param="x"></div>',
    '<div data-pg="segmented" data-param="plan" data-options="a:Basic,b:Pro" data-value="c"></div>',
    '<div data-pg="slider" data-param="rate" data-min="0" data-max="1,000" data-value="5"></div>',
    '<div data-pg="tabs" data-param="view"></div>',
    '<figure data-pg="chart" data-param="load"></figure>',
  ].join("\n");
  let message = "";
  try {
    assertKitMarkup(html);
  } catch (error) {
    message = (error as Error).message;
  }
  expect(message.split("\n")[0]).toContain("7 problems");
  for (const part of [
    'line 1, <label data-pg="field" data-param="income">: data-value="140000" is outside 0–1',
    'line 2, <div data-pg="slidr" data-param="x">: data-pg="slidr" isn\'t a kit component; did you mean "slider"?',
    'line 3, <div data-pg="segmented" data-param="plan">: data-value="c" isn\'t one of the data-options values',
    'line 4, <div data-pg="slider" data-param="rate">: data-max="1,000" must be a plain number',
    "line 5, <div data-pg=\"tabs\" data-param=\"view\">: tabs needs data-options",
    'line 6, <figure data-pg="chart" data-param="load">: data-param isn\'t a chart attribute, so the kit ignores it; use data-name.',
    'line 6, <figure data-pg="chart" data-param="load">: chart needs data-name',
  ])
    expect(message).toContain(part);
});

it("leaves non-kit elements, scripts and comments alone, quickly", () => {
  const html =
    '<div class="row" data-suffix="k" data-channel="email"><button data-page="home">Home</button></div>' +
    '<!-- <div data-pg="nope"> --><script>el.innerHTML = \'<div data-pg="nope" data-suffix="x">\'</script>' +
    '<span data-pg="scrub" data-param="n" data-label="Count &amp; more" data-min="0" data-max="10" data-value="3" data-show="mode=a"></span>';
  expect(kitProblems(html)).toEqual([]);
  const started = performance.now();
  for (const junk of ["<!--", "<script>", "<script ", '<a b="', "<a "]) kitProblems(junk.repeat(200_000));
  expect(performance.now() - started).toBeLessThan(2_000);
});

it("knows every component the kit hydrates", () => {
  const hydrate = CONTROLS_RUNTIME.slice(CONTROLS_RUNTIME.indexOf("function hydrate(root)"), CONTROLS_RUNTIME.indexOf("for (const fn of afterHydrate"));
  const kinds = new Set([
    ...[...hydrate.matchAll(/kind === "(\w+)"/g)].map((m) => m[1]!),
    ...[...CONTROLS_RUNTIME.matchAll(/^ {4}(\w+)\(el, name\) \{$/gm)].map((m) => m[1]!),
    ...[...RUNTIME.matchAll(/BUILD\.(\w+) = /g)].map((m) => m[1]!),
    ...(/Object\.assign\(SET_KINDS, \{([^}]*)\}\)/.exec(SETS_RUNTIME)?.[1] ?? "").split(",").map((part) => part.split(":")[0]!.trim()),
    ...[...RUNTIME.matchAll(/\[data-pg=["']?(\w+)["']?\]/g)].map((m) => m[1]!),
  ]);
  expect(kinds.size).toBeGreaterThan(25);
  expect([...kinds].filter((kind) => !(kind in KIT_ATTRIBUTES))).toEqual([]);
  const selected = [...RUNTIME.matchAll(/\[data-pg=["']?(\w+)["']?\]\[data-([\w-]+)/g)].map((m) => [m[1]!, m[2]!]);
  expect(selected.length).toBeGreaterThan(3);
  expect(selected.filter(([kind, attr]) => !allowed(kind!, attr!))).toEqual([]);
  const copied = /for \(const a of \[([^\]]*)\]\) if \(el\.hasAttribute\(a\)\)/.exec(CHART_RUNTIME)?.[1] ?? "";
  const chartAttributes = [...copied.matchAll(/"data-([\w-]+)"/g)].map((m) => m[1]!);
  expect(chartAttributes).toContain("kind");
  expect(chartAttributes.filter((attr) => attr !== "pg" && !allowed("chart", attr))).toEqual([]);
});

const EVERY_COMPONENT = `
<label data-pg="field" data-param="income" data-label="Income" data-prefix="$" data-min="0" data-max="10" data-value="1" data-help="Before tax"></label>
<label data-pg="field" data-param="who" data-input="text" data-placeholder="Name" data-value="Sam"></label>
<label data-pg="select" data-param="term" data-options="30:30 years,15:15 years" data-value="30"></label>
<div data-pg="slider" data-param="rate" data-unit="%" data-min="0" data-max="1" data-step="0.01" data-value="0.5" data-scale="lin"></div>
<div data-pg="tabs" data-param="view" data-options="a:A,b:B"></div>
<div data-pg="list" data-param="pick" data-options="a:A,b:B" data-notes="x|y"></div>
<div data-pg="board" data-param="board" data-rows="3" data-cols="3" data-pieces="X:#000:Ex" data-shape="round"></div>
<div data-pg="dial" data-param="cut" data-min="20" data-max="2000" data-scale="log" data-unit="Hz"></div>
<div data-pg="fader" data-param="vol"></div>
<div data-pg="stepper" data-param="n" data-min="0" data-max="10" data-step="1"></div>
<div data-pg="segmented" data-param="seg" data-options="a:A,b:B"></div>
<div data-pg="picker" data-param="wave" data-options="sine:Sine,square:Square" data-caption="Wave"></div>
<button data-pg="toggle" data-param="on" data-value="true"></button>
<div data-pg="steps" data-param="seq" data-rows="Kick,Snare" data-steps="8"></div>
<p><span data-pg="scrub" data-param="users" data-min="1" data-max="100" data-value="10" data-prefix="~"></span></p>
<div data-pg="keyboard" data-from="60" data-count="13" data-keys="awsedftgyhujk" data-label="Keys"></div>
<div data-pg="pads" data-pads="Kick:a,Snare:s" data-cols="2"></div>
<div data-pg="presets" data-label="Presets"><script type="application/json">{"Low":{"rate":0.1}}</script></div>
<div data-pg="scope"></div>
<dl data-pg="readouts"><div data-readout="price" data-label="Price"></div></dl>
<div data-pg="table" data-name="rows"></div>
<figure data-pg="chart" data-name="load" data-label="Load" data-kind="line" data-height="160"></figure>
<svg data-pg="chart" data-name="mix" data-kind="bars"></svg>
<div data-pg="agent" data-empty="Ask"></div>
<div data-pg="meter"></div>
<button data-pg="record"></button><button data-pg="send" data-label="Take"></button>
<div data-pg="run" data-name="sim" data-duration="10" data-chart="load" data-unit="s" data-speed="1" data-autoplay="false"></div>
<div data-pg="turn"></div>
<div data-pg="guide" data-param="step" data-label="Step"><section data-step="1">a</section><section data-step="2">b</section></div>
<div data-pg="photos"><img alt="" src="data:,"></div>
<div data-pg="answer" data-name="verdict" data-label="Verdict"></div>
<div data-pg="breakdown" data-name="parts"></div>
<script>window.playground.ui.show("price", 12)</script>
<script>window.playground.ui.table("rows", { columns: ["A"], rows: [[1]] })</script>
<script>window.playground.ui.chart("load", { series: [{ label: "x", points: [[0, 1], [1, 2]] }] })</script>
<script>window.playground.ui.chart("mix", { series: [{ label: "y", points: [["a", 1]] }] })</script>
<script>window.playground.ui.answer("verdict", { value: "ok" })</script>
<script>window.playground.ui.breakdown("parts", [{ label: "a", value: 1 }])</script>
<script>window.playground.ui.run("sim", { tick() {}, seek() {} })</script>
<script>window.playground.ui.game({ you: "X", me: "O", move: () => null })</script>`;

it("allows every data-* attribute the kit reads through dataset from a component's own element", async () => {
  expect(Object.keys(KIT_ATTRIBUTES).filter((kind) => !EVERY_COMPONENT.includes(`data-pg="${kind}"`))).toEqual([]);
  expect(kitProblems(EVERY_COMPONENT)).toEqual([]);
  const reads = new Set<string>();
  const dom = new JSDOM(buildWidgetDocument({ id: "a", html: EVERY_COMPONENT, state: null, theme: fallbackTheme }), {
    runScripts: "dangerously",
    pretendToBeVisual: true,
    beforeParse(window) {
      const note = (el: Element, attr: string) => {
        const kind = el.getAttribute("data-pg");
        if (kind !== null) reads.add(`${kind} ${attr}`);
      };
      for (const proto of [window.HTMLElement.prototype, window.SVGElement.prototype]) {
        const real = Object.getOwnPropertyDescriptor(proto, "dataset")?.get;
        if (!real) continue;
        Object.defineProperty(proto, "dataset", {
          configurable: true,
          get(this: Element) {
            const map = real.call(this) as Record<string, string | undefined>;
            return new Proxy(map, {
              get: (target, key) => {
                if (typeof key === "string") note(this, key.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase()));
                return target[key as string];
              },
              set: (target, key, value) => ((target[key as string] = value), true),
              deleteProperty: (target, key) => delete target[key as string],
            });
          },
        });
      }
      window.Element.prototype.setPointerCapture = () => {};
      window.HTMLCanvasElement.prototype.getContext = (() => new Proxy({}, { get: () => () => {} })) as never;
      Object.assign(window, {
        matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
        ResizeObserver: class { observe() {} disconnect() {} },
        IntersectionObserver: class { observe() {} disconnect() {} },
      });
    },
  });
  const { window } = dom;
  if (window.document.readyState !== "complete") await new Promise((resolve) => window.addEventListener("load", resolve));
  window.dispatchEvent(new window.KeyboardEvent("keydown", { key: "z" }));
  const seen = [...reads];
  for (const read of ["scrub prefix", "run duration", "run autoplay", "chart height", "keyboard octaves", "field placeholder", "board pieces", "agent empty"])
    expect(seen).toContain(read);
  // hydrate reads data-pg and data-param from every element to decide what it is.
  const unexpected = seen.filter((read) => {
    const [kind, attr] = read.split(" ");
    return attr !== "pg" && attr !== "param" && !allowed(kind!, attr!);
  });
  expect(unexpected).toEqual([]);
  window.close();
});
