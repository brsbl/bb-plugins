import { readFile } from "node:fs/promises";

import { beforeAll, describe, expect, it } from "vitest";

const skillUrl = new URL(
  "./skills/thread-phase-organizer/SKILL.md",
  import.meta.url,
);

let skill = "";

beforeAll(async () => {
  skill = (await readFile(skillUrl, "utf8"))
    .replace(/`/gu, "")
    .replace(/\s+/gu, " ");
});

describe("thread phase organizer guidance", () => {
  it("resolves an indirect read-this-brief kickoff before moving to implementation", () => {
    expect(skill).toContain(
      "Immediately after resolving an indirect kickoff such as “read this brief/spec/issue/thread.” Read the referenced artifact first, then classify the resolved next concrete action—not isolated words in the kickoff or the artifact.",
    );
    expect(skill).toContain(
      "Before implementation begins. Move to the matching building-like stage before changing code or product artifacts.",
    );
  });

  it("moves from Building to Testing / Deploy and back when validation fails", () => {
    expect(skill).toContain(
      "When implementation transitions to testing, packaging a deliverable, releasing, or deploying. Move to the matching testing/deploy-like stage.",
    );
    expect(skill).toContain(
      "When failed validation makes implementation the next concrete action again. Move from the testing/deploy-like stage back to the building-like stage before fixing the failure.",
    );
  });

  it("distinguishes remembered storage and internal plans from semantic stage moves", () => {
    expect(skill).toContain("Thread Organizer does not classify prompts.");
    expect(skill).toContain(
      "This default or remembered value is storage state, not a semantic decision",
    );
    expect(skill).toContain(
      "update_plan and other internal task plans do not move the bb workflow stage.",
    );
    expect(skill).toContain(
      "Only bb organizer phase performs an agent-driven stage transition.",
    );
  });
});
