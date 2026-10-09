import { z } from "zod";

// The item model shared by the server, CLI, page, and inline calendar.

export const FORMATS = ["tweet", "blog", "essay", "site"] as const;
export type Format = (typeof FORMATS)[number];
export const FORMAT_LABELS: Record<Format, string> = {
  tweet: "Tweet",
  blog: "bb blog post",
  essay: "Essay",
  site: "Site page",
};
export const NO_FORMAT_LABEL = "No format";
/** Google Calendar colorId per format: Peacock, Basil, Tangerine, Grape. */
export const FORMAT_COLOR_IDS: Record<Format, string> = { tweet: "7", blog: "10", essay: "6", site: "3" };

export const STATUSES = ["idea", "drafting", "ready", "posted"] as const;
export type Status = (typeof STATUSES)[number];
export const STAGE_LABELS: Record<Exclude<Status, "posted">, string> = { idea: "Idea", drafting: "Drafting", ready: "Ready" };

export const TRAYS = ["evergreen", "later"] as const;
export type Tray = (typeof TRAYS)[number];
export const TRAY_LABELS: Record<Tray, string> = { evergreen: "Evergreen", later: "Later" };

export const SYNC_STATES = ["synced", "queued", "conflict"] as const;
export type SyncState = (typeof SYNC_STATES)[number];

/** The Content calendar's time zone. Dates are never converted through the server clock. */
export const CALENDAR_TIME_ZONE = "America/Los_Angeles";
export const CALENDAR_NAME = "Content";

export const LIMITS = {
  title: 300,
  target: 200,
  notes: 8000,
  gates: 5,
  gateText: 200,
  attachments: 20,
  /** URLs and paths; keeps each extended-property record under Google's 1,024 characters. */
  reference: 900,
  listDefault: 200,
  listMax: 500,
} as const;

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a YYYY-MM-DD date").refine(validDate, "Not a real date");
export const isoMonth = z.string().regex(/^\d{4}-\d{2}$/, "Use a YYYY-MM month");
export const clockTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM between 00:00 and 23:59");
export const itemId = z.string().regex(/^cc_[a-z0-9]{4,32}$/, "Item IDs look like cc_7k2m9q");
export const formatSchema = z.enum(FORMATS);
export const statusSchema = z.enum(STATUSES);
export const traySchema = z.enum(TRAYS);
export const repoSchema = z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/, "Use owner/repo");
export const threadIdSchema = z.string().regex(/^thr_[A-Za-z0-9]+$/, "Thread IDs start with thr_");
const reference = z.string().min(1).max(LIMITS.reference, `Keep URLs and paths to ${LIMITS.reference} characters`);
export const httpUrl = reference.refine((value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}, "Use an http(s) URL");

// Stored gates. Item gates keep only the item they point to; whether they are
// cleared is derived from that item's checkbox every time it is read.
export const storedGateSchema = z.discriminatedUnion("kind", [
  z.object({ id: z.string().min(1).max(16), kind: z.literal("pr"), repo: repoSchema, number: z.number().int().positive(), cleared: z.boolean() }).strict(),
  z.object({ id: z.string().min(1).max(16), kind: z.literal("item"), itemId }).strict(),
  z.object({ id: z.string().min(1).max(16), kind: z.literal("text"), text: z.string().min(1).max(LIMITS.gateText), url: httpUrl.optional(), cleared: z.boolean() }).strict(),
]);
export type StoredGate = z.infer<typeof storedGateSchema>;

/** A gate as read: item gates gain the target's derived state. `title: null` means the item was deleted. */
export const gateSchema = z.discriminatedUnion("kind", [
  z.object({ id: z.string(), kind: z.literal("pr"), repo: z.string(), number: z.number(), cleared: z.boolean() }),
  z.object({ id: z.string(), kind: z.literal("item"), itemId: z.string(), cleared: z.boolean(), title: z.string().nullable(), date: z.string().nullable() }),
  z.object({ id: z.string(), kind: z.literal("text"), text: z.string(), url: z.string().optional(), cleared: z.boolean() }),
]);
export type Gate = z.infer<typeof gateSchema>;

