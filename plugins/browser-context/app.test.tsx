// @vitest-environment jsdom

import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import type { JsonValue, PluginBrowserActionProps } from "@get-bb/plugin-sdk/app";
import {
  loadPluginApp,
  renderSlot,
  type PluginRpcTestHandlers,
} from "@get-bb/plugin-sdk/testing/app";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { rpcContract } from "./server.js";
import type { BrowserSelectionCapture } from "./lib/browser-selection.js";

const capture: BrowserSelectionCapture = {
  version: 2,
  kind: "element",
  page: {
    url: "https://example.com/settings",
    title: "Settings",
    viewport: { width: 800, height: 600 },
    scroll: { x: 0, y: 0 },
  },
  rect: { x: 40, y: 50, width: 180, height: 36 },
  element: {
    selector: "button#save",
    tag: "button",
    id: "save",
    classNames: ["primary"],
    rect: { x: 40, y: 50, width: 180, height: 36 },
    dom: '<button id="save">Save</button>',
    text: "Save",
    styles: { display: "inline-flex" },
    accessibility: {
      source: "dom-hint",
      roleHint: "button",
      nameHint: "Save",
      attributes: {},
    },
    reactComponentStack: ["SaveButton"],
  },
  region: null,
  screenshot: {
    dataUrl: "data:image/png;base64,aQ==",
    pixelSize: { width: 1600, height: 1200 },
    deviceScaleFactor: 2,
    pageZoom: 1,
    cssToImageScale: { x: 2, y: 2 },
  },
};

const regionCapture: BrowserSelectionCapture = {
  ...capture,
  kind: "region",
  rect: { x: 280, y: 160, width: 360, height: 220 },
  element: null,
  region: {
    commonAncestor: {
      kind: "element",
      absoluteLocator: { selectors: ["main > section.settings"] },
    },
    targets: [
      {
        absoluteLocator: {
          selectors: ["main > section.settings > button#save"],
        },
        relativeLocator: { selectors: [":scope > button#save"] },
        text: "Save",
        rect: { x: 300, y: 180, width: 180, height: 36 },
        accessibility: {
          source: "dom-hint",
          roleHint: "button",
          nameHint: "Save",
          attributes: {},
        },
      },
    ],
    groups: [],
    omittedTargetCount: 0,
    omittedGroupCount: 0,
    scanTruncated: false,
  },
};

const browserTarget = {
  clientId: "client:one",
  windowId: "window:one",
  tabId: "browser:one",
  navigationEpoch: 2,
};

function preparedBatch(count: number) {
  return {
    mentions: Array.from({ length: count }, (_, index) => ({
      id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      label: "Save",
      preview: index === 0 ? "Button on Settings" : "Page · Settings",
    })),
  };
}

type CreateCaptureMentionsHandler = PluginRpcTestHandlers<
  typeof rpcContract
>["createCaptureMentions"];

