import { describe, expect, it } from "vitest";
import { buildChannels, counterpartIds, incoming, messageBody, needsYouBody, outgoing, type ChannelInputs } from "./dispatch-model";

const SELF = "thr_coordinator";

function row(id: string, at: number, fields: Record<string, unknown>) {
  return { id, kind: "conversation", role: "user", createdAt: at, text: "", ...fields };
}

const selfRows = [
  row("u1", 1, { initiator: "user", text: "Make CSV export operational." }),
  row("g1", 5, { initiator: "agent", senderThreadId: "thr_planning", text: "[bb message from thread:thr_planning]\n\nQA is a hard gate. Pass it to your reports." }),
  row("d1", 7, { initiator: "system", systemMessageKind: "child-completed", systemMessageSubject: { kind: "thread", threadId: "thr_export", threadName: "CSV export" }, text: "[bb system]\n\n@thread:thr_export completed:\n\nThe e2e run is done." }),
  row("c1", 9, { initiator: "system", systemMessageKind: "child-needs-attention", systemMessageSubject: { kind: "thread", threadId: "thr_search", threadName: "Search filters" }, text: "Which file format should the export accept?" }),
  row("x1", 10, { initiator: "system", systemMessageKind: "ownership-assigned", systemMessageSubject: { kind: "thread", threadId: "thr_docs", threadName: "User guide" }, text: "assigned" }),
  { id: "a1", kind: "conversation", role: "assistant", createdAt: 11, text: "Reply to the user" },
  { id: "t1", kind: "turn", createdAt: 12 },
];

function inputs(overrides: Partial<ChannelInputs> = {}): ChannelInputs {
  return {
    selfId: SELF,
    parentId: null,
    childIds: ["thr_export", "thr_search", "thr_docs"],
    titles: new Map([["thr_export", "CSV export"], ["thr_search", "Search filters"], ["thr_docs", "User guide"], ["thr_planning", "Planning"]]),
    pending: new Set(),
    lastSeen: new Map(),
    selfRows,
    counterpartRows: new Map([
      ["thr_export", [
        row("p1", 2, { initiator: "agent", senderThreadId: SELF, text: "Build the Ladle stories." }),
        row("p2", 8, { initiator: "agent", senderThreadId: SELF, text: "Rerun QA.", turnRequest: { kind: "steer", status: "accepted" } }),
        row("p3", 3, { initiator: "agent", senderThreadId: "thr_someone_else", text: "From another worker" }),
      ]],
      ["thr_planning", [row("p4", 6, { initiator: "agent", senderThreadId: SELF, text: "Passed to all reports.", turnRequest: { kind: "message", status: "pending" } })]],
    ]),
    ...overrides,
  };
}

describe("message bodies", () => {
  it("strip bb's routing envelope", () => {
    expect(messageBody("[bb message from thread:thr_x]\n\nHello")).toBe("Hello");
    expect(messageBody("[bb system]\n\n@thread:thr_x completed:\n\nDone.")).toBe("Done.");
    expect(messageBody("Plain")).toBe("Plain");
  });
});

describe("needs-you text", () => {
  it("keeps only what the agent is waiting on, not core's guidance to the lead", () => {
    expect(needsYouBody("[bb system]\n\n@thread:thr_x needs help. Blocked on user question: Which format?\n\nReview the blocker. If you can resolve it, reply.")).toBe("Which format?");
    expect(needsYouBody("@thread:thr_x needs help.\n\nReview the blocker.")).toBe("");
  });
});

