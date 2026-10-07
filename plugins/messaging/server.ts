import {
  PluginCliError,
  cliCommand,
  defineCli,
  type BbPluginApi,
  type PluginAgentToolResult,
  type PluginCliContext,
} from "@get-bb/plugin-sdk";
import { z } from "zod";

import {
  ENVIRONMENT_CHOICES,
  MessagingError,
  PARENT_INSTRUCTIONS,
  REPORT_KINDS,
  REPORT_MAX_CHARS,
  childInstructions,
  formatChildren,
  listChildren,
  notifyParent,
  parseChildLink,
  requestStatus,
  sendReport,
  spawnChild,
} from "./messaging";

const SPAWN_TOOL = "messaging_spawn_child";
const REPORT_TOOL = "messaging_report_to_parent";
const LIST_TOOL = "messaging_list_children";
const STATUS_TOOL = "messaging_request_status";

const spawnParameters = z.object({
  prompt: z.string().min(1).describe("The task for the child thread."),
  title: z.string().min(1).optional().describe("Optional thread title."),
  environment: z
    .enum(ENVIRONMENT_CHOICES)
    .default("default")
    .describe(
      "default: the project's default environment (usually a new worktree). shared: reuse this thread's environment.",
    ),
  providerId: z
    .string()
    .min(1)
    .optional()
    .describe("Defaults to this thread's provider."),
  model: z.string().min(1).optional(),
});

const reportParameters = z.object({
  kind: z
    .enum(REPORT_KINDS)
    .describe(
      "done: task complete. blocked: a new blocker. decision: the parent must choose. status: answering a status request.",
    ),
  message: z
    .string()
    .min(1)
    .max(REPORT_MAX_CHARS)
    .describe("What the parent needs to know or decide. Be concise."),
});

const statusParameters = z.object({
  childThreadId: z.string().min(1),
});

function errorResult(error: unknown): PluginAgentToolResult {
  const text = error instanceof Error ? error.message : String(error);
  return { content: [{ type: "text", text }], isError: true };
}

function requireThread(ctx: PluginCliContext): string {
  if (ctx.threadId === undefined) {
    throw new PluginCliError("This command must run inside a bb thread.", {
      code: "thread_required",
      hint: "Run it from an agent thread, where BB_THREAD_ID is set.",
    });
  }
  return ctx.threadId;
}

function cliFailure(error: unknown): never {
  if (error instanceof MessagingError) {
    throw new PluginCliError(error.message, { code: "messaging_failed" });
  }
  throw error;
}