function rpcHandlers(
  createCaptureMentions: CreateCaptureMentionsHandler = vi.fn(async () =>
    preparedBatch(1),
  ),
  overrides: Partial<PluginRpcTestHandlers<typeof rpcContract>> = {},
): PluginRpcTestHandlers<typeof rpcContract> {
  let agentControlEnabled = false;
  return {
    getAgentControlMode: vi.fn(async () => ({
      enabled: agentControlEnabled,
    })),
    setAgentControlMode: vi.fn(async ({ enabled }) => {
      agentControlEnabled = enabled;
      return { enabled };
    }),
    prepareCapture: vi.fn(async () => ({
      promptText: "> Legacy context",
    })),
    prepareCaptures: vi.fn(async () => ({ promptText: "> Legacy context" })),
    createCaptureMentions,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

async function loadAction() {
  const app = await loadPluginApp(() => import("./app.js"));
  const registration = app.browserActions.find(({ id }) => id === "capture");
  if (registration === undefined) throw new Error("Browser action missing");
  return registration;
}

async function loadAgentControlAction() {
  const app = await loadPluginApp(() => import("./app.js"));
  const registration = app.browserActions.find(
    ({ id }) => id === "agent-control",
  );
  if (registration === undefined) {
    throw new Error("Agent-control Browser action missing");
  }
  return registration;
}

type BrowserActionTestProps = PluginBrowserActionProps & {
  experimental_overlayRoot: HTMLElement | null;
};

function pageSelectionResult(value: BrowserSelectionCapture): JsonValue {
  const { screenshot, ...selection } = value;
  return {
    ...selection,
    deviceScaleFactor: screenshot.deviceScaleFactor,
  } as unknown as JsonValue;
}

function selectionRunner(...values: Array<BrowserSelectionCapture | Error>) {
  let index = 0;
  return vi.fn<PluginBrowserActionProps["experimental_runPageContentScript"]>(
    async (request) => {
      if (request.world === "main") {
        return {
          navigationEpoch: 2,
          value: { element: null, targets: [] } as JsonValue,
        };
      }
      if (request.source.includes("pageSelectionOverlayCleanup")) {
        return {
          navigationEpoch: 2,
          value: { removed: 1 } as JsonValue,
        };
      }
      const value = values[index++];
      if (value instanceof Error) throw value;
      if (value === undefined) throw new Error("No selection result queued");
      return {
        navigationEpoch: 2,
        value: pageSelectionResult(value),
      };
    },
  );
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function actionProps(
  overrides: Partial<BrowserActionTestProps> = {},
): BrowserActionTestProps {
  return {
    tabId: "browser:one",
    threadId: "thr_1",
    projectId: "prj_1",
    url: capture.page.url,
    experimental_browserTarget: browserTarget,
    experimental_pageContentScriptsAvailable: true,
    experimental_runPageContentScript: selectionRunner(capture),
    experimental_capturePage: vi.fn(async () => ({
      navigationEpoch: 2,
      dataUrl: capture.screenshot.dataUrl,
      pixelSize: capture.screenshot.pixelSize,
    })),
    experimental_setOverlayOpen: vi.fn(),
    experimental_overlayRoot: document.body,
    ...overrides,
  };
}

describe("Browser agent-control action", () => {
  it("enters from the toolbar, shows the active state, and exits from the same control", async () => {
    const registration = await loadAgentControlAction();
    const runPageContentScript = vi.fn(
      async (
        request: Parameters<
          PluginBrowserActionProps["experimental_runPageContentScript"]
        >[0],
      ) => ({
        navigationEpoch: 2,
        value: request.input ?? null,
      }),
    );
    const setAgentControlMode: PluginRpcTestHandlers<
      typeof rpcContract
    >["setAgentControlMode"] = vi.fn(async ({ enabled }) => ({ enabled }));
    const slot = renderSlot(
      registration,
      actionProps({ experimental_runPageContentScript: runPageContentScript }),
      {
        rpc: rpcHandlers(undefined, { setAgentControlMode }),
      },
    );

    const enable = await screen.findByRole("button", {
      name: "Enable agent control",
    });
    await waitFor(() =>
      expect(enable.getAttribute("aria-pressed")).toBe("false"),
    );
    runPageContentScript.mockClear();

    fireEvent.click(enable);
    const exit = await screen.findByRole("button", {
      name: "Exit agent control",
    });
    expect(exit.getAttribute("aria-pressed")).toBe("true");
    expect(exit.querySelector('[data-icon="AiBrowser"]')).not.toBeNull();
    expect(setAgentControlMode).toHaveBeenCalledWith({
      threadId: "thr_1",
      projectId: "prj_1",
      target: browserTarget,
      enabled: true,
    });
    await waitFor(() =>
      expect(runPageContentScript).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({ enabled: true }),
          timeoutMs: 2_000,
        }),
        { signal: expect.any(AbortSignal) },
      ),
    );

    fireEvent.focus(exit);
    expect((await screen.findByRole("tooltip")).textContent).toBe(
      "Exit agent control",
    );
    fireEvent.click(exit);
    await screen.findByRole("button", { name: "Enable agent control" });
    expect(setAgentControlMode).toHaveBeenLastCalledWith(
      expect.objectContaining({ enabled: false }),
    );
    await waitFor(() =>
      expect(runPageContentScript).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({ enabled: false }),
        }),
        { signal: expect.any(AbortSignal) },
      ),
    );

    slot.lifecycle.unmount();
  });

  it("reflects agent-entered mode through realtime and keeps unrelated tabs unchanged", async () => {
    const registration = await loadAgentControlAction();
    const runPageContentScript = vi.fn(
      async (
        request: Parameters<
          PluginBrowserActionProps["experimental_runPageContentScript"]
        >[0],
      ) => ({ navigationEpoch: 2, value: request.input ?? null }),
    );
    const slot = renderSlot(
      registration,
      actionProps({ experimental_runPageContentScript: runPageContentScript }),
      { rpc: rpcHandlers() },
    );
    await screen.findByRole("button", { name: "Enable agent control" });
    runPageContentScript.mockClear();

    await slot.behavior.emitRealtime("agent-control-mode", {
      enabled: true,
      projectId: "prj_1",
      source: "agent",
      target: { ...browserTarget, windowId: "window:other" },
      threadId: "thr_1",
    });
    expect(
      screen.getByRole("button", { name: "Enable agent control" }),
    ).toBeDefined();

    await slot.behavior.emitRealtime("agent-control-mode", {
      enabled: true,
      projectId: "prj_1",
      source: "agent",
      target: browserTarget,
      threadId: "thr_1",
    });
    await screen.findByRole("button", { name: "Exit agent control" });
    await waitFor(() =>
      expect(runPageContentScript).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({ enabled: true }),
        }),
        { signal: expect.any(AbortSignal) },
      ),
    );

    slot.lifecycle.unmount();
  });

  it("does not let stale hydration or toggle responses overwrite realtime state", async () => {
    const registration = await loadAgentControlAction();
    const hydration = deferred<{ enabled: boolean }>();
    const toggle = deferred<{ enabled: boolean }>();
    const getAgentControlMode: PluginRpcTestHandlers<
      typeof rpcContract
    >["getAgentControlMode"] = vi.fn(() => hydration.promise);
    const setAgentControlMode: PluginRpcTestHandlers<
      typeof rpcContract
    >["setAgentControlMode"] = vi.fn(() => toggle.promise);
    const slot = renderSlot(registration, actionProps(), {
      rpc: rpcHandlers(undefined, {
        getAgentControlMode,
        setAgentControlMode,
      }),
    });
    await waitFor(() => expect(getAgentControlMode).toHaveBeenCalledOnce());

    await slot.behavior.emitRealtime("agent-control-mode", {
      enabled: true,
      projectId: "prj_1",
      source: "agent",
      target: browserTarget,
      threadId: "thr_1",
    });
    await screen.findByRole("button", { name: "Exit agent control" });
    hydration.resolve({ enabled: false });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Exit agent control" }),
      ).toBeDefined(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Exit agent control" }));
    await waitFor(() => expect(setAgentControlMode).toHaveBeenCalledOnce());
    await slot.behavior.emitRealtime("agent-control-mode", {
      enabled: true,
      projectId: "prj_1",
      source: "agent",
      target: browserTarget,
      threadId: "thr_1",
    });
    toggle.resolve({ enabled: false });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Exit agent control" }),
      ).toBeDefined(),
    );
    slot.lifecycle.unmount();
  });

  it("reconciles missed agent state after realtime reconnects", async () => {
    const registration = await loadAgentControlAction();
    const getAgentControlMode: PluginRpcTestHandlers<
      typeof rpcContract
    >["getAgentControlMode"] = vi
      .fn()
      .mockResolvedValueOnce({ enabled: false })
      .mockResolvedValueOnce({ enabled: true });
    const slot = renderSlot(registration, actionProps(), {
      realtimeConnectionState: "connected",
      rpc: rpcHandlers(undefined, { getAgentControlMode }),
    });
    await screen.findByRole("button", { name: "Enable agent control" });
    await waitFor(() => expect(getAgentControlMode).toHaveBeenCalledOnce());

    await slot.behavior.setRealtimeConnectionState("reconnecting");
    await slot.behavior.setRealtimeConnectionState("connected");

    await waitFor(() => expect(getAgentControlMode).toHaveBeenCalledTimes(2));
    await screen.findByRole("button", { name: "Exit agent control" });
    slot.lifecycle.unmount();
  });

  it("does not surface inactive-frame errors for blank tabs or navigation invalidation", async () => {
    const registration = await loadAgentControlAction();
    const blankRunner = vi.fn<
      PluginBrowserActionProps["experimental_runPageContentScript"]
    >();
    const blankSlot = renderSlot(
      registration,
      actionProps({
        url: "",
        experimental_runPageContentScript: blankRunner,
      }),
      { rpc: rpcHandlers() },
    );
    await screen.findByRole("button", { name: "Enable agent control" });
    await waitFor(() => expect(blankRunner).not.toHaveBeenCalled());
    expect(screen.queryByRole("status")).toBeNull();
    blankSlot.lifecycle.unmount();

    const navigationRunner = vi.fn<
      PluginBrowserActionProps["experimental_runPageContentScript"]
    >(async () => {
      throw new Error("The Browser page changed before the script ran");
    });
    const navigationSlot = renderSlot(
      registration,
      actionProps({ experimental_runPageContentScript: navigationRunner }),
      { rpc: rpcHandlers() },
    );
    await waitFor(() => expect(navigationRunner).toHaveBeenCalledOnce());
    expect(screen.queryByRole("status")).toBeNull();
    navigationSlot.lifecycle.unmount();
  });
});

