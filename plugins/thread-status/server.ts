import { cliCommand, defineCli, defineRpcContract, PluginCliError, type BbPluginApi } from "@get-bb/plugin-sdk";
import { z } from "zod";

import { normalizeLabel, statusSchema, TONES, MAX_LABEL_LENGTH, type ThreadStatus, type Tone } from "./status.js";

const STATUS_PREFIX = "status:";

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

function statusKey(threadId: string): string {
  return `${STATUS_PREFIX}${threadId}`;
}

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
  async function readStatus(threadId: string): Promise<ThreadStatus | null> {
    const parsed = statusSchema.safeParse(await bb.storage.kv.get<unknown>(statusKey(threadId)));
    return parsed.success ? parsed.data : null;
  }

  async function listStatuses(): Promise<Record<string, ThreadStatus>> {
    const statuses: Record<string, ThreadStatus> = {};
    for (const key of await bb.storage.kv.list(STATUS_PREFIX)) {
      const threadId = key.slice(STATUS_PREFIX.length);
      const status = await readStatus(threadId);
      if (status !== null) statuses[threadId] = status;
    }
    return statuses;
  }

  async function clearStatus(threadId: string): Promise<boolean> {
    const existed = (await readStatus(threadId)) !== null;
    await bb.storage.kv.delete(statusKey(threadId));
    return existed;
  }

  bb.rpc.register(rpcContract, {
    async list() {
      return { statuses: await listStatuses() };
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
            await bb.storage.kv.set(statusKey(threadId), status);
                    return { exitCode: 0, stdout: `${threadId}: ${status.label} (${status.tone})\n` };
          },
        }),
        clear: cliCommand({
          summary: "Remove the status pill",
          options: { thread: threadOption },
          async run(input, ctx) {
            const threadId = requireThreadId(input.options.thread, ctx.threadId);
            const existed = await clearStatus(threadId);
            return { exitCode: 0, stdout: existed ? `${threadId}: cleared\n` : `${threadId}: no status\n` };
          },
        }),
        get: cliCommand({
          summary: "Show the status pill",
          options: { thread: threadOption, json: { type: "boolean", description: "Emit JSON" } },
          async run(input, ctx) {
            const threadId = requireThreadId(input.options.thread, ctx.threadId);
            const status = await readStatus(threadId);
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
    bb.events.on(event, async ({ thread }) => {
      await clearStatus(thread.id);
    });
  }
}
