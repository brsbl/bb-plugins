import assert from "node:assert/strict";
import { markdownPreview } from "../markdown-preview";
import plugin, {
  type RpcDiagnostics,
  type ThreadPullRequest,
  type ThreadSummary,
  type ThreadTiming,
} from "../server";

type SummaryHandler = (input: {
  clientId?: string;
  generation?: number;
  threadId: string;
}) => Promise<ThreadSummary>;
type TimingHandler = (input: {
  threadId: string;
}) => Promise<ThreadTiming>;
type PullRequestHandler = (input: {
  threadId: string;
}) => Promise<ThreadPullRequest>;

let summaryHandler: SummaryHandler | undefined;
let timingHandler: TimingHandler | undefined;
let pullRequestHandler: PullRequestHandler | undefined;
const logMessages: string[] = [];
const debugMessages: string[] = [];
let displayStatus: "active" | "idle" = "active";
let projectId = "proj_1";
let assistantOutput = "  **Finished**   the hover card \n- polish.  ";
let latestSegmentHasAssistant = true;
const nestedAssistantOutput =
  "Nested agent output returned by threads.output().";
let threadGetFails = false;
let timelineFails = false;
let environmentIsGitRepository = true;
let environmentBranchName = "feature/hover-cards";
let turnStartedAt: number | null = 100;
let turnCompletedAt: number | null = null;
let environmentGetCalls = 0;
let outputCalls = 0;
let summaryTimelineCalls = 0;
let projectCalls = 0;
let providerListCalls = 0;
let providerModelCalls = 0;
let pullRequestCalls = 0;
let pullRequestNumber = 42;
let pullRequestFails = false;
let delayPullRequest = false;
let resolveDelayedPullRequest: (() => void) | null = null;
let executionOptionsCalls = 0;
const threadGetSignals: Array<AbortSignal | undefined> = [];
const delayThreadGetFor = new Set<string>();
const delayedThreadGetResolvers = new Map<string, () => void>();
let activeDelayedThreadGets = 0;
let maxActiveDelayedThreadGets = 0;
const eventWaitInputs: Array<{
  afterSeq?: string;
  threadId: string;
  type: string;
  waitMs: string;
}> = [];

