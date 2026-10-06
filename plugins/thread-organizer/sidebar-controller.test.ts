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

/** What a user drag looks like to the controller: an interaction, then a DOM reorder. */
function drag(root: Element, moved: Element, before: Element): void {
  root.dispatchEvent(new Event("pointerdown", { bubbles: true }));
  root.insertBefore(moved, before);
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

  it("keeps a workflow-stage order chosen in the native sidebar", async () => {
    const config = workflow();
    const saveConfig = vi.fn(async (edited: EditableWorkflowConfig) =>
      mergeEditableWorkflowConfig(config, edited),
    );
    const groups = workflowSections(config);
    const root = sidebar(...Object.values(groups));
    const controller = mount(config, saveConfig);
    await settled();

    drag(root, groups.building!, groups.planning!);
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
    controller.abort();
  });

  it("saves a section dragged ahead of the main Inbox", async () => {
    const config = workflow();
    const saveConfig = vi.fn(async (edited: EditableWorkflowConfig) =>
      mergeEditableWorkflowConfig(config, edited),
    );
    const groups = workflowSections(config);
    const root = sidebar(...Object.values(groups));
    const controller = mount(config, saveConfig);
    await settled();

    drag(root, groups.handoff!, groups.inbox!);
    await vi.waitFor(() => expect(saveConfig).toHaveBeenCalledOnce());
    expect(saveConfig.mock.calls[0]?.[0].stages.slice(0, 2).map((stage) => stage.key))
      .toEqual(["handoff", "inbox"]);
    controller.abort();
  });

  it("never adopts a rendered order without a sidebar interaction", async () => {
    const config = workflow();
    const saveConfig = vi.fn(async (edited: EditableWorkflowConfig) =>
      mergeEditableWorkflowConfig(config, edited),
    );
    const groups = workflowSections(config);
    const shuffled = Object.values(groups).reverse();
    const root = sidebar(...shuffled);
    const controller = mount(config, saveConfig);
    await settled();

    root.insertBefore(groups.planning!, groups.inbox!);
    await settled();
    expect(saveConfig).not.toHaveBeenCalled();
    controller.abort();
  });

  it("does not undo a config saved elsewhere right after a sidebar interaction", async () => {
    const config = workflow();
    const saveConfig = vi.fn(async (edited: EditableWorkflowConfig) =>
      mergeEditableWorkflowConfig(config, edited),
    );
    const groups = workflowSections(config);
    const root = sidebar(...Object.values(groups));
    const controller = mount(config, saveConfig);
    await settled();

    root.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    const saved = cloneWorkflowConfig(config);
    saved.stages = [saved.stages[5]!, ...saved.stages.filter((_, index) => index !== 5)];
    cacheWorkflowConfig(saved);
    await settled();
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
    });
    await settled();
    const loadsBefore = loads;

    drag(root, groups.building!, groups.planning!);
    await vi.waitFor(() => expect(saveConfig).toHaveBeenCalledOnce());
    await vi.waitFor(() => expect(loads).toBeGreaterThan(loadsBefore));
    await settled();
    expect(saveConfig).toHaveBeenCalledOnce();

    drag(root, groups.planning!, groups.building!);
    await settled();
    drag(root, groups.building!, groups.planning!);
    await vi.waitFor(() => expect(saveConfig).toHaveBeenCalledTimes(2));
    await expect(saveConfig.mock.results[1]!.value).resolves.toBeTruthy();
    controller.abort();
  });
});
