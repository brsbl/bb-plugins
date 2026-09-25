import { describe, expect, it } from "vitest";

import { zoneAt, zoneCellSize } from "./zones";

describe("zoneAt", () => {
  it("is deterministic for a position, level, and seed", () => {
    expect(zoneAt(12.5, -40, 2, 99)).toEqual(zoneAt(12.5, -40, 2, 99));
  });

  it("starts small katamari indoors", () => {
    let room = 0;
    for (let index = 0; index < 400; index += 1) {
      const size = zoneCellSize(0);
      if (zoneAt(index * size * 1.7, index * size * 0.9, 0, 5).zone === "room") room += 1;
    }
    expect(room).toBeGreaterThan(200);
  });

  it("never puts a big katamari back in the tatami room", () => {
    for (let index = 0; index < 200; index += 1) {
      const size = zoneCellSize(5);
      expect(zoneAt(index * size * 1.3, index * size * 2.1, 5, 5).zone).not.toBe("room");
    }
  });
});