const fakeBb = {
  log: {
    debug(message: string) {
      debugMessages.push(message);
    },
    info(message: string) {
      logMessages.push(message);
    },
  },
  rpc: {
    register(
      _contract: unknown,
      handlers: {
        threadSummary: SummaryHandler;
        threadTiming: TimingHandler;
        threadPullRequest: PullRequestHandler;
      },
    ) {
      summaryHandler = handlers.threadSummary;
      timingHandler = handlers.threadTiming;
      pullRequestHandler = handlers.threadPullRequest;
    },
  },
  sdk: {
    environments: {
      async get() {
        environmentGetCalls += 1;
        return {
          branchName: environmentBranchName,
          isGitRepo: environmentIsGitRepository,
          path: "/workspace/thread-hover-cards",
        };
      },
      async pullRequest() {
        pullRequestCalls += 1;
        if (pullRequestFails) throw new Error("Pull request lookup failed");
        const result = () => ({
          outcome: "available",
          pullRequest: {
            attention: "checks_failed",
            checks: { state: "failing" },
            number: pullRequestNumber,
            state: "open",
            title: "Add thread hover cards",
            url: `https://github.com/acme/bb-plugin-thread-hover-cards/pull/${pullRequestNumber}`,
          },
        }) as const;
        if (!delayPullRequest) return result();
        return await new Promise<ReturnType<typeof result>>((resolve) => {
          resolveDelayedPullRequest = () => {
            resolveDelayedPullRequest = null;
            resolve(result());
          };
        });
      },
    },
    projects: {
      async get() {
        projectCalls += 1;
        return {
          gitRemoteUrl: "git@github.com:acme/bb-plugin-thread-hover-cards.git",
          name: "Thread cards",
        };
      },
    },
    providers: {
      async list() {
        providerListCalls += 1;
        return [
          {
            displayName: "Codex",
            id: "codex",
            logoUrl: null,
          },
        ];
      },
      async models() {
        providerModelCalls += 1;
        return {
          modelLoadError: null,
          models: [
            {
              id: "gpt-5.6-sol",
              model: "gpt-5.6-sol",
              displayName: "GPT-5.6-Sol",
            },
          ],
          providers: [],
          selectedOnlyModels: [],
        };
      },
    },
    threads: {
      async conversationOutline() {
        summaryTimelineCalls += 1;
        return {
          items: [
            {
              attachmentSummary: null,
              id: "root_assistant",
              preview: assistantOutput,
              role: "assistant" as const,
            },
          ],
          maxSeq: 20,
        };
      },
      async defaultExecutionOptions() {
        executionOptionsCalls += 1;
        return {
          model: "gpt-5.6-sol",
          permissionMode: "full",
          providerId: "codex",
          reasoningLevel: "xhigh",
          serviceTier: "default",
        };
      },
      events: {
        async wait(input: {
          afterSeq?: string;
          signal?: AbortSignal;
          threadId: string;
          type: string;
          waitMs: string;
        }) {
          eventWaitInputs.push({
            afterSeq: input.afterSeq,
            threadId: input.threadId,
            type: input.type,
            waitMs: input.waitMs,
          });
          if (turnStartedAt !== null) {
            return {
              createdAt: turnStartedAt,
              data: { providerThreadId: "provider_1" },
              id: "event_turn_started",
              scope: { kind: "turn" as const, turnId: "turn_1" },
              seq: 11,
              threadId: input.threadId,
              type: "turn/started" as const,
            };
          }
          return null;
        },
      },
      async get(input: {
        include?: string;
        signal?: AbortSignal;
        threadId: string;
      }) {
        threadGetSignals.push(input.signal);
        if (threadGetFails) throw new Error("Thread lookup failed");
        if (delayThreadGetFor.delete(input.threadId)) {
          activeDelayedThreadGets += 1;
          maxActiveDelayedThreadGets = Math.max(
            maxActiveDelayedThreadGets,
            activeDelayedThreadGets,
          );
          await new Promise<void>((resolve) => {
            delayedThreadGetResolvers.set(input.threadId, () => {
              delayedThreadGetResolvers.delete(input.threadId);
              activeDelayedThreadGets -= 1;
              resolve();
            });
          });
        }
        return {
          ...(input.include === "environment"
            ? {
                environment: {
                  branchName: environmentBranchName,
                  isGitRepo: environmentIsGitRepository,
                  path: "/workspace/thread-hover-cards",
                  workspaceProvisionType:
                    input.threadId === "thr_local"
                      ? "personal"
                      : "managed-worktree",
                },
              }
            : {}),
          environmentId:
            input.threadId === "thr_coalesced"
              ? "env_coalesced"
              : input.threadId === "thr_pr_identity_race"
                ? "env_identity_race"
                : input.threadId === "thr_pr_changed_during_lookup"
                  ? "env_changed_during_lookup"
                  : input.threadId === "thr_pr_stale_refresh_race"
                    ? "env_stale_refresh_race"
                  : "env_1",
          projectId,
          providerId: "codex",
          runtime: { displayStatus },
          updatedAt: 123,
        };
      },
      async output() {
        outputCalls += 1;
        return { output: nestedAssistantOutput };
      },
      async timeline(input: { includeNestedRows?: string }) {
        if (timelineFails) throw new Error("Timeline lookup failed");

        if (input.includeNestedRows === "false") {
          summaryTimelineCalls += 1;
          return {
            maxSeq: 20,
            rows: [
              {
                children: [
                  latestSegmentHasAssistant
                    ? {
                        kind: "conversation" as const,
                        role: "assistant" as const,
                        text: assistantOutput,
                      }
                    : {
                        kind: "conversation" as const,
                        role: "user" as const,
                        text: "Newest turn without an assistant response.",
                      },
                  {
                    childRows: [
                      {
                        kind: "conversation" as const,
                        role: "assistant" as const,
                        text: nestedAssistantOutput,
                      },
                    ],
                    kind: "work" as const,
                    workKind: "delegation" as const,
                  },
                ],
                kind: "turn" as const,
              },
            ],
            timelinePage: {
              olderCursor: { anchorId: "prompt_1", anchorSeq: 10 },
            },
          };
        }

        return {
          contextWindowUsage: {
            estimated: false,
            modelContextWindow: 100_000,
            usedTokens: 82_000,
          },
          maxSeq: 20,
          rows:
            displayStatus === "idle" && turnStartedAt !== null
              ? [
                  {
                    completedAt: turnCompletedAt,
                    id: "turn_1",
                    kind: "turn" as const,
                    sourceSeqEnd: 12,
                    sourceSeqStart: 11,
                    startedAt: turnStartedAt,
                    status: "completed" as const,
                  },
                ]
              : [],
          timelinePage: {
            olderCursor: { anchorId: "prompt_1", anchorSeq: 10 },
          },
        };
      },
    },
  },
};

