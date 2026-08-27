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
  WORKFLOW_CACHE_STORAGE_KEY,
  cacheWorkflowConfig,
  mountThreadOrganizerSidebar,
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

function mount(
  config = workflow(),
  saveConfig: (
    edited: EditableWorkflowConfig,
  ) => Promise<WorkflowConfig> = async (edited) =>
    mergeEditableWorkflowConfig(config, edited),
) {
  const controller = new AbortController();
  mountThreadOrganizerSidebar({
    document,
    pluginId: "thread-organizer",
    signal: controller.signal,
    loadConfig: async () => config,
    saveConfig,
  });
  return controller;
}

afterEach(() => {
  document.body.replaceChildren();
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("workflow sidebar controller", () => {
  it("leaves native section expansion state untouched", async () => {
    const pinned = section("pinned", "Pinned", true, ["thr_one"]);
    const inbox = section("sec_inbox", "Inbox", false);
    const planning = section("sec_planning", "Planning", true);
    const custom = section("custom", "Personal", true);
    sidebar(pinned, inbox, planning, custom);
    const controller = mount();

    await vi.waitFor(() =>
      expect(
        window.localStorage.getItem(WORKFLOW_CACHE_STORAGE_KEY),
      ).not.toBeNull(),
    );
    expect(toggle(inbox).getAttribute("aria-expanded")).toBe("false");
    expect(toggle(planning).getAttribute("aria-expanded")).toBe("true");
    expect(toggle(pinned).getAttribute("aria-expanded")).toBe("true");
    expect(toggle(custom).getAttribute("aria-expanded")).toBe("true");

    planning.append(document.createElement("a"));
    await vi.waitFor(() =>
      expect(
        window.localStorage.getItem(WORKFLOW_CACHE_STORAGE_KEY),
      ).not.toBeNull(),
    );
    expect(toggle(planning).getAttribute("aria-expanded")).toBe("true");
    controller.abort();
  });

  it("restores configured order while preserving unrelated positions", async () => {
    const personal = section("personal", "Personal", false);
    const testing = section("sec_testing-deploy", "Testing / Deploy", false);
    const planning = section("sec_planning", "Planning", false);
    const design = section("design", "Design", false);
    const inbox = section("sec_inbox", "Inbox", false);
    const building = section("sec_building", "Building", false);
    sidebar(personal, testing, planning, design, inbox, building);
    window.localStorage.setItem(
      "bb.sidebar.manualSectionOrder",
      JSON.stringify(
        order(
          "personal",
          "sec_testing-deploy",
          "sec_planning",
          "design",
          "sec_inbox",
          "sec_building",
        ),
      ),
    );
    const controller = mount();

    await vi.waitFor(() =>
      expect(
        JSON.parse(
          window.localStorage.getItem("bb.sidebar.manualSectionOrder")!,
        ),
      ).toEqual(
        order(
          "personal",
          "sec_inbox",
          "sec_planning",
          "design",
          "sec_building",
          "sec_testing-deploy",
        ),
      ),
    );
    controller.abort();
  });

  it("keeps a workflow-stage order chosen in the native sidebar", async () => {
    const config = workflow();
    const saveConfig = vi.fn(async (edited: EditableWorkflowConfig) =>
      mergeEditableWorkflowConfig(config, edited),
    );
    const inbox = section("sec_inbox", "Inbox", false);
    const planning = section("sec_planning", "Planning", false);
    const building = section("sec_building", "Building", false);
    const testing = section(
      "sec_testing-deploy",
      "Testing / Deploy",
      false,
    );
    const root = sidebar(inbox, planning, building, testing);
    window.localStorage.setItem(
      "bb.sidebar.manualSectionOrder",
      JSON.stringify(
        order(
          "sec_inbox",
          "sec_planning",
          "sec_spec-review",
          "sec_building",
          "sec_testing-deploy",
          "sec_handoff",
          "sec_on-hold",
        ),
      ),
    );
    const controller = mount(config, saveConfig);
    await vi.waitFor(() =>
      expect(
        window.localStorage.getItem(WORKFLOW_CACHE_STORAGE_KEY),
      ).not.toBeNull(),
    );

    const chosen = order(
      "sec_inbox",
      "sec_building",
      "sec_planning",
      "sec_spec-review",
      "sec_testing-deploy",
      "sec_handoff",
      "sec_on-hold",
    );
    window.localStorage.setItem(
      "bb.sidebar.manualSectionOrder",
      JSON.stringify(chosen),
    );
    root.insertBefore(building, planning);
    await vi.waitFor(() => expect(saveConfig).toHaveBeenCalledOnce());

    expect(
      JSON.parse(
        window.localStorage.getItem("bb.sidebar.manualSectionOrder")!,
      ),
    ).toEqual(chosen);
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
    controller.abort();
  });

  it("keeps the protected Inbox first when it is dragged", async () => {
    const config = workflow();
    const saveConfig = vi.fn(async (edited: EditableWorkflowConfig) =>
      mergeEditableWorkflowConfig(config, edited),
    );
    const inbox = section("sec_inbox", "Inbox", false);
    const planning = section("sec_planning", "Planning", false);
    const root = sidebar(inbox, planning);
    const configured = order(
      "sec_inbox",
      "sec_planning",
      "sec_spec-review",
      "sec_building",
      "sec_testing-deploy",
      "sec_handoff",
      "sec_on-hold",
    );
    window.localStorage.setItem(
      "bb.sidebar.manualSectionOrder",
      JSON.stringify(configured),
    );
    const controller = mount(config, saveConfig);
    await vi.waitFor(() =>
      expect(
        window.localStorage.getItem(WORKFLOW_CACHE_STORAGE_KEY),
      ).not.toBeNull(),
    );

    window.localStorage.setItem(
      "bb.sidebar.manualSectionOrder",
      JSON.stringify([
        configured[1],
        configured[0],
        ...configured.slice(2),
      ]),
    );
    root.insertBefore(planning, inbox);

    await vi.waitFor(() =>
      expect(
        JSON.parse(
          window.localStorage.getItem("bb.sidebar.manualSectionOrder")!,
        ),
      ).toEqual(configured),
    );
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
