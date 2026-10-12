import { describe, expect, it } from "vitest";
import { buildChannels, counterpartIds, incoming, messageBody, needsYouBody, outgoing, type ChannelInputs } from "./dispatch-model";

const SELF = "thr_ops";

function row(id: string, at: number, fields: Record<string, unknown>) {
  return { id, kind: "conversation", role: "user", createdAt: at, text: "", ...fields };
}

const selfRows = [
  row("u1", 1, { initiator: "user", text: "Make Dispatch operational." }),
  row("g1", 5, { initiator: "agent", senderThreadId: "thr_growth", text: "[bb message from thread:thr_growth]\n\nQA is a hard gate. Pass it to your reports." }),
  row("d1", 7, { initiator: "system", systemMessageKind: "child-completed", systemMessageSubject: { kind: "thread", threadId: "thr_dispatch", threadName: "Dispatch" }, text: "[bb system]\n\n@thread:thr_dispatch completed:\n\nThe e2e run is done." }),
  row("c1", 9, { initiator: "system", systemMessageKind: "child-needs-attention", systemMessageSubject: { kind: "thread", threadId: "thr_carousel", threadName: "Image carousel" }, text: "Which file format should #418 accept?" }),
  row("x1", 10, { initiator: "system", systemMessageKind: "ownership-assigned", systemMessageSubject: { kind: "thread", threadId: "thr_moss", threadName: "Moss viewer" }, text: "assigned" }),
  { id: "a1", kind: "conversation", role: "assistant", createdAt: 11, text: "Reply to the user" },
  { id: "t1", kind: "turn", createdAt: 12 },
];

function inputs(overrides: Partial<ChannelInputs> = {}): ChannelInputs {
  return {
    selfId: SELF,
    parentId: null,
    childIds: ["thr_dispatch", "thr_carousel", "thr_moss"],
    titles: new Map([["thr_dispatch", "Dispatch"], ["thr_carousel", "Image carousel"], ["thr_moss", "Moss viewer"], ["thr_growth", "🎯 Growth"]]),
    pending: new Set(),
    lastSeen: new Map(),
    selfRows,
    counterpartRows: new Map([
      ["thr_dispatch", [
        row("p1", 2, { initiator: "agent", senderThreadId: SELF, text: "Build the Ladle stories." }),
        row("p2", 8, { initiator: "agent", senderThreadId: SELF, text: "Rerun QA.", turnRequest: { kind: "steer", status: "accepted" } }),
        row("p3", 3, { initiator: "agent", senderThreadId: "thr_someone_else", text: "Not from Ops Tools" }),
      ]],
      ["thr_growth", [row("p4", 6, { initiator: "agent", senderThreadId: SELF, text: "Passed to all reports.", turnRequest: { kind: "message", status: "pending" } })]],
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
    expect([...byThread.keys()].sort()).toEqual(["thr_carousel", "thr_dispatch", "thr_growth"]);
    expect(byThread.get("thr_dispatch")?.[0]).toMatchObject({ dir: "finished", text: "The e2e run is done." });
  });

  it("reads what this thread sent from the counterpart's own rows, with persisted delivery state", () => {
    const sent = outgoing(inputs().counterpartRows.get("thr_dispatch")!, SELF);
    expect(sent.map((message) => message.id)).toEqual(["p1", "p2"]);
    expect(sent[1]).toMatchObject({ steer: true, status: "accepted" });
    expect(outgoing(inputs().counterpartRows.get("thr_growth")!, SELF)[0]?.status).toBe("pending");
  });

  it("finds reports, the parent, and anyone who wrote in", () => {
    expect(counterpartIds({ selfId: SELF, parentId: "thr_root", childIds: ["thr_dispatch"], selfRows })).toEqual(["thr_root", "thr_dispatch", "thr_growth", "thr_carousel"]);
  });

  it("merges both directions in order, and marks new activity and needs-you", () => {
    const channels = buildChannels(inputs({ lastSeen: new Map([["thr_growth", 100]]) }));
    const dispatch = channels.find((channel) => channel.counterpartId === "thr_dispatch")!;
    expect(dispatch.messages.map((message) => `${message.dir}:${message.id}`)).toEqual(["out:p1", "finished:d1", "out:p2"]);
    expect(dispatch).toMatchObject({ relation: "report", unread: true, needsYou: false });
    const growth = channels.find((channel) => channel.counterpartId === "thr_growth")!;
    expect(growth).toMatchObject({ relation: "peer", unread: false, title: "🎯 Growth" });
    const carousel = channels.find((channel) => channel.counterpartId === "thr_carousel")!;
    expect(carousel).toMatchObject({ needsYou: true, question: "Which file format should #418 accept?" });
    const moss = channels.find((channel) => channel.counterpartId === "thr_moss")!;
    expect(moss.messages).toEqual([]);
  });

  it("clears a needs-attention notice once something newer happens, unless bb still shows a pending interaction", () => {
    const answered = inputs({ counterpartRows: new Map([["thr_carousel", [row("r1", 20, { initiator: "agent", senderThreadId: SELF, text: "PNG and WebP." })]]]) });
    expect(buildChannels(answered).find((channel) => channel.counterpartId === "thr_carousel")!.needsYou).toBe(false);
    const stillPending = { ...answered, pending: new Set(["thr_carousel"]) };
    expect(buildChannels(stillPending).find((channel) => channel.counterpartId === "thr_carousel")!.needsYou).toBe(true);
  });
});
