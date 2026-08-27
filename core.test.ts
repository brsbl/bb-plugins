import { describe, expect, it } from "vitest";
import * as core from "./core.js";

function editable() {
  return core.editableWorkflowConfig(
    core.cloneWorkflowConfig(core.DEFAULT_WORKFLOW_CONFIG),
  );
}

function thread(
  overrides: Partial<core.OrganizableThread> = {},
): core.OrganizableThread {
  return {
    archivedAt: null,
    childOrigin: null,
    deletedAt: null,
    lastReadAt: 20,
    latestAttentionAt: 10,
    originKind: null,
    originPluginId: null,
    parentThreadId: null,
    sectionId: null,
    sourceThreadId: null,
    status: "idle",
    visibility: "visible",
    ...overrides,
  };
}

describe("workflow configuration", () => {
  it("ships the approved starter stages without emoji labels", () => {
    expect(
      core.DEFAULT_WORKFLOW_CONFIG.stages.map(({ key, title, icon }) => ({
        key,
        title,
        icon,
      })),
    ).toEqual([
      { key: "inbox", title: "Inbox", icon: "Mail" },
      {
        key: "planning",
        title: "Planning",
        icon: "ListTodo",
      },
      {
        key: "spec-review",
        title: "Spec Review",
        icon: "FileView",
      },
      {
        key: "building",
        title: "Building",
        icon: "Code",
      },
      {
        key: "testing-deploy",
        title: "Testing / Deploy",
        icon: "Beaker",
      },
      {
        key: "handoff",
        title: "Handoff",
        icon: "ArrowRight",
      },
      {
        key: "on-hold",
        title: "On Hold",
        icon: "Pause",
      },
    ]);
    expect(
      core.DEFAULT_WORKFLOW_CONFIG.stages.find(
        (stage) => stage.key === "handoff",
      )?.rule,
    ).toBe(core.HANDOFF_RULE);
  });

  it("allows Inbox presentation changes while preserving its system role", () => {
    const next = editable();
    next.stages[0] = {
      ...next.stages[0]!,
      title: "Needs Me",
      icon: "MailOpen",
    };

    expect(core.normalizeEditableWorkflowConfig(next).stages[0]).toMatchObject({
      key: "inbox",
      title: "Needs Me",
      icon: "MailOpen",
      rule: core.INBOX_RULE,
    });
  });

  it("rejects attempts to change Inbox logic or make titles ambiguous", () => {
    const changedRule = editable();
    changedRule.stages[0] = {
      ...changedRule.stages[0]!,
      rule: "Anything I want",
    };
    expect(() => core.normalizeEditableWorkflowConfig(changedRule)).toThrow(
      "Inbox routing",
    );

    const duplicatedTitle = editable();
    duplicatedTitle.stages[2] = {
      ...duplicatedTitle.stages[2]!,
      title: " planning ",
    };
    expect(() => core.normalizeEditableWorkflowConfig(duplicatedTitle)).toThrow(
      "duplicated",
    );
  });

  it("preserves native section identities across presentation edits", () => {
    const current = core.cloneWorkflowConfig(core.DEFAULT_WORKFLOW_CONFIG);
    current.stages.forEach((stage) => {
      stage.sectionId = `section-${stage.key}`;
    });
    const next = core.editableWorkflowConfig(current);
    next.stages[1] = { ...next.stages[1]!, title: "Shaping" };

    expect(
      core.mergeEditableWorkflowConfig(current, next).stages[1],
    ).toMatchObject({
      key: "planning",
      title: "Shaping",
      sectionId: "section-planning",
    });
  });

  it("creates immutable, collision-free CLI keys for new stages", () => {
    expect(core.createStageKey("Design QA", ["planning"])).toBe("design-qa");
    expect(core.createStageKey("Design QA", ["design-qa"])).toBe("design-qa-2");
  });

  it("migrates the draft Inbox and Parked defaults without losing section ids", () => {
    const legacy = {
      version: 1,
      defaultActiveStageKey: "planning",
      stages: core.DEFAULT_WORKFLOW_CONFIG.stages.map((stage) => ({
        ...stage,
        policy: stage.role === "inbox" ? "system" : "agent",
      })),
    };
    legacy.stages[0] = {
      ...legacy.stages[0]!,
      title: "Needs Me",
      rule: "Idle unread threads requiring the user's attention. This stage is managed automatically.",
      sectionId: "sec_inbox",
    };
    legacy.stages[6] = {
      ...legacy.stages[6]!,
      key: "parked",
      title: "Parked",
      rule: "Intentionally pausing work for later after explicit user direction.",
      sectionId: "sec_parked",
    };

    expect(core.parseWorkflowConfig(legacy)?.stages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "inbox",
          title: "Inbox",
          sectionId: "sec_inbox",
          rule: core.INBOX_RULE,
        }),
        expect.objectContaining({
          key: "on-hold",
          title: "On Hold",
          sectionId: "sec_parked",
        }),
      ]),
    );
  });

  it("migrates the previous sticky Inbox rule to the manual-clear contract", () => {
    const stored = core.cloneWorkflowConfig(core.DEFAULT_WORKFLOW_CONFIG);
    stored.stages[0] = {
      ...stored.stages[0]!,
      rule: "Idle unread threads that need your attention appear here automatically and stay until work resumes. This behavior can’t be customized.",
    };

    expect(core.parseWorkflowConfig(stored)?.stages[0]?.rule).toBe(
      core.INBOX_RULE,
    );
  });

  it.each([
    "Packaging work and context so a colleague can continue it.",
    "Transferring work to a colleague after explicit user direction.",
  ])(
    "migrates the previous Handoff default while preserving custom rules",
    (rule) => {
      const stored = core.cloneWorkflowConfig(core.DEFAULT_WORKFLOW_CONFIG);
      const handoffIndex = stored.stages.findIndex(
        (stage) => stage.key === "handoff",
      );
      stored.stages[handoffIndex] = {
        ...stored.stages[handoffIndex]!,
        rule,
      };

      expect(
        core
          .parseWorkflowConfig(stored)
          ?.stages.find((stage) => stage.key === "handoff")?.rule,
      ).toBe(core.HANDOFF_RULE);

      stored.stages[handoffIndex] = {
        ...stored.stages[handoffIndex]!,
        rule: "My custom transfer rule.",
      };
      expect(
        core
          .parseWorkflowConfig(stored)
          ?.stages.find((stage) => stage.key === "handoff")?.rule,
      ).toBe("My custom transfer rule.");
    },
  );
});

