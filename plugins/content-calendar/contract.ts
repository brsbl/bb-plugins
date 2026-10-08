import { defineRpcContract } from "@get-bb/plugin-sdk";
import { z } from "zod";
import {
  LIMITS, attachmentSchema, clockTime, formatSchema, httpUrl, isoDate, itemId, itemSchema, repoSchema,
  statusSchema, threadIdSchema, traySchema,
} from "./model.js";

/** Realtime channel published after any item or connection change. Payload: `{ reason }`. */
export const CHANGED = "changed";
/** Settings page path of the nav panel; the inline calendar links here. */
export const PAGE_PATH = "calendar";
/** threadPanelAction id that shows one item's detail beside a chat. */
export const DETAIL_ACTION = "item";

const path = z.string().min(1).max(LIMITS.reference).refine((value) => !value.includes("\0"), "Invalid path");

export const connectionStateSchema = z.enum([
  "needs_client", // no OAuth client ID/secret in settings
  "not_connected", // client saved, never signed in (or disconnected)
  "synced",
  "syncing",
  "offline", // Google unreachable or rate-limited; writes queue
  "reconnect", // refresh token revoked or expired
  "calendar_deleted", // the Content calendar was deleted in Google
]);
export type ConnectionState = z.infer<typeof connectionStateSchema>;

export const statusOutput = z.object({
  state: connectionStateSchema,
  calendarId: z.string().nullable(),
  lastSyncedAt: z.string().nullable(),
  queued: z.number().int(),
  conflicts: z.number().int(),
  /** Human-readable detail for offline / reconnect states. */
  message: z.string().nullable(),
});
export type ConnectionStatus = z.infer<typeof statusOutput>;

const when = z.union([
  z.object({ date: isoDate }).strict(),
  z.object({ tray: traySchema }).strict(),
]);

export const gateInput = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("pr"), repo: repoSchema, number: z.number().int().positive() }).strict(),
  z.object({ kind: z.literal("item"), itemId }).strict(),
  z.object({ kind: z.literal("text"), text: z.string().trim().min(1).max(LIMITS.gateText), url: httpUrl.optional() }).strict(),
]);
export type GateInput = z.infer<typeof gateInput>;

/** A resolved attachment without its ID; file paths are already canonical on their machine. */
export const attachmentInput = z.discriminatedUnion("kind", [
  attachmentSchema.options[0].omit({ id: true }),
  attachmentSchema.options[1].omit({ id: true }),
  attachmentSchema.options[2].omit({ id: true }),
  attachmentSchema.options[3].omit({ id: true }),
]);
export type AttachmentInput = z.infer<typeof attachmentInput>;

export const listInput = z.object({
  from: isoDate.optional(),
  to: isoDate.optional(),
  format: formatSchema.optional(),
  status: statusSchema.optional(),
  tray: traySchema.optional(),
  limit: z.number().int().min(1).max(LIMITS.listMax).optional(),
  cursor: z.string().max(200).optional(),
}).strict();
export type ListInput = z.infer<typeof listInput>;

export const addInput = z.object({
  title: z.string().trim().min(1).max(LIMITS.title),
  format: formatSchema.nullable(),
  when,
  status: statusSchema.optional(),
  target: z.string().max(LIMITS.target).optional(),
  notes: z.string().max(LIMITS.notes).optional(),
}).strict();
export type AddInput = z.infer<typeof addInput>;

export const updateInput = z.object({
  id: itemId,
  title: z.string().trim().min(1).max(LIMITS.title).optional(),
  format: formatSchema.nullable().optional(),
  /** `posted` is the checkbox. Checking a tray item gives it today's date. */
  status: statusSchema.optional(),
  target: z.string().max(LIMITS.target).nullable().optional(),
  notes: z.string().max(LIMITS.notes).optional(),
  time: clockTime.nullable().optional(),
}).strict();
export type UpdateInput = z.infer<typeof updateInput>;

export const moveInput = z.object({
  id: itemId,
  when,
  /** Place before or after another item in the same day or tray. */
  before: itemId.optional(),
  after: itemId.optional(),
}).strict();
export type MoveInput = z.infer<typeof moveInput>;

const id = z.object({ id: itemId }).strict();
const item = itemSchema;
const items = z.array(itemSchema);

/**
 * Calendar operations. The CLI calls the same handlers as the UI, so every
 * method here is also a `bb content-calendar` command.
 */
