// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_WORKFLOW_CONFIG,
  cloneWorkflowConfig,
  mergeEditableWorkflowConfig,
  type EditableWorkflowConfig,
  type WorkflowConfig,
} from "./core.js";
import {
  SECTION_ORDER_PREFERENCE_KEY,
  WORKFLOW_CACHE_STORAGE_KEY,
  cacheWorkflowConfig,
  createSectionOrderStore,
  mountThreadOrganizerSidebar,
  orderWithConfiguredSections,
  type SectionOrderStore,
} from "./sidebar-controller.js";

function workflow(): WorkflowConfig {
  const config = cloneWorkflowConfig(DEFAULT_WORKFLOW_CONFIG);
  config.stages.forEach((stage) => {
    stage.sectionId = `sec_${stage.key}`;
  });
  return config;
}

function section(
  id: string,
  label: string,
  expanded: boolean,
  threadIds: string[] = [],
): HTMLElement {
  const group = document.createElement("div");
  group.dataset.sidebarStickyGroup = "";
  group.dataset.sidebarSectionId = id;
  const button = document.createElement("button");
  const rowToggle = document.createElement("button");
  rowToggle.setAttribute("aria-hidden", "true");
  rowToggle.tabIndex = -1;
  const setExpanded = (next: boolean) => {
    button.setAttribute("aria-expanded", String(next));
    button.setAttribute(
      "aria-label",
      `${next ? "Collapse" : "Expand"} ${label} section`,
    );
  };
  const toggle = () =>
    setExpanded(button.getAttribute("aria-expanded") !== "true");
  setExpanded(expanded);
  button.addEventListener("click", toggle);
  rowToggle.addEventListener("click", toggle);
  group.append(button, rowToggle);
  for (const threadId of threadIds) {
    const row = document.createElement("a");
    row.dataset.sidebarThreadId = threadId;
    group.append(row);
  }
  return group;
}

/** One rendered group per workflow stage, in configured order. */
function workflowSections(config = workflow()): Record<string, HTMLElement> {
  return Object.fromEntries(
    config.stages.map((stage) => [
      stage.key,
      section(stage.sectionId!, stage.title, false),
    ]),
  );
}

function sidebar(...groups: HTMLElement[]): HTMLElement {
  const root = document.createElement("aside");
  root.dataset.sidebar = "sidebar";
  root.append(...groups);
  document.body.append(root);
  return root;
}

