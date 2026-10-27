import { randomBytes } from "node:crypto";
import { z } from "zod";
import { LIMITS, showInput, type Investment, type Objective, type RecordKind } from "./model.js";
import { parse, PlanError } from "./service.js";
import { createStore, type Db, type Migrate } from "./store.js";

export type StartStatus = "sending" | "uncertain" | "sent" | "failed" | "done";
export type ActiveStartStatus = Extract<StartStatus, "sending" | "uncertain" | "sent">;
export interface ActiveStart { id: string; investmentId: string; assigneeThreadId: string; status: ActiveStartStatus }
export const PENDING_SEND_MS = 60_000;
const MAX_ANCESTRY = 32;

export interface TeamThread {
  id: string;
  name: string | null;
  parentThreadId: string | null;
}

export class SendFailure extends Error {
  constructor(readonly definite: boolean, message: string) {
    super(message);
    this.name = "SendFailure";
  }
}

export function classifySendError(error: unknown): SendFailure {
  if (error instanceof SendFailure) return error;
  const message = error instanceof Error ? error.message : String(error);
  const status = typeof error === "object" && error !== null && "status" in error && typeof error.status === "number" ? error.status : null;
  return new SendFailure(status !== null && status >= 400 && status < 500 && status !== 408, message);
}

export interface StartHost {
  thread(threadId: string): Promise<TeamThread | null>;
  send(threadId: string, text: string): Promise<void>;
  wasSent(threadId: string, marker: string): Promise<boolean>;
}

export interface StartDeps {
  db: Db;
  migrate: Migrate;
  host: StartHost;
  publish(change: { kind: RecordKind; id: string }): void;
  now(): Date;
}

interface StartRow {
  id: string;
  investment_id: string;
  assignee_thread_id: string;
  status: StartStatus;
  message: string;
  error: string | null;
  created_at: string;
  updated_at: string;
}

const text = z.string().trim().min(1, "can't be empty").max(LIMITS.briefField);
const TRIVIAL = /^(done|finished|complete|completed|yes|ok|okay|pass|passed|met|n\/a|tbd|see above)\.?$/i;

export const deliveryOutput = z.strictObject({
  deliverable: text,
  criteria: z.array(z.strictObject({ criterion: text, evidence: text })).min(1, "needs one entry per acceptance criterion").max(100),
  measurement: text.optional(),
  notes: text.optional(),
});
export type DeliveryOutput = z.infer<typeof deliveryOutput>;
export const deliverInput = z.strictObject({ id: z.string().trim().min(1).max(LIMITS.id), output: z.unknown() });

export const OUTPUT_SHAPE = '{"deliverable": "what you delivered and where", "criteria": [{"criterion": "<each acceptance criterion, exactly>", "evidence": "how it is met, with links"}], "measurement": "how it is measured"}';

export function acceptanceCriteria(criteria: string): string[] {
  return criteria.split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:(?:[-*•]|\d+[.)]|\[[ xX]\])\s+)+/, "").trim())
    .filter(Boolean);
}

const normalize = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();

export function deliveryIssues(investment: Investment, output: DeliveryOutput): string[] {
  const issues: string[] = [];
  const required = acceptanceCriteria(investment.brief.acceptanceCriteria ?? "");
  const wanted = new Map(required.map((criterion) => [normalize(criterion), criterion]));
  const seen = new Set<string>();
  output.criteria.forEach((entry, index) => {
    const key = normalize(entry.criterion);
    if (!wanted.has(key)) issues.push(`criteria[${index}]: "${entry.criterion}" isn't one of this investment's acceptance criteria; use their exact text`);
    else if (seen.has(key)) issues.push(`criteria[${index}]: "${entry.criterion}" is listed twice`);
    seen.add(key);
    if (TRIVIAL.test(entry.evidence.trim())) issues.push(`criteria[${index}].evidence: "${entry.evidence}" isn't evidence; say how the criterion is met and link the proof`);
  });
  for (const [key, criterion] of wanted) {
    if (!seen.has(key)) issues.push(`Acceptance criterion not addressed: "${criterion}"`);
  }
  if (TRIVIAL.test(output.deliverable.trim())) issues.push(`deliverable: "${output.deliverable}" doesn't say what was delivered or where`);
  if (investment.brief.measurement && !output.measurement) issues.push(`measurement: the brief measures this with "${investment.brief.measurement}"; say how the result is measured`);
  return issues;
}

