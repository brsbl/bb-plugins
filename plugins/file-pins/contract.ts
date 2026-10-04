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
/** Pin IDs kept behind the strip's overflow control, like bb's hidden footer items. */
export const moreSchema = z.array(id).max(MAX_PINS);
export const CHANGED = "pins-changed";
const status = z.enum(["available", "missing", "unavailable"]);
export const referenceSchema = pinSchema.extend({ hostName: z.string(), status, moss: z.boolean() });
export type Reference = z.infer<typeof referenceSchema>;
export const recentSchema = z.object({ hostId: id, path: filePath, name: z.string(), moss: z.boolean() });
export type RecentFile = z.infer<typeof recentSchema>;

export const hostContract = defineRpcContract({
  recentFiles: {
    input: z.object({ paths: z.array(filePath).max(40), cwd: filePath }).strict(),
    output: z.object({ files: z.array(z.object({ path: filePath, name: z.string(), moss: z.boolean() })) }),
  },
  home: { input: z.object({}).strict(), output: z.object({ path: filePath }) },
  mossRoot: { input: z.object({}).strict(), output: z.object({ path: filePath.nullable() }) },
  inspect: {
    input: z.object({ paths: z.array(filePath).max(MAX_PINS) }).strict(),
    output: z.object({ files: z.array(z.object({ path: filePath, status, moss: z.boolean() })) }),
  },
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
  recent: {
    input: z.object({ threadId: id }).strict(),
    output: z.object({ files: z.array(recentSchema).max(12) }),
  },
  arrange: {
    input: z.object({ threadId: id, order: z.array(id).max(MAX_PINS), more: moreSchema }).strict(),
    output: z.object({ pins: pinsSchema, more: moreSchema }),
  },
  inspect: {
    input: z.object({ threadId: id }).strict(),
    output: z.object({ pins: z.array(referenceSchema).max(MAX_PINS), more: moreSchema }),
  },
  search: {
    input: z.object({ threadId: id, hostId: id, query: z.string().max(500) }).strict(),
    output: z.object({
      root: filePath,
      paths: z.array(z.object({ path: filePath, name: z.string(), hostId: id, hostName: z.string(), moss: z.boolean() })),
      truncated: z.boolean(),
    }),
  },
  remove: {
    input: z.object({ threadId: id, pinId: id }).strict(),
    output: z.object({ undoToken: id.nullable() }),
  },
  undo: {
    input: z.object({ threadId: id, undoToken: id }).strict(),
    output: pinSchema,
  },
  repin: {
    input: z.object({ threadId: id, pinId: id, hostId: id, path: filePath }).strict(),
    output: pinSchema,
  },
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
    /** `unpinned` adds a new file to the ⋯ list instead of the strip. */
    input: z.object({ threadId: id, hostId: id, path: filePath, unpinned: z.boolean().optional() }).strict(),
    output: pinSchema,
  },
  unpin: {
    input: z.object({ threadId: id, pinId: id }).strict(),
    output: z.object({ removed: z.boolean() }),
  },
});
