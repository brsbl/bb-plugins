// @vitest-environment jsdom
import { act, cleanup, fireEvent, within } from "@testing-library/react";
import {
  loadPluginApp,
  mountPluginContentScripts,
  renderSlot,
} from "@get-bb/plugin-sdk/testing/app";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_WORKFLOW_CONFIG,
  INBOX_RULE,
  SECTION_ICON_OPTIONS,
  cloneWorkflowConfig,
  type EditableWorkflowConfig,
  type WorkflowConfig,
} from "./core.js";
import type { rpcContract } from "./server.js";
import { cacheWorkflowConfig } from "./sidebar-controller.js";

async function loadApp() {
  return loadPluginApp(() => import("./app.js"));
}

function configuredWorkflow(): WorkflowConfig {
  const config = cloneWorkflowConfig(DEFAULT_WORKFLOW_CONFIG);
  config.stages.forEach((stage) => {
    stage.sectionId = `sec_${stage.key}`;
  });
  return config;
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe("Thread Organizer app registration", () => {
  it("registers the settings editor and sidebar controller", async () => {
    const app = await loadApp();

    expect(app.settingsSections).toEqual([
      expect.objectContaining({ id: "workflow-sections" }),
    ]);
    expect(app.contentScripts).toEqual([
      expect.objectContaining({ id: "workflow-sidebar" }),
    ]);
  });

  it("uses the runtime plugin id when its sidebar controller loads config", async () => {
    const app = await loadApp();
    const fetchMock = vi.fn(async (_input: string) => ({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, result: configuredWorkflow() }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    const mounted = await mountPluginContentScripts(app, {
      pluginId: "thread-organizer-from-main",
    });

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "/api/v1/plugins/thread-organizer-from-main/rpc/getConfig",
    );
    await mounted.lifecycle.dispose();
  });

  it("applies a settings reorder to the mounted sidebar", async () => {
    const app = await loadApp();
    const initial = configuredWorkflow();
    cacheWorkflowConfig(initial);
    const sidebar = document.createElement("aside");
    sidebar.dataset.sidebar = "sidebar";
    for (const stage of initial.stages) {
      const group = document.createElement("div");
      group.dataset.sidebarStickyGroup = "";
      group.dataset.sidebarSectionId = stage.sectionId!;
      const button = document.createElement("button");
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", `Expand ${stage.title} section`);
      button.addEventListener("click", () => {
        const expanded = button.getAttribute("aria-expanded") === "true";
        button.setAttribute("aria-expanded", String(!expanded));
        button.setAttribute(
          "aria-label",
          `${expanded ? "Expand" : "Collapse"} ${stage.title} section`,
        );
      });
      group.append(button);
      sidebar.append(group);
    }
    document.body.append(sidebar);
    window.localStorage.setItem(
      "bb.sidebar.manualSectionOrder",
      JSON.stringify(
        initial.stages.map((stage) => `section:${stage.sectionId}`),
      ),
    );
    const scripts = await mountPluginContentScripts(app, {
      pluginId: "thread-organizer",
    });
    const rendered = renderSlot<{}, typeof rpcContract>(
      app.settingsSections[0]!,
      {},
      {
        rpc: {
          getConfig: async () => initial,
          saveConfig: async (input) => ({
            ...input,
            stages: input.stages.map((stage) => ({
              ...stage,
              sectionId:
                initial.stages.find((candidate) => candidate.key === stage.key)
                  ?.sectionId ?? null,
            })),
          }),
        },
      },
    );
    await rendered.findByLabelText("More actions for Planning");

    fireEvent.click(rendered.getByLabelText("More actions for Planning"));
    fireEvent.click(rendered.getByRole("menuitem", { name: "Move down" }));
    fireEvent.click(rendered.getByRole("button", { name: "Save" }));

    await vi.waitFor(() =>
      expect(
        JSON.parse(
          window.localStorage.getItem("bb.sidebar.manualSectionOrder")!,
        ).slice(0, 4),
      ).toEqual([
        "section:sec_inbox",
        "section:sec_spec-review",
        "section:sec_planning",
        "section:sec_building",
      ]),
    );
    rendered.lifecycle.unmount();
    await scripts.lifecycle.dispose();
  });
});

describe("workflow settings", () => {
  it("preserves newer edits while save and realtime responses are in flight", async () => {
    const app = await loadApp();
    const initial = configuredWorkflow();
    let submitted: EditableWorkflowConfig | null = null;
    let resolveSave!: (value: WorkflowConfig) => void;
    const saveResponse = new Promise<WorkflowConfig>((resolve) => {
      resolveSave = resolve;
    });
    const rendered = renderSlot<{}, typeof rpcContract>(
      app.settingsSections[0]!,
      {},
      {
        rpc: {
          getConfig: async () => initial,
          saveConfig: async (input) => {
            submitted = input;
            return saveResponse;
          },
        },
      },
    );

    const title = (await rendered.findByLabelText(
      "Planning section title",
    )) as HTMLInputElement;
    fireEvent.change(title, { target: { value: "Shaping" } });
    fireEvent.click(rendered.getByRole("button", { name: "Save" }));
    await vi.waitFor(() => expect(submitted).not.toBeNull());

    fireEvent.change(title, { target: { value: "Latest shaping" } });
    await rendered.behavior.emitRealtime("workflow-config-changed", {
      version: 1,
    });
    expect(
      rendered.inspection.rpcCalls.filter(
        ({ method }) => method === "getConfig",
      ),
    ).toHaveLength(1);

    const saved = submitted!;
    await act(async () => {
      resolveSave({
        ...saved,
        stages: saved.stages.map((stage) => ({
          ...stage,
          sectionId: `sec_${stage.key}`,
        })),
      });
      await saveResponse;
    });

    await vi.waitFor(() => expect(title.value).toBe("Latest shaping"));
    expect(rendered.getByRole("button", { name: "Save" })).toBeTruthy();
    expect(rendered.queryByRole("button", { name: "Saved" })).toBeNull();
    rendered.lifecycle.unmount();
  });

  it("lets Inbox change title and icon while locking its routing rule", async () => {
    const app = await loadApp();
    const initial = configuredWorkflow();
    let savedInput: EditableWorkflowConfig | null = null;
    const rendered = renderSlot<{}, typeof rpcContract>(
      app.settingsSections[0]!,
      {},
      {
        rpc: {
          getConfig: async () => initial,
          saveConfig: async (input) => {
            savedInput = input;
            return {
              ...input,
              stages: input.stages.map((stage) => ({
                ...stage,
                sectionId:
                  initial.stages.find(
                    (candidate) => candidate.key === stage.key,
                  )?.sectionId ?? null,
              })),
            };
          },
        },
      },
    );

    await vi.waitFor(() =>
      expect(rendered.getByDisplayValue("Inbox")).toBeTruthy(),
    );
    const inboxTitle = rendered.getByDisplayValue("Inbox") as HTMLInputElement;
    const inboxRule = rendered.getByText(INBOX_RULE);
    expect(inboxTitle.disabled).toBe(false);
    expect(inboxRule.tagName).toBe("P");
    expect(inboxRule.textContent).toContain("can’t be customized");
    expect(rendered.queryByLabelText("Unread routing is automatic")).toBeNull();

    fireEvent.change(inboxTitle, { target: { value: "Needs Me" } });
    const iconButton = rendered.getByRole("button", {
      name: "Choose icon for Needs Me",
    });
    expect(
      iconButton.compareDocumentPosition(inboxTitle) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0);
    fireEvent.click(iconButton);
    expect(
      rendered.getByRole("listbox", { name: "Icons for Needs Me" }),
    ).toBeTruthy();
    fireEvent.click(rendered.getByRole("option", { name: "Mail Open" }));
    fireEvent.click(rendered.getByRole("button", { name: "Save" }));

    await vi.waitFor(() => expect(savedInput).not.toBeNull());
    await vi.waitFor(() =>
      expect(rendered.getByRole("button", { name: "Saved" })).toBeTruthy(),
    );
    expect(savedInput!.stages[0]).toMatchObject({
      key: "inbox",
      title: "Needs Me",
      icon: "MailOpen",
      rule: INBOX_RULE,
    });
    expect(rendered.inspection.rpcCalls.map(({ method }) => method)).toEqual([
      "getConfig",
      "saveConfig",
    ]);
    rendered.lifecycle.unmount();
  });

  it("keeps the editor compact and omits internal metadata and instruction previews", async () => {
    const app = await loadApp();
    const initial = configuredWorkflow();
    const rendered = renderSlot<{}, typeof rpcContract>(
      app.settingsSections[0]!,
      {},
      {
        rpc: {
          getConfig: async () => initial,
          saveConfig: async (input) => ({
            ...input,
            stages: input.stages.map((stage) => ({
              ...stage,
              sectionId: `sec_${stage.key}`,
            })),
          }),
        },
      },
    );

    await vi.waitFor(() =>
      expect(rendered.getByLabelText("Planning section title")).toBeTruthy(),
    );
    expect(rendered.queryByText("Agent instruction preview")).toBeNull();
    expect(rendered.queryByText("spec-review")).toBeNull();
    expect(rendered.queryByText("Section title")).toBeNull();
    expect(rendered.queryByText("Agent may move here")).toBeNull();
    expect(rendered.queryByText("Agent movement")).toBeNull();
    expect(rendered.queryByRole("radio")).toBeNull();
    expect(rendered.queryByText("Fallback for active work")).toBeNull();

    const planningActionTrigger = rendered.getByLabelText(
      "More actions for Planning",
    );
    const planningActions = planningActionTrigger.parentElement!;
    fireEvent.click(planningActionTrigger);
    expect(
      within(planningActions).getByRole("menuitem", { name: "Move down" }),
    ).toBeTruthy();

    const addStage = rendered.getByRole("button", { name: "Add stage" });
    const save = rendered.getByRole("button", { name: "Save" });
    const actions = rendered.getByRole("group", { name: "Workflow actions" });
    const description = rendered.getByText(
      "Rename, re-icon, reorder, and define the workflow your agents follow.",
    );
    expect(description.className).toContain("ps-[var(--radius-lg,0.5rem)]");
    expect(description.className).toContain("[text-indent:-0.088em]");
    const planningTitle = rendered.getByLabelText("Planning section title");
    expect(description.parentElement?.parentElement).toBe(actions.parentElement);
    expect(actions.parentElement?.className).toContain("items-end");
    expect(actions.className).toContain("justify-end");
    expect(within(actions).getAllByRole("button")).toEqual([addStage, save]);
    expect(addStage.className).toContain("border-input");
    expect(addStage.className).toContain("bg-transparent");
    expect(addStage.querySelector("svg")).not.toBeNull();
    expect(save.className).toContain("bg-foreground");
    expect(save.className).toContain("text-background");
    expect(save.querySelector("svg")).not.toBeNull();
    expect(
      addStage.compareDocumentPosition(planningTitle) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0);
    expect(
      save.compareDocumentPosition(planningTitle) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0);

    fireEvent.click(
      rendered.getByRole("button", { name: "Choose icon for Planning" }),
    );
    const iconList = rendered.getByRole("listbox", {
      name: "Icons for Planning",
    });
    expect(within(iconList).getAllByRole("option")).toHaveLength(
      SECTION_ICON_OPTIONS.length,
    );
    expect(
      within(iconList)
        .getByRole("option", { name: "List Todo" })
        .getAttribute("aria-selected"),
    ).toBe("true");
    expect(SECTION_ICON_OPTIONS).toHaveLength(142);
    fireEvent.change(
      rendered.getByRole("searchbox", { name: "Search icons" }),
      {
        target: { value: "calendar" },
      },
    );
    expect(within(iconList).getAllByRole("option")).toHaveLength(2);
    rendered.lifecycle.unmount();
  });

  it("dismisses stage actions after Escape, outside press, and selection", async () => {
    const app = await loadApp();
    const rendered = renderSlot<{}, typeof rpcContract>(
      app.settingsSections[0]!,
      {},
      {
        rpc: {
          getConfig: async () => configuredWorkflow(),
          saveConfig: async (input) => ({
            ...input,
            stages: input.stages.map((stage) => ({
              ...stage,
              sectionId: `sec_${stage.key}`,
            })),
          }),
        },
      },
    );

    const planningActions = await rendered.findByLabelText(
      "More actions for Planning",
    );
    fireEvent.click(planningActions);
    expect(
      rendered.getByRole("menu", { name: "Actions for Planning" }),
    ).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(
      rendered.queryByRole("menu", { name: "Actions for Planning" }),
    ).toBeNull();

    fireEvent.click(planningActions);
    fireEvent.pointerDown(document.body);
    expect(
      rendered.queryByRole("menu", { name: "Actions for Planning" }),
    ).toBeNull();

    fireEvent.click(planningActions);
    fireEvent.click(rendered.getByRole("menuitem", { name: "Move down" }));
    expect(
      rendered.queryByRole("menu", { name: "Actions for Planning" }),
    ).toBeNull();
    const specReviewTitle = rendered.getByLabelText(
      "Spec Review section title",
    );
    const planningTitle = rendered.getByLabelText("Planning section title");
    expect(
      specReviewTitle.compareDocumentPosition(planningTitle) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0);

    rendered.lifecycle.unmount();
  });

  it("keeps a shared desktop spine and aligns narrow descriptions under stage titles", async () => {
    const app = await loadApp();
    const rendered = renderSlot<{}, typeof rpcContract>(
      app.settingsSections[0]!,
      {},
      {
        rpc: {
          getConfig: async () => configuredWorkflow(),
          saveConfig: async (input) => ({
            ...input,
            stages: input.stages.map((stage) => ({
              ...stage,
              sectionId: `sec_${stage.key}`,
            })),
          }),
        },
      },
    );

    const planningTitle = await rendered.findByLabelText(
      "Planning section title",
    );
    const planningIcon = rendered.getByRole("button", {
      name: "Choose icon for Planning",
    });
    const planningRule = rendered.getByLabelText("What belongs in Planning");
    const planningGrid = planningTitle.parentElement!;
    const planningCard = planningGrid.parentElement!;
    const stageList = planningCard.parentElement!;
    const planningRuleLayout = planningRule.closest("label")!;
    expect(planningIcon.parentElement?.parentElement).toBe(planningGrid);
    expect(planningRuleLayout.parentElement).toBe(planningGrid);
    expect(planningGrid.children).toHaveLength(5);
    expect(planningGrid.className).toContain(
      "grid-cols-[2rem_minmax(0,1fr)_2rem]",
    );
    expect(planningGrid.className).toContain(
      "lg:grid-cols-[2rem_2rem_minmax(7rem,9rem)_minmax(0,1fr)_2rem]",
    );
    expect(planningGrid.className).toContain("gap-y-0");
    expect(planningCard.className).toContain("px-3");
    expect(planningCard.className).toContain("py-2.5");
    expect(planningCard.className).toContain("lg:p-3");
    expect(planningCard.className).toContain("first:rounded-t-lg");
    expect(planningCard.className).toContain("last:rounded-b-lg");
    expect(stageList.className).toContain("overflow-visible");
    expect(planningRuleLayout.className).toContain("col-span-2");
    expect(planningRuleLayout.className).toContain("col-start-2");
    expect(planningRuleLayout.className).toContain("row-start-2");
    expect(planningRuleLayout.className).toContain("lg:col-start-4");
    expect(planningRuleLayout.className).toContain("lg:row-start-1");
    expect(planningRule.className).toContain("border-transparent");
    expect(planningRule.className).toContain("resize-none");
    expect(planningRule.className).not.toContain("resize-y");
    expect(planningTitle.className).toContain("border-transparent");

    const inboxTitle = rendered.getByLabelText("Inbox section title");
    const inboxIcon = rendered.getByRole("button", {
      name: "Choose icon for Inbox",
    });
    const inboxRule = rendered.getByText(INBOX_RULE);
    const inboxGrid = inboxTitle.parentElement!;
    expect(inboxIcon.parentElement?.parentElement).toBe(inboxGrid);
    expect(inboxRule.parentElement).toBe(inboxGrid);
    expect(inboxGrid.children).toHaveLength(5);
    expect(inboxGrid.className).toBe(planningGrid.className);
    expect(inboxRule.className).toContain("col-span-2");
    expect(inboxRule.className).toContain("col-start-2");
    expect(inboxRule.className).toContain("row-start-2");
    expect(inboxRule.className).toContain("lg:col-start-4");
    expect(inboxRule.className).toContain("lg:row-start-1");
    expect(inboxRule.className).toContain("px-2.5");
    expect(inboxRule.className).toContain("text-sm");

    rendered.lifecycle.unmount();
  });
});
