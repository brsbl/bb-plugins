import { describe, expect, it } from "vitest";
import {
  PHASE_SECTION_NAMES,
  classifyPhase,
  deriveTaskTitle,
  isManageableThread,
  parsePhaseTarget,
  resolvePhaseSectionId,
} from "./core.js";

describe("development phase mapping", () => {
  it.each([
    ["Shape the requirements and plan the approach", "planning"],
    ["Plan the Timeline Organizer QA flow and requirements", "planning"],
    ["Review and approve the implementation spec", "spec-review"],
    ["Implement the sidebar changes", "building"],
    ["Prepare a handoff for the integration owner", "handoff"],
    ["Run regression tests and deploy", "testing-deploy"],
    ["Please continue", "inbox"],
  ] as const)("maps %s to %s", (text, target) => {
    expect(classifyPhase([text]).target).toBe(target);
  });

  it("uses exact icon-prefixed section names", () => {
    expect(PHASE_SECTION_NAMES).toEqual({
      planning: "📋 Planning",
      "spec-review": "🔎 Spec Review",
      building: "🛠️ Building",
      handoff: "🤝 Handoff",
      "testing-deploy": "✅ Testing / Deploy",
      inbox: "📥 Inbox",
    });
    expect(
      resolvePhaseSectionId([{ id: "sec", name: "📥 Inbox" }], "inbox"),
    ).toBe("sec");
    expect(
      resolvePhaseSectionId([{ id: "legacy", name: "Inbox" }], "inbox"),
    ).toBeNull();
  });

  it.each([
    ["plan", "planning"],
    ["spec", "spec-review"],
    ["build", "building"],
    ["handoff", "handoff"],
    ["deploy", "testing-deploy"],
    ["unclear", "inbox"],
  ] as const)("accepts the phase alias %s", (input, target) => {
    expect(parsePhaseTarget(input)).toBe(target);
  });
});

describe("existing organizer safeguards", () => {
  const ordinary = {
    archivedAt: null,
    deletedAt: null,
    originKind: null,
    originPluginId: null,
    parentThreadId: null,
    sourceThreadId: null,
    status: "idle" as const,
    visibility: "visible" as const,
  };
  it("keeps ordinary roots and excludes legacy side chats", () => {
    expect(isManageableThread(ordinary)).toBe(true);
    expect(
      isManageableThread({
        ...ordinary,
        childOrigin: "side-chat",
      } as typeof ordinary),
    ).toBe(false);
  });
  it("keeps prompt-derived title repair", () => {
    expect(
      deriveTaskTitle("Please update the timeline organizer plugin")?.title,
    ).toBe("Update Timeline Organizer Plugin");
  });
});
