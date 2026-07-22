// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  chooseNearestGutter,
  layoutGutterMarkers,
  restoreSelector,
} from "./anchors.js";

const selector = (
  overrides: Partial<Parameters<typeof restoreSelector>[1]> = {},
) => ({
  version: 1 as const,
  coordinateSpace: "rendered-text-utf16" as const,
  start: 6,
  end: 15,
  exact: "nested 😀",
  prefix: "alpha ",
  suffix: " omega",
  ...overrides,
});

describe("restoreSelector", () => {
  it("restores UTF-16 offsets across nested rendered nodes", () => {
    const root = document.createElement("div");
    root.append("alpha ");
    const strong = document.createElement("strong");
    strong.append("nested ");
    root.append(strong, "😀 omega");
    const restored = restoreSelector(root, selector());
    expect(restored?.strategy).toBe("offset");
    expect(restored?.range.toString()).toBe("nested 😀");
  });

  it("uses surrounding context only when it resolves one exact copy", () => {
    const root = document.createElement("div");
    root.textContent = "wrong target here; right target done";
    expect(
      restoreSelector(
        root,
        selector({
          start: 0,
          end: 6,
          exact: "target",
          prefix: "right ",
          suffix: " done",
        }),
      )?.range.toString(),
    ).toBe("target");
  });

  it("returns unanchored for ambiguous context instead of guessing", () => {
    const root = document.createElement("div");
    root.textContent = "same target same target";
    expect(
      restoreSelector(
        root,
        selector({
          start: 99,
          end: 105,
          exact: "target",
          prefix: "same ",
          suffix: "",
        }),
      ),
    ).toBeNull();
  });

  it("accepts a unique exact phrase when old context no longer matches", () => {
    const root = document.createElement("div");
    root.textContent = "updated unique phrase ending";
    expect(
      restoreSelector(
        root,
        selector({
          start: 99,
          end: 105,
          exact: "unique",
          prefix: "old ",
          suffix: " context",
        }),
      )?.range.toString(),
    ).toBe("unique");
  });
});

describe("gutter layout", () => {
  const rail = { left: 100, right: 900, width: 800 };

  it("uses the closest fragment edge and breaks ties toward the right", () => {
    expect(chooseNearestGutter([{ left: 130, right: 400 }], rail)).toBe("left");
    expect(chooseNearestGutter([{ left: 400, right: 600 }], rail)).toBe(
      "right",
    );
    expect(chooseNearestGutter([{ left: 110, right: 890 }], rail)).toBe(
      "right",
    );
  });

  it("keeps narrow timelines on the right gutter", () => {
    expect(
      chooseNearestGutter([{ left: 102, right: 200 }], { ...rail, width: 480 }),
    ).toBe("right");
  });

  it("de-overlaps markers and groups visual overflow", () => {
    const markers = Array.from({ length: 5 }, (_, index) => ({
      id: String(index),
      desiredY: 20,
    }));
    const placements = layoutGutterMarkers(markers, 0, 80, 24, 4);
    expect(placements).toHaveLength(3);
    expect(placements.flatMap(({ ids }) => ids)).toHaveLength(5);
    expect(placements[1]!.y - placements[0]!.y).toBeGreaterThanOrEqual(28);
    expect(placements.at(-1)!.y + 24).toBeLessThanOrEqual(80);
  });
});
