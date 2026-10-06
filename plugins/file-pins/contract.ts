import { defineRpcContract } from "@get-bb/plugin-sdk";
import { z } from "zod";
import { MAX_TITLE_LENGTH, MAX_URL_LENGTH, parseWebUrl } from "./url-pin.js";

const id = z.string().min(1).max(200);
export const filePath = z.string().min(1).max(4096).refine((value) => !value.includes("\0"), "Invalid file path");
export const filePinSchema = z.object({
  id, hostId: id, path: filePath, name: z.string().min(1).max(4096), createdAt: z.string(),
}).strict();
export type FilePin = z.infer<typeof filePinSchema>;
export const webUrl = z.string().refine((value) => parseWebUrl(value) === value, "Pin an http(s) URL");
// Added beside file pins: stored file pins have no `kind`, so they load unchanged.
export const urlPinSchema = z.object({
  id, kind: z.literal("url"), url: webUrl, name: z.string().min(1).max(MAX_URL_LENGTH), createdAt: z.string(),
}).strict();
export type UrlPin = z.infer<typeof urlPinSchema>;
export const pinSchema = z.union([filePinSchema, urlPinSchema]);
export type Pin = z.infer<typeof pinSchema>;
export const isUrlPin = (pin: Pin | Reference): pin is UrlPin => "kind" in pin && pin.kind === "url";
export const pinsSchema = z.array(pinSchema).max(40);
export const MAX_PINS = 40;
/** Pin IDs kept behind the strip's overflow control, like bb's hidden footer items. */
export const moreSchema = z.array(id).max(MAX_PINS);
export const CHANGED = "pins-changed";
/** The composer pill that asks the agent to pin a file; it resolves to the shipped skill. */
export const PIN_MENTION = { provider: "pin", id: "file", label: "Pin" } as const;
const status = z.enum(["available", "missing", "unavailable"]);
export const fileReferenceSchema = filePinSchema.extend({ hostName: z.string(), status });
export type FileReference = z.infer<typeof fileReferenceSchema>;
// URL pins have no host or missing state; they pass through inspection as stored.
export const referenceSchema = z.union([fileReferenceSchema, urlPinSchema]);
export type Reference = z.infer<typeof referenceSchema>;

export const hostContract = defineRpcContract({
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
    // The thread environment's host; bb previews host files only there.
    output: z.object({ pins: z.array(referenceSchema).max(MAX_PINS), more: moreSchema, threadHostId: id.nullable() }),
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
  pin: {
    input: z.object({ threadId: id, hostId: id, path: filePath }).strict(),
    output: pinSchema,
  },
  pinUrl: {
    input: z.object({ threadId: id, url: z.string().max(MAX_URL_LENGTH), title: z.string().max(MAX_TITLE_LENGTH * 4).optional() }).strict(),
    output: urlPinSchema,
  },
  // The favicon of a URL pin's own origin, never an arbitrary address.
  icon: {
    input: z.object({ threadId: id, pinId: id }).strict(),
    output: z.object({ dataUrl: z.string().max(128 * 1024).nullable() }),
  },
  unpin: {
    input: z.object({ threadId: id, pinId: id }).strict(),
    output: z.object({ removed: z.boolean() }),
  },
});
