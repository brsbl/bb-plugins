import { describe, expect, it } from "vitest";

import { orderSections, parseSidebarSectionOrder } from "./core";

const sections = [
  { id: "a", name: "A" },
  { id: "b", name: "B" },
  { id: "c", name: "C" },
];
const ids = (list: { id: string }[]) => list.map((section) => section.id);

describe("orderSections", () => {
  it("keeps bb's list order without a stored sidebar order", () => {
    expect(ids(orderSections(sections, null))).toEqual(["a", "b", "c"]);
    expect(ids(orderSections(sections, ["pinned", "sections", "threads"]))).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("follows explicit section rows and expands the sections anchor in place", () => {
    expect(
      ids(orderSections(sections, ["pinned", "section:c", "sections", "threads"])),
    ).toEqual(["c", "a", "b"]);
    expect(
      ids(orderSections(sections, ["pinned", "sections", "section:a", "threads"])),
    ).toEqual(["a", "b", "c"]);
  });

  it("appends sections the stored order has never seen and ignores stale ids", () => {
    expect(
      ids(orderSections(sections, ["pinned", "section:b", "section:zz", "threads"])),
    ).toEqual(["b", "a", "c"]);
  });
});

describe("parseSidebarSectionOrder", () => {
  it("accepts only a JSON array of strings", () => {
    expect(parseSidebarSectionOrder(null)).toBeNull();
    expect(parseSidebarSectionOrder("nope")).toBeNull();
    expect(parseSidebarSectionOrder(JSON.stringify([1]))).toBeNull();
    expect(parseSidebarSectionOrder(JSON.stringify(["pinned", "section:a"]))).toEqual([
      "pinned",
      "section:a",
    ]);
  });
});