describe("Browser Context action", () => {
  it("uses the magic-selection glyph for the Browser toolbar action", async () => {
    const registration = await loadAction();
    const slot = renderSlot(registration, actionProps(), {
      rpc: rpcHandlers(),
    });

    const action = screen.getByRole("button", {
      name: "Select page context",
    });
    expect(
      action.querySelector('[data-icon="CursorMagicSelection04"]'),
    ).not.toBeNull();
    expect(action.getAttribute("title")).toBeNull();
    fireEvent.pointerMove(action);
    expect((await screen.findByRole("tooltip")).textContent).toBe(
      "Select page context",
    );

    slot.lifecycle.unmount();
  }, 15_000);

  it("quietly exits selection when the page runtime inactivity limit expires", async () => {
    const registration = await loadAction();
    const timedOut = selectionRunner(
      new Error(
        "Error invoking remote method 'bb-desktop:browser:experimental-run-page-script': Error: Browser page script timed out",
      ),
    );
    renderSlot(
      registration,
      actionProps({ experimental_runPageContentScript: timedOut }),
      { rpc: rpcHandlers() },
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Select page context" }),
    );
    expect(
      screen.getByRole("button", { name: "Cancel page selection" }),
    ).toBeDefined();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Select page context" }),
      ).toBeDefined(),
    );
    expect(screen.queryByRole("status")).toBeNull();
    expect(
      screen.queryByRole("region", { name: "Browser context preview" }),
    ).toBeNull();
  });

  it("stages one clicked element while preserving the editable composer draft", async () => {
    const registration = await loadAction();
    const props = actionProps();
    const prepared = preparedBatch(1);
    const createCaptureMentions = vi.fn(async () => prepared);
    const slot = renderSlot(registration, props, {
      rpc: rpcHandlers(createCaptureMentions),
      composer: { text: "Make this clearer" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Select page context" }),
    );
    expect(props.experimental_runPageContentScript).toHaveBeenCalledWith(
      expect.objectContaining({
        source: expect.stringContaining("pageSelectionController"),
        input: { overlayId: expect.stringMatching(/^capture-/u) },
        timeoutMs: 60_000,
      }),
      { signal: expect.any(AbortSignal) },
    );

    await screen.findByRole("region", { name: "Browser context preview" });
    expect(props.experimental_capturePage).toHaveBeenCalledWith({
      format: "png",
      expectedNavigationEpoch: 2,
    });
    const capturePage = vi.mocked(props.experimental_capturePage);
    const runPageContentScript = vi.mocked(
      props.experimental_runPageContentScript,
    );
    const captureOrder = capturePage.mock.invocationCallOrder[0];
    const cleanupCall = runPageContentScript.mock.calls.findIndex(([request]) =>
      request.source.includes("pageSelectionOverlayCleanup"),
    );
    expect(cleanupCall).toBeGreaterThanOrEqual(0);
    expect(
      runPageContentScript.mock.invocationCallOrder[cleanupCall],
    ).toBeGreaterThan(captureOrder ?? 0);
    expect(screen.queryByRole("button", { name: "Retake" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Add selection" })).toBeNull();
    const addSelection = screen.getByRole("button", {
      name: "Add page selection",
    });
    expect(
      addSelection.querySelector('[data-icon="CursorMagicSelection04"]'),
    ).not.toBeNull();
    expect(addSelection.getAttribute("aria-pressed")).toBe("false");
    const cancel = screen.getByRole("button", { name: "Cancel annotation" });
    expect(cancel.getAttribute("title")).toBe("Cancel annotation");
    expect(props.experimental_setOverlayOpen).toHaveBeenCalledWith(true);

    const emptySubmit = screen.getByRole("button", {
      name: "Submit comment",
    });
    expect(emptySubmit.textContent).toBe("Enter");
    expect(emptySubmit.querySelector("kbd")?.textContent).toBe("Enter");
    expect((emptySubmit as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("Comment for selection 1"), {
      target: { value: "Make this action more prominent" },
    });
    const submit = screen.getByRole("button", { name: "Submit comment" });
    expect(submit.textContent).toBe("Enter");
    expect(submit.querySelector("kbd")?.textContent).toBe("Enter");
    expect((submit as HTMLButtonElement).disabled).toBe(false);
    expect(submit.getAttribute("title")).toBeNull();
    expect(submit.querySelector('[data-icon="UploadCircle01"]')).not.toBeNull();
    const actionRow = submit.parentElement;
    expect(actionRow?.className).toContain("bb-browser-context-review-actions");
    expect(
      actionRow?.querySelector('button[aria-label="Add selection"]'),
    ).toBeNull();
    expect(
      actionRow?.querySelector(".bb-browser-context-primary")?.textContent,
    ).toContain("Send to agent");
    const comment = screen.getByLabelText("Comment for selection 1");
    submit.focus();
    fireEvent.click(submit);
    await waitFor(() => expect(document.activeElement).toBe(comment));
    expect((comment as HTMLTextAreaElement).value).toBe("");
    const freshSubmit = screen.getByRole("button", {
      name: "Submit comment",
    });
    expect(
      freshSubmit.querySelector('[data-icon="UploadCircle01"]'),
    ).not.toBeNull();
    expect(freshSubmit.textContent).toBe("Enter");
    expect((freshSubmit as HTMLButtonElement).disabled).toBe(true);
    expect(
      screen.getByRole("list", {
        name: "Submitted comments for selection 1",
      }).textContent,
    ).toContain("Make this action more prominent");
    expect(
      screen.queryByRole("button", { name: "Comment submitted" }),
    ).toBeNull();
    fireEvent.change(comment, {
      target: { value: "Keep the label concise" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit comment" }));
    expect(
      screen
        .getByRole("list", {
          name: "Submitted comments for selection 1",
        })
        .querySelectorAll("li"),
    ).toHaveLength(2);
    expect(createCaptureMentions).not.toHaveBeenCalled();
    expect(slot.inspection.composer.text).toBe("Make this clearer");
    const target = screen.getByRole("button", {
      name: "Selection 1: button#save",
    });
    fireEvent.mouseEnter(target);
    expect(target.textContent).toContain("2 comments · Keep the label concise");

    fireEvent.click(screen.getByRole("button", { name: "Send to agent" }));
    await waitFor(() => expect(createCaptureMentions).toHaveBeenCalledOnce());
    expect(createCaptureMentions).toHaveBeenCalledWith({
      threadId: "thr_1",
      projectId: "prj_1",
      annotations: [
        {
          comment: "Make this action more prominent\nKeep the label concise",
          comments: [
            "Make this action more prominent",
            "Keep the label concise",
          ],
          capture,
        },
      ],
    });
    expect(slot.inspection.composer.text).toBe(
      "Make this clearer\n\nSave Make this action more prominent\nKeep the label concise",
    );
    expect(slot.inspection.composer.mentions).toEqual([
      {
        provider: "captures",
        id: prepared.mentions[0]!.id,
        label: prepared.mentions[0]!.label,
        experimental_preview: prepared.mentions[0]!.preview,
        experimental_inspectable: true,
      },
    ]);
    expect(slot.inspection.composer.attachmentCount).toBe(0);
    expect(slot.inspection.composer.focusCount).toBe(2);
    expect(
      screen.queryByRole("region", { name: "Browser context preview" }),
    ).toBeNull();

    await slot.behavior.setComposerText("Make this clearer and more compact");
    expect(slot.inspection.composer.text).toBe(
      "Make this clearer and more compact",
    );
    expect(slot.inspection.composer.attachmentCount).toBe(0);
  });

  it("keeps a fresh composer on the same selection after repeated Enter submissions until dismissed", async () => {
    const registration = await loadAction();
    const createCaptureMentions = vi.fn(async () => preparedBatch(1));
    const slot = renderSlot(registration, actionProps(), {
      rpc: rpcHandlers(createCaptureMentions),
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Select page context" }),
    );
    const comment = await screen.findByLabelText("Comment for selection 1");
    fireEvent.change(comment, { target: { value: "Tighten this action" } });
    fireEvent.keyDown(comment, { key: "Enter" });

    expect(
      screen.getByRole("button", { name: "Submit comment" }),
    ).toHaveProperty("disabled", true);
    expect((comment as HTMLTextAreaElement).value).toBe("");
    expect(
      screen.getByRole("list", {
        name: "Submitted comments for selection 1",
      }).textContent,
    ).toContain("Tighten this action");
    expect(createCaptureMentions).not.toHaveBeenCalled();
    expect(slot.inspection.composer.text).toBe("");
    expect(
      screen.getByRole("region", { name: "Browser context preview" }),
    ).toBeDefined();

    fireEvent.change(comment, { target: { value: "Keep the label" } });
    expect(
      screen.getByRole("button", { name: "Submit comment" }),
    ).toBeDefined();
    fireEvent.keyDown(comment, { key: "Enter", shiftKey: true });
    expect((comment as HTMLTextAreaElement).value).toBe("Keep the label");
    fireEvent.keyDown(comment, { key: "Enter" });
    expect((comment as HTMLTextAreaElement).value).toBe("");
    const submittedComments = screen.getByRole("list", {
      name: "Submitted comments for selection 1",
    });
    expect(submittedComments.querySelectorAll("li")).toHaveLength(2);
    expect(submittedComments.textContent).toContain("Tighten this action");
    expect(submittedComments.textContent).toContain("Keep the label");
    expect(createCaptureMentions).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Cancel annotation" }));
    expect(
      screen.queryByRole("region", { name: "Browser context preview" }),
    ).toBeNull();
  });

  it("keeps click and drag comments attached across numbered multi-selection staging", async () => {
    const registration = await loadAction();
    const inspect = selectionRunner(capture, regionCapture);
    const props = actionProps({ experimental_runPageContentScript: inspect });
    const prepared = preparedBatch(2);
    const createCaptureMentions = vi.fn(async () => prepared);
    const slot = renderSlot(registration, props, {
      rpc: rpcHandlers(createCaptureMentions),
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Select page context" }),
    );
    await screen.findByRole("button", { name: "Selection 1: button#save" });
    fireEvent.change(screen.getByLabelText("Comment for selection 1"), {
      target: { value: "Make the save action prominent" },
    });

    const addSelection = screen.getByRole("button", {
      name: "Add page selection",
    });
    expect(screen.queryByRole("button", { name: "Add selection" })).toBeNull();
    expect(
      addSelection.querySelector('[data-icon="CursorMagicSelection04"]'),
    ).not.toBeNull();
    fireEvent.pointerMove(addSelection);
    expect((await screen.findByRole("tooltip")).textContent).toBe(
      "Add page selection",
    );
    fireEvent.click(addSelection);
    await waitFor(() =>
      expect(
        inspect.mock.calls.filter(([request]) =>
          request.source.includes("pageSelectionController"),
        ),
      ).toHaveLength(2),
    );
    await screen.findByRole("button", {
      name: "Selection 2: 1 target in region",
    });
    fireEvent.change(screen.getByLabelText("Comment for selection 2"), {
      target: { value: "Reduce spacing in this group" },
    });

    const firstRow = screen.getByRole("button", {
      name: "Edit selection 1: button#save",
    });
    fireEvent.mouseEnter(firstRow);
    expect(screen.getByLabelText("Comment for selection 1")).toHaveProperty(
      "value",
      "Make the save action prominent",
    );
    expect(
      screen
        .getByRole("button", { name: "Selection 1: button#save" })
        .getAttribute("data-active"),
    ).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "Send to agent" }));
    await waitFor(() => expect(createCaptureMentions).toHaveBeenCalledOnce());
    expect(createCaptureMentions).toHaveBeenCalledWith({
      threadId: "thr_1",
      projectId: "prj_1",
      annotations: [
        {
          comment: "Make the save action prominent",
          comments: ["Make the save action prominent"],
          capture,
        },
        {
          comment: "Reduce spacing in this group",
          comments: ["Reduce spacing in this group"],
          capture: regionCapture,
        },
      ],
    });
    expect(slot.inspection.composer.attachmentCount).toBe(0);
    expect(slot.inspection.composer.text).toBe(
      "Save Make the save action prominent\nSave Reduce spacing in this group",
    );
    expect(slot.inspection.composer.mentions).toHaveLength(2);
    expect(slot.inspection.composer.mentions[0]?.id).not.toBe(
      slot.inspection.composer.mentions[1]?.id,
    );
  });

  it("restores the existing annotation batch when selecting another target fails", async () => {
    const registration = await loadAction();
    const inspect = selectionRunner(capture, new Error("Selection failed"));
    const props = actionProps({ experimental_runPageContentScript: inspect });
    renderSlot(registration, props, { rpc: rpcHandlers() });

    fireEvent.click(
      screen.getByRole("button", { name: "Select page context" }),
    );
    await screen.findByRole("button", { name: "Selection 1: button#save" });
    fireEvent.change(screen.getByLabelText("Comment for selection 1"), {
      target: { value: "Keep this comment" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Add page selection" }));
    await screen.findByText("Selection failed");

    expect(
      screen.getByRole("region", { name: "Browser context preview" }),
    ).toBeDefined();
    expect(screen.getByLabelText("Comment for selection 1")).toHaveProperty(
      "value",
      "Keep this comment",
    );
    expect(props.experimental_setOverlayOpen).toHaveBeenLastCalledWith(true);
  });

  it("removes one staged selection without disturbing the remaining annotation", async () => {
    const registration = await loadAction();
    const inspect = selectionRunner(capture, regionCapture);
    const createCaptureMentions = vi.fn(async () => preparedBatch(1));
    renderSlot(
      registration,
      actionProps({ experimental_runPageContentScript: inspect }),
      { rpc: rpcHandlers(createCaptureMentions) },
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Select page context" }),
    );
    await screen.findByRole("button", { name: "Selection 1: button#save" });
    fireEvent.change(screen.getByLabelText("Comment for selection 1"), {
      target: { value: "Keep this comment" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add page selection" }));
    await screen.findByRole("button", {
      name: "Selection 2: 1 target in region",
    });

    fireEvent.click(screen.getByRole("button", { name: "Remove selection 2" }));
    expect(
      screen.queryByRole("button", { name: "Remove selection 2" }),
    ).toBeNull();
    expect(screen.getByLabelText("Comment for selection 1")).toHaveProperty(
      "value",
      "Keep this comment",
    );
    fireEvent.click(screen.getByRole("button", { name: "Send to agent" }));
    await waitFor(() => expect(createCaptureMentions).toHaveBeenCalledOnce());
    expect(createCaptureMentions).toHaveBeenCalledWith({
      threadId: "thr_1",
      projectId: "prj_1",
      annotations: [
        {
          comment: "Keep this comment",
          comments: ["Keep this comment"],
          capture,
        },
      ],
    });
  });

  it("exits active selection and the completed annotation session without staging", async () => {
    const registration = await loadAction();
    let observedSignal: AbortSignal | null = null;
    const inspect = vi.fn(
      async (_request: unknown, options: { signal: AbortSignal }) => {
        observedSignal = options.signal;
        return await new Promise<{ navigationEpoch: number; value: null }>(
          (resolve) => {
            options.signal.addEventListener(
              "abort",
              () => resolve({ navigationEpoch: 2, value: null }),
              { once: true },
            );
          },
        );
      },
    );
    const selectingSlot = renderSlot(
      registration,
      actionProps({ experimental_runPageContentScript: inspect }),
      { rpc: rpcHandlers() },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Select page context" }),
    );
    const cancelSelection = screen.getByRole("button", {
      name: "Cancel page selection",
    });
    expect(cancelSelection.getAttribute("aria-pressed")).toBe("true");
    expect(
      cancelSelection.querySelector('[data-icon="CursorMagicSelection04"]'),
    ).not.toBeNull();
    fireEvent.click(cancelSelection);
    await waitFor(() => expect(observedSignal?.aborted).toBe(true));
    selectingSlot.lifecycle.unmount();

    const previewProps = actionProps();
    const previewSlot = renderSlot(registration, previewProps, {
      rpc: rpcHandlers(),
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Select page context" }),
    );
    await screen.findByRole("region", { name: "Browser context preview" });
    fireEvent.click(screen.getByRole("button", { name: "Cancel annotation" }));
    expect(previewProps.experimental_setOverlayOpen).toHaveBeenLastCalledWith(
      false,
    );
    expect(previewSlot.inspection.composer.attachmentCount).toBe(0);
  });

  it("moves the compact annotation panel without changing the selection", async () => {
    const registration = await loadAction();
    renderSlot(registration, actionProps(), { rpc: rpcHandlers() });

    fireEvent.click(
      screen.getByRole("button", { name: "Select page context" }),
    );
    const target = await screen.findByRole("button", {
      name: "Selection 1: button#save",
    });
    const review = screen.getByRole("region", {
      name: "Browser context preview",
    });
    const panel = review.querySelector("aside");
    if (!(panel instanceof HTMLElement)) throw new Error("Panel missing");
    vi.spyOn(review, "getBoundingClientRect").mockReturnValue({
      bottom: 600,
      height: 600,
      left: 0,
      right: 800,
      top: 0,
      width: 800,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    vi.spyOn(panel, "getBoundingClientRect").mockReturnValue({
      bottom: 210,
      height: 200,
      left: 490,
      right: 790,
      top: 10,
      width: 300,
      x: 490,
      y: 10,
      toJSON: () => ({}),
    });
    Object.defineProperties(panel, {
      offsetHeight: { configurable: true, value: 200 },
      offsetWidth: { configurable: true, value: 300 },
    });
    const handle = screen.getByTitle("Drag annotation");
    fireEvent.pointerDown(handle, {
      button: 0,
      clientX: 510,
      clientY: 30,
      pointerId: 7,
    });
    fireEvent.pointerMove(handle, {
      clientX: 220,
      clientY: 240,
      pointerId: 7,
    });
    fireEvent.pointerUp(handle, { pointerId: 7 });

    expect(panel.style.left).toBe("200px");
    expect(panel.style.top).toBe("220px");
    expect(target).toBeDefined();
  });

  it("does not stage a batch after the action unmounts during preparation", async () => {
    const registration = await loadAction();
    const prepared = preparedBatch(1);
    let finish: ((value: typeof prepared) => void) | undefined;
    const slot = renderSlot(registration, actionProps(), {
      rpc: rpcHandlers(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      ),
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Select page context" }),
    );
    await screen.findByRole("region", { name: "Browser context preview" });
    fireEvent.click(screen.getByRole("button", { name: "Send to agent" }));
    await waitFor(() => expect(finish).toBeDefined());
    slot.lifecycle.unmount();
    finish?.(prepared);
    await Promise.resolve();

    expect(slot.inspection.composer.attachmentCount).toBe(0);
    expect(slot.inspection.composer.text).toBe("");
  });

  it("shows preparation errors in place and disables unsupported hosts", async () => {
    const registration = await loadAction();
    const slot = renderSlot(registration, actionProps(), {
      rpc: rpcHandlers(async () => {
        throw new Error("Thread is temporarily unavailable");
      }),
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Select page context" }),
    );
    await screen.findByRole("region", { name: "Browser context preview" });
    fireEvent.click(screen.getByRole("button", { name: "Send to agent" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Thread is temporarily unavailable",
    );
    expect(slot.inspection.composer.attachmentCount).toBe(0);
    slot.lifecycle.unmount();

    renderSlot(registration, actionProps({ experimental_overlayRoot: null }), {
      rpc: rpcHandlers(),
    });
    const unsupported = screen.getByRole("button", {
      name: "Select page context",
    });
    expect((unsupported as HTMLButtonElement).disabled).toBe(true);
    expect(unsupported.getAttribute("title")).toBeNull();
    fireEvent.focus(
      screen.getByLabelText(
        "Browser annotations require a newer BB desktop app.",
      ),
    );
    expect((await screen.findByRole("tooltip")).textContent).toBe(
      "Browser annotations require a newer BB desktop app.",
    );
  });
});
