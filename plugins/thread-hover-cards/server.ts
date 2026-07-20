import { defineRpcContract, type BbPluginApi } from "@bb/plugin-sdk";
import { z } from "zod";

const displayStatusSchema = z.enum([
  "active",
  "error",
  "host-reconnecting",
  "idle",
  "provisioning",
  "starting",
  "stopping",
  "waiting-for-host",
]);

const pullRequestSummarySchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("available"),
      number: z.number().int().positive(),
      signal: z.string(),
      state: z.enum(["closed", "draft", "merged", "open"]),
      title: z.string(),
      url: z.string().url(),
    })
    .strict(),
  z.object({ kind: z.literal("absent") }).strict(),
  z.object({ kind: z.literal("pending") }).strict(),
  z.object({ kind: z.literal("unavailable") }).strict(),
]);

const rpcDiagnosticsSchema = z
  .object({
    startedAt: z.number(),
    stages: z.array(
      z
        .object({
          cache: z
            .enum(["coalesced", "hit", "miss", "none", "stale"])
            .optional(),
          durationMs: z.number().nonnegative(),
          name: z.string(),
          outcome: z.enum(["error", "ok", "skipped", "unavailable"]),
        })
        .strict(),
    ),
    totalMs: z.number().nonnegative(),
  })
  .strict();

export type RpcDiagnostics = z.infer<typeof rpcDiagnosticsSchema>;

export const threadSummarySchema = z
  .object({
    currentTurnCompletedAt: z.number().nullable(),
    currentTurnStartedAt: z.number().nullable(),
    diagnostics: rpcDiagnosticsSchema,
    latestAssistantMessage: z.string().nullable(),
    permissionMode: z
      .enum([
        "accept-edits",
        "auto",
        "full",
        "readonly",
        "workspace-write",
      ])
      .nullable(),
    pullRequest: pullRequestSummarySchema,
    provider: z
      .object({
        displayName: z.string(),
        id: z.string(),
        logoUrl: z.string().nullable(),
        model: z.string(),
        reasoningLevel: z
          .enum([
            "none",
            "low",
            "medium",
            "high",
            "xhigh",
            "ultracode",
            "max",
            "ultra",
          ])
          .nullable(),
      })
      .strict(),
    repository: z
      .object({
        branch: z.string().nullable(),
        isGitRepository: z.boolean(),
        name: z.string(),
        path: z.string().nullable(),
      })
      .strict(),
    status: displayStatusSchema,
  })
  .strict();

export type ThreadSummary = z.infer<typeof threadSummarySchema>;

export const threadTimingSchema = z
  .object({
    currentTurnCompletedAt: z.number().nullable(),
    currentTurnStartedAt: z.number().nullable(),
    diagnostics: rpcDiagnosticsSchema,
    status: displayStatusSchema,
  })
  .strict();

export type ThreadTiming = z.infer<typeof threadTimingSchema>;

export const threadPullRequestSchema = z
  .object({
    diagnostics: rpcDiagnosticsSchema,
    pullRequest: pullRequestSummarySchema,
  })
  .strict();

export type ThreadPullRequest = z.infer<typeof threadPullRequestSchema>;

export const rpcContract = defineRpcContract({
  threadSummary: {
    input: z.object({ threadId: z.string().min(1) }).strict(),
    output: threadSummarySchema,
  },
  threadTiming: {
    input: z.object({ threadId: z.string().min(1) }).strict(),
    output: threadTimingSchema,
  },
  threadPullRequest: {
    input: z.object({ threadId: z.string().min(1) }).strict(),
    output: threadPullRequestSchema,
  },
});

async function safely<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch {
    return null;
  }
}

async function within<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T | null> {
  return await new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), timeoutMs);
    void promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
    );
  });
}

function normalizeMessage(value: string): string {
  const normalized = value
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[\t ]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return normalized.length > 1_600
    ? `${normalized.slice(0, 1_599).trimEnd()}…`
    : normalized;
}

type ThreadTimeline = Awaited<
  ReturnType<BbPluginApi["sdk"]["threads"]["timeline"]>
>;

function latestAssistantMessage(timeline: ThreadTimeline): string | null {
  for (let rowIndex = timeline.rows.length - 1; rowIndex >= 0; rowIndex -= 1) {
    const row = timeline.rows[rowIndex];
    if (!row) continue;

    const visibleRows = row.kind === "turn" ? (row.children ?? []) : [row];
    for (
      let visibleIndex = visibleRows.length - 1;
      visibleIndex >= 0;
      visibleIndex -= 1
    ) {
      const visibleRow = visibleRows[visibleIndex];
      if (
        visibleRow?.kind === "conversation" &&
        visibleRow.role === "assistant" &&
        visibleRow.text.trim().length > 0
      ) {
        return visibleRow.text;
      }
    }
  }

  return null;
}

