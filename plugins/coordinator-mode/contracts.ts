// Shared shapes between the Coordinator Mode server, app, and tests.

export const PLUGIN_ID = "coordinator-mode";

/** How a stage is proven done. Each stage has exactly one check. */
export type CheckKind =
  | "none" // first stage: an item enters here when it is created
  | "thread_done" // primary sub-thread idle with no pending question
  | "pr_open"
  | "ci_green"
  | "pr_merged"
  | "you_approve" // user clicks Approve (Reject sends it back)
  | "reviewer_passes" // a review sub-thread records pass via the review tool
  | "link_added"; // item has a URL in its link field

export type GatedAction =
  | "start_sub_thread"
  | "archive_sub_thread"
  | "merge_pr"
  | "digest_publish";

export type RuleColumn = "alone" | "ask" | "never";

/** Optional condition narrowing when a rule applies. */
export type RuleCondition =
  | { kind: "before_stage_passes"; stage: string }
  | { kind: "while_merge_running" }
  | { kind: "primary_only" };

export type CoordinatorRule =
  | {
      kind: "gated";
      action: GatedAction;
      column: RuleColumn;
      condition?: RuleCondition;
    }
  /** Free text: injected into instructions, visibly not enforced. */
  | { kind: "instruction"; column: RuleColumn; text: string };

export type StageDefinition = { name: string; check: CheckKind };

export type CoordinatorTemplate = {
  id: string;
  name: string;
  purpose: string;
  stages: StageDefinition[];
  rules: CoordinatorRule[];
  /** Plain-text sub-thread rules (naming, provider, retiring). */
  subThreadRules: string;
  /** Cron expression (local time) or null for "on stage changes only". */
  briefingCron: string | null;
  briefingLabel: string;
  /** Chat prefix that creates an item and starts its sub-thread, e.g. "worker:". */
  intakePrefix: string | null;
};

export type ItemStatus = "active" | "blocked" | "cut" | "done";

export type CoordinatorItem = {
  id: string;
  coordinatorThreadId: string;
  title: string;
  stageIndex: number;
  status: ItemStatus;
  /** Reason for the last failure, rejection, or block. */
  reason: string | null;
  link: string | null;
  primaryThreadId: string | null;
  helperThreadIds: string[];
  /** Set while waiting for the user to confirm a proposed item. */
  proposed: boolean;
  createdAt: number;
  updatedAt: number;
};

export type PendingApproval = {
  id: string;
  coordinatorThreadId: string;
  itemId: string | null;
  action: GatedAction;
  summary: string;
  /** Opaque arguments replayed when approved. */
  args: Record<string, unknown>;
  createdAt: number;
};

export type CoordinatorState = {
  threadId: string;
  template: CoordinatorTemplate;
  paused: boolean;
  autoApprove: boolean;
  /** Rules version the coordinator's current session was started with. */
  appliedRulesVersion: number;
  rulesVersion: number;
  lastOpenedAt: number;
  createdAt: number;
};

export type LogEntry = {
  id: number;
  coordinatorThreadId: string;
  itemId: string | null;
  kind:
    | "stage_advanced"
    | "stage_failed"
    | "action_run"
    | "action_denied"
    | "action_asked"
    | "action_declined"
    | "command_approved"
    | "command_denied"
    | "rule_broken"
    | "merged_outside"
    | "item_created"
    | "item_cut";
  text: string;
  at: number;
};

export type Briefing = {
  since: number;
  changes: LogEntry[];
  needsYou: Array<{ item: CoordinatorItem; why: string }>;
  next: CoordinatorItem[];
};

// RPC methods the app calls on the server (bb.rpc.register).
export type RpcMethods = {
  status: (args: { threadId: string }) => {
    state: CoordinatorState | null;
    items: CoordinatorItem[];
    approvals: PendingApproval[];
    staleRules: boolean;
  };
  templates: (args: Record<string, never>) => { templates: CoordinatorTemplate[] };
  turnOn: (args: { threadId: string; template: CoordinatorTemplate }) => { ok: true };
  createNew: (args: { projectId: string; template: CoordinatorTemplate }) => { threadId: string };
  turnOff: (args: { threadId: string }) => { ok: true };
  setPaused: (args: { threadId: string; paused: boolean }) => { ok: true };
  setAutoApprove: (args: { threadId: string; autoApprove: boolean }) => { ok: true };
  updateTemplate: (args: { threadId: string; template: CoordinatorTemplate }) => { ok: true };
  restartCoordinator: (args: { threadId: string }) => { ok: true };
  approveItem: (args: { itemId: string }) => { ok: true };
  rejectItem: (args: { itemId: string; reason: string }) => { ok: true };
  confirmItem: (args: { itemId: string }) => { ok: true };
  cutItem: (args: { itemId: string }) => { ok: true };
  setLink: (args: { itemId: string; link: string }) => { ok: true };
  resolveApproval: (args: { approvalId: string; approve: boolean; reason?: string }) => { ok: true };
  markOpened: (args: { threadId: string }) => { ok: true };
  describeProcess: (args: { description: string; projectId: string }) => { template: CoordinatorTemplate };
};
