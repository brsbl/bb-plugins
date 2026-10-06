import { expect, it } from "vitest";
import { pinTooltip, truncateMiddle } from "./pin-tooltip.js";

const file = { id: "f", hostId: "mac", hostName: "Studio", path: "/Users/me/docs/plan.md", name: "plan.md", createdAt: "2026-01-01T00:00:00.000Z", status: "available" as const };
const url = { id: "u", kind: "url" as const, url: "https://example.com/launch", name: "example.com/launch", createdAt: "2026-01-01T00:00:00.000Z" };

it("shows a file's full path, naming its machine only when it isn't the thread's", () => {
  expect(pinTooltip(file, "mac")).toEqual({ value: "/Users/me/docs/plan.md" });
  expect(pinTooltip(file, "linux")).toEqual({ value: "/Users/me/docs/plan.md", note: "Studio" });
  expect(pinTooltip({ ...file, status: "missing" }, "mac")).toEqual({ value: "/Users/me/docs/plan.md", note: "(missing)" });
  expect(pinTooltip({ ...file, status: "missing" }, "linux").note).toBe("Studio (missing)");
});

it("shows a URL, under its title when one was set", () => {
  expect(pinTooltip(url, "mac")).toEqual({ value: "https://example.com/launch" });
  expect(pinTooltip({ ...url, name: "Launch checklist" }, "mac")).toEqual({ heading: "Launch checklist", value: "https://example.com/launch" });
});

it("keeps both ends of very long values", () => {
  expect(truncateMiddle("abcdef", 6)).toBe("abcdef");
  expect(truncateMiddle("abcdefghij", 7)).toBe("abc…hij");
  const path = `/start/${"x".repeat(500)}/end.md`;
  const shown = truncateMiddle(path);
  expect(shown).toHaveLength(240);
  expect(shown.startsWith("/start/")).toBe(true);
  expect(shown.endsWith("/end.md")).toBe(true);
});
