// Dispatch: one channel per agent a thread talks with. Built only from bb's
// persisted timeline rows, so every label says what bb stored and nothing more.

export interface TimelineConversationRow {
  id: string;
  kind: "conversation";
  role: "user" | "assistant";
  createdAt: number;
  text: string;
  initiator?: "user" | "agent" | "system" | string | null;
  senderThreadId?: string | null;
  systemMessageKind?: string | null;
  systemMessageSubject?: {
    kind: string;
    threadId?: string;
    threadName?: string;
    /** For "thread-batch": one outcome per report that finished in the same notice. */
    outcomes?: readonly { threadId: string; status: string }[];
  } | null;
  turnRequest?: { kind?: string; status?: string } | null;
}

export type ChannelDirection = "brief" | "out" | "in" | "finished" | "failed" | "interrupted" | "needs-you";

export interface ChannelMessage {
  id: string;
  dir: ChannelDirection;
  at: number;
  text: string;
  /** Persisted turn-request state for a sent message: pending (queued) or rejected (not delivered). */
  status?: "pending" | "accepted" | "rejected";
  steer?: boolean;
}

export type Relation = "parent" | "report" | "peer";

export interface Channel {
  counterpartId: string;
  title: string;
  relation: Relation;
  messages: ChannelMessage[];
  latestAt: number;
  unread: boolean;
  needsYou: boolean;
  /** What the counterpart is waiting on the user for, when bb recorded it. */
  question: string | null;
}

const CHILD_KINDS: Record<string, ChannelDirection> = {
  "child-completed": "finished",
  "child-failed": "failed",
  "child-interrupted": "interrupted",
  "child-needs-attention": "needs-you",
};

export function isConversationRow(row: unknown): row is TimelineConversationRow {
  return typeof row === "object" && row !== null && (row as { kind?: unknown }).kind === "conversation";
}

/** Drop the routing envelope bb wraps around agent and system messages. */
export function messageBody(text: string): string {
  return text
    .replace(/^\[bb message from thread:[^\]]+\]\s*/u, "")
    .replace(/^\[bb system\]\s*/u, "")
    .replace(/^@thread:\S+\s+(?:completed|failed|was interrupted|needs (?:your )?attention)[^:\n]*:\s*/u, "")
    .trim();
}

/**
 * A needs-attention notice is addressed to the lead ("@thread:x needs help.
 * Blocked on user question: …", then guidance). Keep only what the agent is
 * waiting on.
 */
export function needsYouBody(text: string): string {
  const body = messageBody(text);
  const blocked = /Blocked on [^:\n]+:\s*([^\n]+)/u.exec(body);
  if (blocked) return blocked[1]!.trim();
  return body.replace(/^@thread:\S+\s+needs help\.?[ \t]*/u, "").split(/\n\s*\n/u)[0]!.trim();
}

/** Messages and results other threads sent to this one, keyed by sender. */
export function incoming(rows: readonly unknown[]): Map<string, ChannelMessage[]> {
  const byThread = new Map<string, ChannelMessage[]>();
  const add = (threadId: string, message: ChannelMessage) => {
    const list = byThread.get(threadId) ?? [];
    list.push(message);
    byThread.set(threadId, list);
  };
  for (const row of rows) {
    if (!isConversationRow(row) || row.role !== "user") continue;
    if (row.initiator === "agent" && row.senderThreadId) {
      add(row.senderThreadId, { id: row.id, dir: "in", at: row.createdAt, text: messageBody(row.text) });
    } else if (row.initiator === "system" && row.systemMessageKind === "child-outcome-batch") {
      // bb batches reports that finish together; the notice carries outcomes but no report text.
      for (const outcome of row.systemMessageSubject?.outcomes ?? []) {
        const dir: ChannelDirection = outcome.status === "failed" ? "failed" : outcome.status === "interrupted" ? "interrupted" : "finished";
        add(outcome.threadId, { id: `${row.id}:${outcome.threadId}`, dir, at: row.createdAt, text: "" });
      }
    } else if (row.initiator === "system" && row.systemMessageKind && row.systemMessageKind in CHILD_KINDS) {
      const subject = row.systemMessageSubject;
      if (subject?.kind === "thread" && subject.threadId) {
        const dir = CHILD_KINDS[row.systemMessageKind]!;
        add(subject.threadId, { id: row.id, dir, at: row.createdAt, text: dir === "needs-you" ? needsYouBody(row.text) : messageBody(row.text) });
      }
    }
  }
  return byThread;
}

/**
 * What this thread sent to a counterpart: rows in the counterpart's timeline sent by this thread.
 * For a report this thread started, its first prompt opens the channel as a "brief"; bb records a
 * spawn prompt without a sender, so it's labelled as the prompt the thread started with, not a message.
 */
