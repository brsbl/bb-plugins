import {
  PLUGIN_CLI_OUTPUT_MAX_BYTES,
  type BbPluginApi,
} from "@get-bb/plugin-sdk";
import type { SceneSeedRuntime } from "./server/runtime.js";
import type { CanvasSnapshotDto, JobDto } from "./store.js";

const USAGE = `Usage:
  bb sceneseed list
  bb sceneseed show <canvas-id> [--json]
  bb sceneseed add <canvas-id> --prompt <text> [--x <n> --y <n>]
  bb sceneseed wait <job-id>
  bb sceneseed cancel <job-id>
  bb sceneseed remove-object <canvas-id> <object-id>`;

const MAX_LIST_CANVASES = 100;
const MAX_HISTORY_ROWS = 100;
const WAIT_TIMEOUT_MS = 60_000;

function failure(message: string) {
  return { exitCode: 1, stderr: `${message}\n${USAGE}` };
}

function json(value: unknown): string {
  const output = `${JSON.stringify(value, null, 2)}\n`;
  if (Buffer.byteLength(output, "utf8") > PLUGIN_CLI_OUTPUT_MAX_BYTES) {
    throw new Error(
      "SceneSeed output exceeds the bb plugin CLI limit; inspect a smaller canvas.",
    );
  }
  return output;
}

function boundedSnapshot(snapshot: CanvasSnapshotDto) {
  const cards = snapshot.cards.slice(-MAX_HISTORY_ROWS);
  const jobs = snapshot.jobs.slice(-MAX_HISTORY_ROWS);
  const candidates = snapshot.candidates.slice(-MAX_HISTORY_ROWS);
  return {
    ...snapshot,
    cards,
    jobs,
    candidates,
    truncated: {
      cards: snapshot.cards.length - cards.length,
      jobs: snapshot.jobs.length - jobs.length,
      candidates: snapshot.candidates.length - candidates.length,
    },
  };
}

function collectFlag(argv: readonly string[], name: string): string | null {
  const index = argv.indexOf(name);
  if (index < 0) return null;
  const parts: string[] = [];
  for (let cursor = index + 1; cursor < argv.length; cursor += 1) {
    const part = argv[cursor]!;
    if (part.startsWith("--")) break;
    parts.push(part);
  }
  return parts.length === 0 ? null : parts.join(" ");
}

function numericFlag(
  argv: readonly string[],
  name: string,
  fallback: number,
): number {
  const raw = collectFlag(argv, name);
  if (raw === null) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`${name} must be a number`);
  return value;
}

function terminal(job: JobDto): boolean {
  return (
    job.state === "complete" ||
    job.state === "cancelled" ||
    job.state === "failed" ||
    job.state === "superseded"
  );
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(signal.reason ?? new Error("wait cancelled"));
  }
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timeout);
        reject(signal.reason ?? new Error("wait cancelled"));
      },
      { once: true },
    );
  });
}

async function waitForJob(
  runtime: SceneSeedRuntime,
  jobId: string,
  signal?: AbortSignal,
): Promise<JobDto> {
  const deadline = Date.now() + WAIT_TIMEOUT_MS;
  while (true) {
    const job = runtime.store.getJob(jobId);
    if (job === null) throw new Error(`job ${jobId} was not found`);
    if (terminal(job)) return job;
    if (Date.now() >= deadline) {
      throw new Error(
        `timed out after ${WAIT_TIMEOUT_MS / 1_000}s waiting for ${jobId}; run the command again to continue waiting`,
      );
    }
    await delay(250, signal);
  }
}

