import { createHash, randomUUID } from "node:crypto";
import type { BbPluginApi, JsonValue, PluginRpcHandlers, PluginThreadEventPayloads } from "@get-bb/plugin-sdk";
import { CronExpressionParser } from "cron-parser";
import { z } from "zod";

import {
  ACTION_CARDS_DECIDE_METHOD,
  REALTIME_CHANNEL,
  type CheckKind,
  type CoordinatorItem,
  type CoordinatorState,
  type CoordinatorTemplate,
  type GatedAction,
  type ItemPullRequest,
  type LogEntry,
  type PendingApproval,
  type RuleColumn,
} from "./contracts";
import {
  ACTION_LABELS,
  advanceItem,
  approvalCardContent,
  approvalCardRef,
  briefingHeadline,
  briefingLede,
  classifyUnmatchedCommand,
  composeBriefing,
  decideAction,
  evaluateCheck,
  instructionsFor,
  matchGatedCommands,
  oneLine,
  parseCardRef,
  qaCardContent,
  qaCardRef,
  renderBriefingMarkdown,
  stageName,
  SUB_THREAD_INSTRUCTIONS,
  type CheckEvidence,
  type Decision,
  type DecideCardContent,
} from "./model";
import {
  createStore,
  isPrimaryRole,
  type CardRecord,
  type CoordinatorRecord,
  type ItemRecord,
  type Membership,
  type ThreadRole,
} from "./store";
import type { rpcContract } from "./server";
import { BUILT_IN_TEMPLATES, parseTemplate } from "./templates";

// Plugin-sent messages each start a turn, so they are one line and sent only when a turn is needed.
const BRIEFING_NUDGE = "Coordinator Mode: briefing due. Call coordinator_briefing and share it as written.";
const TURN_ON_KICKOFF =
  "Coordinator Mode is on and existing sub-threads are tracked. Add a one-line summary to each with coordinator_update_item, then share coordinator_briefing's result.";
const NEW_COORDINATOR_KICKOFF = "Coordinator Mode is on. In one line, ask me what to work on first.";
const RULES_UPDATED = "Coordinator Mode rules updated; follow your new instructions.";
const REVIEW_INSTRUCTIONS =
  "Record your verdict with coordinator_review_verdict when the review is complete: pass true if the work is ready, or false with concrete findings. Only the verdict moves the item; saying it in chat does not.";

const COORDINATOR_TOOLS = [
  "coordinator_add_item",
  "coordinator_update_item",
  "coordinator_start_sub_thread",
  "coordinator_archive_sub_thread",
  "coordinator_merge_pr",
  "coordinator_set_link",
  "coordinator_briefing",
  "coordinator_cut_item",
] as const;
const REVIEWER_TOOLS = ["coordinator_review_verdict"] as const;

const PR_CHECKS: ReadonlySet<CheckKind> = new Set(["pr_open", "ci_green", "pr_merged"]);
/** Checks whose evidence is cleared on failure, so it is fresh by construction. */
const FRESH_BY_CONSTRUCTION: ReadonlySet<CheckKind> = new Set(["you_approve", "reviewer_passes"]);
const MAX_ADVANCES = 10;
/** How often an item past its first PR stage has its PR read just to spot a merge outside the rules. */
const MERGE_WATCH_INTERVAL_MS = 10 * 60_000;
/** Strictest first, for commands that chain several gated actions. */
const STRICTNESS: readonly RuleColumn[] = ["never", "ask", "alone"];
const DESCRIBE_TIMEOUT_MS = 180_000;
/** Debounce before a stage-change briefing nudge. */
const NUDGE_DELAY_MS = 30_000;
/** Log kinds kept out of briefings: every auto-approval is logged, but they are noise there. */
const QUIET_KINDS: ReadonlySet<LogEntry["kind"]> = new Set(["command_approved"]);

/** Action Cards, which shows decisions as owned cards, and Briefs (plugin id "digests"), which delivers scheduled briefs. */
const ACTION_CARDS_PLUGIN = "inline-action-cards";
const BRIEFS_PLUGIN = "digests";
/** After a failed call to another plugin, wait this long before trying it again. */
const PLUGIN_RETRY_MS = 60_000;
const createdCardSchema = z.object({ directive: z.string().min(1).max(500) });
const publishedBriefSchema = z.object({ threadId: z.string() });

type Thread = PluginThreadEventPayloads["thread.idle"]["thread"];
type Interaction = PluginThreadEventPayloads["interaction.pending"]["interaction"];
type PrEvidence = NonNullable<CheckEvidence["pr"]>;
type CardOutcome = "approved" | "declined" | "closed";
/** A decision that should have a live owned card. */
type WantedCard = { ref: string; content: DecideCardContent };

