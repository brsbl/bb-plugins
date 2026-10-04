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
  INBOX_DESCRIPTION,
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
    // bb's synced sidebar order, served the way the real endpoint serves it.
    const preference = {
      revision: 1,
      value: initial.stages.map((stage) => `section:${stage.sectionId}`),
    };
    const json = (status: number, body: unknown) =>
      ({ ok: status < 300, status, json: async () => body }) as Response;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url === "/api/v1/preferences/ui") {
          return json(200, {
            preferences: { "sidebar.manualSectionOrder": preference },
          });
        }
        if (url === "/api/v1/preferences/ui/sidebar.manualSectionOrder") {
          const body = JSON.parse(String(init?.body)) as {
            expectedRevision: number;
            value: string[];
          };
          if (body.expectedRevision !== preference.revision) {
            return json(409, { details: { currentRevision: preference.revision } });
          }
          preference.revision += 1;
          preference.value = body.value;
          return json(200, { key: "sidebar.manualSectionOrder", ...preference });
        }
        return json(404, { code: "not_found" });
      }),
    );
    const scripts = await mountPluginContentScripts(app, {
      pluginId: "thread-organizer",
    });
    const rendered = renderSlot<{}, typeof rpcContract>(
      app.settingsSections[0]!,
      {},
      {
        sdk: { plugins: { list: async () => ({ plugins: [] }) } },
        rpc: {
          listThreadSourcePlugins: async () => [], getConfig: async () => initial,
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
      expect(preference.value.slice(0, 4)).toEqual([
        "section:sec_inbox",
        "section:sec_spec-review",
        "section:sec_planning",
        "section:sec_building",
      ]),
    );
    rendered.lifecycle.unmount();
    await scripts.lifecycle.dispose();
    vi.unstubAllGlobals();
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
        sdk: { plugins: { list: async () => ({ plugins: [] }) } },
        rpc: {
          listThreadSourcePlugins: async () => [], getConfig: async () => initial,
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

  it("lets Inbox change title while locking its routing rule", async () => {
    const app = await loadApp();
    const initial = configuredWorkflow();
    let savedInput: EditableWorkflowConfig | null = null;
    const rendered = renderSlot<{}, typeof rpcContract>(
      app.settingsSections[0]!,
      {},
      {
        sdk: { plugins: { list: async () => ({ plugins: [] }) } },
        rpc: {
          listThreadSourcePlugins: async () => [], getConfig: async () => initial,
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
    const inboxRule = rendered.getByTitle(INBOX_DESCRIPTION).parentElement!;
    expect(inboxTitle.disabled).toBe(false);
    expect(inboxRule.tagName).toBe("P");
    expect(inboxRule.textContent).toContain("without another inbox");
    expect(rendered.queryByLabelText("Unread routing is automatic")).toBeNull();

    fireEvent.change(inboxTitle, { target: { value: "Needs Me" } });
    fireEvent.click(rendered.getByRole("button", { name: "Save" }));

    await vi.waitFor(() => expect(savedInput).not.toBeNull());
    await vi.waitFor(() =>
      expect(rendered.getByRole("button", { name: "Saved" })).toBeTruthy(),
    );
    expect(savedInput!.stages[0]).toMatchObject({
      key: "inbox",
      title: "Needs Me",
      rule: INBOX_RULE,
    });
    expect(rendered.inspection.rpcCalls.map(({ method }) => method).sort()).toEqual([
      "getConfig",
      "listThreadSourcePlugins",
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
        sdk: { plugins: { list: async () => ({ plugins: [] }) } },
        rpc: {
          listThreadSourcePlugins: async () => [], getConfig: async () => initial,
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

    const addStage = rendered.getByRole("button", { name: "Add section" });
    const save = rendered.getByRole("button", { name: "Save" });
    const actions = rendered.getByRole("group", { name: "Workflow actions" });
    const description = rendered.getByText(
      "Rename, reorder, and define the workflow your agents follow.",
    );
    expect(description.className).not.toContain("ps-");
    expect(description.className).not.toContain("text-indent");
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

    rendered.lifecycle.unmount();
  });

  it("reveals and focuses the new section after Add section, keys it by its final title, and hides the template helper", async () => {
    const app = await loadApp();
    const initial = configuredWorkflow();
    const scrolled: Element[] = [];
    let savedInput: EditableWorkflowConfig | null = null;
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: function (this: Element) {
        scrolled.push(this);
      },
    });
    const rendered = renderSlot<{}, typeof rpcContract>(
      app.settingsSections[0]!,
      {},
      {
        sdk: { plugins: { list: async () => ({ plugins: [] }) } },
        rpc: {
          listThreadSourcePlugins: async () => [], getConfig: async () => initial,
          saveConfig: async (input) => ((savedInput = input), {
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

    await rendered.findByLabelText("Planning section title");
    expect(rendered.queryByText(/Entry prompts can use/)).toBeNull();
    const hints = rendered.getAllByText("sent on arrival", { exact: false });
    expect(hints).toHaveLength(1);
    expect(hints.some((hint) => hint.closest("article") !== null)).toBe(false);

    fireEvent.click(rendered.getByRole("button", { name: "Add section" }));
    const title = await rendered.findByLabelText("New Section section title");
    await vi.waitFor(() => expect(scrolled).toContain(title));

    fireEvent.change(title, { target: { value: "Triage" } });
    fireEvent.click(rendered.getByRole("button", { name: "Save" }));
    await vi.waitFor(() => expect(savedInput).not.toBeNull());
    expect(savedInput!.stages[savedInput!.stages.length - 1]).toMatchObject({
      key: "triage",
      title: "Triage",
    });
    rendered.lifecycle.unmount();
    delete (HTMLElement.prototype as unknown as Record<string, unknown>)
      .scrollIntoView;
  });

  it("opens the prompt editor anchored to its row and cancels drafts", async () => {
    const app = await loadApp();
    const rendered = renderSlot<{}, typeof rpcContract>(app.settingsSections[0]!, {}, {
      sdk: { plugins: { list: async () => ({ plugins: [] }) } },
      rpc: { listThreadSourcePlugins: async () => [], getConfig: async () => configuredWorkflow(), saveConfig: async () => configuredWorkflow() },
    });
    const trigger = await rendered.findByRole("button", { name: "Edit entry prompt for Planning" });
    expect(trigger.textContent).toBe("Add prompt");
    fireEvent.click(trigger);
    const editor = await rendered.findByRole("dialog", { name: "Entry prompt for Planning" });
    const prompt = within(editor).getByRole("textbox");
    await vi.waitFor(() => expect(document.activeElement).toBe(prompt));
    fireEvent.change(prompt, { target: { value: "Discard this draft" } });
    fireEvent.click(within(editor).getByRole("button", { name: "Cancel" }));
    await vi.waitFor(() => expect(rendered.queryByRole("dialog")).toBeNull());
    expect(trigger.textContent).toBe("Add prompt");
    fireEvent.click(trigger);
    expect((await rendered.findByRole("textbox", { name: "Entry prompt for Planning" }) as HTMLTextAreaElement).value).toBe("");
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    await vi.waitFor(() => expect(rendered.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(trigger);
    rendered.lifecycle.unmount();
  });

  it("holds Save when the workflow changed elsewhere until the user reloads", async () => {
    const app = await loadApp();
    const initial = { ...configuredWorkflow(), revision: 3 };
    let loads = 0;
    const rendered = renderSlot<{}, typeof rpcContract>(
      app.settingsSections[0]!,
      {},
      {
        sdk: { plugins: { list: async () => ({ plugins: [] }) } },
        rpc: {
          listThreadSourcePlugins: async () => [], getConfig: async () => {
            loads += 1;
            return initial;
          },
          saveConfig: async (input) => ({
            ...input,
            revision: 4,
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

    const title = (await rendered.findByLabelText(
      "Planning section title",
    )) as HTMLInputElement;

    await rendered.behavior.emitRealtime("workflow-config-changed", {
      version: 2,
      revision: 3,
    });
    expect(loads).toBe(1);
    await rendered.behavior.emitRealtime("workflow-config-changed", {
      version: 2,
      revision: 4,
    });
    await vi.waitFor(() => expect(loads).toBe(2));

    fireEvent.change(title, { target: { value: "Shaping" } });
    await rendered.behavior.emitRealtime("workflow-config-changed", {
      version: 2,
      revision: 3,
    });
    expect(rendered.queryByRole("status")).toBeNull();

    await rendered.behavior.emitRealtime("workflow-config-changed", {
      version: 2,
      revision: 4,
    });
    await vi.waitFor(() =>
      expect(rendered.getByRole("status").textContent).toContain(
        "changed elsewhere",
      ),
    );
    expect(
      (rendered.getByRole("button", { name: "Save" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(loads).toBe(2);

    fireEvent.click(
      rendered.getByRole("button", { name: "Discard my edits and reload" }),
    );
    await vi.waitFor(() => expect(loads).toBe(3));
    await vi.waitFor(() => expect(rendered.queryByRole("status")).toBeNull());
    expect(
      (rendered.getByRole("button", { name: "Save" }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
    rendered.lifecycle.unmount();
  });

  it("holds Save and shows the error when the server refuses a stale save", async () => {
    const app = await loadApp();
    const initial = { ...configuredWorkflow(), revision: 3 };
    let submitted: EditableWorkflowConfig | null = null;
    const rendered = renderSlot<{}, typeof rpcContract>(
      app.settingsSections[0]!,
      {},
      {
        sdk: { plugins: { list: async () => ({ plugins: [] }) } },
        rpc: {
          listThreadSourcePlugins: async () => [], getConfig: async () => initial,
          saveConfig: async (input) => {
            submitted = input;
            throw new Error(
              "The workflow changed elsewhere. Reload and try again.",
            );
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
    expect(submitted).toMatchObject({ baseRevision: 3 });
    await vi.waitFor(() =>
      expect(rendered.getByRole("alert").textContent).toContain(
        "changed elsewhere",
      ),
    );
    expect(rendered.getByRole("status")).toBeTruthy();
    expect(
      (rendered.getByRole("button", { name: "Save" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    rendered.lifecycle.unmount();
  });

  it("renders the approval form for CLI changes and reports the decision", async () => {
    const app = await loadApp();
    const registration = app.pendingInteractions.find(
      (candidate) => candidate.id === "confirm-workflow-change",
    )!;
    const submit = vi.fn(async () => {});
    const cancel = vi.fn(async () => {});
    const rendered = renderSlot(
      registration,
      {
        interaction: {
          id: "int_1",
          threadId: "thr_1",
          title: "Set the entry prompt for Review",
          payload: {
            summary: "Threads landing in Review will receive this message:",
            text: "Run /slop-cop on this PR.",
          },
          createdAt: 0,
          expiresAt: null,
        },
        submit,
        cancel,
      },
      {},
    );
    expect(rendered.getByText("Set the entry prompt for Review")).toBeTruthy();
    expect(rendered.getByText("Run /slop-cop on this PR.")).toBeTruthy();
    expect(rendered.getByText(/25 characters/)).toBeTruthy();
    fireEvent.click(rendered.getByRole("button", { name: "Approve" }));
    await vi.waitFor(() => expect(submit).toHaveBeenCalledWith(true));
    await vi.waitFor(() =>
      expect(
        (rendered.getByRole("button", { name: "Cancel" }) as HTMLButtonElement)
          .disabled,
      ).toBe(false),
    );
    fireEvent.click(rendered.getByRole("button", { name: "Cancel" }));
    await vi.waitFor(() => expect(cancel).toHaveBeenCalled());
    rendered.lifecycle.unmount();
  });

  it("saves a popover prompt into its section and clears it when emptied", async () => {
    const app = await loadApp();
    const initial = configuredWorkflow();
    let savedInput: EditableWorkflowConfig | null = null;
    const rendered = renderSlot<{}, typeof rpcContract>(
      app.settingsSections[0]!,
      {},
      {
        sdk: { plugins: { list: async () => ({ plugins: [] }) } },
        rpc: {
          listThreadSourcePlugins: async () => [], getConfig: async () => initial,
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

    fireEvent.click(await rendered.findByRole("button", { name: "Edit entry prompt for Planning" }));
    let prompt = (await rendered.findByRole("textbox", { name: "Entry prompt for Planning" })) as HTMLTextAreaElement;
    expect(prompt.value).toBe("");
    expect(rendered.queryByLabelText("Entry prompt for Inbox")).toBeNull();

    fireEvent.change(prompt, {
      target: { value: "Run /slop-cop on {{thread.title}}." },
    });
    fireEvent.click(within(rendered.getByRole("dialog")).getByRole("button", { name: "Save" }));
    fireEvent.click(rendered.getByRole("button", { name: "Save" }));
    await vi.waitFor(() => expect(savedInput).not.toBeNull());
    expect(savedInput!.stages[1]).toMatchObject({
      key: "planning",
      entryPrompt: "Run /slop-cop on {{thread.title}}.",
    });
    expect(savedInput!.stages[2]).not.toHaveProperty("entryPrompt");
    expect(savedInput).toMatchObject({ baseRevision: 0 });
    await vi.waitFor(() =>
      expect(rendered.getByRole("button", { name: "Saved" })).toBeTruthy(),
    );

    fireEvent.click(rendered.getByRole("button", { name: "Edit entry prompt for Planning" }));
    prompt = (await rendered.findByRole("textbox", { name: "Entry prompt for Planning" })) as HTMLTextAreaElement;
    fireEvent.change(prompt, { target: { value: "" } });
    fireEvent.click(within(rendered.getByRole("dialog")).getByRole("button", { name: "Save" }));
    expect(rendered.getByRole("button", { name: "Save" })).toBeTruthy();
    fireEvent.click(rendered.getByRole("button", { name: "Save" }));
    await vi.waitFor(() =>
      expect(savedInput!.stages[1]).not.toHaveProperty("entryPrompt"),
    );
    rendered.lifecycle.unmount();
  });

  it("dismisses stage actions after Escape, outside press, and selection", async () => {
    const app = await loadApp();
    const rendered = renderSlot<{}, typeof rpcContract>(
      app.settingsSections[0]!,
      {},
      {
        sdk: { plugins: { list: async () => ({ plugins: [] }) } },
        rpc: {
          listThreadSourcePlugins: async () => [], getConfig: async () => configuredWorkflow(),
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

  function renderMenus(initial: WorkflowConfig, saved: { current: EditableWorkflowConfig | null }) {
    return loadApp().then((app) => renderSlot<{}, typeof rpcContract>(
      app.settingsSections[0]!, {}, {
        sdk: { plugins: { list: vi.fn().mockResolvedValue({ plugins: [
          { id: "digests", name: "Digests", status: "running", isOrphanedBuiltin: false },
          { id: "keep-awake", name: "Keep Awake", status: "running", isOrphanedBuiltin: false },
        ] }) } },
        rpc: {
          listThreadSourcePlugins: async () => ["digests"],
          getConfig: async () => initial,
          saveConfig: async (input) => {
            saved.current = input;
            return {
              ...input,
              stages: input.stages.map((stage) => ({ ...stage, sectionId: `sec_${stage.key}` })),
            };
          },
        },
      },
    ));
  }
  const openSubmenu = async (
    rendered: Awaited<ReturnType<typeof renderMenus>>,
    trigger: RegExp,
    submenu: string,
  ) => {
    fireEvent.keyDown(await rendered.findByRole("button", { name: trigger }), { key: "Enter" });
    fireEvent.click(await rendered.findByRole("menuitem", { name: submenu }));
  };

  it("makes a section an inbox filled by a plugin that creates threads", async () => {
    const saved = { current: null as EditableWorkflowConfig | null };
    const rendered = await renderMenus(configuredWorkflow(), saved);
    await openSubmenu(rendered, /^Section type for Planning: Stage$/, "Inbox");
    fireEvent.click(await rendered.findByRole("menuitem", { name: "Move back after reading" }));
    await rendered.findByRole("button", {
      name: "Section type for Planning: Inbox, moves back after reading",
    });
    expect(rendered.queryByLabelText("Entry prompt for Planning")).toBeNull();

    fireEvent.keyDown(rendered.getByRole("button", { name: "Who fills Planning: You" }), { key: "Enter" });
    const digests = await rendered.findByRole("menuitem", { name: "Digests" });
    expect(rendered.getByRole("menuitem", { name: "You" })).toBeTruthy();
    expect(rendered.queryByRole("menuitem", { name: "Keep Awake" })).toBeNull();
    fireEvent.click(digests);
    await rendered.findByRole("button", { name: "Who fills Planning: Digests" });
    expect(rendered.queryByRole("button", { name: /^Who fills Inbox/ })).toBeNull();
    fireEvent.click(rendered.getByRole("button", { name: "Save" }));
    await vi.waitFor(() => expect(saved.current?.stages[1])
      .toMatchObject({ role: "inbox", catchesPluginId: "digests", returnAfterRead: true }));
    rendered.lifecycle.unmount();
  });

  it("sets the main inbox to move back and turns an inbox back into a stage", async () => {
    const initial = configuredWorkflow();
    initial.stages[1] = { ...initial.stages[1]!, role: "inbox", catchesPluginId: "digests", returnAfterRead: true };
    const saved = { current: null as EditableWorkflowConfig | null };
    const rendered = await renderMenus(initial, saved);
    await openSubmenu(rendered, /^Section type for Inbox: Main inbox$/, "Main inbox");
    expect(rendered.queryByRole("menuitem", { name: "Stage" })).toBeNull();
    fireEvent.click(await rendered.findByRole("menuitem", { name: "Move back after reading" }));
    await rendered.findByRole("button", {
      name: "Section type for Inbox: Main inbox, moves back after reading",
    });
    fireEvent.keyDown(
      rendered.getByRole("button", { name: /^Section type for Planning: Inbox/ }),
      { key: "Enter" },
    );
    fireEvent.click(await rendered.findByRole("menuitem", { name: "Stage" }));
    fireEvent.click(rendered.getByRole("button", { name: "Save" }));
    await vi.waitFor(() => {
      expect(saved.current?.stages[0]).toMatchObject({ key: "inbox", returnAfterRead: true });
      expect(saved.current?.stages[1]).toMatchObject({ role: "stage" });
      expect(saved.current?.stages[1]).not.toHaveProperty("catchesPluginId");
      expect(saved.current?.stages[1]).not.toHaveProperty("returnAfterRead");
    });
    rendered.lifecycle.unmount();
  });

  it("makes a manual inbox filled by you that keeps threads after reading", async () => {
    const saved = { current: null as EditableWorkflowConfig | null };
    const rendered = await renderMenus(configuredWorkflow(), saved);
    await openSubmenu(rendered, /^Section type for Handoff: Stage$/, "Inbox");
    fireEvent.click(await rendered.findByRole("menuitem", { name: "Keep after reading" }));
    await rendered.findByRole("button", { name: "Who fills Handoff: You" });
    fireEvent.click(rendered.getByRole("button", { name: "Save" }));
    await vi.waitFor(() => {
      const handoff = saved.current?.stages.find((stage) => stage.key === "handoff");
      expect(handoff).toMatchObject({ role: "inbox" });
      expect(handoff).not.toHaveProperty("catchesPluginId");
      expect(handoff).not.toHaveProperty("returnAfterRead");
    });
    rendered.lifecycle.unmount();
  });

  it("keeps a shared desktop spine and aligns narrow descriptions under stage titles", async () => {
    const app = await loadApp();
    const rendered = renderSlot<{}, typeof rpcContract>(
      app.settingsSections[0]!,
      {},
      {
        sdk: { plugins: { list: async () => ({ plugins: [] }) } },
        rpc: {
          listThreadSourcePlugins: async () => [], getConfig: async () => configuredWorkflow(),
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
    const planningRule = rendered.getByLabelText("What belongs in Planning");
    const planningGrid = planningTitle.parentElement!;
    const planningCard = planningGrid.parentElement!;
    const stageList = planningCard.parentElement!;
    const planningRuleLayout = planningRule.closest("label")!;
    expect(planningRuleLayout.parentElement).toBe(planningGrid);
    expect(planningGrid.children).toHaveLength(6);
    expect(planningGrid.className).toContain(
      "grid-cols-[minmax(0,1fr)_2rem]",
    );
    expect(planningGrid.className).toContain("lg:grid-cols-subgrid");
    expect(planningGrid.className).toContain("gap-y-0");
    expect(planningCard.className).toContain("px-2");
    expect(planningCard.className).toContain("py-2");
    expect(planningCard.className).toContain("lg:grid-cols-subgrid");
    expect(planningCard.className).toContain("last:rounded-b-lg");
    expect(stageList.className).toContain("overflow-visible");
    expect(planningRuleLayout.className).toContain("col-span-2");
    expect(planningRuleLayout.className).toContain("col-start-1");
    expect(planningRuleLayout.className).toContain("row-start-3");
    expect(planningRuleLayout.className).toContain("lg:col-start-4");
    expect(planningRuleLayout.className).toContain("lg:row-start-1");
    const planningActions = rendered.getByLabelText(
      "More actions for Planning",
    ).parentElement!;
    expect(planningActions.className).toContain("col-start-2");
    expect(planningActions.className).toContain("lg:col-start-6");
    expect(planningActions.className).not.toContain("col-start-3");
    expect(planningActions.className).not.toContain("lg:col-start-4");
    const planningPrompt = rendered
      .getByRole("button", { name: "Edit entry prompt for Planning" })
      .parentElement!;
    expect(planningPrompt.parentElement).toBe(planningGrid);
    expect(planningPrompt.className).toContain("row-start-4");
    expect(planningPrompt.className).toContain("lg:col-start-5");
    expect(planningPrompt.className).toContain("lg:row-start-1");
    expect(planningRule.className).toContain("border-transparent");
    expect(planningRule.className).toContain("resize-none");
    expect(planningRule.className).not.toContain("resize-y");
    expect(planningTitle.className).toContain("border-transparent");

    const inboxTitle = rendered.getByLabelText("Inbox section title");
    const inboxRule = rendered.getByTitle(INBOX_DESCRIPTION).parentElement!;
    const inboxGrid = inboxTitle.parentElement!;
    expect(inboxRule.parentElement).toBe(inboxGrid);
    expect(inboxGrid.children).toHaveLength(6);
    expect(inboxGrid.className).toBe(planningGrid.className);
    expect(inboxRule.className).toContain("col-span-2");
    expect(inboxRule.className).toContain("col-start-1");
    expect(inboxRule.className).toContain("row-start-3");
    expect(inboxRule.className).toContain("lg:col-start-4");
    expect(inboxRule.className).toContain("lg:row-start-1");
    expect(inboxRule.className).toContain("px-1");
    expect(inboxRule.className).toContain("text-sm");

    rendered.lifecycle.unmount();
  });
});