describe("thread placement precedence", () => {
  const config = core.cloneWorkflowConfig(core.DEFAULT_WORKFLOW_CONFIG);
  config.stages.find((stage) => stage.role === "inbox")!.sectionId =
    "sec_inbox";

  it("keeps running work in its remembered stage", () => {
    expect(
      core.placementForThread(
        config,
        thread({ status: "active", lastReadAt: 0, latestAttentionAt: 10 }),
        "building",
      ).key,
    ).toBe("building");
  });

  it("keeps idle unread work and existing Inbox placements in Inbox", () => {
    expect(
      core.placementForThread(
        config,
        thread({ status: "idle", lastReadAt: 0, latestAttentionAt: 10 }),
        "spec-review",
      ).key,
    ).toBe("inbox");
    expect(
      core.placementForThread(
        config,
        thread({ sectionId: "sec_inbox" }),
        "spec-review",
      ).key,
    ).toBe("inbox");
    expect(
      core.placementForThread(config, thread(), "spec-review").key,
    ).toBe("spec-review");
    expect(
      core.placementForThread(
        config,
        thread({ sectionId: "sec_inbox" }),
        "on-hold",
        true,
      ).key,
    ).toBe("on-hold");
  });

  it("falls back to the first non-Inbox stage when a remembered stage vanished", () => {
    expect(
      core.placementForThread(config, thread(), "removed-stage").key,
    ).toBe("planning");
  });
});

describe("agent guidance", () => {
  it("generates the current taxonomy without movement-policy metadata", () => {
    const config = core.cloneWorkflowConfig(core.DEFAULT_WORKFLOW_CONFIG);
    config.stages[0] = { ...config.stages[0]!, title: "Needs Me" };
    config.stages[1] = {
      ...config.stages[1]!,
      title: "Shaping",
      rule: "Clarifying the outcome and constraints.",
    };
    const instructions = core.buildWorkflowSkillSlot(config);

    expect(instructions).toContain("**Needs Me** is the protected Inbox");
    expect(instructions).toContain("stay until work resumes");
    expect(instructions).toContain(
      "the user moves a read thread to another workflow section",
    );
    expect(instructions).toContain(
      "| planning | Shaping | Clarifying the outcome and constraints. |",
    );
    expect(instructions).toContain(
      "| on-hold | On Hold | Work intentionally paused until a later time or external condition. |",
    );
    expect(instructions).toContain(
      `| handoff | Handoff | ${core.HANDOFF_RULE} |`,
    );
    expect(instructions).not.toContain("Agent policy");
    expect(instructions).not.toContain("bb organizer phase inbox");
  });

  it("contains no classifier or prompt-title derivation surface", () => {
    expect(core).not.toHaveProperty("classifyPhase");
    expect(core).not.toHaveProperty("deriveTaskTitle");
    expect(core).not.toHaveProperty("parsePhaseTarget");
  });
});

describe("local section presentation", () => {
  it("uses temporary emoji names without leaking them into workflow titles", () => {
    const config = core.cloneWorkflowConfig(core.DEFAULT_WORKFLOW_CONFIG);

    expect(config.stages.map(core.localSectionName)).toEqual([
      "📥 Inbox",
      "📋 Planning",
      "📄 Spec Review",
      "🛠️ Building",
      "🧪 Testing / Deploy",
      "🤝 Handoff",
      "⏸️ On Hold",
    ]);
    expect(config.stages.map((stage) => stage.title)).toEqual([
      "Inbox",
      "Planning",
      "Spec Review",
      "Building",
      "Testing / Deploy",
      "Handoff",
      "On Hold",
    ]);
  });

  it("gives every configurable icon a local emoji fallback", () => {
    for (const icon of core.SECTION_ICON_OPTIONS) {
      expect(core.localSectionEmoji(icon).length).toBeGreaterThan(0);
    }
  });
});

describe("thread safeguards", () => {
  it("organizes ordinary and automation roots while excluding side chats and hidden workers", () => {
    expect(core.isManageableThread(thread())).toBe(true);
    expect(
      core.isManageableThread(thread({ originPluginId: "automations" })),
    ).toBe(true);
    expect(core.isManageableThread(thread({ childOrigin: "side-chat" }))).toBe(
      false,
    );
    expect(core.isManageableThread(thread({ visibility: "hidden" }))).toBe(
      false,
    );
  });
});
