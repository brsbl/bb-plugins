import type { ConnectionStatus } from "./contract.js";
import { CALENDAR_TIME_ZONE, addDays, mondayOf, monthRange, validDate, weekRange, weekdayIndex, type Gate, type Item } from "./model.js";

// Pure calendar math for the page and the inline calendar. Dates are YYYY-MM-DD
// strings in the calendar's time zone; nothing here reads the browser's zone.

export type View = "month" | "week";
/** A visible range: `start` is YYYY-MM for a month and the Monday for a week. */
export interface CalendarRange { view: View; start: string }

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const parts = (date: string) => ({ year: Number(date.slice(0, 4)), month: Number(date.slice(5, 7)), day: Number(date.slice(8, 10)) });
const shortMonth = (month: number) => MONTHS[month - 1]!.slice(0, 3);

export function isMonth(value: string): boolean { return MONTH_RE.test(value); }
export function isDate(value: string): boolean { return DATE_RE.test(value) && validDate(value); }

/** Normalizes a view and start; a week snaps to its Monday, a month accepts a date inside it. */
export function makeRange(view: View, start: string): CalendarRange | null {
  if (view === "week") return isDate(start) ? { view, start: mondayOf(start) } : null;
  if (isMonth(start)) return { view, start };
  return isDate(start) ? { view, start: start.slice(0, 7) } : null;
}

/** The page's subPath: "month/2026-10" or "week/2026-10-05". Anything else is the current month. */
export function parseSubPath(subPath: string, today: string): CalendarRange {
  const [view, start] = subPath.split("/");
  if ((view === "month" || view === "week") && start) {
    const range = makeRange(view, start);
    if (range) return range;
  }
  return { view: "month", start: today.slice(0, 7) };
}

export function rangeSubPath(range: CalendarRange): string { return `${range.view}/${range.start}`; }

export type DirectiveResult = { ok: true; range: CalendarRange } | { ok: false; error: string };
/** Validates `::content-calendar{view="week" start="2026-10-05"}` attributes. */
export function parseDirective(attributes: Readonly<Record<string, string>>): DirectiveResult {
  const view = attributes.view ?? "week";
  if (view !== "week" && view !== "month") return { ok: false, error: `Unknown view "${view.slice(0, 20)}". Use week or month.` };
  const start = attributes.start ?? "";
  const range = makeRange(view, start);
  if (!range) return { ok: false, error: view === "week" ? "Set start to a date, like 2026-10-05." : "Set start to a month, like 2026-10." };
  return { ok: true, range };
}

/** First and last visible day. */
export function rangeDays(range: CalendarRange): { from: string; to: string } {
  return range.view === "month" ? monthRange(range.start) : weekRange(range.start);
}

/** Monday-to-Sunday rows of dates covering the range. */
export function gridWeeks(range: CalendarRange): string[][] {
  const { from, to } = rangeDays(range);
  const weeks: string[][] = [];
  for (let monday = from; monday <= to; monday = addDays(monday, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, index) => addDays(monday, index)));
  }
  return weeks;
}

export function shiftRange(range: CalendarRange, direction: -1 | 1): CalendarRange {
  if (range.view === "week") return { view: "week", start: addDays(range.start, 7 * direction) };
  const { year, month } = parts(`${range.start}-01`);
  const index = year * 12 + (month - 1) + direction;
  return { view: "month", start: `${String(Math.floor(index / 12)).padStart(4, "0")}-${String((index % 12) + 1).padStart(2, "0")}` };
}

/** The same view around today. */
export function todayRange(view: View, today: string): CalendarRange {
  return view === "week" ? { view, start: mondayOf(today) } : { view, start: today.slice(0, 7) };
}

/** Switching views keeps the period in view: a week opens its month, a month opens its first week (or today's, when today is in it). */
export function switchView(range: CalendarRange, view: View, today: string): CalendarRange {
  if (view === range.view) return range;
  if (view === "month") return { view, start: range.start.slice(0, 7) };
  return { view, start: mondayOf(today.startsWith(range.start) ? today : `${range.start}-01`) };
}

/** "October 2026" or "Oct 5 – 11, 2026". */
export function rangeLabel(range: CalendarRange): string {
  if (range.view === "month") {
    const { year, month } = parts(`${range.start}-01`);
    return `${MONTHS[month - 1]} ${year}`;
  }
  const a = parts(range.start);
  const b = parts(addDays(range.start, 6));
  if (a.year !== b.year) return `${shortMonth(a.month)} ${a.day}, ${a.year} – ${shortMonth(b.month)} ${b.day}, ${b.year}`;
  if (a.month !== b.month) return `${shortMonth(a.month)} ${a.day} – ${shortMonth(b.month)} ${b.day}, ${b.year}`;
  return `${shortMonth(a.month)} ${a.day} – ${b.day}, ${b.year}`;
}

/** "Wednesday, October 28" — what a screen reader hears while moving an item. */
export function dayName(date: string): string {
  const { month, day } = parts(date);
  return `${WEEKDAYS[weekdayIndex(date)]}, ${MONTHS[month - 1]} ${day}`;
}

/** "Oct 28". */
export function shortDate(date: string): string {
  const { month, day } = parts(date);
  return `${shortMonth(month)} ${day}`;
}

/** A month cell's number: "Oct 1" on the first of a month or the first cell, otherwise "5". */
export function cellNumber(date: string, firstCell: boolean): string {
  const { day } = parts(date);
  return day === 1 || firstCell ? shortDate(date) : String(day);
}