function withoutDiagnostics<T extends { diagnostics: RpcDiagnostics }>(
  value: T,
): Omit<T, "diagnostics"> {
  const { diagnostics, ...result } = value;
  assert.ok(diagnostics.startedAt > 0);
  assert.ok(diagnostics.totalMs >= 0);
  assert.ok(diagnostics.stages.every((stage) => stage.durationMs >= 0));
  return result;
}

function stage(
  diagnostics: RpcDiagnostics,
  name: string,
): RpcDiagnostics["stages"][number] {
  const result = diagnostics.stages.find((candidate) => candidate.name === name);
  assert.ok(result, `records ${name} timing`);
  return result;
}

plugin(fakeBb as never);
assert.ok(summaryHandler, "registers the threadSummary RPC handler");
assert.ok(timingHandler, "registers the threadTiming RPC handler");
assert.ok(
  pullRequestHandler,
  "registers the threadPullRequest RPC handler",
);

const summary = await summaryHandler({ threadId: "thr_1" });
assert.deepEqual(withoutDiagnostics(summary), {
  currentTurnCompletedAt: null,
  currentTurnStartedAt: null,
  latestAssistantMessage: "**Finished** the hover card\n- polish.",
  permissionMode: "full",
  pullRequest: { kind: "pending" },
  provider: {
    displayName: "Codex",
    id: "codex",
    logoUrl: null,
    model: "gpt-5.6-sol",
    reasoningLevel: "xhigh",
  },
  repository: {
    branch: "feature/hover-cards",
    isGitRepository: true,
    name: "acme/bb-plugin-thread-hover-cards",
    path: "/workspace/thread-hover-cards",
  },
  status: "active",
});
assert.equal("permissionMode" in summary.provider, false);
assert.equal(summary.permissionMode, "full");
assert.equal("contextWindowUsage" in summary, false);
assert.notEqual(summary.latestAssistantMessage, nestedAssistantOutput);
assert.equal(outputCalls, 0);
assert.equal(summaryTimelineCalls, 1);
assert.equal(threadGetSignals.length, 1);
assert.ok(threadGetSignals[0] instanceof AbortSignal);
assert.equal(projectCalls, 1);
assert.equal(providerListCalls, 0);
assert.equal(providerModelCalls, 0);
assert.equal(environmentGetCalls, 0);
assert.equal(pullRequestCalls, 0);
assert.equal(executionOptionsCalls, 1);
assert.deepEqual(eventWaitInputs, []);
assert.equal(stage(summary.diagnostics, "thread").outcome, "ok");
assert.equal(stage(summary.diagnostics, "environment").cache, "none");
assert.equal(stage(summary.diagnostics, "project").cache, "miss");
assert.equal(stage(summary.diagnostics, "executionOptions").outcome, "ok");
assert.equal(stage(summary.diagnostics, "messageOutline").outcome, "ok");

