import type { PluginBbSdk, ReadonlyJsonValue } from "@get-bb/plugin-sdk";

export const REPORT_KINDS = ["done", "blocked", "decision", "status"] as const;
export type ReportKind = (typeof REPORT_KINDS)[number];

export const ENVIRONMENT_CHOICES = ["default", "shared"] as const;
export type EnvironmentChoice = (typeof ENVIRONMENT_CHOICES)[number];

export const REPORT_MAX_CHARS = 8000;
const CHILD_LIST_LIMIT = 200;

const REPORT_HEADINGS: Record<ReportKind, string> = {
  done: "finished",
  blocked: "is blocked",
  decision: "needs a decision",
  status: "sent a status update",
};

export interface LastReport {
  kind: ReportKind;
  at: number;
}

export interface ChildLink {
  parentThreadId: string;
  lastReport: LastReport | null;
}

export interface SpawnChildInput {
  parentThreadId: string;
  prompt: string;
  title?: string;
  environment: EnvironmentChoice;
  providerId?: string;
  model?: string;
}

export interface ChildSummary {
  id: string;
  title: string;
  status: string;
  lastReport: LastReport | null;
}

export class MessagingError extends Error {}

function isReportKind(value: unknown): value is ReportKind {
  return (
    typeof value === "string" &&
    (REPORT_KINDS as readonly string[]).includes(value)
  );
}

export function parseChildLink(
  metadata: Readonly<Record<string, ReadonlyJsonValue>>,
): ChildLink | null {
  const parent = metadata.parentThreadId;
  if (typeof parent !== "string" || !/^thr_[a-z0-9]+$/u.test(parent)) {
    return null;
  }
  const raw = metadata.lastReport;
  let lastReport: LastReport | null = null;
  if (raw !== null && typeof raw === "object" && !Array.isArray(raw)) {
    const record = raw as Readonly<Record<string, ReadonlyJsonValue>>;
    if (isReportKind(record.kind) && typeof record.at === "number") {
      lastReport = { kind: record.kind, at: record.at };
    }
  }
  return { parentThreadId: parent, lastReport };
}

export function childInstructions(parentThreadId: string): string {
  return [
    `You are a child thread started by the Messaging plugin for parent thread ${JSON.stringify(parentThreadId)}.`,
    "Your parent is NOT notified when your turns end, and your final responses are NOT delivered to it.",
    "Report to the parent with the messaging_report_to_parent tool (or `bb messaging report`) only when:",
    "- done: the task is complete. Include the result, links, and anything the parent must act on.",
    "- blocked: you hit a new blocker you cannot resolve yourself.",
    "- decision: you need the parent to choose before you can continue.",
    "- status: the parent asked you for a status update.",
    "Send one report per event. Never report routine progress, acknowledgements, or thanks.",
    "Messages from the parent arrive as `[bb message from thread:...]`; answer them with a report only when they ask a question or request status.",
  ].join("\n");
}

export const PARENT_INSTRUCTIONS =
  "Messaging plugin: when the user asks you to delegate work to child threads that should stay quiet until they matter, start them with messaging_spawn_child (or `bb messaging spawn`). Those children report only when done, blocked, or needing a decision, so you are not woken on every child turn. Check them with messaging_list_children, ask one for an update with messaging_request_status, and send any other message with `bb thread tell <id>`. Archiving the parent archives its Messaging children.";

export function formatReport(
  childThreadId: string,
  kind: ReportKind,
  message: string,
): string {
  return `Messaging report: @thread:${childThreadId} ${REPORT_HEADINGS[kind]}.\n\n${message}`;
}

function threadTitle(thread: {
  title: string | null;
  titleFallback: string | null;
  id: string;
}): string {
  return thread.title ?? thread.titleFallback ?? thread.id;
}

async function liveThread(sdk: PluginBbSdk, threadId: string) {
  const thread = await sdk.threads.get({ threadId });
  if (thread.deletedAt !== null || thread.archivedAt !== null) {
    throw new MessagingError(`Thread ${threadId} is archived or deleted.`);
  }
  return thread;
}

export async function readChildLink(
  sdk: PluginBbSdk,
  threadId: string,
): Promise<ChildLink | null> {
  return parseChildLink(await sdk.threads.getPluginMetadata({ threadId }));
}

