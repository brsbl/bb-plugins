import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const dom = new JSDOM(
  `<head>
    <link data-bb-plugin-css="thread-hover-cards" href="/plugins/thread-hover-cards/app.css">
  </head>
  <body>
    <div class="group/thread-row">
      <a data-sidebar-thread-id="thr_1" href="/threads/thr_1">Thread</a>
    </div>
    <button id="css-hidden-control" style="display: none">Hidden control</button>
    <button id="thread-row-successor">Next control</button>
  </body>`,
  { url: "http://localhost" },
);

const { window } = dom;
const realDateNow = Date.now;
const realPerformance = globalThis.performance;
let testNow = realDateNow();
let testMonotonicNow = 0;
Date.now = () => testNow;
Object.assign(globalThis, {
  document: window.document,
  Element: window.Element,
  Event: window.Event,
  FocusEvent: window.FocusEvent,
  HTMLElement: window.HTMLElement,
  KeyboardEvent: window.KeyboardEvent,
  MutationObserver: window.MutationObserver,
  Node: window.Node,
  PointerEvent: window.PointerEvent,
  performance: { now: () => testMonotonicNow },
  window,
  requestAnimationFrame(callback) {
    callback(0);
    return 1;
  },
});

const requestBodies = [];
const summaryRequestMetadata = [];
const timingRequestBodies = [];
const pullRequestBodies = [];
let delayedRefresh = null;
let delayNextRefreshFor = null;
const delayNextSummaryFor = new Set();
const delayedSummaryResponses = new Map();
const delayNextTimingFor = new Set();
const delayedTimingResponses = new Map();
const delayNextPullRequestFor = new Set();
const delayedPullRequestResponses = new Map();
const abortedSummaryThreadIds = [];
let activeDelayedSummaryRequests = 0;
let maxActiveDelayedSummaryRequests = 0;
let idleRestartIsActive = false;
let branchTestBranch = "branch-a";

function deferResponse({
  delayedThreads,
  resolvers,
  response,
  signal,
  threadId,
  trackSummary = false,
}) {
  if (!delayedThreads.delete(threadId)) return null;
  if (trackSummary) {
    activeDelayedSummaryRequests += 1;
    maxActiveDelayedSummaryRequests = Math.max(
      maxActiveDelayedSummaryRequests,
      activeDelayedSummaryRequests,
    );
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const settle = (callback) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener("abort", abort);
      if (trackSummary) activeDelayedSummaryRequests -= 1;
      resolvers.delete(threadId);
      callback();
    };
    const abort = () => {
      abortedSummaryThreadIds.push(threadId);
      settle(() => reject(new DOMException("Aborted", "AbortError")));
    };
    if (signal?.aborted) {
      abort();
      return;
    }
    signal?.addEventListener("abort", abort, { once: true });
    resolvers.set(threadId, () => settle(() => resolve(response)));
  });
}

globalThis.fetch = async (url, init) => {
  const request = JSON.parse(init.body);
  const isLocal = request.threadId === "thr_local";
  const hasNoPullRequest = request.threadId === "thr_no_pr";
  const pullRequestUnavailable = request.threadId === "thr_pr_unavailable";
  const isDraftPullRequest = request.threadId === "thr_draft_pr";
  const isBlockedPullRequest = request.threadId === "thr_blocked_pr";
  const isFailingPullRequest = request.threadId === "thr_failing_pr";
  const isPendingPullRequest = request.threadId === "thr_pending_pr";
  const isReadyPullRequest = request.threadId === "thr_ready_pr";
  const isMergedPullRequest = request.threadId === "thr_merged_pr";
  const isClosedPullRequest = request.threadId === "thr_closed_pr";
  const isDoneWithoutCompletion =
    request.threadId === "thr_done_without_completion";
  const isStateRace = request.threadId === "thr_state_race";
  const isIdleRestart = request.threadId === "thr_idle_restart";
  const isBranchIdentity = request.threadId === "thr_branch_identity";
  const now = Date.now();
  if (String(url).endsWith("/threadTiming")) {
    timingRequestBodies.push(request);
    const response = new Response(
      JSON.stringify({
        ok: true,
        result: {
          currentTurnCompletedAt:
            isLocal || isStateRace || (isIdleRestart && !idleRestartIsActive)
              ? now - 65_000
              : null,
          currentTurnStartedAt: isLocal
            ? now - 185_000
            : isStateRace
              ? now - 125_000
              : isIdleRestart
                ? now - (idleRestartIsActive ? 30_000 : 125_000)
              : hasNoPullRequest
                ? null
                : now - 65_000,
          diagnostics: {
            startedAt: now,
            stages: [
              {
                durationMs: 0.5,
                name: "timeline",
                outcome: "ok",
              },
            ],
            totalMs: 0.5,
          },
          status:
            isLocal || isDoneWithoutCompletion || isStateRace
              ? "idle"
              : isIdleRestart
                ? idleRestartIsActive
                  ? "active"
                  : "idle"
              : "active",
        },
      }),
      { headers: { "content-type": "application/json" }, status: 200 },
    );
    return (
      deferResponse({
        delayedThreads: delayNextTimingFor,
        resolvers: delayedTimingResponses,
        response,
        threadId: request.threadId,
      }) ?? response
    );
  }

  if (String(url).endsWith("/threadPullRequest")) {
    pullRequestBodies.push(request);
    const response = new Response(
      JSON.stringify({
        ok: true,
        result: {
          diagnostics: {
            startedAt: now,
            stages: [
              {
                cache: "miss",
                durationMs: 1,
                name: "pullRequest",
                outcome: "ok",
              },
            ],
            totalMs: 1,
          },
          pullRequest:
            isLocal || hasNoPullRequest
              ? { kind: "absent" }
              : pullRequestUnavailable
                ? { kind: "unavailable" }
                : {
                    kind: "available",
                    number:
                      isBranchIdentity && branchTestBranch === "branch-a"
                        ? 41
                        : 42,
                    signal: isDraftPullRequest
                      ? "Draft"
                      : isBlockedPullRequest
                        ? "Blocked"
                        : isFailingPullRequest
                          ? "Checks failing"
                          : isPendingPullRequest
                            ? "Checks pending"
                            : isReadyPullRequest
                              ? "Ready to merge"
                              : isMergedPullRequest
                                ? "Merged"
                                : isClosedPullRequest
                                  ? "Closed"
                                  : "Checks passing",
                    state: isDraftPullRequest
                      ? "draft"
                      : isMergedPullRequest
                        ? "merged"
                        : isClosedPullRequest
                          ? "closed"
                          : "open",
                    title: "Thread previews",
                    url: `https://github.com/acme/bb/pull/${
                      isBranchIdentity && branchTestBranch === "branch-a"
                        ? 41
                        : 42
                    }`,
                  },
          repository: {
            branch: isBranchIdentity
              ? branchTestBranch
              : "feature/hover-cards",
            path: "/workspace/acme/bb",
          },
        },
      }),
      { headers: { "content-type": "application/json" }, status: 200 },
    );
    return (
      deferResponse({
        delayedThreads: delayNextPullRequestFor,
        resolvers: delayedPullRequestResponses,
        response,
        threadId: request.threadId,
      }) ?? response
    );
  }

  summaryRequestMetadata.push(request);
  requestBodies.push({ threadId: request.threadId });
  const response = new Response(
    JSON.stringify({
      ok: true,
      result: {
        currentTurnCompletedAt: null,
        currentTurnStartedAt: null,
        diagnostics: {
          startedAt: now,
          stages: [
            {
              durationMs: 1,
              name: "thread",
              outcome: "ok",
            },
            {
              cache: "hit",
              durationMs: 0,
              name: "project",
              outcome: "ok",
            },
          ],
          totalMs: 1,
        },
        latestAssistantMessage: isLocal
          ? "**Done**—hover cards are *ready* for foo_bar_baz, \\_literal\\_, and __tests__ with `Cmd+R`.\n\n## Canary\nIgnore this secondary section.\n\n| Work | PR | Status |\n| --- | --- | --- |\n| Hover cards | #42 | Ready |"
          : isIdleRestart
            ? idleRestartIsActive
              ? "Restarted agent update"
              : "Finished agent update"
            : request.threadId.startsWith("thr_fanout_") ||
                request.threadId === "thr_first_content"
              ? `Agent update for ${request.threadId}`
          : hasNoPullRequest
            ? null
            : "**Agent update**—implementing concise hover cards for foo_bar_baz and \\_literal\\_",
        permissionMode: isLocal
          ? "auto"
          : isDraftPullRequest
            ? "accept-edits"
            : "full",
        pullRequest:
          isLocal || hasNoPullRequest
            ? { kind: "absent" }
            : { kind: "pending" },
        provider: {
          displayName: "Codex",
          id: "codex",
          logoUrl: null,
          model: "GPT-5.6-Sol",
          reasoningLevel: "xhigh",
        },
        repository: isLocal
          ? {
              branch: null,
              isGitRepository: false,
              name: "Personal",
              path: "/Users/test/.bb/personal-workspaces/env_pmgnprh2j6",
            }
          : {
              branch: isBranchIdentity
                ? branchTestBranch
                : "feature/hover-cards",
              isGitRepository: true,
              name: "acme/bb",
              path: "/workspace/acme/bb",
            },
        status:
          isLocal || isDoneWithoutCompletion
            ? "idle"
            : isIdleRestart
              ? idleRestartIsActive
                ? "active"
                : "idle"
              : "active",
      },
    }),
    { headers: { "content-type": "application/json" }, status: 200 },
  );
  const delayedSummary = deferResponse({
    delayedThreads: delayNextSummaryFor,
    resolvers: delayedSummaryResponses,
    response,
    signal: init.signal,
    threadId: request.threadId,
    trackSummary: true,
  });
  if (delayedSummary) return delayedSummary;
  if (delayNextRefreshFor === request.threadId) {
    delayNextRefreshFor = null;
    return new Promise((resolve) => {
      delayedRefresh = () => resolve(response);
    });
  }
  return response;
};