/** Arguments replayed when an approval is approved. Stored as plain JSON on the approval row. */
type ActionArgs =
  | { kind: "start"; itemId: string; prompt: string; title: string | null; role: ThreadRole }
  | { kind: "archive"; threadId: string; itemId: string | null }
  | { kind: "merge"; itemId: string }
  | { kind: "interaction"; threadId: string; interactionId: string; command: string; itemId: string | null };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function str(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const clip = oneLine;

/** Round-trips a value through JSON for plugin RPC input. */
function toJson(value: unknown): JsonValue {
  return JSON.parse(JSON.stringify(value)) as JsonValue;
}

/** A stable Action Cards id per decision ref: Action Cards upserts by ref, and ids must stay short and plain. */
function cardIdFor(ref: string): string {
  const kind = ref.startsWith("qa:") ? "qa" : "ap";
  return `cm-${kind}-${createHash("sha256").update(ref).digest("hex").slice(0, 16)}`;
}

function parseActionArgs(args: Record<string, unknown>): ActionArgs | null {
  switch (args.kind) {
    case "start": {
      const itemId = str(args.itemId);
      const prompt = str(args.prompt);
      if (!itemId || prompt === null) return null;
      return { kind: "start", itemId, prompt, title: str(args.title), role: args.role === "helper" || args.role === "reviewer" ? args.role : "primary" };
    }
    case "archive": {
      const threadId = str(args.threadId);
      return threadId ? { kind: "archive", threadId, itemId: str(args.itemId) } : null;
    }
    case "merge": {
      const itemId = str(args.itemId);
      return itemId ? { kind: "merge", itemId } : null;
    }
    case "interaction": {
      const threadId = str(args.threadId);
      const interactionId = str(args.interactionId);
      if (!threadId || !interactionId) return null;
      return { kind: "interaction", threadId, interactionId, command: str(args.command) ?? "", itemId: str(args.itemId) };
    }
    default:
      return null;
  }
}

/** Reads what Coordinator Mode needs from a pending interaction without trusting its exact union shape. */
function readApprovalRequest(interaction: Interaction): { kind: "command"; command: string } | { kind: "file_change" } | null {
  const payload: unknown = (interaction as { payload?: unknown }).payload;
  if (!isRecord(payload) || payload.kind !== "approval" || !isRecord(payload.subject)) return null;
  const subject = payload.subject;
  if (subject.kind === "command" && typeof subject.command === "string") return { kind: "command", command: subject.command };
  if (subject.kind === "file_change") return { kind: "file_change" };
  return null;
}

function mapPullRequest(response: unknown): ItemPullRequest | null {
  if (!isRecord(response) || response.outcome !== "available" || !isRecord(response.pullRequest)) return null;
  const pr = response.pullRequest;
  const state = pr.state === "open" || pr.state === "closed" || pr.state === "merged" || pr.state === "draft" ? pr.state : null;
  if (!state) return null;
  const checksState = isRecord(pr.checks) ? pr.checks.state : null;
  const checks = checksState === "passing" || checksState === "failing" || checksState === "pending" ? checksState : "none";
  return {
    number: typeof pr.number === "number" ? pr.number : null,
    url: typeof pr.url === "string" ? pr.url : null,
    state,
    checks,
  };
}

function publicState(record: CoordinatorRecord): CoordinatorState {
  return {
    threadId: record.threadId,
    template: record.template,
    paused: record.paused,
    autoApprove: record.autoApprove,
    appliedRulesVersion: record.appliedRulesVersion,
    rulesVersion: record.rulesVersion,
    lastOpenedAt: record.lastOpenedAt,
    lastBriefedAt: record.lastBriefedAt,
    createdAt: record.createdAt,
  };
}

function publicItem(record: ItemRecord): CoordinatorItem {
  return {
    id: record.id,
    coordinatorThreadId: record.coordinatorThreadId,
    title: record.title,
    stageIndex: record.stageIndex,
    status: record.status,
    reason: record.reason,
    link: record.link,
    primaryThreadId: record.primaryThreadId,
    helperThreadIds: record.helperThreadIds,
    proposed: false,
    summary: record.summary,
    waitingOn: record.waitingOn,
    pr: record.pr,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/** Extracts the first `{…}` block from an agent's reply and validates it as a template. */
function parseTemplateDraft(output: string): CoordinatorTemplate {
  const start = output.indexOf("{");
  const end = output.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("The draft had no JSON template in it. Try describing your stages and rules more concretely.");
  let json: unknown;
  try {
    json = JSON.parse(output.slice(start, end + 1));
  } catch {
    throw new Error("The draft was not valid JSON. Try again, or describe your process more concretely.");
  }
  try {
    return parseTemplate(json);
  } catch (error) {
    throw new Error(`The draft template needs a fix: ${errorMessage(error)} Try again or edit a built-in template instead.`);
  }
}

function describePrompt(description: string): string {
  const example = BUILT_IN_TEMPLATES.find((template) => template.id === "ship") ?? BUILT_IN_TEMPLATES[0];
  return [
    "Draft a Coordinator Mode template from the user's description below. Do not run commands, edit files, or use tools.",
    "Reply with ONLY one JSON object matching the example's shape, with no prose and no code fence.",
    "Rules: id is lowercase letters, numbers, and dashes. 2-12 stages; the first stage's check is \"none\" and no other stage uses \"none\".",
    "Checks: none, thread_done, pr_open, ci_green, pr_merged, you_approve, reviewer_passes, link_added.",
    "Gated rule actions: start_sub_thread, archive_sub_thread, merge_pr, digest_publish. Columns: alone, ask, never.",
    "Optional rule conditions: {\"kind\":\"before_stage_passes\",\"stage\":\"<a stage name>\"}, {\"kind\":\"while_merge_running\"}, {\"kind\":\"primary_only\"}.",
    "Anything that is not one of those gated actions becomes {\"kind\":\"instruction\",\"column\":...,\"text\":...}.",
    "briefingCron is a five-field cron expression or null (brief whenever an item changes stage); briefingLabel describes it in words. intakePrefix is a short chat prefix such as \"worker:\" or null.",
    "",
    `Example (the Ship template): ${JSON.stringify(example)}`,
    "",
    `User's description: ${JSON.stringify(description)}`,
  ].join("\n");
}

export function createService(bb: BbPluginApi) {
  const store = createStore(bb);
  const now = () => Date.now();

  // -------------------------------------------------------------------------
  // Membership: the store is the authority; this cache serves the sync configure().

  let membership = new Map<string, Membership>();
  const refreshMembership = () => {
    membership = new Map(store.memberships().map((entry) => [entry.threadId, entry]));
  };
  refreshMembership();

  const merging = new Set<string>();
  const nudges = new Map<string, ReturnType<typeof setTimeout>>();
  const evaluations = new Map<string, Promise<void>>();
  let disposed = false;

  const notifyPanel = (coordinatorThreadId: string) => {
    try {
      bb.realtime.publish(REALTIME_CHANNEL, { threadId: coordinatorThreadId });
    } catch (error) {
      bb.log.warn(`Coordinator Mode realtime publish failed: ${errorMessage(error)}`);
    }
  };

  /** Every state change goes through here: the panel refreshes and decision cards follow the new state. */
  const publish = (coordinatorThreadId: string) => {
    notifyPanel(coordinatorThreadId);
    void syncCards(coordinatorThreadId);
  };

  const log = (coordinatorThreadId: string, itemId: string | null, kind: LogEntry["kind"], text: string, action?: GatedAction) =>
    store.log.append({ coordinatorThreadId, itemId, kind, text, at: now(), action: action ?? null });

  const requireCoordinator = (threadId: string): CoordinatorRecord => {
    const coordinator = store.coordinators.get(threadId);
    if (!coordinator) throw new Error("This thread is not in Coordinator Mode.");
    return coordinator;
  };

  const requireItem = (itemId: string): ItemRecord => {
    const item = store.items.get(itemId);
    if (!item) throw new Error(`No item ${itemId}.`);
    return item;
  };

  const requireOwnItem = (coordinator: CoordinatorRecord, itemId: string): ItemRecord => {
    const item = requireItem(itemId);
    if (item.coordinatorThreadId !== coordinator.threadId) throw new Error(`Item ${itemId} belongs to another coordinator.`);
    return item;
  };

  // Messages never set a permission mode, so the thread keeps the access the user gave it.
  async function sendText(threadId: string, text: string): Promise<void> {
    await bb.sdk.threads.send({
      threadId,
      mode: "queue-if-active",
      input: [{ type: "text", text, mentions: [] }],
    });
  }

  /** Best-effort one-line note; each one starts a turn, so callers send it only when a turn is needed. */
  async function sendNote(threadId: string, text: string): Promise<void> {
    try {
      await sendText(threadId, clip(text, 600));
    } catch (error) {
      bb.log.warn(`Coordinator Mode could not message ${threadId}: ${errorMessage(error)}`);
    }
  }

  /** Stops the coordinator's session (if running) so its next message rebuilds tools and instructions. */
  async function restartSession(threadId: string, message: string): Promise<void> {
    // Always stop: it also releases an idle thread's loaded session, whose tool
    // list was fixed when it started, so the next turn picks up the new tools.
    try {
      await bb.sdk.threads.stop({ threadId });
    } catch (error) {
      bb.log.warn(`Coordinator Mode could not stop ${threadId}: ${errorMessage(error)}`);
    }
    await sendText(threadId, message);
  }

  function decide(coordinator: CoordinatorRecord, action: GatedAction, item: ItemRecord | undefined, isPrimaryThread: boolean): Decision {
    return decideAction(coordinator.template.rules, action, {
      item,
      template: coordinator.template,
      isPrimaryThread,
      mergeRunning: merging.has(coordinator.threadId),
    });
  }

  function block(item: ItemRecord, reason: string): void {
    const current = store.items.get(item.id);
    // Only open work can be blocked; a done or cut item keeps its status.
    if (current && (current.status === "active" || current.status === "blocked")) {
      store.items.save({ ...current, status: "blocked", reason, updatedAt: now() });
    }
  }

  function unblock(itemId: string | null): void {
    if (!itemId) return;
    const item = store.items.get(itemId);
    if (item?.status === "blocked") store.items.save({ ...item, status: "active", reason: null, updatedAt: now() });
  }

  // -------------------------------------------------------------------------
  // Gated actions

  async function environmentOf(threadId: string): Promise<string | null> {
    const thread = await bb.sdk.threads.get({ threadId });
    return thread.environmentId ?? null;
  }

  async function projectOf(coordinator: CoordinatorRecord): Promise<string> {
    if (coordinator.projectId) return coordinator.projectId;
    const thread = await bb.sdk.threads.get({ threadId: coordinator.threadId });
    store.coordinators.update(coordinator.threadId, { projectId: thread.projectId });
    return thread.projectId;
  }

  async function execute(coordinator: CoordinatorRecord, args: ActionArgs): Promise<string> {
    switch (args.kind) {
      case "start": {
        const item = requireOwnItem(coordinator, args.itemId);
        if (args.role === "primary" && item.primaryThreadId) {
          throw new Error(`"${item.title}" already has a primary sub-thread (${item.primaryThreadId}). Start a helper instead.`);
        }
        // Helpers and reviewers work in their item's checkout; primaries get the project's default environment.
        const helperEnvironment = args.role !== "primary" && item.primaryThreadId ? await environmentOf(item.primaryThreadId) : null;
        // Sub-threads run on the coordinator's provider and model rather than the project default:
        // command rules depend on the provider asking before it runs a command.
        const coordinatorThread = await bb.sdk.threads.get({ threadId: coordinator.threadId });
        const defaults = await bb.sdk.threads.defaultExecutionOptions({ threadId: coordinator.threadId });
        const execution = {
          providerId: coordinatorThread.providerId,
          ...(defaults
            ? { model: defaults.model, reasoningLevel: defaults.reasoningLevel, permissionMode: defaults.permissionMode }
            : { permissionMode: "accept-edits" as const }),
        };
        const thread = await bb.sdk.threads.spawn({
          projectId: await projectOf(coordinator),
          parentThreadId: coordinator.threadId,
          prompt: args.prompt,
          title: args.title ?? item.title,
          environment: helperEnvironment ? { type: "reuse", environmentId: helperEnvironment } : { type: "project-default" },
          ...execution,
          // Display hint only; the store is the authority on membership.
          pluginMetadata: { coordinatorThreadId: coordinator.threadId, itemId: item.id, role: args.role },
        });
        store.threads.add(item.id, thread.id, args.role);
        refreshMembership();
        unblock(item.id);
        return `Started ${args.role} sub-thread ${thread.id} for "${item.title}" (item ${item.id}).`;
      }
      case "archive": {
        await bb.sdk.threads.archive({ threadId: args.threadId });
        unblock(args.itemId);
        return `Archived sub-thread ${args.threadId}.`;
      }
      case "merge": {
        const item = requireOwnItem(coordinator, args.itemId);
        if (!item.primaryThreadId) throw new Error(`"${item.title}" has no primary sub-thread, so there is no PR to merge.`);
        const environmentId = await environmentOf(item.primaryThreadId);
        if (!environmentId) throw new Error(`"${item.title}"'s sub-thread has no environment with a PR.`);
        merging.add(coordinator.threadId);
        try {
          const result = await bb.sdk.environments.mergePullRequest({ environmentId, method: "squash" });
          unblock(item.id);
          void evaluateItem(item.id);
          return `Merged the PR for "${item.title}". ${result.message}`.trim();
        } finally {
          merging.delete(coordinator.threadId);
        }
      }
      case "interaction": {
        await bb.sdk.threads.interactions.resolve({
          threadId: args.threadId,
          interactionId: args.interactionId,
          resolution: { decision: "allow_once", grantedPermissions: null },
        });
        unblock(args.itemId);
        return `Allowed \`${clip(args.command, 120)}\`.`;
      }
    }
  }

  /** Runs one gated action through the coordinator rules: never, then ask, then alone. */
  async function runGated(
    coordinator: CoordinatorRecord,
    action: GatedAction,
    args: ActionArgs,
    context: { item?: ItemRecord; isPrimaryThread: boolean; summary: string },
  ): Promise<string> {
    if (coordinator.paused) return "Coordinator Mode is paused, so gated actions are off. Ask the user to resume it.";
    const itemId = context.item?.id ?? null;
    const decision = decide(coordinator, action, context.item, context.isPrimaryThread);
    if (decision.column === "never") {
      log(coordinator.threadId, itemId, "action_denied", `Refused to ${context.summary}. ${decision.reason}`, action);
      if (context.item) block(context.item, `Refused: ${decision.reason}`);
      publish(coordinator.threadId);
      return `Refused by the coordinator rules: ${decision.reason} Tell the user why and do not work around it.`;
    }
    if (decision.column === "ask") {
      const approval: PendingApproval = {
        id: randomUUID(),
        coordinatorThreadId: coordinator.threadId,
        itemId,
        action,
        summary: context.summary.charAt(0).toUpperCase() + context.summary.slice(1),
        args: { ...args },
        reason: decision.reason,
        createdAt: now(),
      };
      store.approvals.create(approval);
      log(coordinator.threadId, itemId, "action_asked", `Asked you to approve: ${context.summary}.`, action);
      publish(coordinator.threadId);
      return `Waiting for approval: ${context.summary}. The user decides on a card in the Coordinator panel and the briefing; you will get a message when they decide. Do not ask in prose or retry meanwhile.`;
    }
    const text = await execute(coordinator, args);
    log(coordinator.threadId, itemId, "action_run", text, action);
    publish(coordinator.threadId);
    return text;
  }

  // -------------------------------------------------------------------------
  // Evidence and stage changes

  function isFresh(item: ItemRecord): boolean {
    if (item.failedAt === null || !item.primaryThreadId) return true;
    const activity = store.activity.get(item.primaryThreadId);
    return activity.lastActiveAt !== null && activity.lastActiveAt > item.failedAt
      && activity.lastIdleAt !== null && activity.lastIdleAt >= activity.lastActiveAt;
  }

  async function hasPendingQuestion(threadId: string): Promise<boolean> {
    try {
      const pending: unknown = await bb.sdk.threads.interactions.list({ threadId });
      return Array.isArray(pending) && pending.some((entry) => isRecord(entry) && (entry.status === "pending" || entry.status === "resolving"));
    } catch {
      return false;
    }
  }

  /** Flags a merge that skipped the coordinator: rule broken when the rules said never, otherwise merged outside. */
  function noticeMerge(coordinator: CoordinatorRecord, item: ItemRecord, pr: PrEvidence | null): void {
    if (pr?.state !== "merged") return;
    if (store.log.has(item.id, ["action_run"], "merge_pr") || store.log.has(item.id, ["rule_broken", "merged_outside"])) return;
    const decision = decide(coordinator, "merge_pr", item, true);
    if (decision.column === "never") {
      log(coordinator.threadId, item.id, "rule_broken", `Rule broken: "${item.title}" was merged although the rules say ${decision.reason}`, "merge_pr");
    } else {
      log(coordinator.threadId, item.id, "merged_outside", `"${item.title}" was merged outside the coordinator.`, "merge_pr");
    }
    publish(coordinator.threadId);
  }

  async function readPullRequest(coordinator: CoordinatorRecord, item: ItemRecord): Promise<PrEvidence | null> {
    if (!item.primaryThreadId) return null;
    try {
      const environmentId = await environmentOf(item.primaryThreadId);
      if (!environmentId) return null;
      const pr = mapPullRequest(await bb.sdk.environments.pullRequest({ environmentId }));
      if (pr) {
        // Kept for the status line; a missing or unreadable PR leaves the last evidence in place.
        const changed = JSON.stringify(store.items.get(item.id)?.pr ?? null) !== JSON.stringify(pr);
        store.items.setPr(item.id, pr);
        if (changed) notifyPanel(coordinator.threadId);
      }
      noticeMerge(coordinator, item, pr);
      return pr;
    } catch (error) {
      bb.log.warn(`Coordinator Mode could not read the PR for item ${item.id}: ${errorMessage(error)}`);
      return null;
    }
  }

  async function gatherEvidence(
    coordinator: CoordinatorRecord,
    item: ItemRecord,
    check: CheckKind,
    prCache: { value?: PrEvidence | null },
  ): Promise<CheckEvidence> {
    switch (check) {
      case "none":
        return {};
      case "thread_done": {
        if (!item.primaryThreadId) return {};
        try {
          const thread = await bb.sdk.threads.get({ threadId: item.primaryThreadId });
          return { threadStatus: thread.status, pendingQuestion: await hasPendingQuestion(item.primaryThreadId) };
        } catch {
          return {};
        }
      }
      case "pr_open":
      case "ci_green":
      case "pr_merged":
        if (prCache.value === undefined) prCache.value = await readPullRequest(coordinator, item);
        return { pr: prCache.value };
      case "you_approve":
        return {
          approved: item.approved,
          ...(item.rejectedReason !== null ? { rejected: { reason: item.rejectedReason } } : {}),
        };
      case "reviewer_passes":
        return item.review ? { review: item.review } : {};
      case "link_added":
        return { link: item.link };
    }
  }

  async function evaluateNow(itemId: string): Promise<void> {
    let item = store.items.get(itemId);
    if (!item) return;
    const coordinator = store.coordinators.get(item.coordinatorThreadId);
    if (!coordinator || coordinator.paused) return;
    const { template } = coordinator;
    const prCache: { value?: PrEvidence | null } = {};
    let changed = false;
    for (let step = 0; step < MAX_ADVANCES; step += 1) {
      // Blocked items keep being checked so new evidence can move them on.
      if (item.status !== "active" && item.status !== "blocked") break;
      const stage = template.stages[item.stageIndex];
      if (!stage) break;
      // After a failure, only evidence produced by new work on the primary sub-thread counts.
      if (!FRESH_BY_CONSTRUCTION.has(stage.check) && !isFresh(item)) break;
      const result = evaluateCheck(stage.check, await gatherEvidence(coordinator, item, stage.check, prCache));
      const at = now();
      const outcome = advanceItem(item, template, result, at);
      if (!outcome.logKind) break;
      const failed = outcome.logKind === "stage_failed";
      // A pass lifts a block; advanceItem already cleared the reason.
      const status = !failed && outcome.item.status === "blocked" ? "active" : outcome.item.status;
      item = store.items.save({
        ...item,
        ...outcome.item,
        status,
        approved: false,
        rejectedReason: null,
        review: failed || stage.check === "reviewer_passes" ? null : item.review,
        failedAt: failed ? at : null,
      });
      log(coordinator.threadId, item.id, outcome.logKind, outcome.text);
      changed = true;
      if (failed) break;
      if (item.status === "done") {
        refreshMembership();
        await retireHelpers(coordinator, item);
        break;
      }
    }
    if (changed) {
      publish(coordinator.threadId);
      scheduleNudge(coordinator);
    }
  }

  /** Serializes evaluations per item so concurrent events never interleave writes. */
  function evaluateItem(itemId: string): Promise<void> {
    const previous = evaluations.get(itemId) ?? Promise.resolve();
    const next = previous.then(() => evaluateNow(itemId)).catch((error: unknown) => {
      bb.log.warn(`Coordinator Mode could not evaluate item ${itemId}: ${errorMessage(error)}`);
    });
    evaluations.set(itemId, next);
    void next.finally(() => {
      if (evaluations.get(itemId) === next) evaluations.delete(itemId);
    });
    return next;
  }

  /** Archives an item's helper sub-threads once it is done or cut, subject to the rules. */
  async function retireHelpers(coordinator: CoordinatorRecord, item: ItemRecord): Promise<void> {
    for (const threadId of item.helperThreadIds) {
      // Retiring is housekeeping: skip it quietly when the rules say never.
      if (decide(coordinator, "archive_sub_thread", item, false).column === "never") continue;
      try {
        await runGated(coordinator, "archive_sub_thread", { kind: "archive", threadId, itemId: null }, {
          item, isPrimaryThread: false, summary: `archive helper sub-thread ${threadId} of "${item.title}"`,
        });
      } catch (error) {
        bb.log.warn(`Coordinator Mode could not retire ${threadId}: ${errorMessage(error)}`);
      }
    }
  }

  function scheduleNudge(coordinator: CoordinatorRecord): void {
    if (coordinator.template.briefingCron !== null) return;
    const existing = nudges.get(coordinator.threadId);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      nudges.delete(coordinator.threadId);
      const current = store.coordinators.get(coordinator.threadId);
      if (current && !current.paused) void sendNote(current.threadId, BRIEFING_NUDGE);
    }, NUDGE_DELAY_MS);
    nudges.set(coordinator.threadId, timer);
  }

  function cronDue(coordinator: CoordinatorRecord, at: number): boolean {
    if (!coordinator.template.briefingCron) return false;
    try {
      const previous = CronExpressionParser.parse(coordinator.template.briefingCron, { currentDate: new Date(at) }).prev().getTime();
      return previous > coordinator.lastBriefingAt;
    } catch {
      return false;
    }
  }

  /** Whether a coordinator's thread still exists and is not archived. Read errors other than not-found count as live. */
  async function coordinatorPresence(threadId: string): Promise<"live" | "archived" | "missing"> {
    try {
      const thread: unknown = await bb.sdk.threads.get({ threadId });
      if (!isRecord(thread)) return "missing";
      return typeof thread.archivedAt === "number" ? "archived" : "live";
    } catch (error) {
      return /not[ _-]?found|\b404\b/iu.test(errorMessage(error)) ? "missing" : "live";
    }
  }

  /** When each item's PR was last read only to spot a merge outside the rules. */
  const mergeWatchReads = new Map<string, number>();

  /**
   * One background pass: retire deleted coordinators, reconcile decision cards, scheduled briefings,
   * then PR evidence where it matters.
   */
  async function tick(): Promise<void> {
    for (const coordinator of store.coordinators.list()) {
      const presence = await coordinatorPresence(coordinator.threadId);
      if (presence === "missing") {
        bb.log.info(`Coordinator Mode: ${coordinator.threadId} no longer exists, so its coordinator was removed.`);
        rpc.turnOff({ threadId: coordinator.threadId });
        continue;
      }
      if (presence === "archived") continue;
      if (!coordinator.paused) await reconcileApprovals(coordinator.threadId);
      // Raises cards that are missing (Action Cards was down, or this is the first pass after a restart).
      await syncCards(coordinator.threadId);
      if (coordinator.paused) continue;
      const at = now();
      if (cronDue(coordinator, at)) {
        store.coordinators.update(coordinator.threadId, { lastBriefingAt: at });
        // A scheduled brief with nothing in it is noise: skip both the Briefs delivery and the nudge.
        if (hasNews(coordinator) && !(await publishScheduledBrief(coordinator.threadId))) await sendNote(coordinator.threadId, BRIEFING_NUDGE);
      }
      // Items still in the first stage (migrated proposals, for one) move on without waiting for an event.
      for (const item of store.items.list(coordinator.threadId)) {
        if (item.stageIndex === 0 && item.status === "active" && coordinator.template.stages[0]?.check === "none") await evaluateItem(item.id);
      }
      const firstPrStage = coordinator.template.stages.findIndex((stage) => PR_CHECKS.has(stage.check));
      if (firstPrStage < 0) continue;
      for (const item of store.items.list(coordinator.threadId)) {
        if (!item.primaryThreadId || (item.status !== "active" && item.status !== "blocked")) continue;
        const check = coordinator.template.stages[item.stageIndex]?.check;
        if (check && PR_CHECKS.has(check)) {
          await evaluateItem(item.id);
          continue;
        }
        // Past the first PR stage, read the PR now and then so a merge that skipped the rules gets flagged.
        if (item.stageIndex < firstPrStage) continue;
        const lastRead = mergeWatchReads.get(item.id);
        if (lastRead !== undefined && at - lastRead < MERGE_WATCH_INTERVAL_MS) continue;
        mergeWatchReads.set(item.id, at);
        await readPullRequest(coordinator, item);
      }
    }
  }

  /** Whether a command request is still waiting in its sub-thread. Throws when the list can't be read. */
  async function isInteractionPending(threadId: string, interactionId: string): Promise<boolean> {
    const pending: unknown = await bb.sdk.threads.interactions.list({ threadId });
    return Array.isArray(pending) && pending.some((entry) =>
      isRecord(entry) && entry.id === interactionId && (entry.status === "pending" || entry.status === "resolving"));
  }

  /** Clears "ask" approvals whose command request was already answered in the sub-thread. */
  async function reconcileApprovals(coordinatorThreadId: string): Promise<void> {
    let changed = false;
    for (const approval of store.approvals.pending(coordinatorThreadId)) {
      const args = parseActionArgs(approval.args);
      if (args?.kind !== "interaction") continue;
      try {
        if (await isInteractionPending(args.threadId, args.interactionId)) continue;
      } catch (error) {
        bb.log.warn(`Coordinator Mode could not check request ${args.interactionId}: ${errorMessage(error)}`);
        continue;
      }
      if (!store.approvals.resolve(approval.id, "answered_elsewhere", now())) continue;
      log(coordinatorThreadId, approval.itemId, "answered_elsewhere", `You answered \`${clip(args.command, 120)}\` in the sub-thread.`, approval.action);
      changed = true;
    }
    if (changed) publish(coordinatorThreadId);
  }

  // -------------------------------------------------------------------------
  // Thread events and permission requests

  async function onThreadEvent(kind: "active" | "idle" | "failed" | "archived", thread: Thread): Promise<void> {
    const member = membership.get(thread.id);
    if (!member || member.role === "coordinator" || !member.itemId) return;
    if (kind === "active") store.activity.markActive(thread.id, now());
    if (kind === "idle") store.activity.markIdle(thread.id, now());
    if (kind !== "active") await evaluateItem(member.itemId);
  }

  async function onInteractionPending(thread: Thread, interaction: Interaction): Promise<void> {
    const member = membership.get(thread.id);
    if (!member) return;
    const coordinator = store.coordinators.get(member.coordinatorThreadId);
    if (!coordinator || coordinator.paused) return;
    const request = readApprovalRequest(interaction);
    if (!request) return;
    const item = member.itemId ? store.items.get(member.itemId) ?? undefined : undefined;
    const where = thread.title ? `"${clip(thread.title, 60)}"` : thread.id;
    // Adopted sub-threads existed before the coordinator tracked them, so nothing is approved on their behalf.
    // Never and ask rules still apply to them.
    const autoApprove = coordinator.autoApprove && member.role !== "adopted";
    const resolve = async (decision: "allow_once" | "deny"): Promise<boolean> => {
      try {
        await bb.sdk.threads.interactions.resolve({
          threadId: thread.id,
          interactionId: interaction.id,
          resolution: decision === "deny" ? { decision: "deny" } : { decision: "allow_once", grantedPermissions: null },
        });
        return true;
      } catch (error) {
        // The user may have answered first; their answer stands.
        log(coordinator.threadId, item?.id ?? null, decision === "deny" ? "command_denied" : "command_approved",
          `You answered a request in ${where} before Coordinator Mode did (${errorMessage(error)}).`);
        publish(coordinator.threadId);
        return false;
      }
    };

    if (request.kind === "file_change") {
      if (autoApprove && await resolve("allow_once")) {
        log(coordinator.threadId, item?.id ?? null, "command_approved", `Approved a file change in ${where}.`);
      }
      return;
    }

    const command = clip(request.command, 160);
    const actions = matchGatedCommands(request.command);
    if (actions.length === 0) {
      const risk = classifyUnmatchedCommand(request.command);
      if (risk === "self_rpc") {
        // Agents must not drive Coordinator Mode's own controls (approve, link, turn off).
        if (await resolve("deny")) {
          log(coordinator.threadId, item?.id ?? null, "command_denied",
            `Denied \`${command}\` in ${where}: only you can use Coordinator Mode's controls.`);
        }
        publish(coordinator.threadId);
        return;
      }
      if (risk === "risky") {
        // Can't tell which gated action this is, so leave it for you to answer.
        log(coordinator.threadId, item?.id ?? null, "action_asked",
          `Left \`${command}\` in ${where} for you to answer: it may be a gated action.`);
        publish(coordinator.threadId);
        return;
      }
      if (autoApprove && await resolve("allow_once")) {
        log(coordinator.threadId, item?.id ?? null, "command_approved", `Approved \`${command}\` in ${where}.`);
      }
      return;
    }

    // A chained command gets the strictest decision of every gated action in it.
    const decided = actions.map((candidate) => ({
      action: candidate,
      // An archive command's target is unknown, so assume the stricter primary-thread rules.
      decision: decide(coordinator, candidate, item, candidate === "archive_sub_thread" ? true : isPrimaryRole(member.role)),
    }));
    const strictest = decided.reduce((worst, next) =>
      STRICTNESS.indexOf(next.decision.column) < STRICTNESS.indexOf(worst.decision.column) ? next : worst);
    const { action } = strictest;
    let { decision } = strictest;
    const actionsLabel = actions.map((candidate) => ACTION_LABELS[candidate]).join(", ");
    // Without an item the rules cannot be checked against a stage, so never run it unasked.
    if (!item && decision.column === "alone") {
      decision = { column: "ask", reason: `Coordinator Mode can't tell which item \`${command}\` is for, so it asks you first.` };
    }
    if (decision.column === "never") {
      if (await resolve("deny")) {
        log(coordinator.threadId, item?.id ?? null, "command_denied", `Denied \`${command}\` in ${where}. ${decision.reason}`, action);
      }
      if (item) block(item, `Denied \`${command}\`: ${decision.reason}`);
      publish(coordinator.threadId);
      return;
    }
    if (decision.column === "ask") {
      store.approvals.create({
        id: randomUUID(),
        coordinatorThreadId: coordinator.threadId,
        itemId: item?.id ?? null,
        action,
        summary: `Run \`${command}\` in ${where} (${actionsLabel})`,
        args: { kind: "interaction", threadId: thread.id, interactionId: interaction.id, command: request.command, itemId: item?.id ?? null },
        reason: decision.reason,
        createdAt: now(),
      });
      log(coordinator.threadId, item?.id ?? null, "action_asked", `Asked you to approve \`${command}\` in ${where}.`, action);
      publish(coordinator.threadId);
      return;
    }
    if (autoApprove && await resolve("allow_once")) {
      log(coordinator.threadId, item?.id ?? null, "action_run", `Allowed \`${command}\` in ${where}.`, action);
      publish(coordinator.threadId);
    }
  }

  // -------------------------------------------------------------------------
  // Briefings

  function composeFor(coordinator: CoordinatorRecord) {
    const items = store.items.list(coordinator.threadId);
    const entries = store.log.list(coordinator.threadId, coordinator.lastOpenedAt).filter((entry) => !QUIET_KINDS.has(entry.kind));
    // Rule-broken and merged-outside flags lead the briefing.
    const flagged = entries.filter((entry) => entry.kind === "rule_broken" || entry.kind === "merged_outside");
    const rest = entries.filter((entry) => entry.kind !== "rule_broken" && entry.kind !== "merged_outside");
    const live = liveCards(coordinator);
    const briefing = composeBriefing({
      changes: rest,
      items: items.map(publicItem),
      approvals: store.approvals.pending(coordinator.threadId),
      template: coordinator.template,
      cards: new Map([...live].map(([ref, card]) => [ref, card.directive])),
    });
    return { items, flagged, briefing, live };
  }

  function flaggedLines(flagged: LogEntry[]): string[] {
    return flagged.length > 0 ? ["**Flagged**", ...flagged.map((entry) => `- ${entry.text}`), ""] : [];
  }

  function briefingMarkdown(coordinator: CoordinatorRecord): string {
    const { items, flagged, briefing } = composeFor(coordinator);
    const lines: string[] = [...flaggedLines(flagged), renderBriefingMarkdown(briefing, coordinator.template)];
    const open = items.filter((item) => item.status !== "cut" && item.status !== "done");
    if (open.length > 0) {
      lines.push("", "Item IDs (for Coordinator Mode tools):");
      for (const item of open) {
        const stage = coordinator.template.stages[item.stageIndex]?.name ?? "";
        const waiting = item.waitingOn ? `, waiting on ${item.waitingOn}` : "";
        lines.push(`- ${item.title}: ${item.id} (${stage}, ${item.status}${waiting}${item.primaryThreadId ? `, thread ${item.primaryThreadId}` : ""})`);
      }
    }
    return lines.join("\n");
  }

  async function threadTitle(threadId: string, fallback: string): Promise<string> {
    try {
      const thread = await bb.sdk.threads.get({ threadId });
      return thread.title ?? thread.titleFallback ?? fallback;
    } catch {
      return fallback;
    }
  }

  function hasNews(coordinator: CoordinatorRecord): boolean {
    const { flagged, briefing } = composeFor(coordinator);
    return flagged.length > 0 || briefing.changes.length > 0 || briefing.needsYou.length > 0;
  }

  let briefsRetryAt = 0;
  let briefsWarned = false;

  /**
   * Delivers a scheduled briefing to the Briefs inbox, with the decisions' live cards attached.
   * Returns false when Briefs isn't installed or the call fails, so the caller nudges the coordinator instead.
   */
  async function publishScheduledBrief(coordinatorThreadId: string): Promise<boolean> {
    const coordinator = store.coordinators.get(coordinatorThreadId);
    if (!coordinator || now() < briefsRetryAt) return false;
    const { flagged, briefing, live } = composeFor(coordinator);
    const title = await threadTitle(coordinator.threadId, coordinator.template.name);
    const details = [...flaggedLines(flagged), renderBriefingMarkdown(briefing, coordinator.template, { cards: "omit" })].join("\n");
    try {
      await bb.sdk.plugins.callRpc({
        pluginId: BRIEFS_PLUGIN,
        method: "publishFromPlugin",
        input: toJson({
          source: { pluginId: bb.pluginId, key: coordinator.threadId, name: /\bcoordinator\b/iu.test(title) ? title : `${title} coordinator` },
          headline: briefingHeadline(briefing, flagged.length),
          lede: briefingLede(briefing),
          details,
          cards: [...live.values()].map((card) => ({ threadId: coordinator.threadId, id: card.cardId })),
        }),
        outputSchema: publishedBriefSchema,
      });
    } catch (error) {
      briefsRetryAt = now() + PLUGIN_RETRY_MS;
      if (!briefsWarned) {
        briefsWarned = true;
        bb.log.info(`Coordinator Mode could not publish to Briefs, so it asks the coordinator to brief in its thread: ${errorMessage(error)}`);
      }
      return false;
    }
    briefsWarned = false;
    const at = now();
    store.coordinators.update(coordinator.threadId, { lastOpenedAt: at, lastBriefedAt: at });
    notifyPanel(coordinator.threadId);
    return true;
  }

  // -------------------------------------------------------------------------
  // Decision cards: Action Cards owned cards, kept in step with items and approvals.

  let cardsRetryAt = 0;
  let cardsWarned = false;
  const cardSyncs = new Map<string, Promise<void>>();

  function cardsFailed(what: string, error: unknown): void {
    cardsRetryAt = now() + PLUGIN_RETRY_MS;
    if (cardsWarned || disposed) return;
    cardsWarned = true;
    bb.log.warn(`Coordinator Mode could not ${what} in Action Cards, so decisions fall back to the Coordinator panel: ${errorMessage(error)}`);
  }

  /** Decisions waiting on the user right now, each of which should have a live card. */
  function wantedCards(coordinator: CoordinatorRecord): WantedCard[] {
    const wanted: WantedCard[] = [];
    for (const item of store.items.list(coordinator.threadId)) {
      if (item.status !== "active" && item.status !== "blocked") continue;
      if (coordinator.template.stages[item.stageIndex]?.check !== "you_approve") continue;
      // Decided but not applied yet (Coordinator Mode is paused): no longer waiting on the user.
      if (item.approved || item.rejectedReason !== null) continue;
      wanted.push({ ref: qaCardRef(item.id, item.stageIndex), content: qaCardContent(publicItem(item), coordinator.template) });
    }
    for (const approval of store.approvals.pending(coordinator.threadId)) {
      wanted.push({ ref: approvalCardRef(approval.id), content: approvalCardContent(approval) });
    }
    return wanted;
  }

  /** Open cards for decisions still waiting, by ref, in decision order. */
  function liveCards(coordinator: CoordinatorRecord): Map<string, CardRecord> {
    const open = new Map(store.cards.open(coordinator.threadId).map((card) => [card.ref, card]));
    const live = new Map<string, CardRecord>();
    for (const wanted of wantedCards(coordinator)) {
      const card = open.get(wanted.ref);
      if (card) live.set(wanted.ref, card);
    }
    return live;
  }

  /** How a card that is no longer wanted was resolved, read from the state that resolved it. */
  function closingFor(ref: string): { outcome: CardOutcome; message: string } {
    const parsed = parseCardRef(ref);
    if (!parsed) return { outcome: "closed", message: "No longer needed." };
    if (parsed.kind === "approval") {
      switch (store.approvals.get(parsed.approvalId)?.outcome) {
        case "approved":
          return { outcome: "approved", message: "Approved." };
        case "declined":
          return { outcome: "declined", message: "Declined." };
        case "answered_elsewhere":
          return { outcome: "closed", message: "Answered in the sub-thread." };
        default:
          return { outcome: "closed", message: "No longer needed." };
      }
    }
    const item = store.items.get(parsed.itemId);
    const template = item ? store.coordinators.get(item.coordinatorThreadId)?.template : undefined;
    if (!item || !template) return { outcome: "closed", message: "No longer tracked." };
    const title = `“${clip(item.title, 120)}”`;
    if (item.status === "cut") return { outcome: "closed", message: `Stopped tracking ${title}.` };
    if (item.status === "done") return { outcome: "approved", message: `Approved. ${title} is done.` };
    if (item.stageIndex > parsed.stageIndex) {
      return { outcome: "approved", message: `Approved. ${title} moved to ${stageName(template, item.stageIndex)}.` };
    }
    if (item.stageIndex < parsed.stageIndex) {
      return { outcome: "declined", message: item.reason ? `Rejected: ${clip(item.reason, 240)}` : "Rejected." };
    }
    if (item.approved) return { outcome: "approved", message: `Approved. ${title} moves on when Coordinator Mode resumes.` };
    if (item.rejectedReason !== null) return { outcome: "declined", message: `Rejected: ${clip(item.rejectedReason, 240)}` };
    return { outcome: "closed", message: "No longer waiting on you." };
  }

  async function createCard(coordinatorThreadId: string, wanted: WantedCard): Promise<boolean> {
    const id = cardIdFor(wanted.ref);
    try {
      const created = await bb.sdk.plugins.callRpc({
        pluginId: ACTION_CARDS_PLUGIN,
        method: "createOwned",
        // reopen: a ref can come back (an item rejected at QA returns to it), and its old card is resolved.
        input: toJson({ threadId: coordinatorThreadId, id, owner: { pluginId: bb.pluginId, ref: wanted.ref }, content: wanted.content, reopen: true }),
        outputSchema: createdCardSchema,
      });
      cardsWarned = false;
      store.cards.upsert({ ref: wanted.ref, coordinatorThreadId, cardId: id, directive: created.directive, createdAt: now() });
      return true;
    } catch (error) {
      cardsFailed("raise a decision card", error);
      return false;
    }
  }

  async function resolveCard(ref: string, outcome: CardOutcome, message: string): Promise<boolean> {
    try {
      await bb.sdk.plugins.callRpc({
        pluginId: ACTION_CARDS_PLUGIN,
        method: "resolveOwned",
        input: toJson({ pluginId: bb.pluginId, ref, outcome, message: clip(message, 300) }),
        outputSchema: z.unknown(),
      });
      cardsWarned = false;
      return true;
    } catch (error) {
      cardsFailed("close a decision card", error);
      return false;
    }
  }

  async function syncCardsNow(coordinatorThreadId: string): Promise<void> {
    if (disposed || now() < cardsRetryAt) return;
    const coordinator = store.coordinators.get(coordinatorThreadId);
    if (!coordinator) return;
    const wanted = new Set(wantedCards(coordinator).map((card) => card.ref));
    for (const card of store.cards.open(coordinatorThreadId)) {
      if (wanted.has(card.ref)) continue;
      const { outcome, message } = closingFor(card.ref);
      // A failed close keeps the row open, so the next sync tries again.
      if (!(await resolveCard(card.ref, outcome, message))) return;
      store.cards.resolve(card.ref, now());
    }
    let created = false;
    for (const card of wantedCards(coordinator)) {
      // Re-read each time: a decision made while an earlier card was being raised must not get a fresh card.
      const current = store.coordinators.get(coordinatorThreadId);
      if (disposed || !current || store.cards.get(card.ref)?.resolvedAt === null) continue;
      if (!wantedCards(current).some((candidate) => candidate.ref === card.ref)) continue;
      if (!(await createCard(coordinatorThreadId, card))) break;
      created = true;
    }
    if (created && !disposed) notifyPanel(coordinatorThreadId);
  }

  /** Brings a coordinator's cards in line with its decisions. Serialized per coordinator. */
  function syncCards(coordinatorThreadId: string): Promise<void> {
    const previous = cardSyncs.get(coordinatorThreadId) ?? Promise.resolve();
    const next = previous.then(() => syncCardsNow(coordinatorThreadId)).catch((error: unknown) => {
      // After dispose the database and logger are gone; there is nothing left to sync.
      if (!disposed) bb.log.warn(`Coordinator Mode could not sync decision cards: ${errorMessage(error)}`);
    });
    cardSyncs.set(coordinatorThreadId, next);
    void next.finally(() => {
      if (cardSyncs.get(coordinatorThreadId) === next) cardSyncs.delete(coordinatorThreadId);
    });
    return next;
  }

  async function closeCards(refs: string[], outcome: CardOutcome, message: string): Promise<void> {
    for (const ref of refs) {
      if (disposed || !(await resolveCard(ref, outcome, message))) return;
    }
  }

  /**
   * Runs a decision made on its card. The local card row is resolved first: Action Cards records
   * this click's outcome itself, so the sync must not close the same card underneath it.
   */
  async function onCard<T>(ref: string, work: () => Promise<T>): Promise<T> {
    const held = store.cards.resolve(ref, now());
    try {
      return await work();
    } catch (error) {
      if (held) store.cards.reopen(ref);
      throw error;
    }
  }

  async function decideCard(input: { ref: string; action: "yes" | "no" | "choose"; note?: string }): Promise<{ message: string }> {
    const parsed = parseCardRef(input.ref);
    if (!parsed) throw new Error("Coordinator Mode doesn't know this decision.");
    if (input.action === "choose") throw new Error("This decision takes Approve or Reject, not a choice.");
    const note = input.note?.trim() ?? "";
    if (parsed.kind === "approval") {
      const approval = store.approvals.get(parsed.approvalId);
      if (!approval || approval.resolvedAt !== null) throw new Error("This request was already answered.");
      return onCard(input.ref, async () => ({ message: await answerApproval(approval.id, input.action === "yes", note || undefined) }));
    }
    const item = store.items.get(parsed.itemId);
    const coordinator = item ? store.coordinators.get(item.coordinatorThreadId) : null;
    if (!item || !coordinator || (item.status !== "active" && item.status !== "blocked")) throw new Error("This item is no longer waiting on you.");
    if (item.stageIndex !== parsed.stageIndex || coordinator.template.stages[item.stageIndex]?.check !== "you_approve"
      || item.approved || item.rejectedReason !== null) {
      throw new Error(`“${clip(item.title, 120)}” is no longer waiting for this approval.`);
    }
    const { id: itemId } = item;
    const { stageIndex } = parsed;
    const { template } = coordinator;
    const title = `“${clip(item.title, 120)}”`;
    return onCard(input.ref, async () => {
      if (input.action === "yes") {
        await rpc.approveItem({ itemId });
        const after = store.items.get(itemId);
        if (after?.status === "done") return { message: `Approved. ${title} is done.` };
        if (after && after.stageIndex > stageIndex) return { message: `Approved. ${title} moves to ${stageName(template, after.stageIndex)}.` };
        return { message: `Approved. ${title} moves on when Coordinator Mode resumes.` };
      }
      await rpc.rejectItem({ itemId, reason: note || "Rejected from the card." });
      const after = store.items.get(itemId);
      if (after && after.stageIndex < stageIndex) return { message: `Rejected. ${title} goes back to ${stageName(template, after.stageIndex)}.` };
      return { message: `Rejected. ${title} goes back when Coordinator Mode resumes.` };
    });
  }

  // -------------------------------------------------------------------------
  // Items

  /** Text the coordinator writes for an item: one line, empty clears it, undefined leaves it. */
  function contextText(value: string | undefined): string | null | undefined {
    if (value === undefined) return undefined;
    const text = clip(value, 160);
    return text.length > 0 ? text : null;
  }

  function createItem(
    coordinator: CoordinatorRecord,
    input: { title: string; summary?: string; primaryThreadId?: string | null; adopted?: boolean },
  ): ItemRecord {
    const at = now();
    const item = store.items.create({
      id: randomUUID(),
      coordinatorThreadId: coordinator.threadId,
      title: clip(input.title, 200),
      stageIndex: 0,
      status: "active",
      reason: null,
      link: null,
      primaryThreadId: input.primaryThreadId ?? null,
      helperThreadIds: [],
      proposed: false,
      summary: contextText(input.summary) ?? null,
      waitingOn: null,
      pr: null,
      approved: false,
      rejectedReason: null,
      review: null,
      failedAt: null,
      createdAt: at,
      updatedAt: at,
    }, input.adopted ? "adopted" : "primary");
    log(coordinator.threadId, item.id, "item_created", input.adopted ? `Tracking "${item.title}", an existing sub-thread.` : `Added "${item.title}".`);
    return item;
  }

  // -------------------------------------------------------------------------
  // Agent tools

  const toolCoordinator = (threadId: string): CoordinatorRecord => {
    const member = membership.get(threadId);
    if (member?.role !== "coordinator") throw new Error("Only a thread in Coordinator Mode can use this tool.");
    return requireCoordinator(threadId);
  };

  const tools = {
    async addItem(threadId: string, input: { title: string; summary?: string; startSubThread?: boolean; prompt?: string }): Promise<string> {
      const coordinator = toolCoordinator(threadId);
      const start = input.startSubThread === true;
      const item = createItem(coordinator, { title: input.title, summary: input.summary });
      publish(coordinator.threadId);
      await evaluateItem(item.id);
      if (!start) return `Tracking item ${item.id} "${item.title}". Start its sub-thread with coordinator_start_sub_thread when work should begin.`;
      const started = await runGated(coordinator, "start_sub_thread",
        { kind: "start", itemId: item.id, prompt: input.prompt ?? input.title, title: null, role: "primary" },
        { item: store.items.get(item.id) ?? item, isPrimaryThread: true, summary: `start a sub-thread for "${item.title}"` });
      return `Added item ${item.id} "${item.title}". ${started}`;
    },
    updateItem(threadId: string, input: { itemId: string; summary?: string; waitingOn?: string }): string {
      const coordinator = toolCoordinator(threadId);
      const item = requireOwnItem(coordinator, input.itemId);
      if (input.summary === undefined && input.waitingOn === undefined) return "Nothing to update: pass summary, waitingOn, or both.";
      store.items.setContext(item.id, { summary: contextText(input.summary), waitingOn: contextText(input.waitingOn) }, now());
      publish(coordinator.threadId);
      return `Updated "${item.title}".`;
    },
    async startSubThread(threadId: string, input: { itemId: string; prompt: string; title?: string; role?: ThreadRole }): Promise<string> {
      const coordinator = toolCoordinator(threadId);
      const item = requireOwnItem(coordinator, input.itemId);
      if (item.status === "cut") return `"${item.title}" is no longer tracked; start nothing for it.`;
      if (item.status === "done") return `"${item.title}" is done; start nothing for it.`;
      const role: ThreadRole = input.role ?? (item.primaryThreadId ? "helper" : "primary");
      if (role === "primary" && item.primaryThreadId) return `"${item.title}" already has a primary sub-thread (${item.primaryThreadId}). Use role "helper" or "reviewer".`;
      return runGated(coordinator, "start_sub_thread",
        { kind: "start", itemId: item.id, prompt: input.prompt, title: input.title ?? null, role },
        { item, isPrimaryThread: role === "primary", summary: `start a ${role} sub-thread for "${item.title}"` });
    },
    async archiveSubThread(threadId: string, input: { threadId: string }): Promise<string> {
      const coordinator = toolCoordinator(threadId);
      const member = membership.get(input.threadId);
      if (!member || member.coordinatorThreadId !== coordinator.threadId || member.role === "coordinator") {
        return `${input.threadId} is not one of this coordinator's sub-threads.`;
      }
      const item = member.itemId ? store.items.get(member.itemId) ?? undefined : undefined;
      return runGated(coordinator, "archive_sub_thread",
        { kind: "archive", threadId: input.threadId, itemId: null },
        { item, isPrimaryThread: isPrimaryRole(member.role), summary: `archive ${member.role} sub-thread ${input.threadId}${item ? ` of "${item.title}"` : ""}` });
    },
    async mergePr(threadId: string, input: { itemId: string }): Promise<string> {
      const coordinator = toolCoordinator(threadId);
      const item = requireOwnItem(coordinator, input.itemId);
      return runGated(coordinator, "merge_pr", { kind: "merge", itemId: item.id },
        { item, isPrimaryThread: true, summary: `merge the PR for "${item.title}"` });
    },
    async setLink(threadId: string, input: { itemId: string; link: string }): Promise<string> {
      const coordinator = toolCoordinator(threadId);
      requireOwnItem(coordinator, input.itemId);
      await rpc.setLink(input);
      return `Saved the link for item ${input.itemId}.`;
    },
    briefing(threadId: string): string {
      const coordinator = toolCoordinator(threadId);
      const markdown = briefingMarkdown(coordinator);
      const at = now();
      store.coordinators.update(coordinator.threadId, { lastOpenedAt: at, lastBriefedAt: at });
      publish(coordinator.threadId);
      return markdown;
    },
    cutItem(threadId: string, input: { itemId: string }): Promise<string> {
      const coordinator = toolCoordinator(threadId);
      requireOwnItem(coordinator, input.itemId);
      return rpc.cutItem(input).then(() => `Stopped tracking item ${input.itemId}.`);
    },
    async reviewVerdict(threadId: string, input: { pass: boolean; findings?: string }): Promise<string> {
      const member = membership.get(threadId);
      if (!member || member.role !== "reviewer" || !member.itemId) {
        throw new Error("Only a review sub-thread started by a coordinator can record a verdict.");
      }
      const item = requireItem(member.itemId);
      const findings = input.findings?.trim();
      store.items.save({ ...item, review: findings ? { pass: input.pass, findings } : { pass: input.pass }, updatedAt: now() });
      publish(item.coordinatorThreadId);
      await evaluateItem(item.id);
      return `Recorded ${input.pass ? "pass" : "fail"} for "${item.title}".`;
    },
  };

  // -------------------------------------------------------------------------
  // RPC

  async function insertCoordinator(threadId: string, template: CoordinatorTemplate, projectId: string | null): Promise<CoordinatorRecord> {
    const at = now();
    const existing = store.coordinators.get(threadId);
    const coordinator = existing
      ? store.coordinators.update(threadId, {
        template, projectId: projectId ?? existing.projectId, rulesVersion: existing.rulesVersion + 1, appliedRulesVersion: existing.rulesVersion + 1,
      })
      : store.coordinators.insert({
        threadId, projectId, template, paused: false, autoApprove: true, rulesVersion: 1, appliedRulesVersion: 1,
        lastOpenedAt: at, lastBriefingAt: at, lastBriefedAt: null, createdAt: at,
      });
    refreshMembership();
    return coordinator;
  }

  /** Applies the user's answer to an "asks you first" approval and says what happened, in plain words. */
  async function answerApproval(approvalId: string, approve: boolean, reason: string | undefined): Promise<string> {
    const approval = store.approvals.get(approvalId);
    if (!approval) throw new Error("This approval no longer exists.");
    if (approval.resolvedAt !== null) return "This request was already answered.";
    const coordinator = requireCoordinator(approval.coordinatorThreadId);
    const args = parseActionArgs(approval.args);
    if (approve && !args) throw new Error("This approval can't be replayed.");
    if (!store.approvals.resolve(approvalId, approve ? "approved" : "declined", now())) return "This request was already answered.";
    const label = ACTION_LABELS[approval.action];
    if (!approve || !args) {
      const why = reason?.trim() || "No reason given.";
      log(coordinator.threadId, approval.itemId, "action_declined", `You declined: ${approval.summary}. ${why}`, approval.action);
      if (args?.kind === "interaction") {
        try {
          await bb.sdk.threads.interactions.resolve({ threadId: args.threadId, interactionId: args.interactionId, resolution: { decision: "deny" } });
        } catch (error) {
          bb.log.info(`Coordinator Mode: request already answered (${errorMessage(error)}).`);
        }
      } else {
        await sendNote(coordinator.threadId, `Coordinator Mode: the user declined to ${label} (${approval.summary}). Reason: ${why}`);
      }
      publish(coordinator.threadId);
      return reason?.trim() ? `Declined: ${clip(reason, 240)}` : "Declined.";
    }
    let message: string;
    try {
      const text = await execute(coordinator, args);
      log(coordinator.threadId, approval.itemId, "action_run", `Approved: ${text}`, approval.action);
      if (args.kind !== "interaction") await sendNote(coordinator.threadId, `Coordinator Mode: the user approved. ${text}`);
      message = `Approved. ${text}`;
    } catch (error) {
      const failure = errorMessage(error);
      log(coordinator.threadId, approval.itemId, "action_declined", `Approved, but it failed: ${approval.summary}. ${failure}`, approval.action);
      if (args.kind !== "interaction") await sendNote(coordinator.threadId, `Coordinator Mode: the user approved, but it failed to ${label}: ${failure}`);
      message = `Approved, but it failed to ${label}: ${failure}`;
    }
    publish(coordinator.threadId);
    return clip(message, 300);
  }

  const rpc = {
    async status({ threadId }) {
      if (store.coordinators.get(threadId)) {
        try {
          await reconcileApprovals(threadId);
        } catch (error) {
          bb.log.warn(`Coordinator Mode could not reconcile approvals: ${errorMessage(error)}`);
        }
      }
      const coordinator = store.coordinators.get(threadId);
      if (!coordinator) return { state: null, items: [], approvals: [], staleRules: false };
      return {
        state: publicState(coordinator),
        items: store.items.list(threadId).map(publicItem),
        approvals: store.approvals.pending(threadId),
        staleRules: coordinator.appliedRulesVersion < coordinator.rulesVersion,
      };
    },
    templates() {
      return { templates: BUILT_IN_TEMPLATES };
    },
    async turnOn({ threadId, template }) {
      const parsed = parseTemplate(template);
      const thread = await bb.sdk.threads.get({ threadId });
      const coordinator = await insertCoordinator(threadId, parsed, thread.projectId);
      // Live sub-threads are tracked at once as adopted: the rules apply to them, but nothing is auto-approved for them.
      const children = await bb.sdk.threads.list({ parentThreadId: threadId });
      const adopted: ItemRecord[] = [];
      for (const child of children) {
        if (child.archivedAt !== null || membership.has(child.id) || store.threads.has(child.id)) continue;
        adopted.push(createItem(coordinator, { title: child.title ?? child.titleFallback ?? "Untitled sub-thread", primaryThreadId: child.id, adopted: true }));
      }
      refreshMembership();
      for (const item of adopted) await evaluateItem(item.id);
      publish(threadId);
      await restartSession(threadId, TURN_ON_KICKOFF);
      return { ok: true };
    },
    async createNew({ projectId, template }) {
      const parsed = parseTemplate(template);
      // The first turn may start before the coordinator row exists, so restart once it does.
      const thread = await bb.sdk.threads.spawn({
        projectId,
        environment: { type: "project-default" },
        prompt: "Coordinator Mode is starting.",
        title: `${parsed.name} coordinator`,
      });
      await insertCoordinator(thread.id, parsed, projectId);
      publish(thread.id);
      await restartSession(thread.id, NEW_COORDINATOR_KICKOFF);
      return { threadId: thread.id };
    },
    turnOff({ threadId }) {
      const open = store.cards.open(threadId).map((card) => card.ref);
      store.coordinators.delete(threadId);
      const timer = nudges.get(threadId);
      if (timer) clearTimeout(timer);
      nudges.delete(threadId);
      refreshMembership();
      publish(threadId);
      if (open.length > 0) void closeCards(open, "closed", "Coordinator Mode was turned off.").catch(() => undefined);
      return { ok: true };
    },
    async setPaused({ threadId, paused }) {
      requireCoordinator(threadId);
      store.coordinators.update(threadId, { paused });
      publish(threadId);
      if (!paused) for (const item of store.items.list(threadId)) await evaluateItem(item.id);
      return { ok: true };
    },
    setAutoApprove({ threadId, autoApprove }) {
      requireCoordinator(threadId);
      store.coordinators.update(threadId, { autoApprove });
      publish(threadId);
      return { ok: true };
    },
    updateTemplate({ threadId, template }) {
      const coordinator = requireCoordinator(threadId);
      store.coordinators.update(threadId, { template: parseTemplate(template), rulesVersion: coordinator.rulesVersion + 1 });
      publish(threadId);
      return { ok: true };
    },
    async restartCoordinator({ threadId }) {
      const coordinator = requireCoordinator(threadId);
      await restartSession(threadId, RULES_UPDATED);
      store.coordinators.update(threadId, { appliedRulesVersion: coordinator.rulesVersion });
      publish(threadId);
      return { ok: true };
    },
    async approveItem({ itemId }) {
      const item = requireItem(itemId);
      const coordinator = requireCoordinator(item.coordinatorThreadId);
      if (coordinator.template.stages[item.stageIndex]?.check !== "you_approve") throw new Error(`"${item.title}" is not waiting for your approval.`);
      store.items.save({ ...item, approved: true, rejectedReason: null, updatedAt: now() });
      await evaluateItem(itemId);
      publish(item.coordinatorThreadId);
      return { ok: true };
    },
    async rejectItem({ itemId, reason }) {
      const item = requireItem(itemId);
      const coordinator = requireCoordinator(item.coordinatorThreadId);
      if (coordinator.template.stages[item.stageIndex]?.check !== "you_approve") throw new Error(`"${item.title}" is not waiting for your approval.`);
      const why = reason.trim() || "Rejected without a reason.";
      store.items.save({ ...item, approved: false, rejectedReason: why, updatedAt: now() });
      await evaluateItem(itemId);
      publish(item.coordinatorThreadId);
      if (item.primaryThreadId) {
        await sendNote(item.primaryThreadId, `Rejected at ${coordinator.template.stages[item.stageIndex]?.name ?? "review"}: ${clip(why, 400)} Fix it, then report in 3 lines or fewer.`);
      }
      return { ok: true };
    },
    /** Items are tracked directly now; kept so older panels and scripts that still confirm don't fail. */
    confirmItem() {
      return { ok: true };
    },
    async cutItem({ itemId }) {
      const item = requireItem(itemId);
      if (item.status === "cut") return { ok: true };
      const next = store.items.save({ ...item, status: "cut", updatedAt: now() });
      refreshMembership();
      log(item.coordinatorThreadId, item.id, "item_cut", `Stopped tracking "${item.title}".`);
      const coordinator = store.coordinators.get(item.coordinatorThreadId);
      if (coordinator) await retireHelpers(coordinator, next);
      publish(item.coordinatorThreadId);
      return { ok: true };
    },
    async setLink({ itemId, link }) {
      const item = requireItem(itemId);
      const trimmed = link.trim();
      store.items.save({ ...item, link: trimmed.length > 0 ? trimmed : null, updatedAt: now() });
      await evaluateItem(itemId);
      publish(item.coordinatorThreadId);
      return { ok: true };
    },
    async resolveApproval({ approvalId, approve, reason }) {
      await answerApproval(approvalId, approve, reason);
      return { ok: true };
    },
    [ACTION_CARDS_DECIDE_METHOD]: (input) => decideCard(input),
    markOpened({ threadId }) {
      if (store.coordinators.get(threadId)) {
        store.coordinators.update(threadId, { lastOpenedAt: now() });
        publish(threadId);
      }
      return { ok: true };
    },
    async describeProcess({ description, projectId }) {
      const thread = await bb.sdk.threads.spawn({
        projectId,
        environment: { type: "project-default" },
        prompt: describePrompt(description),
        title: "Coordinator Mode template draft",
        visibility: "hidden",
        permissionMode: "accept-edits",
      });
      try {
        await bb.sdk.threads.wait({ threadId: thread.id, status: "idle", timeoutMs: DESCRIBE_TIMEOUT_MS });
        const { output } = await bb.sdk.threads.output({ threadId: thread.id });
        return { template: parseTemplateDraft(output ?? "") };
      } finally {
        try {
          await bb.sdk.threads.archive({ threadId: thread.id });
        } catch (error) {
          bb.log.warn(`Coordinator Mode could not archive its draft helper ${thread.id}: ${errorMessage(error)}`);
        }
      }
    },
  } satisfies PluginRpcHandlers<typeof rpcContract>;

  /** Synchronous agent configuration from the in-memory membership cache. */
  function agentConfiguration(threadId: string): { tools: string[]; skills: string[]; instructions?: string } {
    const member = membership.get(threadId);
    if (!member) return { tools: [], skills: [] };
    if (member.role === "coordinator") {
      const coordinator = store.coordinators.get(threadId);
      if (!coordinator) return { tools: [], skills: [] };
      return { tools: [...COORDINATOR_TOOLS], skills: [], instructions: instructionsFor(coordinator.template) };
    }
    // Every tracked sub-thread, adopted ones included, reports once and briefly.
    if (member.role === "reviewer") return { tools: [...REVIEWER_TOOLS], skills: [], instructions: `${SUB_THREAD_INSTRUCTIONS} ${REVIEW_INSTRUCTIONS}` };
    return { tools: [], skills: [], instructions: SUB_THREAD_INSTRUCTIONS };
  }

  function dispose(): void {
    disposed = true;
    for (const timer of nudges.values()) clearTimeout(timer);
    nudges.clear();
  }

  return {
    rpc,
    tools,
    tick,
    onThreadEvent,
    onInteractionPending,
    agentConfiguration,
    briefingMarkdown: (threadId: string) => briefingMarkdown(requireCoordinator(threadId)),
    dispose,
  };
}
