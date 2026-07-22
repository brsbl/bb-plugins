import { describe, expect, it } from "vitest";
import { createIndividualHandoffPrompt } from "./handoff.js";

describe("individual comment handoff", () => {
  it("keeps the comment primary and quotes its timeline source", () => {
    expect(
      createIndividualHandoffPrompt("Make this explicit.", "selected source"),
    ).toBe(
      "Make this explicit.\n\nContext from the timeline:\n> selected source",
    );
  });

  it("quotes multiline sources and bounds long selections", () => {
    expect(createIndividualHandoffPrompt("Review", "one\ntwo")).toContain(
      "> one\n> two",
    );
    expect(
      Array.from(createIndividualHandoffPrompt("Review", "x".repeat(2_000)))
        .length,
    ).toBeLessThan(900);
  });
});
