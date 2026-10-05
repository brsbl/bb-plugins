// Shared shapes between the Coordinator Mode server, app, and tests.

/** Server publishes on this channel when coordinator state changes; the app also polls to cover missed signals. */
export const REALTIME_CHANNEL = "coordinator";

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
    | "answered_elsewhere" // an approval's request was answered in the sub-thread itself
    | "rule_broken"
    | "merged_outside"
    | "item_created"
    | "item_cut";
  text: string;
  at: number;
};

export type Briefing = {
  changes: LogEntry[];
  needsYou: Array<{ item: CoordinatorItem; why: string }>;
  next: CoordinatorItem[];
};

/** Output of the `status` RPC method. */
export type CoordinatorStatus = {
  state: CoordinatorState | null;
  items: CoordinatorItem[];
  approvals: PendingApproval[];
  staleRules: boolean;
};