describe("channels", () => {
  it("opens a report's channel with the prompt it started with, only when its full history is loaded", () => {
    const rows = [row("s1", 1, { initiator: "user", text: "Build the carousel." }), row("s2", 4, { initiator: "agent", senderThreadId: SELF, text: "Also add WebP." })];
    expect(outgoing(rows, SELF, { isReport: true, historyComplete: true }).map((message) => `${message.dir}:${message.id}`)).toEqual(["brief:s1", "out:s2"]);
    expect(outgoing(rows, SELF, { isReport: true, historyComplete: false }).map((message) => message.id)).toEqual(["s2"]);
    expect(outgoing(rows, SELF, { isReport: false, historyComplete: true }).map((message) => message.id)).toEqual(["s2"]);
  });

  it("keeps only agent messages and child notices, keyed by the other thread", () => {
    const byThread = incoming(selfRows);
    expect([...byThread.keys()].sort()).toEqual(["thr_export", "thr_planning", "thr_search"]);
    expect(byThread.get("thr_export")?.[0]).toMatchObject({ dir: "finished", text: "The e2e run is done." });
  });

  it("reads what this thread sent from the counterpart's own rows, with persisted delivery state", () => {
    const sent = outgoing(inputs().counterpartRows.get("thr_export")!, SELF);
    expect(sent.map((message) => message.id)).toEqual(["p1", "p2"]);
    expect(sent[1]).toMatchObject({ steer: true, status: "accepted" });
    expect(outgoing(inputs().counterpartRows.get("thr_planning")!, SELF)[0]?.status).toBe("pending");
  });

  it("finds reports, the parent, and anyone who wrote in", () => {
    expect(counterpartIds({ selfId: SELF, parentId: "thr_root", childIds: ["thr_export"], selfRows })).toEqual(["thr_root", "thr_export", "thr_planning", "thr_search"]);
  });

  it("merges both directions in order, and marks new activity and needs-you", () => {
    const channels = buildChannels(inputs({ lastSeen: new Map([["thr_planning", 100]]) }));
    const dispatch = channels.find((channel) => channel.counterpartId === "thr_export")!;
    expect(dispatch.messages.map((message) => `${message.dir}:${message.id}`)).toEqual(["out:p1", "finished:d1", "out:p2"]);
    expect(dispatch).toMatchObject({ relation: "report", unread: true, needsYou: false });
    const planning = channels.find((channel) => channel.counterpartId === "thr_planning")!;
    expect(planning).toMatchObject({ relation: "peer", unread: false, title: "Planning" });
    const carousel = channels.find((channel) => channel.counterpartId === "thr_search")!;
    expect(carousel).toMatchObject({ needsYou: true, question: "Which file format should the export accept?" });
    const docs = channels.find((channel) => channel.counterpartId === "thr_docs")!;
    expect(docs.messages).toEqual([]);
  });

  it("splits a batched outcome notice per report and fills each from the report's last reply", () => {
    const batch = row("b1", 30, { initiator: "system", systemMessageKind: "child-outcome-batch", systemMessageSubject: { kind: "thread-batch", count: 2, outcomes: [{ threadId: "thr_export", status: "completed" }, { threadId: "thr_docs", status: "failed" }] }, text: "Child thread updates" });
    const channels = buildChannels(inputs({
      selfRows: [...selfRows, batch],
      counterpartRows: new Map([["thr_export", [{ id: "r1", kind: "conversation", role: "assistant", createdAt: 29, text: "Stories are ready." }, { id: "r2", kind: "conversation", role: "assistant", createdAt: 40, text: "Later reply" }]]]),
    }));
    expect(channels.find((channel) => channel.counterpartId === "thr_export")!.messages.at(-1)).toMatchObject({ id: "b1:thr_export", dir: "finished", text: "Stories are ready." });
    expect(channels.find((channel) => channel.counterpartId === "thr_docs")!.messages.at(-1)).toMatchObject({ dir: "failed", text: "" });
  });

  it("follows bb's live pending state once it's known, even when the notice is still the latest message", () => {
    const answeredInReport = inputs({ pendingKnown: true });
    expect(buildChannels(answeredInReport).find((channel) => channel.counterpartId === "thr_search")!.needsYou).toBe(false);
    const stillWaiting = inputs({ pendingKnown: true, pending: new Set(["thr_search"]) });
    expect(buildChannels(stillWaiting).find((channel) => channel.counterpartId === "thr_search")).toMatchObject({ needsYou: true, question: "Which file format should the export accept?" });
  });

  it("clears a needs-attention notice once something newer happens, unless bb still shows a pending interaction", () => {
    const answered = inputs({ counterpartRows: new Map([["thr_search", [row("r1", 20, { initiator: "agent", senderThreadId: SELF, text: "PNG and WebP." })]]]) });
    expect(buildChannels(answered).find((channel) => channel.counterpartId === "thr_search")!.needsYou).toBe(false);
    const stillPending = { ...answered, pending: new Set(["thr_search"]) };
    expect(buildChannels(stillPending).find((channel) => channel.counterpartId === "thr_search")!.needsYou).toBe(true);
  });
});
