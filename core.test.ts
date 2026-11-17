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

  it("rejects Inbox logic changes and exact duplicate titles, like bb", () => {
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
      title: " Planning ",
    };
    expect(() => core.normalizeEditableWorkflowConfig(duplicatedTitle)).toThrow(
      'A section named "Planning" already exists',
    );

    // bb allows names that differ only in capitals, and any length.
    const caseOnly = editable();
    caseOnly.stages[2] = { ...caseOnly.stages[2]!, title: "planning" };
    caseOnly.stages[3] = { ...caseOnly.stages[3]!, title: "x".repeat(200) };
    expect(core.normalizeEditableWorkflowConfig(caseOnly).stages[2]?.title).toBe("planning");
  });

  it("accepts a workflow with only the Inbox, or none", () => {
    const inboxOnly = editable();
    inboxOnly.stages = inboxOnly.stages.slice(0, 1);
    expect(core.normalizeEditableWorkflowConfig(inboxOnly).stages).toHaveLength(1);
    expect(core.parseWorkflowConfig({ version: 2, stages: [] })?.stages).toEqual([]);
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

  it("loads shipped settings and preserves additional inbox filters without a version change", () => {
    const legacy = core.cloneWorkflowConfig(core.DEFAULT_WORKFLOW_CONFIG);
    legacy.stages[0]!.rule = "Idle unread threads that need your attention appear here automatically and stay until work resumes or you move a read thread to another workflow section. This behavior can’t be customized.";
    expect(core.parseWorkflowConfig(legacy)).toEqual(core.DEFAULT_WORKFLOW_CONFIG);
    expect(core.normalizeEditableWorkflowConfig(core.editableWorkflowConfig(legacy)))
      .toEqual(core.editableWorkflowConfig(core.DEFAULT_WORKFLOW_CONFIG));

    const extra = { key: "digests", title: "Digests", role: "inbox" as const,
      catchesPluginId: "digests", rule: "Published issues.", sectionId: "sec_digests" };
    expect(core.parseWorkflowConfig({ version: 2, stages: [legacy.stages[0], extra] })?.stages).toHaveLength(2);
    legacy.stages.push(extra);
    const loaded = core.parseWorkflowConfig(legacy)!;
    expect(loaded.version).toBe(2);
    expect(loaded.stages.at(-1)).toEqual(extra);
    expect(core.mergeEditableWorkflowConfig(loaded, core.editableWorkflowConfig(loaded)))
      .toEqual(loaded);
    expect(core.inboxStage(loaded)?.key).toBe("inbox");
  });

  it("requires unique plugin filters on additional inboxes and protects the main Inbox", () => {
    const next = editable();
    next.stages.push({ key: "digests", title: "Digests", role: "inbox", rule: "Issues." });
    expect(core.normalizeEditableWorkflowConfig(next).stages.at(-1))
      .not.toHaveProperty("catchesPluginId");
    next.stages.at(-1)!.catchesPluginId = "digests";
    next.stages.push({ ...next.stages.at(-1)!, key: "more", title: "More" });
    expect(() => core.normalizeEditableWorkflowConfig(next)).toThrow("already has another inbox");
    next.stages.pop();
    next.stages.at(-1)!.entryPrompt = "Run something.";
    expect(() => core.normalizeEditableWorkflowConfig(next)).toThrow("cannot send an entry prompt");
    delete next.stages.at(-1)!.entryPrompt;
    next.stages[0]!.catchesPluginId = "other";
    expect(() => core.normalizeEditableWorkflowConfig(next)).toThrow("Only an additional inbox");
    delete next.stages[0]!.catchesPluginId;
    next.stages[0]!.role = "stage";
    expect(() => core.normalizeEditableWorkflowConfig(next)).toThrow("reserved for the main Inbox");
  });

  it("persists after-reading return only on inboxes", () => {
    const next = editable();
    next.stages[0]!.returnAfterRead = true;
    expect(core.normalizeEditableWorkflowConfig(next).stages[0])
      .toMatchObject({ returnAfterRead: true });
    next.stages[0]!.returnAfterRead = false;
    expect(core.normalizeEditableWorkflowConfig(next).stages[0])
      .not.toHaveProperty("returnAfterRead");
    next.stages[1]!.returnAfterRead = true;
    expect(() => core.normalizeEditableWorkflowConfig(next)).toThrow("Only an inbox");
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

  it("returns unassigned running and read threads to Threads", () => {
    expect(core.placementForThread(config, thread({ status: "active" }), null)).toBeNull();
    expect(core.placementForThread(config, thread(), null)).toBeNull();
    expect(core.placementForThread(config, thread({ status: "idle", lastReadAt: 0, latestAttentionAt: 10 }), null)?.key).toBe("inbox");
  });

  it("keeps running work in its remembered stage", () => {
    expect(
      core.placementForThread(
        config,
        thread({ status: "active", lastReadAt: 0, latestAttentionAt: 10 }),
        "building",
      )?.key,
    ).toBe("building");
  });

  it("keeps idle unread work and existing Inbox placements in Inbox", () => {
    expect(
      core.placementForThread(
        config,
        thread({ status: "idle", lastReadAt: 0, latestAttentionAt: 10 }),
        "spec-review",
      )?.key,
    ).toBe("inbox");
    expect(
      core.placementForThread(
        config,
        thread({ sectionId: "sec_inbox" }),
        "spec-review",
      )?.key,
    ).toBe("inbox");
    expect(
      core.placementForThread(config, thread(), "spec-review")?.key,
    ).toBe("spec-review");
    expect(
      core.placementForThread(
        config,
        thread({ sectionId: "sec_inbox" }),
        "on-hold",
        true,
      )?.key,
    ).toBe("on-hold");
  });

  it("places a thread whose remembered stage vanished in no section", () => {
    expect(core.placementForThread(config, thread(), "removed-stage")).toBeNull();
  });

  it("leaves an unread thread where it is when there is no main Inbox", () => {
    const withoutInbox = core.cloneWorkflowConfig(config);
    withoutInbox.stages = withoutInbox.stages.filter((stage) => stage.key !== "inbox");
    const building = withoutInbox.stages.find((stage) => stage.key === "building")!;
    building.sectionId = "sec_building";
    expect(core.placementForThread(withoutInbox, thread({ lastReadAt: 0 }), "building"))
      .toBeNull();
    expect(core.placementForThread(
      withoutInbox,
      thread({ lastReadAt: 0, sectionId: building.sectionId }),
      "building",
    )).toBe(building);
    expect(core.buildWorkflowSkillSlot(withoutInbox)).not.toContain("main Inbox");
  });

  it("keeps claimed threads in their own inbox until an explicit move", () => {
    const configured = core.cloneWorkflowConfig(config);
    const inbox = { key: "digests", title: "Digests", role: "inbox" as const,
      catchesPluginId: "digests", rule: "Issues.", sectionId: "sec_digests" };
    configured.stages.push(inbox);
    for (const status of ["active", "idle"] as const) {
      for (const lastReadAt of [0, 100]) {
        expect(core.placementForThread(configured, thread({ status, lastReadAt }), null, false, inbox))
          .toBe(inbox);
        expect(core.placementForThread(configured, thread({ status, lastReadAt, sectionId: inbox.sectionId }), null))
          .toBe(inbox);
      }
    }
    expect(core.placementForThread(configured, thread({ sectionId: inbox.sectionId }), "building", true)?.key)
      .toBe("building");
    expect(core.placementForThread(configured, thread({ lastReadAt: 0 }), null)?.key)
      .toBe("inbox");
    expect(core.buildWorkflowSkillSlot(configured)).toContain(
      "**Digests** catches threads from plugin `digests` and keeps them after reading until the user moves or archives them.",
    );
  });

  it("lets a returning inbox release a thread only when it was just read", () => {
    const configured = core.cloneWorkflowConfig(config);
    configured.stages[0] = { ...configured.stages[0]!, returnAfterRead: true };
    const digests = { key: "digests", title: "Digests", role: "inbox" as const,
      catchesPluginId: "digests", rule: "Issues.", returnAfterRead: true, sectionId: "sec_digests" };
    configured.stages.push(digests);
    const read = { status: "idle" as const, lastReadAt: 20, latestAttentionAt: 20 };

    for (const inbox of [configured.stages[0]!, digests]) {
      const inInbox = thread({ ...read, sectionId: inbox.sectionId });
      expect(core.placementForThread(configured, inInbox, "building")).toBe(inbox);
      expect(core.placementForThread(configured, inInbox, "building", false, null, true)?.key)
        .toBe("building");
      expect(core.placementForThread(configured, inInbox, null, false, null, true)).toBeNull();
      const unread = thread({ ...read, lastReadAt: 0, sectionId: inbox.sectionId });
      expect(core.placementForThread(configured, unread, "building", false, null, true)?.key)
        .toBe(inbox.key);
      const running = thread({ ...read, status: "active", sectionId: inbox.sectionId });
      expect(core.returnsAfterRead(inbox, running)).toBe(false);
    }
    const slot = core.buildWorkflowSkillSlot(configured);
    expect(slot).toContain("return to their workflow section once the user reads them");
    expect(slot).toContain("moves them back out once the user reads them");
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

    expect(instructions).toContain("**Needs Me** is the protected main Inbox");
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
      // Written by the first entry-prompt build; no longer meaningful.
      entryPromptDelivery: "steer",
      entryPromptOnAgentMove: false,
    } as never;
    const normalized = core.normalizeEditableWorkflowConfig(next);
    expect(normalized.stages[1]).toEqual({
      key: "planning",
      role: "stage",
      title: "Planning",
      rule: next.stages[1]!.rule,
      entryPrompt: "Run /slop-cop\nthen /slim-pr",
    });
  });

  it("rejects an Inbox prompt and an oversized prompt", () => {
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
      core.renderEntryPrompt("{{section.title}} ({{section.key}})", {
        stage: { key: "review", title: "Review" },
        thread: { id: "thr_1", title: "" },
      }),
    ).toBe("Review (review)");
    expect(
      core.entryPromptMessage(
        { key: "review", role: "stage", rule: "r", title: "Review", entryPrompt: "Do {{stage.key}}." },
        { stage: { key: "review", title: "Review" }, thread: { id: "thr_1", title: "" } },
      ),
    ).toBe("Thread Organizer — entering “Review”:\n\nDo review.");
  });

  it("tells agents which stages send an entry prompt", () => {
    const config = core.cloneWorkflowConfig(core.DEFAULT_WORKFLOW_CONFIG);
    expect(core.buildWorkflowSkillSlot(config)).not.toContain("Entering");

    config.stages[2] = { ...config.stages[2]!, entryPrompt: "Review." };
    config.stages[5] = { ...config.stages[5]!, entryPrompt: "Package it." };
    const instructions = core.buildWorkflowSkillSlot(config);
    expect(instructions).toContain(
      "Entering `spec-review`, `handoff` sends that stage’s entry prompt",
    );
    expect(instructions).toContain("queued until your current turn ends");
    expect(instructions).toContain(
      "| spec-review | Spec Review | A spec or implementation plan is ready for, awaiting, or undergoing user review. |",
    );
  });
});