/** Which keyboard arrow moves a picked-up item where: a day sideways, a week up or down. */
export function keyboardStep(date: string, key: string): string | null {
  const step = ({ ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 } as Record<string, number>)[key];
  return step === undefined ? null : addDays(date, step);
}

export function byPos<T extends Pick<Item, "pos" | "title">>(a: T, b: T): number {
  return a.pos - b.pos || a.title.localeCompare(b.title);
}

/** Dated items grouped by day, each day in `pos` order. */
export function itemsByDay(items: readonly Item[]): Map<string, Item[]> {
  const days = new Map<string, Item[]>();
  for (const item of items) {
    if (!item.date) continue;
    const list = days.get(item.date) ?? [];
    list.push(item);
    days.set(item.date, list);
  }
  for (const list of days.values()) list.sort(byPos);
  return days;
}

export interface Placement { before?: string; after?: string }
/**
 * Where a dropped item lands among `list` (the target day or tray, in order).
 * Dropping on an item takes its place: before it when coming from above or
 * elsewhere, after it when moving down within the same list. Dropping on the
 * container appends.
 */
export function dropPlacement(list: readonly Pick<Item, "id">[], movingId: string, overId: string | null): Placement {
  const others = list.filter((item) => item.id !== movingId);
  if (overId && overId !== movingId && others.some((item) => item.id === overId)) {
    const from = list.findIndex((item) => item.id === movingId);
    const to = list.findIndex((item) => item.id === overId);
    return from !== -1 && from < to ? { after: overId } : { before: overId };
  }
  if (overId === movingId) {
    // Dropped on itself: stay put.
    const index = list.findIndex((item) => item.id === movingId);
    const next = list[index + 1];
    const previous = list[index - 1];
    return next ? { before: next.id } : previous ? { after: previous.id } : {};
  }
  const last = others.at(-1);
  return last ? { after: last.id } : {};
}

/** A fractional position between two neighbours, as the server computes it. */
export function posBetween(previous: number | undefined, next: number | undefined): number {
  if (previous !== undefined && next !== undefined) return (previous + next) / 2;
  if (previous !== undefined) return previous + 1;
  if (next !== undefined) return next - 1;
  return 0;
}

/** The optimistic `pos` for a placement within `list`. */
export function placementPos(list: readonly Pick<Item, "id" | "pos">[], movingId: string, placement: Placement): number {
  const others = list.filter((item) => item.id !== movingId);
  const anchor = placement.before ?? placement.after;
  const index = anchor ? others.findIndex((item) => item.id === anchor) : -1;
  if (index === -1) return posBetween(others.at(-1)?.pos, undefined);
  if (placement.before) return posBetween(others[index - 1]?.pos, others[index]!.pos);
  return posBetween(others[index]!.pos, others[index + 1]?.pos);
}

/** True when the placement leaves the item where it already is. */
export function samePlace(list: readonly Pick<Item, "id">[], movingId: string, placement: Placement): boolean {
  const index = list.findIndex((item) => item.id === movingId);
  if (index === -1) return false;
  if (placement.before) return list[index + 1]?.id === placement.before;
  if (placement.after) return list[index - 1]?.id === placement.after;
  return list.length === 1;
}

/** Item gates whose item is scheduled after this one: "Scheduled before X (Oct 28)". */
export function scheduledBefore(item: Pick<Item, "date" | "waitsOn">): { title: string; date: string }[] {
  if (!item.date) return [];
  return item.waitsOn.flatMap((gate: Gate) => gate.kind === "item" && gate.title !== null && gate.date && gate.date > item.date! ? [{ title: gate.title, date: gate.date }] : []);
}

/** `owner/repo#12` or a GitHub pull request URL. */
export function parsePullRequest(text: string): { repo: string; number: number } | null {
  const value = text.trim();
  const short = /^([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)#(\d+)$/.exec(value);
  const url = /^https?:\/\/(?:www\.)?github\.com\/([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)\/pull\/(\d+)(?:[/?#].*)?$/.exec(value);
  const match = short ?? url;
  if (!match) return null;
  const number = Number(match[2]);
  return Number.isSafeInteger(number) && number > 0 ? { repo: match[1]!, number } : null;
}

export function clockLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: CALENDAR_TIME_ZONE }).format(new Date(iso));
}

export type SyncTone = "ok" | "busy" | "warn" | "error" | "off";
/** The header's sync line. */
export function syncLabel(status: Pick<ConnectionStatus, "state" | "lastSyncedAt">, now: number): { text: string; tone: SyncTone } {
  switch (status.state) {
    case "synced": {
      if (!status.lastSyncedAt) return { text: "Synced", tone: "ok" };
      const minutes = Math.max(0, Math.floor((now - Date.parse(status.lastSyncedAt)) / 60_000));
      if (minutes < 1) return { text: "Synced just now", tone: "ok" };
      if (minutes < 60) return { text: `Synced ${minutes} min ago`, tone: "ok" };
      return { text: `Synced ${Math.floor(minutes / 60)} h ago`, tone: "ok" };
    }
    case "syncing": return { text: "Syncing…", tone: "busy" };
    case "offline": return { text: status.lastSyncedAt ? `Offline · last synced ${clockLabel(status.lastSyncedAt)}` : "Offline", tone: "warn" };
    case "reconnect": return { text: "Reconnect Google Calendar", tone: "error" };
    case "calendar_deleted": return { text: "Calendar deleted in Google", tone: "error" };
    default: return { text: "Not connected", tone: "off" };
  }
}

/** Where an item lives, for Move to… and the When field. */
export function whereLabel(item: Pick<Item, "date" | "tray">): string {
  if (item.date) return dayName(item.date);
  return item.tray === "evergreen" ? "Evergreen" : "Later";
}
