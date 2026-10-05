import { randomUUID } from "node:crypto";
import type { BbPluginApi, PluginRpcHandlers, PluginThreadEventPayloads } from "@get-bb/plugin-sdk";
import { CronExpressionParser } from "cron-parser";

import {
  REALTIME_CHANNEL,
  type CheckKind,
  type CoordinatorItem,
  type CoordinatorState,
  type CoordinatorTemplate,
  type GatedAction,
  type LogEntry,
  type PendingApproval,
  type RuleColumn,
} from "./contracts";
import {
  ACTION_LABELS,
  advanceItem,
  classifyUnmatchedCommand,
  composeBriefing,
  decideAction,
  evaluateCheck,
  instructionsFor,
  matchGatedCommands,
  renderBriefingMarkdown,
  type CheckEvidence,
  type Decision,
} from "./model";
import {
  createStore,
  type CoordinatorRecord,
  type ItemRecord,
  type Membership,
  type ThreadRole,
} from "./store";
import type { rpcContract } from "./server";
import { BUILT_IN_TEMPLATES, parseTemplate } from "./templates";

const BRIEFING_NUDGE = "Coordinator Mode: post your scheduled briefing. Call coordinator_briefing and share it.";
const TURN_ON_KICKOFF =
  "Coordinator Mode is on. Call coordinator_briefing and share it. Existing sub-threads already appear as proposed items for me to keep or drop; don't look up threads yourself.";
const NEW_COORDINATOR_KICKOFF =
  "Coordinator Mode is on. Call coordinator_briefing, then ask me what you should work on first.";
const RULES_UPDATED = "Coordinator Mode rules updated. Your instructions and tools now follow the new rules; carry on with them.";
const REVIEW_INSTRUCTIONS =
  "You are a review sub-thread started by a Coordinator Mode coordinator. When your review is complete, record your verdict with the coordinator_review_verdict tool: pass true if the work is ready, or pass false with concrete findings. Only your verdict moves the item; saying it in chat does not.";

