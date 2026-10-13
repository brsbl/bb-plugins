import { describe, expect, it } from "vitest";
import { insertedColon } from "./trigger";

describe("colon trigger", () => {
  it("finds new colons at the start, middle, end, or over a selection", () => {
    expect(insertedColon("", ":")).toBe(0);
    expect(insertedColon("Hi", "Hi:")).toBe(2);
    expect(insertedColon("before after", "before :after")).toBe(7);
    expect(insertedColon("before selected after", "before : after")).toBe(7);
    expect(insertedColon("😀 text", "😀 :text")).toBe(3);
  });
  it("ignores old colons, deletions, and multi-character pastes", () => {
    expect(insertedColon("saved:", "saved:")).toBeNull();
    expect(insertedColon("saved: text", "saved:")).toBeNull();
    expect(insertedColon("", "https://example.com")).toBeNull();
  });
});
