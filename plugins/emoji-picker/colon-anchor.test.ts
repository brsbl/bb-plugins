// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { captureColonAnchor } from "./colon-anchor";

afterEach(() => { document.body.replaceChildren(); document.getSelection()?.removeAllRanges(); vi.restoreAllMocks(); });

function fixture() {
  const composer = document.createElement("div");
  composer.innerHTML = '<div contenteditable="true">Before : after</div>';
  document.body.append(composer);
  const caret = document.createRange();
  caret.setStart(composer.firstChild!.firstChild!, 8);
  caret.collapse(true);
  document.getSelection()!.addRange(caret);
  return { composer, caret };
}

it("keeps the colon range when focus moves and measures its current layout", () => {
  const { composer, caret } = fixture();
  const character = caret.cloneRange();
  let x = 100;
  Object.defineProperty(character, "getBoundingClientRect", { value: () => ({ x }) });
  vi.spyOn(caret, "cloneRange").mockReturnValue(character);
  const anchor = captureColonAnchor(composer)!;
  document.getSelection()!.removeAllRanges();
  expect(character.toString()).toBe(":");
  expect(anchor.contextElement).toBe(composer.firstChild);
  expect(anchor.getBoundingClientRect().x).toBe(100);
  x = 200;
  expect(anchor.getBoundingClientRect().x).toBe(200);
});

it("falls back when selection is missing, outside this composer, or not after a colon", () => {
  const { composer, caret } = fixture();
  expect(captureColonAnchor(document.createElement("div"))).toBeNull();
  caret.setEnd(caret.endContainer, 9);
  expect(captureColonAnchor(composer)).toBeNull();
  caret.collapse(false);
  expect(captureColonAnchor(composer)).toBeNull();
  document.getSelection()!.removeAllRanges();
  expect(captureColonAnchor(composer)).toBeNull();
  expect(captureColonAnchor(null)).toBeNull();
});
