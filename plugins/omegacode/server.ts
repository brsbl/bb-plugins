// bb-plugin-omega — omegacode command center.
//
// Reads omegacode's on-disk run journals and exposes them to a collapsible
// banner in the composer. omegacode runs on this machine and writes to
// ~/.omegacode/runs, so node:fs is the correct reader (server-local data).
import { defineRpcContract, type BbPluginApi } from "@bb/plugin-sdk";
import { z } from "zod";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join, relative } from "node:path";
import {
  inferThreadRunScope,
  readBbRunOwner,
  runBelongsToScope,
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

type FileStamp = { mtimeMs: number; size: number };

function safeFileStamp(path: string): FileStamp | null {
  try {
    const stat = statSync(path);
    return { mtimeMs: stat.mtimeMs, size: stat.size };
  } catch {
    return null;
  }
}

function sameFileStamp(left: FileStamp | null, right: FileStamp | null): boolean {
  return left?.mtimeMs === right?.mtimeMs && left?.size === right?.size;
}

const jsonlCache = new Map<
  string,
  { stamp: FileStamp; records: Record<string, unknown>[] }
>();

function readJsonlWithStamp(
  path: string,
  stamp: FileStamp | null,
): Record<string, unknown>[] {
  if (!stamp) {
    jsonlCache.delete(path);
    return [];
  }
  const cached = jsonlCache.get(path);
  if (cached && sameFileStamp(cached.stamp, stamp)) return cached.records;
  const records = parseJsonl(readFileSync(path, "utf8"));
  jsonlCache.set(path, { stamp, records });
  return records;
}

export function readJsonl(path: string): Record<string, unknown>[] {
  return readJsonlWithStamp(path, safeFileStamp(path));
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
  const fieldPattern =
    /\b(name|description)\s*:\s*(?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'|`((?:\\.|[^`\\])*)`)/g;
  for (const match of source.matchAll(fieldPattern)) {
    const literal = match[2] ?? match[3] ?? match[4] ?? "";
    fields.set(match[1], literal.replace(/\\([\\'"`])/g, "$1"));
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

function parseRun(
  runId: string,
  eventsStamp: FileStamp | null,
  journalStamp: FileStamp | null,
) {
  const dir = join(RUNS_DIR, runId);
  const eventsPath = join(dir, "events.jsonl");
  const journalPath = join(dir, "journal.jsonl");
  const events = readJsonlWithStamp(eventsPath, eventsStamp);
  const journal = readJsonlWithStamp(journalPath, journalStamp);

  const meta = journal.find((r) => r.type === "meta") ?? {};
  const workflowFile = typeof meta.workflowFile === "string" ? meta.workflowFile : undefined;
  const workflow = workflowFile ? (workflowFile.split("/").pop() ?? null) : null;
  const journalDescription = stringField(meta.description);

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
        durationMs: typeof e.durationMs === "number" ? e.durationMs : 0,
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

  const runEvent = [...events]
    .reverse()
    .find((event) => event.type === "run" && typeof event.status === "string");
  const eventStatus = typeof runEvent?.status === "string" ? runEvent.status : null;

  return {
    base: {
      runId,
      workflow,
      phases,
      createdAt:
        typeof meta.createdAt === "number" ? meta.createdAt : safeMtime(dir) || null,
      counts,
      agents,
      owner: readBbRunOwner(meta),
      workflowFile: workflowFile ?? null,
      journalDescription,
    },
    eventStatus,
  };
}

type ParsedRun = ReturnType<typeof parseRun>;
const runCache = new Map<
  string,
  {
    eventsStamp: FileStamp | null;
    journalStamp: FileStamp | null;
    parsed: ParsedRun;
  }
>();

function readRun(runId: string) {
  const dir = join(RUNS_DIR, runId);
  const eventsPath = join(dir, "events.jsonl");
  const journalPath = join(dir, "journal.jsonl");
  const heartbeatPath = join(dir, ".heartbeat");
  const eventsStamp = safeFileStamp(eventsPath);
  const journalStamp = safeFileStamp(journalPath);
  const cached = runCache.get(runId);
  const parsed =
    cached &&
    sameFileStamp(cached.eventsStamp, eventsStamp) &&
    sameFileStamp(cached.journalStamp, journalStamp)
      ? cached.parsed
      : parseRun(runId, eventsStamp, journalStamp);
  if (parsed !== cached?.parsed) {
    runCache.set(runId, { eventsStamp, journalStamp, parsed });
  }

  const heartbeatStamp = safeFileStamp(heartbeatPath);
  const now = Date.now();
  const heartbeatAgeMs = heartbeatStamp
    ? Math.max(0, now - heartbeatStamp.mtimeMs)
    : null;
  const agents = parsed.base.agents.map((agent) => ({
    ...agent,
    bytes: safeSize(join(dir, "agents", `${agent.index}.jsonl`)),
    durationMs:
      agent.state === "running" && agent.startedAt !== null
        ? Math.max(0, now - agent.startedAt)
        : agent.durationMs,
  }));
  const status = deriveRunStatus({
    eventStatus: parsed.eventStatus,
    counts: parsed.base.counts,
    heartbeatAgeMs,
  });
  const details = workflowDetails(parsed.base.workflowFile ?? undefined);

  return {
    ...parsed.base,
    workflowName: details.name,
    description: parsed.base.journalDescription ?? details.description,
    status,
    updatedAt:
      Math.max(
        safeMtime(dir),
        eventsStamp?.mtimeMs ?? 0,
        journalStamp?.mtimeMs ?? 0,
        heartbeatStamp?.mtimeMs ?? 0,
      ) || null,
    heartbeatAgeMs,
    agents,
  };
}

export function pruneRunCaches(
  liveRunIds: ReadonlySet<string>,
  runsDirectory = RUNS_DIR,
): void {
  for (const runId of runCache.keys()) {
    if (!liveRunIds.has(runId)) runCache.delete(runId);
  }
  for (const path of jsonlCache.keys()) {
    const parts = relative(runsDirectory, path).split(/[\\/]/);
    if (
      parts.length === 2 &&
      parts[0]?.startsWith("wf_") &&
      !liveRunIds.has(parts[0]) &&
      (parts[1] === "events.jsonl" || parts[1] === "journal.jsonl")
    ) {
      jsonlCache.delete(path);
    }
  }
}

function scanRuns(limit?: number) {
  if (!existsSync(RUNS_DIR)) return [];
  const directories = readdirSync(RUNS_DIR)
    .filter((d) => d.startsWith("wf_"))
    .map((d) => ({ d, m: safeMtime(join(RUNS_DIR, d)) }))
    .sort((a, b) => b.m - a.m);
  const liveRunIds = new Set(directories.map(({ d }) => d));
  pruneRunCaches(liveRunIds);
  return (limit === undefined ? directories : directories.slice(0, limit))
    .map((x) => readRun(x.d));
}

function safeDirectoryEntries(path: string): string[] {
  try {
    return readdirSync(path);
  } catch {
    return [];
  }
}

function stampFingerprint(path: string): string {
  const stamp = safeFileStamp(path);
  return stamp ? `${stamp.mtimeMs}:${stamp.size}` : "-";
}

/**
 * Cheap watcher input: file names and stat stamps only. RPC reads still do the
 * full cached journal hydration, but the 2.5-second background tick never does.
 */
export function journalCorpusFingerprint(
  runsDirectory = RUNS_DIR,
): string {
  return safeDirectoryEntries(runsDirectory)
    .filter((runId) => runId.startsWith("wf_"))
    .sort()
    .map((runId) => {
      const runDirectory = join(runsDirectory, runId);
      const agentDirectory = join(runDirectory, "agents");
      const agents = safeDirectoryEntries(agentDirectory)
        .filter((name) => name.endsWith(".jsonl"))
        .sort()
        .map((name) => `${name}@${stampFingerprint(join(agentDirectory, name))}`)
        .join(",");
      return [
        runId,
        stampFingerprint(runDirectory),
        stampFingerprint(join(runDirectory, "events.jsonl")),
        stampFingerprint(join(runDirectory, "journal.jsonl")),
        stampFingerprint(join(runDirectory, ".heartbeat")),
        agents,
      ].join("|");
    })
    .join(";");
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
  const {
    owner: _owner,
    workflowFile: _workflowFile,
    journalDescription: _journalDescription,
    ...visible
  } = run;
  return visible;
}

type ThreadLabel = { title: string | null; available: boolean };

const unknownThreadLabel: ThreadLabel = { title: null, available: false };
const MAX_WARMED_THREAD_LABELS = 12;
const AVAILABLE_THREAD_LABEL_TTL_MS = 10 * 60_000;
const UNAVAILABLE_THREAD_LABEL_TTL_MS = 60_000;

function isTerminalHistoryStatus(status: string): boolean {
  return /^(completed|done|success|cancel(?:led|ed)|interrupted)$/i.test(status);
}

export function createGlobalRunPresenter(
  bb: BbPluginApi,
): {
  present(runs: ReturnType<typeof scanRuns>): GlobalRun[];
  dispose(): void;
} {
  const threadLabelCache = new Map<
    string,
    { expiresAt: number; value: ThreadLabel }
  >();
  const pendingThreadLabels = new Set<string>();
  const threadLabelWarmQueue: string[] = [];
  const lifecycle = new AbortController();
  let isDisposed = false;
  let isWarmingThreadLabel = false;
  let threadLabelWarmTimer: ReturnType<typeof setTimeout> | null = null;

  async function fetchThreadLabel(threadId: string): Promise<ThreadLabel> {
    try {
      const thread = await bb.sdk.threads.get({
        threadId,
        signal: AbortSignal.any([
          lifecycle.signal,
          AbortSignal.timeout(5_000),
        ]),
      });
      return {
        title: thread.title ?? thread.titleFallback ?? null,
        available: true,
      };
    } catch {
      return unknownThreadLabel;
    }
  }

  async function processThreadLabelWarmQueue(): Promise<void> {
    if (isDisposed || isWarmingThreadLabel) return;
    isWarmingThreadLabel = true;
    let labelsChanged = false;
    try {
      while (!isDisposed && threadLabelWarmQueue.length > 0) {
        const threadId = threadLabelWarmQueue.shift();
        if (!threadId) continue;
        const value = await fetchThreadLabel(threadId);
        pendingThreadLabels.delete(threadId);
        if (isDisposed) break;
        threadLabelCache.set(threadId, {
          expiresAt:
            Date.now() +
            (value.available
              ? AVAILABLE_THREAD_LABEL_TTL_MS
              : UNAVAILABLE_THREAD_LABEL_TTL_MS),
          value,
        });
        labelsChanged = true;
      }
    } finally {
      isWarmingThreadLabel = false;
      if (!isDisposed && labelsChanged) {
        try {
          bb.realtime.publish("omegacode", {
            changedAt: Date.now(),
            ownerLabelsChanged: true,
          });
        } catch (error) {
          bb.log.warn(
            `could not publish refreshed Omegacode run owners: ${String(error)}`,
          );
        }
      }
      if (!isDisposed && threadLabelWarmQueue.length > 0) {
        scheduleThreadLabelWarmQueue();
      }
    }
  }

  function scheduleThreadLabelWarmQueue(): void {
    if (
      isDisposed ||
      isWarmingThreadLabel ||
      threadLabelWarmTimer !== null
    ) {
      return;
    }
    threadLabelWarmTimer = setTimeout(() => {
      threadLabelWarmTimer = null;
      void processThreadLabelWarmQueue();
    }, 0);
  }

  function warmThreadLabel(threadId: string): void {
    if (isDisposed || pendingThreadLabels.has(threadId)) return;
    const cached = threadLabelCache.get(threadId);
    if (cached && cached.expiresAt > Date.now()) return;
    pendingThreadLabels.add(threadId);
    threadLabelWarmQueue.push(threadId);
    scheduleThreadLabelWarmQueue();
  }

  function prioritizedThreadIds(
    runs: ReturnType<typeof scanRuns>,
  ): string[] {
    const threadIds: string[] = [];
    const seen = new Set<string>();
    for (const terminal of [false, true]) {
      for (const run of runs) {
        if (isTerminalHistoryStatus(run.status) !== terminal) continue;
        const threadId = run.owner?.threadId;
        if (!threadId || seen.has(threadId)) continue;
        seen.add(threadId);
        threadIds.push(threadId);
        if (threadIds.length === MAX_WARMED_THREAD_LABELS) return threadIds;
      }
    }
    return threadIds;
  }

  function present(runs: ReturnType<typeof scanRuns>) {
    const labels = new Map<string, ThreadLabel>();
    for (const run of runs) {
      const threadId = run.owner?.threadId;
      if (!threadId || labels.has(threadId)) continue;
      const cached = threadLabelCache.get(threadId);
      const fresh = cached && cached.expiresAt > Date.now() ? cached.value : null;
      labels.set(threadId, fresh ?? unknownThreadLabel);
    }
    for (const threadId of prioritizedThreadIds(runs)) {
      if (labels.get(threadId) === unknownThreadLabel) warmThreadLabel(threadId);
    }

    return runs.map((run) => {
      const base = publicRun(run);
      // The global page keeps completed and canceled runs collapsed, where it
      // renders only their summary. Omitting worker details keeps long history
      // from dominating the RPC payload without changing the live/failed views.
      const visible = isTerminalHistoryStatus(run.status)
        ? { ...base, agents: [] }
        : base;
      if (!run.owner) return { ...visible, owner: null };
      const label = labels.get(run.owner.threadId) ?? unknownThreadLabel;
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

  function dispose(): void {
    if (isDisposed) return;
    isDisposed = true;
    lifecycle.abort();
    if (threadLabelWarmTimer !== null) clearTimeout(threadLabelWarmTimer);
    threadLabelWarmTimer = null;
    threadLabelWarmQueue.length = 0;
    pendingThreadLabels.clear();
    threadLabelCache.clear();
  }

  return { present, dispose };
}

export function resetOmegacodeCachesForTest(): void {
  jsonlCache.clear();
  runCache.clear();
  workflowDetailsCache.clear();
}

export default async function plugin(bb: BbPluginApi) {
  const globalRuns = createGlobalRunPresenter(bb);
  bb.onDispose(globalRuns.dispose);

  bb.rpc.register(rpcContract, {
    async runs({ threadId }) {
      const visibleRuns = scanRuns().filter(isVisibleRun);
      const scope = inferThreadRunScope(visibleRuns, threadId);
      const runs = scope
        ? visibleRuns
            .filter((run) => runBelongsToScope(run, scope))
            .slice(0, 6)
            .map(publicRun)
        : [];
      return { runs, scannedAt: Date.now() };
    },
    async allRuns() {
      return {
        runs: globalRuns.present(scanRuns()),
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
          const fingerprint = journalCorpusFingerprint();
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
      const scannedRuns = scanRuns();
      const scope = !showAll && ctx.threadId
        ? inferThreadRunScope(scannedRuns, ctx.threadId)
        : null;
      const runs = scannedRuns.filter((run) =>
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
