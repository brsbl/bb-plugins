import { readFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";
import { cliCommand, defineCli, PluginCliError, type BbPluginApi } from "@get-bb/plugin-sdk";
import { z } from "zod";
import { RESEARCH_KINDS, RESEARCH_STATUSES, type Brief, type Investment, type Objective, type ObjectiveView, type Overview, type Priority, type PriorityView } from "./model.js";
import { createResearchService, DEFAULT_CONCURRENCY, RESEARCH_PHASES, SLOTS, type ResearchHost, type ResearchJobView, type ResearchService } from "./research.js";
import { createPlanService, PlanError, type PlanService, type ThreadInfo } from "./service.js";
import { classifySendError, createStartService, OUTPUT_SHAPE, SendFailure, type StartHost, type StartService } from "./start.js";
import { CHANGED, rpcContract, type Outcome, type Snapshot, type ThreadOption } from "./rpc.js";
import { groupOrgs, type AssigneeThread, type ThreadRef } from "./components/view-model.js";

export { CHANGED };
const MAX_STDOUT = 900 * 1024;

const TOOL_ACTIONS = [
  "show",
  "priority_add", "priority_edit", "priority_list", "priority_show",
  "objective_add", "objective_edit", "objective_approve", "objective_assign", "objective_show",
  "investment_add", "investment_edit", "investment_show", "investment_start", "investment_deliver",
  "research_list", "research_show", "research_submit", "research_reconcile", "research_rerun", "research_close",
] as const;
type ToolAction = (typeof TOOL_ACTIONS)[number];

const PRIORITY_CLEARABLE = ["metric", "baseline", "now", "target", "by", "constraints"] as const;
const BRIEF_CLEARABLE = ["deliverable", "scope", "acceptance-criteria", "measurement", "sources"] as const;
const BRIEF_KEYS: Record<(typeof BRIEF_CLEARABLE)[number], keyof Brief> = {
  deliverable: "deliverable",
  scope: "scope",
  "acceptance-criteria": "acceptanceCriteria",
  measurement: "measurement",
  sources: "sources",
};

const INSTRUCTIONS = [
  "Plan records (company priorities, objectives, investments) are shared with the user's Plan panel. Read and write them only through the plan tool or `bb plan`; both run the same validation.",
  "Every edit, approve and assign needs expectedRevision from your latest read. A stale_revision error means the record changed: show it again, reconcile with the user's change, and only then retry.",
  "Objectives you propose are added with proposed=true and stay unapproved until the user adopts them. Assign an objective only to an existing org or team thread ID, never a typed name.",
  "Lift and investment state are not editable here. Adding or assigning records sends nothing to any thread.",
  "investment_start sends the investment's saved brief to its objective's team thread and marks it In progress; it needs checked lift, an approved objective with a team, a deliverable and acceptance criteria, and a team with nothing In progress. Start only when the user asks.",
  "investment_deliver marks it Done and frees the team. Call it only from the team thread the brief was sent to or one of its workers, once the deliverable passes every acceptance criterion, with output: one { criterion, evidence } entry per criterion.",
  "Research runs on its own: Plan creates two independent research threads per request, then one reconciliation thread, and publishes only a valid reconciliation. research_submit, research_reconcile, research_rerun and research_close are for those research threads only, following the Plan plugin's research skills.",
].join(" ");
const RESEARCH_INTERVAL_MS = 30_000;

interface Services { plan: PlanService; research: ResearchService; starts: StartService }

const ACTIONS: Record<ToolAction, (services: Services, input: Record<string, unknown>, threadId: string) => Promise<unknown>> = {
  show: async ({ plan }, input, threadId) => ({ ...(await plan.overview(input)), openInPanel: plan.openRecord(threadId) }),
  priority_add: ({ plan }, input) => plan.addPriority(input),
  priority_edit: ({ plan }, input) => plan.editPriority(input),
  priority_list: ({ plan }, input) => plan.listPriorities(input),
  priority_show: ({ plan }, input) => plan.showPriority(input),
  objective_add: ({ plan }, input) => plan.addObjective(input),
  objective_edit: ({ plan }, input) => plan.editObjective(input),
  objective_approve: ({ plan }, input) => plan.approveObjective(input),
  objective_assign: ({ plan }, input) => plan.assignObjective(input),
  objective_show: ({ plan }, input) => plan.showObjective(input),
  investment_add: ({ plan }, input) => plan.addInvestment(input),
  investment_edit: ({ plan }, input) => plan.editInvestment(input),
  investment_show: ({ plan }, input) => plan.showInvestment(input),
  investment_start: ({ starts }, input) => starts.start(input),
  investment_deliver: ({ starts }, input, threadId) => starts.deliver(input, threadId),
  research_list: ({ research }, input) => research.list(input),
  research_show: ({ research }, input) => research.show(input),
  research_submit: ({ research }, input, threadId) => research.submit(input, threadId),
  research_reconcile: ({ research }, input, threadId) => research.reconcile(input, threadId),
  research_rerun: ({ research }, input, threadId) => research.rerun(input, threadId),
  research_close: ({ research }, input, threadId) => research.close(input, threadId),
};

const toolParameters = z.object({
  action: z.enum(TOOL_ACTIONS).describe("show: the whole plan, plus openInPanel: the record open in this thread's Plan panel ({ kind, id } or null). <record>_add, <record>_edit, <record>_show, priority_list, objective_approve, objective_assign, investment_start (sends the brief to the team), investment_deliver (team thread only). research_list, research_show; research threads only: research_submit, research_reconcile, research_rerun, research_close."),
  id: z.string().optional().describe("Record ID for _edit, _show, objective_approve, objective_assign, investment_start and investment_deliver"),
  expectedRevision: z.number().int().optional().describe("The revision you last read; required for _edit, objective_approve and objective_assign"),
  name: z.string().optional().describe("Record name"),
  priorityId: z.string().optional().describe("objective_add: parent priority. objective_edit: move under this priority"),
  objectiveId: z.string().optional().describe("investment_add: parent objective"),
  metric: z.string().nullable().optional().describe("Priority metric name from Analytics' shared definitions; null clears"),
  baseline: z.number().nullable().optional().describe("Priority baseline value; null clears"),
  now: z.number().nullable().optional().describe("Priority current value; null clears"),
  target: z.number().nullable().optional().describe("Priority target value; null clears"),
  by: z.string().nullable().optional().describe("Priority target date, YYYY-MM-DD; null clears"),
  constraints: z.string().nullable().optional().describe("Priority constraints; null clears"),
  proposed: z.boolean().optional().describe("objective_add: true when you propose it; it stays unapproved until the user adopts it"),
  assigneeThreadId: z.string().nullable().optional().describe("objective_add, objective_assign: an existing org or team thread ID (thr_…); null unassigns"),
  existing: z.boolean().optional().describe("Investment is existing activity rather than new work"),
  brief: z.object({
    deliverable: z.string().nullable().optional(),
    scope: z.string().nullable().optional(),
    acceptanceCriteria: z.string().nullable().optional(),
    measurement: z.string().nullable().optional(),
    sources: z.array(z.string()).nullable().optional(),
  }).optional().describe("Investment brief; on investment_edit, given fields replace saved ones and null clears one"),
  requestId: z.string().optional().describe("research_*: the research request ID (rr_…)"),
  slot: z.enum(SLOTS).optional().describe("research_submit: your research slot, a or b"),
  submission: z.record(z.string(), z.unknown()).optional().describe("research_submit: the submission object described by the Plan research skills"),
  reconciliation: z.record(z.string(), z.unknown()).optional().describe("research_reconcile: the reconciliation object described by the reconcile-research skill"),
  objectiveIds: z.array(z.string()).optional().describe("research_rerun: objectives whose portfolios the edit affects"),
  reason: z.string().optional().describe("research_rerun, research_close: why"),
  output: z.record(z.string(), z.unknown()).optional().describe(`investment_deliver: the delivery, ${OUTPUT_SHAPE}`),
  status: z.enum(RESEARCH_STATUSES).optional().describe("research_list: filter by request status"),
  kind: z.enum(RESEARCH_KINDS).optional().describe("research_list: filter by request kind"),
  phase: z.enum(RESEARCH_PHASES).optional().describe("research_list: filter by research phase"),
});

function toolInput(params: z.output<typeof toolParameters>): { action: ToolAction; input: Record<string, unknown> } {
  const { action, ...rest } = params;
  return { action, input: defined(rest) };
}

function errorBody(error: unknown) {
  if (error instanceof PlanError) return { code: error.code, message: error.message, ...(error.hint ? { hint: error.hint } : {}) };
  return { code: "failed", message: error instanceof Error ? error.message : String(error) };
}

function toCliError(error: unknown): PluginCliError {
  if (error instanceof PluginCliError) return error;
  const body = errorBody(error);
  return new PluginCliError(body.message, { code: body.code, ...("hint" in body && body.hint ? { hint: body.hint } : {}) });
}

async function guard<T>(run: () => Promise<T>): Promise<T> {
  try { return await run(); } catch (error) { throw toCliError(error); }
}

function output(json: boolean, value: unknown, human: () => string) {
  const stdout = json ? JSON.stringify(value) : human();
  if (Buffer.byteLength(stdout) > MAX_STDOUT) throw new PluginCliError("The result is too large to print.", { code: "too_large", hint: "Show one record at a time." });
  return { exitCode: 0, stdout };
}

function numberOption(value: string | undefined, flag: string): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value.replace(/[,_\s]/g, ""));
  if (value.trim() === "" || !Number.isFinite(parsed)) throw new PluginCliError(`--${flag} must be a number.`, { code: "invalid" });
  return parsed;
}

