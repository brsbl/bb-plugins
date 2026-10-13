import { describe, expect, it } from "vitest";

import {
  clip,
  gulpTier,
  LINES,
  modeLine,
  pickupLine,
  receipt,
  speechSeconds,
  swallow,
  turnTier,
} from "./commentary";
import type { TurnCost } from "./contract";

const CAPACITY = 200_000;

function turn(overrides: Partial<TurnCost>): TurnCost {
  return { turnId: "turn_1", prompt: "Read every file", status: "completed", contextTokens: 0, ...overrides };
}

describe("gulpTier", () => {
  it("sorts a swallow by its share of the context window", () => {
    expect(gulpTier(0)).toBe("nibble");
    expect(gulpTier(0.0049)).toBe("nibble");
    expect(gulpTier(0.005)).toBe("bite");
    expect(gulpTier(0.02)).toBe("gulp");
    expect(gulpTier(0.05)).toBe("heavy");
    expect(gulpTier(1)).toBe("heavy");
  });
});

describe("clip", () => {
  it("leaves short text alone and trims long text to an ellipsis", () => {
    expect(clip("Short", 10)).toBe("Short");
    expect(clip("Exactly 10", 10)).toBe("Exactly 10");
    expect(clip("Refactor the katamari window", 10)).toBe("Refactor…");
  });
});

describe("receipt", () => {
  it("reads out what a turn swallowed, louder for a heavy one", () => {
    expect(receipt(turn({ contextTokens: 12_000 }), CAPACITY)).toBe('A HEAVY one! "Read every file" swallowed 12k.');
    expect(receipt(turn({ contextTokens: 2_000 }), CAPACITY)).toBe('"Read every file" swallowed 2k.');
    expect(receipt(turn({ contextTokens: 500 }), CAPACITY)).toBe('A light snack: "Read every file" took just 500.');
  });

  it("explains the setup turn and a compaction", () => {
    expect(receipt(turn({ contextTokens: 18_000, baseline: true }), CAPACITY)).toBe(
      "A thread starts heavy: bb's system prompt and tools came first. \"Read every file\" began at 18k.",
    );
    expect(receipt(turn({ contextTokens: -40_000 }), CAPACITY)).toBe(
      '"Read every file" ended lighter, thanks to a compaction.',
    );
  });

  it("clips long prompts and names a turn without one", () => {
    const long = "Please refactor the whole katamari window into smaller modules";
    expect(receipt(turn({ prompt: long, contextTokens: 2_000 }), CAPACITY)).toBe(
      `"${clip(long, 34)}" swallowed 2k.`,
    );
    expect(receipt(turn({ prompt: null, contextTokens: 2_000 }), CAPACITY)).toBe("That turn swallowed 2k.");
  });
});

describe("turnTier", () => {
  it("marks compactions and the setup turn before sizing the swallow", () => {
    expect(turnTier(turn({ contextTokens: -1 }), CAPACITY)).toBe("compacted");
    expect(turnTier(turn({ contextTokens: 50_000, baseline: true }), CAPACITY)).toBe("setup");
    expect(turnTier(turn({ contextTokens: 12_000 }), CAPACITY)).toBe("heavy");
    expect(turnTier(turn({ contextTokens: 12_000 }), null)).toBe("nibble");
  });
});

describe("swallow", () => {
  const reading = { threadId: "thr_a", usedTokens: 10_000, ready: true };

  it("labels new context by how much of the window it took", () => {
    expect(swallow(reading, { ...reading, usedTokens: 30_000, capacityTokens: 100_000, compactions: 0 })).toEqual({
      share: 0.2,
      tier: "heavy",
      label: "GULP! +20k",
    });
    expect(
      swallow(reading, { ...reading, usedTokens: 10_400, capacityTokens: 100_000, compactions: 0 }),
    ).toMatchObject({ tier: "nibble", label: "+400" });
  });

  it("counts a watched thread's first usage as setup", () => {
    expect(
      swallow(
        { ...reading, usedTokens: null },
        { ...reading, usedTokens: 18_000, capacityTokens: CAPACITY, compactions: 0 },
      ),
    ).toEqual({ share: 0.09, tier: "setup", label: "+18k setup" });
  });

  it("stays quiet for another thread, a shrink, history, or a post-compaction summary", () => {
    const next = { ...reading, capacityTokens: CAPACITY, compactions: 0 };
    expect(swallow({ ...reading, threadId: "thr_b" }, { ...next, usedTokens: 20_000 })).toBeNull();
    expect(swallow(reading, { ...next, usedTokens: 5_000 })).toBeNull();
    expect(swallow({ ...reading, usedTokens: null, ready: false }, { ...next, usedTokens: 20_000 })).toBeNull();
    expect(swallow({ ...reading, usedTokens: null }, { ...next, usedTokens: 20_000, compactions: 1 })).toBeNull();
  });
});

describe("the King's lines", () => {
  it("stays up long enough to type out and read", () => {
    expect(speechSeconds("POP!")).toBe(3.8);
    expect(speechSeconds("x".repeat(100))).toBeCloseTo(5.2);
  });

  it("cheers pickups until the ball is nearly full", () => {
    expect(pickupLine(0.5)).toBe("Splendid! 50% full.");
    expect(pickupLine(0.95)).toBe(LINES.full[0]);
  });

  it("remarks on a change of mode, but not an empty stage", () => {
    expect(LINES.resting).toContain(modeLine("resting"));
    expect(modeLine("empty")).toBeNull();
  });
});
