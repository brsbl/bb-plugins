import { describe, expect, it } from "vitest";
import { categoryEmojis, emojis, nativeEmoji, parsePreferences, searchEmojis } from "./emojis";

describe("emoji lookup", () => {
  it("finds names, keywords, aliases, shortcodes, and native variants", () => {
    for (const query of ["thumbs up", "thumbsup", ":+1:", "👍🏽"]) {
      expect(searchEmojis(query).map((emoji) => emoji.id)).toContain("+1");
    }
    expect(searchEmojis(":rocket:")[0].id).toBe("rocket");
    expect(searchEmojis("astronaut").length).toBeGreaterThan(0);
    expect(searchEmojis("no-such-emoji-xyz")).toEqual([]);
    expect(searchEmojis("   ")).toEqual([]);
  });

  it("keeps category data valid and emits complete Unicode sequences", () => {
    expect(categoryEmojis("flags").some((emoji) => emoji.id === "us")).toBe(true);
    expect(nativeEmoji(emojis["+1"], 3)).toBe("👍🏽");
    expect(nativeEmoji(emojis.rocket, 3)).toBe("🚀");
    expect(nativeEmoji(emojis["woman-technologist"], 0)).toBe("👩‍💻");
  });
});

describe("stored preferences", () => {
  it("recovers from malformed data, invalid tones, stale IDs, and duplicate recents", () => {
    expect(parsePreferences("{broken")).toEqual({ tone: 0, recent: [] });
    expect(parsePreferences('null')).toEqual({ tone: 0, recent: [] });
    expect(parsePreferences(JSON.stringify({ tone: 99, recent: ["rocket", "missing", "rocket", 4, "__proto__"] }))).toEqual({ tone: 0, recent: ["rocket"] });
    expect(parsePreferences(JSON.stringify({ tone: 3, recent: Object.keys(emojis) })).recent).toHaveLength(24);
  });
});
