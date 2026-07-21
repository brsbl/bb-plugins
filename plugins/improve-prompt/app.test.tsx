// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  screen,
  waitFor,
} from "@testing-library/react";
import type { PluginComposerScope } from "@bb/plugin-sdk";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { StrictMode, type ComponentType } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import {
  loadPluginApp,
  renderSlot,
  type PluginRpcTestHandlers,
  type RenderedSlot,
} from "@bb/plugin-sdk/testing/app";

import type { rpcContract } from "./server";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}));

const REQUEST_ID = "00000000-0000-4000-8000-000000000001";

interface Deferred<T> {
  promise: Promise<T>;
  resolve(value: T): void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

async function loadAction() {
  const captured = await loadPluginApp(() => import("./app"));
  const { resetLocallyStartingRequestsForTest } = await import("./app");
  resetLocallyStartingRequestsForTest();
  const customization = captured.composerCustomizations.find(
    ({ id }) => id === "improve-prompt",
  );
  const component = customization?.actions?.find(
    ({ id }) => id === "improve",
  )?.component;
  if (component === undefined)
    throw new Error("Improve Prompt action was not registered");
  return component;
}

interface ActionHarnessOptions {
  text: string;
  scope: PluginComposerScope;
  attachmentCount?: number;
  rpc: PluginRpcTestHandlers<typeof rpcContract>;
}

let actionOptions: ActionHarnessOptions;
let actionSlot: RenderedSlot;

function configureAction(options: ActionHarnessOptions): void {
  actionOptions = options;
}

function mountAction(Action: ComponentType, strictMode = false): RenderedSlot {
  const component = strictMode
    ? () => (
        <StrictMode>
          <Action />
        </StrictMode>
      )
    : Action;
  actionSlot = renderSlot(
    { component },
    {},
    {
      context: {
        projectId:
          "projectId" in actionOptions.scope
            ? actionOptions.scope.projectId
            : "proj_1",
        threadId:
          actionOptions.scope.kind === "thread" ||
          actionOptions.scope.kind === "queued-message"
            ? actionOptions.scope.threadId
            : actionOptions.scope.kind === "side-chat"
              ? actionOptions.scope.childThreadId
              : null,
      },
      composer: {
        text: actionOptions.text,
        scope: actionOptions.scope,
        attachmentCount: actionOptions.attachmentCount,
      },
      rpc: actionOptions.rpc,
    },
  );
  return actionSlot;
}

async function driveComposerText(text: string): Promise<void> {
  actionOptions.text = text;
  await actionSlot.behavior.setComposerText(text);
}

async function driveComposerScope(scope: PluginComposerScope): Promise<void> {
  actionOptions.scope = scope;
  await actionSlot.behavior.setComposerScope(scope);
}

beforeEach(() => {
  window.sessionStorage.clear();
  vi.clearAllMocks();
  vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(REQUEST_ID);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Improve Prompt composer action", () => {
  it("enhances the active queued-message draft and preserves its attachments for manual save", async () => {
    configureAction({
      text: "queued rough draft",
      attachmentCount: 1,
      scope: {
        kind: "queued-message",
        threadId: "thr_source",
        queuedMessageId: "qmsg_1",
      },
      rpc: {
        startEnhancement: () => ({
          requestId: REQUEST_ID,
          helperThreadId: "thr_helper",
        }),
        getEnhancement: () => ({
          requestId: REQUEST_ID,
          helperThreadId: "thr_helper",
          status: "complete",
          enhancedPrompt: "Improved queued draft.",
          assumptions: null,
          createdAt: 1,
          completedAt: 2,
        }),
      },
    });
    const Action = await loadAction();
    mountAction(Action);

    const improveButton = screen.getByRole("button", {
      name: "Improve prompt",
    });
    expect(document.querySelector("style")).toBeNull();
    const builtCss = await readFile(resolve("dist/app.css"), "utf8");
    expect(builtCss).toContain(".bb-improve-prompt-shimmer");
    expect(builtCss).toContain('[data-bb-plugin-decoration="prompt-shaper"]');
    expect((improveButton as HTMLButtonElement).disabled).toBe(false);
    expect(fireEvent.mouseDown(improveButton)).toBe(false);
    fireEvent.click(improveButton);

    await waitFor(() => {
      expect(actionSlot.inspection.composer.text).toBe("Improved queued draft.");
      expect(actionSlot.inspection.composer.textEffect).toBeNull();
      expect(
        screen.getByRole("button", { name: "Undo prompt" }),
      ).not.toBeNull();
    });
    expect(actionSlot.inspection.composer.attachmentCount).toBe(1);
    expect(actionSlot.inspection.rpcCalls).toHaveLength(2);
    expect(actionSlot.inspection.composer.focusCount).toBe(1);
    expect(toast.success).not.toHaveBeenCalled();
  }, 60_000);

  it("enhances and undoes a side-chat draft without losing its attachments", async () => {
    configureAction({
      text: "rough side-chat draft",
      attachmentCount: 1,
      scope: {
        kind: "side-chat",
        projectId: "proj_1",
        parentThreadId: "thr_parent",
        tabId: "side-chat:one",
        childThreadId: null,
      },
      rpc: {
        startEnhancement: () => ({
          requestId: REQUEST_ID,
          helperThreadId: "thr_helper",
        }),
        getEnhancement: () => ({
          requestId: REQUEST_ID,
          helperThreadId: "thr_helper",
          status: "complete",
          enhancedPrompt: "Improved side-chat draft.",
          assumptions: null,
          createdAt: 1,
          completedAt: 2,
        }),
      },
    });
    const Action = await loadAction();
    mountAction(Action);

    fireEvent.click(screen.getByRole("button", { name: "Improve prompt" }));

    await waitFor(() => {
      expect(actionSlot.inspection.composer.text).toBe("Improved side-chat draft.");
      expect(
        screen.getByRole("button", { name: "Undo prompt" }),
      ).not.toBeNull();
    });
    expect(actionSlot.inspection.composer.attachmentCount).toBe(1);

    fireEvent.click(screen.getByRole("button", { name: "Undo prompt" }));
    expect(actionSlot.inspection.composer.text).toBe("rough side-chat draft");
    expect(actionSlot.inspection.composer.attachmentCount).toBe(1);
    expect(actionSlot.inspection.composer.focusCount).toBe(2);
  });

  it("keeps a durable request after the first result fetch fails and retries on realtime", async () => {
    let getCalls = 0;
    configureAction({
      text: "rough draft",
      scope: { kind: "thread", threadId: "thr_source" },
      rpc: {
        startEnhancement: () => ({
          requestId: REQUEST_ID,
          helperThreadId: "thr_helper",
        }),
        getEnhancement: () => {
          getCalls += 1;
          if (getCalls === 1) throw new Error("temporary transport failure");
          return {
            requestId: REQUEST_ID,
            helperThreadId: "thr_helper",
            status: "complete" as const,
            enhancedPrompt: "Improved after retry.",
            assumptions: null,
            createdAt: 1,
            completedAt: 2,
          };
        },
      },
    });
    const Action = await loadAction();
    mountAction(Action);

    fireEvent.click(screen.getByRole("button", { name: "Improve prompt" }));

    await waitFor(() => {
      expect(getCalls).toBe(1);
      expect(window.sessionStorage.length).toBe(1);
      expect(actionSlot.inspection.composer.textEffect).toEqual({
        className: "bb-improve-prompt-shimmer",
      });
      expect(actionSlot.inspection.composer.inputLocked).toBe(true);
      expect(
        screen.getByRole("button", { name: "Cancel prompt improvement" }),
      ).not.toBeNull();
    });

    await actionSlot.behavior.emitRealtime("enhancement-changed", {
      requestId: REQUEST_ID,
    });

    await waitFor(() => {
      expect(getCalls).toBe(2);
      expect(actionSlot.inspection.composer.text).toBe("Improved after retry.");
      expect(actionSlot.inspection.composer.textEffect).toBeNull();
      expect(actionSlot.inspection.composer.inputLocked).toBe(false);
      expect(window.sessionStorage.length).toBe(0);
    });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("expires a recovered startup marker that the server never acknowledged", async () => {
    window.sessionStorage.setItem(
      "bb-plugin-prompt-shaper:pending:thread:thr_source",
      JSON.stringify({
        createdAt: Date.now() - 60_000,
        requestId: REQUEST_ID,
        scopeKey: "thread:thr_source",
        startup: "starting",
      }),
    );
    configureAction({
      text: "rough draft",
      scope: { kind: "thread", threadId: "thr_source" },
      rpc: {
        getEnhancement: () => null,
      },
    });
    const Action = await loadAction();
    mountAction(Action);

    await waitFor(() => {
      expect(window.sessionStorage.length).toBe(0);
      expect(
        screen.getByRole("button", { name: "Improve prompt" }),
      ).not.toBeNull();
      expect(actionSlot.inspection.composer.textEffect).toBeNull();
    });
  });

  it("keeps a locally starting request past the grace period and an ordinary remount", async () => {
    const start = deferred<void>();
    let startupAcknowledged = false;
    const now = Date.now();
    const dateNow = vi.spyOn(Date, "now").mockReturnValue(now);
    configureAction({
      text: "rough draft",
      scope: { kind: "thread", threadId: "thr_source" },
      rpc: {
        startEnhancement: async () => {
          await start.promise;
          startupAcknowledged = true;
          return { requestId: REQUEST_ID, helperThreadId: "thr_helper" };
        },
        getEnhancement: () =>
          startupAcknowledged
            ? {
                requestId: REQUEST_ID,
                helperThreadId: "thr_helper",
                status: "complete" as const,
                enhancedPrompt: "Improved after a slow startup.",
                assumptions: null,
                createdAt: 1,
                completedAt: 2,
              }
            : null,
      },
    });
    const Action = await loadAction();
    const view = mountAction(Action);

    fireEvent.click(screen.getByRole("button", { name: "Improve prompt" }));
    await waitFor(() => expect(window.sessionStorage.length).toBe(1));

    view.lifecycle.unmount();
    mountAction(Action);
    await screen.findByRole("button", { name: "Cancel prompt improvement" });

    dateNow.mockReturnValue(now + 31_000);
    await actionSlot.behavior.emitRealtime("enhancement-changed", {
      requestId: REQUEST_ID,
    });
    await waitFor(() => {
      expect(window.sessionStorage.length).toBe(1);
      expect(
        screen.getByRole("button", { name: "Cancel prompt improvement" }),
      ).not.toBeNull();
    });

    await act(async () => {
      start.resolve();
      await start.promise;
      await Promise.resolve();
      await actionSlot.behavior.emitRealtime("enhancement-changed", {
        requestId: REQUEST_ID,
      });
    });
    await waitFor(() => {
      expect(actionSlot.inspection.composer.text).toBe(
        "Improved after a slow startup.",
      );
      expect(window.sessionStorage.length).toBe(0);
    });
  });

  it("keeps startup durable when cancellation transport fails before acknowledgement", async () => {
    const start = deferred<void>();
    let startupAcknowledged = false;
    const cancelEnhancement = vi.fn(() => {
      throw new Error("cancel transport rejected during startup");
    });
    configureAction({
      text: "keep this slow-starting draft",
      scope: { kind: "thread", threadId: "thr_source" },
      rpc: {
        startEnhancement: async () => {
          await start.promise;
          startupAcknowledged = true;
          return { requestId: REQUEST_ID, helperThreadId: "thr_helper" };
        },
        getEnhancement: () =>
          startupAcknowledged
            ? {
                requestId: REQUEST_ID,
                helperThreadId: "thr_helper",
                status: "running" as const,
                createdAt: 1,
              }
            : null,
        cancelEnhancement,
      },
    });
    const Action = await loadAction();
    mountAction(Action);

    fireEvent.click(screen.getByRole("button", { name: "Improve prompt" }));
    const cancelButton = await screen.findByRole("button", {
      name: "Cancel prompt improvement",
    });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(cancelEnhancement).toHaveBeenCalledWith({ requestId: REQUEST_ID });
      expect(window.sessionStorage.length).toBe(1);
      expect(actionSlot.inspection.composer.textEffect).toEqual({
        className: "bb-improve-prompt-shimmer",
      });
      expect(toast.error).toHaveBeenCalledWith(
        "cancel transport rejected during startup",
      );
    });

    await act(async () => {
      start.resolve();
      await start.promise;
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(window.sessionStorage.length).toBe(1);
      expect(
        screen.getByRole("button", { name: "Cancel prompt improvement" }),
      ).not.toBeNull();
    });
  });

  it.each([
    {
      name: "side-chat tab",
      sourceScope: {
        kind: "side-chat" as const,
        projectId: "proj_1",
        parentThreadId: "thr_parent",
        tabId: "side-chat:one",
        childThreadId: "thr_child_one",
      },
      destinationScope: {
        kind: "side-chat" as const,
        projectId: "proj_1",
        parentThreadId: "thr_parent",
        tabId: "side-chat:two",
        childThreadId: "thr_child_two",
      },
    },
    {
      name: "queued message",
      sourceScope: {
        kind: "queued-message" as const,
        threadId: "thr_source",
        queuedMessageId: "qmsg_1",
      },
      destinationScope: {
        kind: "queued-message" as const,
        threadId: "thr_source",
        queuedMessageId: "qmsg_2",
      },
    },
    {
      name: "new-thread project",
      sourceScope: {
        kind: "new-thread" as const,
        projectId: "proj_1",
      },
      destinationScope: {
        kind: "new-thread" as const,
        projectId: "proj_2",
      },
    },
  ])(
    "cancels a pending request across a keyed $name unmount/remount",
    async ({ sourceScope, destinationScope }) => {
      const result = deferred<{
        requestId: string;
        helperThreadId: string;
        status: "complete";
        enhancedPrompt: string;
        assumptions: null;
        createdAt: number;
        completedAt: number;
      }>();
      const cancelEnhancement = vi.fn(() => ({ cancelled: true as const }));
      configureAction({
        text: "source draft",
        scope: sourceScope,
        rpc: {
          startEnhancement: () => ({
            requestId: REQUEST_ID,
            helperThreadId: "thr_helper",
          }),
          getEnhancement: () => result.promise,
          cancelEnhancement,
        },
      });
      const Action = await loadAction();
      const source = mountAction(Action);

      fireEvent.click(screen.getByRole("button", { name: "Improve prompt" }));
      await waitFor(() => {
        expect(actionSlot.inspection.composer.textEffect).toEqual({
          className: "bb-improve-prompt-shimmer",
        });
        expect(window.sessionStorage.length).toBe(1);
      });

      source.lifecycle.unmount();
      await driveComposerScope(destinationScope);
      await driveComposerText("destination draft");
      mountAction(Action);

      await waitFor(() => {
        expect(cancelEnhancement).toHaveBeenCalledWith({
          requestId: REQUEST_ID,
        });
        expect(actionSlot.inspection.composer.textEffect).toBeNull();
        expect(actionSlot.inspection.composer.inputLocked).toBe(false);
        expect(actionSlot.inspection.composer.threadRowStatus).toBeNull();
        expect(window.sessionStorage.length).toBe(0);
        expect(
          screen.getByRole("button", { name: "Improve prompt" }),
        ).not.toBeNull();
      });

      await act(async () => {
        result.resolve({
          requestId: REQUEST_ID,
          helperThreadId: "thr_helper",
          status: "complete",
          enhancedPrompt: "Late result for the source scope.",
          assumptions: null,
          createdAt: 1,
          completedAt: 2,
        });
        await result.promise;
      });

      expect(actionSlot.inspection.composer.text).toBe("destination draft");
      expect(screen.queryByRole("button", { name: "Undo prompt" })).toBeNull();
      expect(window.sessionStorage.length).toBe(0);
      expect(
        screen.queryByRole("button", {
          name: "Cancel prompt improvement",
        }),
      ).toBeNull();
    },
  );

  it("replaces the latest edited draft and restores it through inline Undo", async () => {
    const result = deferred<{
      requestId: string;
      helperThreadId: string;
      status: "complete";
      enhancedPrompt: string;
      assumptions: string;
      createdAt: number;
      completedAt: number;
    }>();
    configureAction({
      text: "rough draft",
      attachmentCount: 1,
      scope: { kind: "thread", threadId: "thr_source" },
      rpc: {
        startEnhancement: () => ({
          requestId: REQUEST_ID,
          helperThreadId: "thr_helper",
        }),
        getEnhancement: () => result.promise,
      },
    });
    const Action = await loadAction();
    mountAction(Action);

    fireEvent.click(screen.getByRole("button", { name: "Improve prompt" }));
    await waitFor(() => {
      expect(actionSlot.inspection.composer.textEffect).toEqual({
        className: "bb-improve-prompt-shimmer",
      });
      expect(actionSlot.inspection.composer.threadRowStatus).toEqual({
        icon: "AiContentGenerator01",
        label: "Improve Prompt is improving the draft",
        tone: "success",
      });
    });

    await driveComposerText("edited while enhancement was running");
    await act(async () => {
      result.resolve({
        requestId: REQUEST_ID,
        helperThreadId: "thr_helper",
        status: "complete",
        enhancedPrompt: "Enhanced prompt with the missing guardrail.",
        assumptions: "Assume the target is the current branch.",
        createdAt: 1,
        completedAt: 2,
      });
      await result.promise;
    });

    await waitFor(() => {
      expect(actionSlot.inspection.composer.text).toBe(
        "Enhanced prompt with the missing guardrail.",
      );
      expect(actionSlot.inspection.composer.textEffect).toBeNull();
      expect(actionSlot.inspection.composer.threadRowStatus).toBeNull();
    });
    expect(actionSlot.inspection.composer.attachmentCount).toBe(1);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(toast.success).not.toHaveBeenCalled();

    const undoButton = screen.getByRole("button", {
      name: "Undo prompt",
    });
    expect(screen.queryByRole("button", { name: "Improve prompt" })).toBeNull();
    expect(
      undoButton
        .closest("[data-prompt-shaper-actions]")
        ?.querySelectorAll("button"),
    ).toHaveLength(1);
    expect(
      undoButton.querySelector('[data-icon="AiContentGenerator01"]'),
    ).not.toBeNull();
    expect(
      undoButton.querySelector('[data-icon="ArrowTurnBackward"]'),
    ).not.toBeNull();
    fireEvent.focus(undoButton);
    expect((await screen.findAllByText("Undo prompt")).length).toBeGreaterThan(
      0,
    );
    fireEvent.click(undoButton);

    expect(actionSlot.inspection.composer.text).toBe(
      "edited while enhancement was running",
    );
    expect(actionSlot.inspection.composer.attachmentCount).toBe(1);
    expect(actionSlot.inspection.composer.focusCount).toBe(2);
    const improveButton = screen.getByRole("button", {
      name: "Improve prompt",
    });
    expect(
      improveButton.querySelector('[data-icon="AiContentGenerator01"]'),
    ).not.toBeNull();
  });

  it("keeps a thread enhancement running while navigating away and back", async () => {
    const result = deferred<{
      requestId: string;
      helperThreadId: string;
      status: "complete";
      enhancedPrompt: string;
      assumptions: null;
      createdAt: number;
      completedAt: number;
    }>();
    const cancelEnhancement = vi.fn(() => ({ cancelled: true as const }));
    configureAction({
      text: "rough source draft",
      attachmentCount: 1,
      scope: { kind: "thread", threadId: "thr_source" },
      rpc: {
        startEnhancement: () => ({
          requestId: REQUEST_ID,
          helperThreadId: "thr_helper",
        }),
        getEnhancement: () => result.promise,
        cancelEnhancement,
      },
    });
    const Action = await loadAction();
    const source = mountAction(Action);

    fireEvent.click(screen.getByRole("button", { name: "Improve prompt" }));
    await waitFor(() => {
      expect(actionSlot.inspection.composer.textEffect).toEqual({
        className: "bb-improve-prompt-shimmer",
      });
      expect(window.sessionStorage.length).toBe(1);
    });

    source.lifecycle.unmount();
    await driveComposerScope({ kind: "thread", threadId: "thr_other" });
    await driveComposerText("other thread draft");
    const destination = mountAction(Action);
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Improve prompt" }),
      ).not.toBeNull();
      expect(actionSlot.inspection.composer.textEffect).toBeNull();
      expect(actionSlot.inspection.composer.threadRowStatus).toBeNull();
    });
    expect(cancelEnhancement).not.toHaveBeenCalled();
    expect(window.sessionStorage.length).toBe(1);

    destination.lifecycle.unmount();
    await driveComposerScope({ kind: "thread", threadId: "thr_source" });
    await driveComposerText("rough source draft");
    mountAction(Action);
    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: "Cancel prompt improvement",
        }),
      ).not.toBeNull();
      expect(actionSlot.inspection.composer.textEffect).toEqual({
        className: "bb-improve-prompt-shimmer",
      });
    });
    expect(cancelEnhancement).not.toHaveBeenCalled();

    await act(async () => {
      result.resolve({
        requestId: REQUEST_ID,
        helperThreadId: "thr_helper",
        status: "complete",
        enhancedPrompt: "Enhanced after thread navigation.",
        assumptions: null,
        createdAt: 1,
        completedAt: 2,
      });
      await result.promise;
    });

    await waitFor(() => {
      expect(actionSlot.inspection.composer.text).toBe(
        "Enhanced after thread navigation.",
      );
      expect(window.sessionStorage.length).toBe(0);
    });
    expect(actionSlot.inspection.composer.attachmentCount).toBe(1);
  });

  it("preserves a completion that races with thread navigation", async () => {
    const result = deferred<{
      requestId: string;
      helperThreadId: string;
      status: "complete";
      enhancedPrompt: string;
      assumptions: null;
      createdAt: number;
      completedAt: number;
    }>();
    configureAction({
      text: "rough source draft",
      scope: { kind: "thread", threadId: "thr_source" },
      rpc: {
        startEnhancement: () => ({
          requestId: REQUEST_ID,
          helperThreadId: "thr_helper",
        }),
        getEnhancement: () => result.promise,
        cancelEnhancement: () => ({ cancelled: true as const }),
      },
    });
    const Action = await loadAction();
    const source = mountAction(Action);

    fireEvent.click(screen.getByRole("button", { name: "Improve prompt" }));
    await waitFor(() => expect(window.sessionStorage.length).toBe(1));

    source.lifecycle.unmount();
    await driveComposerScope({ kind: "thread", threadId: "thr_other" });
    await driveComposerText("other thread draft");
    const destination = mountAction(Action);
    await act(async () => {
      result.resolve({
        requestId: REQUEST_ID,
        helperThreadId: "thr_helper",
        status: "complete",
        enhancedPrompt: "Enhanced while navigating.",
        assumptions: null,
        createdAt: 1,
        completedAt: 2,
      });
      await result.promise;
    });

    expect(actionSlot.inspection.composer.text).toBe("other thread draft");
    expect(window.sessionStorage.length).toBe(1);

    destination.lifecycle.unmount();
    await driveComposerScope({ kind: "thread", threadId: "thr_source" });
    await driveComposerText("rough source draft");
    mountAction(Action);

    await waitFor(() => {
      expect(actionSlot.inspection.composer.text).toBe("Enhanced while navigating.");
      expect(window.sessionStorage.length).toBe(0);
    });
  });

  it("invalidates inline Undo after the enhanced draft is edited or sent", async () => {
    configureAction({
      text: "rough draft",
      scope: { kind: "thread", threadId: "thr_source" },
      rpc: {
        startEnhancement: () => ({
          requestId: REQUEST_ID,
          helperThreadId: "thr_helper",
        }),
        getEnhancement: () => ({
          requestId: REQUEST_ID,
          helperThreadId: "thr_helper",
          status: "complete",
          enhancedPrompt: "Enhanced prompt.",
          assumptions: null,
          createdAt: 1,
          completedAt: 2,
        }),
      },
    });
    const Action = await loadAction();
    mountAction(Action);

    fireEvent.click(screen.getByRole("button", { name: "Improve prompt" }));
    await screen.findByRole("button", { name: "Undo prompt" });

    await driveComposerText("Edited enhanced prompt.");
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Undo prompt" })).toBeNull();
      expect(
        screen.getByRole("button", { name: "Improve prompt" }),
      ).not.toBeNull();
    });

    await driveComposerText("Enhanced prompt.");
    expect(screen.queryByRole("button", { name: "Undo prompt" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Improve prompt" }));
    await screen.findByRole("button", { name: "Undo prompt" });
    await driveComposerText("");

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Undo prompt" })).toBeNull();
      expect(
        (
          screen.getByRole("button", {
            name: "Improve prompt",
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(true);
    });
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("clears inline Undo when the composer scope changes or the action unmounts", async () => {
    configureAction({
      text: "rough draft",
      scope: { kind: "thread", threadId: "thr_source" },
      rpc: {
        startEnhancement: () => ({
          requestId: REQUEST_ID,
          helperThreadId: "thr_helper",
        }),
        getEnhancement: () => ({
          requestId: REQUEST_ID,
          helperThreadId: "thr_helper",
          status: "complete",
          enhancedPrompt: "Enhanced prompt.",
          assumptions: null,
          createdAt: 1,
          completedAt: 2,
        }),
      },
    });
    const Action = await loadAction();
    const view = mountAction(Action);

    fireEvent.click(screen.getByRole("button", { name: "Improve prompt" }));
    await screen.findByRole("button", { name: "Undo prompt" });
    await driveComposerScope({ kind: "thread", threadId: "thr_next" });

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Undo prompt" })).toBeNull();
    });
    view.lifecycle.unmount();

    mountAction(Action);
    expect(screen.queryByRole("button", { name: "Undo prompt" })).toBeNull();
  });

  it("cancels the helper, clears loading state, and ignores a late result without changing the draft", async () => {
    const result = deferred<{
      requestId: string;
      helperThreadId: string;
      status: "complete";
      enhancedPrompt: string;
      assumptions: null;
      createdAt: number;
      completedAt: number;
    }>();
    const cancelEnhancement = vi.fn(() => ({ cancelled: true as const }));
    configureAction({
      text: "keep this draft",
      attachmentCount: 1,
      scope: { kind: "thread", threadId: "thr_source" },
      rpc: {
        startEnhancement: () => ({
          requestId: REQUEST_ID,
          helperThreadId: "thr_helper",
        }),
        getEnhancement: () => result.promise,
        cancelEnhancement,
      },
    });
    const Action = await loadAction();
    mountAction(Action);

    fireEvent.click(screen.getByRole("button", { name: "Improve prompt" }));
    await waitFor(() => {
      const cancelButton = screen.getByRole("button", {
        name: "Cancel prompt improvement",
      });
      expect(cancelButton.getAttribute("aria-busy")).toBe("true");
      expect(actionSlot.inspection.composer.inputLocked).toBe(true);
      expect(cancelButton.classList.contains("text-success")).toBe(true);
      const icon = cancelButton.querySelector(
        '[data-icon="AiContentGenerator01"]',
      );
      expect(icon).not.toBeNull();
      expect(icon?.classList.contains("animate-shine-icon")).toBe(true);
      expect(
        icon?.parentElement?.classList.contains("motion-safe:animate-pulse"),
      ).toBe(true);
      expect(actionSlot.inspection.composer.threadRowStatus).not.toBeNull();
      expect(
        actionSlot.inspection.rpcCalls.map((call) => call.method),
      ).toContain("getEnhancement");
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Cancel prompt improvement" }),
    );

    await waitFor(() => {
      expect(cancelEnhancement).toHaveBeenCalledWith({
        requestId: REQUEST_ID,
      });
      expect(actionSlot.inspection.composer.textEffect).toBeNull();
      expect(actionSlot.inspection.composer.inputLocked).toBe(false);
      expect(actionSlot.inspection.composer.threadRowStatus).toBeNull();
      expect(window.sessionStorage.length).toBe(0);
    });
    expect(actionSlot.inspection.composer.text).toBe("keep this draft");
    expect(actionSlot.inspection.composer.attachmentCount).toBe(1);
    expect(screen.queryByRole("button", { name: "Undo prompt" })).toBeNull();

    await act(async () => {
      result.resolve({
        requestId: REQUEST_ID,
        helperThreadId: "thr_helper",
        status: "complete",
        enhancedPrompt: "late enhanced prompt",
        assumptions: null,
        createdAt: 1,
        completedAt: 2,
      });
      await result.promise;
    });

    expect(actionSlot.inspection.composer.text).toBe("keep this draft");
    expect(actionSlot.inspection.composer.attachmentCount).toBe(1);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("keeps running work visible when cancellation is rejected", async () => {
    let getCalls = 0;
    const cancelEnhancement = vi.fn(() => {
      throw new Error("cancel transport rejected");
    });
    configureAction({
      text: "keep improving this draft",
      scope: { kind: "thread", threadId: "thr_source" },
      rpc: {
        startEnhancement: () => ({
          requestId: REQUEST_ID,
          helperThreadId: "thr_helper",
        }),
        getEnhancement: () => {
          getCalls += 1;
          return {
            requestId: REQUEST_ID,
            helperThreadId: "thr_helper",
            status: "running" as const,
            createdAt: 1,
          };
        },
        cancelEnhancement,
      },
    });
    const Action = await loadAction();
    mountAction(Action);

    fireEvent.click(screen.getByRole("button", { name: "Improve prompt" }));
    await waitFor(() => expect(getCalls).toBe(1));

    fireEvent.click(
      screen.getByRole("button", { name: "Cancel prompt improvement" }),
    );

    await waitFor(() => {
      expect(cancelEnhancement).toHaveBeenCalledWith({ requestId: REQUEST_ID });
      expect(getCalls).toBe(2);
      expect(window.sessionStorage.length).toBe(1);
      expect(actionSlot.inspection.composer.textEffect).toEqual({
        className: "bb-improve-prompt-shimmer",
      });
      expect(actionSlot.inspection.composer.threadRowStatus).not.toBeNull();
      expect(
        screen.getByRole("button", { name: "Cancel prompt improvement" }),
      ).not.toBeNull();
      expect(toast.error).toHaveBeenCalledWith("cancel transport rejected");
    });
    expect(actionSlot.inspection.composer.text).toBe("keep improving this draft");
  });

  it("clears local cancellation state when the cancel response is lost but the request is absent", async () => {
    let getCalls = 0;
    const cancelEnhancement = vi.fn(() => {
      throw new Error("cancel response lost");
    });
    configureAction({
      text: "keep this draft",
      scope: { kind: "thread", threadId: "thr_source" },
      rpc: {
        startEnhancement: () => ({
          requestId: REQUEST_ID,
          helperThreadId: "thr_helper",
        }),
        getEnhancement: () => {
          getCalls += 1;
          return getCalls === 1
            ? {
                requestId: REQUEST_ID,
                helperThreadId: "thr_helper",
                status: "running" as const,
                createdAt: 1,
              }
            : null;
        },
        cancelEnhancement,
      },
    });
    const Action = await loadAction();
    mountAction(Action);

    fireEvent.click(screen.getByRole("button", { name: "Improve prompt" }));
    await waitFor(() => expect(getCalls).toBe(1));

    fireEvent.click(
      screen.getByRole("button", { name: "Cancel prompt improvement" }),
    );

    await waitFor(() => {
      expect(cancelEnhancement).toHaveBeenCalledWith({ requestId: REQUEST_ID });
      expect(getCalls).toBe(2);
      expect(window.sessionStorage.length).toBe(0);
      expect(actionSlot.inspection.composer.textEffect).toBeNull();
      expect(actionSlot.inspection.composer.threadRowStatus).toBeNull();
      expect(
        screen.getByRole("button", { name: "Improve prompt" }),
      ).not.toBeNull();
    });
    expect(actionSlot.inspection.composer.text).toBe("keep this draft");
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("consumes a terminal result when cancellation fails after the helper finishes", async () => {
    let getCalls = 0;
    const cancelEnhancement = vi.fn(() => {
      throw new Error("cancel raced with completion");
    });
    configureAction({
      text: "rough draft",
      scope: { kind: "thread", threadId: "thr_source" },
      rpc: {
        startEnhancement: () => ({
          requestId: REQUEST_ID,
          helperThreadId: "thr_helper",
        }),
        getEnhancement: () => {
          getCalls += 1;
          return getCalls === 1
            ? {
                requestId: REQUEST_ID,
                helperThreadId: "thr_helper",
                status: "running" as const,
                createdAt: 1,
              }
            : {
                requestId: REQUEST_ID,
                helperThreadId: "thr_helper",
                status: "complete" as const,
                enhancedPrompt: "Improved just before cancellation.",
                assumptions: null,
                createdAt: 1,
                completedAt: 2,
              };
        },
        cancelEnhancement,
      },
    });
    const Action = await loadAction();
    mountAction(Action);

    fireEvent.click(screen.getByRole("button", { name: "Improve prompt" }));
    await waitFor(() => expect(getCalls).toBe(1));

    fireEvent.click(
      screen.getByRole("button", { name: "Cancel prompt improvement" }),
    );

    await waitFor(() => {
      expect(getCalls).toBe(2);
      expect(actionSlot.inspection.composer.text).toBe(
        "Improved just before cancellation.",
      );
      expect(window.sessionStorage.length).toBe(0);
      expect(actionSlot.inspection.composer.textEffect).toBeNull();
      expect(
        screen.getByRole("button", { name: "Undo prompt" }),
      ).not.toBeNull();
    });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("reveals the cancel icon on hover and keyboard focus while preserving the loading icon otherwise", async () => {
    const start = deferred<never>();
    configureAction({
      text: "rough draft",
      scope: { kind: "thread", threadId: "thr_source" },
      rpc: {
        startEnhancement: () => start.promise,
        getEnhancement: () => null,
      },
    });
    const Action = await loadAction();
    mountAction(Action);

    fireEvent.click(screen.getByRole("button", { name: "Improve prompt" }));
    const cancelButton = await screen.findByRole("button", {
      name: "Cancel prompt improvement",
    });
    expect(
      cancelButton.querySelector('[data-icon="AiContentGenerator01"]'),
    ).not.toBeNull();

    fireEvent.mouseEnter(cancelButton);
    expect(cancelButton.querySelector('[data-icon="X"]')).not.toBeNull();
    expect(
      cancelButton.querySelector('[data-icon="AiContentGenerator01"]'),
    ).toBeNull();
    expect(cancelButton.classList.contains("text-success")).toBe(false);
    expect(cancelButton.classList.contains("text-muted-foreground")).toBe(true);

    fireEvent.mouseLeave(cancelButton);
    expect(
      cancelButton.querySelector('[data-icon="AiContentGenerator01"]'),
    ).not.toBeNull();
    expect(cancelButton.classList.contains("text-success")).toBe(true);

    const nativeMatches = HTMLElement.prototype.matches;
    const matches = vi
      .spyOn(cancelButton, "matches")
      .mockImplementation((selector) =>
        selector === ":focus-visible"
          ? true
          : nativeMatches.call(cancelButton, selector),
      );
    fireEvent.focus(cancelButton);
    expect(cancelButton.querySelector('[data-icon="X"]')).not.toBeNull();
    expect((await screen.findAllByText("Cancel")).length).toBeGreaterThan(0);
    fireEvent.blur(cancelButton);
    expect(
      cancelButton.querySelector('[data-icon="AiContentGenerator01"]'),
    ).not.toBeNull();
    matches.mockRestore();
  });

  it("clears loading effects when the composer scope changes", async () => {
    const start = deferred<never>();
    configureAction({
      text: "rough draft",
      scope: { kind: "thread", threadId: "thr_source" },
      rpc: {
        startEnhancement: () => start.promise,
        getEnhancement: () => null,
      },
    });
    const Action = await loadAction();
    mountAction(Action);

    fireEvent.click(screen.getByRole("button", { name: "Improve prompt" }));
    await waitFor(() => {
      expect(actionSlot.inspection.composer.textEffect).toEqual({
        className: "bb-improve-prompt-shimmer",
      });
      expect(actionSlot.inspection.composer.threadRowStatus).not.toBeNull();
    });

    await driveComposerScope({
      kind: "thread",
      threadId: "thr_next",
    });

    await waitFor(() => {
      expect(actionSlot.inspection.composer.textEffect).toBeNull();
      expect(actionSlot.inspection.composer.threadRowStatus).toBeNull();
    });
    expect(actionSlot.inspection.composer.text).toBe("rough draft");
  });

  it("clears loading effects when enhancement fails and when the action unmounts", async () => {
    const start = deferred<never>();
    configureAction({
      text: "rough draft",
      scope: { kind: "thread", threadId: "thr_source" },
      rpc: {
        startEnhancement: () => start.promise,
        getEnhancement: () => null,
      },
    });
    const Action = await loadAction();
    const view = mountAction(Action);

    fireEvent.click(screen.getByRole("button", { name: "Improve prompt" }));
    await waitFor(() => {
      expect(actionSlot.inspection.composer.textEffect).toEqual({
        className: "bb-improve-prompt-shimmer",
      });
      expect(actionSlot.inspection.composer.threadRowStatus).not.toBeNull();
    });

    view.lifecycle.unmount();
    expect(actionSlot.inspection.composer.textEffect).toBeNull();
    expect(actionSlot.inspection.composer.threadRowStatus).toBeNull();

    window.sessionStorage.clear();
    configureAction({
      text: "rough draft",
      scope: { kind: "thread", threadId: "thr_source" },
      rpc: {
        startEnhancement: () => {
          throw new Error("agent unavailable");
        },
        getEnhancement: () => null,
      },
    });
    mountAction(Action);
    fireEvent.click(screen.getByRole("button", { name: "Improve prompt" }));

    await waitFor(() => {
      expect(actionSlot.inspection.composer.textEffect).toBeNull();
      expect(actionSlot.inspection.composer.threadRowStatus).toBeNull();
      expect(toast.error).toHaveBeenCalledWith("agent unavailable");
    });
    expect(actionSlot.inspection.composer.textEffectCalls).toContainEqual({
      className: "bb-improve-prompt-shimmer",
    });
    expect(screen.queryByRole("button", { name: "Undo prompt" })).toBeNull();
  });

  it("cancels pending side-chat work when its keyed action unmounts", async () => {
    const result = deferred<{
      requestId: string;
      helperThreadId: string;
      status: "complete";
      enhancedPrompt: string;
      assumptions: null;
      createdAt: number;
      completedAt: number;
    }>();
    const cancelEnhancement = vi.fn(() => ({ cancelled: true as const }));
    configureAction({
      text: "side-chat draft before deactivation",
      attachmentCount: 1,
      scope: {
        kind: "side-chat",
        projectId: "proj_1",
        parentThreadId: "thr_parent",
        tabId: "side-chat:one",
        childThreadId: "thr_child",
      },
      rpc: {
        startEnhancement: () => ({
          requestId: REQUEST_ID,
          helperThreadId: "thr_helper",
        }),
        getEnhancement: () => result.promise,
        cancelEnhancement,
      },
    });
    const Action = await loadAction();
    const view = mountAction(Action);

    fireEvent.click(screen.getByRole("button", { name: "Improve prompt" }));
    await waitFor(() => {
      expect(actionSlot.inspection.composer.textEffect).toEqual({
        className: "bb-improve-prompt-shimmer",
      });
      expect(window.sessionStorage.length).toBe(1);
    });

    view.lifecycle.unmount();

    expect(cancelEnhancement).toHaveBeenCalledWith({ requestId: REQUEST_ID });
    expect(window.sessionStorage.length).toBe(0);
    expect(actionSlot.inspection.composer.textEffect).toBeNull();
    expect(actionSlot.inspection.composer.threadRowStatus).toBeNull();

    await act(async () => {
      result.resolve({
        requestId: REQUEST_ID,
        helperThreadId: "thr_helper",
        status: "complete",
        enhancedPrompt: "Enhanced result completed while away.",
        assumptions: null,
        createdAt: 1,
        completedAt: 2,
      });
      await result.promise;
      await Promise.resolve();
    });

    expect(actionSlot.inspection.composer.text).toBe(
      "side-chat draft before deactivation",
    );

    mountAction(Action);
    expect(actionSlot.inspection.composer.text).toBe(
      "side-chat draft before deactivation",
    );
    expect(screen.queryByRole("button", { name: "Undo prompt" })).toBeNull();
    expect(actionSlot.inspection.composer.attachmentCount).toBe(1);
  });

  it("clears a remounted pending request when helper startup fails", async () => {
    let rejectStart!: (error: Error) => void;
    const start = new Promise<never>((_resolve, reject) => {
      rejectStart = reject;
    });
    configureAction({
      text: "draft whose helper cannot start",
      scope: { kind: "thread", threadId: "thr_source" },
      rpc: {
        startEnhancement: () => start,
        getEnhancement: () => null,
      },
    });
    const Action = await loadAction();
    const view = mountAction(Action);

    fireEvent.click(screen.getByRole("button", { name: "Improve prompt" }));
    await waitFor(() => expect(window.sessionStorage.length).toBe(1));

    view.lifecycle.unmount();
    mountAction(Action);
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Cancel prompt improvement" }),
      ).not.toBeNull();
      expect(actionSlot.inspection.composer.textEffect).toEqual({
        className: "bb-improve-prompt-shimmer",
      });
    });

    await act(async () => {
      rejectStart(new Error("agent unavailable"));
      await Promise.resolve();
    });

    expect(window.sessionStorage.length).toBe(0);
    expect(actionSlot.inspection.composer.text).toBe("draft whose helper cannot start");

    await waitFor(
      () => {
        expect(
          screen.getByRole("button", { name: "Improve prompt" }),
        ).not.toBeNull();
        expect(actionSlot.inspection.composer.textEffect).toBeNull();
        expect(actionSlot.inspection.composer.threadRowStatus).toBeNull();
      },
      { timeout: 4_000 },
    );
  });

  it("keeps recovered pending work through StrictMode and a real unmount", async () => {
    const cancelEnhancement = vi.fn(() => ({ cancelled: true as const }));
    window.sessionStorage.setItem(
      "bb-plugin-prompt-shaper:pending:thread:thr_source",
      JSON.stringify({
        requestId: REQUEST_ID,
        scopeKey: "thread:thr_source",
      }),
    );
    configureAction({
      text: "recovered draft",
      scope: { kind: "thread", threadId: "thr_source" },
      rpc: {
        getEnhancement: () => ({
          requestId: REQUEST_ID,
          helperThreadId: "thr_helper",
          status: "running",
          createdAt: 1,
        }),
        cancelEnhancement,
      },
    });
    const Action = await loadAction();
    const view = mountAction(Action, true);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Cancel prompt improvement" }),
      ).not.toBeNull();
      expect(actionSlot.inspection.composer.textEffect).toEqual({
        className: "bb-improve-prompt-shimmer",
      });
      expect(window.sessionStorage.length).toBe(1);
    });
    expect(cancelEnhancement).not.toHaveBeenCalled();

    view.lifecycle.unmount();
    expect(cancelEnhancement).not.toHaveBeenCalled();
    expect(window.sessionStorage.length).toBe(1);
    expect(actionSlot.inspection.composer.textEffect).toBeNull();
    expect(actionSlot.inspection.composer.threadRowStatus).toBeNull();
  });
});