function defined<T extends Record<string, unknown>>(value: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
}

function amount(n: number | null): string {
  return n === null ? "—" : n.toLocaleString("en-US");
}

function priorityLine(priority: Priority): string {
  const metric = priority.metric ? ` · ${amount(priority.now)} now → ${amount(priority.target)} ${priority.metric}${priority.by ? ` by ${priority.by}` : ""}` : "";
  return `${priority.id}  r${priority.revision}  ${priority.name}${metric}`;
}

function objectiveLine(objective: Objective | ObjectiveView): string {
  const owner = "assignee" in objective && objective.assignee
    ? objective.assignee.available ? `@${objective.assignee.name ?? objective.assignee.threadId}` : `${objective.assignee.threadId} (thread unavailable)`
    : objective.assigneeThreadId ?? "Unassigned";
  return `${objective.id}  r${objective.revision}  ${objective.name} · ${owner}${objective.approved ? "" : " · proposed"}`;
}

const STATE_LABEL: Record<Investment["state"], string> = { not_started: "Not started", in_progress: "In progress", done: "Done" };

function investmentLine(investment: Investment): string {
  const lift = investment.lift
    ? `+${investment.lift.base} ${investment.lift.unit} (${investment.lift.low}–${investment.lift.high})${investment.rank ? ` · #${investment.rank}` : ""}`
    : investment.research?.missing ? `Unsized: ${investment.research.missing}` : "Researching";
  return `${investment.id}  r${investment.revision}  ${investment.name} · ${lift} · ${STATE_LABEL[investment.state]}`;
}

