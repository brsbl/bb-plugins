import { describe, expect, it } from "vitest";

import { BUILT_IN_TEMPLATES, parseTemplate } from "./templates";

const ship = () => structuredClone(BUILT_IN_TEMPLATES.find((template) => template.id === "ship")!);

describe("built-in templates", () => {
  it("ships the four v1 templates with their stages, schedules, and intake prefixes", () => {
    expect(BUILT_IN_TEMPLATES.map(({ id, stages, briefingCron, intakePrefix }) => [id, stages.map((stage) => stage.name), briefingCron, intakePrefix])).toEqual([
      ["ship", ["Asked", "Building", "Your QA", "Review", "Merged"], null, "worker:"],
      ["release", ["Scoped", "Built", "QA", "Released"], "0 9 * * *", null],
      ["bug-triage", ["Reported", "Reproduced", "Fixed", "Verified"], "0 9 * * *", null],
      ["content", ["Idea", "Drafting", "Ready", "Posted"], "0 9 * * 1", null],
    ]);
  });

  it.each(BUILT_IN_TEMPLATES.map((template) => [template.id, template] as const))(
    "%s round-trips through parseTemplate unchanged",
    (_id, template) => {
      expect(parseTemplate(structuredClone(template))).toEqual(template);
    },
  );
});

describe("parseTemplate", () => {
  it("rejects templates whose first stage has a check", () => {
    const template = ship();
    template.stages[0]!.check = "pr_open";
    expect(() => parseTemplate(template)).toThrow(/stages\[0\]\.check/u);
  });

  it("requires at least two stages", () => {
    const template = ship();
    template.stages = template.stages.slice(0, 1);
    expect(() => parseTemplate(template)).toThrow(/at least 2 stages/u);
  });

  it("rejects duplicate stage names", () => {
    const template = ship();
    template.stages[2]!.name = "building";
    expect(() => parseTemplate(template)).toThrow(/more than one stage named/u);
  });

  it("rejects unknown checks, actions, and columns with a readable path", () => {
    expect(() => parseTemplate({ ...ship(), stages: [{ name: "A", check: "none" }, { name: "B", check: "vibes" }] }))
      .toThrow(/stages\[1\]\.check must be one of/u);
    expect(() => parseTemplate({ ...ship(), rules: [{ kind: "gated", action: "deploy", column: "alone" }] }))
      .toThrow(/rules\[0\]\.action/u);
    expect(() => parseTemplate({ ...ship(), rules: [{ kind: "instruction", column: "sometimes", text: "x" }] }))
      .toThrow(/rules\[0\]\.column/u);
  });

  it("rejects conditions that name a stage the template lacks", () => {
    const rules = [{ kind: "gated", action: "merge_pr", column: "never", condition: { kind: "before_stage_passes", stage: "QA" } }];
    expect(() => parseTemplate({ ...ship(), rules })).toThrow(/"QA" is not one of/u);
  });

  it("rejects non-objects and malformed schedules", () => {
    expect(() => parseTemplate("ship")).toThrow(/must be a JSON object/u);
    expect(() => parseTemplate({ ...ship(), briefingCron: "daily" })).toThrow(/briefingCron/u);
  });
});
