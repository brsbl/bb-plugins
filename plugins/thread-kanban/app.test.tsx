// @vitest-environment jsdom

import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { loadPluginApp, renderSlot } from "@get-bb/plugin-sdk/testing/app";
import { afterEach, describe, expect, it } from "vitest";

import type { BoardPayload, BoardThread, rpcContract } from "./server";

afterEach(() => cleanup());

function thread(overrides: Partial<BoardThread> & { id: string; title: string }): BoardThread {
  return {
    projectId: "proj_1",
    sectionId: null,
    status: "idle",
    displayStatus: "idle",
    unread: false,
    pendingInteractions: 0,
    activeBackgroundAgentCount: 0,
    pinned: false,
    createdAt: 1_000,
    updatedAt: 1_000,
    latestAttentionAt: 0,
    ...overrides,
  };
}

function payload(): BoardPayload {
  return {
    fetchedAt: 2_000,
    sections: [
      { id: "sec_plan", name: "📋 Planning" },
      { id: "sec_build", name: "🛠️ Building" },
    ],
    threads: [
      thread({ id: "thr_a", title: "Plan the thing", sectionId: "sec_plan" }),
      thread({ id: "thr_b", title: "Build it", sectionId: "sec_build", status: "active" }),
    ],
  };
}

function dataTransfer(id: string, mime = "application/x-bb-thread-id") {
  const store = new Map<string, string>();
  return {
    types: [mime, "text/plain"],
    effectAllowed: "move",
    dropEffect: "none",
    setData: (type: string, value: string) => store.set(type, value),
    getData: (type: string) => store.get(type) ?? (type === mime ? id : ""),
  };
}

describe("Thread Kanban board", () => {
  it("renders one column per section and moves a dropped card", async () => {
    const app = await loadPluginApp(() => import("./app"));
    const panel = app.navPanels[0]!;
    expect(panel.path).toBe("board");
    const moves: unknown[] = [];
    const slot = renderSlot<{ subPath: string }, typeof rpcContract>(panel, { subPath: "" }, {
      rpc: {
        board: () => payload(),
        moveThread: (input) => {
          moves.push(input);
          return thread({
            id: input.threadId,
            title: "Plan the thing",
            sectionId: input.sectionId,
          });
        },
      },
    });
    expect(await slot.findByText("Plan the thing")).toBeDefined();
    const planning = screen.getByRole("region", { name: "📋 Planning" });
    const building = screen.getByRole("region", { name: "🛠️ Building" });
    expect(planning.textContent).toContain("Plan the thing");
    expect(building.textContent).toContain("Build it");
    expect(building.textContent).toContain("Working");

    const card = screen.getByRole("article", { name: "Plan the thing" });
    const transfer = dataTransfer("thr_a");
    fireEvent.dragStart(card, { dataTransfer: transfer });
    fireEvent.dragEnter(building, { dataTransfer: transfer });
    fireEvent.dragOver(building, { dataTransfer: transfer });
    fireEvent.drop(building, { dataTransfer: transfer });

    await waitFor(() => expect(moves).toEqual([{ threadId: "thr_a", sectionId: "sec_build" }]));
    await waitFor(() =>
      expect(
        screen.getByRole("region", { name: "🛠️ Building" }).textContent,
      ).toContain("Plan the thing"),
    );
    expect(screen.getByRole("region", { name: "📋 Planning" }).textContent).not.toContain(
      "Plan the thing",
    );
  });

  it("opens a thread when its card is clicked", async () => {
    const app = await loadPluginApp(() => import("./app"));
    const slot = renderSlot<{ subPath: string }, typeof rpcContract>(app.navPanels[0]!, { subPath: "" }, {
      rpc: {
        board: () => payload(),
        moveThread: (input) => thread({ id: input.threadId, title: "x" }),
      },
    });
    fireEvent.click(await slot.findByRole("link", { name: "Open Build it" }));
    expect(slot.inspection.navigateCalls).toEqual([{ method: "toThread", threadId: "thr_b" }]);
  });

  it("renders the dashboard for the dashboard sub-path", async () => {
    const app = await loadPluginApp(() => import("./app"));
    const data = payload();
    data.threads.push(
      thread({ id: "thr_c", title: "Needs answer", sectionId: "sec_plan", pendingInteractions: 1, updatedAt: 3_000 }),
      thread({ id: "thr_d", title: "Unread output", sectionId: "sec_build", unread: true, updatedAt: 2_500 }),
    );
    const slot = renderSlot<{ subPath: string }, typeof rpcContract>(
      app.navPanels[0]!,
      { subPath: "dashboard" },
      {
        rpc: {
          board: () => data,
          moveThread: (input) => thread({ id: input.threadId, title: "x" }),
          },
      },
    );
    const active = await slot.findByRole("region", { name: "Active now" });
    expect(active.textContent).toContain("Build it");
    expect(active.textContent).not.toContain("Plan the thing");
    const waiting = screen.getByRole("region", { name: "Waiting on me" });
    expect(waiting.textContent).toContain("Needs answer");
    expect(waiting.textContent).toContain("Unread output");
    expect(waiting.textContent).not.toContain("Build it");
    const perSection = screen.getByRole("region", { name: "Threads per section" });
    expect(perSection.textContent).toContain("📋 Planning");
    expect(perSection.textContent).toContain("2");
    const recent = screen.getByRole("region", { name: "Recently updated" });
    expect(recent.querySelectorAll("li").length).toBe(4);
    expect(recent.querySelector("li")?.textContent).toContain("Needs answer");
    expect(screen.queryByRole("region", { name: "📋 Planning" })).toBeNull();
  });

  it("switches views from the header toggle", async () => {
    const app = await loadPluginApp(() => import("./app"));
    const panel = app.navPanels[0]!;
    const slot = renderSlot<{ subPath: string }, typeof rpcContract>(
      { component: panel.headerContent! },
      { subPath: "" },
      {
        rpc: {
          board: () => payload(),
          moveThread: (input) => thread({ id: input.threadId, title: "x" }),
          },
      },
    );
    const boardButton = screen.getByRole("button", { name: "Board" });
    expect(boardButton.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Dashboard" }));
    expect(slot.inspection.navigateCalls[0]).toMatchObject({
      method: "toPluginPanel",
      path: "board",
    });
  });

  it("orders columns like the sidebar's manual section order", async () => {
    window.localStorage.setItem(
      "bb.sidebar.manualSectionOrder",
      JSON.stringify(["pinned", "section:sec_build", "section:sec_plan"]),
    );
    try {
      const app = await loadPluginApp(() => import("./app"));
      const slot = renderSlot<{ subPath: string }, typeof rpcContract>(
        app.navPanels[0]!,
        { subPath: "" },
        { rpc: { board: () => payload(), moveThread: (input) => thread({ id: input.threadId, title: "x" }) } },
      );
      await slot.findByText("Plan the thing");
      expect(
        screen.getAllByRole("region").map((region) => region.getAttribute("aria-label")),
      ).toEqual(["🛠️ Building", "📋 Planning"]);
    } finally {
      window.localStorage.removeItem("bb.sidebar.manualSectionOrder");
    }
  });
});