export const rpcContract = defineRpcContract({
  status: { input: z.object({}).strict(), output: statusOutput },
  /** Dated items in [from, to] plus both trays, for the page and inline calendar. */
  calendar: {
    input: z.object({ from: isoDate, to: isoDate, trays: z.boolean().optional() }).strict(),
    output: z.object({ items, evergreen: items, later: items, status: statusOutput }),
  },
  list: { input: listInput, output: z.object({ items, nextCursor: z.string().nullable() }) },
  show: { input: id, output: item },
  add: { input: addInput, output: item },
  update: { input: updateInput, output: item },
  move: { input: moveInput, output: item },
  gateAdd: { input: z.object({ id: itemId, gate: gateInput }).strict(), output: item },
  gateClear: { input: z.object({ id: itemId, gateId: z.string().min(1).max(16), cleared: z.boolean().optional() }).strict(), output: item },
  gateRemove: { input: z.object({ id: itemId, gateId: z.string().min(1).max(16) }).strict(), output: item },
  attach: { input: z.object({ id: itemId, attachment: attachmentInput }).strict(), output: item },
  /** Attach a file by path on a machine; the server resolves it there first. */
  attachFile: { input: z.object({ id: itemId, machineId: z.string().min(1).max(200), path }).strict(), output: item },
  detach: { input: z.object({ id: itemId, attachmentId: z.string().min(1).max(16) }).strict(), output: item },
  delete: { input: id, output: z.object({ deleted: z.boolean() }) },
  reapply: { input: id, output: item },
  sync: { input: z.object({}).strict(), output: statusOutput },
  export: { input: z.object({}).strict(), output: z.object({ exportedAt: z.string(), items }) },
  /** Called by visible calendar views about every 30s so polling runs every 60s instead of every 10 minutes. */
  visible: { input: z.object({}).strict(), output: z.object({ ok: z.boolean() }) },

  // Google connection. The OAuth client ID and secret live in the plugin's secret settings.
  connectStart: { input: z.object({ calendarId: z.string().min(1).max(300).optional() }).strict(), output: z.object({ authUrl: z.string() }) },
  /** Finish sign-in from the loopback address Google redirected to. */
  connectFinish: { input: z.object({ redirectUrl: z.string().min(1).max(4000) }).strict(), output: statusOutput },
  disconnect: { input: z.object({}).strict(), output: statusOutput },
  restoreCalendar: { input: z.object({}).strict(), output: statusOutput },

  // Mac files, through the plugin's host entry on that machine.
  machines: {
    input: z.object({}).strict(),
    output: z.object({ machines: z.array(z.object({ id: z.string(), name: z.string(), connected: z.boolean() })) }),
  },
  searchFiles: {
    input: z.object({ machineId: z.string().min(1).max(200), query: z.string().max(200) }).strict(),
    output: z.object({ root: z.string(), files: z.array(z.object({ path: z.string(), name: z.string(), relative: z.string() })) }),
  },
  /** File attachment availability, checked when an item opens and every 30s while it stays open. */
  inspectFiles: {
    input: id,
    output: z.object({ files: z.array(z.object({ attachmentId: z.string(), status: z.enum(["available", "missing", "offline"]) })) }),
  },
  /** Opens a Moss note in Moss on its Mac. Any other file returns `preview` for bb's read-only file preview. */
  openAttachment: {
    input: z.object({ id: itemId, attachmentId: z.string().min(1).max(16) }).strict(),
    output: z.discriminatedUnion("opened", [
      z.object({ opened: z.literal("moss") }),
      z.object({ opened: z.literal("preview"), hostId: z.string(), path: z.string() }),
      z.object({ opened: z.literal("url"), url: z.string() }),
    ]),
  },
});
export type RpcContract = typeof rpcContract;

/** The Mac host entry. It searches and checks files, and opens only existing .md files under ~/Moss in Moss. */
export const hostContract = defineRpcContract({
  search: {
    input: z.object({ query: z.string().max(200), limit: z.number().int().min(1).max(100) }).strict(),
    output: z.object({ root: z.string(), files: z.array(z.object({ path: z.string(), name: z.string(), relative: z.string() })) }),
  },
  resolveFile: {
    input: z.object({ path, cwd: path.optional() }).strict(),
    output: z.object({ path: z.string(), name: z.string() }).strict(),
  },
  inspect: {
    input: z.object({ paths: z.array(path).max(LIMITS.attachments) }).strict(),
    output: z.object({ files: z.array(z.object({ path: z.string(), status: z.enum(["available", "missing"]) })) }),
  },
  openInMoss: {
    input: z.object({ path }).strict(),
    output: z.object({ opened: z.boolean(), reason: z.string().optional() }),
  },
});

export { threadIdSchema };