function researchLine(job: ResearchJobView): string {
  const threads = job.threads.map((entry) => `${entry.role}:${entry.threadId ?? "starting"}`).join(" ");
  const slots = job.submissions.map((entry) => entry.slot).join(",") || "none";
  return [`${job.request.id}  ${job.request.kind} ${job.request.subjectKind} ${job.request.subjectId} r${job.request.subjectRevision} · ${job.phase ?? "pending"}`,
    `  submissions: ${slots}${threads ? ` · threads ${threads}` : ""}${job.detail ? `\n  ${job.detail}` : ""}`].join("\n");
}

async function readPayload(options: { file?: string; data?: string }, cwd: string | undefined): Promise<Record<string, unknown>> {
  let raw = options.data;
  if (options.file !== undefined) {
    const path = isAbsolute(options.file) || !cwd ? options.file : resolve(cwd, options.file);
    raw = await readFile(path, "utf8").catch((error: unknown) => {
      throw new PluginCliError(`Couldn't read ${path}: ${error instanceof Error ? error.message : String(error)}`, { code: "invalid", hint: "Pass the JSON with --data-stdin instead when the file is on another machine." });
    });
  }
  let value: unknown;
  try { value = JSON.parse(raw ?? ""); } catch { throw new PluginCliError("The submission isn't valid JSON.", { code: "invalid" }); }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new PluginCliError("The submission must be a JSON object.", { code: "invalid" });
  return value as Record<string, unknown>;
}

function investmentDetail(investment: Investment): string {
  const lines = [investmentLine(investment)];
  const brief = investment.brief;
  if (brief.deliverable) lines.push(`Deliverable: ${brief.deliverable}`);
  if (brief.scope) lines.push(`Scope: ${brief.scope}`);
  if (brief.acceptanceCriteria) lines.push(`Acceptance criteria: ${brief.acceptanceCriteria}`);
  if (brief.measurement) lines.push(`Measurement: ${brief.measurement}`);
  for (const source of brief.sources ?? []) lines.push(`Source: ${source}`);
  if (investment.lift) lines.push(`Method: ${investment.lift.method}`, `Cost: ${investment.lift.cost}`, `Depends on: ${investment.lift.dependencies}`);
  return lines.join("\n");
}

function objectiveDetail(objective: ObjectiveView, indent = ""): string {
  return [`${indent}${objectiveLine(objective)}`, ...objective.investments.map((investment) => `${indent}  ${investmentLine(investment)}`)].join("\n");
}

function priorityDetail(priority: PriorityView): string {
  const lines = [priorityLine(priority)];
  if (priority.constraints) lines.push(`  Constraints: ${priority.constraints}`);
  for (const objective of priority.objectives) lines.push(objectiveDetail(objective, "  "));
  return lines.join("\n");
}

function overviewText(overview: Overview): string {
  return overview.priorities.length ? overview.priorities.map(priorityDetail).join("\n\n") : "No company priorities yet. Add one with `bb plan priority add <name>`.";
}

