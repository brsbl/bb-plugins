import { defineRpcContract, type BbPluginApi } from "@get-bb/plugin-sdk";
import { z } from "zod";

const RUNS_CHANGED_CHANNEL = "runs-changed";
const MAX_HTML_BYTES = 4 * 1024 * 1024;
const MAX_JSON_BYTES = 8 * 1024 * 1024;

const runMetaSchema = z
  .object({
    runId: z.string().min(1),
    asOf: z.string().min(1),
    periodStart: z.string().min(1),
    weeks: z.number().int().positive(),
    repository: z.string().min(1),
  })
  .passthrough();

const reportSchema = z
  .object({
    meta: runMetaSchema,
    totals: z
      .object({
        topics: z.number(),
        people: z.number(),
        open: z.number(),
        close_pct: z.number().nullable(),
      })
      .passthrough(),
    areas: z.array(z.object({ area: z.string() }).passthrough()),
  })
  .passthrough();

const narrativeSchema = z
  .object({
    headlines: z.array(
      z.tuple([
        z.string(),
        z.string(),
        z.array(z.string()),
        z.string().nullable(),
      ]),
    ),
    recs: z.array(z.array(z.unknown())),
  })
  .passthrough();

const runSummarySchema = z
  .object({
    id: z.string(),
    asOf: z.string(),
    periodStart: z.string(),
    weeks: z.number(),
    repository: z.string(),
    importedAt: z.string(),
    threadId: z.string().nullable(),
    totals: z.object({
      topics: z.number(),
      people: z.number(),
      open: z.number(),
      closePct: z.number().nullable(),
    }),
    headlines: z.array(z.string()),
  })
  .strict();

export type RunSummary = z.infer<typeof runSummarySchema>;

export const rpcContract = defineRpcContract({
  listRuns: {
    input: z.null(),
    output: z.object({ runs: z.array(runSummarySchema) }).strict(),
  },
  askAgent: {
    input: z.object({ runId: z.string().min(1) }).strict(),
    output: z
      .object({ threadId: z.string(), created: z.boolean() })
      .strict(),
  },
});

interface RunRow {
  id: string;
  as_of: string;
  period_start: string;
  weeks: number;
  repository: string;
  imported_at: string;
  thread_id: string | null;
  report: string;
  narrative: string;
  html: string;
}

interface RunFiles {
  report: z.infer<typeof reportSchema>;
  narrative: z.infer<typeof narrativeSchema>;
  html: string;
}

function parseJsonDocument<T>(
  label: string,
  text: string,
  schema: z.ZodType<T>,
  maxBytes: number,
): T {
  if (Buffer.byteLength(text, "utf8") > maxBytes) {
    throw new Error(`${label} exceeds ${maxBytes} bytes`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`${label} is not valid JSON`);
  }
  const result = schema.safeParse(parsed);
  if (!result.success) {
    const issue = result.error.issues[0];
    const where = issue?.path.length ? ` at ${issue.path.join(".")}` : "";
    throw new Error(`${label} is invalid${where}: ${issue?.message ?? "unknown"}`);
  }
  return result.data;
}

function summarize(row: RunRow): RunSummary {
  const report = JSON.parse(row.report) as RunFiles["report"];
  const narrative = JSON.parse(row.narrative) as RunFiles["narrative"];
  return {
    id: row.id,
    asOf: row.as_of,
    periodStart: row.period_start,
    weeks: row.weeks,
    repository: row.repository,
    importedAt: row.imported_at,
    threadId: row.thread_id,
    totals: {
      topics: report.totals.topics,
      people: report.totals.people,
      open: report.totals.open,
      closePct: report.totals.close_pct,
    },
    headlines: narrative.headlines.map((headline) => headline[1]),
  };
}

function usage(): string {
  return [
    "Usage:",
    "  bb feedback-report runs",
    "  bb feedback-report show <runId>",
    "  bb feedback-report import <run-dir> [--machine <hostId>]",
    "  bb feedback-report remove <runId>",
    "  bb feedback-report latest",
  ].join("\n");
}

function parseFlags(argv: string[]): { positional: string[]; machine?: string } {
  const positional: string[] = [];
  let machine: string | undefined;
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--machine") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--machine requires a host id");
      }
      machine = value;
      index += 1;
      continue;
    }
    if (token.startsWith("--")) throw new Error(`Unknown flag ${token}`);
    positional.push(token);
  }
  return { positional, machine };
}

function joinPath(directory: string, file: string): string {
  return directory.endsWith("/") ? `${directory}${file}` : `${directory}/${file}`;
}

