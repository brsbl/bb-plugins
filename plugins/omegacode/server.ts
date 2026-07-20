// bb-plugin-omega — omegacode command center.
//
// Reads omegacode's on-disk run journals and exposes them to a collapsible
// banner in the composer. omegacode runs on this machine and writes to
// ~/.omegacode/runs, so node:fs is the correct reader (server-local data).
import { defineRpcContract, type BbPluginApi } from "@bb/plugin-sdk";
import { z } from "zod";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import {
  readBbRunOwner,
  runBelongsToScope,
  type ThreadRunScope,
} from "./ownership";

const RUNS_DIR = join(homedir(), ".omegacode", "runs");

const AgentSchema = z.object({
  index: z.number(),
  label: z.string(),
  phase: z.string().nullable(),
  provider: z.string().nullable(),
  model: z.string().nullable(),
  state: z.string(),
  startedAt: z.number().nullable(),
  bytes: z.number(),
  tokens: z.number(),
  durationMs: z.number(),
});

const RunSchema = z.object({
  runId: z.string(),
  workflow: z.string().nullable(),
  workflowName: z.string().nullable(),
  description: z.string().nullable(),
  phases: z.array(z.string()),
  createdAt: z.number().nullable(),
  status: z.string(),
  updatedAt: z.number().nullable(),
  heartbeatAgeMs: z.number().nullable(),
  counts: z.object({
    total: z.number(),
    running: z.number(),
    queued: z.number(),
    completed: z.number(),
    failed: z.number(),
    cancelled: z.number(),
  }),
  agents: z.array(AgentSchema),
});

export const GlobalRunSchema = RunSchema.extend({
  owner: z
    .object({
      threadId: z.string(),
      environmentId: z.string(),
      projectId: z.string().nullable(),
      threadTitle: z.string().nullable(),
      threadAvailable: z.boolean(),
    })
    .nullable(),
});

export type Run = z.infer<typeof RunSchema>;
export type GlobalRun = z.infer<typeof GlobalRunSchema>;

export const rpcContract = defineRpcContract({
  runs: {
    input: z.object({ threadId: z.string().min(1) }).strict(),
    output: z.object({ runs: z.array(RunSchema), scannedAt: z.number() }),
  },
  allRuns: {
    input: z.object({}).strict(),
    output: z.object({ runs: z.array(GlobalRunSchema), scannedAt: z.number() }),
  },
});

export function parseJsonl(contents: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const line of contents.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    // A live run may be mid-write; a torn trailing line is expected, not an error.
    try {
      const value: unknown = JSON.parse(t);
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        out.push(value as Record<string, unknown>);
      }
    } catch {
      /* skip partial line */
    }
  }
  return out;
}

function readJsonl(path: string): Record<string, unknown>[] {
  return existsSync(path) ? parseJsonl(readFileSync(path, "utf8")) : [];
}

function safeSize(path: string): number {
  try {
    return existsSync(path) ? statSync(path).size : 0;
  } catch {
    return 0;
  }
}

function safeMtime(p: string): number {
  try {
    return statSync(p).mtimeMs;
  } catch {
    return 0;
  }
}

// The workflow's clean meta.name (e.g. "rubric-sweep") lives in the .js file,
// not the run journal. Read it once per file so the UI shows the NAME instead
// of blasting the raw filename everywhere. Cache to avoid re-reading each poll.
type WorkflowDetails = { name: string | null; description: string | null };