async function findThread(bb: BbPluginApi, threadId: string): Promise<ThreadInfo | null> {
  const thread = await bb.sdk.threads.get({ threadId }).catch(() => null);
  if (!thread || thread.deletedAt !== null) return null;
  return { id: thread.id, name: thread.title ?? thread.titleFallback ?? null };
}

async function outcome<T>(run: () => Promise<T>): Promise<Outcome<T>> {
  try {
    return { ok: true, value: await run() };
  } catch (error) {
    const body = errorBody(error);
    return { ok: false, code: body.code, message: body.message };
  }
}

const threadName = (thread: { id: string; title: string | null; titleFallback: string | null }) => thread.title ?? thread.titleFallback ?? thread.id;

async function threadRef(bb: BbPluginApi, threadId: string): Promise<(ThreadRef & { parentThreadId: string | null }) | null> {
  const thread = await bb.sdk.threads.get({ threadId }).catch(() => null);
  if (!thread || thread.deletedAt !== null) return null;
  return { threadId: thread.id, name: thread.title ?? thread.titleFallback ?? null, parentThreadId: thread.parentThreadId };
}

async function orgsFor(bb: BbPluginApi, assigneeIds: string[]) {
  const refs = (await Promise.all(assigneeIds.map((id) => threadRef(bb, id)))).filter((ref) => ref !== null);
  const parentIds = [...new Set(refs.map((ref) => ref.parentThreadId).filter((id): id is string => id !== null))];
  const parents = new Map((await Promise.all(parentIds.map((id) => threadRef(bb, id)))).filter((ref) => ref !== null).map((ref) => [ref.threadId, ref]));
  const threads: AssigneeThread[] = refs.map((ref) => {
    const parent = ref.parentThreadId ? parents.get(ref.parentThreadId) : undefined;
    return { threadId: ref.threadId, name: ref.name, parent: parent ? { threadId: parent.threadId, name: parent.name } : null };
  });
  return groupOrgs(threads);
}

async function searchThreads(bb: BbPluginApi, query: string): Promise<ThreadOption[]> {
  const text = query.trim();
  if (!text) {
    const threads = await bb.sdk.threads.list({ limit: 20 });
    return threads.filter((thread) => thread.deletedAt === null).map((thread) => ({ id: thread.id, name: threadName(thread) }));
  }
  const found = await bb.sdk.threads.search({ query: text, limitPerGroup: "20" });
  return found.active.results
    .filter((result) => result.thread.deletedAt === null && result.matches.some((match) => match.sourceKind === "title" || match.sourceKind === "title_fallback"))
    .map((result) => ({ id: result.thread.id, name: threadName(result.thread) }));
}

const inputText = (input: readonly { type: string; text?: string }[]) => input.map((part) => (part.type === "text" ? part.text ?? "" : "")).join("\n");

function startHost(bb: BbPluginApi): StartHost {
  return {
    async thread(threadId) {
      const thread = await bb.sdk.threads.get({ threadId }).catch(() => null);
      if (!thread || thread.deletedAt !== null) return null;
      return { id: thread.id, name: thread.title ?? thread.titleFallback ?? null, parentThreadId: thread.parentThreadId };
    },
    async send(threadId, text) {
      const result = await bb.sdk.threads.send({ threadId, mode: "queue-if-active", input: [{ type: "text", text, mentions: [] }] }).catch((error: unknown) => {
        throw classifySendError(error);
      });
      if (!result.ok) throw new SendFailure(false, "bb didn't accept the message");
    },
    async wasSent(threadId, marker) {
      const queued = await bb.sdk.threads.queuedMessages.list({ threadId });
      if (queued.some((row) => inputText(row.content).includes(marker))) return true;
      const events = await bb.sdk.threads.events.list({ threadId, types: ["client/turn/requested"], order: "desc", limit: "200" });
      return events.some((event) => event.type === "client/turn/requested" && inputText(event.data.input).includes(marker));
    },
  };
}

async function readOutputOption(value: string, cwd: string | undefined): Promise<unknown> {
  if (value.trim().startsWith("{")) return value;
  const path = isAbsolute(value) || !cwd ? value : resolve(cwd, value);
  return readFile(path, "utf8").catch((error: unknown) => {
    throw new PluginCliError(`Couldn't read ${path}: ${error instanceof Error ? error.message : String(error)}`, { code: "invalid", hint: "Pass the JSON itself to --output instead." });
  });
}