globalThis.__bbPluginRuntime = {
  pluginSdkApp: {
    definePluginApp(setup) {
      return { __bbPluginApp: true, setup };
    },
  },
};

await import("../dist/app.js");
window.document.dispatchEvent(
  new window.Event("DOMContentLoaded", { bubbles: true }),
);

let trigger = window.document.querySelector("[data-sidebar-thread-id]");
assert.ok(trigger);
const threadRowSuccessor = window.document.getElementById(
  "thread-row-successor",
);
assert.ok(threadRowSuccessor);

const style = window.document.getElementById("bb-thread-hover-card-styles");
assert.ok(style);
assert.match(style.textContent, /\.bb-thread-hover-card \{/);
assert.match(
  style.textContent,
  /background: color-mix\(in srgb, var\(--popover\) 82%, transparent\)/,
);
assert.match(style.textContent, /backdrop-filter: blur\(18px\)/);
assert.match(style.textContent, /var\(--foreground\) 4%, transparent/);
assert.match(style.textContent, /font-weight: 400/);
assert.match(
  style.textContent,
  /\.bb-thread-hover-card__message[\s\S]*?font-weight: 350/,
);
assert.match(
  style.textContent,
  /\.bb-thread-hover-card__message[\s\S]*?-webkit-line-clamp: 2/,
);
assert.match(
  style.textContent,
  /\.bb-thread-hover-card__summary \{[\s\S]*?padding-block: 0\.1875rem/,
);
assert.match(
  style.textContent,
  /\.bb-thread-hover-card__summary\[data-working="true"\][\s\S]*?\.bb-thread-hover-card__message \{[\s\S]*?background-clip: text;[\s\S]*?-webkit-text-fill-color: transparent;[\s\S]*?bb-thread-hover-card-message-shimmer/,
);
assert.doesNotMatch(
  style.textContent,
  /\.bb-thread-hover-card__summary\[data-working="true"\]::after/,
);
assert.match(
  style.textContent,
  /\.bb-thread-hover-card__time-icon\[data-tone="success"\][\s\S]*?var\(--success\)/,
);
assert.match(
  style.textContent,
  /\.bb-thread-hover-card__provider-identity \{[\s\S]*?justify-content: flex-start;[\s\S]*?gap: 0.25rem/,
);
assert.match(
  style.textContent,
  /\.bb-thread-hover-card__provider-model\.bb-thread-hover-card__truncate \{[\s\S]*?flex: 0 1 auto/,
);
assert.doesNotMatch(style.textContent, /--font-mono/);
assert.match(style.textContent, /\.bb-thread-hover-card__context/);
assert.match(
  style.textContent,
  /\.bb-thread-hover-card__context \{[\s\S]*?width: 100%;[\s\S]*?flex-wrap: nowrap;/,
);
assert.match(
  style.textContent,
  /\.bb-thread-hover-card__project[\s\S]*?max-width: 38%;[\s\S]*?flex: 0 1 auto/,
);
assert.match(
  style.textContent,
  /\.bb-thread-hover-card__branch \{[\s\S]*?flex: 1 1 4rem;/,
);
assert.match(
  style.textContent,
  /\.bb-thread-hover-card__branch \{[\s\S]*?min-width: 0;/,
);
assert.match(
  style.textContent,
  /\.bb-thread-hover-card__branch-name,[\s\S]*?text-overflow: ellipsis/,
);
assert.match(style.textContent, /\.bb-thread-hover-card__pr-status/);
assert.match(
  style.textContent,
  /\.bb-thread-hover-card__access \{[\s\S]*?flex: none;[\s\S]*?white-space: nowrap/,
);
assert.match(
  style.textContent,
  /\.bb-thread-hover-card__access\[data-permission-mode="full"\][\s\S]*?var\(--warning-text, var\(--warning\)\)/,
);
assert.match(
  style.textContent,
  /\.bb-thread-hover-card__pr \{[\s\S]*?flex: none;[\s\S]*?overflow: visible/,
);
assert.match(style.textContent, /var\(--success\) 9%, transparent/);
assert.match(style.textContent, /var\(--pr-merged\) 9%, transparent/);
assert.match(style.textContent, /@supports not/);

const pointerOver = new window.Event("pointerover", { bubbles: true });
Object.defineProperties(pointerOver, {
  pointerType: { value: "mouse" },
  relatedTarget: { value: null },
});
trigger.dispatchEvent(pointerOver);
const card = window.document.getElementById("bb-thread-hover-card");
assert.ok(card, "opens the hover card in the pointer event turn");
assert.equal(card.hidden, false);
assert.deepEqual(
  requestBodies,
  [{ threadId: "thr_1" }],
  "starts the summary request immediately",
);
assert.equal(typeof summaryRequestMetadata[0]?.clientId, "string");
assert.equal(summaryRequestMetadata[0]?.generation, 1);
assert.deepEqual(
  timingRequestBodies,
  [],
  "does not block first paint on timing hydration",
);
assert.match(card.textContent, /Loading thread summary/);
await new Promise((resolve) => setTimeout(resolve, 20));

assert.equal(card.hidden, false);
assert.equal(card.dataset.bbPlugin, "thread-hover-cards");
assert.equal(card.hasAttribute("data-bb-portaled-overlay"), true);
assert.equal(trigger.getAttribute("aria-describedby"), "bb-thread-hover-card");
assert.deepEqual(requestBodies, [{ threadId: "thr_1" }]);
assert.deepEqual(pullRequestBodies, [{ threadId: "thr_1" }]);
assert.doesNotMatch(card.textContent, /Agent working/);
assert.equal(
  card.querySelector(".bb-thread-hover-card__runtime [data-time-value]")
    ?.textContent,
  "1m",
);
assert.equal(
  card.querySelector(".bb-thread-hover-card__runtime .bb-thread-hover-card__sr-only")
    ?.textContent,
  "Run time ",
);
assert.equal(
  card.querySelector(".bb-thread-hover-card__times")?.children.length,
  1,
);
assert.equal(card.querySelector(".bb-thread-hover-card__updated"), null);
assert.equal(
  card.querySelector(".bb-thread-hover-card__provider .bb-thread-hover-card__sr-only")
    ?.textContent,
  "Codex, ",
);
assert.equal(
  card
    .querySelector(".bb-thread-hover-card__runtime")
    ?.querySelector('[data-icon="Loading03Icon"]')
    ?.getAttribute("data-animated"),
  "true",
);
assert.equal(
  card
    .querySelector(".bb-thread-hover-card__runtime")
    ?.querySelector('[data-icon="AlarmClockIcon"]'),
  null,
);
assert.equal(card.querySelector('[data-icon="Appointment02Icon"]'), null);
assert.match(
  card.textContent,
  /Agent update—implementing concise hover cards for foo_bar_baz and _literal_/,
);
assert.ok(card.querySelector(".bb-thread-hover-card__inline-strong"));
assert.equal(card.querySelector(".bb-thread-hover-card__inline-emphasis"), null);
assert.match(card.textContent, /5\.6-Sol/);
assert.match(card.textContent, /Extra High/);
assert.doesNotMatch(card.textContent, /gpt-5\.6-sol/);
assert.match(card.textContent, /Full access/);
assert.doesNotMatch(card.textContent, /Context window|82%/);
assert.match(card.textContent, /acme\/bb/);
assert.match(card.textContent, /#42Checks passing/);
assert.doesNotMatch(card.textContent, /Latest request/i);
assert.ok(card.querySelector('[data-icon="Loading03Icon"]'));
assert.ok(
  card
    .querySelector(".bb-thread-hover-card__times")
    ?.querySelector('[data-icon="Loading03Icon"]'),
);
assert.equal(card.querySelector(".bb-thread-hover-card__status-icon"), null);
assert.ok(card.querySelector('[data-icon="OpenAiIcon"]'));
assert.ok(
  card
    .querySelector(".bb-thread-hover-card__header")
    ?.querySelector('[data-icon="OpenAiIcon"]'),
);
assert.ok(card.querySelector('[data-icon="Folder01Icon"]'));
assert.ok(card.querySelector('[data-icon="GitBranchIcon"]'));
assert.ok(card.querySelector('[data-icon="LinkSquare01Icon"]'));
assert.equal(
  card.querySelector(".bb-thread-hover-card__provider")?.parentElement,
  card.querySelector(".bb-thread-hover-card__header"),
);
assert.equal(
  card.querySelector(".bb-thread-hover-card__reasoning")?.textContent,
  "Extra High",
);
assert.equal(
  card.querySelector(".bb-thread-hover-card__provider-model")?.parentElement,
  card.querySelector(".bb-thread-hover-card__provider-identity"),
);
assert.equal(
  card.querySelector(".bb-thread-hover-card__reasoning")?.parentElement,
  card.querySelector(".bb-thread-hover-card__provider-identity"),
);
assert.equal(
  card.querySelector(".bb-thread-hover-card__provider-model")?.nextElementSibling,
  card.querySelector(".bb-thread-hover-card__reasoning"),
);
assert.deepEqual(
  Array.from(card.children).map((child) => child.className),
  [
    "bb-thread-hover-card__header",
    "bb-thread-hover-card__summary",
    "bb-thread-hover-card__context",
  ],
);
assert.equal(
  card.querySelector(".bb-thread-hover-card__summary")?.dataset.working,
  "true",
);

const pullRequestLink = card.querySelector(".bb-thread-hover-card__pr-link");
assert.ok(pullRequestLink);
assert.equal(
  pullRequestLink.firstElementChild?.getAttribute("data-icon"),
  "LinkSquare01Icon",
);
assert.equal(
  card.querySelector(".bb-thread-hover-card__pr")?.parentElement,
  card.querySelector(".bb-thread-hover-card__context"),
);
assert.equal(
  card.querySelector(".bb-thread-hover-card__project")?.parentElement,
  card.querySelector(".bb-thread-hover-card__context"),
);
assert.equal(
  card.querySelector(".bb-thread-hover-card__branch")?.parentElement,
  card.querySelector(".bb-thread-hover-card__context"),
);
assert.deepEqual(
  Array.from(
    card.querySelector(".bb-thread-hover-card__context")?.children ?? [],
  ).map((child) => child.className),
  [
    "bb-thread-hover-card__project",
    "bb-thread-hover-card__branch",
    "bb-thread-hover-card__pr",
  ],
);
assert.equal(
  card.querySelector(".bb-thread-hover-card__access")?.dataset.permissionMode,
  "full",
);
assert.ok(
  card
    .querySelector(".bb-thread-hover-card__access")
    ?.querySelector('[data-icon="SquareUnlock02Icon"]'),
);
assert.equal(
  card.querySelector(".bb-thread-hover-card__access")?.getAttribute("aria-label"),
  "Permission: Full access",
);
assert.equal(
  card.querySelector(".bb-thread-hover-card__access")?.dataset.location,
  "header",
);
assert.equal(
  card.querySelector(".bb-thread-hover-card__access")?.parentElement,
  card.querySelector(".bb-thread-hover-card__provider-identity"),
);
assert.equal(
  card.querySelector(".bb-thread-hover-card__reasoning")?.nextElementSibling,
  card.querySelector(".bb-thread-hover-card__access"),
);
assert.equal(
  card
    .querySelector(".bb-thread-hover-card__branch")
    ?.firstElementChild?.getAttribute("data-icon"),
  "GitBranchIcon",
);
assert.equal(
  card.querySelector(".bb-thread-hover-card__project-name")?.title,
  "acme/bb",
);
assert.equal(
  card.querySelector(".bb-thread-hover-card__branch-name")?.title,
  "feature/hover-cards",
);
assert.equal(
  card.querySelector(".bb-thread-hover-card__pr .bb-thread-hover-card__meta-label"),
  null,
);
assert.equal(pullRequestLink.href, "https://github.com/acme/bb/pull/42");
assert.equal(pullRequestLink.target, "_blank");
assert.equal(
  card.querySelector(".bb-thread-hover-card__pr-status")?.dataset.tone,
  "success",
);
assert.equal(
  card.querySelector(".bb-thread-hover-card__pr-status")?.dataset.state,
  "open",
);

const initialTimingRecords = globalThis.__bbThreadHoverCardTimings;
assert.ok(initialTimingRecords);
for (const operation of [
  "firstContent",
  "open",
  "summary",
  "timing",
  "pullRequest",
]) {
  assert.ok(
    initialTimingRecords.some((record) => record.operation === operation),
    `records ${operation} timing`,
  );
}
const initialOpenTiming = initialTimingRecords.find(
  (record) => record.operation === "open",
);
assert.equal(initialOpenTiming?.cache, "miss");
assert.equal(initialOpenTiming?.outcome, "ok");
assert.ok((initialOpenTiming?.durationMs ?? -1) >= 0);
const summaryTiming = initialTimingRecords.find(
  (record) => record.operation === "summary" && record.server,
);
assert.deepEqual(
  summaryTiming?.server?.stages.map((stage) => stage.name),
  ["thread", "project"],
  "retains per-source server timings in the client diagnostic buffer",
);

trigger.focus();
const focusedPointerOut = new window.Event("pointerout", { bubbles: true });
Object.defineProperties(focusedPointerOut, {
  pointerType: { value: "mouse" },
  relatedTarget: { value: window.document.body },
});
trigger.dispatchEvent(focusedPointerOut);
await new Promise((resolve) => setTimeout(resolve, 140));
assert.equal(card.hidden, false);

trigger.dispatchEvent(
  new window.KeyboardEvent("keydown", { bubbles: true, key: "Tab" }),
);
assert.equal(window.document.activeElement, pullRequestLink);

card.dispatchEvent(new window.Event("pointerleave"));
await new Promise((resolve) => setTimeout(resolve, 140));
assert.equal(card.hidden, false);
assert.equal(window.document.activeElement, pullRequestLink);

pullRequestLink.dispatchEvent(
  new window.KeyboardEvent("keydown", {
    bubbles: true,
    key: "Tab",
    shiftKey: true,
  }),
);
assert.equal(window.document.activeElement, trigger);

trigger.dispatchEvent(
  new window.KeyboardEvent("keydown", { bubbles: true, key: "Tab" }),
);
assert.equal(window.document.activeElement, pullRequestLink);
pullRequestLink.dispatchEvent(
  new window.KeyboardEvent("keydown", { bubbles: true, key: "Tab" }),
);
assert.equal(card.hidden, true);
assert.equal(window.document.activeElement, threadRowSuccessor);

trigger.focus();
await new Promise((resolve) => setTimeout(resolve, 20));
let rerenderedPullRequestLink = card.querySelector(
  ".bb-thread-hover-card__pr-link",
);
assert.ok(rerenderedPullRequestLink);
trigger.dispatchEvent(
  new window.KeyboardEvent("keydown", { bubbles: true, key: "Tab" }),
);
const shiftTabReplacement = trigger.cloneNode(true);
shiftTabReplacement.removeAttribute("aria-describedby");
trigger.replaceWith(shiftTabReplacement);
trigger = shiftTabReplacement;
rerenderedPullRequestLink.dispatchEvent(
  new window.KeyboardEvent("keydown", {
    bubbles: true,
    key: "Tab",
    shiftKey: true,
  }),
);
assert.equal(
  window.document.activeElement,
  trigger,
  "Shift+Tab resolves the current thread trigger after a row rerender",
);

trigger.dispatchEvent(
  new window.KeyboardEvent("keydown", { bubbles: true, key: "Tab" }),
);
const escapeReplacement = trigger.cloneNode(true);
escapeReplacement.removeAttribute("aria-describedby");
trigger.replaceWith(escapeReplacement);
trigger = escapeReplacement;
rerenderedPullRequestLink.dispatchEvent(
  new window.KeyboardEvent("keydown", { bubbles: true, key: "Escape" }),
);
assert.equal(card.hidden, true);
assert.equal(
  window.document.activeElement,
  trigger,
  "Escape restores focus to the replacement thread trigger",
);

threadRowSuccessor.focus();
trigger.focus();
await new Promise((resolve) => setTimeout(resolve, 20));
rerenderedPullRequestLink = card.querySelector(
  ".bb-thread-hover-card__pr-link",
);
assert.ok(rerenderedPullRequestLink);
trigger.dispatchEvent(
  new window.KeyboardEvent("keydown", { bubbles: true, key: "Tab" }),
);
assert.equal(window.document.activeElement, rerenderedPullRequestLink);
const triggerRow = trigger.parentElement;
assert.ok(triggerRow);
trigger.remove();
rerenderedPullRequestLink.dispatchEvent(
  new window.KeyboardEvent("keydown", { bubbles: true, key: "Tab" }),
);
assert.equal(card.hidden, true);
assert.equal(
  window.document.activeElement,
  threadRowSuccessor,
  "forward Tab uses the saved native successor when the row is removed",
);
trigger = window.document.createElement("a");
trigger.dataset.sidebarThreadId = "thr_1";
trigger.href = "/threads/thr_1";
trigger.textContent = "Thread";
triggerRow.append(trigger);

trigger.focus();
await new Promise((resolve) => setTimeout(resolve, 20));
const reopenedPullRequestLink = card.querySelector(
  ".bb-thread-hover-card__pr-link",
);
assert.ok(reopenedPullRequestLink);
trigger.dispatchEvent(
  new window.KeyboardEvent("keydown", { bubbles: true, key: "Tab" }),
);
assert.equal(window.document.activeElement, reopenedPullRequestLink);
reopenedPullRequestLink.dispatchEvent(
  new window.KeyboardEvent("keydown", { bubbles: true, key: "Escape" }),
);
assert.equal(card.hidden, true);
assert.equal(trigger.hasAttribute("aria-describedby"), false);
assert.equal(window.document.activeElement, trigger);
await new Promise((resolve) => setTimeout(resolve, 20));
assert.equal(card.hidden, true);

testNow += 11_000;
delayNextRefreshFor = "thr_1";
trigger.blur();
trigger.focus();
await new Promise((resolve) => setTimeout(resolve, 20));

assert.equal(card.hidden, false);
const stalePullRequestLink = card.querySelector(
  ".bb-thread-hover-card__pr-link",
);
assert.ok(stalePullRequestLink);
trigger.dispatchEvent(
  new window.KeyboardEvent("keydown", { bubbles: true, key: "Tab" }),
);
assert.equal(window.document.activeElement, stalePullRequestLink);
assert.ok(delayedRefresh);
delayedRefresh();
await new Promise((resolve) => setTimeout(resolve, 20));

const refreshedPullRequestLink = card.querySelector(
  ".bb-thread-hover-card__pr-link",
);
assert.ok(refreshedPullRequestLink);
assert.notEqual(refreshedPullRequestLink, stalePullRequestLink);
assert.equal(window.document.activeElement, refreshedPullRequestLink);
delayedRefresh = null;
refreshedPullRequestLink.dispatchEvent(
  new window.KeyboardEvent("keydown", { bubbles: true, key: "Escape" }),
);
assert.equal(card.hidden, true);

trigger.blur();
threadRowSuccessor.focus();
trigger.dataset.sidebarThreadId = "thr_2";
const quickPointerOver = new window.Event("pointerover", { bubbles: true });
Object.defineProperties(quickPointerOver, {
  pointerType: { value: "mouse" },
  relatedTarget: { value: null },
});
trigger.dispatchEvent(quickPointerOver);
await new Promise((resolve) => setTimeout(resolve, 30));

const quickPointerOut = new window.Event("pointerout", { bubbles: true });
Object.defineProperties(quickPointerOut, {
  pointerType: { value: "mouse" },
  relatedTarget: { value: window.document.body },
});
trigger.dispatchEvent(quickPointerOut);
await new Promise((resolve) => setTimeout(resolve, 280));

assert.equal(card.hidden, true);
assert.deepEqual(requestBodies, [
  { threadId: "thr_1" },
  { threadId: "thr_1" },
  { threadId: "thr_2" },
]);

trigger.blur();
trigger.dataset.sidebarThreadId = "thr_local";
trigger.focus();
await new Promise((resolve) => setTimeout(resolve, 20));

assert.equal(card.hidden, false);
assert.match(card.textContent, /~\/\.bb\/…\/env_pmgnprh2j6/);
assert.equal(
  card.querySelector(".bb-thread-hover-card__runtime [data-time-value]")
    ?.textContent,
  "2m",
);
assert.equal(
  card.querySelector(".bb-thread-hover-card__runtime")?.title,
  "Total agent time 2m",
);
assert.equal(
  card.querySelector(".bb-thread-hover-card__runtime .bb-thread-hover-card__sr-only")
    ?.textContent,
  "Total agent time ",
);
assert.equal(
  card.querySelector(".bb-thread-hover-card__runtime")?.parentElement,
  card.querySelector(".bb-thread-hover-card__times"),
);
assert.equal(
  card.querySelector(".bb-thread-hover-card__times")?.parentElement,
  card.querySelector(".bb-thread-hover-card__header"),
);
assert.equal(
  card
    .querySelector(".bb-thread-hover-card__runtime")
    ?.querySelector('[data-icon="CheckmarkCircle02Icon"]')
    ?.getAttribute("data-tone"),
  "success",
);
assert.equal(
  card
    .querySelector(".bb-thread-hover-card__runtime")
    ?.querySelector('[data-icon="CheckmarkCircle02Icon"]')
    ?.hasAttribute("data-animated"),
  false,
);
assert.equal(
  card
    .querySelector(".bb-thread-hover-card__runtime")
    ?.querySelector('[data-icon="AlarmClockIcon"]'),
  null,
);
assert.equal(
  card.querySelector(".bb-thread-hover-card__local")?.getAttribute("aria-label"),
  "Local workspace: /Users/test/.bb/personal-workspaces/env_pmgnprh2j6",
);
assert.equal(
  card.querySelector(".bb-thread-hover-card__local-path")?.title,
  "/Users/test/.bb/personal-workspaces/env_pmgnprh2j6",
);
assert.deepEqual(
  Array.from(card.children).map((child) => child.className),
  [
    "bb-thread-hover-card__header",
    "bb-thread-hover-card__summary",
    "bb-thread-hover-card__context",
    "bb-thread-hover-card__local",
  ],
);
assert.match(
  card.textContent,
  /Done—hover cards are ready for foo_bar_baz, _literal_, and tests with Cmd\+R\./,
);
assert.doesNotMatch(card.textContent, /Agent update—implementing/);
assert.doesNotMatch(card.textContent, /##|\|\s*Work\s*\||---|Canary/);
assert.doesNotMatch(card.textContent, /No Git repository/);
assert.equal(
  card.querySelector(".bb-thread-hover-card__summary")?.dataset.working,
  undefined,
);
assert.ok(card.querySelector(".bb-thread-hover-card__inline-strong"));
assert.ok(card.querySelector(".bb-thread-hover-card__inline-emphasis"));
assert.ok(card.querySelector(".bb-thread-hover-card__inline-code"));
assert.ok(card.querySelector('[data-icon="LaptopIcon"]'));
assert.ok(card.querySelector('[data-icon="CheckmarkCircle02Icon"]'));
assert.equal(
  card.querySelector(".bb-thread-hover-card__access")?.textContent,
  "Auto",
);
assert.ok(
  card
    .querySelector(".bb-thread-hover-card__access")
    ?.querySelector('[data-icon="ViewIcon"]'),
);
assert.equal(
  card.querySelector(".bb-thread-hover-card__access")?.parentElement,
  card.querySelector(".bb-thread-hover-card__provider-identity"),
);
assert.equal(card.querySelector(".bb-thread-hover-card__status-icon"), null);
assert.deepEqual(requestBodies, [
  { threadId: "thr_1" },
  { threadId: "thr_1" },
  { threadId: "thr_2" },
  { threadId: "thr_local" },
]);

trigger.blur();
await new Promise((resolve) => setTimeout(resolve, 140));
trigger.dataset.sidebarThreadId = "thr_no_pr";
trigger.focus();
await new Promise((resolve) => setTimeout(resolve, 20));

assert.equal(card.hidden, false);
assert.match(card.textContent, /acme\/bb/);
assert.ok(
  card
    .querySelector(".bb-thread-hover-card__times")
    ?.querySelector('[data-icon="Loading03Icon"]'),
);
assert.equal(card.querySelector(".bb-thread-hover-card__runtime"), null);
assert.doesNotMatch(card.textContent, /No PR/);
assert.equal(card.querySelector(".bb-thread-hover-card__summary"), null);
assert.equal(card.querySelector(".bb-thread-hover-card__pr"), null);
assert.deepEqual(
  Array.from(card.children).map((child) => child.className),
  [
    "bb-thread-hover-card__header",
    "bb-thread-hover-card__context",
  ],
);
assert.deepEqual(requestBodies, [
  { threadId: "thr_1" },
  { threadId: "thr_1" },
  { threadId: "thr_2" },
  { threadId: "thr_local" },
  { threadId: "thr_no_pr" },
]);

trigger.blur();
await new Promise((resolve) => setTimeout(resolve, 140));
trigger.dataset.sidebarThreadId = "thr_pr_unavailable";
trigger.focus();
await new Promise((resolve) => setTimeout(resolve, 20));

assert.equal(card.hidden, false);
assert.equal(card.querySelector(".bb-thread-hover-card__pr"), null);
assert.doesNotMatch(card.textContent, /PR unavailable/);
assert.deepEqual(requestBodies, [
  { threadId: "thr_1" },
  { threadId: "thr_1" },
  { threadId: "thr_2" },
  { threadId: "thr_local" },
  { threadId: "thr_no_pr" },
  { threadId: "thr_pr_unavailable" },
]);

trigger.blur();
await new Promise((resolve) => setTimeout(resolve, 140));
trigger.dataset.sidebarThreadId = "thr_draft_pr";
trigger.focus();
await new Promise((resolve) => setTimeout(resolve, 20));

assert.equal(card.hidden, false);
assert.match(card.textContent, /#42Draft/);
assert.equal(
  card.querySelector(".bb-thread-hover-card__pr-status")?.dataset.tone,
  "muted",
);
assert.equal(
  card.querySelector(".bb-thread-hover-card__pr-status")?.dataset.state,
  "draft",
);
assert.equal(
  card.querySelector(".bb-thread-hover-card__access")?.textContent,
  "Accept edits",
);
assert.ok(
  card
    .querySelector(".bb-thread-hover-card__access")
    ?.querySelector('[data-icon="FolderEditIcon"]'),
);
assert.deepEqual(requestBodies, [
  { threadId: "thr_1" },
  { threadId: "thr_1" },
  { threadId: "thr_2" },
  { threadId: "thr_local" },
  { threadId: "thr_no_pr" },
  { threadId: "thr_pr_unavailable" },
  { threadId: "thr_draft_pr" },
]);

const pluginCssLink = window.document.querySelector(
  'link[data-bb-plugin-css="thread-hover-cards"]',
);
assert.ok(pluginCssLink);
pluginCssLink.remove();
await new Promise((resolve) => setTimeout(resolve, 0));

assert.equal(card.isConnected, false);
assert.equal(window.document.getElementById("bb-thread-hover-card-styles"), null);

const replacementCssLink = window.document.createElement("link");
replacementCssLink.dataset.bbPluginCss = "thread-hover-cards";
replacementCssLink.href = "/plugins/thread-hover-cards/app.css?hash=next";
window.document.head.append(replacementCssLink);
await new Promise((resolve) => setTimeout(resolve, 0));

assert.ok(window.document.getElementById("bb-thread-hover-card-styles"));

trigger.blur();
trigger.dataset.sidebarThreadId = "thr_reload";
const reloadPointerOver = new window.Event("pointerover", { bubbles: true });
Object.defineProperties(reloadPointerOver, {
  pointerType: { value: "mouse" },
  relatedTarget: { value: null },
});
trigger.dispatchEvent(reloadPointerOver);
assert.ok(
  window.document.getElementById("bb-thread-hover-card"),
  "keeps immediate opening after the plugin lifecycle reloads",
);
await new Promise((resolve) => setTimeout(resolve, 20));

const reloadedCard = window.document.getElementById("bb-thread-hover-card");
assert.ok(reloadedCard);
assert.equal(reloadedCard.hidden, false);
assert.deepEqual(requestBodies, [
  { threadId: "thr_1" },
  { threadId: "thr_1" },
  { threadId: "thr_2" },
  { threadId: "thr_local" },
  { threadId: "thr_no_pr" },
  { threadId: "thr_pr_unavailable" },
  { threadId: "thr_draft_pr" },
  { threadId: "thr_reload" },
]);
trigger.focus();
const reloadedPullRequestLink = reloadedCard.querySelector(
  ".bb-thread-hover-card__pr-link",
);
assert.ok(reloadedPullRequestLink);
trigger.dispatchEvent(
  new window.KeyboardEvent("keydown", { bubbles: true, key: "Tab" }),
);
assert.equal(window.document.activeElement, reloadedPullRequestLink);

reloadedPullRequestLink.blur();
await new Promise((resolve) => setTimeout(resolve, 140));
trigger.dataset.sidebarThreadId = "thr_done_without_completion";
trigger.focus();
await new Promise((resolve) => setTimeout(resolve, 80));

assert.equal(
  reloadedCard.querySelector(".bb-thread-hover-card__runtime [data-time-value]")
    ?.textContent,
  "1m",
);
assert.equal(
  reloadedCard.querySelector(".bb-thread-hover-card__runtime")?.title,
  "Total agent time 1m",
);
assert.ok(
  reloadedCard
    .querySelector(".bb-thread-hover-card__runtime")
    ?.querySelector('[data-icon="CheckmarkCircle02Icon"]'),
);
assert.deepEqual(requestBodies.at(-1), {
  threadId: "thr_done_without_completion",
});

trigger.blur();
await new Promise((resolve) => setTimeout(resolve, 140));
trigger.dataset.sidebarThreadId = "thr_state_race";
trigger.focus();
await new Promise((resolve) => setTimeout(resolve, 80));

assert.equal(
  reloadedCard.querySelector(".bb-thread-hover-card__runtime")?.title,
  "Total agent time 1m",
);
assert.ok(
  reloadedCard
    .querySelector(".bb-thread-hover-card__runtime")
    ?.querySelector('[data-icon="CheckmarkCircle02Icon"]'),
);
assert.equal(
  reloadedCard.querySelector(".bb-thread-hover-card__summary")?.dataset.working,
  undefined,
  "timing hydration updates status with its timestamps",
);
assert.equal(
  timingRequestBodies.filter(({ threadId }) => threadId === "thr_state_race")
    .length,
  1,
  "applies a newer status mismatch without retrying timing indefinitely",
);

async function closeAndOpenThread(threadId, settleMs = 20) {
  trigger.blur();
  threadRowSuccessor.focus();
  await new Promise((resolve) => setTimeout(resolve, 140));
  trigger.dataset.sidebarThreadId = threadId;
  trigger.focus();
  await new Promise((resolve) => setTimeout(resolve, settleMs));
}

delayNextSummaryFor.add("thr_first_content");
const firstContentRecordCount =
  globalThis.__bbThreadHoverCardTimings?.filter(
    ({ operation, threadId }) =>
      operation === "firstContent" && threadId === "thr_first_content",
  ).length ?? 0;
await closeAndOpenThread("thr_first_content", 0);
assert.match(reloadedCard.textContent, /Loading thread summary/);
assert.equal(
  globalThis.__bbThreadHoverCardTimings?.filter(
    ({ operation, threadId }) =>
      operation === "firstContent" && threadId === "thr_first_content",
  ).length ?? 0,
  firstContentRecordCount,
  "does not complete first-content timing while cold data is pending",
);
await new Promise((resolve) => setTimeout(resolve, 25));
testMonotonicNow += 25;
delayedSummaryResponses.get("thr_first_content")?.();
await new Promise((resolve) => setTimeout(resolve, 20));
const coldFirstContent = globalThis.__bbThreadHoverCardTimings
  ?.filter(
    ({ operation, threadId }) =>
      operation === "firstContent" && threadId === "thr_first_content",
  )
  .at(-1);
assert.equal(coldFirstContent?.cache, "miss");
assert.equal(coldFirstContent?.outcome, "ok");
assert.ok(
  (coldFirstContent?.durationMs ?? 0) >= 20,
  "measures hover-to-content latency across the delayed cold request",
);
await closeAndOpenThread("thr_first_content", 0);
const cachedFirstContent = globalThis.__bbThreadHoverCardTimings
  ?.filter(
    ({ operation, threadId }) =>
      operation === "firstContent" && threadId === "thr_first_content",
  )
  .at(-1);
assert.equal(cachedFirstContent?.cache, "fresh");
assert.ok((cachedFirstContent?.durationMs ?? 100) < 10);

const fanoutTriggers = [];
for (const threadId of ["thr_fanout_a", "thr_fanout_b", "thr_fanout_c"]) {
  const row = window.document.createElement("div");
  row.className = "group/thread-row";
  const fanoutTrigger = window.document.createElement("a");
  fanoutTrigger.dataset.sidebarThreadId = threadId;
  fanoutTrigger.href = `/threads/${threadId}`;
  fanoutTrigger.textContent = threadId;
  row.append(fanoutTrigger);
  window.document.body.insertBefore(row, threadRowSuccessor);
  fanoutTriggers.push(fanoutTrigger);
  delayNextSummaryFor.add(threadId);
}
trigger.blur();
threadRowSuccessor.focus();
await new Promise((resolve) => setTimeout(resolve, 140));
activeDelayedSummaryRequests = 0;
maxActiveDelayedSummaryRequests = 0;
for (let index = 0; index < fanoutTriggers.length; index += 1) {
  const pointerOver = new window.Event("pointerover", { bubbles: true });
  Object.defineProperties(pointerOver, {
    pointerType: { value: "mouse" },
    relatedTarget: { value: fanoutTriggers[index - 1] ?? null },
  });
  fanoutTriggers[index].dispatchEvent(pointerOver);
}
assert.deepEqual(
  abortedSummaryThreadIds.slice(-2),
  ["thr_fanout_a", "thr_fanout_b"],
  "aborts superseded cold summary requests",
);
assert.equal(maxActiveDelayedSummaryRequests, 1);
assert.equal(activeDelayedSummaryRequests, 1);
const fanoutMetadata = summaryRequestMetadata.filter(({ threadId }) =>
  threadId.startsWith("thr_fanout_"),
);
assert.equal(fanoutMetadata.length, 3);
assert.equal(new Set(fanoutMetadata.map(({ clientId }) => clientId)).size, 1);
assert.deepEqual(
  fanoutMetadata.map(({ generation }) => generation),
  [...fanoutMetadata.map(({ generation }) => generation)].sort(
    (left, right) => left - right,
  ),
  "sends monotonic generations so the server can discard queued requests",
);
delayedSummaryResponses.get("thr_fanout_c")?.();
await new Promise((resolve) => setTimeout(resolve, 20));
assert.match(reloadedCard.textContent, /Agent update for thr_fanout_c/);
assert.equal(activeDelayedSummaryRequests, 0);

await closeAndOpenThread("thr_summary_before_timing", 20);
const summaryFirstTimingCount = timingRequestBodies.filter(
  ({ threadId }) => threadId === "thr_summary_before_timing",
).length;
const summaryFirstRuntime = reloadedCard.querySelector(
  ".bb-thread-hover-card__runtime",
);
assert.ok(summaryFirstRuntime);
testNow += 2_100;
delayNextTimingFor.add("thr_summary_before_timing");
await closeAndOpenThread("thr_summary_before_timing", 10);
assert.ok(delayedTimingResponses.has("thr_summary_before_timing"));
assert.ok(
  reloadedCard.querySelector(".bb-thread-hover-card__runtime"),
  "keeps hydrated runtime while summary resolves before timing",
);
delayedTimingResponses.get("thr_summary_before_timing")?.();
await new Promise((resolve) => setTimeout(resolve, 20));
assert.ok(reloadedCard.querySelector(".bb-thread-hover-card__runtime"));
assert.equal(
  timingRequestBodies.filter(
    ({ threadId }) => threadId === "thr_summary_before_timing",
  ).length,
  summaryFirstTimingCount + 1,
  "issues one timing request when summary resolves first",
);

await closeAndOpenThread("thr_timing_before_summary", 20);
const timingFirstRequestCount = timingRequestBodies.filter(
  ({ threadId }) => threadId === "thr_timing_before_summary",
).length;
testNow += 1_100;
delayNextTimingFor.add("thr_timing_before_summary");
await closeAndOpenThread("thr_timing_before_summary", 10);
assert.ok(delayedTimingResponses.has("thr_timing_before_summary"));
trigger.blur();
threadRowSuccessor.focus();
await new Promise((resolve) => setTimeout(resolve, 140));
testNow += 1_100;
delayNextSummaryFor.add("thr_timing_before_summary");
trigger.focus();
await new Promise((resolve) => setTimeout(resolve, 0));
assert.ok(delayedSummaryResponses.has("thr_timing_before_summary"));
delayedTimingResponses.get("thr_timing_before_summary")?.();
await new Promise((resolve) => setTimeout(resolve, 0));
assert.ok(
  reloadedCard.querySelector(".bb-thread-hover-card__runtime"),
  "renders newer timing before the delayed summary settles",
);
delayedSummaryResponses.get("thr_timing_before_summary")?.();
await new Promise((resolve) => setTimeout(resolve, 20));
assert.ok(
  reloadedCard.querySelector(".bb-thread-hover-card__runtime"),
  "does not erase newer timing when the summary arrives later",
);
assert.equal(
  timingRequestBodies.filter(
    ({ threadId }) => threadId === "thr_timing_before_summary",
  ).length,
  timingFirstRequestCount + 2,
  "retries an older timing snapshot once after the newer summary settles",
);

idleRestartIsActive = false;
await closeAndOpenThread("thr_idle_restart", 20);
assert.match(reloadedCard.textContent, /Finished agent update/);
const idleRestartSummaryCount = requestBodies.filter(
  ({ threadId }) => threadId === "thr_idle_restart",
).length;
idleRestartIsActive = true;
testNow += 5_100;
delayNextSummaryFor.add("thr_idle_restart");
await closeAndOpenThread("thr_idle_restart", 0);
assert.match(
  reloadedCard.textContent,
  /Finished agent update/,
  "paints the stale idle card synchronously",
);
assert.ok(delayedSummaryResponses.has("thr_idle_restart"));
assert.equal(
  requestBodies.filter(({ threadId }) => threadId === "thr_idle_restart")
    .length,
  idleRestartSummaryCount + 1,
  "starts one soft-TTL revalidation",
);
delayedSummaryResponses.get("thr_idle_restart")?.();
await new Promise((resolve) => setTimeout(resolve, 20));
assert.match(reloadedCard.textContent, /Restarted agent update/);
assert.equal(
  reloadedCard.querySelector(".bb-thread-hover-card__summary")?.dataset.working,
  "true",
);

branchTestBranch = "branch-a";
delayNextPullRequestFor.add("thr_branch_identity");
await closeAndOpenThread("thr_branch_identity", 20);
assert.match(reloadedCard.textContent, /branch-a/);
assert.ok(delayedPullRequestResponses.has("thr_branch_identity"));
branchTestBranch = "branch-b";
testNow += 2_100;
await closeAndOpenThread("thr_branch_identity", 20);
assert.match(reloadedCard.textContent, /branch-b/);
assert.match(reloadedCard.textContent, /#42/);
assert.doesNotMatch(reloadedCard.textContent, /#41/);
delayedPullRequestResponses.get("thr_branch_identity")?.();
await new Promise((resolve) => setTimeout(resolve, 20));
assert.match(reloadedCard.textContent, /branch-b/);
assert.match(reloadedCard.textContent, /#42/);
assert.doesNotMatch(
  reloadedCard.textContent,
  /#41/,
  "ignores a late PR response for the previous branch",
);

for (const expected of [
  {
    threadId: "thr_blocked_pr",
    signal: "Blocked",
    state: "open",
    tone: "danger",
  },
  {
    threadId: "thr_failing_pr",
    signal: "Checks failing",
    state: "open",
    tone: "danger",
  },
  {
    threadId: "thr_ready_pr",
    signal: "Ready to merge",
    state: "open",
    tone: "success",
  },
  {
    threadId: "thr_pending_pr",
    signal: "Checks pending",
    state: "open",
    tone: "muted",
  },
  {
    threadId: "thr_merged_pr",
    signal: "Merged",
    state: "merged",
    tone: "merged",
  },
  {
    threadId: "thr_closed_pr",
    signal: "Closed",
    state: "closed",
    tone: "danger",
  },
]) {
  trigger.blur();
  await new Promise((resolve) => setTimeout(resolve, 140));
  trigger.dataset.sidebarThreadId = expected.threadId;
  trigger.focus();
  await new Promise((resolve) => setTimeout(resolve, 80));

  const status = reloadedCard.querySelector(
    ".bb-thread-hover-card__pr-status",
  );
  assert.equal(status?.textContent, expected.signal);
  assert.equal(status?.dataset.state, expected.state);
  assert.equal(status?.dataset.tone, expected.tone);
}

const lruTriggers = [];
for (const threadId of [
  "thr_lru_old",
  "thr_lru_recent",
  ...Array.from({ length: 126 }, (_, index) => `thr_lru_fill_${index}`),
]) {
  const row = window.document.createElement("div");
  row.className = "group/thread-row";
  const lruTrigger = window.document.createElement("a");
  lruTrigger.dataset.sidebarThreadId = threadId;
  lruTrigger.href = `/threads/${threadId}`;
  lruTrigger.textContent = threadId;
  row.append(lruTrigger);
  window.document.body.insertBefore(row, threadRowSuccessor);
  lruTriggers.push(lruTrigger);
}

for (const lruTrigger of lruTriggers) {
  lruTrigger.focus();
  await new Promise((resolve) => setTimeout(resolve, 0));
}
await new Promise((resolve) => setTimeout(resolve, 20));

const oldRequestsBefore = requestBodies.filter(
  ({ threadId }) => threadId === "thr_lru_old",
).length;

threadRowSuccessor.focus();
lruTriggers[1].focus();
await new Promise((resolve) => setTimeout(resolve, 20));
const recentRequestsBefore = requestBodies.filter(
  ({ threadId }) => threadId === "thr_lru_recent",
).length;
threadRowSuccessor.focus();
lruTriggers[1].focus();
await new Promise((resolve) => setTimeout(resolve, 20));
assert.equal(
  requestBodies.filter(({ threadId }) => threadId === "thr_lru_recent").length,
  recentRequestsBefore,
);

const evictionRow = window.document.createElement("div");
evictionRow.className = "group/thread-row";
const evictionTrigger = window.document.createElement("a");
evictionTrigger.dataset.sidebarThreadId = "thr_lru_eviction";
evictionTrigger.href = "/threads/thr_lru_eviction";
evictionTrigger.textContent = "thr_lru_eviction";
evictionRow.append(evictionTrigger);
window.document.body.insertBefore(evictionRow, threadRowSuccessor);
evictionTrigger.focus();
await new Promise((resolve) => setTimeout(resolve, 20));

lruTriggers[1].focus();
await new Promise((resolve) => setTimeout(resolve, 20));
assert.equal(
  requestBodies.filter(({ threadId }) => threadId === "thr_lru_recent").length,
  recentRequestsBefore,
);

lruTriggers[0].focus();
await new Promise((resolve) => setTimeout(resolve, 20));
assert.equal(
  requestBodies.filter(({ threadId }) => threadId === "thr_lru_old").length,
  oldRequestsBefore + 1,
);

assert.ok(
  (globalThis.__bbThreadHoverCardTimings?.length ?? 0) <= 200,
  "bounds the client timing history",
);
globalThis.__bbThreadHoverCards?.dispose();
assert.equal(window.document.getElementById("bb-thread-hover-card-styles"), null);
Date.now = realDateNow;
globalThis.performance = realPerformance;
dom.window.close();
