import { describe, expect, it } from "vitest";

import { DEFAULT_WORKFLOW_CONFIG, cloneWorkflowConfig, type WorkflowConfig } from "./core.js";
import {
  expandSectionsPlaceholder,
  orderWithConfiguredSections,
  syncSidebarOrder,
  type ThreadListRpc,
} from "./sidebar-order.js";

function workflow(): WorkflowConfig {
  const config = cloneWorkflowConfig(DEFAULT_WORKFLOW_CONFIG);
  config.stages.forEach((stage) => {
    stage.sectionId = `sec_${stage.key}`;
  });
  return config;
}

function order(...ids: string[]): string[] {
  return ids.map((id) => `section:${id}`);
}

const CONFIGURED = order(
  "sec_inbox",
  "sec_planning",
  "sec_spec-review",
  "sec_building",
  "sec_testing-deploy",
  "sec_handoff",
  "sec_on-hold",
);

describe("orderWithConfiguredSections", () => {
  it("keeps unrelated sections in their slots and fills in the rest", () => {
    const current = order(
      "personal",
      "sec_testing-deploy",
      "sec_planning",
      "design",
      "sec_inbox",
      "sec_building",
    );
    expect(orderWithConfiguredSections(current, workflow())).toEqual(
      order(
        "personal",
        "sec_inbox",
        "sec_planning",
        "sec_spec-review",
        "design",
        "sec_building",
        "sec_testing-deploy",
        "sec_handoff",
        "sec_on-hold",
      ),
    );
  });

  it("inserts sections bb has never ordered after their configured predecessor", () => {
    const current = [
      "pinned",
      ...order("personal", "sec_inbox", "design", "sec_testing-deploy"),
      "threads",
    ];
    expect(orderWithConfiguredSections(current, workflow())).toEqual([
      "pinned",
      ...order(
        "personal",
        "sec_inbox",
        "sec_planning",
        "sec_spec-review",
        "sec_building",
        "design",
        "sec_testing-deploy",
        "sec_handoff",
        "sec_on-hold",
      ),
      "threads",
    ]);
  });

  it("places the whole workflow after pinned when bb has ordered none of it", () => {
    expect(
      orderWithConfiguredSections(["pinned", "threads"], workflow()),
    ).toEqual(["pinned", ...CONFIGURED, "threads"]);
  });

  it("returns null when the order already matches", () => {
    expect(orderWithConfiguredSections(CONFIGURED, workflow())).toBeNull();
  });
});


describe("expandSectionsPlaceholder", () => {
  it("spells out sections without an explicit slot, in server order", () => {
    expect(expandSectionsPlaceholder(
      ["pinned", "section:b", "sections", "threads", "section:c"],
      ["a", "b", "c", "d"],
    )).toEqual(["pinned", "section:b", "section:a", "section:c", "section:d", "threads"]);
  });

  it("leaves an order without the placeholder alone", () => {
    expect(expandSectionsPlaceholder(["pinned", "section:a", "threads"], ["a", "b"]))
      .toEqual(["pinned", "section:a", "threads"]);
  });
});

describe("syncSidebarOrder", () => {
  function threadList(current: unknown) {
    const writes: unknown[] = [];
    const call: ThreadListRpc = async (method, input) => {
      if (method === "listPreferences") {
        return { preferences: { manualSectionOrder: current } };
      }
      writes.push(input);
      return input;
    };
    return { call, writes };
  }

  it("writes the workflow order to the thread list, ahead of the main inbox when configured", async () => {
    const config = workflow();
    config.stages = [config.stages[5]!, ...config.stages.filter((_, index) => index !== 5)];
    const list = threadList(["pinned", ...CONFIGURED, "threads"]);
    await syncSidebarOrder(config, [], list.call);
    expect(list.writes).toEqual([{
      key: "manualSectionOrder",
      value: ["pinned", ...order(
        "sec_handoff",
        "sec_inbox",
        "sec_planning",
        "sec_spec-review",
        "sec_building",
        "sec_testing-deploy",
        "sec_on-hold",
      ), "threads"],
    }]);
  });

  it("writes nothing when the sidebar already matches", async () => {
    const list = threadList(["pinned", ...CONFIGURED, "threads"]);
    await syncSidebarOrder(workflow(), [], list.call);
    expect(list.writes).toEqual([]);
  });

  it("keeps unworkflowed sections in place when the thread list still stores the placeholder", async () => {
    const config = workflow();
    config.stages = [config.stages[5]!, ...config.stages.filter((_, index) => index !== 5)];
    const list = threadList(["pinned", "sections", "threads"]);
    const serverOrder = ["personal", "inbox", "planning", "design", "spec-review",
      "building", "testing-deploy", "handoff", "on-hold"].map((key) =>
      ["personal", "design"].includes(key) ? key : `sec_${key}`);
    await syncSidebarOrder(config, serverOrder, list.call);
    expect(list.writes).toEqual([{
      key: "manualSectionOrder",
      value: ["pinned", ...order(
        "personal",
        "sec_handoff",
        "sec_inbox",
        "design",
        "sec_planning",
        "sec_spec-review",
        "sec_building",
        "sec_testing-deploy",
        "sec_on-hold",
      ), "threads"],
    }]);
  });

  it("refuses an invalid stored order", async () => {
    const list = threadList("not a list");
    await expect(syncSidebarOrder(workflow(), [], list.call)).rejects.toThrow("invalid section order");
    expect(list.writes).toEqual([]);
  });
});
