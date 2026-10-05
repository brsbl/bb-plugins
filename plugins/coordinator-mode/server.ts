import { cliCommand, defineCli, defineRpcContract, type BbPluginApi, type PluginCliContext } from "@get-bb/plugin-sdk";
import { z } from "zod";

import type { CoordinatorTemplate, RpcMethods } from "./contracts";
import { createService } from "./service";

const POLL_INTERVAL_MS = 60_000;

const id = z.string().min(1).max(200);
/** Templates are validated with parseTemplate inside each handler, which gives readable errors. */
const template = z.custom<CoordinatorTemplate>((value) => typeof value === "object" && value !== null && !Array.isArray(value), {
  message: "Template must be an object.",
});
const ok = z.custom<{ ok: true }>();
const output = <M extends keyof RpcMethods>() => z.custom<ReturnType<RpcMethods[M]>>();

export const rpcContract = defineRpcContract({
  status: { input: z.object({ threadId: id }), output: output<"status">() },
  templates: { input: z.object({}).strict(), output: output<"templates">() },
  turnOn: { input: z.object({ threadId: id, template }), output: ok },
  createNew: { input: z.object({ projectId: id, template }), output: output<"createNew">() },
  turnOff: { input: z.object({ threadId: id }), output: ok },
  setPaused: { input: z.object({ threadId: id, paused: z.boolean() }), output: ok },
  setAutoApprove: { input: z.object({ threadId: id, autoApprove: z.boolean() }), output: ok },
  updateTemplate: { input: z.object({ threadId: id, template }), output: ok },
  restartCoordinator: { input: z.object({ threadId: id }), output: ok },
  approveItem: { input: z.object({ itemId: id }), output: ok },
  rejectItem: { input: z.object({ itemId: id, reason: z.string().max(2000) }), output: ok },
  confirmItem: { input: z.object({ itemId: id }), output: ok },
  cutItem: { input: z.object({ itemId: id }), output: ok },
  setLink: { input: z.object({ itemId: id, link: z.string().max(2000) }), output: ok },
  resolveApproval: {
    input: z.object({ approvalId: id, approve: z.boolean(), reason: z.string().max(2000).optional() }),
    output: ok,
  },
  markOpened: { input: z.object({ threadId: id }), output: ok },
  describeProcess: { input: z.object({ description: z.string().min(1).max(4000), projectId: id }), output: output<"describeProcess">() },
});

const json = (value: unknown) => ({ exitCode: 0, stdout: `${JSON.stringify(value, null, 2)}\n` });
const threadOf = (option: string | undefined, ctx: PluginCliContext): string => {
  const threadId = option ?? ctx.threadId;
  if (!threadId) throw new Error("Pass --thread with the coordinator thread ID, or run this from that thread.");
  return threadId;
};