const pullRequest = await pullRequestHandler({ threadId: "thr_1" });
assert.deepEqual(withoutDiagnostics(pullRequest), {
  pullRequest: {
    kind: "available",
    number: 42,
    signal: "Checks failing",
    state: "open",
    title: "Add thread hover cards",
    url: "https://github.com/acme/bb-plugin-thread-hover-cards/pull/42",
  },
  repository: {
    branch: "feature/hover-cards",
    path: "/workspace/thread-hover-cards",
  },
});
assert.equal(pullRequestCalls, 1);
assert.equal(stage(pullRequest.diagnostics, "pullRequest").cache, "miss");

const cachedPullRequest = await pullRequestHandler({ threadId: "thr_1" });
assert.deepEqual(
  withoutDiagnostics(cachedPullRequest),
  withoutDiagnostics(pullRequest),
);
assert.equal(pullRequestCalls, 1, "reuses the cached pull-request lookup");
assert.equal(
  stage(cachedPullRequest.diagnostics, "pullRequest").cache,
  "hit",
);

environmentBranchName = "feature/other-branch";
pullRequestNumber = 43;
const otherBranchPullRequest = await pullRequestHandler({ threadId: "thr_1" });
assert.equal(otherBranchPullRequest.pullRequest.kind, "available");
if (otherBranchPullRequest.pullRequest.kind === "available") {
  assert.equal(otherBranchPullRequest.pullRequest.number, 43);
}
assert.equal(
  stage(otherBranchPullRequest.diagnostics, "pullRequest").cache,
  "miss",
  "scopes pull-request cache entries to the current branch",
);
assert.equal(pullRequestCalls, 2);
environmentBranchName = "feature/hover-cards";
pullRequestNumber = 42;

const timing = await timingHandler({ threadId: "thr_1" });
assert.deepEqual(withoutDiagnostics(timing), {
  currentTurnCompletedAt: null,
  currentTurnStartedAt: 100,
  status: "active",
});
assert.equal(threadGetSignals.length, 5);
assert.ok(threadGetSignals[4] instanceof AbortSignal);
assert.equal(stage(timing.diagnostics, "thread").outcome, "ok");
assert.equal(stage(timing.diagnostics, "timeline").outcome, "ok");
assert.equal(stage(timing.diagnostics, "turnStartedEvent").outcome, "ok");
assert.deepEqual(eventWaitInputs, [
  {
    afterSeq: "9",
    threadId: "thr_1",
    type: "turn/started",
    waitMs: "1",
  },
]);

timelineFails = true;
const unavailableTiming = await timingHandler({ threadId: "thr_1" });
assert.deepEqual(withoutDiagnostics(unavailableTiming), {
  currentTurnCompletedAt: null,
  currentTurnStartedAt: null,
  status: "active",
});
timelineFails = false;

turnStartedAt = 200;
const longTurnSummary = await summaryHandler({ threadId: "thr_1" });
assert.equal(longTurnSummary.currentTurnStartedAt, null);
assert.equal(projectCalls, 1);
assert.equal(providerListCalls, 0);
assert.equal(providerModelCalls, 0);
assert.equal(environmentGetCalls, 5);
assert.equal(pullRequestCalls, 2);
assert.equal(executionOptionsCalls, 2);
assert.equal(outputCalls, 0);
const longTurnTiming = await timingHandler({ threadId: "thr_1" });
assert.equal(longTurnTiming.currentTurnStartedAt, 200);
assert.equal(longTurnTiming.status, "active");

