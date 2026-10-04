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
export const referenceSchema = pinSchema.extend({ hostName: z.string(), status });
export type Reference = z.infer<typeof referenceSchema>;
/** Where the pin picker searches: a folder on one machine. */
export const scopeSchema = z.object({ hostId: id, path: filePath }).strict();
export type Scope = z.infer<typeof scopeSchema>;
const listingSchema = z.object({
  directory: z.string(), parent: z.string().nullable(),
  entries: z.array(z.object({ kind: z.enum(["directory", "file"]), name: z.string(), path: z.string() })),
});
export type DirectoryListing = z.infer<typeof listingSchema>;

export const hostContract = defineRpcContract({
  home: { input: z.object({}).strict(), output: z.object({ path: filePath }) },
  inspect: {
    input: z.object({ paths: z.array(filePath).max(MAX_PINS) }).strict(),
    output: z.object({ files: z.array(z.object({ path: filePath, status })) }),
  },
  resolveFile: {
    input: z.object({ path: filePath, cwd: filePath.optional() }).strict(),
    output: z.object({ path: filePath, name: z.string().min(1) }).strict(),
  },
});
export const rpcContract = defineRpcContract({
  arrange: {
    input: z.object({ threadId: id, order: z.array(id).max(MAX_PINS), more: moreSchema }).strict(),
    output: z.object({ pins: pinsSchema, more: moreSchema }),
  },
  inspect: {
    input: z.object({ threadId: id }).strict(),
    output: z.object({ pins: z.array(referenceSchema).max(MAX_PINS), more: moreSchema }),
  },
  search: {
    /** `root` defaults to the thread's workspace on its machine, otherwise the machine's home. */
    input: z.object({ threadId: id, hostId: id, root: filePath.optional(), query: z.string().max(500) }).strict(),
    output: z.object({ root: filePath, paths: z.array(z.object({ path: filePath, name: z.string() })), truncated: z.boolean() }),
  },
  directory: {
    input: z.object({ threadId: id, hostId: id, path: filePath.optional() }).strict(),
    output: listingSchema,
  },
  setScope: {
    input: z.object({ threadId: id, scope: scopeSchema }).strict(),
    output: z.object({ scope: scopeSchema }),
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
  list: {
    input: z.object({ threadId: id }).strict(),
    output: z.object({ pins: pinsSchema }),
  },
  context: {
    input: z.object({ threadId: id }).strict(),
    output: z.object({
      defaultHostId: id.nullable(),
      hosts: z.array(z.object({ id, name: z.string(), connected: z.boolean() })),
      /** The last chosen search scope, else the thread workspace, else the machine's home. */
      scope: scopeSchema.nullable(),
    }),
  },
  pin: {
    /** `unpinned` adds a new file to the ⋯ list instead of the strip. */
    input: z.object({ threadId: id, hostId: id, path: filePath, cwd: filePath.optional(), unpinned: z.boolean().optional() }).strict(),
    output: pinSchema,
  },
  unpin: {
    input: z.object({ threadId: id, pinId: id }).strict(),
    output: z.object({ removed: z.boolean() }),
  },
});