export default function plugin(bb: BbPluginApi): void {
  const service = createService(bb);

  bb.rpc.register(rpcContract, {
    status: service.rpc.status,
    templates: () => service.rpc.templates(),
    turnOn: service.rpc.turnOn,
    createNew: service.rpc.createNew,
    turnOff: service.rpc.turnOff,
    setPaused: service.rpc.setPaused,
    setAutoApprove: service.rpc.setAutoApprove,
    updateTemplate: service.rpc.updateTemplate,
    restartCoordinator: service.rpc.restartCoordinator,
    approveItem: service.rpc.approveItem,
    rejectItem: service.rpc.rejectItem,
    confirmItem: service.rpc.confirmItem,
    cutItem: service.rpc.cutItem,
    setLink: service.rpc.setLink,
    resolveApproval: service.rpc.resolveApproval,
    markOpened: service.rpc.markOpened,
    describeProcess: service.rpc.describeProcess,
  });

  // Coordinator tools. Each re-checks membership in the store-backed cache.
  bb.agents.registerTool({
    name: "coordinator_add_item",
    description: "Add a tracker item for one of the user's asks. Without startSubThread it is proposed for the user to confirm. Use startSubThread true for intake-prefix messages; prompt is the sub-thread's first message.",
    parameters: z.object({
      title: z.string().min(1).max(200),
      startSubThread: z.boolean().optional(),
      prompt: z.string().min(1).max(20_000).optional(),
    }).strict(),
    execute: (input, ctx) => service.tools.addItem(ctx.threadId, input),
  });
  bb.agents.registerTool({
    name: "coordinator_start_sub_thread",
    description: "Start a sub-thread for a confirmed item, checked against the coordinator rules. role primary does the item's work and PR; reviewer reviews it and records the verdict; helper is for fixes or other side work. Name it per the sub-thread rules.",
    parameters: z.object({
      itemId: id,
      prompt: z.string().min(1).max(20_000),
      title: z.string().min(1).max(200).optional(),
      role: z.enum(["primary", "helper", "reviewer"]).optional(),
    }).strict(),
    execute: (input, ctx) => service.tools.startSubThread(ctx.threadId, input),
  });
  bb.agents.registerTool({
    name: "coordinator_archive_sub_thread",
    description: "Archive one of this coordinator's sub-threads, checked against the coordinator rules.",
    parameters: z.object({ threadId: id }).strict(),
    execute: (input, ctx) => service.tools.archiveSubThread(ctx.threadId, input),
  });
  bb.agents.registerTool({
    name: "coordinator_merge_pr",
    description: "Merge the PR on an item's primary sub-thread, checked against the coordinator rules. Never merge with gh pr merge directly.",
    parameters: z.object({ itemId: id }).strict(),
    execute: (input, ctx) => service.tools.mergePr(ctx.threadId, input),
  });
  bb.agents.registerTool({
    name: "coordinator_set_link",
    description: "Set an item's link, such as a published post or release URL.",
    parameters: z.object({ itemId: id, link: z.string().url().max(2000) }).strict(),
    execute: (input, ctx) => service.tools.setLink(ctx.threadId, input),
  });
  bb.agents.registerTool({
    name: "coordinator_briefing",
    description: "Get the briefing: what changed since the user last looked, what needs them, and what's next, plus item IDs. Share it with the user as written.",
    parameters: z.object({}).strict(),
    execute: (_input, ctx) => service.tools.briefing(ctx.threadId),
  });
  bb.agents.registerTool({
    name: "coordinator_cut_item",
    description: "Cut an item the user no longer wants. Only do this when the user asks.",
    parameters: z.object({ itemId: id }).strict(),
    execute: (input, ctx) => service.tools.cutItem(ctx.threadId, input),
  });
  // Reviewer sub-thread tool.
  bb.agents.registerTool({
    name: "coordinator_review_verdict",
    description: "Record your review verdict for the item this sub-thread reviews: pass true, or pass false with findings.",
    parameters: z.object({ pass: z.boolean(), findings: z.string().max(10_000).optional() }).strict(),
    execute: (input, ctx) => service.tools.reviewVerdict(ctx.threadId, input),
  });

  bb.agents.configure((context) => service.agentConfiguration(context.thread.id));

  bb.events.on("thread.active", ({ thread }) => service.onThreadEvent("active", thread));
  bb.events.on("thread.idle", ({ thread }) => service.onThreadEvent("idle", thread));
  bb.events.on("thread.failed", ({ thread }) => service.onThreadEvent("failed", thread));
  bb.events.on("thread.archived", ({ thread }) => service.onThreadEvent("archived", thread));
  bb.events.on("interaction.pending", ({ thread, interaction }) => service.onInteractionPending(thread, interaction));

  bb.background.service("evidence-poll", {
    async start(signal) {
      while (!signal.aborted) {
        try {
          await service.tick();
        } catch (error) {
          bb.log.warn(`Coordinator Mode poll failed: ${String(error)}`);
        }
        await new Promise<void>((resolveWait) => {
          if (signal.aborted) {
            resolveWait();
            return;
          }
          const done = () => {
            clearTimeout(timer);
            signal.removeEventListener("abort", done);
            resolveWait();
          };
          const timer = setTimeout(done, POLL_INTERVAL_MS);
          signal.addEventListener("abort", done, { once: true });
        });
      }
    },
  });

  const thread = { type: "string", description: "Coordinator thread ID; defaults to the invoking thread" } as const;
  bb.cli.register(defineCli({
    name: "coordinator-mode",
    summary: "Inspect Coordinator Mode coordinators",
    commands: {
      status: cliCommand({
        summary: "Show a coordinator's state, items, and pending approvals as JSON",
        options: { thread },
        run: async (input, ctx) => json(await service.rpc.status({ threadId: threadOf(input.options.thread, ctx) })),
      }),
      briefing: cliCommand({
        summary: "Print the current briefing without marking it opened",
        options: { thread },
        run: (input, ctx) => ({ exitCode: 0, stdout: `${service.briefingMarkdown(threadOf(input.options.thread, ctx))}\n` }),
      }),
      off: cliCommand({
        summary: "Turn Coordinator Mode off for a thread, keeping the thread",
        options: { thread },
        run: (input, ctx) => json(service.rpc.turnOff({ threadId: threadOf(input.options.thread, ctx) })),
      }),
    },
  }));

  bb.onDispose(() => service.dispose());
  bb.log.info("Coordinator Mode loaded");
}
