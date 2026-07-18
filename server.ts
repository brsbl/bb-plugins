import type { BbPluginApi } from "@bb/plugin-sdk";
import { z } from "zod";

import {
  buildWorkerPrompt,
  parseShaperOutput,
  type ParsedShaperOutput,
} from "./core.js";

const REQUEST_TTL_MS = 24 * 60 * 60 * 1_000;
const REQUEST_PREFIX = "request:";
const THREAD_PREFIX = "thread:";

const requestIdSchema = z.string().uuid();

const enhancementBaseSchema = z.object({
  requestId: requestIdSchema,
  helperThreadId: z.string().min(1),
  createdAt: z.number().int().nonnegative(),
});

const enhancementRecordSchema = z.discriminatedUnion("status", [
  enhancementBaseSchema.extend({ status: z.literal("running") }),
  enhancementBaseSchema.extend({
    status: z.literal("complete"),
    enhancedPrompt: z.string().min(1),
    assumptions: z.string().min(1).nullable(),
    completedAt: z.number().int().nonnegative(),
  }),
  enhancementBaseSchema.extend({
    status: z.literal("failed"),
    error: z.string().min(1),
    completedAt: z.number().int().nonnegative(),
  }),
]);

type EnhancementRecord = z.infer<typeof enhancementRecordSchema>;
type RunningRecord = Extract<EnhancementRecord, { status: "running" }>;

export const rpcContract = {
  startEnhancement: {
    input: z.object({
      requestId: requestIdSchema,
      draft: z
        .string()
        .min(1)
        .max(64_000)
        .refine((value) => value.trim().length > 0, "Draft cannot be blank"),
      projectId: z.string().min(1),
      sourceThreadId: z.string().min(1).nullable(),
    }),
    output: z.object({
      requestId: requestIdSchema,
      helperThreadId: z.string().min(1),
    }),
  },
  getEnhancement: {
    input: z.object({ requestId: requestIdSchema }),
    output: enhancementRecordSchema.nullable(),
  },
} as const;

function requestKey(requestId: string): string {
  return `${REQUEST_PREFIX}${requestId}`;
}