function stringField(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

export function workflowDetailsFromSource(source: string): WorkflowDetails {
  const fields = new Map<string, string>();
  for (const match of source.matchAll(/\b(name|description)\s*:\s*(['"`])([^'"`]+)\2/g)) {
    fields.set(match[1], match[3]);
  }
  return {
    name: stringField(fields.get("name")),
    description: stringField(fields.get("description")),
  };
}

// Workflow meta is a durable, source-authored fallback. Launchers may include
// a run-specific `description` in the journal meta record, which wins below.
const workflowDetailsCache = new Map<
  string,
  { mtime: number; value: WorkflowDetails }
>();
function workflowDetails(file: string | undefined): WorkflowDetails {
  if (!file || !existsSync(file)) return { name: null, description: null };
  const mtime = safeMtime(file);
  const hit = workflowDetailsCache.get(file);
  if (hit && hit.mtime === mtime) return hit.value;
  let value: WorkflowDetails = { name: null, description: null };
  try {
    const src = readFileSync(file, "utf8").slice(0, 2000);
    value = workflowDetailsFromSource(src);
  } catch {
    value = { name: null, description: null };
  }
  workflowDetailsCache.set(file, { mtime, value });
  return value;
}

export function phaseTitlesFromEvents(
  events: readonly Record<string, unknown>[],
): string[] {
  const phaseTitles = new Map<number, string>();
  for (const event of events) {
    if (event.type !== "phase" || typeof event.index !== "number") continue;
    if (typeof event.title === "string" && event.title.trim() !== "") {
      phaseTitles.set(event.index, event.title.trim());
    }
  }
  return [...phaseTitles.entries()]
    .sort(([left], [right]) => left - right)
    .map(([, title]) => title);
}

export function deriveRunStatus({
  eventStatus,
  counts,
  heartbeatAgeMs,
}: {
  eventStatus: string | null;
  counts: { total: number; running: number; queued: number; failed: number; cancelled: number };
  heartbeatAgeMs: number | null;
}): string {
  const terminalStatus = /fail|error/i.test(eventStatus ?? "")
    ? "failed"
    : /cancel|interrupt|stopp?ed/i.test(eventStatus ?? "")
      ? "cancelled"
      : /complete|done|success/i.test(eventStatus ?? "")
        ? "completed"
        : null;
  if (terminalStatus) return terminalStatus;
  if (counts.total > 0 && counts.running === 0 && counts.queued === 0) {
    if (counts.failed > 0) return "failed";
    if (counts.cancelled > 0) return "cancelled";
    return "completed";
  }
  if (heartbeatAgeMs !== null && heartbeatAgeMs > 120_000) return "stalled";
  return counts.total > 0 ? "running" : "starting";
}

function readRun(runId: string) {
  const dir = join(RUNS_DIR, runId);
  const eventsPath = join(dir, "events.jsonl");
  const journalPath = join(dir, "journal.jsonl");
  const heartbeatPath = join(dir, ".heartbeat");
  const events = readJsonl(eventsPath);
  const journal = readJsonl(journalPath);

  const meta = journal.find((r) => r.type === "meta") ?? {};
  const workflowFile = typeof meta.workflowFile === "string" ? meta.workflowFile : undefined;
  const workflow = workflowFile ? (workflowFile.split("/").pop() ?? null) : null;
  const details = workflowDetails(workflowFile);
  const description = stringField(meta.description) ?? details.description;

  const phases = phaseTitlesFromEvents(events);

  // Last event per agent index wins — that is its current state.
  const byIndex = new Map<number, Record<string, unknown>>();
  for (const e of events) {
    if (e.type !== "agent") continue;
    const idx = typeof e.index === "number" ? e.index : null;
    if (idx == null) continue;
    byIndex.set(idx, { ...(byIndex.get(idx) ?? {}), ...e });
  }
  // Journal `result` records are authoritative for terminal state.
  for (const j of journal) {
    if (j.type !== "result") continue;
    const idx = typeof j.index === "number" ? j.index : null;
    if (idx == null) continue;
    const usage =
      typeof j.usage === "object" && j.usage !== null
        ? (j.usage as Record<string, unknown>)
        : {};
    const inputTokens =
      typeof usage.inputTokens === "number" ? usage.inputTokens : 0;
    const outputTokens =
      typeof usage.outputTokens === "number" ? usage.outputTokens : 0;
    byIndex.set(idx, {
      ...(byIndex.get(idx) ?? {}),
      state: String(j.status ?? "completed"),
      tokens: inputTokens + outputTokens,
      durationMs: typeof j.durationMs === "number" ? j.durationMs : 0,
    });
  }

  const agents = [...byIndex.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([index, e]) => {
      const state = String(e.state ?? "unknown");
      const startedAt =
        typeof e.startedAt === "number" ? e.startedAt : null;
      return {
        index,
        label: String(e.label ?? `agent ${index}`),
        phase: e.phaseTitle == null ? null : String(e.phaseTitle),
        provider: e.provider == null ? null : String(e.provider),
        model: e.model == null ? null : String(e.model),
        state,
        startedAt,
        // Growing log bytes is the cheapest liveness signal: a spinning worker that
        // produces nothing shows a frozen size — exactly how a hung provider was
        // caught during the rubric sweep.
        bytes: safeSize(join(dir, "agents", `${index}.jsonl`)),
        tokens: typeof e.tokens === "number" ? e.tokens : 0,
        durationMs:
          state === "running" && startedAt !== null
            ? Math.max(0, Date.now() - startedAt)
            : typeof e.durationMs === "number"
              ? e.durationMs
              : 0,
      };
    });

  const counts = {
    total: agents.length,
    running: agents.filter((a) => a.state === "running").length,
    queued: agents.filter((a) => /^(queued|pending)$/i.test(a.state)).length,
    completed: agents.filter((a) => /^(completed|done|success|skipped)$/i.test(a.state))
      .length,
    failed: agents.filter((a) => /fail|error/i.test(a.state)).length,
    cancelled: agents.filter((a) => /cancel|interrupt|stopp?ed/i.test(a.state))
      .length,
  };

  let heartbeatAgeMs: number | null = null;
  try {
    if (existsSync(heartbeatPath)) {
      heartbeatAgeMs = Date.now() - statSync(heartbeatPath).mtimeMs;
    }
  } catch {
    heartbeatAgeMs = null;
  }

  const runEvent = [...events]
    .reverse()
    .find((event) => event.type === "run" && typeof event.status === "string");
  const eventStatus = typeof runEvent?.status === "string" ? runEvent.status : null;
  const status = deriveRunStatus({ eventStatus, counts, heartbeatAgeMs });

  return {
    runId,
    workflow,
    workflowName: details.name,
    description,
    phases,
    createdAt:
      typeof meta.createdAt === "number" ? meta.createdAt : safeMtime(dir) || null,
    status,
    updatedAt:
      Math.max(
        safeMtime(dir),
        safeMtime(eventsPath),
        safeMtime(journalPath),
        safeMtime(heartbeatPath),
      ) || null,
    heartbeatAgeMs,
    counts,
    agents,
    owner: readBbRunOwner(meta),
    workflowFile: workflowFile ?? null,
  };
}

function scanRuns(limit?: number) {
  if (!existsSync(RUNS_DIR)) return [];
  const directories = readdirSync(RUNS_DIR)
    .filter((d) => d.startsWith("wf_"))
    .map((d) => ({ d, m: safeMtime(join(RUNS_DIR, d)) }))
    .sort((a, b) => b.m - a.m);
  return (limit === undefined ? directories : directories.slice(0, limit))
    .map((x) => readRun(x.d));
}

async function resolveThreadScope(
  bb: BbPluginApi,
  threadId: string,
): Promise<ThreadRunScope | null> {
  try {
    const thread = await bb.sdk.threads.get({ threadId });
    if (!thread.environmentId) return null;
    return {
      threadId,
      environmentId: thread.environmentId,
    };
  } catch (error) {
    bb.log.warn(`could not resolve Omegacode run owner for ${threadId}: ${String(error)}`);
    return null;
  }
}

export function isVisibleRun(run: {
  heartbeatAgeMs: number | null;
  counts: { running: number };
}): boolean {
  const heartbeat = run.heartbeatAgeMs;
  if (heartbeat == null) return false;
  if (heartbeat < 30_000) return true;
  return heartbeat < 300_000 && run.counts.running > 0;
}

function publicRun(run: ReturnType<typeof readRun>) {
  const { owner: _owner, workflowFile: _workflowFile, ...visible } = run;
  return visible;
}

type ThreadLabel = { title: string | null; available: boolean };

const threadLabelCache = new Map<
  string,
  { expiresAt: number; value: ThreadLabel }
>();

async function resolveThreadLabel(
  bb: BbPluginApi,
  threadId: string,
): Promise<ThreadLabel> {
  const cached = threadLabelCache.get(threadId);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  let value: ThreadLabel;
  try {
    const thread = await bb.sdk.threads.get({
      threadId,
      signal: AbortSignal.timeout(5_000),
    });
    value = {
      title: thread.title ?? thread.titleFallback ?? null,
      available: true,
    };
  } catch {
    value = { title: null, available: false };
  }
  threadLabelCache.set(threadId, {
    expiresAt: Date.now() + 60_000,
    value,
  });
  return value;
}

async function publicGlobalRuns(
  bb: BbPluginApi,
  runs: ReturnType<typeof scanRuns>,
) {
  const labels = new Map<string, ThreadLabel>();
  const threadIds = [
    ...new Set(
      runs
        .map((run) => run.owner?.threadId)
        .filter((threadId): threadId is string => threadId !== undefined),
    ),
  ];
  await Promise.all(
    threadIds.map(async (threadId) => {
      labels.set(threadId, await resolveThreadLabel(bb, threadId));
    }),
  );

  return runs.map((run) => {
    const visible = publicRun(run);
    if (!run.owner) return { ...visible, owner: null };
    const label = labels.get(run.owner.threadId) ?? {
      title: null,
      available: false,
    };
    return {
      ...visible,
      owner: {
        ...run.owner,
        threadTitle: label.title,
        threadAvailable: label.available,
      },
    };
  });
}

export default async function plugin(bb: BbPluginApi) {
  bb.rpc.register(rpcContract, {
    async runs({ threadId }) {
      const scope = await resolveThreadScope(bb, threadId);
      const runs = scope
        ? scanRuns()
            .filter((run) => runBelongsToScope(run, scope))
            .filter(isVisibleRun)
            .slice(0, 6)
            .map(publicRun)
        : [];
      return { runs, scannedAt: Date.now() };
    },
    async allRuns() {
      return {
        runs: await publicGlobalRuns(bb, scanRuns()),
        scannedAt: Date.now(),
      };
    },
  });

  // Poll the journals and signal the frontend only when something changed, so an
  // idle machine costs nothing while a live sweep refreshes within ~2.5s.
  bb.background.service("watch", {
    async start(signal) {
      let last = "";
      while (!signal.aborted) {
        try {
          const fingerprint = scanRuns()
            .filter(isVisibleRun)
            .map(
              (r) =>
                `${r.runId}:${r.status}:${r.counts.running}/${r.counts.queued}/${r.counts.completed}/${r.counts.failed}/${r.counts.cancelled}:${r.agents
                  .map(
                    (agent) =>
                      `${agent.index}:${agent.state}:${agent.bytes}:${agent.tokens}`,
                  )
                  .join(",")}`,
            )
            .join("|");
          if (fingerprint !== last) {
            last = fingerprint;
            bb.realtime.publish("omegacode", { changedAt: Date.now() });
          }
        } catch (err) {
          bb.log.warn(`Omegacode watch: ${String(err)}`);
        }
        await new Promise((r) => setTimeout(r, 2500));
      }
    },
  });

  bb.cli.register({
    name: "omegacode",
    summary: "Omegacode workflow status",
    commands: [
      {
        name: "status",
        summary: "Show Omegacode runs owned by this bb thread",
        usage: "bb omegacode status [--all]",
      },
    ],
    async run(argv, ctx) {
      const showAll = argv.includes("--all") || !ctx.threadId;
      const scope = !showAll && ctx.threadId
        ? await resolveThreadScope(bb, ctx.threadId)
        : null;
      const runs = scanRuns().filter((run) =>
        showAll ? true : scope ? runBelongsToScope(run, scope) : false,
      );
      if (!runs.length) {
        return {
          exitCode: 0,
          stdout: showAll
            ? "no Omegacode runs found\n"
            : "no Omegacode runs found for this thread\n",
        };
      }
      const lines = runs.map((r) => {
        const c = r.counts;
        return `${r.runId}  ${r.status.padEnd(9)}  ${c.running} running / ${c.queued} queued / ${c.completed} done / ${c.failed} failed / ${c.cancelled} cancelled  (${r.workflow ?? "?"})`;
      });
      return { exitCode: 0, stdout: `${lines.join("\n")}\n` };
    },
  });

  bb.log.info(`Omegacode command center ready (${RUNS_DIR})`);
}
