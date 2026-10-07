// @vitest-environment jsdom
import type { PluginSidebarThread } from "@get-bb/plugin-sdk/app";
import { loadPluginApp, renderSlot, type RenderSlotOptions } from "@get-bb/plugin-sdk/testing/app";
import { cleanup, fireEvent, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { planSidebarVisibility, unsentRequests, type VisibilityThread } from "./components/sidebar-visibility";
import type { Candidate, PanelState, SpaceMember, SpaceSnapshot } from "./contract";

const NOW = Date.now();
const MINUTE = 60_000;
const threadId = "thr_here";
const sectionId = "sec_content";
const panelProps = { threadId, params: null };

function member(id: string, title: string, patch: Partial<SpaceMember> = {}): SpaceMember {
  return {
    id,
    title,
    projectId: "proj_bb",
    projectName: "bb",
    group: "idle",
    isUnread: false,
    hasPendingInteraction: false,
    failed: false,
    running: false,
    archived: false,
    lastActivityAt: NOW - 30 * MINUTE,
    excerpt: `${title} latest output`,
    firstPrompt: null,
    subthreads: { total: 0, working: 0, needsYou: 0 },
    ...patch,
  };
}

function liveThread(id: string, patch: Partial<PluginSidebarThread> = {}): PluginSidebarThread {
  return {
    id,
    projectId: "proj_bb",
    title: id,
    titleFallback: null,
    displayTitle: patch.title ?? id,
    parentThreadId: null,
    lifecycleOwnerThreadId: null,
    sourceThreadId: null,
    sectionId,
    originKind: null,
    originPluginId: null,
    providerId: "claude-code",
    status: "idle",
    runtimeStatus: "idle",
    queuedWork: "none",
    hasPendingInteraction: false,
    activity: { workflows: 0, backgroundAgents: 0, backgroundCommands: 0, planMode: 0, goals: 0 },
    indicator: "none",
    indicatorLabel: null,
    isUnread: false,
    isPinned: false,
    pinnedAt: null,
    pinSortKey: null,
    isArchived: false,
    archivedAt: null,
    href: `/projects/proj_bb/threads/${id}`,
    isHidden: false,
    environment: null,
    host: null,
    createdAt: NOW - 60 * MINUTE,
    updatedAt: NOW - 30 * MINUTE,
    lastReadAt: null,
    latestAttentionAt: 0,
    ...patch,
  };
}

const members: SpaceMember[] = [
  member("thr_ask", "bb comparison & guide pages", {
    group: "needs-you",
    hasPendingInteraction: true,
    lastActivityAt: NOW - 12 * MINUTE,
    subthreads: { total: 3, working: 0, needsYou: 0 },
  }),
  member("thr_ads", "Google Ads spike", { lastActivityAt: NOW - MINUTE }),
  // The snapshot still says idle; the live list says it has unread output.
  member("thr_shape", "Blog: Software You Can Shape", { lastActivityAt: NOW - 8 * MINUTE }),
  member(threadId, "Content strategy and calendar", { lastActivityAt: NOW - 20 * MINUTE }),
  member("thr_aud", "Blog: Software for an Audience of 1", { lastActivityAt: NOW - 60 * MINUTE }),
  member("thr_mp", "Multi-persona website", { lastActivityAt: NOW - 180 * MINUTE }),
  member("thr_sp", "Saved Places public repo", { projectName: "Personal", lastActivityAt: NOW - 1_440 * MINUTE }),
  member("thr_tw", "twitter analytics", { lastActivityAt: NOW - 2_880 * MINUTE, excerpt: null, firstPrompt: "Anything scheduled today?" }),
  member("thr_old", "Old launch notes", { group: "archived", archived: true }),
  member("thr_moved", "Dragged out of the Space"),
];

const liveThreads: PluginSidebarThread[] = [
  liveThread("thr_ask", {
    title: "bb comparison & guide pages",
    hasPendingInteraction: true,
    indicator: "waiting-for-input",
    indicatorLabel: "Thread needs user input",
  }),
  liveThread("thr_ask_child", { parentThreadId: "thr_ask", sectionId: null, status: "active", runtimeStatus: "active" }),
  liveThread("thr_ads", {
    title: "Google Ads spike",
    status: "active",
    runtimeStatus: "active",
    indicator: "runtime",
    indicatorLabel: "Thread working",
  }),
  liveThread("thr_shape", {
    title: "Blog: Software You Can Shape",
    isUnread: true,
    indicator: "unread-success",
    indicatorLabel: "Unread thread succeeded",
  }),
  liveThread(threadId, { title: "Content strategy and calendar" }),
  liveThread("thr_aud", { title: "Blog: Software for an Audience of 1" }),
  liveThread("thr_mp", { title: "Multi-persona website" }),
  liveThread("thr_sp", { title: "Saved Places public repo" }),
  liveThread("thr_tw", { title: "twitter analytics" }),
  liveThread("thr_moved", { title: "Dragged out of the Space", sectionId: "sec_other" }),
];

const space: SpaceSnapshot = {
  sectionId,
  name: "Content",
  projects: ["bb", "Personal"],
  members,
  organizer: "supported",
  builtAt: NOW,
};

const memberState: PanelState = { kind: "member", space };

function candidate(id: string, title: string, sectionName: string | null, projectName: string, reason: string | null): Candidate {
  return { id, title, projectName, sectionName, reason };
}

type RpcHandlers = NonNullable<RenderSlotOptions["rpc"]>;

async function renderPanel(rpc: RpcHandlers = {}, state: PanelState = memberState) {
  const app = await loadPluginApp(() => import("./app"));
  const handlers: RpcHandlers = { panelState: () => state, ...rpc };
  return renderSlot(app.threadPanelActions[0]!, panelProps, {
    sidebarThreads: { threads: liveThreads },
    rpc: handlers,
  });
}

function section(slot: Awaited<ReturnType<typeof renderPanel>>, heading: string): HTMLElement {
  return slot.getByRole("heading", { name: heading }).closest("section")!;
}

afterEach(cleanup);

describe("Spaces app", () => {
  it("registers the Space tab and the More controller", async () => {
    const app = await loadPluginApp(() => import("./app"));
    expect(app.threadPanelActions.map((action) => [action.id, action.title, action.layout])).toEqual([
      ["space", "Space", "flush"],
    ]);
    expect(app.appOverlays.map((overlay) => overlay.id)).toEqual(["more-controller"]);
  });

  it("groups members by what they need, regrouping from live state, and folds idle and archived members", async () => {
    const slot = await renderPanel();

    expect(await slot.findByRole("heading", { name: "Content", level: 2 })).toBeDefined();
    expect(slot.getByText("8 threads · bb, Personal")).toBeDefined();
    expect(slot.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual([
      "Needs you 1",
      "Working 1",
      "New output 1",
      "Idle 5",
    ]);
    expect(within(section(slot, "New output 1")).getByText("Blog: Software You Can Shape")).toBeDefined();
    expect(within(section(slot, "Needs you 1")).getByText("3 subthreads · 1 working")).toBeDefined();
    expect(slot.getByLabelText("Thread needs user input")).toBeDefined();
    expect(slot.queryByText("Dragged out of the Space")).toBeNull();

    const idle = section(slot, "Idle 5");
    expect(within(idle).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      expect.stringContaining("Content strategy and calendar"),
      expect.stringContaining("Blog: Software for an Audience of 1"),
      expect.stringContaining("Multi-persona website"),
    ]);
    fireEvent.click(within(idle).getByRole("button", { name: "2 more idle" }));
    expect(within(idle).getAllByRole("listitem")).toHaveLength(5);
    expect(within(idle).getByText("Anything scheduled today?")).toBeDefined();
    expect(within(idle).getByText("No output yet")).toBeDefined();
    expect(within(idle).getByRole("button", { name: "Show fewer" })).toBeDefined();

    const archived = slot.getByRole("button", { name: "Archived (1)" });
    expect(archived.getAttribute("aria-expanded")).toBe("false");
    expect(slot.queryByText("Old launch notes")).toBeNull();
    fireEvent.click(archived);
    expect(slot.getByText("Old launch notes")).toBeDefined();
  });

  it("peeks one member at a time, marks it read, and never peeks the current thread", async () => {
    const slot = await renderPanel();

    const current = (await slot.findByText("This thread")).closest("li")!;
    expect(within(current).queryByRole("button")).toBeNull();
    fireEvent.click(within(current).getByText("Content strategy and calendar"));
    expect(slot.queryByTestId("bb-thread-chat")).toBeNull();

    fireEvent.click(slot.getByRole("button", { name: "Blog: Software You Can Shape" }));
    const chat = slot.getByTestId("bb-thread-chat");
    expect(chat.getAttribute("data-thread-id")).toBe("thr_shape");
    expect(chat.getAttribute("data-variant")).toBe("compact");
    await waitFor(() =>
      expect(slot.inspection.sidebarActionCalls).toContainEqual({ method: "setRead", threadId: "thr_shape", read: true }),
    );

    const ads = slot.getByRole("button", { name: "Google Ads spike" });
    fireEvent.click(ads);
    expect(slot.getAllByTestId("bb-thread-chat").map((node) => node.getAttribute("data-thread-id"))).toEqual(["thr_ads"]);

    fireEvent.keyDown(slot.getByTestId("bb-thread-chat"), { key: "Escape" });
    expect(slot.queryByTestId("bb-thread-chat")).toBeNull();
    expect(document.activeElement).toBe(ads);

    fireEvent.keyDown(ads, { key: "ArrowDown" });
    expect(document.activeElement).toBe(slot.getByRole("button", { name: "Blog: Software You Can Shape" }));
    fireEvent.keyDown(ads, { key: "s" });
    fireEvent.keyDown(ads, { key: "Enter" });
    expect(slot.inspection.sidebarActionCalls).toContainEqual({ method: "open", threadId: "thr_ads", options: { split: true } });
    expect(slot.inspection.sidebarActionCalls).toContainEqual({ method: "open", threadId: "thr_ads" });
  });

  it("tells the selected threads, names who got it, and retries the ones that failed", async () => {
    let tells = 0;
    const slot = await renderPanel({
      tell: (input) => {
        tells += 1;
        const { threadIds } = input as { threadIds: string[] };
        return {
          results: threadIds.map((id) => ({
            threadId: id,
            ok: tells > 1 || id === "thr_ads",
            queued: id === "thr_ads",
            error: tells > 1 || id === "thr_ads" ? null : "Thread is busy",
          })),
        };
      },
    });

    fireEvent.click(await slot.findByRole("button", { name: "Content options" }));
    fireEvent.click(slot.getByRole("menuitem", { name: "Select threads" }));

    expect((slot.getByRole("checkbox", { name: /Content strategy and calendar/ }) as HTMLInputElement).disabled).toBe(true);
    expect(slot.getByText("Select threads to tell")).toBeDefined();
    expect((slot.getByRole("button", { name: "Send to selected threads" }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(slot.getByRole("checkbox", { name: /Blog: Software You Can Shape/ }));
    fireEvent.click(slot.getByRole("checkbox", { name: /Google Ads spike/ }));
    expect(slot.getByText("Tell 2 threads")).toBeDefined();
    expect(slot.getByText("2 selected")).toBeDefined();

    fireEvent.change(slot.getByLabelText("Tell 2 threads"), { target: { value: "The launch moved to Oct 14." } });
    fireEvent.click(slot.getByRole("button", { name: "Send to selected threads" }));

    expect(await slot.findByText("Sent as you to Google Ads spike. No other thread was messaged.")).toBeDefined();
    expect(slot.getByText("Google Ads spike is running, so it gets it when its turn ends.")).toBeDefined();
    expect(slot.inspection.rpcCalls).toContainEqual({
      method: "tell",
      input: { threadIds: ["thr_ads", "thr_shape"], message: "The launch moved to Oct 14." },
    });
    const failure = slot.getByRole("alert");
    expect(within(failure).getByText("Couldn't send to Blog: Software You Can Shape.")).toBeDefined();

    fireEvent.click(within(failure).getByRole("button", { name: "Retry" }));
    expect(
      await slot.findByText("Sent as you to Google Ads spike and Blog: Software You Can Shape. No other thread was messaged."),
    ).toBeDefined();
    expect(slot.inspection.rpcCalls.filter((call) => call.method === "tell").at(-1)).toEqual({
      method: "tell",
      input: { threadIds: ["thr_shape"], message: "The launch moved to Oct 14." },
    });
    expect(slot.queryByRole("alert")).toBeNull();
  });

  it("mentions the Space in this thread's composer", async () => {
    const slot = await renderPanel();
    fireEvent.click(await slot.findByRole("button", { name: "Content options" }));
    fireEvent.click(slot.getByRole("menuitem", { name: "Mention in composer" }));
    expect(slot.inspection.composer.mentions).toEqual([{ provider: "space", id: sectionId, label: "Content" }]);
  });

  it("adds threads from a picker that starts unchecked and shows where each thread came from", async () => {
    const slot = await renderPanel({
      candidates: () => ({
        suggested: [candidate("thr_strat", "Content strategy draft", "Agent Inbox", "bb", "messaged 3 members")],
        others: [candidate("thr_tw2", "twitter digest", null, "Code", null)],
      }),
      addThreads: (input) => ({ added: (input as { threadIds: string[] }).threadIds, skipped: [] }),
    });

    fireEvent.click(await slot.findByRole("button", { name: "Add threads to Content" }));
    const dialog = slot.getByRole("dialog", { name: "Add threads to Content" });
    expect(await within(dialog).findByText("Talked with this Space")).toBeDefined();
    expect(within(dialog).getByText("Other threads")).toBeDefined();
    expect(within(dialog).getByText("Agent Inbox · bb · messaged 3 members")).toBeDefined();
    expect(within(dialog).getByText("Threads · Code")).toBeDefined();
    const boxes = within(dialog).getAllByRole("checkbox") as HTMLInputElement[];
    expect(boxes.map((box) => box.checked)).toEqual([false, false]);
    expect((within(dialog).getByRole("button", { name: "Add threads" }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(within(dialog).getByRole("searchbox", { name: "Search threads" }), { target: { value: "tw" } });
    await waitFor(() =>
      expect(slot.inspection.rpcCalls).toContainEqual({ method: "candidates", input: { sectionId, query: "tw" } }),
    );

    for (const box of within(dialog).getAllByRole("checkbox")) fireEvent.click(box);
    fireEvent.click(within(dialog).getByRole("button", { name: "Add 2 threads" }));

    expect(await slot.findByText("Moved from Agent Inbox and Threads. They stay here when they finish.")).toBeDefined();
    expect(slot.inspection.rpcCalls).toContainEqual({
      method: "addThreads",
      input: { sectionId, threadIds: ["thr_strat", "thr_tw2"] },
    });
    expect(slot.queryByRole("dialog")).toBeNull();
  });

  it("warns when Thread Organizer doesn't know about Spaces yet", async () => {
    const slot = await renderPanel({}, { kind: "member", space: { ...space, organizer: "outdated" } });
    expect(
      await slot.findByText("Thread Organizer will still move finished threads to Agent Inbox. Update Thread Organizer."),
    ).toBeDefined();
  });

  it("refetches the Space when Spaces publishes a change to it", async () => {
    const slot = await renderPanel();
    await slot.findByRole("heading", { name: "Content", level: 2 });
    await slot.emitRealtime("spaces", { sectionIds: [sectionId] });
    await waitFor(() => expect(slot.inspection.rpcCalls.filter((call) => call.method === "panelState")).toHaveLength(2));
  });

  it("offers to make an eligible section a Space", async () => {
    const slot = await renderPanel(
      { makeSpace: () => ({ sectionId: "sec_x", name: "Content", memberCount: 4 }) },
      { kind: "outside", section: { id: "sec_x", name: "Content", eligible: true, hasEntryPrompt: false }, spaces: [], isSubthread: false },
    );
    expect(await slot.findByText("Content isn't a Space")).toBeDefined();
    expect((slot.getByRole("button", { name: "Move this thread to a Space" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(slot.getByRole("button", { name: "Make Content a Space" }));
    await waitFor(() => expect(slot.inspection.rpcCalls).toContainEqual({ method: "makeSpace", input: { sectionId: "sec_x" } }));
  });

  it("starts a new Space from a loose thread", async () => {
    const slot = await renderPanel(
      { createSpace: () => ({ sectionId: "sec_new", name: "Launch", memberCount: 1 }) },
      {
        kind: "outside",
        section: null,
        spaces: [{ sectionId, name: "Content", memberCount: 9 }],
        isSubthread: false,
      },
    );
    fireEvent.click(await slot.findByRole("button", { name: "New Space" }));
    fireEvent.change(slot.getByLabelText("Space name"), { target: { value: "Launch" } });
    fireEvent.click(slot.getByRole("button", { name: "Create Space" }));
    await waitFor(() =>
      expect(slot.inspection.rpcCalls).toContainEqual({ method: "createSpace", input: { name: "Launch", threadIds: [threadId] } }),
    );
  });

  it("explains that subthreads follow their parent", async () => {
    const slot = await renderPanel({}, { kind: "outside", section: null, spaces: [], isSubthread: true });
    expect(await slot.findByText("Subthreads follow their parent")).toBeDefined();
  });

  it("brings a Space with news out of More after the debounce", async () => {
    const app = await loadPluginApp(() => import("./app"));
    const slot = renderSlot(
      app.appOverlays[0]!,
      {},
      {
        context: { threadId: "thr_elsewhere" },
        sidebarThreads: { threads: [liveThread("thr_shape", { isUnread: true })] },
        rpc: {
          listSpaces: () => ({ spaces: [{ sectionId, name: "Content", memberCount: 1 }] }),
          setSidebarVisibility: () => ({ changed: true }),
        },
      },
    );
    await waitFor(
      () =>
        expect(slot.inspection.rpcCalls).toContainEqual({
          method: "setSidebarVisibility",
          input: { sectionId, show: true },
        }),
      { timeout: 3_000 },
    );
  });
});

describe("planSidebarVisibility", () => {
  function thread(id: string, patch: Partial<VisibilityThread> = {}): VisibilityThread {
    return {
      id,
      sectionId,
      parentThreadId: null,
      isHidden: false,
      isArchived: false,
      isUnread: false,
      hasPendingInteraction: false,
      status: "idle",
      runtimeStatus: "idle",
      latestAttentionAt: 100,
      ...patch,
    };
  }
  const plan = (threads: VisibilityThread[], viewedThreadIds: string[] = []) =>
    planSidebarVisibility({ spaceSectionIds: [sectionId], threads, viewedThreadIds });

  it("brings a Space out when a member has unread output or needs you", () => {
    expect(plan([thread("a", { isUnread: true })])).toEqual([{ sectionId, show: true, key: "show:a@100" }]);
    expect(plan([thread("a", { hasPendingInteraction: true, status: "active", runtimeStatus: "active" })])).toEqual([
      { sectionId, show: true, key: "show:a@100" },
    ]);
  });

  it("doesn't count a member that is only working as news", () => {
    expect(plan([thread("a", { isUnread: true, status: "active", runtimeStatus: "active" })])).toEqual([
      { sectionId, show: false, key: "hide" },
    ]);
  });

  it("puts a Space back once it's read, but never while you're reading one of its threads", () => {
    const read = [thread("a"), thread("b"), thread("b_child", { parentThreadId: "b", sectionId: null })];
    expect(plan(read, ["thr_elsewhere"])).toEqual([{ sectionId, show: false, key: "hide" }]);
    expect(plan(read, ["a"])).toEqual([]);
    expect(plan(read, ["b_child"])).toEqual([]);
  });

  it("ignores subthreads, hidden threads, archived threads, and other sections", () => {
    expect(
      plan([
        thread("child", { parentThreadId: "a", isUnread: true }),
        thread("worker", { isHidden: true, isUnread: true }),
        thread("old", { isArchived: true, isUnread: true }),
        thread("elsewhere", { sectionId: "sec_other", isUnread: true }),
      ]),
    ).toEqual([{ sectionId, show: false, key: "hide" }]);
  });

  it("sends a decision once, and sends show again only when something new arrives", () => {
    const sent = new Map<string, string>();
    const first = plan([thread("a", { isUnread: true })]);
    expect(unsentRequests(first, sent)).toEqual(first);
    for (const request of first) sent.set(request.sectionId, request.key);
    expect(unsentRequests(first, sent)).toEqual([]);
    const newer = plan([thread("a", { isUnread: true, latestAttentionAt: 200 })]);
    expect(unsentRequests(newer, sent)).toEqual([{ sectionId, show: true, key: "show:a@200" }]);
  });
});
