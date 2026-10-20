import { expect, it } from "vitest";
import { MAX_SHARED_SELECTION, shareLabel, sharedSelection } from "./share.js";
import type { MossSelection } from "./vendor/moss-editor.contract.js";

const selection = (markdown: string, text = markdown): MossSelection => ({
  text,
  markdown,
  lines: { start: 4, end: 6 },
  headings: ["Plan"],
  blocks: [{ type: "paragraph", line: 4, heading: "Plan" }],
});

it("labels a shared note by its title and the start of the selection", () => {
  expect(shareLabel("Plan", null)).toBe("Plan");
  expect(shareLabel("Plan", "Ship it")).toBe("Plan: “Ship it”");
  expect(shareLabel("Plan", "The  first\nsentence of a much longer passage")).toBe("Plan: “The first sentence of a much lo…”");
});

it("keeps a selection's markdown, lines and headings", () => {
  expect(sharedSelection(null)).toBeNull();
  expect(sharedSelection(selection("- **Ship** it\n", "Ship it"))).toEqual({ markdown: "- **Ship** it", lines: { start: 4, end: 6 }, headings: ["Plan"], truncated: false });
  // A selection with no markdown of its own, such as one inside an embed, falls back to its text.
  expect(sharedSelection(selection("", " Caption "))?.markdown).toBe("Caption");
  expect(sharedSelection(selection(" ", " "))).toBeNull();
});

it("caps a long selection and says so", () => {
  const shared = sharedSelection(selection("x".repeat(MAX_SHARED_SELECTION + 5)));
  expect(shared?.markdown).toHaveLength(MAX_SHARED_SELECTION);
  expect(shared?.truncated).toBe(true);
});
