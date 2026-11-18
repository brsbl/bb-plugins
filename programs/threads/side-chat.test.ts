// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSideChatActions } from "./side-chat";

const mocks = vi.hoisted(() => ({ plugins: { list: vi.fn(), callRpc: vi.fn() }, toThread: vi.fn(), error: vi.fn() }));
vi.mock("@get-bb/plugin-sdk/app", () => ({ useSdk: () => ({ plugins: mocks.plugins }), useBbNavigate: () => ({ toThread: mocks.toThread }) }));
vi.mock("sonner", () => ({ toast: { error: mocks.error } }));

const message = { id: "message-7", threadId: "source", role: "assistant" as const, text: "Earlier answer", sourceSeqEnd: 42 };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.plugins.list.mockResolvedValue({ plugins: [{ id: "side-chat", enabled: true, status: "running" }] });
});
afterEach(cleanup);

describe("AIM side chat", () => {
  it("opens the returned child from the exact message once while creation is pending", async () => {
    let finish!: (value: { threadId: string }) => void;
    mocks.plugins.callRpc.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const { result } = renderHook(() => useSideChatActions(true));
    await waitFor(() => expect(result.current).toHaveLength(1));
    expect(result.current[0]).toMatchObject({ title: "Reply in side chat", icon: "SideChat" });
    const first = result.current[0]!.run(message);
    await result.current[0]!.run(message);
    expect(mocks.plugins.callRpc).toHaveBeenCalledOnce();
    expect(mocks.plugins.callRpc).toHaveBeenCalledWith(expect.objectContaining({
      pluginId: "side-chat", method: "createSideChat",
      input: { sourceThreadId: "source", sourceSeqEnd: 42, anchorText: "Earlier answer" },
    }));
    expect(mocks.toThread).not.toHaveBeenCalled();
    await act(async () => { finish({ threadId: "side-child" }); await first; });
    expect(mocks.toThread).toHaveBeenCalledExactlyOnceWith("side-child");
  });

  it("shows creation failures without navigating and allows retry", async () => {
    mocks.plugins.callRpc.mockRejectedValueOnce(new Error("Source thread must have a ready environment to fork"));
    const { result } = renderHook(() => useSideChatActions(true));
    await waitFor(() => expect(result.current).toHaveLength(1));
    await result.current[0]!.run(message);
    expect(mocks.error).toHaveBeenCalledWith("Failed to start side chat: Source thread must have a ready environment to fork");
    expect(mocks.toThread).not.toHaveBeenCalled();
    mocks.plugins.callRpc.mockResolvedValueOnce({ threadId: "retry-child" });
    await result.current[0]!.run(message);
    expect(mocks.toThread).toHaveBeenCalledExactlyOnceWith("retry-child");
  });

  it.each([
    { plugins: [] },
    { plugins: [{ id: "side-chat", enabled: false, status: "disabled" }] },
    { plugins: [{ id: "side-chat", enabled: true, status: "error" }] },
  ])("omits unavailable Side chat actions: %j", async ({ plugins }) => {
    mocks.plugins.list.mockResolvedValue({ plugins });
    const { result } = renderHook(() => useSideChatActions(true));
    await act(async () => {});
    expect(result.current).toEqual([]);
    expect(mocks.plugins.callRpc).not.toHaveBeenCalled();
  });

  it("omits actions when the source is unavailable or archived", async () => {
    const { result, rerender } = renderHook(({ enabled }) => useSideChatActions(enabled), { initialProps: { enabled: true } });
    await waitFor(() => expect(result.current).toHaveLength(1));
    rerender({ enabled: false });
    expect(result.current).toEqual([]);
  });
});