export default function plugin(bb: BbPluginApi): void {
  const settings = bb.settings.define({
    project: { type: "project", label: "Project for follow-up threads" },
    repository: {
      type: "string",
      label: "GitHub repository (owner/name)",
      default: "get-bb/bb",
    },
    guildId: { type: "string", label: "Discord guild id", default: "" },
    repoPath: {
      type: "string",
      label: "Local checkout path used for the commit ledger",
      default: "",
    },
    collaborators: {
      type: "string",
      label: "Maintainer handles excluded from feedback (comma separated)",
      default: "",
    },
    discordBotToken: {
      type: "string",
      label: "Discord bot token",
      secret: true,
    },
  });

  const db = bb.storage.database();
  bb.storage.migrate(db, [
    `CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY,
      as_of TEXT NOT NULL,
      period_start TEXT NOT NULL,
      weeks INTEGER NOT NULL,
      repository TEXT NOT NULL,
      imported_at TEXT NOT NULL,
      thread_id TEXT,
      report TEXT NOT NULL,
      narrative TEXT NOT NULL,
      html TEXT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS runs_as_of ON runs (as_of DESC)`,
  ]);

  const listRows = (): RunRow[] =>
    db
      .prepare(
        `SELECT id, as_of, period_start, weeks, repository, imported_at, thread_id, report, narrative, html
         FROM runs ORDER BY as_of DESC, imported_at DESC`,
      )
      .all() as RunRow[];
  const getRow = (id: string): RunRow | undefined =>
    db
      .prepare(
        `SELECT id, as_of, period_start, weeks, repository, imported_at, thread_id, report, narrative, html
         FROM runs WHERE id = ?`,
      )
      .get(id) as RunRow | undefined;

  function storeRun(files: RunFiles): RunSummary {
    const meta = files.report.meta;
    db.prepare(
      `INSERT INTO runs (id, as_of, period_start, weeks, repository, imported_at, thread_id, report, narrative, html)
       VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         as_of = excluded.as_of, period_start = excluded.period_start, weeks = excluded.weeks,
         repository = excluded.repository, imported_at = excluded.imported_at,
         report = excluded.report, narrative = excluded.narrative, html = excluded.html`,
    ).run(
      meta.runId,
      meta.asOf,
      meta.periodStart,
      meta.weeks,
      meta.repository,
      new Date().toISOString(),
      JSON.stringify(files.report),
      JSON.stringify(files.narrative),
      files.html,
    );
    bb.realtime.publish(RUNS_CHANGED_CHANNEL, { runId: meta.runId });
    const row = getRow(meta.runId);
    if (!row) throw new Error("run vanished after insert");
    return summarize(row);
  }

  async function resolveInvokingHost(
    threadId: string | undefined,
    machine: string | undefined,
  ): Promise<string | undefined> {
    if (machine) return machine;
    if (!threadId) return undefined;
    const thread = await bb.sdk.threads.get({ threadId });
    if (!thread.environmentId) return undefined;
    const environment = await bb.sdk.environments.get({
      environmentId: thread.environmentId,
    });
    return environment.hostId;
  }

  async function readRunFiles(
    directory: string,
    hostId: string | undefined,
    signal: AbortSignal | undefined,
  ): Promise<RunFiles> {
    const read = async (file: string) => {
      const result = await bb.sdk.files.read({
        ...(hostId ? { hostId } : {}),
        path: joinPath(directory, file),
        ...(signal ? { signal } : {}),
      });
      return result.content;
    };
    const report = parseJsonDocument(
      "report.json",
      await read("report.json"),
      reportSchema,
      MAX_JSON_BYTES,
    );
    const narrative = parseJsonDocument(
      "narrative.json",
      await read("narrative.json"),
      narrativeSchema,
      MAX_JSON_BYTES,
    );
    const html = await read("dashboard.html");
    if (Buffer.byteLength(html, "utf8") > MAX_HTML_BYTES) {
      throw new Error(`dashboard.html exceeds ${MAX_HTML_BYTES} bytes`);
    }
    if (!html.includes("const DATA=")) {
      throw new Error("dashboard.html does not contain an embedded report");
    }
    return { report, narrative, html };
  }

  async function ensureThread(runId: string): Promise<{ threadId: string; created: boolean }> {
    const row = getRow(runId);
    if (!row) throw new Error(`Unknown run ${runId}`);
    if (row.thread_id) return { threadId: row.thread_id, created: false };
    const { project } = await settings.get();
    if (!project) {
      throw new Error(
        "Set the project for follow-up threads in the Feedback Report plugin settings first.",
      );
    }
    const summary = summarize(row);
    const prompt = [
      `You are answering follow-up questions about the bb feedback report run ${runId}`,
      `(${summary.repository}, ${summary.periodStart.slice(0, 10)} to ${summary.asOf.slice(0, 10)}, ${summary.weeks} weeks).`,
      "Run `bb feedback-report show " + runId + "` to read the report data and narrative before answering.",
      "Ground every answer in that data; when a question needs record-level detail, ask for the run directory and read its classification.jsonl and resolution.csv.",
      "Do not modify the run.",
      "",
      "Headlines of this run:",
      ...summary.headlines.map((headline) => `- ${headline}`),
      "",
      "Start by asking what the user wants to know.",
    ].join("\n");
    const thread = await bb.sdk.threads.spawn({
      projectId: project,
      environment: { type: "project-default" },
      prompt,
      title: `Feedback report ${runId}`,
    });
    db.prepare(`UPDATE runs SET thread_id = ? WHERE id = ?`).run(thread.id, runId);
    bb.realtime.publish(RUNS_CHANGED_CHANNEL, { runId });
    return { threadId: thread.id, created: true };
  }

  bb.rpc.register(rpcContract, {
    listRuns() {
      return { runs: listRows().map(summarize) };
    },
    async askAgent({ runId }) {
      return ensureThread(runId);
    },
  });

  bb.http.route("GET", "/dashboard", (context) => {
    const runId = context.req.query("run") ?? "";
    const row = runId ? getRow(runId) : listRows()[0];
    if (!row) return new Response("No such run", { status: 404 });
    return new Response(row.html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "content-security-policy":
          "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; font-src data:",
        "x-content-type-options": "nosniff",
      },
    });
  });

  bb.cli.register({
    name: "feedback-report",
    summary: "Import, list, and open community feedback report runs",
    commands: [
      { name: "runs", summary: "List imported runs", usage: "bb feedback-report runs" },
      {
        name: "show",
        summary: "Print a run's data and narrative as JSON",
        usage: "bb feedback-report show <runId>",
      },
      {
        name: "import",
        summary: "Import a run directory (report.json, narrative.json, dashboard.html)",
        usage: "bb feedback-report import <run-dir> [--machine <hostId>]",
      },
      { name: "remove", summary: "Delete an imported run", usage: "bb feedback-report remove <runId>" },
      { name: "latest", summary: "Print the latest run id", usage: "bb feedback-report latest" },
    ],
    async run(argv, ctx) {
      try {
        const { positional, machine } = parseFlags(argv);
        const [command, argument] = positional;
        if (command === "runs") {
          const runs = listRows().map(summarize);
          if (runs.length === 0) {
            return { exitCode: 0, stdout: "No runs imported yet. Run the feedback-report skill, then `bb feedback-report import <run-dir>`.\n" };
          }
          const lines = runs.map(
            (run) =>
              `${run.id}  ${run.periodStart.slice(0, 10)} to ${run.asOf.slice(0, 10)}  feedback ${run.totals.topics}  people ${run.totals.people}  open ${run.totals.open}  close ${run.totals.closePct ?? "–"}%${run.threadId ? `  thread ${run.threadId}` : ""}`,
          );
          return { exitCode: 0, stdout: lines.join("\n") + "\n" };
        }
        if (command === "show") {
          if (!argument) return { exitCode: 2, stderr: usage() + "\n" };
          const row = getRow(argument);
          if (!row) return { exitCode: 1, stderr: `Unknown run ${argument}\n` };
          const payload = {
            summary: summarize(row),
            report: JSON.parse(row.report) as unknown,
            narrative: JSON.parse(row.narrative) as unknown,
          };
          return { exitCode: 0, stdout: JSON.stringify(payload, null, 2) + "\n" };
        }
        if (command === "import") {
          if (!argument) return { exitCode: 2, stderr: usage() + "\n" };
          const hostId = await resolveInvokingHost(ctx.threadId, machine);
          const files = await readRunFiles(argument, hostId, ctx.signal);
          const summary = storeRun(files);
          return {
            exitCode: 0,
            stdout: `Imported ${summary.id} (${summary.periodStart.slice(0, 10)} to ${summary.asOf.slice(0, 10)}): ${summary.totals.topics} feedback, ${summary.totals.people} people. Open the Feedback report panel to view it.\n`,
          };
        }
        if (command === "remove") {
          if (!argument) return { exitCode: 2, stderr: usage() + "\n" };
          const result = db.prepare(`DELETE FROM runs WHERE id = ?`).run(argument);
          if (result.changes === 0) return { exitCode: 1, stderr: `Unknown run ${argument}\n` };
          bb.realtime.publish(RUNS_CHANGED_CHANNEL, { runId: argument });
          return { exitCode: 0, stdout: `Removed ${argument}\n` };
        }
        if (command === "latest") {
          const row = listRows()[0];
          return row
            ? { exitCode: 0, stdout: `${row.id}\n` }
            : { exitCode: 1, stderr: "No runs imported yet\n" };
        }
        return { exitCode: 2, stderr: usage() + "\n" };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { exitCode: 1, stderr: `${message}\n` };
      }
    },
  });

  bb.log.info("Feedback Report loaded");
}
