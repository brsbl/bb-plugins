import { defineRpcContract } from "@get-bb/plugin-sdk";
import { z } from "zod";
import { rowSchema, statusSchema } from "./model.js";

const empty = z.object({}).strict().nullish();

export const stateSchema = z.object({
  /** The last complete table, or null before the first import or update. */
  snapshot: z.object({ updatedAt: z.string(), rows: z.array(rowSchema) }).nullable(),
  status: statusSchema,
});

export const contract = defineRpcContract({
  /** The saved table and the update status. */
  getState: { input: empty, output: stateSchema },
  /** Starts an update unless one is running; returns at once with the status. */
  refresh: { input: empty, output: statusSchema },
});

export type State = z.infer<typeof stateSchema>;
