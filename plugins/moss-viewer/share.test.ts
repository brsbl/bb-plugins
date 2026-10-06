import { expect, it } from "vitest";
import { shareLabel } from "./share.js";
import { frameSelection } from "./viewer-frame.js";

it("labels a shared note by its title and the start of the selection", () => {
  expect(shareLabel("Plan", null)).toBe("Plan");
  expect(shareLabel("Plan", "Ship it")).toBe("Plan: “Ship it”");
  expect(shareLabel("Plan", "The  first\nsentence of a much longer passage")).toBe("Plan: “The first sentence of a much lo…”");
});

it("reads the text selected in a frame, trimmed and capped", () => {
  const frame = (text: string | null) => ({ contentWindow: { getSelection: () => (text === null ? null : { toString: () => text }) } }) as unknown as HTMLIFrameElement;
  expect(frameSelection(frame("  Selected words \n"), 100)).toBe("Selected words");
  expect(frameSelection(frame("abcdef"), 3)).toBe("abc");
  expect(frameSelection(frame("   "), 100)).toBeNull();
  expect(frameSelection(frame(null), 100)).toBeNull();
  expect(frameSelection(null, 100)).toBeNull();
});