export async function spawnChild(sdk: PluginBbSdk, input: SpawnChildInput) {
  const parent = await liveThread(sdk, input.parentThreadId);
  let environment:
    | { type: "project-default" }
    | { type: "reuse"; environmentId: string };
  if (input.environment === "shared") {
    if (parent.environmentId === null) {
      throw new MessagingError(
        "The parent thread has no environment to share yet; use environment default.",
      );
    }
    environment = { type: "reuse", environmentId: parent.environmentId };
  } else {
    environment = { type: "project-default" };
  }
  return sdk.threads.spawn({
    projectId: parent.projectId,
    environment,
    prompt: input.prompt,
    lifecycleOwnerThreadId: parent.id,
    pluginMetadata: { parentThreadId: parent.id },
    ...(input.title === undefined ? {} : { title: input.title }),
    providerId: input.providerId ?? parent.providerId,
    ...(input.model === undefined ? {} : { model: input.model }),
  });
}

export async function sendReport(
  sdk: PluginBbSdk,
  childThreadId: string,
  kind: ReportKind,
  message: string,
): Promise<{ parentThreadId: string }> {
  const trimmed = message.trim();
  if (trimmed === "") throw new MessagingError("The report message is empty.");
  if (trimmed.length > REPORT_MAX_CHARS) {
    throw new MessagingError(
      `The report is ${trimmed.length} characters; keep it under ${REPORT_MAX_CHARS} and link to files or threads for detail.`,
    );
  }
  const link = await readChildLink(sdk, childThreadId);
  if (link === null) {
    throw new MessagingError(
      "This thread was not started by the Messaging plugin, so it has no parent to report to.",
    );
  }
  await liveThread(sdk, link.parentThreadId);
  await sdk.threads.send({
    threadId: link.parentThreadId,
    senderThreadId: childThreadId,
    mode: "auto",
    input: [
      {
        type: "text",
        text: formatReport(childThreadId, kind, trimmed),
        mentions: [],
      },
    ],
  });
  await sdk.threads.updatePluginMetadata({
    threadId: childThreadId,
    set: { lastReport: { kind, at: Date.now() } },
  });
  return { parentThreadId: link.parentThreadId };
}

export async function notifyParent(
  sdk: PluginBbSdk,
  childThreadId: string,
  text: string,
): Promise<void> {
  const link = await readChildLink(sdk, childThreadId);
  if (link === null) return;
  const parent = await sdk.threads.get({ threadId: link.parentThreadId });
  if (parent.deletedAt !== null || parent.archivedAt !== null) return;
  await sdk.threads.send({
    threadId: parent.id,
    senderThreadId: childThreadId,
    mode: "auto",
    input: [{ type: "text", text, mentions: [] }],
  });
}

export async function listChildren(
  sdk: PluginBbSdk,
  pluginId: string,
  parentThreadId: string,
): Promise<ChildSummary[]> {
  const parent = await sdk.threads.get({ threadId: parentThreadId });
  const candidates = await sdk.threads.list({
    projectId: parent.projectId,
    originPluginId: pluginId,
    includeHidden: true,
    limit: CHILD_LIST_LIMIT,
    archived: false,
  });
  const children = candidates.filter(
    (thread) => thread.lifecycleOwnerThreadId === parentThreadId,
  );
  return Promise.all(
    children.map(async (thread) => {
      const link = await readChildLink(sdk, thread.id);
      return {
        id: thread.id,
        title: threadTitle(thread),
        status: thread.status,
        lastReport: link?.lastReport ?? null,
      };
    }),
  );
}

export async function requestStatus(
  sdk: PluginBbSdk,
  parentThreadId: string,
  childThreadId: string,
): Promise<void> {
  const link = await readChildLink(sdk, childThreadId);
  if (link === null || link.parentThreadId !== parentThreadId) {
    throw new MessagingError(
      `Thread ${childThreadId} is not a Messaging child of ${parentThreadId}.`,
    );
  }
  await liveThread(sdk, childThreadId);
  await sdk.threads.send({
    threadId: childThreadId,
    senderThreadId: parentThreadId,
    mode: "queue-if-active",
    input: [
      {
        type: "text",
        text: "Your parent asked for a status update. Reply with exactly one messaging_report_to_parent call with kind status, then continue your task.",
        mentions: [],
      },
    ],
  });
}

export function formatChildren(children: ChildSummary[]): string {
  if (children.length === 0) return "No Messaging children.";
  return children
    .map((child) => {
      const report =
        child.lastReport === null
          ? "no report yet"
          : `last report ${child.lastReport.kind} at ${new Date(child.lastReport.at).toISOString()}`;
      return `@thread:${child.id} ${child.title} — ${child.status}, ${report}`;
    })
    .join("\n");
}