function repositoryName(remoteUrl: string | null, fallback: string): string {
  if (!remoteUrl) return fallback;

  const scpPath = remoteUrl.match(/^[^@]+@[^:]+:(.+)$/)?.[1];
  let path = scpPath;
  if (!path) {
    try {
      path = new URL(remoteUrl).pathname;
    } catch {
      path = remoteUrl;
    }
  }

  const segments = path
    .replace(/\/+$/, "")
    .replace(/\.git$/, "")
    .split(/[/:]/)
    .filter(Boolean);
  return segments.slice(-2).join("/") || fallback;
}

function isRunningStatus(status: ThreadSummary["status"]): boolean {
  return (
    status === "active" ||
    status === "host-reconnecting" ||
    status === "provisioning" ||
    status === "starting" ||
    status === "stopping"
  );
}

interface TurnTiming {
  completedAt: number | null;
  startedAt: number | null;
}

const SUMMARY_LOOKUP_TIMEOUT_MS = 2_500;
const ACTIVE_TURN_EVENT_WAIT_MS = "1";
const STABLE_DESCRIPTOR_CACHE_TTL_MS = 60_000;
const PULL_REQUEST_CACHE_TTL_MS = 15_000;
const STABLE_DESCRIPTOR_CACHE_MAX_ENTRIES = 128;

type CacheSource = "coalesced" | "hit" | "miss" | "none" | "stale";

interface DiagnosticsRecorder {
  readonly startedAt: number;
  readonly startedMonotonicAt: number;
  readonly stages: RpcDiagnostics["stages"];
}

function monotonicNow(): number {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}

function roundedDuration(startedAt: number): number {
  return Math.max(0, Math.round((monotonicNow() - startedAt) * 10) / 10);
}

function createDiagnostics(): DiagnosticsRecorder {
  return {
    startedAt: Date.now(),
    startedMonotonicAt: monotonicNow(),
    stages: [],
  };
}

function finishDiagnostics(recorder: DiagnosticsRecorder): RpcDiagnostics {
  return {
    startedAt: recorder.startedAt,
    stages: recorder.stages,
    totalMs: roundedDuration(recorder.startedMonotonicAt),
  };
}

async function measureStage<T>(
  recorder: DiagnosticsRecorder,
  name: string,
  load: () => Promise<T>,
  options: { cache?: CacheSource; unavailableWhenNull?: boolean } = {},
): Promise<T> {
  const startedAt = monotonicNow();
  try {
    const value = await load();
    recorder.stages.push({
      ...(options.cache ? { cache: options.cache } : {}),
      durationMs: roundedDuration(startedAt),
      name,
      outcome:
        options.unavailableWhenNull && value === null ? "unavailable" : "ok",
    });
    return value;
  } catch (error) {
    recorder.stages.push({
      ...(options.cache ? { cache: options.cache } : {}),
      durationMs: roundedDuration(startedAt),
      name,
      outcome: "error",
    });
    throw error;
  }
}

async function measureCachedStage<T>(
  recorder: DiagnosticsRecorder,
  name: string,
  load: () => Promise<CacheResult<T>>,
): Promise<CacheResult<T>> {
  const startedAt = monotonicNow();
  try {
    const result = await load();
    recorder.stages.push({
      cache: result.source,
      durationMs: roundedDuration(startedAt),
      name,
      outcome: result.value === null ? "unavailable" : "ok",
    });
    return result;
  } catch (error) {
    recorder.stages.push({
      cache: "miss",
      durationMs: roundedDuration(startedAt),
      name,
      outcome: "error",
    });
    throw error;
  }
}

function recordSkippedStage(
  recorder: DiagnosticsRecorder,
  name: string,
): void {
  recorder.stages.push({
    cache: "none",
    durationMs: 0,
    name,
    outcome: "skipped",
  });
}

function recordDiagnostics(
  bb: BbPluginApi,
  rpc: "threadPullRequest" | "threadSummary" | "threadTiming",
  threadId: string,
  diagnostics: RpcDiagnostics,
): void {
  bb.log.debug(
    `thread-hover-cards:timing ${JSON.stringify({ diagnostics, rpc, threadId })}`,
  );
}

