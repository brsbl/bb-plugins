import { JSDOM } from "jsdom";
import { expect, it } from "vitest";
import { SETS_CSS } from "./sets.js";
import { WIDGET_MESSAGE_SOURCE, buildWidgetDocument, fallbackTheme } from "./widget.js";

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

it("doesn't start audio when someone taps a card without sound", () => {
  const { dom, audioContexts } = frame('<label data-pg="field" data-param="income" data-label="Income"></label>');
  dom.window.document.body.dispatchEvent(new dom.window.Event("pointerdown", { bubbles: true }));
  expect(audioContexts).toHaveLength(0);
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
  window.addEventListener("message", (event) => {
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