export default function plugin(bb: BbPluginApi): void {
  bb.agents.registerTool({
    name: SPAWN_TOOL,
    description:
      "Start a child thread that works without waking you on every turn. It reports back only when done, blocked, or needing a decision.",
    instructions: PARENT_INSTRUCTIONS,
    presentation: {
      label: { pending: "Starting child thread", completed: "Started child thread" },
    },
    parameters: spawnParameters,
    async execute(input, ctx) {
      try {
        const child = await spawnChild(bb.sdk, {
          ...input,
          parentThreadId: ctx.threadId,
        });
        return `Started @thread:${child.id}. It will report when done, blocked, or needing a decision.`;
      } catch (error) {
        return errorResult(error);
      }
    },
  });

  bb.agents.registerTool({
    name: REPORT_TOOL,
    description:
      "Send one report to your parent thread. Use only when done, blocked, needing a decision, or answering a status request.",
    presentation: {
      label: { pending: "Reporting to parent", completed: "Reported to parent" },
    },
    parameters: reportParameters,
    async execute({ kind, message }, ctx) {
      try {
        const { parentThreadId } = await sendReport(
          bb.sdk,
          ctx.threadId,
          kind,
          message,
        );
        return `Reported ${kind} to @thread:${parentThreadId}.`;
      } catch (error) {
        return errorResult(error);
      }
    },
  });

  bb.agents.registerTool({
    name: LIST_TOOL,
    description:
      "List this thread's Messaging children with their status and last report.",
    presentation: {
      label: { pending: "Listing child threads", completed: "Listed child threads" },
      suppress: true,
    },
    parameters: z.object({}),
    async execute(_input, ctx) {
      try {
        return formatChildren(
          await listChildren(bb.sdk, bb.pluginId, ctx.threadId),
        );
      } catch (error) {
        return errorResult(error);
      }
    },
  });

  bb.agents.registerTool({
    name: STATUS_TOOL,
    description:
      "Ask one of your Messaging children for a status update. It answers with a status report.",
    presentation: {
      label: { pending: "Requesting status", completed: "Requested status" },
    },
    parameters: statusParameters,
    async execute({ childThreadId }, ctx) {
      try {
        await requestStatus(bb.sdk, ctx.threadId, childThreadId);
        return `Asked @thread:${childThreadId} for a status report.`;
      } catch (error) {
        return errorResult(error);
      }
    },
  });

  bb.agents.configure((context) => {
    const link = parseChildLink(context.pluginMetadata);
    if (link !== null) {
      return {
        tools: [REPORT_TOOL, SPAWN_TOOL, LIST_TOOL, STATUS_TOOL],
        skills: ["messaging"],
        instructions: childInstructions(link.parentThreadId),
      };
    }
    return {
      tools: [SPAWN_TOOL, LIST_TOOL, STATUS_TOOL],
      skills: ["messaging"],
    };
  });

  bb.cli.register(
    defineCli({
      name: "messaging",
      summary:
        "Child threads that report to their parent only when done, blocked, or needing a decision",
      commands: {
        spawn: cliCommand({
          summary: "Start a quiet child thread of the current thread",
          positionals: [
            { name: "prompt", description: "The child's task", required: true },
          ],
          options: {
            title: { type: "string", description: "Thread title" },
            environment: {
              type: "enum",
              values: ENVIRONMENT_CHOICES,
              default: "default",
              description:
                "default: the project's default environment. shared: reuse this thread's environment.",
            },
            provider: { type: "string", description: "Provider id (defaults to the current thread's provider)" },
            model: { type: "string", description: "Model id" },
            json: { type: "boolean", description: "Emit JSON" },
          },
          async run({ positionals, options }, ctx) {
            const parentThreadId = requireThread(ctx);
            const child = await spawnChild(bb.sdk, {
              parentThreadId,
              prompt: positionals.prompt,
              environment: options.environment,
              title: options.title,
              providerId: options.provider,
              model: options.model,
            }).catch(cliFailure);
            return {
              exitCode: 0,
              stdout: options.json
                ? JSON.stringify({ threadId: child.id, parentThreadId })
                : `Started @thread:${child.id}. It reports when done, blocked, or needing a decision.`,
            };
          },
        }),
        report: cliCommand({
          summary: "Send one report from this child thread to its parent",
          positionals: [
            { name: "kind", description: "done, blocked, decision, or status", required: true },
            { name: "message", description: `Report text, at most ${REPORT_MAX_CHARS} characters`, required: true },
          ],
          async run({ positionals }, ctx) {
            const childThreadId = requireThread(ctx);
            const parsed = reportParameters.safeParse({
              kind: positionals.kind,
              message: positionals.message,
            });
            if (!parsed.success) {
              throw new PluginCliError(
                `kind must be one of ${REPORT_KINDS.join(", ")} and message must be 1-${REPORT_MAX_CHARS} characters.`,
                { code: "invalid_report" },
              );
            }
            const { parentThreadId } = await sendReport(
              bb.sdk,
              childThreadId,
              parsed.data.kind,
              parsed.data.message,
            ).catch(cliFailure);
            return {
              exitCode: 0,
              stdout: `Reported ${parsed.data.kind} to @thread:${parentThreadId}.`,
            };
          },
        }),
        children: cliCommand({
          summary: "List the current thread's Messaging children",
          options: {
            thread: { type: "string", description: "Parent thread id (defaults to the current thread)" },
            json: { type: "boolean", description: "Emit JSON" },
          },
          async run({ options }, ctx) {
            const parentThreadId = options.thread ?? requireThread(ctx);
            const children = await listChildren(bb.sdk, bb.pluginId, parentThreadId);
            return {
              exitCode: 0,
              stdout: options.json ? JSON.stringify(children) : formatChildren(children),
            };
          },
        }),
        "request-status": cliCommand({
          summary: "Ask a Messaging child for a status report",
          positionals: [
            { name: "child", description: "Child thread id", required: true },
          ],
          async run({ positionals }, ctx) {
            const parentThreadId = requireThread(ctx);
            await requestStatus(bb.sdk, parentThreadId, positionals.child).catch(
              cliFailure,
            );
            return {
              exitCode: 0,
              stdout: `Asked @thread:${positionals.child} for a status report.`,
            };
          },
        }),
      },
    }),
  );

  bb.events.on("thread.failed", async ({ thread, error }) => {
    if (thread.originPluginId !== bb.pluginId) return;
    const reason = error === null ? "" : `\n\n${error.slice(0, 2000)}`;
    await notifyParent(
      bb.sdk,
      thread.id,
      `Messaging notice: @thread:${thread.id} failed. Review the thread before deciding next steps.${reason}`,
    );
  });

  bb.events.on("interaction.pending", async ({ thread }) => {
    if (thread.originPluginId !== bb.pluginId) return;
    await notifyParent(
      bb.sdk,
      thread.id,
      `Messaging notice: @thread:${thread.id} is waiting on an approval or answer and cannot continue until someone responds in that thread.`,
    );
  });
}