interface CacheResult<T> {
  source: Exclude<CacheSource, "none">;
  value: T | null;
}

class StableDescriptorCache {
  private readonly entries = new Map<
    string,
    { expiresAt: number; value: unknown }
  >();
  private readonly pending = new Map<string, Promise<unknown | null>>();

  constructor(
    private readonly ttlMs = STABLE_DESCRIPTOR_CACHE_TTL_MS,
    private readonly maxEntries = STABLE_DESCRIPTOR_CACHE_MAX_ENTRIES,
  ) {}

  private request<T>(
    key: string,
    load: () => Promise<T | null>,
  ): Promise<T | null> {
    const pending = this.pending.get(key);
    if (pending) return pending as Promise<T | null>;

    const request = load()
      .then((value) => {
        if (value !== null) {
          this.entries.set(key, {
            expiresAt: Date.now() + this.ttlMs,
            value,
          });
          while (this.entries.size > this.maxEntries) {
            const oldestKey = this.entries.keys().next().value as
              | string
              | undefined;
            if (oldestKey === undefined) break;
            this.entries.delete(oldestKey);
          }
        }
        return value;
      })
      .finally(() => {
        if (this.pending.get(key) === request) this.pending.delete(key);
      });
    this.pending.set(key, request);
    return request;
  }

  async get<T>(key: string, load: () => Promise<T | null>): Promise<CacheResult<T>> {
    const cached = this.entries.get(key);
    if (cached) {
      this.entries.delete(key);
      this.entries.set(key, cached);
      if (cached.expiresAt <= Date.now()) {
        void this.request(key, load).catch(() => undefined);
        return { source: "stale", value: cached.value as T };
      }
      return { source: "hit", value: cached.value as T };
    }

    if (this.pending.has(key)) {
      return { source: "coalesced", value: await this.request(key, load) };
    }
    return { source: "miss", value: await this.request(key, load) };
  }
}

async function currentTurnTiming(
  bb: BbPluginApi,
  threadId: string,
  status: ThreadSummary["status"],
  signal: AbortSignal,
  recorder: DiagnosticsRecorder,
): Promise<TurnTiming> {
  if (!isRunningStatus(status) && status !== "idle") {
    recordSkippedStage(recorder, "timeline");
    recordSkippedStage(recorder, "turnStartedEvent");
    return { completedAt: null, startedAt: null };
  }

  const timeline = await measureStage(
    recorder,
    "timeline",
    () =>
      safely(
        bb.sdk.threads.timeline(
          status === "idle"
            ? { threadId, segmentLimit: "1", signal }
            : {
                threadId,
                segmentLimit: "1",
                signal,
                summaryOnly: "true",
              },
        ),
      ),
    { unavailableWhenNull: true },
  );
  if (!timeline) {
    recordSkippedStage(recorder, "turnStartedEvent");
    return { completedAt: null, startedAt: null };
  }

  if (status === "idle") {
    recordSkippedStage(recorder, "turnStartedEvent");
    for (let index = timeline.rows.length - 1; index >= 0; index -= 1) {
      const row = timeline.rows[index];
      if (row?.kind === "turn") {
        return { completedAt: row.completedAt, startedAt: row.startedAt };
      }
    }
    return { completedAt: null, startedAt: null };
  }

  const anchorSeq = timeline.timelinePage.olderCursor?.anchorSeq ?? 1;
  const started = await measureStage(
    recorder,
    "turnStartedEvent",
    () =>
      safely(
        bb.sdk.threads.events.wait({
          afterSeq: String(Math.max(0, anchorSeq - 1)),
          signal,
          threadId,
          type: "turn/started",
          waitMs: ACTIVE_TURN_EVENT_WAIT_MS,
        }),
      ),
    { unavailableWhenNull: true },
  );
  const isRootTurn =
    started?.type === "turn/started" &&
    started.data.parentToolCallId === undefined &&
    started.scope.kind === "turn";

  return {
    completedAt: null,
    startedAt: isRootTurn ? started.createdAt : null,
  };
}

const PULL_REQUEST_SIGNALS = {
  blocked: "Blocked",
  checks_failed: "Checks failing",
  checks_pending: "Checks pending",
  changes_requested: "Changes requested",
  closed: "Closed",
  conflicts: "Conflicts",
  draft: "Draft",
  merged: "Merged",
  review_requested: "Review requested",
  ready_to_merge: "Ready to merge",
} as const;

