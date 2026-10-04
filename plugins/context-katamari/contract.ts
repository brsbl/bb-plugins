import { defineRpcContract } from "@get-bb/plugin-sdk";
import { z } from "zod";

/** How many of a thread's most recent turns the context read reports. */
export const TURN_HISTORY_LIMIT = 8;

export const contextUsageSchema = z
  .object({
    /** Tokens the model currently holds for the thread. */
    usedTokens: z.number().nonnegative(),
    /** Where the ball is full: the auto-compact point when known, else the window. */
    capacityTokens: z.number().positive(),
    estimated: z.boolean(),
  })
  .strict();

export type ContextUsage = z.infer<typeof contextUsageSchema>;

export const turnCostSchema = z
  .object({
    turnId: z.string().min(1),
    /** The start of the prompt that began the turn, when bb recorded one. */
    prompt: z.string().nullable(),
    status: z.enum(["running", "completed", "failed", "interrupted"]),
    /** How much the context grew over the turn; negative when it compacted. */
    contextTokens: z.number(),
    /** The thread's first measured turn, whose growth includes bb's system prompt and tools. */
    baseline: z.boolean().optional(),
  })
  .strict();

export type TurnCost = z.infer<typeof turnCostSchema>;

export const threadContextSchema = z
  .object({
    usage: contextUsageSchema.nullable(),
    /**
     * How many times the thread's context has been compacted, capped at the read
     * limit; null when the count could not be read this time.
     */
    compactions: z.number().int().nonnegative().nullable(),
    /** The most recent turns, newest first. */
    turns: z.array(turnCostSchema).max(TURN_HISTORY_LIMIT).optional(),
  })
  .strict();

export type ThreadContext = z.infer<typeof threadContextSchema>;

/** Realtime channel the server announces each new compaction on. */
export const COMPACTED_CHANNEL = "compacted";

export const compactedSignalSchema = z
  .object({
    threadId: z.string().min(1),
    /** The `thread/compacted` event's sequence number, unique within the thread. */
    seq: z.number().int().nonnegative(),
    /** The thread's compaction count including this one, capped at the read limit. */
    compactions: z.number().int().positive(),
  })
  .strict();

export type CompactedSignal = z.infer<typeof compactedSignalSchema>;

export const contextKatamariRpcContract = defineRpcContract({
  readThreadContext: {
    input: z.object({ threadId: z.string().min(1).max(200) }).strict(),
    output: threadContextSchema,
  },
});