function readOutput(value: unknown): DeliveryOutput {
  let body = value;
  if (typeof value === "string") {
    try { body = JSON.parse(value); } catch {
      throw new PlanError("rejected", "Delivery rejected:\n- The output must be JSON with an entry for every acceptance criterion.", `Shape: ${OUTPUT_SHAPE}`);
    }
  }
  const result = deliveryOutput.safeParse(body);
  if (!result.success) {
    const issues = result.error.issues.slice(0, 25).map((issue) => `${issue.path.length ? `${issue.path.join(".")}: ` : ""}${issue.message}`);
    throw new PlanError("rejected", `Delivery rejected:\n${issues.map((issue) => `- ${issue}`).join("\n")}`, `Shape: ${OUTPUT_SHAPE}`);
  }
  return result.data;
}

export function briefMessage(args: { startId: string; investment: Investment; objective: Objective }): string {
  const { startId, investment, objective } = args;
  const brief = investment.brief;
  const criteria = acceptanceCriteria(brief.acceptanceCriteria ?? "");
  const template = JSON.stringify({
    deliverable: "what you delivered and where",
    criteria: criteria.map((criterion) => ({ criterion, evidence: "how it is met, with links" })),
    ...(brief.measurement ? { measurement: "how the result is measured" } : {}),
  });
  return [
    `Plan · Start: ${investment.name}`,
    `Objective: ${objective.name}`,
    `Investment ${investment.id} (\`bb plan investment show ${investment.id}\`) · Start ${startId}`,
    "",
    `Deliverable: ${brief.deliverable ?? ""}`,
    `Scope: ${brief.scope ?? "Only what this brief describes."}`,
    "Acceptance criteria:",
    ...criteria.map((criterion, index) => `${index + 1}. ${criterion}`),
    ...(brief.measurement ? [`Measurement: ${brief.measurement}`] : []),
    ...(brief.sources?.length ? ["Sources:", ...brief.sources.map((source) => `- ${source}`)] : []),
    "",
    "This Start authorizes only this brief's scope. Live ads, spending money and site changes each still need the user's exact approval. Create your own workers for the work; send no requests to other orgs. Keep the usual delivery process: spec, build, review, QA and the user's merge approval. Link results and blockers back to this investment; new scope goes back to Plan.",
    "",
    "When the deliverable passes every acceptance criterion, report it from this thread or one of its workers:",
    `bb plan investment deliver --id ${investment.id} --output '${template.replace(/'/g, "'\\''")}'`,
    "Going idle or saying it's finished doesn't mark it Done.",
  ].join("\n");
}

export type StartService = ReturnType<typeof createStartService>;