function providerDisplayName(providerId: string): string {
  switch (providerId) {
    case "acp-cursor":
      return "Cursor";
    case "claude-code":
      return "Claude";
    case "codex":
      return "Codex";
    case "pi":
      return "Pi";
    default:
      return providerId;
  }
}

export default function plugin(bb: BbPluginApi): void {
  const stableDescriptors = new StableDescriptorCache();
  const pullRequests = new StableDescriptorCache(PULL_REQUEST_CACHE_TTL_MS);

  bb.rpc.register(rpcContract, {
    async threadSummary({ threadId }) {
      const recorder = createDiagnostics();
      const deadlineAt = Date.now() + SUMMARY_LOOKUP_TIMEOUT_MS;
      const remainingMs = (): number => Math.max(1, deadlineAt - Date.now());
      const signal = AbortSignal.timeout(SUMMARY_LOOKUP_TIMEOUT_MS);
      try {
        const thread = await measureStage(
          recorder,
          "thread",
          () =>
            within(
              safely(
                bb.sdk.threads.get({
                  include: "environment",
                  signal,
                  threadId,
                }),
              ),
              remainingMs(),
            ),
          { unavailableWhenNull: true },
        );
        if (!thread) throw new Error("Thread summary unavailable.");

        let environment =
          "environment" in thread ? (thread.environment ?? null) : null;
        if (!("environment" in thread) && thread.environmentId) {
          environment = await measureStage(
            recorder,
            "environment",
            () =>
              within(
                safely(
                  bb.sdk.environments.get({
                    environmentId: thread.environmentId!,
                    signal,
                  }),
                ),
                remainingMs(),
              ),
            { unavailableWhenNull: true },
          );
        } else {
          recorder.stages.push({
            cache: "none",
            durationMs: 0,
            name: "environment",
            outcome: environment ? "ok" : "unavailable",
          });
        }

        const projectPromise = measureCachedStage(
          recorder,
          "project",
          () =>
            stableDescriptors.get(`project:${thread.projectId}`, () =>
              within(
                safely(
                  bb.sdk.projects.get({
                    projectId: thread.projectId,
                    signal,
                  }),
                ),
                remainingMs(),
              ),
            ),
        );
        const executionOptionsPromise = measureStage(
          recorder,
          "executionOptions",
          () =>
            within(
              safely(
                bb.sdk.threads.defaultExecutionOptions({ signal, threadId }),
              ),
              remainingMs(),
            ),
          { unavailableWhenNull: true },
        );
        const messageTimelinePromise = measureStage(
          recorder,
          "messageTimeline",
          () =>
            within(
              safely(
                bb.sdk.threads.timeline({
                  includeNestedRows: "true",
                  segmentLimit: "1",
                  signal,
                  threadId,
                }),
              ),
              remainingMs(),
            ),
          { unavailableWhenNull: true },
        );
        const [projectResult, executionOptions, messageTimeline] =
          await Promise.all([
            projectPromise,
            executionOptionsPromise,
            messageTimelinePromise,
          ]);
        const project = projectResult.value;
        const isGitRepository =
          environment?.isGitRepo ?? project?.gitRemoteUrl != null;
        const normalizedAssistantMessage = normalizeMessage(
          messageTimeline
            ? (latestAssistantMessage(messageTimeline) ?? "")
            : "",
        );
        const diagnostics = finishDiagnostics(recorder);
        recordDiagnostics(bb, "threadSummary", threadId, diagnostics);

        return {
          currentTurnCompletedAt: null,
          currentTurnStartedAt: null,
          diagnostics,
          latestAssistantMessage: normalizedAssistantMessage || null,
          permissionMode: executionOptions?.permissionMode ?? null,
          pullRequest: isGitRepository
            ? { kind: "pending" as const }
            : { kind: "absent" as const },
          provider: {
            displayName: providerDisplayName(thread.providerId),
            id: thread.providerId,
            logoUrl: null,
            model: executionOptions?.model ?? "Model unavailable",
            reasoningLevel: executionOptions?.reasoningLevel ?? null,
          },
          repository: {
            branch: environment?.branchName ?? null,
            isGitRepository,
            name: repositoryName(
              project?.gitRemoteUrl ?? null,
              project?.name ?? "Repository unavailable",
            ),
            path: environment?.path ?? null,
          },
          status: thread.runtime.displayStatus,
        };
      } catch (error) {
        recordDiagnostics(
          bb,
          "threadSummary",
          threadId,
          finishDiagnostics(recorder),
        );
        throw error;
      }
    },
    async threadTiming({ threadId }) {
      const recorder = createDiagnostics();
      const deadlineAt = Date.now() + SUMMARY_LOOKUP_TIMEOUT_MS;
      const remainingMs = (): number => Math.max(1, deadlineAt - Date.now());
      const signal = AbortSignal.timeout(SUMMARY_LOOKUP_TIMEOUT_MS);
      try {
        const thread = await measureStage(
          recorder,
          "thread",
          () =>
            within(
              safely(bb.sdk.threads.get({ signal, threadId })),
              remainingMs(),
            ),
          { unavailableWhenNull: true },
        );
        if (!thread) throw new Error("Thread timing unavailable.");

        const timing = await within(
          currentTurnTiming(
            bb,
            threadId,
            thread.runtime.displayStatus,
            signal,
            recorder,
          ),
          remainingMs(),
        );
        const diagnostics = finishDiagnostics(recorder);
        recordDiagnostics(bb, "threadTiming", threadId, diagnostics);
        return {
          currentTurnCompletedAt: timing?.completedAt ?? null,
          currentTurnStartedAt: timing?.startedAt ?? null,
          diagnostics,
          status: thread.runtime.displayStatus,
        };
      } catch (error) {
        recordDiagnostics(
          bb,
          "threadTiming",
          threadId,
          finishDiagnostics(recorder),
        );
        throw error;
      }
    },
    async threadPullRequest({ threadId }) {
      const recorder = createDiagnostics();
      const deadlineAt = Date.now() + SUMMARY_LOOKUP_TIMEOUT_MS;
      const remainingMs = (): number => Math.max(1, deadlineAt - Date.now());
      const signal = AbortSignal.timeout(SUMMARY_LOOKUP_TIMEOUT_MS);
      try {
        const thread = await measureStage(
          recorder,
          "thread",
          () =>
            within(
              safely(
                bb.sdk.threads.get({
                  include: "environment",
                  signal,
                  threadId,
                }),
              ),
              remainingMs(),
            ),
          { unavailableWhenNull: true },
        );
        if (!thread) throw new Error("Thread pull request unavailable.");

        let environment =
          "environment" in thread ? (thread.environment ?? null) : null;
        if (!("environment" in thread) && thread.environmentId) {
          environment = await measureStage(
            recorder,
            "environment",
            () =>
              within(
                safely(
                  bb.sdk.environments.get({
                    environmentId: thread.environmentId!,
                    signal,
                  }),
                ),
                remainingMs(),
              ),
            { unavailableWhenNull: true },
          );
        } else {
          recorder.stages.push({
            cache: "none",
            durationMs: 0,
            name: "environment",
            outcome: environment ? "ok" : "unavailable",
          });
        }

        if (!thread.environmentId || environment?.isGitRepo === false) {
          recordSkippedStage(recorder, "pullRequest");
          const diagnostics = finishDiagnostics(recorder);
          recordDiagnostics(bb, "threadPullRequest", threadId, diagnostics);
          return { diagnostics, pullRequest: { kind: "absent" as const } };
        }

        const pullRequestResult = await measureCachedStage(
          recorder,
          "pullRequest",
          () =>
            pullRequests.get(`pull-request:${thread.environmentId}`, () =>
              within(
                safely(
                  bb.sdk.environments.pullRequest({
                    environmentId: thread.environmentId!,
                    signal,
                  }),
                ),
                remainingMs(),
              ),
            ),
        );
        const result = pullRequestResult.value;
        let pullRequest: ThreadPullRequest["pullRequest"];
        if (result?.outcome === "absent") {
          pullRequest = { kind: "absent" };
        } else if (result?.outcome === "available") {
          const source = result.pullRequest;
          const signalLabel =
            source.attention === "none"
              ? source.checks.state === "passing"
                ? "Checks passing"
                : source.state === "open"
                  ? "Open"
                  : source.state[0]!.toUpperCase() + source.state.slice(1)
              : PULL_REQUEST_SIGNALS[source.attention];
          pullRequest = {
            kind: "available",
            number: source.number,
            signal: signalLabel,
            state: source.state,
            title: source.title,
            url: source.url,
          };
        } else {
          pullRequest = { kind: "unavailable" };
        }
        const diagnostics = finishDiagnostics(recorder);
        recordDiagnostics(bb, "threadPullRequest", threadId, diagnostics);
        return { diagnostics, pullRequest };
      } catch (error) {
        recordDiagnostics(
          bb,
          "threadPullRequest",
          threadId,
          finishDiagnostics(recorder),
        );
        throw error;
      }
    },
  });

  bb.log.info("Thread hover cards loaded.");
}