turnStartedAt = null;
const missingTurnStartSummary = await summaryHandler({ threadId: "thr_1" });
assert.equal(missingTurnStartSummary.currentTurnStartedAt, null);
const missingTurnStartTiming = await timingHandler({ threadId: "thr_1" });
assert.equal(missingTurnStartTiming.currentTurnStartedAt, null);
assert.equal(missingTurnStartTiming.status, "active");

displayStatus = "idle";
turnStartedAt = 100;
turnCompletedAt = 220;
eventWaitInputs.length = 0;
const idleSummary = await summaryHandler({ threadId: "thr_1" });
assert.equal(idleSummary.currentTurnStartedAt, null);
assert.equal(idleSummary.currentTurnCompletedAt, null);
assert.equal(
  idleSummary.latestAssistantMessage,
  "**Finished** the hover card\n- polish.",
);
assert.equal(idleSummary.status, "idle");
assert.equal(outputCalls, 0);
assert.deepEqual(eventWaitInputs, []);
const idleTiming = await timingHandler({ threadId: "thr_1" });
assert.deepEqual(withoutDiagnostics(idleTiming), {
  currentTurnCompletedAt: 220,
  currentTurnStartedAt: 100,
  status: "idle",
});

assistantOutput = "An earlier canonical assistant response.";
latestSegmentHasAssistant = false;
const assistantlessLatestTurnSummary = await summaryHandler({
  threadId: "thr_1",
});
assert.equal(
  assistantlessLatestTurnSummary.latestAssistantMessage,
  "An earlier canonical assistant response.",
  "falls back to the canonical outline when the newest turn has no assistant row",
);
assert.equal(
  stage(
    assistantlessLatestTurnSummary.diagnostics,
    "messageOutlineFallback",
  ).outcome,
  "ok",
);
assert.notEqual(
  assistantlessLatestTurnSummary.latestAssistantMessage,
  nestedAssistantOutput,
);
latestSegmentHasAssistant = true;

assistantOutput = " \n\t ";
turnStartedAt = 300;
turnCompletedAt = null;
const blankIdleSummary = await summaryHandler({ threadId: "thr_1" });
assert.equal(blankIdleSummary.latestAssistantMessage, null);
assert.equal(blankIdleSummary.currentTurnStartedAt, null);
assert.equal(blankIdleSummary.currentTurnCompletedAt, null);
assert.equal(outputCalls, 0);
const blankIdleTiming = await timingHandler({ threadId: "thr_1" });
assert.deepEqual(withoutDiagnostics(blankIdleTiming), {
  currentTurnCompletedAt: null,
  currentTurnStartedAt: 300,
  status: "idle",
});
assert.equal(projectCalls, 1);
assert.equal(providerListCalls, 0);
assert.equal(providerModelCalls, 0);

const pullRequestCallsBeforeCoalescing = pullRequestCalls;
const coalescedPullRequests = await Promise.all([
  pullRequestHandler({ threadId: "thr_coalesced" }),
  pullRequestHandler({ threadId: "thr_coalesced" }),
]);
assert.equal(
  pullRequestCalls,
  pullRequestCallsBeforeCoalescing + 1,
  "coalesces concurrent pull-request cache misses",
);
assert.deepEqual(
  new Set(
    coalescedPullRequests.map(
      (result) => stage(result.diagnostics, "pullRequest").cache,
    ),
  ),
  new Set(["coalesced", "miss"]),
);

const dateNowBeforePullRequestRefresh = Date.now;
let pullRequestNow = dateNowBeforePullRequestRefresh() + 15_001;
Date.now = () => pullRequestNow;
delayPullRequest = true;
const refreshLogsBeforeSuccess = debugMessages.filter((message) =>
  message.startsWith("thread-hover-cards:cache-refresh "),
).length;
const stalePullRequest = await pullRequestHandler({ threadId: "thr_1" });
assert.equal(
  stage(stalePullRequest.diagnostics, "pullRequest").cache,
  "stale",
  "serves stale pull-request data while refreshing it",
);
assert.ok(resolveDelayedPullRequest, "returns while the refresh is pending");
assert.equal(
  debugMessages.filter((message) =>
    message.startsWith("thread-hover-cards:cache-refresh "),
  ).length,
  refreshLogsBeforeSuccess,
  "does not report a detached refresh before it settles",
);
resolveDelayedPullRequest?.();
await new Promise((resolve) => setTimeout(resolve, 0));
const successfulRefreshLog = debugMessages
  .filter((message) =>
    message.startsWith("thread-hover-cards:cache-refresh "),
  )
  .at(-1);