function toggle(group: Element): HTMLButtonElement {
  return group.querySelector<HTMLButtonElement>("button[aria-expanded]")!;
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

/** An in-memory stand-in for bb's sidebar.manualSectionOrder preference. */
function fakeStore(initial: readonly string[], options?: { conflictOnce?: boolean }) {
  const state = { revision: 1, value: [...initial] };
  const writes: { expectedRevision: number; value: string[] }[] = [];
  let conflictOnce = options?.conflictOnce ?? false;
  const store: SectionOrderStore = {
    read: async () => ({ revision: state.revision, value: [...state.value] }),
    write: async (expectedRevision, value) => {
      writes.push({ expectedRevision, value: [...value] });
      if (conflictOnce) {
        conflictOnce = false;
        state.revision += 1;
        return { conflict: true, revision: state.revision };
      }
      if (expectedRevision !== state.revision) {
        return { conflict: true, revision: state.revision };
      }
      state.revision += 1;
      state.value = [...value];
      return { revision: state.revision, value: [...state.value] };
    },
  };
  return {
    state,
    store,
    writes,
    /** What bb does after a drag: store the new order at a new revision. */
    set(value: readonly string[]) {
      state.value = [...value];
      state.revision += 1;
    },
  };
}

function mount(
  config = workflow(),
  saveConfig: (
    edited: EditableWorkflowConfig,
  ) => Promise<WorkflowConfig> = async (edited) =>
    mergeEditableWorkflowConfig(config, edited),
  store: SectionOrderStore = fakeStore(CONFIGURED).store,
) {
  const controller = new AbortController();
  mountThreadOrganizerSidebar({
    document,
    pluginId: "thread-organizer",
    signal: controller.signal,
    loadConfig: async () => config,
    saveConfig,
    sectionOrderStore: store,
  });
  return controller;
}

async function settled(): Promise<void> {
  await vi.waitFor(() =>
    expect(window.localStorage.getItem(WORKFLOW_CACHE_STORAGE_KEY)).not.toBeNull(),
  );
  for (let i = 0; i < 3; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

afterEach(() => {
  document.body.replaceChildren();
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("orderWithConfiguredSections", () => {
  it("keeps unrelated sections in their slots", () => {
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
        "design",
        "sec_building",
        "sec_testing-deploy",
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

describe("workflow sidebar controller", () => {
  it("leaves native section expansion state untouched", async () => {
    const pinned = section("pinned", "Pinned", true, ["thr_one"]);
    const inbox = section("sec_inbox", "Inbox", false);
    const planning = section("sec_planning", "Planning", true);
    const custom = section("custom", "Personal", true);
    sidebar(pinned, inbox, planning, custom);
    const controller = mount();
    await settled();

    expect(toggle(inbox).getAttribute("aria-expanded")).toBe("false");
    expect(toggle(planning).getAttribute("aria-expanded")).toBe("true");
    expect(toggle(pinned).getAttribute("aria-expanded")).toBe("true");
    expect(toggle(custom).getAttribute("aria-expanded")).toBe("true");

    planning.append(document.createElement("a"));
    await settled();
    expect(toggle(planning).getAttribute("aria-expanded")).toBe("true");
    controller.abort();
  });

  it("writes the configured order to bb's preference, preserving unrelated positions", async () => {
    const groups = workflowSections();
    sidebar(...Object.values(groups));
    const bb = fakeStore(
      order(
        "personal",
        "sec_testing-deploy",
        "sec_planning",
        "design",
        "sec_inbox",
        "sec_building",
        "sec_spec-review",
        "sec_handoff",
        "sec_on-hold",
      ),
    );
    const controller = mount(workflow(), undefined, bb.store);

    await vi.waitFor(() =>
      expect(bb.state.value).toEqual(
        order(
          "personal",
          "sec_inbox",
          "sec_planning",
          "design",
          "sec_spec-review",
          "sec_building",
          "sec_testing-deploy",
          "sec_handoff",
          "sec_on-hold",
        ),
      ),
    );
    expect(bb.writes).toHaveLength(1);
    expect(bb.writes[0]?.expectedRevision).toBe(1);
    controller.abort();
  });

  it("adds a workflow section bb has not ordered, next to its neighbour", async () => {
    const groups = workflowSections();
    sidebar(...Object.values(groups));
    const bb = fakeStore([
      "pinned",
      ...order(
        "sec_inbox",
        "sec_planning",
        "sec_spec-review",
        "sec_testing-deploy",
        "sec_handoff",
        "sec_on-hold",
      ),
      "threads",
    ]);
    const controller = mount(workflow(), undefined, bb.store);

    await vi.waitFor(() =>
      expect(bb.state.value).toEqual(["pinned", ...CONFIGURED, "threads"]),
    );
    controller.abort();
  });

  it("writes nothing when bb's order already matches", async () => {
    const groups = workflowSections();
    sidebar(...Object.values(groups));
    const bb = fakeStore(CONFIGURED);
    const controller = mount(workflow(), undefined, bb.store);
    await settled();

    expect(bb.writes).toHaveLength(0);
    controller.abort();
  });

  it("retries once with the current revision after a conflicting write", async () => {
    const groups = workflowSections();
    sidebar(...Object.values(groups));
    const bb = fakeStore(order("sec_planning", "sec_inbox", ...CONFIGURED.slice(2).map((id) => id.slice("section:".length))), {
      conflictOnce: true,
    });
    const controller = mount(workflow(), undefined, bb.store);

    await vi.waitFor(() => expect(bb.state.value).toEqual(CONFIGURED));
    expect(bb.writes.map((write) => write.expectedRevision)).toEqual([1, 2]);
    controller.abort();
  });

  it("keeps a workflow-stage order chosen in the native sidebar", async () => {
    const config = workflow();
    const saveConfig = vi.fn(async (edited: EditableWorkflowConfig) =>
      mergeEditableWorkflowConfig(config, edited),
    );
    const groups = workflowSections(config);
    const root = sidebar(...Object.values(groups));
    const bb = fakeStore(CONFIGURED);
    const controller = mount(config, saveConfig, bb.store);
    await settled();

    const chosen = order(
      "sec_inbox",
      "sec_building",
      "sec_planning",
      "sec_spec-review",
      "sec_testing-deploy",
      "sec_handoff",
      "sec_on-hold",
    );
    bb.set(chosen);
    root.insertBefore(groups.building!, groups.planning!);
    await vi.waitFor(() => expect(saveConfig).toHaveBeenCalledOnce());

    expect(saveConfig.mock.calls[0]?.[0].stages.map((stage) => stage.key)).toEqual(
      [
        "inbox",
        "building",
        "planning",
        "spec-review",
        "testing-deploy",
        "handoff",
        "on-hold",
      ],
    );
    await settled();
    expect(bb.state.value).toEqual(chosen);
    expect(bb.writes).toHaveLength(0);
    controller.abort();
  });

  it("keeps the protected Inbox first when it is dragged", async () => {
    const config = workflow();
    const saveConfig = vi.fn(async (edited: EditableWorkflowConfig) =>
      mergeEditableWorkflowConfig(config, edited),
    );
    const groups = workflowSections(config);
    const root = sidebar(...Object.values(groups));
    const bb = fakeStore(CONFIGURED);
    const controller = mount(config, saveConfig, bb.store);
    await settled();

    bb.set([CONFIGURED[1]!, CONFIGURED[0]!, ...CONFIGURED.slice(2)]);
    root.insertBefore(groups.planning!, groups.inbox!);

    await vi.waitFor(() => expect(bb.state.value).toEqual(CONFIGURED));
    expect(saveConfig).not.toHaveBeenCalled();
    controller.abort();
  });

  it("applies a saved configuration event without remounting", async () => {
    const inbox = section("sec_inbox", "Inbox", false);
    const planning = section("sec_planning", "Planning", true);
    const onHold = section("sec_on-hold", "On Hold", true);
    sidebar(inbox, planning, onHold);
    const config = workflow();
    const controller = mount(config);
    await Promise.resolve();

    const edited = cloneWorkflowConfig(config);
    edited.stages = edited.stages.filter((stage) => stage.key !== "on-hold");
    toggle(onHold).setAttribute("aria-expanded", "true");
    toggle(onHold).setAttribute("aria-label", "Collapse On Hold section");
    cacheWorkflowConfig(edited);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(toggle(onHold).getAttribute("aria-expanded")).toBe("true");
    expect(toggle(inbox).getAttribute("aria-expanded")).toBe("false");
    expect(toggle(planning).getAttribute("aria-expanded")).toBe("true");
    controller.abort();
  });
});

describe("sidebar reorder after a refused save", () => {
  it("refreshes its config when a save is refused so the next reorder succeeds", async () => {
    const served = workflow();
    let loads = 0;
    const saveConfig = vi.fn(async (edited: EditableWorkflowConfig) =>
      mergeEditableWorkflowConfig(served, edited),
    );
    saveConfig.mockRejectedValueOnce(
      new Error("The workflow changed elsewhere. Reload and try again."),
    );
    const groups = workflowSections(served);
    const root = sidebar(...Object.values(groups));
    const bb = fakeStore(CONFIGURED);
    const controller = new AbortController();
    mountThreadOrganizerSidebar({
      document,
      pluginId: "thread-organizer",
      signal: controller.signal,
      loadConfig: async () => {
        loads += 1;
        return served;
      },
      saveConfig,
      sectionOrderStore: bb.store,
    });
    await settled();
    const loadsBefore = loads;

    const chosen = order(
      "sec_inbox",
      "sec_building",
      "sec_planning",
      "sec_spec-review",
      "sec_testing-deploy",
      "sec_handoff",
      "sec_on-hold",
    );
    bb.set(chosen);
    root.insertBefore(groups.building!, groups.planning!);
    await vi.waitFor(() => expect(saveConfig).toHaveBeenCalledOnce());
    await vi.waitFor(() => expect(loads).toBeGreaterThan(loadsBefore));
    // The refreshed config still has the served order, so it is pushed back.
    await vi.waitFor(() => expect(bb.state.value).toEqual(CONFIGURED));

    // bb re-renders from the preference, then the user drags again.
    root.insertBefore(groups.planning!, groups.building!);
    await settled();
    bb.set(chosen);
    root.insertBefore(groups.building!, groups.planning!);
    await vi.waitFor(() => expect(saveConfig).toHaveBeenCalledTimes(2));
    await expect(saveConfig.mock.results[1]!.value).resolves.toBeTruthy();
    controller.abort();
  });
});

describe("createSectionOrderStore", () => {
  function response(status: number, body: unknown) {
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    } as unknown as Response;
  }

  it("reads the preference from bb's UI preferences document", async () => {
    const fetchImpl = vi.fn(async () =>
      response(200, {
        preferences: {
          [SECTION_ORDER_PREFERENCE_KEY]: { revision: 3, value: ["pinned"] },
          "sidebar.organizationMode": { revision: 1, value: "chronological" },
        },
      }),
    );
    const store = createSectionOrderStore(fetchImpl as unknown as typeof fetch);
    await expect(store.read()).resolves.toEqual({ revision: 3, value: ["pinned"] });
    expect(fetchImpl.mock.calls[0]?.[0]).toBe("/api/v1/preferences/ui");
  });

  it("writes with the expected revision and reports a conflict", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        response(200, { key: SECTION_ORDER_PREFERENCE_KEY, revision: 4, value: ["pinned", "threads"] }),
      )
      .mockResolvedValueOnce(
        response(409, {
          code: "ui_preference_conflict",
          details: { currentRevision: 9 },
        }),
      );
    const store = createSectionOrderStore(fetchImpl as unknown as typeof fetch);
    await expect(store.write(3, ["pinned", "threads"])).resolves.toEqual({
      revision: 4,
      value: ["pinned", "threads"],
    });
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/v1/preferences/ui/sidebar.manualSectionOrder");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body as string)).toEqual({
      expectedRevision: 3,
      value: ["pinned", "threads"],
    });
    await expect(store.write(4, ["threads"])).resolves.toEqual({
      conflict: true,
      revision: 9,
    });
  });
});
