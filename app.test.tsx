// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ComponentType } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import {
  getTestPluginRuntime,
  resetTestPluginRuntime,
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
  if (component === null) throw new Error("Prompt Shaper action was not registered");
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
  it("replaces the latest edited draft automatically, preserves attachments, and keeps Undo", async () => {
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
    });
    expect(getTestPluginRuntime().attachments).toEqual(["brief.png"]);
    expect(screen.queryByRole("dialog")).toBeNull();

    const successOptions = vi.mocked(toast.success).mock.calls[0]?.[1] as
      | { action?: { label: string; onClick(): void } }
      | undefined;
    expect(successOptions?.action?.label).toBe("Undo");
    act(() => {
      successOptions?.action?.onClick();
    });
    expect(getTestPluginRuntime().text).toBe(
      "edited while enhancement was running",
    );
  });

  it("clears the shimmer when enhancement fails and when the action unmounts", async () => {
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
    const view = render(
      <Action projectId="proj_1" threadId="thr_source" />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Improve prompt" }));
    await waitFor(() => {
      expect(getTestPluginRuntime().textEffect).toBe("shimmer");
    });

    view.unmount();
    expect(getTestPluginRuntime().textEffect).toBeNull();

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
      expect(toast.error).toHaveBeenCalledWith("agent unavailable");
    });
    expect(getTestPluginRuntime().textEffectCalls).toContain("shimmer");
  });
});