assert.ok(successfulRefreshLog);
const successfulRefresh = JSON.parse(
  successfulRefreshLog.slice(successfulRefreshLog.indexOf("{")),
);
assert.equal(successfulRefresh.cache, "stale");
assert.ok(successfulRefresh.durationMs >= 0);
assert.equal(successfulRefresh.outcome, "ok");
assert.equal(successfulRefresh.stage, "pullRequest");
assert.equal(successfulRefresh.startedAt, pullRequestNow);

delayPullRequest = false;
pullRequestNow += 15_001;
pullRequestFails = true;
const staleUnavailablePullRequest = await pullRequestHandler({
  threadId: "thr_1",
});
assert.equal(
  stage(staleUnavailablePullRequest.diagnostics, "pullRequest").cache,
  "stale",
);
await new Promise((resolve) => setTimeout(resolve, 0));
const unavailableRefreshLog = debugMessages
  .filter((message) =>
    message.startsWith("thread-hover-cards:cache-refresh "),
  )
  .at(-1);
assert.ok(unavailableRefreshLog);
const unavailableRefresh = JSON.parse(
  unavailableRefreshLog.slice(unavailableRefreshLog.indexOf("{")),
);
assert.equal(unavailableRefresh.cache, "stale");
assert.ok(unavailableRefresh.durationMs >= 0);
assert.equal(unavailableRefresh.outcome, "unavailable");
assert.equal(unavailableRefresh.stage, "pullRequest");
pullRequestFails = false;
Date.now = dateNowBeforePullRequestRefresh;

environmentBranchName = "stale-branch-a";
pullRequestNumber = 71;
const primedStaleRacePullRequest = await pullRequestHandler({
  threadId: "thr_pr_stale_refresh_race",
});
assert.equal(primedStaleRacePullRequest.pullRequest.kind, "available");
if (primedStaleRacePullRequest.pullRequest.kind === "available") {
  assert.equal(primedStaleRacePullRequest.pullRequest.number, 71);
}
const dateNowBeforeStaleRace = Date.now;
const staleRaceNow = dateNowBeforeStaleRace() + 15_001;
Date.now = () => staleRaceNow;
delayPullRequest = true;
const staleRacePullRequest = await pullRequestHandler({
  threadId: "thr_pr_stale_refresh_race",
});
assert.equal(
  stage(staleRacePullRequest.diagnostics, "pullRequest").cache,
  "stale",
);
assert.ok(resolveDelayedPullRequest);
environmentBranchName = "stale-branch-b";
pullRequestNumber = 72;
resolveDelayedPullRequest?.();
await new Promise((resolve) => setTimeout(resolve, 0));

delayPullRequest = false;
environmentBranchName = "stale-branch-a";
pullRequestNumber = 73;
const staleAfterRejectedRefresh = await pullRequestHandler({
  threadId: "thr_pr_stale_refresh_race",
});
assert.equal(staleAfterRejectedRefresh.pullRequest.kind, "available");
if (staleAfterRejectedRefresh.pullRequest.kind === "available") {
  assert.equal(
    staleAfterRejectedRefresh.pullRequest.number,
    71,
    "does not cache a detached branch-B refresh under branch A",
  );
}
assert.equal(
  stage(staleAfterRejectedRefresh.diagnostics, "pullRequest").cache,
  "stale",
);
await new Promise((resolve) => setTimeout(resolve, 0));
const refreshedAfterRejectedRace = await pullRequestHandler({
  threadId: "thr_pr_stale_refresh_race",
});
assert.equal(refreshedAfterRejectedRace.pullRequest.kind, "available");
if (refreshedAfterRejectedRace.pullRequest.kind === "available") {
  assert.equal(refreshedAfterRejectedRace.pullRequest.number, 73);
}
assert.equal(
  stage(refreshedAfterRejectedRace.diagnostics, "pullRequest").cache,
  "hit",
);
Date.now = dateNowBeforeStaleRace;

