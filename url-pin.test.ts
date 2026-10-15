import { expect, it } from "vitest";
import { pinSchema, pinsSchema } from "./contract.js";
import { isLocalUrl, looksLikeUrl, parseWebUrl, urlLabel, urlPinName } from "./url-pin.js";

it("tells URLs from file paths, including paths with colons", () => {
  expect(["https://example.com", " HTTP://a.b/c", "ftp://files.example.com/x", "javascript://x"].map(looksLikeUrl)).toEqual([true, true, true, true]);
  expect(["/Users/me/a:b.md", "~/notes.md", "C:\\notes.md", "docs/plan.md", "mailto:me@example.com"].map(looksLikeUrl)).toEqual([false, false, false, false, false]);
});

it("accepts only http(s) URLs without credentials and normalizes them", () => {
  expect(parseWebUrl(" https://Example.com ")).toBe("https://example.com/");
  expect(parseWebUrl("http://localhost:3000/a?b=1#c")).toBe("http://localhost:3000/a?b=1#c");
  expect(parseWebUrl("http://127.0.0.1:61000/?story=button")).toBe("http://127.0.0.1:61000/?story=button");
  for (const value of ["ftp://example.com", "javascript:alert(1)", "file:///etc/hosts", "https://user:secret@example.com", "https://exa mple.com", "https://", "notes.md", `https://example.com/${"a".repeat(5000)}`]) {
    expect(parseWebUrl(value)).toBeNull();
  }
});

it("labels a link with its site and a short path, or the supplied title", () => {
  expect(urlLabel("https://www.example.com/")).toBe("example.com");
  expect(urlLabel("http://localhost:3000/docs?x=1")).toBe("localhost:3000/docs");
  expect(urlLabel("https://github.com/brsbl/bb-plugins/pull/343")).toBe("github.com/brsbl/…/343");
  expect(urlLabel("https://en.wikipedia.org/wiki/Caf%C3%A9")).toBe("en.wikipedia.org/wiki/Café");
  expect(urlPinName("https://example.com/", "  Example\n Domain ")).toBe("Example Domain");
  expect(urlPinName("https://example.com/", "   ")).toBe("example.com");
  expect(urlPinName("https://example.com/", "x".repeat(300))).toHaveLength(200);
});

it("stores URL pins beside file pins and keeps existing file pins valid", () => {
  const file = { id: "f", hostId: "mac", path: "/a.md", name: "a.md", createdAt: "2026-01-01T00:00:00.000Z" };
  const link = { id: "u", kind: "url", url: "https://example.com/", name: "example.com", createdAt: "2026-01-01T00:00:00.000Z" };
  expect(pinsSchema.parse([file, link])).toEqual([file, link]);
  expect(pinSchema.safeParse({ ...link, url: "https://Example.com" }).success).toBe(false);
  expect(pinSchema.safeParse({ ...link, url: "ftp://example.com/" }).success).toBe(false);
  expect(pinSchema.safeParse({ ...link, hostId: "mac" }).success).toBe(false);
  expect(pinSchema.safeParse({ ...file, kind: "url" }).success).toBe(false);
});

it("tells dev servers from websites", () => {
  const local = ["http://localhost:3000", "http://app.localhost", "http://127.1:8080", "http://0:3000", "http://[::1]:5173", "http://[0:0:0:0:0:0:0:1]/",
    "http://192.168.1.5:5173", "http://10.0.0.2", "http://172.20.1.1:8000", "http://100.101.102.103:3000", "http://[fd7a:115c::1]:3000",
    "http://devbox:3000", "http://mac.local:3000", "http://api.internal:8080", "http://myapp.test"];
  const web = ["https://example.com", "https://localhost.example.com", "https://notlocalhost.com", "http://127.0.0.1.nip.io", "http://8.8.8.8",
    "http://172.32.0.1", "http://100.128.0.1", "https://[2606:4700::1111]", "https://github.com/get-bb/bb/pull/1"];
  expect(local.filter((url) => !isLocalUrl(url))).toEqual([]);
  expect(web.filter(isLocalUrl)).toEqual([]);
});
