import type { BbPluginApi } from "@bb/plugin-sdk";
import { z } from "zod";

import {
  buildWorkerPrompt,
  parseShaperOutput,
  type ParsedShaperOutput,
} from "./core.js";
import { createHistoryMaintenance } from "./history.js";

const REQUEST_TTL_MS = 24 * 60 * 60 * 1_000;
const REQUEST_PREFIX = "request:";
const THREAD_PREFIX = "thread:";
const CANCELLATION_PREFIX = "cancellation:";

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
const cancellationRecordSchema = z.object({
  createdAt: z.number().int().nonnegative(),
});

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
  cancelEnhancement: {
    input: z.object({ requestId: requestIdSchema }),
    output: z.object({ cancelled: z.literal(true) }),
  },
} as const;

function requestKey(requestId: string): string {
  return `${REQUEST_PREFIX}${requestId}`;
}

function threadKey(threadId: string): string {
  return `${THREAD_PREFIX}${threadId}`;
}

function cancellationKey(requestId: string): string {
  return `${CANCELLATION_PREFIX}${requestId}`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function optionValue(argv: string[], name: string): string | undefined {
  const index = argv.indexOf(name);
  if (index < 0) return undefined;
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

function integerOption(
  argv: string[],
  name: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const raw = optionValue(argv, name);
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} must be an integer from ${minimum} to ${maximum}`);
  }
  return value;
}

function requiredOption(argv: string[], name: string): string {
  const value = optionValue(argv, name);
  if (value === undefined) throw new Error(`${name} is required`);
  return value;
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

  async function cancellationRequested(requestId: string): Promise<boolean> {
    return (await bb.storage.kv.get(cancellationKey(requestId))) !== undefined;
  }

  async function clearRequest(
    requestId: string,
    helperThreadId: string,
  ): Promise<void> {
    await bb.storage.kv.delete(requestKey(requestId));
    await bb.storage.kv.delete(threadKey(helperThreadId));
  }

  async function archiveHelper(threadId: string): Promise<void> {
    try {
      await bb.sdk.threads.archive({ threadId });
    } catch (error) {
      bb.log.warn(
        `could not archive Improve Prompt helper ${threadId}: ${errorMessage(error)}`,
      );
    }
  }

  async function cancelHelper(threadId: string): Promise<void> {
    try {
      await bb.sdk.threads.stop({ threadId });
    } catch (error) {
      bb.log.warn(
        `could not stop Improve Prompt helper ${threadId}: ${errorMessage(error)}`,
      );
    }
    await archiveHelper(threadId);
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

    if (await cancellationRequested(requestId)) return;
    await writeRecord(next);
    if (await cancellationRequested(requestId)) {
      await clearRequest(requestId, threadId);
      return;
    }
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
        title: "Improve Prompt",
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
    return bb.sdk.threads.spawn({
      projectId: input.projectId,
      prompt: buildWorkerPrompt({ draft: input.draft }),
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
      title: "Improve Prompt",
    });
  }

  const historyMaintenance = createHistoryMaintenance(bb);
  await historyMaintenance.prepare();
  bb.events.on("thread.created", async ({ thread }) => {
    await historyMaintenance.observeCreated(thread);
  });
  bb.events.on("thread.idle", async ({ thread }) => {
    await historyMaintenance.observeThread(thread);
  });
  bb.events.on("thread.deleted", async ({ thread }) => {
    await historyMaintenance.forgetThread(thread.id);
  });
  bb.cli.register({
    name: "prompt-shaper",
    summary: "Maintain Prompt Shaper from incremental bb thread history",
    commands: [
      {
        name: "history",
        summary: "Scan new user-authored thread history through the SDK",
        usage: "bb prompt-shaper history <scan|advance|release> [options]",
      },
    ],
    async run(argv, context) {
      try {
        if (argv[0] !== "history") {
          return {
            exitCode: 2,
            stderr:
              "Usage: bb prompt-shaper history <scan|advance|release> [options]\n",
          };
        }
        const action = argv[1];
        if (action === "scan") {
          const maxBytes = integerOption(
            argv,
            "--max-bytes",
            262_144,
            1,
            900_000,
          );
          const result = await historyMaintenance.scan({
            limit: integerOption(argv, "--limit", 200, 1, 1_000),
            maxBytes,
            maxMessageBytes: integerOption(
              argv,
              "--max-message-bytes",
              8_192,
              1,
              maxBytes,
            ),
            leaseSeconds: integerOption(
              argv,
              "--lease-seconds",
              6 * 60 * 60,
              60,
              86_400,
            ),
            forceReconcile: argv.includes("--reconcile"),
            signal: context.signal,
          });
          return {
            exitCode: 0,
            stdout: `${JSON.stringify(result, null, 2)}\n`,
          };
        }
        if (action === "advance") {
          const result = await historyMaintenance.advance({
            leaseId: requiredOption(argv, "--lease-id"),
          });
          return { exitCode: 0, stdout: `${JSON.stringify(result)}\n` };
        }
        if (action === "release") {
          const result = await historyMaintenance.release(
            requiredOption(argv, "--lease-id"),
          );
          return { exitCode: 0, stdout: `${JSON.stringify(result)}\n` };
        }
        return {
          exitCode: 2,
          stderr:
            "Usage: bb prompt-shaper history <scan|advance|release> [options]\n",
        };
      } catch (error) {
        return { exitCode: 1, stderr: `${errorMessage(error)}\n` };
      }
    },
  });

  bb.rpc.register(rpcContract, {
    async startEnhancement(input) {
      let helperThreadId: string | null = null;
      try {
        if (await cancellationRequested(input.requestId)) {
          throw new Error("Enhancement was cancelled.");
        }
        if ((await readRecord(input.requestId)) !== null) {
          throw new Error(
            `Enhancement request ${input.requestId} already exists`,
          );
        }

        const helper = await spawnHelper(input);
        helperThreadId = helper.id;
        if (await cancellationRequested(input.requestId)) {
          await cancelHelper(helperThreadId);
          helperThreadId = null;
          throw new Error("Enhancement was cancelled.");
        }
        const record: RunningRecord = {
          requestId: input.requestId,
          helperThreadId,
          status: "running",
          createdAt: Date.now(),
        };
        await writeRecord(record);
        await bb.storage.kv.set(threadKey(helperThreadId), input.requestId);
        if (await cancellationRequested(input.requestId)) {
          await clearRequest(input.requestId, helperThreadId);
          await cancelHelper(helperThreadId);
          helperThreadId = null;
          throw new Error("Enhancement was cancelled.");
        }
        await reconcileHelper(helperThreadId);
        return { requestId: input.requestId, helperThreadId };
      } catch (error) {
        if (helperThreadId !== null) {
          try {
            await clearRequest(input.requestId, helperThreadId);
          } catch (cleanupError) {
            bb.log.warn(
              `could not clear failed Improve Prompt request ${input.requestId}: ${errorMessage(cleanupError)}`,
            );
          }
          await cancelHelper(helperThreadId);
        }
        throw error;
      } finally {
        await bb.storage.kv.delete(cancellationKey(input.requestId));
      }
    },
    async getEnhancement({ requestId }) {
      const record = await readRecord(requestId);
      if (record?.status === "running") {
        try {
          await reconcileHelper(record.helperThreadId);
        } catch (error) {
          bb.log.warn(
            `could not reconcile Improve Prompt helper ${record.helperThreadId}: ${errorMessage(error)}`,
          );
        }
      }
      return readRecord(requestId);
    },
    async cancelEnhancement({ requestId }) {
      await bb.storage.kv.set(cancellationKey(requestId), {
        createdAt: Date.now(),
      });
      const record = await readRecord(requestId);
      if (record !== null) {
        await clearRequest(requestId, record.helperThreadId);
        await cancelHelper(record.helperThreadId);
      }
      bb.realtime.publish("enhancement-changed", { requestId });
      return { cancelled: true as const };
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
      await clearRequest(requestId, record.helperThreadId);
      if (record.status === "running") {
        await cancelHelper(record.helperThreadId);
      }
    }
  }
  for (const key of await bb.storage.kv.list(CANCELLATION_PREFIX)) {
    const value = await bb.storage.kv.get<unknown>(key);
    const parsed = cancellationRecordSchema.safeParse(value);
    if (!parsed.success || now - parsed.data.createdAt > REQUEST_TTL_MS) {
      await bb.storage.kv.delete(key);
    }
  }

  bb.log.info("loaded composer enhancement action");
}
