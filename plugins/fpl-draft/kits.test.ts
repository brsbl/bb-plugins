import { describe, expect, it } from "vitest";

import { CLUBS, contrast, fadedKit, kitFor, onColor } from "./kits";

describe("club colours", () => {
  it("keeps every crest label readable at WCAG AA", () => {
    for (const club of CLUBS) {
      const { ground, label } = kitFor(club);
      expect(contrast(label, ground), `${club} ${label} on ${ground}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps faded cards readable too", () => {
    for (const club of CLUBS) {
      const { ground, label } = fadedKit(club);
      expect(contrast(label, ground), `${club} faded`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("picks the label by measured contrast, not by a luminance guess", () => {
    // A pale ground must take ink; a dark one must take white.
    expect(onColor("#9BB6CC")).toBe("#2A2725");
    expect(onColor("#241F20")).toBe("#FFFFFF");
  });

  it("mutes a club colour without losing its hue", () => {
    const arsenal = kitFor("ARS").ground;
    const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(arsenal.slice(i, i + 2), 16));
    expect(r).toBeGreaterThan(g);
    expect(r).toBeGreaterThan(b);
    expect(arsenal).not.toBe("#EF0107");
  });

  it("falls back for an unknown club rather than throwing", () => {
    const unknown = kitFor("ZZZ");
    expect(contrast(unknown.label, unknown.ground)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("filled cards stay legible", () => {
  it("keeps every club's name and points readable on a filled card", () => {
    for (const club of CLUBS) {
      const { ground, label } = kitFor(club);
      expect(contrast(label, ground), `${club} filled`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps a faded substitute card readable, and visibly different", () => {
    for (const club of CLUBS) {
      const full = kitFor(club);
      const faded = fadedKit(club);
      expect(contrast(faded.label, faded.ground), `${club} faded`).toBeGreaterThanOrEqual(4.5);
      expect(faded.ground, `${club} distinguishable`).not.toBe(full.ground);
    }
  });

  it("keeps a white status icon ground visible on every club colour", () => {
    // The icon sits on white with a hairline ring; the ring carries it when
    // the club colour is itself pale.
    for (const club of CLUBS) {
      const { ground } = kitFor(club);
      expect(contrast("#FFFFFF", ground), `${club} icon ground`).toBeGreaterThanOrEqual(1.3);
    }
  });
});