export function outgoing(counterpartRows: readonly unknown[], selfId: string, opts: { isReport?: boolean; historyComplete?: boolean } = {}): ChannelMessage[] {
  const messages: ChannelMessage[] = [];
  if (opts.isReport && opts.historyComplete) {
    const first = counterpartRows.find(isConversationRow);
    if (first && first.role === "user" && first.initiator === "user" && !first.senderThreadId) {
      messages.push({ id: first.id, dir: "brief", at: first.createdAt, text: messageBody(first.text) });
    }
  }
  for (const row of counterpartRows) {
    if (!isConversationRow(row) || row.role !== "user" || row.senderThreadId !== selfId) continue;
    const status = row.turnRequest?.status;
    messages.push({
      id: row.id,
      dir: "out",
      at: row.createdAt,
      text: messageBody(row.text),
      ...(status === "pending" || status === "accepted" || status === "rejected" ? { status } : {}),
      ...(row.turnRequest?.kind === "steer" ? { steer: true } : {}),
    });
  }
  return messages;
}

export interface ChannelInputs {
  selfId: string;
  parentId: string | null;
  /** This thread's reports, in sidebar order. */
  childIds: readonly string[];
  titles: ReadonlyMap<string, string>;
  /** Threads currently waiting on a pending interaction. */
  pending: ReadonlySet<string>;
  /** Whether `pending` is bb's live state. Until it is, a latest needs-attention notice stands in. */
  pendingKnown?: boolean;
  /** When the user last opened each channel. */
  lastSeen: ReadonlyMap<string, number>;
  selfRows: readonly unknown[];
  counterpartRows: ReadonlyMap<string, readonly unknown[]>;
  /** Counterparts whose full history is loaded, so their first row is their first prompt. */
  completeHistory?: ReadonlySet<string>;
}

/** Peers worth a channel: anyone who wrote to this thread, plus its parent and reports. */
export function counterpartIds(inputs: Pick<ChannelInputs, "selfId" | "parentId" | "childIds" | "selfRows">): string[] {
  const ids = new Set<string>();
  if (inputs.parentId) ids.add(inputs.parentId);
  for (const id of inputs.childIds) ids.add(id);
  for (const id of incoming(inputs.selfRows).keys()) ids.add(id);
  ids.delete(inputs.selfId);
  return [...ids];
}

/** A result notice without text takes the report's own last reply before it. */
function fillResultText(message: ChannelMessage, counterpartRows: readonly unknown[]): ChannelMessage {
  if (message.text || message.dir === "in" || message.dir === "out" || message.dir === "brief") return message;
  const reply = counterpartRows
    .filter(isConversationRow)
    .filter((row) => row.role === "assistant" && row.createdAt <= message.at)
    .at(-1);
  return reply ? { ...message, text: reply.text.trim() } : message;
}

export function buildChannels(inputs: ChannelInputs): Channel[] {
  const fromOthers = incoming(inputs.selfRows);
  const order = counterpartIds(inputs);
  return order.map((counterpartId) => {
    const theirRows = inputs.counterpartRows.get(counterpartId) ?? [];
    const messages = [
      ...(fromOthers.get(counterpartId) ?? []).map((message) => fillResultText(message, theirRows)),
      ...outgoing(inputs.counterpartRows.get(counterpartId) ?? [], inputs.selfId, {
        isReport: inputs.childIds.includes(counterpartId),
        historyComplete: inputs.completeHistory?.has(counterpartId) ?? false,
      }),
    ].sort((a, b) => a.at - b.at || a.id.localeCompare(b.id));
    const latestAt = messages.at(-1)?.at ?? 0;
    const latestInbound = [...messages].reverse().find((message) => message.dir !== "out" && message.dir !== "brief");
    const lastNeedsYou = [...messages].reverse().find((message) => message.dir === "needs-you");
    // bb's pending interaction is the live answer; a reply in the report's own thread clears it there.
    const noticeIsLatest = lastNeedsYou !== undefined && messages.at(-1) === lastNeedsYou;
    const needsYou = inputs.pending.has(counterpartId) || (!inputs.pendingKnown && noticeIsLatest);
    return {
      counterpartId,
      title: inputs.titles.get(counterpartId) ?? counterpartId,
      relation: counterpartId === inputs.parentId ? "parent" : inputs.childIds.includes(counterpartId) ? "report" : "peer",
      messages,
      latestAt,
      unread: latestInbound !== undefined && latestInbound.at > (inputs.lastSeen.get(counterpartId) ?? 0),
      needsYou,
      question: needsYou && latestInbound?.dir === "needs-you" ? latestInbound.text : null,
    };
  });
}