function researchHost(bb: BbPluginApi): ResearchHost {
  const settings = bb.settings.define({
    researchProjectId: {
      type: "project",
      label: "Research project",
      description: "The bb project where Plan creates research threads. When unset, research uses the project of the plan's first assigned team thread.",
    },
    researchConcurrency: {
      type: "number",
      label: "Research requests in flight",
      description: "How many research requests may run at once. Each request uses two research threads, then one reconciliation thread.",
      default: DEFAULT_CONCURRENCY,
    },
  });
  return {
    async settings() {
      const values = await settings.get();
      const projectId = values.researchProjectId?.trim() || null;
      const concurrency = Number.isFinite(values.researchConcurrency) && values.researchConcurrency >= 1 ? values.researchConcurrency : DEFAULT_CONCURRENCY;
      return { projectId, concurrency };
    },
    async threadProject(threadId) {
      const thread = await bb.sdk.threads.get({ threadId }).catch(() => null);
      return thread && thread.deletedAt === null ? thread.projectId : null;
    },
    async spawnThread({ projectId, title, prompt, metadata }) {
      const thread = await bb.sdk.threads.spawn({
        projectId, environment: { type: "project-default" }, title, prompt, visibility: "visible", pluginMetadata: { ...metadata },
      });
      return thread.id;
    },
    async findSpawnedThread({ projectId, title }) {
      const threads = await bb.sdk.threads.list({ originPluginId: bb.pluginId, projectId, includeHidden: true, limit: 200 });
      return threads.find((thread) => thread.deletedAt === null && thread.title === title)?.id ?? null;
    },
    log: (message) => bb.log.warn(message),
  };
}