export const attachmentSchema = z.discriminatedUnion("kind", [
  z.object({ id: z.string().min(1).max(16), kind: z.literal("file"), machineId: z.string().min(1).max(200), path: reference, name: z.string().min(1).max(300) }).strict(),
  z.object({ id: z.string().min(1).max(16), kind: z.literal("url"), url: httpUrl, title: z.string().max(300).optional() }).strict(),
  z.object({ id: z.string().min(1).max(16), kind: z.literal("pr"), repo: repoSchema, number: z.number().int().positive() }).strict(),
  z.object({ id: z.string().min(1).max(16), kind: z.literal("thread"), threadId: threadIdSchema, title: z.string().max(300).optional() }).strict(),
]);
export type Attachment = z.infer<typeof attachmentSchema>;

export const conflictSchema = z.object({
  /** Item fields where Google Calendar kept its value. */
  fields: z.array(z.string()),
  /** bb's losing values, written back by reapply. */
  values: z.record(z.string(), z.unknown()),
  message: z.string(),
});
export type Conflict = z.infer<typeof conflictSchema>;

export const itemSchema = z.object({
  id: z.string(),
  title: z.string(),
  format: formatSchema.nullable(),
  status: statusSchema,
  /** YYYY-MM-DD in the calendar's time zone; null for tray items. */
  date: z.string().nullable(),
  /** HH:MM when the Google event has a time of day; moves keep it. */
  time: z.string().nullable(),
  /** Length of a multi-day event. */
  days: z.number().int().min(1),
  tray: traySchema.nullable(),
  target: z.string().nullable(),
  notes: z.string(),
  waitsOn: z.array(gateSchema),
  attachments: z.array(attachmentSchema),
  sync: z.enum(SYNC_STATES),
  conflict: conflictSchema.nullable(),
  /** Fractional order within a day or tray. */
  pos: z.number(),
  /** Set when the item was recreated after a Google-side delete, or similar one-line notices. */
  notice: z.string().nullable(),
  updatedAt: z.string(),
});
export type Item = z.infer<typeof itemSchema>;

/** An item is drawn dashed while any gate is open. */
export function isBlocked(item: Pick<Item, "waitsOn">): boolean {
  return item.waitsOn.some((gate) => !gate.cleared);
}

/** The muted line under the title: format, then the first open gate or the stage. Posted items show only the format. */
export function itemSubtitle(item: Pick<Item, "format" | "status" | "waitsOn">): string {
  const format = item.format ? FORMAT_LABELS[item.format] : NO_FORMAT_LABEL;
  if (item.status === "posted") return format;
  const open = item.waitsOn.find((gate) => !gate.cleared);
  return `${format} · ${open ? `Waits on ${gateLabel(open)}` : STAGE_LABELS[item.status]}`;
}

export function gateLabel(gate: Gate): string {
  if (gate.kind === "pr") return `#${gate.number}`;
  if (gate.kind === "item") return gate.title ?? "Deleted item";
  return gate.text;
}

// Dates. All calendar math is on YYYY-MM-DD strings at UTC midnight so the
// server's own clock and zone never shift a day.

export function validDate(value: string): boolean {
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function addDays(date: string, days: number): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayIndex(date: string): number {
  return (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
}

export function mondayOf(date: string): string {
  return addDays(date, -weekdayIndex(date));
}

/** Today in the calendar's time zone. */
export function todayInCalendar(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: CALENDAR_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** The Monday-to-Sunday weeks that cover a month, as [first Monday, last Sunday]. */
export function monthRange(month: string): { from: string; to: string } {
  const first = `${month}-01`;
  const next = new Date(`${first}T00:00:00Z`);
  next.setUTCMonth(next.getUTCMonth() + 1);
  const last = addDays(next.toISOString().slice(0, 10), -1);
  return { from: mondayOf(first), to: addDays(mondayOf(last), 6) };
}

export function weekRange(date: string): { from: string; to: string } {
  const from = mondayOf(date);
  return { from, to: addDays(from, 6) };
}

/** The inline-calendar directive an agent pastes once on its own line. */
export function viewDirective(view: "week" | "month", start: string): string {
  return `::content-calendar{view="${view}" start="${start}"}`;
}
