import { describe, expect, it } from "vitest";
import { withoutNulls } from "./google.js";

describe("withoutNulls", () => {
  it("drops nulls at any depth so inserts never send them", () => {
    expect(withoutNulls({ colorId: null, start: { date: "2026-10-09", dateTime: null }, extendedProperties: { private: { ccId: "cc_a1b2c3", gate1: null } }, recurrence: [] }))
      .toEqual({ start: { date: "2026-10-09" }, extendedProperties: { private: { ccId: "cc_a1b2c3" } }, recurrence: [] });
  });
});
