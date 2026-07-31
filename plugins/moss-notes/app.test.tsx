// @vitest-environment jsdom

import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { loadPluginApp, renderSlot } from "@bb/plugin-sdk/testing/app";

afterEach(cleanup);

describe("Moss Notes page", () => {
  it("initializes the open thread and shows folders grouped by lifecycle", async () => {
    const app = await loadPluginApp(() => import("./app"));
    const panel = app.threadPanelActions[0]!;
    const slot = renderSlot(
      panel,
      { params: null, threadId: "thr_alpha" },
      {
        rpc: {
          openThread: () => ({
            path: "/Users/example/Moss/Notes/bb Threads/Active/thr_alpha",
            state: "active",
          }),
          listFolders: () => ({
            root: "/Users/example/Moss/Notes/bb Threads",
            folders: {
              active: ["thr_alpha"],
              archived: ["thr_retained"],
              deleted: [],
            },
          }),
        },
      },
    );

    expect(await screen.findByText("thr_alpha")).not.toBeNull();
    expect(screen.getByText("thr_retained")).not.toBeNull();
    expect(screen.getByText("active")).not.toBeNull();
    expect(screen.getByText("archived")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await waitFor(() => expect(slot.inspection.rpcCalls).toHaveLength(4));
    expect(slot.inspection.rpcCalls[0]).toEqual({
      input: { threadId: "thr_alpha" },
      method: "openThread",
    });

    slot.lifecycle.unmount();
  });

  it("reconciles folder state after the realtime connection recovers", async () => {
    let activeFolders = ["thr_alpha"];
    const app = await loadPluginApp(() => import("./app"));
    const panel = app.threadPanelActions[0]!;
    const slot = renderSlot(
      panel,
      { params: null, threadId: "thr_alpha" },
      {
        rpc: {
          openThread: () => ({
            path: "/Users/example/Moss/Notes/bb Threads/Active/thr_alpha",
            state: "active",
          }),
          listFolders: () => ({
            root: "/Users/example/Moss/Notes/bb Threads",
            folders: {
              active: activeFolders,
              archived: [],
              deleted: [],
            },
          }),
        },
      },
    );

    expect(await screen.findByText("thr_alpha")).not.toBeNull();
    activeFolders = ["thr_alpha", "thr_missed"];
    await slot.behavior.setRealtimeConnectionState("reconnecting");
    expect(screen.queryByText("thr_missed")).toBeNull();
    await slot.behavior.setRealtimeConnectionState("connected");

    expect(await screen.findByText("thr_missed")).not.toBeNull();
    await waitFor(() => expect(slot.inspection.rpcCalls).toHaveLength(4));

    slot.lifecycle.unmount();
  });
});
