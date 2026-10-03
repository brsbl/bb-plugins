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
  it("uses live plugin settings as the sole workflow taxonomy", () => {
    expect(skill).toContain(
      "It intentionally contains no section taxonomy.",
    );
    expect(skill).toContain(
      "Treat that live block as the sole source of stage keys, titles, and rules.",
    );
    expect(skill).toContain(
      "If it is absent, do not guess a stage or run the organizer command.",
    );
    expect(skill).not.toContain("| planning");
    expect(skill).not.toContain("Handoff");
  });

  it("resolves an indirect kickoff before choosing from the live rules", () => {
    expect(skill).toContain(
      "Immediately after resolving an indirect kickoff such as “read this brief/spec/issue/thread.” Read the referenced artifact first, then classify the resolved next concrete action—not isolated words in the kickoff or the artifact.",
    );
    expect(skill).toContain(
      "A checkpoint is an opportunity to reassess, not a reason to move.",
    );
  });

  it("requires explicit user intent whenever the configured rule does", () => {
    expect(skill).toContain(
      "A stage rule that requires an explicit user decision is ineligible without a current, explicit statement from the user.",
    );
    expect(skill).toContain(
      "Run it autonomously when the live rule clearly applies, except when that rule itself requires explicit user intent.",
    );
  });

  it("distinguishes remembered storage and internal plans from semantic stage moves", () => {
    expect(skill).toContain("Thread Organizer does not classify prompts.");
    expect(skill).toContain(
      "That remembered value is storage state, not a semantic decision",
    );
    expect(skill).toContain(
      "update_plan and other internal task plans do not move the bb workflow stage.",
    );
    expect(skill).toContain(
      "Only bb organizer phase performs an agent-driven stage update.",
    );
  });
});