export default function plugin(bb: BbPluginApi): void {
  const research = createResearchService({
    db: bb.storage.database(),
    migrate: (db, statements) => bb.storage.migrate(db, statements),
    host: researchHost(bb),
    findThread: (threadId) => findThread(bb, threadId),
    publish: (change) => bb.realtime.publish(CHANGED, change),
    now: () => new Date(),
  });
  const service = createPlanService({
    db: bb.storage.database(),
    migrate: (db, statements) => bb.storage.migrate(db, statements),
    findThread: (threadId) => findThread(bb, threadId),
    publish: (change) => { bb.realtime.publish(CHANGED, change); research.kick(); },
    now: () => new Date(),
  });
  const starts = createStartService({
    db: bb.storage.database(),
    migrate: (db, statements) => bb.storage.migrate(db, statements),
    host: startHost(bb),
    publish: (change) => bb.realtime.publish(CHANGED, change),
    now: () => new Date(),
  });
  const services: Services = { plan: service, research, starts };

  bb.background.service("research-runner", {
    async start(signal) {
      while (!signal.aborted) {
        await research.tick().catch((error: unknown) => bb.log.warn(`Research runner failed: ${error instanceof Error ? error.message : String(error)}`));
        await new Promise<void>((done) => {
          const timer = setTimeout(done, RESEARCH_INTERVAL_MS);
          signal.addEventListener("abort", () => { clearTimeout(timer); done(); }, { once: true });
        });
      }
    },
  });

  bb.rpc.register(rpcContract, {
    snapshot: async (): Promise<Snapshot> => {
      const overview = await service.overview({});
      const ids = [...new Set(overview.priorities.flatMap((priority) => priority.objectives).map((objective) => objective.assigneeThreadId).filter((id): id is string => id !== null))];
      return { ...overview, orgs: await orgsFor(bb, ids) };
    },
    addPriority: (input) => outcome(() => service.addPriority(input)),
    editPriority: (input) => outcome(() => service.editPriority(input)),
    addObjective: (input) => outcome(() => service.addObjective(input)),
    editObjective: (input) => outcome(() => service.editObjective(input)),
    approveObjective: (input) => outcome(() => service.approveObjective(input)),
    assignObjective: (input) => outcome(() => service.assignObjective(input)),
    addInvestment: (input) => outcome(() => service.addInvestment(input)),
    editInvestment: (input) => outcome(() => service.editInvestment(input)),
    startInvestment: (input) => outcome(() => starts.start(input)),
    searchThreads: async ({ query }) => ({ threads: await searchThreads(bb, query) }),
    openRecord: (input) => service.setOpenRecord(input),
  });

  bb.agents.registerTool({
    name: "plan",
    description: "Read and change the shared Plan: company priorities, their objectives, and each objective's investments (its portfolio). Same records and validation as `bb plan` and the Plan panel.",
    instructions: INSTRUCTIONS,
    presentation: { label: { pending: "Updating the plan", completed: "Updated the plan" } },
    parameters: toolParameters,
    async execute(params, ctx) {
      const { action, input } = toolInput(params);
      try {
        return JSON.stringify(await ACTIONS[action](services, input, ctx.threadId));
      } catch (error) {
        return { content: [{ type: "text", text: JSON.stringify({ ok: false, error: errorBody(error) }) }], isError: true };
      }
    },
  });

  const json = { type: "boolean", description: "Print the result as JSON" } as const;
  const expectedRevision = { type: "integer", min: 1, max: Number.MAX_SAFE_INTEGER, required: true, description: "The revision you last read; a newer edit rejects yours" } as const;
  const id = (what: string) => [{ name: "id", required: true, description: `${what} ID` }] as const;
  const briefOptions = {
    deliverable: { type: "string", description: "What the team hands back" },
    scope: { type: "string", description: "What the work covers and excludes" },
    "acceptance-criteria": { type: "string", description: "How the deliverable is accepted" },
    measurement: { type: "string", description: "How the change is measured" },
    source: { type: "string", repeatable: true, description: "A source link or reference; repeat for more" },
  } as const;
  const priorityFields = {
    metric: { type: "string", description: "Metric name from Analytics' shared definitions" },
    baseline: { type: "string", placeholder: "NUMBER", description: "Value at the start" },
    now: { type: "string", placeholder: "NUMBER", description: "Value now" },
    target: { type: "string", placeholder: "NUMBER", description: "Target value" },
    by: { type: "string", placeholder: "YYYY-MM-DD", description: "Target date" },
    constraints: { type: "string", description: "Constraints the plan must respect" },
  } as const;
  const briefFrom = (options: { deliverable?: string; scope?: string; "acceptance-criteria"?: string; measurement?: string; source?: string[] }) => defined({
    deliverable: options.deliverable,
    scope: options.scope,
    acceptanceCriteria: options["acceptance-criteria"],
    measurement: options.measurement,
    sources: options.source?.length ? options.source : undefined,
  });
  const priorityValues = (options: { metric?: string; baseline?: string; now?: string; target?: string; by?: string; constraints?: string }) => defined({
    metric: options.metric,
    baseline: numberOption(options.baseline, "baseline"),
    now: numberOption(options.now, "now"),
    target: numberOption(options.target, "target"),
    by: options.by,
    constraints: options.constraints,
  });

  bb.cli.register(defineCli({
    name: "plan",
    summary: "Plan company priorities, objectives and investment portfolios shared with the Plan panel",
    commands: {
      show: cliCommand({
        summary: "Show the whole plan: priorities, their objectives and investments",
        options: { json },
        run: ({ options }) => guard(async () => {
          const overview = await service.overview({});
          return output(options.json, overview, () => overviewText(overview));
        }),
      }),
      "priority add": cliCommand({
        summary: "Add a company priority; other fields can be filled in later",
        positionals: [{ name: "name", required: true, description: "The outcome, like \"Grow weekly active users\"" }],
        options: { ...priorityFields, json },
        run: ({ positionals, options }) => guard(async () => {
          const priority = await service.addPriority({ name: positionals.name, ...priorityValues(options) });
          return output(options.json, priority, () => priorityLine(priority));
        }),
      }),
      "priority edit": cliCommand({
        summary: "Edit a company priority",
        positionals: id("Priority"),
        options: {
          name: { type: "string", description: "New outcome name" },
          ...priorityFields,
          clear: { type: "enum", values: PRIORITY_CLEARABLE, repeatable: true, split: ",", description: "Clear these fields" },
          "expected-revision": expectedRevision,
          json,
        },
        run: ({ positionals, options }) => guard(async () => {
          const priority = await service.editPriority({
            id: positionals.id,
            expectedRevision: options["expected-revision"],
            ...defined({ name: options.name }),
            ...priorityValues(options),
            ...Object.fromEntries((options.clear ?? []).map((field) => [field, null])),
          });
          return output(options.json, priority, () => priorityLine(priority));
        }),
      }),
      "priority list": cliCommand({
        summary: "List company priorities",
        options: { json },
        run: ({ options }) => guard(async () => {
          const priorities = await service.listPriorities({});
          return output(options.json, { priorities }, () => (priorities.length ? priorities.map(priorityLine).join("\n") : "No company priorities yet."));
        }),
      }),
      "priority show": cliCommand({
        summary: "Show a company priority with its objectives",
        positionals: id("Priority"),
        options: { json },
        run: ({ positionals, options }) => guard(async () => {
          const priority = await service.showPriority({ id: positionals.id });
          return output(options.json, priority, () => priorityDetail(priority));
        }),
      }),
      "objective add": cliCommand({
        summary: "Add an objective under a company priority",
        positionals: [
          { name: "priorityId", required: true, description: "Parent priority ID" },
          { name: "name", required: true, description: "Objective name" },
        ],
        options: {
          proposed: { type: "boolean", description: "An agent's proposal; it stays unapproved until adopted" },
          assign: { type: "string", placeholder: "THREAD_ID", description: "Existing org or team thread ID to assign" },
          json,
        },
        run: ({ positionals, options }) => guard(async () => {
          const objective = await service.addObjective({
            priorityId: positionals.priorityId,
            name: positionals.name,
            ...defined({ proposed: options.proposed || undefined, assigneeThreadId: options.assign }),
          });
          return output(options.json, objective, () => objectiveLine(objective));
        }),
      }),
      "objective edit": cliCommand({
        summary: "Rename an objective or move it under another priority",
        positionals: id("Objective"),
        options: {
          name: { type: "string", description: "New name" },
          priority: { type: "string", placeholder: "PRIORITY_ID", description: "Move under this priority" },
          "expected-revision": expectedRevision,
          json,
        },
        run: ({ positionals, options }) => guard(async () => {
          const objective = await service.editObjective({
            id: positionals.id,
            expectedRevision: options["expected-revision"],
            ...defined({ name: options.name, priorityId: options.priority }),
          });
          return output(options.json, objective, () => objectiveLine(objective));
        }),
      }),
      "objective approve": cliCommand({
        summary: "Adopt a proposed objective",
        positionals: id("Objective"),
        options: { "expected-revision": expectedRevision, json },
        run: ({ positionals, options }) => guard(async () => {
          const objective = await service.approveObjective({ id: positionals.id, expectedRevision: options["expected-revision"] });
          return output(options.json, objective, () => objectiveLine(objective));
        }),
      }),
      "objective assign": cliCommand({
        summary: "Assign an objective to an existing org or team thread; sends nothing",
        positionals: id("Objective"),
        options: {
          thread: { type: "string", placeholder: "THREAD_ID", description: "The org or team thread's ID" },
          unassign: { type: "boolean", description: "Remove the assignment" },
          "expected-revision": expectedRevision,
          json,
        },
        constraints: [{ kind: "exactly-one", options: ["thread", "unassign"] }],
        run: ({ positionals, options }) => guard(async () => {
          const objective = await service.assignObjective({
            id: positionals.id,
            expectedRevision: options["expected-revision"],
            assigneeThreadId: options.unassign ? null : options.thread,
          });
          return output(options.json, objective, () => objectiveLine(objective));
        }),
      }),
      "objective show": cliCommand({
        summary: "Show an objective with its assigned thread and portfolio",
        positionals: id("Objective"),
        options: { json },
        run: ({ positionals, options }) => guard(async () => {
          const objective = await service.showObjective({ id: positionals.id });
          return output(options.json, objective, () => objectiveDetail(objective));
        }),
      }),
      "investment add": cliCommand({
        summary: "Add an investment to an objective's portfolio",
        positionals: [
          { name: "objectiveId", required: true, description: "Parent objective ID" },
          { name: "name", required: true, description: "The change" },
        ],
        options: { existing: { type: "boolean", description: "Already-running activity rather than new work" }, ...briefOptions, json },
        run: ({ positionals, options }) => guard(async () => {
          const brief = briefFrom(options);
          const investment = await service.addInvestment({
            objectiveId: positionals.objectiveId,
            name: positionals.name,
            ...defined({ existing: options.existing || undefined, brief: Object.keys(brief).length ? brief : undefined }),
          });
          return output(options.json, investment, () => investmentLine(investment));
        }),
      }),
      "investment edit": cliCommand({
        summary: "Edit an investment's name, existing flag or brief; lift and state are not editable",
        positionals: id("Investment"),
        options: {
          name: { type: "string", description: "New name" },
          existing: { type: "enum", values: ["yes", "no"], description: "Whether it is already-running activity" },
          ...briefOptions,
          clear: { type: "enum", values: BRIEF_CLEARABLE, repeatable: true, split: ",", description: "Clear these brief fields" },
          "expected-revision": expectedRevision,
          json,
        },
        run: ({ positionals, options }) => guard(async () => {
          const brief = briefFrom(options);
          for (const field of options.clear ?? []) brief[BRIEF_KEYS[field]] = null;
          const investment = await service.editInvestment({
            id: positionals.id,
            expectedRevision: options["expected-revision"],
            ...defined({
              name: options.name,
              existing: options.existing === undefined ? undefined : options.existing === "yes",
              brief: Object.keys(brief).length ? brief : undefined,
            }),
          });
          return output(options.json, investment, () => investmentDetail(investment));
        }),
      }),
      "investment start": cliCommand({
        summary: "Send an investment's saved brief to its objective's team thread and mark it In progress; one per team at a time",
        options: { id: { type: "string", required: true, placeholder: "INVESTMENT_ID", description: "The investment to start" }, json },
        run: ({ options }) => guard(async () => {
          const investment = await starts.start({ id: options.id });
          return output(options.json, investment, () => investmentLine(investment));
        }),
      }),
      "investment deliver": cliCommand({
        summary: "From the team thread or one of its workers: report the deliverable against every acceptance criterion; marks it Done",
        options: {
          id: { type: "string", required: true, placeholder: "INVESTMENT_ID", description: "The investment you delivered" },
          output: { type: "string", required: true, placeholder: "JSON_OR_PATH", description: `The delivery as JSON, or a path to a JSON file: ${OUTPUT_SHAPE}` },
          json,
        },
        run: ({ options }, ctx) => guard(async () => {
          const investment = await starts.deliver({ id: options.id, output: await readOutputOption(options.output, ctx.cwd) }, ctx.threadId ?? null);
          return output(options.json, investment, () => investmentLine(investment));
        }),
      }),
      "research list": cliCommand({
        summary: "List research requests with their phase, threads and submissions",
        options: {
          status: { type: "enum", values: RESEARCH_STATUSES, description: "Only pending or claimed requests" },
          kind: { type: "enum", values: RESEARCH_KINDS, description: "Only this kind of request" },
          phase: { type: "enum", values: RESEARCH_PHASES, description: "Only requests in this research phase" },
          json,
        },
        run: ({ options }) => guard(async () => {
          const requests = await research.list(defined({ status: options.status, kind: options.kind, phase: options.phase }));
          return output(options.json, { requests }, () => (requests.length ? requests.map(researchLine).join("\n") : "No research requests."));
        }),
      }),
      "research show": cliCommand({
        summary: "Show one research request; submissions are revealed only after both are saved",
        positionals: [{ name: "requestId", required: true, description: "Research request ID (rr_…)" }],
        options: { json },
        run: ({ positionals, options }) => guard(async () => {
          const job = await research.show({ requestId: positionals.requestId });
          return output(options.json, job, () => researchLine(job));
        }),
      }),
      "research submit": cliCommand({
        summary: "Submit one independent research result for slot a or b; it is validated and saved once",
        options: {
          request: { type: "string", required: true, placeholder: "REQUEST_ID", description: "Research request ID (rr_…)" },
          slot: { type: "enum", values: SLOTS, required: true, description: "Your research slot" },
          file: { type: "string", placeholder: "PATH", description: "JSON submission file, resolved from your working directory" },
          data: { type: "string", placeholder: "JSON", stdin: true, description: "JSON submission; use --data-stdin to pipe it" },
          json,
        },
        constraints: [{ kind: "exactly-one", options: ["file", "data"] }],
        run: ({ options }, ctx) => guard(async () => {
          const submission = await readPayload(options, ctx.cwd);
          const result = await research.submit({ requestId: options.request, slot: options.slot, submission }, ctx.threadId ?? null);
          return output(options.json, result, () => `Accepted slot ${result.slot} for ${result.requestId}. ${result.next}`);
        }),
      }),
      "research reconcile": cliCommand({
        summary: "Submit the reconciliation of both research submissions; a valid one publishes to the Plan",
        options: {
          request: { type: "string", required: true, placeholder: "REQUEST_ID", description: "Research request ID (rr_…)" },
          file: { type: "string", placeholder: "PATH", description: "JSON reconciliation file, resolved from your working directory" },
          data: { type: "string", placeholder: "JSON", stdin: true, description: "JSON reconciliation; use --data-stdin to pipe it" },
          json,
        },
        constraints: [{ kind: "exactly-one", options: ["file", "data"] }],
        run: ({ options }, ctx) => guard(async () => {
          const reconciliation = await readPayload(options, ctx.cwd);
          const result = await research.reconcile({ requestId: options.request, reconciliation }, ctx.threadId ?? null);
          return output(options.json, result, () => `${result.requestId}: ${result.summary}`);
        }),
      }),
      "research rerun": cliCommand({
        summary: "From an edit assessment: rerun portfolio research for the affected objectives",
        options: {
          request: { type: "string", required: true, placeholder: "REQUEST_ID", description: "The edit assessment's request ID (rr_…)" },
          objective: { type: "string", repeatable: true, placeholder: "OBJECTIVE_ID", description: "An affected objective; repeat for more" },
          reason: { type: "string", required: true, description: "How the edit can change lift" },
          json,
        },
        run: ({ options }, ctx) => guard(async () => {
          const result = await research.rerun({ requestId: options.request, objectiveIds: options.objective ?? [], reason: options.reason }, ctx.threadId ?? null);
          return output(options.json, result, () => `Rerunning research: ${result.refreshRequests.join(", ")}`);
        }),
      }),
      "research close": cliCommand({
        summary: "From an edit assessment: close it with no research impact",
        options: {
          request: { type: "string", required: true, placeholder: "REQUEST_ID", description: "The edit assessment's request ID (rr_…)" },
          reason: { type: "string", required: true, description: "Why the edit can't change any lift" },
          json,
        },
        run: ({ options }, ctx) => guard(async () => {
          const result = await research.close({ requestId: options.request, reason: options.reason }, ctx.threadId ?? null);
          return output(options.json, result, () => `${result.requestId}: no research impact.`);
        }),
      }),
      "investment show": cliCommand({
        summary: "Show an investment with its brief, lift and state",
        positionals: id("Investment"),
        options: { json },
        run: ({ positionals, options }) => guard(async () => {
          const investment = await service.showInvestment({ id: positionals.id });
          return output(options.json, investment, () => investmentDetail(investment));
        }),
      }),
    },
  }));
}
