import { cliCommand, defineCli, defineRpcContract, PluginCliError, type BbPluginApi } from "@get-bb/plugin-sdk";
import { z } from "zod";

import { normalizeLabel, statusSchema, TONES, MAX_LABEL_LENGTH, type ThreadStatus, type Tone } from "./status.js";

export const rpcContract = defineRpcContract({
  list: {
    input: z.null(),
    output: z.object({ statuses: z.record(z.string(), statusSchema) }),
  },
});

export const AGENT_INSTRUCTIONS = [
  "Thread Status: this thread's sidebar row shows a short status pill that you keep current.",
  "- Set it with `bb thread-status set \"<1-2 words>\" --tone <tone>` and remove it with `bb thread-status clear`.",
  `- Tones: ${TONES.join(", ")}. Use danger when broken or blocked, warning when it needs attention soon, success when done or passing, info for active work, neutral otherwise.`,
  "- Update it when the state of your work changes in a way the user would want to see at a glance (for example: Drafting, Tests red, Needs input, CI green, Done). Keep it current; never leave a stale pill.",
  "- When Thread Organizer is in use, the pill sits inside its workflow section, which already names the stage. Never repeat the section or stage name; say what is true within it (in Building: \"CI red\", not \"Building\"). When you move stages with `bb organizer phase`, update or clear the pill in the same step.",
].join("\n");

function requireThreadId(threadId: string | undefined, ctxThreadId: string | undefined): string {
  const resolved = threadId ?? ctxThreadId;
  if (!resolved) {
    throw new PluginCliError("no thread to update", {
      code: "thread_required",
      hint: "Run this from an agent thread, or pass --thread <thread-id>.",
    });
  }
  return resolved;
}

export default function plugin(bb: BbPluginApi): void {
  const db = bb.storage.database();
  bb.storage.migrate(db, [
    `CREATE TABLE IF NOT EXISTS thread_status (thread_id TEXT PRIMARY KEY, label TEXT NOT NULL, tone TEXT NOT NULL, updated_at INTEGER NOT NULL)`,
  ]);
  const selectOne = db.prepare("SELECT label, tone, updated_at AS updatedAt FROM thread_status WHERE thread_id = ?");
  const selectAll = db.prepare("SELECT thread_id AS threadId, label, tone, updated_at AS updatedAt FROM thread_status");
  const upsert = db.prepare(
    "INSERT INTO thread_status (thread_id, label, tone, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(thread_id) DO UPDATE SET label = excluded.label, tone = excluded.tone, updated_at = excluded.updated_at",
  );
  const remove = db.prepare("DELETE FROM thread_status WHERE thread_id = ?");

  function readStatus(threadId: string): ThreadStatus | null {
    const parsed = statusSchema.safeParse(selectOne.get(threadId));
    return parsed.success ? parsed.data : null;
  }

  function listStatuses(): Record<string, ThreadStatus> {
    const statuses: Record<string, ThreadStatus> = {};
    for (const row of selectAll.all() as Array<{ threadId: string }>) {
      const parsed = statusSchema.safeParse(row);
      if (parsed.success) statuses[row.threadId] = parsed.data;
    }
    return statuses;
  }

  function clearStatus(threadId: string): boolean {
    return remove.run(threadId).changes > 0;
  }

  bb.rpc.register(rpcContract, {
    list() {
      return { statuses: listStatuses() };
    },
  });

  const threadOption = {
    type: "string",
    aliases: ["thread-id"],
    description: "Thread to update. Defaults to the thread running the command.",
  } as const;

  bb.cli.register(
    defineCli({
      name: "thread-status",
      summary: "Set the short status pill beside this thread's title in the sidebar",
      commands: {
        set: cliCommand({
          summary: `Set the status pill (1-2 words, at most ${MAX_LABEL_LENGTH} characters)`,
          positionals: [{ name: "label", description: "1-2 words, for example \"CI red\"", required: true, variadic: true }],
          options: {
            tone: {
              type: "enum",
              values: TONES,
              default: "neutral",
              aliases: ["color", "colour"],
              description: `Semantic color: ${TONES.join(", ")}`,
            },
            thread: threadOption,
          },
          async run(input, ctx) {
            const threadId = requireThreadId(input.options.thread, ctx.threadId);
            const label = normalizeLabel(input.positionals.label.join(" "));
            if (!label.ok) throw new PluginCliError(label.error, { code: "invalid_label", hint: "Use 1-2 short words, for example \"Needs input\"." });
            const tone: Tone = input.options.tone;
            const status: ThreadStatus = { label: label.label, tone, updatedAt: Date.now() };
            upsert.run(threadId, status.label, status.tone, status.updatedAt);
                    return { exitCode: 0, stdout: `${threadId}: ${status.label} (${status.tone})\n` };
          },
        }),
        clear: cliCommand({
          summary: "Remove the status pill",
          options: { thread: threadOption },
          async run(input, ctx) {
            const threadId = requireThreadId(input.options.thread, ctx.threadId);
            const existed = clearStatus(threadId);
            return { exitCode: 0, stdout: existed ? `${threadId}: cleared\n` : `${threadId}: no status\n` };
          },
        }),
        get: cliCommand({
          summary: "Show the status pill",
          options: { thread: threadOption, json: { type: "boolean", description: "Emit JSON" } },
          async run(input, ctx) {
            const threadId = requireThreadId(input.options.thread, ctx.threadId);
            const status = readStatus(threadId);
            if (input.options.json) return { exitCode: 0, stdout: `${JSON.stringify({ threadId, status })}\n` };
            return { exitCode: 0, stdout: status ? `${status.label} (${status.tone})\n` : "no status\n" };
          },
        }),
      },
    }),
  );

  bb.agents.configure(({ origin }) => {
    if (origin.pluginId === bb.pluginId) return { tools: [], skills: [] };
    return { tools: [], skills: [], instructions: AGENT_INSTRUCTIONS };
  });

  for (const event of ["thread.archived", "thread.deleted"] as const) {
    bb.events.on(event, ({ thread }) => {
      clearStatus(thread.id);
    });
  }
}
