import { describe, expect, it } from "vitest";

import { placeThemeMenu } from "./theme-menu";

describe("placeThemeMenu", () => {
  it("opens upward when the control is low in a clipped plugin pane", () => {
    expect(placeThemeMenu({
      controlTop: 486,
      controlBottom: 510,
      boundaryTop: 48,
      boundaryBottom: 900,
    })).toEqual({ side: "up", maxHeight: 430 });
  });

  it("opens downward when the full menu fits below the control", () => {
    expect(placeThemeMenu({
      controlTop: 165,
      controlBottom: 189,
      boundaryTop: 48,
      boundaryBottom: 900,
    })).toEqual({ side: "down", maxHeight: 520 });
  });

  it("caps the menu to the larger available side", () => {
    expect(placeThemeMenu({
      controlTop: 300,
      controlBottom: 324,
      boundaryTop: 100,
      boundaryBottom: 600,
    })).toEqual({ side: "down", maxHeight: 268 });
  });
});