describe("stage keys and revisions", () => {
  it("never derives a key the loader migrates away", () => {
    expect(core.createStageKey("Parked", ["inbox"])).toBe("parked-2");
    const parsed = core.parseWorkflowConfig({
      version: 2,
      stages: [
        ...core.DEFAULT_WORKFLOW_CONFIG.stages,
        {
          key: "parked-2",
          role: "stage",
          title: "Parked",
          rule: "Later.",
          sectionId: null,
        },
      ],
    });
    expect(parsed?.stages.map((stage) => stage.key)).toContain("parked-2");
  });

  it("keeps the revision through parse and exposes it as the editor's base", () => {
    const parsed = core.parseWorkflowConfig({
      ...core.DEFAULT_WORKFLOW_CONFIG,
      revision: 7,
    });
    expect(parsed?.revision).toBe(7);
    expect(core.editableWorkflowConfig(parsed!).baseRevision).toBe(7);
    expect(
      core.editableWorkflowConfig(core.DEFAULT_WORKFLOW_CONFIG),
    ).not.toHaveProperty("baseRevision");
  });
});

describe("syncing stages with bb's sections", () => {
  function linked(): core.WorkflowConfig {
    const config = core.cloneWorkflowConfig(core.DEFAULT_WORKFLOW_CONFIG);
    config.stages.forEach((stage, index) => {
      stage.sectionId = `sec_${index}`;
    });
    return config;
  }
  const sectionsOf = (config: core.WorkflowConfig) =>
    config.stages.map((stage) => ({ id: stage.sectionId!, name: stage.title }));

  it("changes nothing when bb already matches", () => {
    const config = linked();
    const result = core.syncStagesWithSections(
      config,
      sectionsOf(config),
      config.stages.map((stage) => stage.sectionId!),
    );
    expect(result.config).toEqual(config);
    expect(result.changes).toEqual([]);
  });

  it("drops stages whose section is gone, the main Inbox included", () => {
    const config = linked();
    const result = core.syncStagesWithSections(
      config,
      sectionsOf(config).filter((section) => !["sec_0", "sec_5"].includes(section.id)),
      null,
    );
    expect(result.config.stages.map((stage) => stage.key)).not.toContain("handoff");
    expect(result.config.stages.map((stage) => stage.key)).not.toContain("inbox");
    expect(result.droppedInbox).toMatchObject({ key: "inbox", sectionId: "sec_0" });
    expect(result.changes).toContain("action=stage-removed-from-bb stage=handoff section=sec_5");
  });

  it("takes bb's names, case-only differences included", () => {
    const config = linked();
    const sections = sectionsOf(config);
    sections[3]!.name = "  building  ";
    const result = core.syncStagesWithSections(config, sections, null);
    expect(result.config.stages[3]).toMatchObject({ key: "building", title: "building" });
    expect(result.changes).toEqual(["action=stage-renamed-from-bb stage=building section=sec_3"]);
  });

  it("adds new sections at their sidebar spot and follows the sidebar order", () => {
    const config = linked();
    const sections = [...sectionsOf(config), { id: "sec_demos", name: "Demos" }];
    const order = ["sec_0", "sec_6", "sec_demos", "sec_1", "sec_2", "sec_3", "sec_4", "sec_5"];
    const result = core.syncStagesWithSections(config, sections, order);
    expect(result.config.stages.map((stage) => stage.sectionId)).toEqual(order);
    expect(result.config.stages[2]).toMatchObject({
      key: "demos", role: "stage", rule: core.DEFAULT_STAGE_RULE,
    });
    expect(result.changes).toContain("action=stage-added-from-bb stage=demos section=sec_demos");
  });

  it("keeps a stage still waiting for its section in place and lets it claim a same-named one", () => {
    const config = linked();
    config.stages[2]!.sectionId = null;
    const sections = sectionsOf(config).filter((section) => section.id !== null);
    sections[2] = { id: "sec_legacy", name: "🔎 Spec Review" };
    const result = core.syncStagesWithSections(config, sections, null);
    expect(result.config.stages[2]).toMatchObject({
      key: "spec-review", sectionId: "sec_legacy", title: "🔎 Spec Review",
    });

    config.stages.push({ key: "fresh", role: "stage", title: "Fresh", rule: "New.", sectionId: null });
    const pending = core.syncStagesWithSections(
      config,
      sectionsOf(linked()),
      ["sec_6", "sec_0", "sec_1", "sec_2", "sec_3", "sec_4", "sec_5"],
    );
    expect(pending.config.stages.at(-1)).toMatchObject({ key: "fresh", sectionId: null });
  });

  it("restores a deleted main Inbox when a section with its name comes back", () => {
    const config = linked();
    const deletedInbox = { ...config.stages[0]!, returnAfterRead: true, sectionId: null };
    config.stages.shift();
    const result = core.syncStagesWithSections(
      config,
      [...sectionsOf(config), { id: "sec_new", name: "Inbox" }],
      null,
      deletedInbox,
    );
    expect(result.config.stages.at(-1)).toMatchObject({
      key: "inbox", role: "inbox", returnAfterRead: true, sectionId: "sec_new",
    });
  });

  it("stops adding at the stage cap and counts the rest", () => {
    const config = linked();
    const room = core.MAX_WORKFLOW_STAGES - config.stages.length;
    const result = core.syncStagesWithSections(
      config,
      [
        ...sectionsOf(config),
        ...Array.from({ length: room + 3 }, (_unused, index) => ({
          id: `sec_extra_${index}`,
          name: `Extra ${index}`,
        })),
      ],
      null,
    );
    expect(result.config.stages).toHaveLength(core.MAX_WORKFLOW_STAGES);
    expect(result.unmanaged).toBe(3);
  });

  it("does not mutate the config it was given", () => {
    const config = linked();
    const before = JSON.stringify(config);
    core.syncStagesWithSections(config, [{ id: "sec_new", name: "Fresh" }], ["sec_new"]);
    expect(JSON.stringify(config)).toBe(before);
  });
});