environmentBranchName = "branch-a";
pullRequestNumber = 41;
delayThreadGetFor.add("thr_pr_identity_race");
const racedPullRequestPromise = pullRequestHandler({
  threadId: "thr_pr_identity_race",
});
assert.ok(delayedThreadGetResolvers.has("thr_pr_identity_race"));
environmentBranchName = "branch-b";
pullRequestNumber = 42;
delayedThreadGetResolvers.get("thr_pr_identity_race")?.();
const racedPullRequest = await racedPullRequestPromise;
assert.deepEqual(racedPullRequest.repository, {
  branch: "branch-b",
  path: "/workspace/thread-hover-cards",
});
assert.equal(racedPullRequest.pullRequest.kind, "available");
if (racedPullRequest.pullRequest.kind === "available") {
  assert.equal(racedPullRequest.pullRequest.number, 42);
}
environmentBranchName = "feature/hover-cards";
pullRequestNumber = 42;

environmentBranchName = "branch-a";
pullRequestNumber = 41;
delayPullRequest = true;
const pullRequestChangedDuringLookupPromise = pullRequestHandler({
  threadId: "thr_pr_changed_during_lookup",
});
for (let attempt = 0; attempt < 10; attempt += 1) {
  if (resolveDelayedPullRequest) break;
  await Promise.resolve();
}
assert.ok(resolveDelayedPullRequest);
environmentBranchName = "branch-b";
pullRequestNumber = 42;
resolveDelayedPullRequest?.();
const pullRequestChangedDuringLookup =
  await pullRequestChangedDuringLookupPromise;
assert.deepEqual(pullRequestChangedDuringLookup.repository, {
  branch: "branch-b",
  path: "/workspace/thread-hover-cards",
});
assert.deepEqual(pullRequestChangedDuringLookup.pullRequest, {
  kind: "unavailable",
});
delayPullRequest = false;
const correctedBranchPullRequest = await pullRequestHandler({
  threadId: "thr_pr_changed_during_lookup",
});
assert.equal(correctedBranchPullRequest.pullRequest.kind, "available");
if (correctedBranchPullRequest.pullRequest.kind === "available") {
  assert.equal(correctedBranchPullRequest.pullRequest.number, 42);
}
assert.equal(
  stage(correctedBranchPullRequest.diagnostics, "pullRequest").cache,
  "miss",
  "does not cache a PR under a branch that changed during lookup",
);
environmentBranchName = "feature/hover-cards";
pullRequestNumber = 42;

environmentIsGitRepository = false;
const pullRequestCallsBeforeLocalSummary = pullRequestCalls;
const localSummary = await summaryHandler({ threadId: "thr_local" });
assert.equal(localSummary.repository.isGitRepository, false);
assert.equal(localSummary.pullRequest.kind, "absent");
assert.equal(stage(localSummary.diagnostics, "project").outcome, "skipped");
assert.equal(
  pullRequestCalls,
  pullRequestCallsBeforeLocalSummary,
  "skips pull-request lookup for a local workspace",
);
const localPullRequest = await pullRequestHandler({ threadId: "thr_local" });
assert.deepEqual(withoutDiagnostics(localPullRequest), {
  pullRequest: { kind: "absent" },
  repository: {
    branch: "feature/hover-cards",
    path: "/workspace/thread-hover-cards",
  },
});
assert.equal(
  pullRequestCalls,
  pullRequestCallsBeforeLocalSummary,
  "skips pull-request hydration for a local workspace",
);
environmentIsGitRepository = true;

