import { defineRpcContract } from "@get-bb/plugin-sdk";
import { z } from "zod";
import { mediaSchema } from "./model.js";

export const hostContract = defineRpcContract({
  readChunk: {
    input: z.object({
      path: z.string().min(1), size: z.number().int().nonnegative(), modifiedAt: z.number(),
      start: z.number().int().nonnegative(), length: z.number().int().min(1).max(256 * 1024),
    }).strict(),
    output: z.object({data: z.string().max(350_000)}).strict(),
  },
  inspect: {
    input: z.object({path: z.string().min(1), rootPath: z.string().min(1), fps: z.number().positive().optional(), probe: z.boolean().default(true)}).strict(),
    output: mediaSchema.omit({hostId: true}),
  },
});