export function registerSceneSeedCli(
  bb: BbPluginApi,
  runtime: SceneSeedRuntime,
): void {
  bb.cli.register({
    name: "sceneseed",
    summary: "Create and inspect SceneSeed canvas objects",
    commands: [
      {
        name: "list",
        summary: "List saved SceneSeed canvases",
        usage: "bb sceneseed list",
      },
      {
        name: "show",
        summary: "Show one canvas with bounded history",
        usage: "bb sceneseed show <canvas-id> [--json]",
      },
      {
        name: "add",
        summary: "Add and queue a prompt card",
        usage: "bb sceneseed add <canvas-id> --prompt <text> [--x <n> --y <n>]",
      },
      {
        name: "wait",
        summary: "Wait up to 60 seconds for a job to settle",
        usage: "bb sceneseed wait <job-id>",
      },
      {
        name: "cancel",
        summary: "Cancel a queued or interpreting job",
        usage: "bb sceneseed cancel <job-id>",
      },
      {
        name: "remove-object",
        summary: "Remove an object from a canvas",
        usage: "bb sceneseed remove-object <canvas-id> <object-id>",
      },
    ],
    async run(argv, context) {
      try {
        const [command, first, second] = argv;
        if (command === "list") {
          const canvases = runtime.listCanvases();
          const shown = canvases.slice(0, MAX_LIST_CANVASES);
          if (shown.length === 0) {
            return { exitCode: 0, stdout: "No SceneSeed canvases.\n" };
          }
          const lines = shown.map(
            (canvas) =>
              `${canvas.id}\t${canvas.name}\t${canvas.objectCount} objects\trev ${canvas.revision}`,
          );
          if (canvases.length > shown.length) {
            lines.push(
              `… ${canvases.length - shown.length} additional canvases omitted`,
            );
          }
          return { exitCode: 0, stdout: `${lines.join("\n")}\n` };
        }

        if (command === "show") {
          if (first === undefined) return failure("Missing canvas id.");
          const snapshot = runtime.getCanvasSnapshot(first);
          if (snapshot === null)
            return failure(`Canvas ${first} was not found.`);
          if (argv.includes("--json")) {
            return { exitCode: 0, stdout: json(boundedSnapshot(snapshot)) };
          }
          return {
            exitCode: 0,
            stdout:
              `${snapshot.canvas.name} (${snapshot.canvas.id})\n` +
              `${snapshot.objects.filter((object) => object.removedAt === null).length} active objects, ` +
              `${snapshot.cards.length} cards, revision ${snapshot.canvas.revision}\n`,
          };
        }

        if (command === "add") {
          if (first === undefined) return failure("Missing canvas id.");
          const prompt = collectFlag(argv, "--prompt");
          if (prompt === null) return failure("Missing --prompt text.");
          const before = runtime.getCanvasSnapshot(first);
          if (before === null) return failure(`Canvas ${first} was not found.`);
          const created = await runtime.createCard({
            canvasId: first,
            prompt,
            expectedRevision: before.canvas.revision,
          });
          const placed = await runtime.placeCard({
            canvasId: first,
            cardId: created.cardId,
            placement: {
              x: numericFlag(argv, "--x", 0),
              y: numericFlag(argv, "--y", 0),
            },
            expectedRevision: created.snapshot.canvas.revision,
          });
          return {
            exitCode: 0,
            stdout: json({
              canvasId: first,
              cardId: created.cardId,
              jobId: placed.jobId,
              state:
                placed.snapshot.jobs.find((job) => job.id === placed.jobId)
                  ?.state ?? "queued",
            }),
          };
        }

        if (command === "wait") {
          if (first === undefined) return failure("Missing job id.");
          const job = await waitForJob(runtime, first, context.signal);
          return {
            exitCode: job.state === "failed" ? 1 : 0,
            stdout: json(job),
          };
        }

        if (command === "cancel") {
          if (first === undefined) return failure("Missing job id.");
          const snapshot = await runtime.cancelJob(first);
          const job = snapshot.jobs.find((entry) => entry.id === first);
          return { exitCode: 0, stdout: json({ job }) };
        }

        if (command === "remove-object") {
          if (first === undefined || second === undefined) {
            return failure("Missing canvas id or object id.");
          }
          const snapshot = runtime.getCanvasSnapshot(first);
          if (snapshot === null)
            return failure(`Canvas ${first} was not found.`);
          const next = await runtime.removeObject({
            canvasId: first,
            objectId: second,
            expectedCanvasRevision: snapshot.canvas.revision,
          });
          return {
            exitCode: 0,
            stdout: json({
              canvasId: first,
              objectId: second,
              revision: next.canvas.revision,
              removed: true,
            }),
          };
        }

        return failure(
          command === undefined
            ? "Missing SceneSeed subcommand."
            : `Unknown SceneSeed subcommand ${command}.`,
        );
      } catch (error) {
        return {
          exitCode: 1,
          stderr: `${error instanceof Error ? error.message : String(error)}\n`,
        };
      }
    },
  });
}
