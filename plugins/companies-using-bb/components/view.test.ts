import { describe, expect, it } from "vitest";
import { person, row } from "../fixtures.js";
import { itemsOf } from "./view.js";

describe("itemsOf", () => {
  it("lists updated issues and PRs over the imported engagement list", () => {
    const p = person({
      il: [["New bug", "2026-01-05", "open", "https://example.com/issues/2"]],
      pl: [["Add thing", "2026-01-01", "merged", "https://example.com/pull/1"]],
      eng: [
        { k: "pr", t: "Add thing", s: "open", u: "https://example.com/pull/1", d: "2026-01-01", roles: ["opened"] },
        { k: "issue", t: "Someone else's bug", s: "open", u: "https://example.com/issues/9", d: "2026-01-02", roles: ["commented"] },
      ],
    } as Partial<ReturnType<typeof person>>);
    const items = itemsOf(p, row({ ppl: [p] }));
    expect(items.map(i => [i.u, i.st, i.opened])).toEqual([
      ["https://example.com/issues/9", "open", false],
      ["https://example.com/issues/2", "open", true],
      ["https://example.com/pull/1", "merged", true],
    ]);
  });
});
