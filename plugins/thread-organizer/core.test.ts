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
  it("ships the approved starter stages", () => {
    expect(
      core.DEFAULT_WORKFLOW_CONFIG.stages.map(({ key, title }) => ({
        key,
        title,
      })),
    ).toEqual([
      { key: "inbox", title: "Inbox" },
      { key: "planning", title: "Planning" },
      { key: "spec-review", title: "Spec Review" },
      { key: "building", title: "Building" },
      { key: "testing-deploy", title: "Testing / Deploy" },
      { key: "handoff", title: "Handoff" },
      { key: "on-hold", title: "On Hold" },
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
    };

    expect(core.normalizeEditableWorkflowConfig(next).stages[0]).toMatchObject({
      key: "inbox",
      title: "Needs Me",
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
  it("uses the stage title verbatim as the bb section name", () => {
    const config = core.cloneWorkflowConfig(core.DEFAULT_WORKFLOW_CONFIG);

    expect(config.stages.map(core.localSectionName)).toEqual([
      "Inbox",
      "Planning",
      "Spec Review",
      "Building",
      "Testing / Deploy",
      "Handoff",
      "On Hold",
    ]);
    expect(config.stages.map(core.localSectionName)).toEqual(
      config.stages.map((stage) => stage.title),
    );
  });

});

describe("legacy configuration", () => {
  it("parses a stored config that still carries section icons", () => {
    const legacy = {
      version: core.WORKFLOW_CONFIG_VERSION,
      stages: core.DEFAULT_WORKFLOW_CONFIG.stages.map((stage) => ({
        ...stage,
        icon: "ListTodo",
      })),
    };

    const parsed = core.parseWorkflowConfig(legacy);

    expect(parsed).not.toBeNull();
    expect(parsed!.stages.map((stage) => stage.title)).toEqual(
      core.DEFAULT_WORKFLOW_CONFIG.stages.map((stage) => stage.title),
    );
    expect(parsed!.stages.every((stage) => !("icon" in stage))).toBe(true);
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

describe("entry prompts", () => {
  it("leaves stages without prompts untouched and normalizes configured ones", () => {
    const plain = core.parseWorkflowConfig(core.DEFAULT_WORKFLOW_CONFIG)!;
    expect(plain.stages.every((stage) => !("entryPrompt" in stage))).toBe(
      true,
    );

    const next = editable();
    next.stages[1] = {
      ...next.stages[1]!,
      entryPrompt: "  Run /slop-cop\r\nthen /slim-pr  ",
      entryPromptDelivery: "queue",
      entryPromptOnAgentMove: true,
    };
    next.stages[2] = {
      ...next.stages[2]!,
      entryPrompt: "Capture screenshots.",
      entryPromptDelivery: "steer",
      entryPromptOnAgentMove: false,
    };
    const normalized = core.normalizeEditableWorkflowConfig(next);
    expect(normalized.stages[1]).toEqual({
      key: "planning",
      role: "stage",
      title: "Planning",
      rule: next.stages[1]!.rule,
      entryPrompt: "Run /slop-cop\nthen /slim-pr",
    });
    expect(normalized.stages[2]).toMatchObject({
      entryPrompt: "Capture screenshots.",
      entryPromptDelivery: "steer",
      entryPromptOnAgentMove: false,
    });
  });

  it("rejects an Inbox prompt, an oversized prompt, and unknown delivery", () => {
    const inbox = editable();
    inbox.stages[0] = { ...inbox.stages[0]!, entryPrompt: "Nope." };
    expect(() => core.normalizeEditableWorkflowConfig(inbox)).toThrow(
      "Inbox cannot send an entry prompt.",
    );

    const long = editable();
    long.stages[1] = {
      ...long.stages[1]!,
      entryPrompt: "x".repeat(core.ENTRY_PROMPT_MAX_LENGTH + 1),
    };
    expect(() => core.normalizeEditableWorkflowConfig(long)).toThrow(
      "entry prompt must be at most",
    );

    const delivery = editable();
    delivery.stages[1] = {
      ...delivery.stages[1]!,
      entryPrompt: "Go.",
      entryPromptDelivery: "later" as never,
    };
    expect(() => core.normalizeEditableWorkflowConfig(delivery)).toThrow(
      "invalid entry prompt delivery",
    );
  });

  it("renders template variables and leaves unknown tokens alone", () => {
    const rendered = core.renderEntryPrompt(
      "{{thread.title}} → {{ stage.title }} ({{stage.key}}, {{thread.id}}) {{nope.x}}",
      {
        stage: { key: "review", title: "Review" },
        thread: { id: "thr_1", title: "Fix it" },
      },
    );
    expect(rendered).toBe("Fix it → Review (review, thr_1) {{nope.x}}");
    expect(
      core.entryPromptMessage(
        { key: "review", role: "stage", rule: "r", title: "Review", entryPrompt: "Do {{stage.key}}." },
        { stage: { key: "review", title: "Review" }, thread: { id: "thr_1", title: "" } },
      ),
    ).toBe("Thread Organizer — entering “Review”:\n\nDo review.");
  });

  it("tells agents about entry prompts only for stages that fire on agent moves", () => {
    const config = core.cloneWorkflowConfig(core.DEFAULT_WORKFLOW_CONFIG);
    expect(core.buildWorkflowSkillSlot(config)).not.toContain("Entering");

    config.stages[2] = { ...config.stages[2]!, entryPrompt: "Review." };
    config.stages[5] = {
      ...config.stages[5]!,
      entryPrompt: "Screenshots.",
      entryPromptOnAgentMove: false,
    };
    const instructions = core.buildWorkflowSkillSlot(config);
    expect(instructions).toContain(
      "Entering `spec-review` sends that stage’s entry prompt",
    );
    expect(instructions).not.toContain("`handoff`");
    expect(instructions).toContain(
      "| spec-review | Spec Review | A spec or implementation plan is ready for, awaiting, or undergoing user review. |",
    );
  });
});
