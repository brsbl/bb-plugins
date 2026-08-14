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
  version: 1,
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
  element: null,
  region: {
    elements: [
      {
        selector: "main > section",
        tag: "section",
        id: null,
        classNames: ["settings"],
        text: "Settings",
        rect: { x: 20, y: 30, width: 420, height: 260 },
      },
    ],
  },
};

const preparedAttachments = {
  attachments: [
    {
      type: "localImage" as const,
      path: "uploads/browser-context.png",
      name: "browser-context.png",
      mimeType: "image/png",
      sizeBytes: 4,
    },
    {
      type: "localFile" as const,
      path: "uploads/browser-context.md",
      name: "browser-context.md",
      mimeType: "text/markdown",
      sizeBytes: 512,
    },
  ],
};

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
  it("reviews a clicked element with a hoverable comment before adding it to the prompt", async () => {
    const registration = await loadAction();
    const props = actionProps();
    const prepareCapture = vi.fn(async () => preparedAttachments);
    const handlers: PluginRpcTestHandlers<typeof rpcContract> = {
      prepareCapture,
    };
    const slot = renderSlot(registration, props, {
      rpc: handlers,
      composer: { text: "Make this clearer" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Select page context" }),
    );
    expect(props.experimental_inspectPage).toHaveBeenCalledWith(
      { kind: "auto" },
      { signal: expect.any(AbortSignal) },
    );

    const review = await screen.findByRole("region", {
      name: "Browser context preview",
    });
    expect(review).toBeDefined();
    expect(slot.inspection.composer.attachmentCount).toBe(0);
    expect(props.experimental_setOverlayOpen).toHaveBeenCalledWith(true);

    fireEvent.change(screen.getByLabelText("Comment"), {
      target: { value: "Make this action more prominent" },
    });
    const target = screen.getByRole("button", {
      name: "Selected element: button#save",
    });
    fireEvent.mouseEnter(target);
    expect(target.textContent).toContain("Make this action more prominent");

    fireEvent.click(screen.getByRole("button", { name: "Add to prompt" }));
    await waitFor(() => expect(prepareCapture).toHaveBeenCalledOnce());
    expect(slot.inspection.rpcCalls[0]).toEqual({
      method: "prepareCapture",
      input: {
        threadId: "thr_1",
        projectId: "prj_1",
        comment: "Make this action more prominent",
        capture,
      },
    });
    expect(slot.inspection.composer.text).toBe("Make this clearer");
    expect(slot.inspection.composer.mentions).toEqual([]);
    expect(slot.inspection.composer.attachments).toEqual(
      preparedAttachments.attachments,
    );
    expect(slot.inspection.composer.focusCount).toBe(1);
    expect(
      screen.queryByRole("region", { name: "Browser context preview" }),
    ).toBeNull();

    await slot.behavior.setComposerText("Make this clearer and more compact");
    expect(slot.inspection.composer.text).toBe(
      "Make this clearer and more compact",
    );
    expect(slot.inspection.composer.attachmentCount).toBe(2);
  });

  it("reviews a dragged region and keeps its comment associated", async () => {
    const registration = await loadAction();
    const props = actionProps({
      experimental_inspectPage: vi.fn(async () => regionCapture),
    });
    const prepareCapture = vi.fn(async () => preparedAttachments);
    const slot = renderSlot(registration, props, {
      rpc: { prepareCapture },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Select page context" }),
    );
    await screen.findByRole("button", {
      name: "Selected region: 1 elements in region",
    });
    fireEvent.change(screen.getByLabelText("Comment"), {
      target: { value: "Reduce the spacing in this group" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add to prompt" }));

    await waitFor(() => expect(prepareCapture).toHaveBeenCalledOnce());
    expect(prepareCapture).toHaveBeenCalledWith({
      threadId: "thr_1",
      projectId: "prj_1",
      comment: "Reduce the spacing in this group",
      capture: regionCapture,
    });
    expect(slot.inspection.composer.attachmentCount).toBe(2);
  });

  it("exits active selection and a completed preview without staging", async () => {
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
    const previewSlot = renderSlot(registration, previewProps);
    fireEvent.click(
      screen.getByRole("button", { name: "Select page context" }),
    );
    await screen.findByRole("region", { name: "Browser context preview" });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(previewProps.experimental_setOverlayOpen).toHaveBeenLastCalledWith(
      false,
    );
    expect(previewSlot.inspection.composer.attachmentCount).toBe(0);
  });

  it("retakes a selection from the review surface", async () => {
    const registration = await loadAction();
    const inspect = vi
      .fn<PluginBrowserActionProps["experimental_inspectPage"]>()
      .mockResolvedValueOnce(capture)
      .mockResolvedValueOnce(regionCapture);
    renderSlot(
      registration,
      actionProps({ experimental_inspectPage: inspect }),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Select page context" }),
    );
    await screen.findByRole("button", {
      name: "Selected element: button#save",
    });
    fireEvent.click(screen.getByRole("button", { name: "Retake" }));
    await screen.findByRole("button", {
      name: "Selected region: 1 elements in region",
    });
    expect(inspect).toHaveBeenCalledTimes(2);
  });

  it("does not stage a capture after the action unmounts during preparation", async () => {
    const registration = await loadAction();
    let finish: ((value: typeof preparedAttachments) => void) | undefined;
    const slot = renderSlot(registration, actionProps(), {
      rpc: {
        prepareCapture: () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Select page context" }),
    );
    await screen.findByRole("region", { name: "Browser context preview" });
    fireEvent.click(screen.getByRole("button", { name: "Add to prompt" }));
    await waitFor(() => expect(finish).toBeDefined());
    slot.lifecycle.unmount();
    finish?.(preparedAttachments);
    await Promise.resolve();

    expect(slot.inspection.composer.attachmentCount).toBe(0);
  });

  it("shows staging errors in the review and disables unsupported hosts", async () => {
    const registration = await loadAction();
    const slot = renderSlot(registration, actionProps(), {
      rpc: {
        prepareCapture: async () => {
          throw new Error("Thread is temporarily unavailable");
        },
      },
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

    renderSlot(registration, actionProps({ experimental_overlayRoot: null }));
    const unsupported = screen.getByRole("button", {
      name: "Select page context",
    });
    expect((unsupported as HTMLButtonElement).disabled).toBe(true);
    expect(unsupported.getAttribute("title")).toBe(
      "Browser annotations require a newer BB desktop app.",
    );
  });
});
