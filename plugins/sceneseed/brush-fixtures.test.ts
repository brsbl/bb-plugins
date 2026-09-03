import { describe, expect, it } from "vitest";

import {
  BRUSH_COMPARISON_CRITERIA,
  createBrushComparisonFixtures,
} from "./brush-fixtures.js";

describe("procedural brush comparison fixtures", () => {
  it("keeps a small stable prompt set with matched presentation settings", () => {
    const fixtures = createBrushComparisonFixtures();

    expect(fixtures.map((fixture) => fixture.id)).toEqual([
      "seated-traveler",
      "rain-jar",
      "pocket-radio",
    ]);
    expect(new Set(fixtures.map((fixture) => fixture.prompt)).size).toBe(3);
    for (const fixture of fixtures) {
      expect(fixture.before.cameraHint).toBe("front");
      expect(fixture.after.cameraHint).toBe("front");
      expect(fixture.before.motion.preset).toBe("none");
      expect(fixture.after.motion.preset).toBe("none");
      expect(fixture.before.ground.contactShadow.strength).toBe(0);
      expect(fixture.after.ground.contactShadow.strength).toBe(0);
      expect(fixture.after.stats.vertices).toBeLessThanOrEqual(600);
      expect(fixture.after.stats.objects).toBeGreaterThanOrEqual(7);
      expect(fixture.after.objectJson).toMatchObject({
        metadata: { type: "Object" },
        object: { type: "Group" },
      });
    }
  });

  it("declares the reference comparison criteria used by visual QA", () => {
    expect(BRUSH_COMPARISON_CRITERIA).toEqual([
      "stroke character",
      "graphite texture",
      "pressure and width variation",
      "searching-line layering",
      "grayscale and tint hierarchy",
      "overall illustration quality",
    ]);
  });
});