const realDateNow = Date.now;
const projectCallsBeforeRefresh = projectCalls;
Date.now = () =>
  realDateNow() + 60_000 + 1;
await summaryHandler({ threadId: "thr_stale_descriptor" });
assert.equal(
  projectCalls,
  projectCallsBeforeRefresh + 1,
  "refreshes an expired descriptor behind the stale value",
);
await summaryHandler({ threadId: "thr_refreshed_descriptor" });
assert.equal(
  projectCalls,
  projectCallsBeforeRefresh + 1,
  "reuses the refreshed descriptor without another load",
);
Date.now = realDateNow;

const projectCallsBeforeLruFill = projectCalls;
for (let index = 2; index <= 129; index += 1) {
  projectId = `proj_${index}`;
  await summaryHandler({ threadId: `thr_${index}` });
}
assert.equal(projectCalls, projectCallsBeforeLruFill + 128);
projectId = "proj_1";
await summaryHandler({ threadId: "thr_1" });
assert.equal(
  projectCalls,
  projectCallsBeforeLruFill + 129,
  "evicts the least-recently-used stable descriptor after 128 entries",
);

const gatedThreadIds = Array.from(
  { length: 5 },
  (_, index) => `thr_gated_${index + 1}`,
);
for (const threadId of gatedThreadIds) delayThreadGetFor.add(threadId);
activeDelayedThreadGets = 0;
maxActiveDelayedThreadGets = 0;
const threadGetsBeforeGateTest = threadGetSignals.length;
const gatedRequests = gatedThreadIds.map((threadId, index) =>
  summaryHandler({
    clientId: "hover-card-test",
    generation: index + 1,
    threadId,
  }),
);
const gatedResultsPromise = Promise.allSettled(gatedRequests);
await Promise.resolve();
assert.equal(delayedThreadGetResolvers.size, 2);
assert.equal(maxActiveDelayedThreadGets, 2);
delayedThreadGetResolvers.get("thr_gated_1")?.();
delayedThreadGetResolvers.get("thr_gated_2")?.();
for (let attempt = 0; attempt < 20; attempt += 1) {
  if (delayedThreadGetResolvers.has("thr_gated_5")) break;
  await new Promise((resolve) => setTimeout(resolve, 0));
}
assert.deepEqual(
  [...delayedThreadGetResolvers.keys()],
  ["thr_gated_5"],
  "skips superseded queued generations before SDK work starts",
);
delayedThreadGetResolvers.get("thr_gated_5")?.();
const gatedResults = await gatedResultsPromise;
assert.equal(
  gatedResults.filter(({ status }) => status === "fulfilled").length,
  3,
);
assert.equal(
  gatedResults.filter(({ status }) => status === "rejected").length,
  2,
);
assert.equal(threadGetSignals.length - threadGetsBeforeGateTest, 3);
assert.equal(maxActiveDelayedThreadGets, 2);
for (const threadId of gatedThreadIds) delayThreadGetFor.delete(threadId);

threadGetFails = true;
await assert.rejects(
  summaryHandler({ threadId: "thr_unavailable" }),
  /Thread summary unavailable\./,
);
assert.deepEqual(logMessages, ["Thread hover cards loaded."]);
assert.ok(
  debugMessages.some((message) =>
    message.startsWith("thread-hover-cards:timing "),
  ),
  "records structured RPC timing logs",
);
assert.deepEqual(
  markdownPreview(
    "| Work | PR | Status |\n| --- | --- | --- |\n| Hover cards | #42 | Ready |",
  ),
  {
    inline: "Work: Hover cards · PR: #42 · Status: Ready",
    kind: "table",
  },
);
assert.deepEqual(markdownPreview("- First result\n- Second result\n- Extra"), {
  inline: "First result · Second result",
  kind: "list",
});
