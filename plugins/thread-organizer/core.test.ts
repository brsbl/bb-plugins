import { describe, expect, it } from "vitest";

import {
  advanceEvaluationMilestone,
  classifySection,
  deriveTaskTitle,
  isEligibleThread,
  resolveSectionId,
} from "./core.js";

describe("thread eligibility", () => {
  const eligible = {
    archivedAt: null,
    childOrigin: null,
    deletedAt: null,
    originKind: null,
    originPluginId: null,
    parentThreadId: null,
    sourceThreadId: null,
    status: "idle" as const,
    visibility: "visible" as const,
  };

  it("accepts ordinary root threads, including pinned threads by implication", () => {
    expect(isEligibleThread(eligible)).toBe(true);
  });

  it.each([
    { ...eligible, archivedAt: 1 },
    { ...eligible, deletedAt: 1 },
    { ...eligible, parentThreadId: "thr_parent" },
    { ...eligible, sourceThreadId: "thr_source" },
    { ...eligible, originKind: "side-chat" as const },
    { ...eligible, childOrigin: "fork" as const },
    { ...eligible, originPluginId: "automations" },
    { ...eligible, status: "error" as const },
    { ...eligible, visibility: "hidden" as const },
  ])("rejects protected thread shape %#", (thread) => {
    expect(isEligibleThread(thread)).toBe(false);
  });
});

describe("section classification", () => {
  it.each([
    {
      expected: "bb",
      projectName: "bb",
      texts: ["Review the recent plugin API changes and harden them."],
      title: "Plugin API review and hardening",
    },
    {
      expected: "bb",
      projectName: "bb",
      texts: ["can you make a prod build from latest origin/main?"],
      title: "bb integration branch",
    },
    {
      expected: "extensions",
      projectName: "Personal",
      texts: [
        "Create a bb plugin that automatically renames and reorganizes threads.",
      ],
      title: "Auto Rename and Reorganize",
    },
    {
      expected: "extensions",
      projectName: "bb plugins",
      texts: ["Design and implement the Omegacode plugin workflow overview."],
      title: "Omegacode workflow overview design pass",
    },
    {
      expected: "extensions",
      projectName: "Design Doctrine",
      texts: ["Rewrite the doctrine docs."],
      title: "Rewrite doctrine docs",
    },
    {
      expected: "design",
      projectName: "UI Pattern Atlas",
      texts: ["Take over the UI Patterns work."],
      title: "atlas",
    },
    {
      expected: "design",
      projectName: "moss",
      texts: ["Continue the design↔code system work."],
      title: "design↔code",
    },
    {
      expected: "design",
      projectName: "moss",
      texts: ["Spec the right API surface for the Moss agent."],
      title: "Moss Agent API Surface",
    },
    {
      expected: "writing",
      projectName: "moss",
      texts: ["Help me work on positioning for Moss."],
      title: "moss positioning",
    },
    {
      expected: "writing",
      projectName: "Personal",
      texts: ["Write a blog post about creating loops."],
      title: "Creating Loops Blog Post",
    },
    {
      expected: "bb",
      projectName: "bb",
      texts: ["https://github.com/ymichael/bb/issues/603"],
      title: "Issue 603",
    },
  ])("classifies $title as $expected", ({ expected, projectName, texts }) => {
    expect(classifySection({ projectName, texts })?.target).toBe(expected);
  });

  it("abstains from weak personal-workspace intent", () => {
    expect(
      classifySection({
        projectName: "Personal",
        texts: ["clean up disk space and CPU"],
      }),
    ).toBeNull();
  });

  it("surfaces a low margin instead of hiding mixed bb design intent", () => {
    const decision = classifySection({
      projectName: "bb",
      texts: ["Design a durable UI pattern system."],
    });
    expect(decision).toMatchObject({
      runnerUp: "bb",
      target: "design",
    });
    expect(decision?.margin).toBeCloseTo(0.05);
  });
});

describe("existing section resolution", () => {
  it("supports the bb quick fixes migration alias", () => {
    expect(
      resolveSectionId(
        [
          { id: "sec_bb", name: "bb quick fixes" },
          { id: "sec_design", name: "Design" },
        ],
        "bb",
      ),
    ).toBe("sec_bb");
  });

  it("fails closed when both bb aliases exist", () => {
    expect(
      resolveSectionId(
        [
          { id: "sec_bb", name: "bb" },
          { id: "sec_old", name: "bb quick fixes" },
        ],
        "bb",
      ),
    ).toBeNull();
  });

  it("never treats QA as a target alias", () => {
    expect(
      resolveSectionId([{ id: "sec_qa", name: "QA" }], "design"),
    ).toBeNull();
  });
});

describe("conservative title repair", () => {
  it.each([
    ["can you optimize my CI?", "Optimize CI"],
    ["Please fix the external file nav.", "Fix External File Nav"],
    ["take over tools hub refactor PR", "Take Over Tools Hub Refactor"],
    ["clean up disk space and CPU", "Clean Up Disk Space"],
  ])("derives %s", (prompt, expected) => {
    expect(deriveTaskTitle(prompt)?.title).toBe(expected);
  });

  it.each([
    "continue",
    "root cause this",
    "https://github.com/ymichael/bb/issues/603",
    "create a bb plugin",
    "what should we do next?",
  ])("abstains from %s", (prompt) => {
    expect(deriveTaskTitle(prompt)).toBeNull();
  });
});

describe("turn milestones", () => {
  it.each([
    [1, 1, 5],
    [1, 4, 5],
    [1, 5, 15],
    [5, 14, 15],
    [5, 15, 25],
    [15, 37, 45],
  ])(
    "advances current %i after %i completed turns to %i",
    (current, turns, expected) => {
      expect(advanceEvaluationMilestone(current, turns)).toBe(expected);
    },
  );
});
