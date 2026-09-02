import { describe, expect, it } from "vitest";
import { findColorMatches } from "./colors";

const values = (text: string) => findColorMatches(text).map((m) => m.value);

describe("findColorMatches", () => {
  it("accepts long-form RGB and RGBA hex colors", () => {
    expect(values("#f4f4f4 #f4f4f4ff")).toEqual([
      "#f4f4f4",
      "#f4f4f4ff",
    ]);
  });

  it("rejects short hex forms that overlap with PR and issue references", () => {
    expect(
      values("Fix PR #123 and issue #1234; CSS used #fff and #ffff"),
    ).toEqual([]);
  });

  it("rejects hex runs that are not colors", () => {
    expect(values("#12345 #1234567 #include #1234567890")).toEqual([]);
  });

  it("does not start a literal inside a word", () => {
    expect(values("id#f4f4f4 my-rgb(1 2 3) $#f4f4f4")).toEqual([]);
  });

  it("finds function forms, including one level of nesting", () => {
    expect(values("rgba(255, 106, 31, 0.6) and oklch(0.7 0.1 200)")).toEqual([
      "rgba(255, 106, 31, 0.6)",
      "oklch(0.7 0.1 200)",
    ]);
    expect(values("color-mix(in oklch, var(--a), var(--b))")).toEqual([
      "color-mix(in oklch, var(--a), var(--b))",
    ]);
  });

  it("reports offsets that line up with the source text", () => {
    const text = "  --canvas: #f4f4f4;";
    const [match] = findColorMatches(text);
    expect(text.slice(match.start, match.end)).toBe("#f4f4f4");
  });

  it("finds a literal that is followed by punctuation", () => {
    expect(values("--sidebar: #070509; /* true black */")).toEqual(["#070509"]);
  });
});
