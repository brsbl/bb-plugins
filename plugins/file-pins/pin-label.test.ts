import { expect, it } from "vitest";
import type { Reference } from "./contract.js";
import { addressLabel, cutMiddle, fileLabel, PIN_LABEL_LIMITS, pinLabel, titleLabel } from "./pin-label.js";
import { urlPinName } from "./url-pin.js";

const length = (value: string) => [...value].length;
const file = (name: string): Reference => ({ id: name, hostId: "h", hostName: "Mac", path: `/repo/${name}`, name, createdAt: "", status: "available" });
const link = (url: string, title?: string): Reference => ({ id: url, kind: "url", url, name: urlPinName(url, title), createdAt: "" });

it("leaves labels within their limit alone", () => {
  expect(pinLabel(file("README.md"))).toBe("README.md");
  expect(pinLabel(link("https://github.com/brsbl/bb-plugins/pull/442", "PR #442: Scroll pins"))).toBe("PR #442: Scroll pins");
  expect(pinLabel(link("https://www.npmjs.com/package/zod"))).toBe("npmjs.com/package/zod");
});

it("cuts a file name from its middle and keeps its extension", () => {
  const label = fileLabel("a-really-long-component-file-name-for-truncation.test.tsx");
  expect(label).toBe("a-really-lon…cation.test.tsx");
  expect(length(label)).toBe(PIN_LABEL_LIMITS.file);
  // No extension, or one too long to be a type, cuts the whole name.
  expect(fileLabel("Makefile-with-a-very-long-name-that-keeps-going")).toBe(cutMiddle("Makefile-with-a-very-long-name-that-keeps-going", PIN_LABEL_LIMITS.file));
  expect(fileLabel("notes.a-very-long-suffix-that-is-not-a-type")).toBe(cutMiddle("notes.a-very-long-suffix-that-is-not-a-type", PIN_LABEL_LIMITS.file));
});

it("cuts a title at its end, on a word break when one is close", () => {
  expect(titleLabel("Basic concepts of scroll snap - CSS: Cascading Style Sheets | MDN")).toBe("Basic concepts of scroll snap - CSS…");
  // A cut mid-word backs up to the last whole word.
  expect(titleLabel("Pinned links scroll sideways on wide screens")).toBe("Pinned links scroll sideways on…");
  // A single long word has no break to back up to.
  const word = "x".repeat(60);
  expect(titleLabel(word)).toBe(`${"x".repeat(PIN_LABEL_LIMITS.title - 1)}…`);
  expect(length(titleLabel("Basic concepts of scroll snap - CSS: Cascading Style Sheets | MDN"))).toBeLessThanOrEqual(PIN_LABEL_LIMITS.title);
});

it("drops an address's path before its host", () => {
  // 1. Middle segments go first, keeping the page's own name.
  expect(addressLabel("https://react.dev/reference/react/useSyncExternalStore")).toBe("react.dev/…/useSyncExternalStore");
  // 2. Then the last segment shortens from its end.
  const wiki = addressLabel("https://en.wikipedia.org/wiki/Text_truncation_and_ellipsis_in_user_interface_design_guidelines");
  expect(wiki.startsWith("en.wikipedia.org/…/")).toBe(true);
  expect(wiki).toBe("en.wikipedia.org/…/Text_truncat…");
  expect(length(wiki)).toBe(PIN_LABEL_LIMITS.url);
  // 3. Only the host, keeping its end, when even that is too long.
  const host = addressLabel("https://a-very-long-subdomain-name.preview.deployments.example.com/x");
  expect(host).toBe(`…${"a-very-long-subdomain-name.preview.deployments.example.com".slice(-(PIN_LABEL_LIMITS.url - 1))}`);
});

it("picks the rule by kind of pin, never longer than its limit", () => {
  const pins = [
    file("a-really-long-component-file-name-for-truncation.test.tsx"),
    link("https://en.wikipedia.org/wiki/Text_truncation_and_ellipsis_in_user_interface_design_guidelines"),
    link("https://developer.mozilla.org/en-US/docs/Web/CSS", "Basic concepts of scroll snap - CSS: Cascading Style Sheets | MDN"),
  ];
  const limits = [PIN_LABEL_LIMITS.file, PIN_LABEL_LIMITS.url, PIN_LABEL_LIMITS.title];
  pins.forEach((pin, index) => expect(length(pinLabel(pin))).toBeLessThanOrEqual(limits[index]!));
  // A custom title that happens to look like an address is still a title.
  expect(pinLabel(link("https://example.com/a", "example.com/a/really/long/title/that/the/agent/chose/itself"))).toMatch(/…$/);
});

it("never splits a surrogate pair", () => {
  expect(cutMiddle("😀".repeat(40), 9)).toBe(`${"😀".repeat(4)}…${"😀".repeat(4)}`);
});