export function createStartService(deps: StartDeps) {
  const store = createStore(deps.db, deps.migrate);
  const db = deps.db;
  const stamp = () => deps.now().toISOString();

  const activeForInvestment = db.prepare("SELECT * FROM plan_starts WHERE investment_id = ? AND status IN ('sending', 'uncertain', 'sent')");
  const activeForTeam = db.prepare(`SELECT s.*, i.name AS investment_name FROM plan_starts s JOIN plan_investments i ON i.id = s.investment_id
    WHERE s.assignee_thread_id = ? AND s.status IN ('sending', 'uncertain', 'sent')`);
  const inProgressForTeam = db.prepare(`SELECT i.id, i.name FROM plan_investments i JOIN plan_objectives o ON o.id = i.objective_id
    WHERE o.assignee_thread_id = ? AND i.state = 'in_progress' LIMIT 1`);
  const insertStart = db.prepare(`INSERT INTO plan_starts (id, investment_id, assignee_thread_id, status, message, error, created_at, updated_at)
    VALUES (@id, @investment_id, @assignee_thread_id, 'sending', @message, NULL, @at, @at)`);
  const moveStart = db.prepare("UPDATE plan_starts SET status = @to, error = @error, updated_at = @at WHERE id = @id AND status = @from");
  const reclaimStale = db.prepare("UPDATE plan_starts SET updated_at = @at WHERE id = @id AND status = 'sending' AND updated_at = @seen");
  const startById = db.prepare("SELECT * FROM plan_starts WHERE id = ?");
  const activeStarts = db.prepare("SELECT * FROM plan_starts WHERE status IN ('sending', 'uncertain', 'sent') ORDER BY created_at, rowid");
  const unconfirmed = db.prepare("SELECT * FROM plan_starts WHERE status IN ('sending', 'uncertain') ORDER BY created_at, rowid");
  const setState = db.prepare("UPDATE plan_investments SET state = @to, updated_at = @at WHERE id = @id AND state = @from");
  const insertDelivery = db.prepare("INSERT INTO plan_deliveries (investment_id, start_id, thread_id, body, created_at) VALUES (@investment_id, @start_id, @thread_id, @body, @at)");

  const missingInvestment = (id: string) => new PlanError("not_found", `No investment ${id}.`, "Run `bb plan show` to list records and their IDs.");
  const requireInvestment = (id: string): Investment => {
    const found = store.investment(id);
    if (!found) throw missingInvestment(id);
    return found;
  };
  const active = (investmentId: string) => (activeForInvestment.get(investmentId) as StartRow | undefined) ?? null;
  const reread = (id: string) => startById.get(id) as StartRow;

  const readiness = (investment: Investment): { objective: Objective; assigneeThreadId: string } => {
    if (investment.state !== "not_started") {
      throw new PlanError("wrong_state", `${investment.name} is already ${investment.state === "done" ? "Done" : "In progress"}.`);
    }
    const objective = store.objective(investment.objectiveId);
    if (!objective) throw new PlanError("not_found", `No objective ${investment.objectiveId}.`);
    const issues: string[] = [];
    if (investment.rank === null) issues.push("Its lift isn't checked and reconciled yet");
    if (!objective.approved) issues.push("Approve its objective first");
    if (!objective.assigneeThreadId) issues.push("Assign a team first");
    if (!investment.brief.deliverable) issues.push("brief.deliverable: add what the team hands back");
    if (!investment.brief.acceptanceCriteria || !acceptanceCriteria(investment.brief.acceptanceCriteria).length) {
      issues.push("brief.acceptanceCriteria: add how the deliverable is accepted, one criterion per line");
    }
    if (issues.length || !objective.assigneeThreadId) {
      throw new PlanError("not_ready", `Can't start ${investment.name}:\n${issues.map((issue) => `- ${issue}`).join("\n")}`,
        `Fill the brief with \`bb plan investment edit ${investment.id} --deliverable … --acceptance-criteria … --expected-revision ${investment.revision}\`.`);
    }
    return { objective, assigneeThreadId: objective.assigneeThreadId };
  };

  const teamBusy = (assigneeThreadId: string, teamName: string | null): PlanError | null => {
    const started = activeForTeam.get(assigneeThreadId) as (StartRow & { investment_name: string }) | undefined;
    const running = started ? { name: started.investment_name } : (inProgressForTeam.get(assigneeThreadId) as { id: string; name: string } | undefined);
    if (!running) return null;
    const team = (teamName ?? "This team").split(" / ").pop() ?? "This team";
    return new PlanError("team_busy", `${team} is working on ${running.name}.`, "One investment at a time per team; Start the next one after it is Done.");
  };

  const confirm = (row: StartRow): Investment => {
    store.transaction(() => {
      moveStart.run({ id: row.id, from: "sending", to: "sent", error: null, at: stamp() });
      setState.run({ id: row.investment_id, from: "not_started", to: "in_progress", at: stamp() });
    });
    deps.publish({ kind: "investment", id: row.investment_id });
    return requireInvestment(row.investment_id);
  };

  const send = async (row: StartRow): Promise<Investment> => {
    try {
      await deps.host.send(row.assignee_thread_id, row.message);
    } catch (error) {
      const failure = classifySendError(error);
      if (failure.definite) {
        moveStart.run({ id: row.id, from: "sending", to: "failed", error: failure.message, at: stamp() });
        deps.publish({ kind: "investment", id: row.investment_id });
        throw new PlanError("send_failed", `Couldn't send the brief: ${failure.message}. Nothing was started.`);
      }
      moveStart.run({ id: row.id, from: "sending", to: "uncertain", error: failure.message, at: stamp() });
      deps.publish({ kind: "investment", id: row.investment_id });
      throw new PlanError("send_uncertain", `Couldn't confirm the brief reached the team: ${failure.message}.`, "Press Start again to check; it won't send twice.");
    }
    return confirm(row);
  };

  const resume = async (row: StartRow): Promise<Investment> => {
    if (row.status === "sent") return requireInvestment(row.investment_id);
    if (row.status === "sending") {
      if (deps.now().getTime() - Date.parse(row.updated_at) < PENDING_SEND_MS) {
        throw new PlanError("start_pending", "This investment is already being started.", "Wait a moment, then check it again.");
      }
      if (reclaimStale.run({ id: row.id, seen: row.updated_at, at: stamp() }).changes !== 1) {
        throw new PlanError("start_pending", "This investment is already being started.", "Wait a moment, then check it again.");
      }
    } else if (moveStart.run({ id: row.id, from: "uncertain", to: "sending", error: row.error, at: stamp() }).changes !== 1) {
      throw new PlanError("start_pending", "This investment is already being started.", "Wait a moment, then check it again.");
    }
    const claimed = reread(row.id);
    let delivered: boolean;
    try {
      delivered = await deps.host.wasSent(claimed.assignee_thread_id, claimed.id);
    } catch (error) {
      moveStart.run({ id: claimed.id, from: "sending", to: "uncertain", error: claimed.error, at: stamp() });
      throw new PlanError("send_uncertain", `Couldn't check whether the brief reached the team: ${error instanceof Error ? error.message : String(error)}.`, "Press Start again to check; it won't send twice.");
    }
    return delivered ? confirm(claimed) : send(claimed);
  };

  const check = async (row: StartRow): Promise<boolean> => {
    if (row.status === "sending") {
      if (deps.now().getTime() - Date.parse(row.updated_at) < PENDING_SEND_MS) return false;
      if (reclaimStale.run({ id: row.id, seen: row.updated_at, at: stamp() }).changes !== 1) return false;
    } else if (moveStart.run({ id: row.id, from: "uncertain", to: "sending", error: row.error, at: stamp() }).changes !== 1) {
      return false;
    }
    const claimed = reread(row.id);
    const delivered = await deps.host.wasSent(claimed.assignee_thread_id, claimed.id).catch(() => false);
    if (delivered) {
      confirm(claimed);
      return true;
    }
    moveStart.run({ id: claimed.id, from: "sending", to: "uncertain", error: claimed.error ?? "The brief hasn't been confirmed in the team's thread yet.", at: stamp() });
    return false;
  };

  return {
    active(): ActiveStart[] {
      return (activeStarts.all() as StartRow[]).flatMap((row) => row.status === "sending" || row.status === "uncertain" || row.status === "sent"
        ? [{ id: row.id, investmentId: row.investment_id, assigneeThreadId: row.assignee_thread_id, status: row.status }]
        : []);
    },

    async reconcile(): Promise<number> {
      let confirmed = 0;
      for (const row of unconfirmed.all() as StartRow[]) {
        if (await check(row)) confirmed += 1;
      }
      return confirmed;
    },

    async start(input: unknown): Promise<Investment> {
      const { id } = parse(showInput, input);
      const investment = requireInvestment(id);
      const pending = active(investment.id);
      if (pending) return resume(pending);
      const { assigneeThreadId } = readiness(investment);
      const thread = await deps.host.thread(assigneeThreadId).catch(() => null);
      if (!thread) throw new PlanError("unknown_thread", "The assigned team thread no longer exists.", "Assign an existing team thread to the objective.");
      const row = store.transaction(() => {
        const latest = requireInvestment(id);
        if (active(latest.id)) return null;
        const ready = readiness(latest);
        if (ready.assigneeThreadId !== assigneeThreadId) throw new PlanError("stale_revision", "The objective's team changed while starting. Nothing was sent.");
        const busy = teamBusy(assigneeThreadId, thread.name);
        if (busy) throw busy;
        const startId = `st_${randomBytes(8).toString("hex")}`;
        try {
          insertStart.run({ id: startId, investment_id: latest.id, assignee_thread_id: assigneeThreadId, message: briefMessage({ startId, investment: latest, objective: ready.objective }), at: stamp() });
        } catch (error) {
          if (error instanceof Error && "code" in error && error.code === "SQLITE_CONSTRAINT_UNIQUE") throw teamBusy(assigneeThreadId, thread.name) ?? new PlanError("start_pending", "This investment is already being started.");
          throw error;
        }
        return reread(startId);
      });
      if (!row) return resume(active(id)!);
      return send(row);
    },

    async deliver(input: unknown, callerThreadId: string | null): Promise<Investment> {
      const value = parse(deliverInput, input);
      if (!callerThreadId) {
        throw new PlanError("not_assignee", "Report a delivery from the team thread the investment was started in, or one of its workers.");
      }
      const investment = requireInvestment(value.id);
      if (investment.state !== "in_progress") {
        throw new PlanError("wrong_state", `${investment.name} is ${investment.state === "done" ? "already Done" : "not started"}; only an In progress investment can be delivered.`);
      }
      const row = active(investment.id);
      if (!row || row.status !== "sent") throw new PlanError("wrong_state", `${investment.name} has no confirmed Start.`);
      let current: string | null = callerThreadId;
      const visited = new Set<string>();
      let allowed = false;
      while (current && !visited.has(current) && visited.size < MAX_ANCESTRY) {
        if (current === row.assignee_thread_id) { allowed = true; break; }
        visited.add(current);
        const thread: TeamThread | null = await deps.host.thread(current).catch(() => null);
        current = thread?.parentThreadId ?? null;
      }
      if (!allowed) {
        throw new PlanError("not_assignee", `Only the team thread ${row.assignee_thread_id} or one of its workers can deliver ${investment.name}.`);
      }
      const output = readOutput(value.output);
      const issues = deliveryIssues(investment, output);
      if (issues.length) throw new PlanError("rejected", `Delivery rejected:\n${issues.map((issue) => `- ${issue}`).join("\n")}`, "Fix every listed problem and deliver again; nothing was saved.");
      store.transaction(() => {
        if (setState.run({ id: investment.id, from: "in_progress", to: "done", at: stamp() }).changes !== 1) throw new PlanError("wrong_state", `${investment.name} changed while delivering.`);
        if (moveStart.run({ id: row.id, from: "sent", to: "done", error: null, at: stamp() }).changes !== 1) throw new PlanError("wrong_state", `${investment.name} changed while delivering.`);
        insertDelivery.run({ investment_id: investment.id, start_id: row.id, thread_id: callerThreadId, body: JSON.stringify(output), at: stamp() });
      });
      deps.publish({ kind: "investment", id: investment.id });
      return requireInvestment(investment.id);
    },
  };
}
