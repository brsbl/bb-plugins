import { expect, it } from "vitest";
import { assetHref, safeExternalUrl } from "./viewer-frame.js";

it("opens only web and mail links from a note", () => {
  expect(safeExternalUrl("https://x.com/brsabel/status/1")).toBe("https://x.com/brsabel/status/1");
  expect(safeExternalUrl("mailto:me@example.com")).toBe("mailto:me@example.com");
  expect(safeExternalUrl("/docs", "https://example.com/a/")).toBe("https://example.com/docs");
  for (const url of ["javascript:alert(1)", " JavaScript:alert(1)", "data:text/html,<b>x</b>", "file:///etc/passwd", "not a url"]) {
    expect(safeExternalUrl(url)).toBeNull();
  }
});

it("routes note-local media through the note's host and leaves web media alone", () => {
  const href = assetHref("/api/v1/plugins/moss-viewer/http/asset", "mac", "/Users/me/Moss/Notes/A/A.md", "assets/My Pic.png");
  const url = new URL(href!, "http://bb.test");
  expect(url.pathname).toBe("/api/v1/plugins/moss-viewer/http/asset");
  expect(Object.fromEntries(url.searchParams)).toEqual({ host: "mac", note: "/Users/me/Moss/Notes/A/A.md", ref: "assets/My Pic.png" });
  expect(assetHref("/asset", "mac", "/n.md", "https://pbs.twimg.com/a.jpg")).toBe("https://pbs.twimg.com/a.jpg");
  expect(assetHref("/asset", "mac", "/n.md", "moss-asset://a.png")).toBeNull();
  expect(assetHref("/asset", "mac", "/n.md", "javascript:alert(1)")).toBeNull();
});
