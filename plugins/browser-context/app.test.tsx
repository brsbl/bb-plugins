// @vitest-environment jsdom

import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";
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

function actionProps(
  overrides: Partial<PluginBrowserActionProps> = {},
): PluginBrowserActionProps {
  return {
    tabId: "browser:one",
    threadId: "thr_1",
    projectId: "prj_1",
    url: capture.page.url,
    experimental_inspectionAvailable: true,
    experimental_inspectPage: vi.fn(async () => capture),
    experimental_setOverlayOpen: vi.fn(),
    ...overrides,
  };
}

describe("Browser Context action", () => {
  it("adds selected element context to the existing composer without sending", async () => {
    const registration = await loadAction();
    const props = actionProps();
    const prepareCapture = vi.fn(async () => ({
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
          path: "uploads/browser-context.json",
          name: "browser-context.json",
          mimeType: "application/json",
          sizeBytes: 512,
        },
      ],
    }));
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

    await waitFor(() => expect(prepareCapture).toHaveBeenCalledOnce());
    expect(slot.inspection.rpcCalls[0]).toEqual({
      method: "prepareCapture",
      input: {
        threadId: "thr_1",
        projectId: "prj_1",
        capture,
      },
    });
    expect(props.experimental_setOverlayOpen).not.toHaveBeenCalled();
    expect(slot.inspection.composer.mentions).toEqual([]);
    expect(slot.inspection.composer.text).toBe("Make this clearer");
    expect(slot.inspection.composer.attachmentCount).toBe(2);
    expect(slot.inspection.composer.attachments.map(({ type }) => type)).toEqual(
      ["localImage", "localFile"],
    );
    expect(slot.inspection.composer.focusCount).toBe(1);

    await slot.behavior.setComposerText("Make this clearer and more compact");
    expect(slot.inspection.composer.text).toBe(
      "Make this clearer and more compact",
    );
    expect(slot.inspection.composer.attachmentCount).toBe(2);
  });

  it("reports a staging error without mutating or sending the composer", async () => {
    const registration = await loadAction();
    const props = actionProps();
    const slot = renderSlot(registration, props, {
      rpc: {
        prepareCapture: async () => {
          throw new Error("Thread is temporarily unavailable");
        },
      },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Select page context" }),
    );
    expect((await screen.findByRole("status")).textContent).toContain(
      "Thread is temporarily unavailable",
    );
    expect(slot.inspection.composer.mentions).toHaveLength(0);
    expect(slot.inspection.composer.attachmentCount).toBe(0);
  });

  it("does not stage a capture after the Browser action unmounts", async () => {
    const registration = await loadAction();
    let finish:
      | ((value: {
          attachments: [
            {
              type: "localImage";
              path: string;
              name: string;
              sizeBytes: number;
            },
            {
              type: "localFile";
              path: string;
              name: string;
              sizeBytes: number;
            },
          ];
        }) => void)
      | undefined;
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
    await waitFor(() => expect(finish).toBeDefined());
    slot.lifecycle.unmount();
    finish?.({
      attachments: [
        {
          type: "localImage",
          path: "uploads/stale.png",
          name: "stale.png",
          sizeBytes: 4,
        },
        {
          type: "localFile",
          path: "uploads/stale.json",
          name: "stale.json",
          sizeBytes: 512,
        },
      ],
    });
    await Promise.resolve();

    expect(slot.inspection.composer.mentions).toHaveLength(0);
    expect(slot.inspection.composer.attachmentCount).toBe(0);
  });

  it("does not stage a capture after the thread scope changes", async () => {
    const registration = await loadAction();
    let finish:
      | ((value: {
          attachments: [
            {
              type: "localImage";
              path: string;
              name: string;
              sizeBytes: number;
            },
            {
              type: "localFile";
              path: string;
              name: string;
              sizeBytes: number;
            },
          ];
        }) => void)
      | undefined;
    const props = actionProps();
    const slot = renderSlot(registration, props, {
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
    await waitFor(() => expect(finish).toBeDefined());
    slot.lifecycle.rerender(
      createElement(registration.component, {
        ...props,
        threadId: "thr_2",
      }),
    );
    finish?.({
      attachments: [
        {
          type: "localImage",
          path: "uploads/stale.png",
          name: "stale.png",
          sizeBytes: 4,
        },
        {
          type: "localFile",
          path: "uploads/stale.json",
          name: "stale.json",
          sizeBytes: 512,
        },
      ],
    });
    await Promise.resolve();

    expect(slot.inspection.composer.attachmentCount).toBe(0);
  });

  it("adds marked region context to the same composer", async () => {
    const registration = await loadAction();
    const props = actionProps({
      experimental_inspectPage: vi.fn(async () => regionCapture),
    });
    const slot = renderSlot(registration, props, {
      rpc: {
        prepareCapture: async () => ({
          attachments: [
            {
              type: "localImage" as const,
              path: "uploads/region.png",
              name: "region.png",
              mimeType: "image/png",
              sizeBytes: 4,
            },
            {
              type: "localFile" as const,
              path: "uploads/region.json",
              name: "region.json",
              mimeType: "application/json",
              sizeBytes: 512,
            },
          ],
        }),
      },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Select page context" }),
    );

    await waitFor(() =>
      expect(slot.inspection.composer.attachmentCount).toBe(2),
    );
    expect(props.experimental_inspectPage).toHaveBeenCalledWith(
      { kind: "auto" },
      { signal: expect.any(AbortSignal) },
    );
    expect(slot.inspection.composer.mentions).toEqual([]);
    expect(slot.inspection.composer.focusCount).toBe(1);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("aborts an active selection and disables unsupported or unscoped hosts", async () => {
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
    const slot = renderSlot(
      registration,
      actionProps({ experimental_inspectPage: inspect }),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Select page context" }),
    );
    expect(
      screen
        .getByRole("button", { name: "Cancel page selection" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    fireEvent.click(
      screen.getByRole("button", { name: "Cancel page selection" }),
    );
    await waitFor(() => expect(observedSignal?.aborted).toBe(true));

    slot.lifecycle.unmount();
    renderSlot(
      registration,
      actionProps({ experimental_inspectionAvailable: false }),
    );
    const unsupported = screen.getByRole("button", {
      name: "Select page context",
    });
    expect((unsupported as HTMLButtonElement).disabled).toBe(true);
    expect(unsupported.getAttribute("title")).toBe(
      "Browser page inspection requires a newer BB desktop app.",
    );
  });
});
