import assert from "node:assert/strict";
import { markdownPreview } from "../markdown-preview";
import plugin, {
  type RpcDiagnostics,
  type ThreadPullRequest,
  type ThreadSummary,
  type ThreadTiming,
} from "../server";

type SummaryHandler = (input: {
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
let threadGetFails = false;
let timelineFails = false;
let environmentIsGitRepository = true;
let turnStartedAt: number | null = 100;
let turnCompletedAt: number | null = null;
let environmentGetCalls = 0;
let outputCalls = 0;
let projectCalls = 0;
let providerListCalls = 0;
let providerModelCalls = 0;
let pullRequestCalls = 0;
let executionOptionsCalls = 0;
const threadGetSignals: Array<AbortSignal | undefined> = [];
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
          branchName: "feature/hover-cards",
          isGitRepo: environmentIsGitRepository,
          path: "/workspace/thread-hover-cards",
        };
      },
      async pullRequest() {
        pullRequestCalls += 1;
        return {
          outcome: "available",
          pullRequest: {
            attention: "checks_failed",
            checks: { state: "failing" },
            number: 42,
            state: "open",
            title: "Add thread hover cards",
            url: "https://github.com/acme/bb-plugin-thread-hover-cards/pull/42",
          },
        };
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
        return {
          ...(input.include === "environment"
            ? {
                environment: {
                  branchName: "feature/hover-cards",
                  isGitRepo: environmentIsGitRepository,
                  path: "/workspace/thread-hover-cards",
                },
              }
            : {}),
          environmentId:
            input.threadId === "thr_coalesced" ? "env_coalesced" : "env_1",
          projectId,
          providerId: "codex",
          runtime: { displayStatus },
          updatedAt: 123,
        };
      },
      async output() {
        outputCalls += 1;
        return { output: assistantOutput };
      },
      async timeline() {
        if (timelineFails) throw new Error("Timeline lookup failed");
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
assert.equal(outputCalls, 1);
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
assert.equal(stage(summary.diagnostics, "output").outcome, "ok");

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

const timing = await timingHandler({ threadId: "thr_1" });
assert.deepEqual(withoutDiagnostics(timing), {
  currentTurnCompletedAt: null,
  currentTurnStartedAt: 100,
  status: "active",
});
assert.equal(threadGetSignals.length, 4);
assert.ok(threadGetSignals[3] instanceof AbortSignal);
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
assert.equal(environmentGetCalls, 0);
assert.equal(pullRequestCalls, 1);
assert.equal(executionOptionsCalls, 2);
assert.equal(outputCalls, 2);
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
assert.equal(outputCalls, 4);
assert.deepEqual(eventWaitInputs, []);
const idleTiming = await timingHandler({ threadId: "thr_1" });
assert.deepEqual(withoutDiagnostics(idleTiming), {
  currentTurnCompletedAt: 220,
  currentTurnStartedAt: 100,
  status: "idle",
});

assistantOutput = " \n\t ";
turnStartedAt = 300;
turnCompletedAt = null;
const blankIdleSummary = await summaryHandler({ threadId: "thr_1" });
assert.equal(blankIdleSummary.latestAssistantMessage, null);
assert.equal(blankIdleSummary.currentTurnStartedAt, null);
assert.equal(blankIdleSummary.currentTurnCompletedAt, null);
assert.equal(outputCalls, 5);
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
Date.now = () => dateNowBeforePullRequestRefresh() + 15_001;
const stalePullRequest = await pullRequestHandler({ threadId: "thr_1" });
assert.equal(
  stage(stalePullRequest.diagnostics, "pullRequest").cache,
  "stale",
  "serves stale pull-request data while refreshing it",
);
await Promise.resolve();
Date.now = dateNowBeforePullRequestRefresh;

environmentIsGitRepository = false;
const pullRequestCallsBeforeLocalSummary = pullRequestCalls;
const localSummary = await summaryHandler({ threadId: "thr_local" });
assert.equal(localSummary.repository.isGitRepository, false);
assert.equal(localSummary.pullRequest.kind, "absent");
assert.equal(
  pullRequestCalls,
  pullRequestCallsBeforeLocalSummary,
  "skips pull-request lookup for a local workspace",
);
const localPullRequest = await pullRequestHandler({ threadId: "thr_local" });
assert.deepEqual(withoutDiagnostics(localPullRequest), {
  pullRequest: { kind: "absent" },
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
