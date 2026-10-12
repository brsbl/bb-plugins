import { expect, it } from "vitest";
import { buildWidgetDocument, fallbackTheme } from "./widget.js";

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