function threadKey(threadId: string): string {
  return `${THREAD_PREFIX}${threadId}`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function canFallBackFromSideChat(error: unknown): boolean {
  return /cannot fork|cannot spawn child|hierarchy|source has no active session/i.test(
    errorMessage(error),
  );
}

export default async function plugin(bb: BbPluginApi) {
  async function readRecord(
    requestId: string,
  ): Promise<EnhancementRecord | null> {
    const value = await bb.storage.kv.get<unknown>(requestKey(requestId));
    if (value === undefined) return null;
    const parsed = enhancementRecordSchema.safeParse(value);
    if (!parsed.success) {
      bb.log.warn(`discarding invalid enhancement record ${requestId}`);
      await bb.storage.kv.delete(requestKey(requestId));
      return null;
    }
    return parsed.data;
  }

  async function writeRecord(record: EnhancementRecord): Promise<void> {
    await bb.storage.kv.set(requestKey(record.requestId), record);
  }

  async function archiveHelper(threadId: string): Promise<void> {
    try {
      await bb.sdk.threads.archive({ threadId });
    } catch (error) {
      bb.log.warn(
        `could not archive Prompt Shaper helper ${threadId}: ${errorMessage(error)}`,
      );
    }
  }

  async function finish(
    threadId: string,
    result: ParsedShaperOutput | { error: string },
  ): Promise<void> {
    const requestId = await bb.storage.kv.get<string>(threadKey(threadId));
    if (requestId === undefined) return;
    const current = await readRecord(requestId);
    if (current === null || current.status !== "running") return;

    const completedAt = Date.now();
    const next: EnhancementRecord =
      "error" in result
        ? {
            ...current,
            status: "failed",
            error: result.error,
            completedAt,
          }
        : {
            ...current,
            status: "complete",
            enhancedPrompt: result.prompt,
            assumptions: result.assumptions,
            completedAt,
          };

    await writeRecord(next);
    bb.realtime.publish("enhancement-changed", { requestId });
    await bb.storage.kv.delete(threadKey(threadId));
    await archiveHelper(threadId);
  }

  async function finishFromOutput(
    threadId: string,
    assistantText: string | null,
  ): Promise<void> {
    const parsed = parseShaperOutput(assistantText ?? "");
    if (parsed === null) {
      await finish(threadId, {
        error:
          "The shaping agent did not return an enhanced prompt. Try again or use /prompt-shaper directly.",
      });
      return;
    }
    await finish(threadId, parsed);
  }

  async function reconcileHelper(threadId: string): Promise<void> {
    const thread = await bb.sdk.threads.get({ threadId });
    if (thread.status === "idle") {
      const { output } = await bb.sdk.threads.output({ threadId });
      await finishFromOutput(threadId, output);
    } else if (thread.status === "error") {
      await finish(threadId, { error: "The shaping agent failed." });
    }
  }

  async function spawnHelper(input: {
    draft: string;
    projectId: string;
    sourceThreadId: string | null;
  }) {
    if (input.sourceThreadId === null) {
      return bb.sdk.threads.spawn({
        projectId: input.projectId,
        prompt: buildWorkerPrompt({ draft: input.draft }),
        environment: { type: "project-default" },
        permissionMode: "auto",
        visibility: "hidden",
        title: "Prompt Shaper",
      });
    }

    const source = await bb.sdk.threads.get({
      threadId: input.sourceThreadId,
    });
    if (source.projectId !== input.projectId) {
      throw new Error("Source thread does not belong to this composer project");
    }
    const execution = await bb.sdk.threads.defaultExecutionOptions({
      threadId: input.sourceThreadId,
    });
    const environment =
      source.environmentId === null
        ? ({ type: "project-default" } as const)
        : ({ type: "reuse", environmentId: source.environmentId } as const);

    if (source.canSpawnChild && execution !== null) {
      try {
        return await bb.sdk.threads.spawn({
          projectId: input.projectId,
          prompt: buildWorkerPrompt({ draft: input.draft }),
          environment,
          providerId: source.providerId,
          model: execution.model,
          reasoningLevel: execution.reasoningLevel,
          serviceTier: execution.serviceTier,
          permissionMode: "auto",
          sourceThreadId: input.sourceThreadId,
          originKind: "side-chat",
          visibility: "hidden",
          title: "Prompt Shaper",
        });
      } catch (error) {
        if (!canFallBackFromSideChat(error)) throw error;
        bb.log.info(
          `side-chat unavailable for ${input.sourceThreadId}; using an inspecting helper`,
        );
      }
    }

    return bb.sdk.threads.spawn({
      projectId: input.projectId,
      prompt: buildWorkerPrompt({
        draft: input.draft,
        sourceThreadId: input.sourceThreadId,
        inspectSourceThread: true,
      }),
      environment,
      providerId: source.providerId,
      ...(execution === null
        ? {}
        : {
            model: execution.model,
            reasoningLevel: execution.reasoningLevel,
            serviceTier: execution.serviceTier,
          }),
      permissionMode: "auto",
      visibility: "hidden",
      title: "Prompt Shaper",
    });
  }

  bb.rpc.register(rpcContract, {
    async startEnhancement(input) {
      if ((await readRecord(input.requestId)) !== null) {
        throw new Error(
          `Enhancement request ${input.requestId} already exists`,
        );
      }

      let helperThreadId: string | null = null;
      try {
        const helper = await spawnHelper(input);
        helperThreadId = helper.id;
        const record: RunningRecord = {
          requestId: input.requestId,
          helperThreadId,
          status: "running",
          createdAt: Date.now(),
        };
        await writeRecord(record);
        await bb.storage.kv.set(threadKey(helperThreadId), input.requestId);
        await reconcileHelper(helperThreadId);
        return { requestId: input.requestId, helperThreadId };
      } catch (error) {
        if (helperThreadId !== null) {
          await archiveHelper(helperThreadId);
        }
        throw error;
      }
    },
    async getEnhancement({ requestId }) {
      const record = await readRecord(requestId);
      if (record?.status === "running") {
        try {
          await reconcileHelper(record.helperThreadId);
        } catch (error) {
          bb.log.warn(
            `could not reconcile Prompt Shaper helper ${record.helperThreadId}: ${errorMessage(error)}`,
          );
        }
      }
      return readRecord(requestId);
    },
  });

  bb.events.on("thread.idle", ({ thread, lastAssistantText }) =>
    finishFromOutput(thread.id, lastAssistantText),
  );
  bb.events.on("thread.failed", ({ thread, error }) =>
    finish(thread.id, {
      error: error?.trim() || "The shaping agent failed.",
    }),
  );

  const now = Date.now();
  for (const key of await bb.storage.kv.list(REQUEST_PREFIX)) {
    const requestId = key.slice(REQUEST_PREFIX.length);
    const record = await readRecord(requestId);
    if (record !== null && now - record.createdAt > REQUEST_TTL_MS) {
      await bb.storage.kv.delete(key);
      await bb.storage.kv.delete(threadKey(record.helperThreadId));
    }
  }

  bb.log.info("loaded composer enhancement action");
}
