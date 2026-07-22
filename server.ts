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
    repository: z
      .object({
        branch: z.string().nullable(),
        path: z.string().nullable(),
      })
      .strict(),
  })
  .strict();

export type ThreadPullRequest = z.infer<typeof threadPullRequestSchema>;

export const rpcContract = defineRpcContract({
  threadSummary: {
    input: z
      .object({
        clientId: z.string().min(1).max(128).optional(),
        generation: z.number().int().nonnegative().optional(),
        threadId: z.string().min(1),
      })
      .strict(),
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

type ThreadConversationOutline = Awaited<
  ReturnType<BbPluginApi["sdk"]["threads"]["conversationOutline"]>
>;
type ThreadTimeline = Awaited<
  ReturnType<BbPluginApi["sdk"]["threads"]["timeline"]>
>;

function latestOutlineAssistantMessage(
  outline: ThreadConversationOutline,
): string | null {
  // conversationOutline is BB's unpaginated includeNestedRows:false timeline
  // projection, so it preserves the canonical visible message order without
  // constructing the timeline's much larger work-row payload.
  for (let index = outline.items.length - 1; index >= 0; index -= 1) {
    const item = outline.items[index];
    if (item?.role === "assistant" && item.preview.trim().length > 0) {
      return item.preview;
    }
  }

  return null;
}

function latestTimelineAssistantMessage(timeline: ThreadTimeline): string | null {
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

interface BackgroundCacheRefreshTiming {
  cache: "stale";
  durationMs: number;
  outcome: "error" | "ok" | "unavailable";
  stage: string;
  startedAt: number;
}

type BackgroundCacheRefreshObserver = (
  timing: BackgroundCacheRefreshTiming,
) => void;

class StableDescriptorCache {
  private readonly entries = new Map<
    string,
    { expiresAt: number; value: unknown }
  >();
  private readonly invalidatedPending = new Set<string>();
  private readonly pending = new Map<string, Promise<unknown | null>>();

  constructor(
    private readonly ttlMs = STABLE_DESCRIPTOR_CACHE_TTL_MS,
    private readonly maxEntries = STABLE_DESCRIPTOR_CACHE_MAX_ENTRIES,
    private readonly stage = "descriptor",
    private readonly observeBackgroundRefresh?: BackgroundCacheRefreshObserver,
  ) {}

  delete(key: string): void {
    this.entries.delete(key);
    if (this.pending.has(key)) this.invalidatedPending.add(key);
  }

  private request<T>(
    key: string,
    load: () => Promise<T | null>,
  ): Promise<T | null> {
    const pending = this.pending.get(key);
    if (pending) return pending as Promise<T | null>;

    const request = load()
      .then((value) => {
        if (value !== null && !this.invalidatedPending.has(key)) {
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
        if (this.pending.get(key) === request) {
          this.pending.delete(key);
          this.invalidatedPending.delete(key);
        }
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
        const refreshIsPending = this.pending.has(key);
        const startedAt = monotonicNow();
        const startedAtEpoch = Date.now();
        const refresh = this.request(key, load);
        if (!refreshIsPending) {
          void refresh.then(
            (value) => {
              this.observeBackgroundRefresh?.({
                cache: "stale",
                durationMs: roundedDuration(startedAt),
                outcome: value === null ? "unavailable" : "ok",
                stage: this.stage,
                startedAt: startedAtEpoch,
              });
            },
            () => {
              this.observeBackgroundRefresh?.({
                cache: "stale",
                durationMs: roundedDuration(startedAt),
                outcome: "error",
                stage: this.stage,
                startedAt: startedAtEpoch,
              });
            },
          );
        }
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

type SummaryGateRelease = () => void;

interface QueuedSummaryRequest {
  clientId: string;
  generation: number;
  resolve: (release: SummaryGateRelease | null) => void;
  tracked: boolean;
}

class LatestSummaryRequestGate {
  private active = 0;
  private legacyRequest = 0;
  private readonly latestGeneration = new Map<string, number>();
  private readonly queue: QueuedSummaryRequest[] = [];

  constructor(
    private readonly concurrency: number,
    private readonly maxTrackedClients = 128,
  ) {}

  acquire(
    clientId: string | undefined,
    generation: number | undefined,
  ): Promise<SummaryGateRelease | null> {
    const tracked = clientId !== undefined && generation !== undefined;
    const requestClientId = tracked
      ? clientId
      : `legacy-${(this.legacyRequest += 1)}`;
    const requestGeneration = tracked ? generation : 0;
    if (tracked) {
      const latest = this.latestGeneration.get(requestClientId);
      if (latest !== undefined && requestGeneration < latest) {
        return Promise.resolve(null);
      }
      this.latestGeneration.delete(requestClientId);
      this.latestGeneration.set(requestClientId, requestGeneration);
      while (this.latestGeneration.size > this.maxTrackedClients) {
        const oldestClientId = this.latestGeneration.keys().next().value;
        if (oldestClientId === undefined) break;
        this.latestGeneration.delete(oldestClientId);
      }
    }

    return new Promise((resolve) => {
      this.queue.push({
        clientId: requestClientId,
        generation: requestGeneration,
        resolve,
        tracked,
      });
      this.pump();
    });
  }

  private pump(): void {
    while (this.active < this.concurrency) {
      const request = this.queue.shift();
      if (!request) return;
      if (
        request.tracked &&
        this.latestGeneration.get(request.clientId) !== request.generation
      ) {
        request.resolve(null);
        continue;
      }

      this.active += 1;
      let released = false;
      request.resolve(() => {
        if (released) return;
        released = true;
        this.active -= 1;
        this.pump();
      });
    }
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
  const recordBackgroundRefresh: BackgroundCacheRefreshObserver = (timing) => {
    bb.log.debug(
      `thread-hover-cards:cache-refresh ${JSON.stringify(timing)}`,
    );
  };
  const stableDescriptors = new StableDescriptorCache(
    STABLE_DESCRIPTOR_CACHE_TTL_MS,
    STABLE_DESCRIPTOR_CACHE_MAX_ENTRIES,
    "project",
    recordBackgroundRefresh,
  );
  const pullRequests = new StableDescriptorCache(
    PULL_REQUEST_CACHE_TTL_MS,
    STABLE_DESCRIPTOR_CACHE_MAX_ENTRIES,
    "pullRequest",
    recordBackgroundRefresh,
  );
  const summaryRequests = new LatestSummaryRequestGate(2);

  bb.rpc.register(rpcContract, {
    async threadSummary({ clientId, generation, threadId }) {
      const recorder = createDiagnostics();
      const deadlineAt = Date.now() + SUMMARY_LOOKUP_TIMEOUT_MS;
      const remainingMs = (): number => Math.max(1, deadlineAt - Date.now());
      const gateStartedAt = monotonicNow();
      const releaseSummaryRequest = await summaryRequests.acquire(
        clientId,
        generation,
      );
      recorder.stages.push({
        cache: "none",
        durationMs: roundedDuration(gateStartedAt),
        name: "requestGate",
        outcome: releaseSummaryRequest ? "ok" : "skipped",
      });
      const signal = AbortSignal.timeout(remainingMs());
      try {
        if (!releaseSummaryRequest) {
          throw new Error("Thread summary request superseded.");
        }
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

        const skipProject =
          environment?.workspaceProvisionType === "personal" &&
          !environment.isGitRepo;
        if (skipProject) recordSkippedStage(recorder, "project");
        const projectPromise = skipProject
          ? Promise.resolve({ source: "hit" as const, value: null })
          : measureCachedStage(recorder, "project", () =>
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
        const loadOutlineMessage = (
          stageName: "messageOutline" | "messageOutlineFallback",
        ): Promise<string | null> =>
          measureStage(
            recorder,
            stageName,
            () =>
              within(
                safely(
                  bb.sdk.threads.conversationOutline({
                    signal,
                    threadId,
                  }),
                ),
                remainingMs(),
              ),
            { unavailableWhenNull: true },
          ).then((outline) =>
            outline ? latestOutlineAssistantMessage(outline) : null,
          );
        const latestAssistantMessagePromise: Promise<string | null> =
          isRunningStatus(thread.runtime.displayStatus)
            ? loadOutlineMessage("messageOutline")
            : measureStage(
                recorder,
                "messageTimeline",
                () =>
                  within(
                    safely(
                      bb.sdk.threads.timeline({
                        includeNestedRows: "false",
                        segmentLimit: "1",
                        signal,
                        threadId,
                      }),
                    ),
                    remainingMs(),
                  ),
                { unavailableWhenNull: true },
              ).then((timeline) => {
                const latestMessage = timeline
                  ? latestTimelineAssistantMessage(timeline)
                  : null;
                return (
                  latestMessage ??
                  loadOutlineMessage("messageOutlineFallback")
                );
              });
        const [projectResult, executionOptions, latestAssistantMessage] =
          await Promise.all([
            projectPromise,
            executionOptionsPromise,
            latestAssistantMessagePromise,
          ]);
        const project = projectResult.value;
        const isGitRepository =
          environment?.isGitRepo ?? project?.gitRemoteUrl != null;
        const normalizedAssistantMessage = normalizeMessage(
          latestAssistantMessage ?? "",
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
      } finally {
        releaseSummaryRequest?.();
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
          return {
            diagnostics,
            pullRequest: { kind: "absent" as const },
            repository: {
              branch: environment?.branchName ?? null,
              path: environment?.path ?? null,
            },
          };
        }

        const initialRepository = {
          branch: environment?.branchName ?? null,
          path: environment?.path ?? null,
        };
        const pullRequestCacheKey = JSON.stringify([
          "pull-request",
          thread.environmentId,
          initialRepository.path,
          initialRepository.branch,
        ]);
        const pullRequestResult = await measureCachedStage(
          recorder,
          "pullRequest",
          () =>
            pullRequests.get(
              pullRequestCacheKey,
              async () => {
                const result = await within(
                  safely(
                    bb.sdk.environments.pullRequest({
                      environmentId: thread.environmentId!,
                      signal,
                    }),
                  ),
                  remainingMs(),
                );
                const environmentAfterLookup = await within(
                  safely(
                    bb.sdk.environments.get({
                      environmentId: thread.environmentId!,
                      signal,
                    }),
                  ),
                  remainingMs(),
                );
                if (
                  !environmentAfterLookup ||
                  environmentAfterLookup.branchName !==
                    initialRepository.branch ||
                  environmentAfterLookup.path !== initialRepository.path
                ) {
                  return null;
                }
                return result;
              },
            ),
        );
        const verifiedEnvironment = await measureStage(
          recorder,
          "environmentVerify",
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
        const verifiedRepository = {
          branch: verifiedEnvironment?.branchName ?? null,
          path: verifiedEnvironment?.path ?? null,
        };
        const repositoryIsVerified =
          verifiedEnvironment !== null &&
          verifiedRepository.branch === initialRepository.branch &&
          verifiedRepository.path === initialRepository.path;
        if (!repositoryIsVerified) pullRequests.delete(pullRequestCacheKey);
        const result = repositoryIsVerified
          ? pullRequestResult.value
          : null;
        let pullRequest: ThreadPullRequest["pullRequest"];
        if (verifiedEnvironment?.isGitRepo === false) {
          pullRequest = { kind: "absent" };
        } else if (result?.outcome === "absent") {
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
        return {
          diagnostics,
          pullRequest,
          repository: verifiedEnvironment
            ? verifiedRepository
            : initialRepository,
        };
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
