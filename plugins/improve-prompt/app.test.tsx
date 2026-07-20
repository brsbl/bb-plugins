// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { StrictMode, type ComponentType } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import {
  getTestPluginRuntime,
  resetTestPluginRuntime,
  setTestComposerScope,
  setTestComposerText,
} from "./test/plugin-sdk-app";

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
  const definition = (await import("./app")).default;
  type ActionComponent = ComponentType<{
    projectId: string | null;
    threadId: string | null;
  }>;
  let component: ActionComponent | null = null;
  definition.setup({
    slots: {
      composerAccessory(registration: { component: ActionComponent }) {
        component = registration.component;
      },
    },
  } as never);
  if (component === null)
    throw new Error("Prompt Shaper action was not registered");
  return component;
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

describe("Prompt Shaper composer action", () => {
  it("enhances the active queued-message draft and preserves its attachments for manual save", async () => {
    resetTestPluginRuntime({
      text: "queued rough draft",
      attachments: ["queued-brief.png"],
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
    render(<Action projectId="proj_1" threadId="thr_source" />);

    const improveButton = screen.getByRole("button", {
      name: "Improve prompt",
    });
    expect((improveButton as HTMLButtonElement).disabled).toBe(false);
    expect(fireEvent.mouseDown(improveButton)).toBe(false);
    fireEvent.click(improveButton);

    await waitFor(() => {
      expect(getTestPluginRuntime().text).toBe("Improved queued draft.");
      expect(getTestPluginRuntime().textEffect).toBeNull();
      expect(
        screen.getByRole("button", { name: "Undo prompt" }),
      ).not.toBeNull();
    });
    expect(getTestPluginRuntime().attachments).toEqual(["queued-brief.png"]);
    expect(getTestPluginRuntime().rpcCalls).toHaveLength(2);
    expect(getTestPluginRuntime().focusCount).toBe(1);
    expect(toast.success).not.toHaveBeenCalled();
  }, 15_000);

  it("enhances and undoes a side-chat draft without losing its attachments", async () => {
    resetTestPluginRuntime({
      text: "rough side-chat draft",
      attachments: ["side-brief.png"],
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
    render(<Action projectId="proj_1" threadId="thr_parent" />);

    fireEvent.click(screen.getByRole("button", { name: "Improve prompt" }));

    await waitFor(() => {
      expect(getTestPluginRuntime().text).toBe("Improved side-chat draft.");
      expect(
        screen.getByRole("button", { name: "Undo prompt" }),
      ).not.toBeNull();
    });
    expect(getTestPluginRuntime().attachments).toEqual(["side-brief.png"]);

    fireEvent.click(screen.getByRole("button", { name: "Undo prompt" }));
    expect(getTestPluginRuntime().text).toBe("rough side-chat draft");
    expect(getTestPluginRuntime().attachments).toEqual(["side-brief.png"]);
    expect(getTestPluginRuntime().focusCount).toBe(2);
  });

  it("invalidates and cancels a pending side-chat request when tab ownership changes", async () => {
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
    resetTestPluginRuntime({
      text: "first side-chat draft",
      scope: {
        kind: "side-chat",
        projectId: "proj_1",
        parentThreadId: "thr_parent",
        tabId: "side-chat:one",
        childThreadId: "thr_child_one",
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
    render(<Action projectId="proj_1" threadId="thr_child_one" />);

    fireEvent.click(screen.getByRole("button", { name: "Improve prompt" }));
    await waitFor(() => {
      expect(getTestPluginRuntime().textEffect).toBe("shimmer");
      expect(window.sessionStorage.length).toBe(1);
    });

    act(() => {
      setTestComposerScope({
        kind: "side-chat",
        projectId: "proj_1",
        parentThreadId: "thr_parent",
        tabId: "side-chat:two",
        childThreadId: "thr_child_two",
      });
      setTestComposerText("second side-chat draft");
    });

    await waitFor(() => {
      expect(cancelEnhancement).toHaveBeenCalledWith({
        requestId: REQUEST_ID,
      });
      expect(getTestPluginRuntime().textEffect).toBeNull();
      expect(getTestPluginRuntime().threadRowStatus).toBeNull();
      expect(window.sessionStorage.length).toBe(0);
    });

    await act(async () => {
      result.resolve({
        requestId: REQUEST_ID,
        helperThreadId: "thr_helper",
        status: "complete",
        enhancedPrompt: "Late result for the first tab.",
        assumptions: null,
        createdAt: 1,
        completedAt: 2,
      });
      await result.promise;
    });

    expect(getTestPluginRuntime().text).toBe("second side-chat draft");
    expect(
      screen.queryByRole("button", { name: "Undo prompt" }),
    ).toBeNull();

    act(() => {
      setTestComposerScope({
        kind: "side-chat",
        projectId: "proj_1",
        parentThreadId: "thr_parent",
        tabId: "side-chat:one",
        childThreadId: "thr_child_one",
      });
    });
    expect(window.sessionStorage.length).toBe(0);
    expect(
      screen.queryByRole("button", {
        name: "Cancel prompt improvement",
      }),
    ).toBeNull();
  });

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
    resetTestPluginRuntime({
      text: "rough draft",
      attachments: ["brief.png"],
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
    render(<Action projectId="proj_1" threadId="thr_source" />);

    fireEvent.click(screen.getByRole("button", { name: "Improve prompt" }));
    await waitFor(() => {
      expect(getTestPluginRuntime().textEffect).toBe("shimmer");
      expect(getTestPluginRuntime().threadRowStatus).toEqual({
        icon: "AiContentGenerator01",
        label: "Prompt Shaper improving prompt",
        effect: "shimmer",
        tone: "success",
      });
    });

    act(() => {
      setTestComposerText("edited while enhancement was running");
    });
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
      expect(getTestPluginRuntime().text).toBe(
        "Enhanced prompt with the missing guardrail.",
      );
      expect(getTestPluginRuntime().textEffect).toBeNull();
      expect(getTestPluginRuntime().threadRowStatus).toBeNull();
    });
    expect(getTestPluginRuntime().attachments).toEqual(["brief.png"]);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(toast.success).not.toHaveBeenCalled();

    const undoButton = screen.getByRole("button", {
      name: "Undo prompt",
    });
    expect(
      screen.queryByRole("button", { name: "Improve prompt" }),
    ).toBeNull();
    expect(
      undoButton.closest("[data-prompt-shaper-actions]")?.querySelectorAll(
        "button",
      ),
    ).toHaveLength(1);
    expect(
      undoButton.querySelector('[data-icon="AiContentGenerator01"]'),
    ).not.toBeNull();
    expect(
      undoButton.querySelector('[data-icon="ArrowTurnBackward"]'),
    ).not.toBeNull();
    fireEvent.focus(undoButton);
    expect(
      (await screen.findAllByText("Undo prompt")).length,
    ).toBeGreaterThan(0);
    fireEvent.click(undoButton);

    expect(getTestPluginRuntime().text).toBe(
      "edited while enhancement was running",
    );
    expect(getTestPluginRuntime().attachments).toEqual(["brief.png"]);
    expect(getTestPluginRuntime().focusCount).toBe(2);
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
    resetTestPluginRuntime({
      text: "rough source draft",
      attachments: ["source-brief.png"],
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
    render(<Action projectId="proj_1" threadId="thr_source" />);

    fireEvent.click(screen.getByRole("button", { name: "Improve prompt" }));
    await waitFor(() => {
      expect(getTestPluginRuntime().textEffect).toBe("shimmer");
      expect(window.sessionStorage.length).toBe(1);
    });

    act(() => {
      setTestComposerScope({ kind: "thread", threadId: "thr_other" });
      setTestComposerText("other thread draft");
    });
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Improve prompt" }),
      ).not.toBeNull();
      expect(getTestPluginRuntime().textEffect).toBeNull();
      expect(getTestPluginRuntime().threadRowStatus).toBeNull();
    });
    expect(cancelEnhancement).not.toHaveBeenCalled();
    expect(window.sessionStorage.length).toBe(1);

    act(() => {
      setTestComposerScope({ kind: "thread", threadId: "thr_source" });
      setTestComposerText("rough source draft");
    });
    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: "Cancel prompt improvement",
        }),
      ).not.toBeNull();
      expect(getTestPluginRuntime().textEffect).toBe("shimmer");
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
      expect(getTestPluginRuntime().text).toBe(
        "Enhanced after thread navigation.",
      );
      expect(window.sessionStorage.length).toBe(0);
    });
    expect(getTestPluginRuntime().attachments).toEqual(["source-brief.png"]);
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
    resetTestPluginRuntime({
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
    render(<Action projectId="proj_1" threadId="thr_source" />);

    fireEvent.click(screen.getByRole("button", { name: "Improve prompt" }));
    await waitFor(() => expect(window.sessionStorage.length).toBe(1));

    await act(async () => {
      setTestComposerScope({ kind: "thread", threadId: "thr_other" });
      setTestComposerText("other thread draft");
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

    expect(getTestPluginRuntime().text).toBe("other thread draft");
    expect(window.sessionStorage.length).toBe(1);

    act(() => {
      setTestComposerScope({ kind: "thread", threadId: "thr_source" });
      setTestComposerText("rough source draft");
    });

    await waitFor(() => {
      expect(getTestPluginRuntime().text).toBe("Enhanced while navigating.");
      expect(window.sessionStorage.length).toBe(0);
    });
  });

  it("invalidates inline Undo after the enhanced draft is edited or sent", async () => {
    resetTestPluginRuntime({
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
    render(<Action projectId="proj_1" threadId="thr_source" />);

    fireEvent.click(screen.getByRole("button", { name: "Improve prompt" }));
    await screen.findByRole("button", { name: "Undo prompt" });

    act(() => setTestComposerText("Edited enhanced prompt."));
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Undo prompt" }),
      ).toBeNull();
      expect(
        screen.getByRole("button", { name: "Improve prompt" }),
      ).not.toBeNull();
    });

    act(() => setTestComposerText("Enhanced prompt."));
    expect(
      screen.queryByRole("button", { name: "Undo prompt" }),
    ).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Improve prompt" }));
    await screen.findByRole("button", { name: "Undo prompt" });
    act(() => setTestComposerText(""));

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Undo prompt" }),
      ).toBeNull();
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
    resetTestPluginRuntime({
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
    const view = render(<Action projectId="proj_1" threadId="thr_source" />);

    fireEvent.click(screen.getByRole("button", { name: "Improve prompt" }));
    await screen.findByRole("button", { name: "Undo prompt" });
    act(() => {
      setTestComposerScope({ kind: "thread", threadId: "thr_next" });
    });

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Undo prompt" }),
      ).toBeNull();
    });
    view.unmount();

    render(<Action projectId="proj_1" threadId="thr_next" />);
    expect(
      screen.queryByRole("button", { name: "Undo prompt" }),
    ).toBeNull();
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
    resetTestPluginRuntime({
      text: "keep this draft",
      attachments: ["brief.png"],
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
    render(<Action projectId="proj_1" threadId="thr_source" />);

    fireEvent.click(screen.getByRole("button", { name: "Improve prompt" }));
    await waitFor(() => {
      const cancelButton = screen.getByRole("button", {
        name: "Cancel prompt improvement",
      });
      expect(cancelButton.getAttribute("aria-busy")).toBe("true");
      expect(cancelButton.classList.contains("text-success")).toBe(true);
      const icon = cancelButton.querySelector(
        '[data-icon="AiContentGenerator01"]',
      );
      expect(icon).not.toBeNull();
      expect(icon?.classList.contains("animate-shine-icon")).toBe(true);
      expect(
        icon?.parentElement?.classList.contains("motion-safe:animate-pulse"),
      ).toBe(true);
      expect(getTestPluginRuntime().threadRowStatus).not.toBeNull();
      expect(
        getTestPluginRuntime().rpcCalls.map((call) => call.method),
      ).toContain("getEnhancement");
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Cancel prompt improvement" }),
    );

    await waitFor(() => {
      expect(cancelEnhancement).toHaveBeenCalledWith({
        requestId: REQUEST_ID,
      });
      expect(getTestPluginRuntime().textEffect).toBeNull();
      expect(getTestPluginRuntime().threadRowStatus).toBeNull();
      expect(window.sessionStorage.length).toBe(0);
    });
    expect(getTestPluginRuntime().text).toBe("keep this draft");
    expect(getTestPluginRuntime().attachments).toEqual(["brief.png"]);
    expect(
      screen.queryByRole("button", { name: "Undo prompt" }),
    ).toBeNull();

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

    expect(getTestPluginRuntime().text).toBe("keep this draft");
    expect(getTestPluginRuntime().attachments).toEqual(["brief.png"]);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("reveals the cancel icon on hover and keyboard focus while preserving the loading icon otherwise", async () => {
    const start = deferred<never>();
    resetTestPluginRuntime({
      text: "rough draft",
      scope: { kind: "thread", threadId: "thr_source" },
      rpc: {
        startEnhancement: () => start.promise,
        getEnhancement: () => null,
      },
    });
    const Action = await loadAction();
    render(<Action projectId="proj_1" threadId="thr_source" />);

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
    expect(cancelButton.classList.contains("text-muted-foreground")).toBe(
      true,
    );

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
    resetTestPluginRuntime({
      text: "rough draft",
      scope: { kind: "thread", threadId: "thr_source" },
      rpc: {
        startEnhancement: () => start.promise,
        getEnhancement: () => null,
      },
    });
    const Action = await loadAction();
    render(<Action projectId="proj_1" threadId="thr_source" />);

    fireEvent.click(screen.getByRole("button", { name: "Improve prompt" }));
    await waitFor(() => {
      expect(getTestPluginRuntime().textEffect).toBe("shimmer");
      expect(getTestPluginRuntime().threadRowStatus).not.toBeNull();
    });

    act(() => {
      setTestComposerScope({
        kind: "thread",
        threadId: "thr_next",
      });
    });

    await waitFor(() => {
      expect(getTestPluginRuntime().textEffect).toBeNull();
      expect(getTestPluginRuntime().threadRowStatus).toBeNull();
    });
    expect(getTestPluginRuntime().text).toBe("rough draft");
  });

  it("clears loading effects when enhancement fails and when the action unmounts", async () => {
    const start = deferred<never>();
    resetTestPluginRuntime({
      text: "rough draft",
      scope: { kind: "thread", threadId: "thr_source" },
      rpc: {
        startEnhancement: () => start.promise,
        getEnhancement: () => null,
      },
    });
    const Action = await loadAction();
    const view = render(<Action projectId="proj_1" threadId="thr_source" />);

    fireEvent.click(screen.getByRole("button", { name: "Improve prompt" }));
    await waitFor(() => {
      expect(getTestPluginRuntime().textEffect).toBe("shimmer");
      expect(getTestPluginRuntime().threadRowStatus).not.toBeNull();
    });

    view.unmount();
    expect(getTestPluginRuntime().textEffect).toBeNull();
    expect(getTestPluginRuntime().threadRowStatus).toBeNull();

    window.sessionStorage.clear();
    resetTestPluginRuntime({
      text: "rough draft",
      scope: { kind: "thread", threadId: "thr_source" },
      rpc: {
        startEnhancement: () => {
          throw new Error("agent unavailable");
        },
        getEnhancement: () => null,
      },
    });
    render(<Action projectId="proj_1" threadId="thr_source" />);
    fireEvent.click(screen.getByRole("button", { name: "Improve prompt" }));

    await waitFor(() => {
      expect(getTestPluginRuntime().textEffect).toBeNull();
      expect(getTestPluginRuntime().threadRowStatus).toBeNull();
      expect(toast.error).toHaveBeenCalledWith("agent unavailable");
    });
    expect(getTestPluginRuntime().textEffectCalls).toContain("shimmer");
    expect(
      screen.queryByRole("button", { name: "Undo prompt" }),
    ).toBeNull();
  });

  it("keeps pending work across unmount and applies its result after returning", async () => {
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
    resetTestPluginRuntime({
      text: "side-chat draft before deactivation",
      attachments: ["side-chat-brief.png"],
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
    const view = render(
      <Action key="active" projectId="proj_1" threadId="thr_child" />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Improve prompt" }));
    await waitFor(() => {
      expect(getTestPluginRuntime().textEffect).toBe("shimmer");
      expect(window.sessionStorage.length).toBe(1);
    });

    act(() => {
      view.unmount();
    });

    expect(cancelEnhancement).not.toHaveBeenCalled();
    expect(window.sessionStorage.length).toBe(1);
    expect(getTestPluginRuntime().textEffect).toBeNull();
    expect(getTestPluginRuntime().threadRowStatus).toBeNull();

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

    expect(getTestPluginRuntime().text).toBe(
      "side-chat draft before deactivation",
    );

    render(<Action projectId="proj_1" threadId="thr_child" />);
    await waitFor(() => {
      expect(getTestPluginRuntime().text).toBe(
        "Enhanced result completed while away.",
      );
      expect(window.sessionStorage.length).toBe(0);
      expect(
        screen.getByRole("button", { name: "Undo prompt" }),
      ).not.toBeNull();
    });
    expect(cancelEnhancement).not.toHaveBeenCalled();
    expect(getTestPluginRuntime().attachments).toEqual([
      "side-chat-brief.png",
    ]);
  });

  it("clears a detached pending marker when helper startup fails", async () => {
    let rejectStart!: (error: Error) => void;
    const start = new Promise<never>((_resolve, reject) => {
      rejectStart = reject;
    });
    resetTestPluginRuntime({
      text: "draft whose helper cannot start",
      scope: { kind: "thread", threadId: "thr_source" },
      rpc: {
        startEnhancement: () => start,
        getEnhancement: () => null,
      },
    });
    const Action = await loadAction();
    const view = render(
      <Action projectId="proj_1" threadId="thr_source" />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Improve prompt" }));
    await waitFor(() => expect(window.sessionStorage.length).toBe(1));

    view.unmount();
    await act(async () => {
      rejectStart(new Error("agent unavailable"));
      await Promise.resolve();
    });

    expect(window.sessionStorage.length).toBe(0);
    expect(getTestPluginRuntime().text).toBe(
      "draft whose helper cannot start",
    );

    render(<Action projectId="proj_1" threadId="thr_source" />);
    expect(
      screen.getByRole("button", { name: "Improve prompt" }),
    ).not.toBeNull();
    expect(getTestPluginRuntime().textEffect).toBeNull();
    expect(getTestPluginRuntime().threadRowStatus).toBeNull();
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
    resetTestPluginRuntime({
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
    const view = render(
      <StrictMode>
        <Action projectId="proj_1" threadId="thr_source" />
      </StrictMode>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Cancel prompt improvement" }),
      ).not.toBeNull();
      expect(getTestPluginRuntime().textEffect).toBe("shimmer");
      expect(window.sessionStorage.length).toBe(1);
    });
    expect(cancelEnhancement).not.toHaveBeenCalled();

    view.unmount();
    expect(cancelEnhancement).not.toHaveBeenCalled();
    expect(window.sessionStorage.length).toBe(1);
    expect(getTestPluginRuntime().textEffect).toBeNull();
    expect(getTestPluginRuntime().threadRowStatus).toBeNull();
  });
});
