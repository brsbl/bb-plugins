import { defineRpcContract } from "@get-bb/plugin-sdk";
import { z } from "zod";
import { mediaSchema } from "./model.js";

export const hostContract = defineRpcContract({
  inspect: {
    input: z.object({path: z.string().min(1), rootPath: z.string().min(1), fps: z.number().positive().optional(), probe: z.boolean().default(true)}).strict(),
    output: mediaSchema.omit({hostId: true}),
  },
});
