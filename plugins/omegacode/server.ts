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
  status: z.string(),
  updatedAt: z.number().nullable(),
  heartbeatAgeMs: z.number().nullable(),
  counts: z.object({
    total: z.number(),
    running: z.number(),
    queued: z.number(),
    completed: z.number(),
    failed: z.number(),
  }),
  agents: z.array(AgentSchema),
});

export const rpcContract = defineRpcContract({
  runs: {
    input: z.null(),
    output: z.object({ runs: z.array(RunSchema), scannedAt: z.number() }),
  },
});

function readJsonl(path: string): Record<string, unknown>[] {
  if (!existsSync(path)) return [];
  const out: Record<string, unknown>[] = [];
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t) continue;
    // A live run may be mid-write; a torn trailing line is expected, not an error.
    try {
      out.push(JSON.parse(t) as Record<string, unknown>);
    } catch {
      /* skip partial line */
    }
  }
  return out;
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
const nameCache = new Map<string, { mtime: number; name: string | null }>();
function workflowName(file: string | undefined): string | null {
  if (!file || !existsSync(file)) return null;
  const mtime = safeMtime(file);
  const hit = nameCache.get(file);
  if (hit && hit.mtime === mtime) return hit.name;
  let name: string | null = null;
  try {
    const src = readFileSync(file, "utf8").slice(0, 2000);
    const m = src.match(/name:\s*['"`]([^'"`]+)['"`]/);
    if (m) name = m[1];
  } catch {
    name = null;
  }
  nameCache.set(file, { mtime, name });
  return name;
}

function readRun(runId: string) {
  const dir = join(RUNS_DIR, runId);
  const events = readJsonl(join(dir, "events.jsonl"));
  const journal = readJsonl(join(dir, "journal.jsonl"));

  const meta = journal.find((r) => r.type === "meta") ?? {};
  const workflowFile = typeof meta.workflowFile === "string" ? meta.workflowFile : undefined;
  const workflow = workflowFile ? (workflowFile.split("/").pop() ?? null) : null;
  const name = workflowName(workflowFile);

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
    queued: agents.filter((a) => a.state === "queued").length,
    completed: agents.filter((a) => a.state === "completed").length,
    failed: agents.filter((a) => /fail|error/i.test(a.state)).length,
  };

  let heartbeatAgeMs: number | null = null;
  try {
    const hb = join(dir, ".heartbeat");
    if (existsSync(hb)) heartbeatAgeMs = Date.now() - statSync(hb).mtimeMs;
  } catch {
    heartbeatAgeMs = null;
  }

  const finished = counts.total > 0 && counts.running === 0 && counts.queued === 0;
  const stale = heartbeatAgeMs != null && heartbeatAgeMs > 120_000;
  const status = finished
    ? "completed"
    : stale
      ? "stalled"
      : counts.total
        ? "running"
        : "starting";

  return {
    runId,
    workflow,
    workflowName: name,
    status,
    updatedAt: safeMtime(dir) || null,
    heartbeatAgeMs,
    counts,
    agents,
  };
}

function scanRuns(limit = 6) {
  if (!existsSync(RUNS_DIR)) return [];
  return readdirSync(RUNS_DIR)
    .filter((d) => d.startsWith("wf_"))
    .map((d) => ({ d, m: safeMtime(join(RUNS_DIR, d)) }))
    .sort((a, b) => b.m - a.m)
    .slice(0, limit)
    .map((x) => readRun(x.d));
}

export default async function plugin(bb: BbPluginApi) {
  // Which thread the composer banner is pinned to. The banner only renders in
  // this one thread's composer, not above every prompt box in the app.
  bb.settings.define({
    threadId: {
      type: "string",
      label: "Pinned thread id",
      default: "thr_d44sg8wntr",
    },
  });

  bb.rpc.register(rpcContract, {
    runs() {
      // Only surface genuinely-live runs (fresh heartbeat) plus ones that just
      // died mid-flight — old finished/killed runs are dropped so the banner
      // can never accumulate. scanRuns already caps the directory scan.
      const runs = scanRuns().filter((r) => {
        const hb = r.heartbeatAgeMs;
        if (hb == null) return false;
        if (hb < 30_000) return true; // live (running, or just finished)
        return hb < 300_000 && r.counts.running > 0; // recently stalled mid-flight
      });
      return { runs, scannedAt: Date.now() };
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
            .map(
              (r) =>
                `${r.runId}:${r.status}:${r.counts.running}/${r.counts.queued}/${r.counts.completed}/${r.counts.failed}`,
            )
            .join("|");
          if (fingerprint !== last) {
            last = fingerprint;
            bb.realtime.publish("omega", { changedAt: Date.now() });
          }
        } catch (err) {
          bb.log.warn(`omega watch: ${String(err)}`);
        }
        await new Promise((r) => setTimeout(r, 2500));
      }
    },
  });

  bb.cli.register({
    name: "omega",
    summary: "omegacode run status",
    commands: [
      { name: "status", summary: "Show recent omegacode runs", usage: "bb omega status" },
    ],
    async run() {
      const runs = scanRuns();
      if (!runs.length) return { exitCode: 0, stdout: "no omegacode runs found\n" };
      const lines = runs.map((r) => {
        const c = r.counts;
        return `${r.runId}  ${r.status.padEnd(9)}  ${c.running} running / ${c.queued} queued / ${c.completed} done / ${c.failed} failed  (${r.workflow ?? "?"})`;
      });
      return { exitCode: 0, stdout: `${lines.join("\n")}\n` };
    },
  });

  bb.log.info(`omega command center ready (${RUNS_DIR})`);
}
