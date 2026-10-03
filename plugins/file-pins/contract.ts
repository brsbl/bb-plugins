import { defineRpcContract } from "@get-bb/plugin-sdk";
import { z } from "zod";

const id = z.string().min(1).max(200);
export const filePath = z.string().min(1).max(4096).refine((value) => !value.includes("\0"), "Invalid file path");
export const pinSchema = z.object({
  id, hostId: id, path: filePath, name: z.string().min(1).max(4096), createdAt: z.string(),
}).strict();
export type Pin = z.infer<typeof pinSchema>;
export const pinsSchema = z.array(pinSchema).max(40);
export const MAX_PINS = 40;
export const CHANGED = "pins-changed";

export const hostContract = defineRpcContract({
  openMossNote: {
    input: z.object({ path: filePath }).strict(),
    output: z.object({ opened: z.boolean() }).strict(),
  },
  resolveFile: {
    input: z.object({ path: filePath, cwd: filePath.optional() }).strict(),
    output: z.object({ path: filePath, name: z.string().min(1) }).strict(),
  },
});
export const rpcContract = defineRpcContract({
  openMossNote: {
    input: z.object({ threadId: id, pinId: id }).strict(),
    output: z.object({ opened: z.boolean() }).strict(),
  },
  list: {
    input: z.object({ threadId: id }).strict(),
    output: z.object({ pins: pinsSchema }),
  },
  context: {
    input: z.object({ threadId: id }).strict(),
    output: z.object({
      defaultHostId: id.nullable(),
      hosts: z.array(z.object({ id, name: z.string(), connected: z.boolean() })),
    }),
  },
  pin: {
    input: z.object({ threadId: id, hostId: id, path: filePath }).strict(),
    output: pinSchema,
  },
  unpin: {
    input: z.object({ threadId: id, pinId: id }).strict(),
    output: z.object({ removed: z.boolean() }),
  },
});