const COORDINATOR_TOOLS = [
  "coordinator_add_item",
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

type Thread = PluginThreadEventPayloads["thread.idle"]["thread"];
type Interaction = PluginThreadEventPayloads["interaction.pending"]["interaction"];
type PrEvidence = NonNullable<CheckEvidence["pr"]>;

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

function clip(text: string, max: number): string {
  const single = text.replace(/\s+/gu, " ").trim();
  return single.length <= max ? single : `${single.slice(0, max - 1)}…`;
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

function mapPullRequest(response: unknown): PrEvidence | null {
  if (!isRecord(response) || response.outcome !== "available" || !isRecord(response.pullRequest)) return null;
  const pr = response.pullRequest;
  const state = pr.state === "open" || pr.state === "closed" || pr.state === "merged" || pr.state === "draft" ? pr.state : null;
  if (!state) return null;
  const checksState = isRecord(pr.checks) ? pr.checks.state : null;
  const checks = checksState === "passing" || checksState === "failing" || checksState === "pending" ? checksState : "none";
  return { state, checks };
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
    proposed: record.proposed,
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

  const publish = (coordinatorThreadId: string) => {
    try {
      bb.realtime.publish(REALTIME_CHANNEL, { threadId: coordinatorThreadId });
    } catch (error) {
      bb.log.warn(`Coordinator Mode realtime publish failed: ${errorMessage(error)}`);
    }
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

  async function sendText(threadId: string, text: string, permissionMode?: "accept-edits"): Promise<void> {
    await bb.sdk.threads.send({
      threadId,
      mode: "queue-if-active",
      input: [{ type: "text", text, mentions: [] }],
      ...(permissionMode ? { permissionMode } : {}),
    });
  }

  async function sendNote(threadId: string, text: string): Promise<void> {
    try {
      await sendText(threadId, text);
    } catch (error) {
      bb.log.warn(`Coordinator Mode could not message ${threadId}: ${errorMessage(error)}`);
    }
  }

  /** Stops the coordinator's session (if running) so its next message rebuilds tools and instructions. */
  async function restartSession(threadId: string, message: string): Promise<void> {
    try {
      const thread = await bb.sdk.threads.get({ threadId });
      if (thread.status === "active" || thread.status === "starting") await bb.sdk.threads.stop({ threadId });
    } catch (error) {
      bb.log.warn(`Coordinator Mode could not stop ${threadId}: ${errorMessage(error)}`);
    }
    await sendText(threadId, message, "accept-edits");
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
        const thread = await bb.sdk.threads.spawn({
          projectId: await projectOf(coordinator),
          parentThreadId: coordinator.threadId,
          prompt: args.prompt,
          title: args.title ?? item.title,
          environment: helperEnvironment ? { type: "reuse", environmentId: helperEnvironment } : { type: "project-default" },
          permissionMode: "accept-edits",
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
        createdAt: now(),
      };
      store.approvals.create(approval);
      log(coordinator.threadId, itemId, "action_asked", `Asked you to approve: ${context.summary}.`, action);
      publish(coordinator.threadId);
      return `Waiting for approval: ${context.summary}. The user sees an Approve / Decline card in the Coordinator panel; you will get a message when they decide. Do not retry meanwhile.`;
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
      if (item.proposed || (item.status !== "active" && item.status !== "blocked")) break;
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

  /** One background pass: retire deleted coordinators, scheduled briefings, then PR evidence where it matters. */
  async function tick(): Promise<void> {
    for (const coordinator of store.coordinators.list()) {
      const presence = await coordinatorPresence(coordinator.threadId);
      if (presence === "missing") {
        bb.log.info(`Coordinator Mode: ${coordinator.threadId} no longer exists, so its coordinator was removed.`);
        rpc.turnOff({ threadId: coordinator.threadId });
        continue;
      }
      if (presence === "archived" || coordinator.paused) continue;
      await reconcileApprovals(coordinator.threadId);
      const at = now();
      if (cronDue(coordinator, at)) {
        store.coordinators.update(coordinator.threadId, { lastBriefingAt: at });
        await sendNote(coordinator.threadId, BRIEFING_NUDGE);
      }
      const firstPrStage = coordinator.template.stages.findIndex((stage) => PR_CHECKS.has(stage.check));
      if (firstPrStage < 0) continue;
      for (const item of store.items.list(coordinator.threadId)) {
        if (item.proposed || !item.primaryThreadId || (item.status !== "active" && item.status !== "blocked")) continue;
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
      if (coordinator.autoApprove && await resolve("allow_once")) {
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
      if (coordinator.autoApprove && await resolve("allow_once")) {
        log(coordinator.threadId, item?.id ?? null, "command_approved", `Approved \`${command}\` in ${where}.`);
      }
      return;
    }

    // A chained command gets the strictest decision of every gated action in it.
    const decided = actions.map((candidate) => ({
      action: candidate,
      // An archive command's target is unknown, so assume the stricter primary-thread rules.
      decision: decide(coordinator, candidate, item, candidate === "archive_sub_thread" ? true : member.role === "primary"),
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
        createdAt: now(),
      });
      log(coordinator.threadId, item?.id ?? null, "action_asked", `Asked you to approve \`${command}\` in ${where}.`, action);
      publish(coordinator.threadId);
      return;
    }
    if (coordinator.autoApprove && await resolve("allow_once")) {
      log(coordinator.threadId, item?.id ?? null, "action_run", `Allowed \`${command}\` in ${where}.`, action);
      publish(coordinator.threadId);
    }
  }

  // -------------------------------------------------------------------------
  // Briefings

  function briefingMarkdown(coordinator: CoordinatorRecord): string {
    const items = store.items.list(coordinator.threadId);
    const entries = store.log.list(coordinator.threadId, coordinator.lastOpenedAt).filter((entry) => !QUIET_KINDS.has(entry.kind));
    // Rule-broken and merged-outside flags lead the briefing.
    const flagged = entries.filter((entry) => entry.kind === "rule_broken" || entry.kind === "merged_outside");
    const rest = entries.filter((entry) => entry.kind !== "rule_broken" && entry.kind !== "merged_outside");
    const briefing = composeBriefing({
      changes: rest,
      items,
      approvals: store.approvals.pending(coordinator.threadId),
      template: coordinator.template,
    });
    const lines: string[] = [];
    if (flagged.length > 0) lines.push("**Flagged**", ...flagged.map((entry) => `- ${entry.text}`), "");
    lines.push(renderBriefingMarkdown(briefing, coordinator.template));
    const open = items.filter((item) => item.status !== "cut" && item.status !== "done");
    if (open.length > 0) {
      lines.push("", "Item IDs (for Coordinator Mode tools):");
      for (const item of open) {
        const stage = coordinator.template.stages[item.stageIndex]?.name ?? "";
        lines.push(`- ${item.title}: ${item.id} (${item.proposed ? "proposed" : `${stage}, ${item.status}`}${item.primaryThreadId ? `, thread ${item.primaryThreadId}` : ""})`);
      }
    }
    return lines.join("\n");
  }

  // -------------------------------------------------------------------------
  // Items

  function createItem(coordinator: CoordinatorRecord, input: { title: string; proposed: boolean; primaryThreadId?: string | null }): ItemRecord {
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
      proposed: input.proposed,
      approved: false,
      rejectedReason: null,
      review: null,
      failedAt: null,
      createdAt: at,
      updatedAt: at,
    });
    log(coordinator.threadId, item.id, "item_created", input.proposed ? `Proposed "${item.title}".` : `Added "${item.title}".`);
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
    async addItem(threadId: string, input: { title: string; startSubThread?: boolean; prompt?: string }): Promise<string> {
      const coordinator = toolCoordinator(threadId);
      const start = input.startSubThread === true;
      const item = createItem(coordinator, { title: input.title, proposed: !start });
      publish(coordinator.threadId);
      if (!start) return `Proposed item ${item.id} "${item.title}". The user confirms or drops it in the Coordinator panel; start its sub-thread once confirmed.`;
      await evaluateItem(item.id);
      const started = await runGated(coordinator, "start_sub_thread",
        { kind: "start", itemId: item.id, prompt: input.prompt ?? input.title, title: null, role: "primary" },
        { item: store.items.get(item.id) ?? item, isPrimaryThread: true, summary: `start a sub-thread for "${item.title}"` });
      return `Added item ${item.id} "${item.title}". ${started}`;
    },
    async startSubThread(threadId: string, input: { itemId: string; prompt: string; title?: string; role?: ThreadRole }): Promise<string> {
      const coordinator = toolCoordinator(threadId);
      const item = requireOwnItem(coordinator, input.itemId);
      if (item.proposed) return `"${item.title}" is still proposed. Ask the user to confirm it in the Coordinator panel first.`;
      if (item.status === "cut" || item.status === "done") return `"${item.title}" is ${item.status}; start nothing for it.`;
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
        { item, isPrimaryThread: member.role === "primary", summary: `archive ${member.role} sub-thread ${input.threadId}${item ? ` of "${item.title}"` : ""}` });
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
      store.coordinators.update(coordinator.threadId, { lastOpenedAt: now() });
      publish(coordinator.threadId);
      return markdown;
    },
    cutItem(threadId: string, input: { itemId: string }): Promise<string> {
      const coordinator = toolCoordinator(threadId);
      requireOwnItem(coordinator, input.itemId);
      return rpc.cutItem(input).then(() => `Cut item ${input.itemId}.`);
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
        lastOpenedAt: at, lastBriefingAt: at, createdAt: at,
      });
    refreshMembership();
    return coordinator;
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
      // Existing sub-threads become proposed items the user keeps or drops.
      const children = await bb.sdk.threads.list({ parentThreadId: threadId });
      for (const child of children) {
        if (child.archivedAt !== null || membership.has(child.id) || store.threads.has(child.id)) continue;
        createItem(coordinator, { title: child.title ?? child.titleFallback ?? "Untitled sub-thread", proposed: true, primaryThreadId: child.id });
      }
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
        permissionMode: "accept-edits",
      });
      await insertCoordinator(thread.id, parsed, projectId);
      publish(thread.id);
      await restartSession(thread.id, NEW_COORDINATOR_KICKOFF);
      return { threadId: thread.id };
    },
    turnOff({ threadId }) {
      store.coordinators.delete(threadId);
      const timer = nudges.get(threadId);
      if (timer) clearTimeout(timer);
      nudges.delete(threadId);
      refreshMembership();
      publish(threadId);
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
        await sendNote(item.primaryThreadId, `The user rejected this work at ${coordinator.template.stages[item.stageIndex]?.name ?? "review"}: ${why}\nPlease address it and continue.`);
      }
      return { ok: true };
    },
    async confirmItem({ itemId }) {
      const item = requireItem(itemId);
      if (!item.proposed) return { ok: true };
      store.items.save({ ...item, proposed: false, updatedAt: now() });
      refreshMembership();
      await evaluateItem(itemId);
      publish(item.coordinatorThreadId);
      await sendNote(item.coordinatorThreadId, item.primaryThreadId
        ? `Coordinator Mode: I confirmed "${item.title}" (item ${item.id}); its sub-thread ${item.primaryThreadId} is tracked.`
        : `Coordinator Mode: I confirmed "${item.title}" (item ${item.id}). Start its sub-thread with coordinator_start_sub_thread.`);
      return { ok: true };
    },
    async cutItem({ itemId }) {
      const item = requireItem(itemId);
      if (item.status === "cut") return { ok: true };
      const next = store.items.save({ ...item, status: "cut", updatedAt: now() });
      refreshMembership();
      log(item.coordinatorThreadId, item.id, "item_cut", `Cut "${item.title}".`);
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
      const approval = store.approvals.get(approvalId);
      if (!approval) throw new Error("This approval no longer exists.");
      if (approval.resolvedAt !== null) return { ok: true };
      const coordinator = requireCoordinator(approval.coordinatorThreadId);
      const args = parseActionArgs(approval.args);
      if (!store.approvals.resolve(approvalId, approve ? "approved" : "declined", now())) return { ok: true };
      const label = ACTION_LABELS[approval.action];
      if (!approve) {
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
        return { ok: true };
      }
      if (!args) throw new Error("This approval can't be replayed.");
      try {
        const text = await execute(coordinator, args);
        log(coordinator.threadId, approval.itemId, "action_run", `Approved: ${text}`, approval.action);
        if (args.kind !== "interaction") await sendNote(coordinator.threadId, `Coordinator Mode: the user approved. ${text}`);
      } catch (error) {
        const message = errorMessage(error);
        log(coordinator.threadId, approval.itemId, "action_declined", `Approved, but it failed: ${approval.summary}. ${message}`, approval.action);
        if (args.kind !== "interaction") await sendNote(coordinator.threadId, `Coordinator Mode: the user approved, but it failed to ${label}: ${message}`);
      }
      publish(coordinator.threadId);
      return { ok: true };
    },
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
    if (member.role === "reviewer") return { tools: [...REVIEWER_TOOLS], skills: [], instructions: REVIEW_INSTRUCTIONS };
    return { tools: [], skills: [] };
  }

  function dispose(): void {
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
