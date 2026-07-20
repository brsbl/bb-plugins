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
  window,
  requestAnimationFrame(callback) {
    callback(0);
    return 1;
  },
});

const requestBodies = [];
const timingRequestBodies = [];
let delayedRefresh = null;
let delayNextRefreshFor = null;
globalThis.fetch = async (url, init) => {
  const request = JSON.parse(init.body);
  const isLocal = request.threadId === "thr_local";
  const hasNoPullRequest = request.threadId === "thr_no_pr";
  const pullRequestUnavailable = request.threadId === "thr_pr_unavailable";
  const isDraftPullRequest = request.threadId === "thr_draft_pr";
  const isDoneWithoutCompletion =
    request.threadId === "thr_done_without_completion";
  const isStateRace = request.threadId === "thr_state_race";
  const now = Date.now();
  if (String(url).endsWith("/threadTiming")) {
    timingRequestBodies.push(request);
    return new Response(
      JSON.stringify({
        ok: true,
        result: {
          currentTurnCompletedAt:
            isLocal || isStateRace ? now - 65_000 : null,
          currentTurnStartedAt: isLocal
            ? now - 185_000
            : isStateRace
              ? now - 125_000
              : hasNoPullRequest
                ? null
                : now - 65_000,
          status:
            isLocal || isDoneWithoutCompletion || isStateRace
              ? "idle"
              : "active",
        },
      }),
      { headers: { "content-type": "application/json" }, status: 200 },
    );
  }

  requestBodies.push(request);
  const response = new Response(
    JSON.stringify({
      ok: true,
      result: {
        currentTurnCompletedAt: null,
        currentTurnStartedAt: null,
        latestAssistantMessage: isLocal
          ? "**Done**—hover cards are *ready* for foo_bar_baz, \\_literal\\_, and __tests__ with `Cmd+R`.\n\n## Canary\nIgnore this secondary section.\n\n| Work | PR | Status |\n| --- | --- | --- |\n| Hover cards | #42 | Ready |"
          : hasNoPullRequest
            ? null
            : "**Agent update**—implementing concise hover cards for foo_bar_baz and \\_literal\\_",
        permissionMode: isLocal
          ? "readonly"
          : isDraftPullRequest
            ? "workspace-write"
            : "full",
        pullRequest:
          isLocal || hasNoPullRequest
            ? { kind: "absent" }
            : pullRequestUnavailable
              ? { kind: "unavailable" }
              : {
                  kind: "available",
                  number: 42,
                  signal: isDraftPullRequest ? "Draft" : "Checks passing",
                  state: isDraftPullRequest ? "draft" : "open",
                  title: "Thread previews",
                  url: "https://github.com/acme/bb/pull/42",
                },
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
              branch: "feature/hover-cards",
              isGitRepository: true,
              name: "acme/bb",
              path: "/workspace/acme/bb",
            },
        status: isLocal || isDoneWithoutCompletion ? "idle" : "active",
      },
    }),
    { headers: { "content-type": "application/json" }, status: 200 },
  );
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
await new Promise((resolve) => setTimeout(resolve, 70));

assert.equal(window.document.getElementById("bb-thread-hover-card"), null);
assert.deepEqual(
  requestBodies,
  [{ threadId: "thr_1" }],
  "prefetches after hover intent before the card opens",
);
assert.deepEqual(
  timingRequestBodies,
  [],
  "defers expensive timing until the summary can render",
);
await new Promise((resolve) => setTimeout(resolve, 110));

const card = window.document.getElementById("bb-thread-hover-card");
assert.ok(card);
assert.equal(card.hidden, false);
assert.equal(card.dataset.bbPlugin, "thread-hover-cards");
assert.equal(card.hasAttribute("data-bb-portaled-overlay"), true);
assert.equal(trigger.getAttribute("aria-describedby"), "bb-thread-hover-card");
assert.deepEqual(requestBodies, [{ threadId: "thr_1" }]);
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

const realDateNow = Date.now;
Date.now = () => realDateNow() + 11_000;
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
Date.now = realDateNow;
delayedRefresh = null;
refreshedPullRequestLink.dispatchEvent(
  new window.KeyboardEvent("keydown", { bubbles: true, key: "Escape" }),
);
assert.equal(card.hidden, true);

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
  "Read only",
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
  "Workspace write",
);
assert.ok(
  card
    .querySelector(".bb-thread-hover-card__access")
    ?.querySelector('[data-icon="FolderEditIcon"]'),
);
assert.deepEqual(requestBodies, [
  { threadId: "thr_1" },
  { threadId: "thr_1" },
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
await new Promise((resolve) => setTimeout(resolve, 120));

assert.equal(window.document.getElementById("bb-thread-hover-card"), null);
await new Promise((resolve) => setTimeout(resolve, 60));

const reloadedCard = window.document.getElementById("bb-thread-hover-card");
assert.ok(reloadedCard);
assert.equal(reloadedCard.hidden, false);
assert.deepEqual(requestBodies, [
  { threadId: "thr_1" },
  { threadId: "thr_1" },
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

globalThis.__bbThreadHoverCards?.dispose();
assert.equal(window.document.getElementById("bb-thread-hover-card-styles"), null);
dom.window.close();
