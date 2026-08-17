// @vitest-environment jsdom

import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import type {
  ExperimentalBrowserInspectionResult,
  PluginBrowserActionProps,
} from "@bb/plugin-sdk/app";
import {
  loadPluginApp,
  renderSlot,
  type PluginRpcTestHandlers,
} from "@bb/plugin-sdk/testing/app";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { rpcContract } from "./server.js";

const capture: ExperimentalBrowserInspectionResult = {
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

const regionCapture: ExperimentalBrowserInspectionResult = {
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

function preparedBatch(count: number) {
  return {
    mentions: Array.from({ length: count }, (_, index) => ({
      id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      label: index === 0 ? "Save · Settings" : "Save · Settings region",
      preview:
        index === 0
          ? "Element capture from Settings"
          : "Region capture from Settings",
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
): PluginRpcTestHandlers<typeof rpcContract> {
  return {
    prepareCapture: vi.fn(async () => ({
      promptText: "> Legacy context",
    })),
    prepareCaptures: vi.fn(async () => ({ promptText: "> Legacy context" })),
    createCaptureMentions,
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

type BrowserActionTestProps = PluginBrowserActionProps & {
  experimental_overlayRoot: HTMLElement | null;
};

function actionProps(
  overrides: Partial<BrowserActionTestProps> = {},
): BrowserActionTestProps {
  return {
    tabId: "browser:one",
    threadId: "thr_1",
    projectId: "prj_1",
    url: capture.page.url,
    experimental_inspectionAvailable: true,
    experimental_inspectPage: vi.fn(async () => capture),
    experimental_setOverlayOpen: vi.fn(),
    experimental_overlayRoot: document.body,
    ...overrides,
  };
}

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
      action.querySelector('[data-icon="CursorMagicSelection03"]'),
    ).not.toBeNull();
    expect(action.getAttribute("title")).toBeNull();
    fireEvent.pointerMove(action);
    expect((await screen.findByRole("tooltip")).textContent).toBe(
      "Select page context",
    );

    slot.lifecycle.unmount();
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
    expect(props.experimental_inspectPage).toHaveBeenCalledWith(
      { kind: "auto" },
      { signal: expect.any(AbortSignal) },
    );

    await screen.findByRole("region", { name: "Browser context preview" });
    expect(screen.queryByRole("button", { name: "Retake" })).toBeNull();
    const cancel = screen.getByRole("button", { name: "Cancel annotation" });
    expect(cancel.getAttribute("title")).toBe("Cancel annotation");
    expect(props.experimental_setOverlayOpen).toHaveBeenCalledWith(true);

    fireEvent.change(screen.getByLabelText("Comment for selection 1"), {
      target: { value: "Make this action more prominent" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit comment" }));
    expect(
      screen.getByRole("button", { name: "Comment submitted" }).textContent,
    ).toContain("Submitted");
    expect(createCaptureMentions).not.toHaveBeenCalled();
    expect(slot.inspection.composer.text).toBe("Make this clearer");
    const target = screen.getByRole("button", {
      name: "Selection 1: button#save",
    });
    fireEvent.mouseEnter(target);
    expect(target.textContent).toContain("Make this action more prominent");

    fireEvent.click(screen.getByRole("button", { name: "Add to prompt" }));
    await waitFor(() => expect(createCaptureMentions).toHaveBeenCalledOnce());
    expect(createCaptureMentions).toHaveBeenCalledWith({
      threadId: "thr_1",
      projectId: "prj_1",
      annotations: [{ comment: "Make this action more prominent", capture }],
    });
    expect(slot.inspection.composer.text).toBe(
      "Make this clearer\n\nSave · Settings Make this action more prominent",
    );
    expect(slot.inspection.composer.mentions).toEqual([
      {
        provider: "captures",
        ...prepared.mentions[0],
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

  it("submits the active comment with Enter while Shift+Enter remains editable", async () => {
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
      screen.getByRole("button", { name: "Comment submitted" }),
    ).toBeDefined();
    expect(createCaptureMentions).not.toHaveBeenCalled();
    expect(slot.inspection.composer.text).toBe("");
    expect(
      screen.getByRole("region", { name: "Browser context preview" }),
    ).toBeDefined();

    fireEvent.change(comment, {
      target: { value: "Tighten this action\nKeep the label" },
    });
    expect(
      screen.getByRole("button", { name: "Submit comment" }),
    ).toBeDefined();
    fireEvent.keyDown(comment, { key: "Enter", shiftKey: true });
    expect(
      screen.getByRole("button", { name: "Submit comment" }),
    ).toBeDefined();
    expect(createCaptureMentions).not.toHaveBeenCalled();
  });

  it("keeps click and drag comments attached across numbered multi-selection staging", async () => {
    const registration = await loadAction();
    const inspect = vi
      .fn()
      .mockResolvedValueOnce(capture)
      .mockResolvedValueOnce(regionCapture);
    const props = actionProps({ experimental_inspectPage: inspect });
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

    fireEvent.click(screen.getByRole("button", { name: "Select another" }));
    await waitFor(() => expect(inspect).toHaveBeenCalledTimes(2));
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

    fireEvent.click(screen.getByRole("button", { name: "Add to prompt" }));
    await waitFor(() => expect(createCaptureMentions).toHaveBeenCalledOnce());
    expect(createCaptureMentions).toHaveBeenCalledWith({
      threadId: "thr_1",
      projectId: "prj_1",
      annotations: [
        { comment: "Make the save action prominent", capture },
        { comment: "Reduce spacing in this group", capture: regionCapture },
      ],
    });
    expect(slot.inspection.composer.attachmentCount).toBe(0);
    expect(slot.inspection.composer.text).toBe(
      "Save · Settings Make the save action prominent\nSave · Settings region Reduce spacing in this group",
    );
    expect(slot.inspection.composer.mentions).toHaveLength(2);
    expect(slot.inspection.composer.mentions[0]?.id).not.toBe(
      slot.inspection.composer.mentions[1]?.id,
    );
  });

  it("restores the existing annotation batch when selecting another target fails", async () => {
    const registration = await loadAction();
    const inspect = vi
      .fn()
      .mockResolvedValueOnce(capture)
      .mockRejectedValueOnce(new Error("Selection failed"));
    const props = actionProps({ experimental_inspectPage: inspect });
    renderSlot(registration, props, { rpc: rpcHandlers() });

    fireEvent.click(
      screen.getByRole("button", { name: "Select page context" }),
    );
    await screen.findByRole("button", { name: "Selection 1: button#save" });
    fireEvent.change(screen.getByLabelText("Comment for selection 1"), {
      target: { value: "Keep this comment" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Select another" }));
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
    const inspect = vi
      .fn()
      .mockResolvedValueOnce(capture)
      .mockResolvedValueOnce(regionCapture);
    const createCaptureMentions = vi.fn(async () => preparedBatch(1));
    renderSlot(
      registration,
      actionProps({ experimental_inspectPage: inspect }),
      { rpc: rpcHandlers(createCaptureMentions) },
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Select page context" }),
    );
    await screen.findByRole("button", { name: "Selection 1: button#save" });
    fireEvent.change(screen.getByLabelText("Comment for selection 1"), {
      target: { value: "Keep this comment" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Select another" }));
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
    fireEvent.click(screen.getByRole("button", { name: "Add to prompt" }));
    await waitFor(() => expect(createCaptureMentions).toHaveBeenCalledOnce());
    expect(createCaptureMentions).toHaveBeenCalledWith({
      threadId: "thr_1",
      projectId: "prj_1",
      annotations: [{ comment: "Keep this comment", capture }],
    });
  });

  it("exits active selection and the completed annotation session without staging", async () => {
    const registration = await loadAction();
    let observedSignal: AbortSignal | null = null;
    const inspect = vi.fn(
      async (_request: unknown, options: { signal: AbortSignal }) => {
        observedSignal = options.signal;
        return await new Promise<null>((resolve) => {
          options.signal.addEventListener("abort", () => resolve(null), {
            once: true,
          });
        });
      },
    );
    const selectingSlot = renderSlot(
      registration,
      actionProps({ experimental_inspectPage: inspect }),
      { rpc: rpcHandlers() },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Select page context" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Cancel page selection" }),
    );
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
    fireEvent.click(screen.getByRole("button", { name: "Add to prompt" }));
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
    fireEvent.click(screen.getByRole("button", { name: "Add to prompt" }));
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
