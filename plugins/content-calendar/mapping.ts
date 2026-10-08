import {
  CALENDAR_TIME_ZONE, FORMATS, FORMAT_COLOR_IDS, FORMAT_LABELS, LIMITS, NO_FORMAT_LABEL, STAGE_LABELS, STATUSES, TRAYS,
  addDays, attachmentSchema, storedGateSchema, type Attachment, type Format, type Status, type StoredGate, type Tray,
} from "./model.js";

// Pure item ⇄ Google Calendar event mapping. No I/O, no clock.

export const TRAY_RULE = "RRULE:FREQ=WEEKLY;BYDAY=MO";
export const BLOCK_HEADER = "── bb Content Calendar · updated by bb ──";
export const CC_ID = /^cc_[a-z0-9]{4,32}$/;
/** Format version of bb's private properties, written as `ccv`. */
export const PROPERTY_VERSION = "1";
/** Google's limit on one private property value. */
export const PROPERTY_MAX = 1024;
const CHECKED = "☑";
const UNCHECKED = "☐";

/** Everything bb stores about an item. `rrule`/`anchor` hold a rule she wrote herself and its series start. */
export interface Fields {
  title: string;
  format: Format | null;
  status: Status;
  date: string | null;
  time: string | null;
  /** Length of a timed event. */
  minutes: number | null;
  days: number;
  tray: Tray | null;
  rrule: string[] | null;
  anchor: string | null;
  target: string | null;
  notes: string;
  gates: StoredGate[];
  attachments: Attachment[];
  pos: number;
  /** Gate and attachment slots (`gate2`, `att7`) whose value bb couldn't read; kept as written. */
  keep?: Record<string, string>;
  /** Fields bb doesn't know on a gate or attachment record, keyed `gate:<id>` or `att:<id>`; kept as written. */
  extra?: Record<string, Record<string, unknown>>;
}

/** Units of change for dirty tracking and conflicts, named by the item field she sees. */
export const UNITS = {
  title: ["title"],
  format: ["format"],
  status: ["status"],
  date: ["date", "tray", "rrule", "anchor", "days"],
  time: ["time", "minutes"],
  target: ["target"],
  notes: ["notes"],
  waitsOn: ["gates"],
  attachments: ["attachments"],
  pos: ["pos"],
  /** Record data bb doesn't understand; only Google changes it. */
  slots: ["keep", "extra"],
} as const satisfies Record<string, readonly (keyof Fields)[]>;
export type Unit = keyof typeof UNITS;
export const UNIT_NAMES = Object.keys(UNITS) as Unit[];

export function isUnit(value: string): value is Unit {
  return Object.hasOwn(UNITS, value);
}

export function pickUnit(fields: Fields, unit: Unit): Partial<Fields> {
  const picked: Record<string, unknown> = {};
  for (const key of UNITS[unit]) picked[key] = fields[key];
  return picked as unknown as Partial<Fields>;
}

export function sameUnit(a: Fields, b: Fields, unit: Unit): boolean {
  return stable(pickUnit(a, unit)) === stable(pickUnit(b, unit));
}

export function changedUnits(before: Fields, after: Fields): Unit[] {
  return UNIT_NAMES.filter((unit) => !sameUnit(before, after, unit));
}

export function withUnit(fields: Fields, values: Partial<Fields>, unit: Unit): Fields {
  const next = { ...fields } as unknown as Record<string, unknown>;
  for (const key of UNITS[unit]) {
    if (key in values) next[key] = (values as unknown as Record<string, unknown>)[key];
    // Unreadable records Google no longer has are gone, not kept.
    else if (unit === "slots") delete next[key];
  }
  return next as unknown as Fields;
}

/** JSON with sorted keys, so parsed and locally built objects compare equal. */
export function stable(value: unknown): string {
  return JSON.stringify(value, (_key, inner: unknown) => {
    if (!inner || typeof inner !== "object" || Array.isArray(inner)) return inner;
    return Object.fromEntries(Object.entries(inner as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
  });
}

// Google event shapes (the subset bb reads and writes).

export interface EventDateTime {
  date?: string | null;
  dateTime?: string | null;
  timeZone?: string | null;
}

export interface GoogleEvent {
  id: string;
  etag?: string;
  status?: string;
  summary?: string;
  description?: string;
  colorId?: string;
  created?: string;
  updated?: string;
  start?: EventDateTime;
  end?: EventDateTime;
  recurrence?: string[];
  recurringEventId?: string;
  originalStartTime?: EventDateTime;
  extendedProperties?: { private?: Record<string, string>; shared?: Record<string, string> };
}

/** A PATCH/insert body. `null` clears a field or a private property; a missing description is left as it is. */
export interface EventWrite {
  /** Client-chosen ID on insert, so a retried insert can't create a second event. */
  id?: string;
  summary: string;
  description?: string;
  colorId: string | null;
  start: EventDateTime;
  end: EventDateTime;
  recurrence: string[];
  extendedProperties: { private: Record<string, string | null> };
}

export interface ParsedEvent {
  fields: Fields;
  ccId: string | null;
  /** The description contained bb's block. */
  blockFound: boolean;
  /** The summary starts with ☐ or ☑. */
  prefixed: boolean;
  /** Start date of the event or series. */
  start: string | null;
  /** The known block the description matched. */
  block: string | null;
}

/** What bb knows about the description in Google, so it can avoid resending her text. */
export interface DescriptionBase {
  /** The description as Google last returned it. */
  raw: string | null;
  /** The block bb last wrote. */
  block: string | null;
  /** Her notes changed in bb; bb's notes win for this write. */
  notesDirty: boolean;
}

/** Resolves an item gate's target title; null when the item is gone. */
export type ItemTitle = (itemId: string) => string | null;

/**
 * `lastStatus` is the status bb last read from this event; it outranks the `status`
 * property, which can be stale after she typed ☑ and bb hasn't written since.
 */
export function parseEvent(event: GoogleEvent, knownBlocks: readonly (string | null | undefined)[], lastStatus?: Status): ParsedEvent {
  const props = event.extendedProperties?.private ?? {};
  const summary = event.summary ?? "";
  const prefix = /^\s*([☐☑])\s*/u.exec(summary);
  const title = (prefix ? summary.slice(prefix[0].length) : summary).trim();
  const storedStatus = lastStatus ?? ((STATUSES as readonly string[]).includes(props.status ?? "") ? (props.status as Status) : "idea");
  let status: Status = storedStatus;
  if (prefix?.[1] === CHECKED) status = "posted";
  else if (prefix?.[1] === UNCHECKED && storedStatus === "posted") status = "ready";

  let format: Format | null = (FORMATS as readonly string[]).includes(props.format ?? "") ? (props.format as Format) : null;
  const colorFormat = FORMATS.find((candidate) => FORMAT_COLOR_IDS[candidate] === event.colorId);
  if (colorFormat) format = colorFormat;

  const start = readWhen(event.start);
  const end = readWhen(event.end);
  let date = start?.date ?? null;
  let time = start?.time ?? null;
  let minutes: number | null = null;
  let days = 1;
  if (start && start.time === null) {
    days = Math.max(1, end?.date ? daysBetween(start.date, end.date) : 1);
  } else if (start && end && start.ms !== null && end.ms !== null) {
    minutes = Math.max(0, Math.round((end.ms - start.ms) / 60000));
    const span = daysBetween(start.date, end.date);
    days = Math.max(1, span + (span > 0 && end.time === "00:00" ? 0 : 1));
  }

  const storedTray = (TRAYS as readonly string[]).includes(props.tray ?? "") ? (props.tray as Tray) : null;
  const recurrence = (event.recurrence ?? []).filter((line) => line.trim() !== "");
  let tray: Tray | null = null;
  let rrule: string[] | null = null;
  let anchor: string | null = null;
  if (recurrence.length > 0) {
    const ours = storedTray !== null && recurrence.length === 1 && recurrence[0] === TRAY_RULE;
    tray = storedTray ?? "later";
    if (ours) {
      time = null;
      minutes = null;
      days = 1;
    } else {
      rrule = recurrence;
      anchor = date;
    }
    date = null;
  }

  const keep: Record<string, string> = {};
  const extra: Record<string, Record<string, unknown>> = {};
  const gates = readSlots<StoredGate>(props, "gate", LIMITS.gates, storedGateSchema.options, keep, extra);
  const attachments = readSlots<Attachment>(props, "att", LIMITS.attachments, attachmentSchema.options, keep, extra);
  const pos = Number(props.pos);
  const { notes, found, block } = splitDescription(event.description ?? "", knownBlocks);
  return {
    fields: {
      title, format, status, date, time, minutes, days, tray, rrule, anchor,
      target: props.target ? props.target : null,
      notes, gates, attachments,
      pos: props.pos && Number.isFinite(pos) ? pos : 0,
      ...(Object.keys(keep).length ? { keep } : {}),
      ...(Object.keys(extra).length ? { extra } : {}),
    },
    ccId: props.ccId && CC_ID.test(props.ccId) ? props.ccId : null,
    blockFound: found,
    prefixed: prefix !== null,
    start: start?.date ?? null,
    block,
  };
}

/** The date of the occurrence an exception replaces, in the calendar's zone. */
export function occurrenceDate(event: GoogleEvent): string | null {
  return readWhen(event.originalStartTime)?.date ?? readWhen(event.start)?.date ?? null;
}

/**
 * The event body for a write. With `previous`, the description is sent only when her
 * notes changed in bb or the block changed, and a block change is spliced into Google's
 * raw description so text and markup bb didn't write stay byte-for-byte. `full` always
 * includes a description (inserts).
 */
export function buildEvent(
  ccId: string, fields: Fields, monday: string, itemTitle: ItemTitle, previous?: DescriptionBase, full = true,
): { body: EventWrite; block: string } {
  const block = renderBlock(fields, itemTitle);
  const description = composeDescription(fields.notes.trim(), block, previous, full);
  const props = privateProps(ccId, fields);
  let range: { start: EventDateTime; end: EventDateTime };
  let recurrence: string[] = [];
  if (fields.tray && !fields.rrule) {
    range = allDay(monday, 1);
    recurrence = [TRAY_RULE];
  } else {
    const date = (fields.tray ? fields.anchor : fields.date) ?? monday;
    range = fields.time ? timed(date, fields.time, fields.minutes ?? 60) : allDay(date, fields.days);
    if (fields.tray && fields.rrule) recurrence = fields.rrule;
  }
  return {
    body: {
      summary: `${fields.status === "posted" ? CHECKED : UNCHECKED} ${fields.title}`,
      ...(description === undefined ? {} : { description }),
      colorId: fields.format ? FORMAT_COLOR_IDS[fields.format] : null,
      ...range,
      recurrence,
      extendedProperties: { private: props },
    },
    block,
  };
}

/** bb's private properties. Unreadable slots keep their value and unknown record fields are written back. */
export function privateProps(ccId: string, fields: Fields): Record<string, string | null> {
  const props: Record<string, string | null> = {
    ccId,
    ccv: PROPERTY_VERSION,
    status: fields.status,
    format: fields.format,
    tray: fields.tray,
    target: fields.target,
    pos: String(fields.pos),
  };
  fillSlots(props, "gate", LIMITS.gates, fields.gates, fields);
  fillSlots(props, "att", LIMITS.attachments, fields.attachments, fields);
  return props;
}

/** The first private property over Google's 1,024-character limit, if any. */
export function oversizedProperty(ccId: string, fields: Fields): string | null {
  for (const [key, value] of Object.entries(privateProps(ccId, fields))) if (value !== null && value.length > PROPERTY_MAX) return key;
  return null;
}

/** Gate or attachment slots left for bb's records after the ones it keeps unread. */
export function slotCapacity(fields: Fields, prefix: "gate" | "att"): number {
  const total = prefix === "gate" ? LIMITS.gates : LIMITS.attachments;
  return total - Object.keys(fields.keep ?? {}).filter((slot) => slot.startsWith(prefix) && /^\d+$/.test(slot.slice(prefix.length))).length;
}

function fillSlots(props: Record<string, string | null>, prefix: "gate" | "att", count: number, records: readonly { id: string }[], fields: Fields): void {
  const keep = fields.keep ?? {};
  const extra = fields.extra ?? {};
  let next = 0;
  for (let index = 1; index <= count; index += 1) {
    const slot = `${prefix}${index}`;
    const kept = keep[slot];
    if (kept !== undefined) {
      props[slot] = kept;
      continue;
    }
    const record = records[next];
    next += 1;
    props[slot] = record ? JSON.stringify({ ...extra[`${prefix}:${record.id}`], ...record }) : null;
  }
}

interface RecordSchema {
  shape: object;
  safeParse(value: unknown): { success: boolean; data?: unknown };
}

/** Reads records leniently: unknown fields go to `extra`, unreadable slots to `keep`. */
function readSlots<T extends { id: string }>(
  props: Record<string, string>, prefix: "gate" | "att", count: number, options: readonly RecordSchema[],
  keep: Record<string, string>, extra: Record<string, Record<string, unknown>>,
): T[] {
  const records: T[] = [];
  for (let index = 1; index <= count; index += 1) {
    const slot = `${prefix}${index}`;
    const value = props[slot];
    if (value === undefined || value === "") continue;
    const json = parseJson(value);
    let read = false;
    if (json && typeof json === "object" && !Array.isArray(json)) {
      for (const option of options) {
        const known = new Set(Object.keys(option.shape));
        const entries = Object.entries(json as Record<string, unknown>);
        const parsed = option.safeParse(Object.fromEntries(entries.filter(([key]) => known.has(key))));
        if (!parsed.success) continue;
        const record = parsed.data as T;
        const unknown = Object.fromEntries(entries.filter(([key]) => !known.has(key)));
        if (Object.keys(unknown).length) extra[`${prefix}:${record.id}`] = unknown;
        records.push(record);
        read = true;
        break;
      }
    }
    if (!read) keep[slot] = value;
  }
  return records;
}

/** The generated summary at the end of every description. */
export function renderBlock(fields: Fields, itemTitle: ItemTitle): string {
  const stage = fields.status === "posted" ? "Posted" : STAGE_LABELS[fields.status];
  const lines = [
    BLOCK_HEADER,
    [fields.format ? FORMAT_LABELS[fields.format] : NO_FORMAT_LABEL, stage, fields.target ? `Target: ${fields.target}` : null]
      .filter((part): part is string => part !== null).join(" · "),
    ...labeled("Waits on: ", fields.gates.map((gate) => gateLine(gate, itemTitle))),
    ...labeled("Attached: ", fields.attachments.map(attachmentLine)),
  ];
  return lines.join("\n");
}

function gateLine(gate: StoredGate, itemTitle: ItemTitle): string {
  if (gate.kind === "pr") return `${gate.repo} #${gate.number} (${gate.cleared ? "cleared" : "not cleared"}) https://github.com/${gate.repo}/pull/${gate.number}`;
  if (gate.kind === "item") return `${itemTitle(gate.itemId) ?? "Deleted item"} (calendar item)`;
  return `${gate.text} (${gate.cleared ? "cleared" : "not cleared"})${gate.url ? ` ${gate.url}` : ""}`;
}

function attachmentLine(attachment: Attachment): string {
  if (attachment.kind === "file") return `${attachment.name} (on Mac)`;
  if (attachment.kind === "url") return attachment.title ? `${attachment.title} ${attachment.url}` : attachment.url;
  if (attachment.kind === "pr") return `${attachment.repo} #${attachment.number} https://github.com/${attachment.repo}/pull/${attachment.number}`;
  return `${attachment.title ?? attachment.threadId} (bb thread)`;
}

function labeled(label: string, values: string[]): string[] {
  return values.map((value, index) => `${index === 0 ? label : " ".repeat(label.length)}${value}`);
}

export function composeDescription(notes: string, block: string, previous: DescriptionBase | undefined, full: boolean): string | undefined {
  const fresh = notes ? `${notes}\n\n${block}` : block;
  if (!previous || previous.raw === null || previous.notesDirty) return fresh;
  if (previous.block === block) return full ? previous.raw : undefined;
  return spliceBlock(previous.raw, previous.block, block);
}

/** Replaces bb's old block in a raw description, keeping everything before it byte-for-byte. */
export function spliceBlock(raw: string, oldBlock: string | null, block: string): string {
  if (oldBlock) {
    const at = raw.lastIndexOf(oldBlock);
    if (at >= 0) return raw.slice(0, at) + block + raw.slice(at + oldBlock.length);
  }
  const html = looksLikeEditorHtml(raw);
  const at = raw.lastIndexOf(BLOCK_HEADER);
  if (oldBlock && at >= 0) {
    // Her lines inside or after the old block move above the new one.
    const tail = raw.slice(at);
    const closing = html ? (/(?:<\/[a-z][a-z0-9]*>\s*)*$/i.exec(tail)?.[0] ?? "") : "";
    const lines = (html ? htmlToText(tail.slice(0, tail.length - closing.length)) : tail).split("\n");
    const extras = withoutBlockLines(lines, oldBlock.split("\n").map(normalizeLine)).map((line) => line.trimEnd()).filter((line) => line.trim() !== "");
    const head = raw.slice(0, at);
    if (html) return `${head}${extras.map((line) => `${escapeHtml(line)}<br>`).join("")}${extras.length ? "<br>" : ""}${blockHtml(block)}${closing}`;
    return `${head}${extras.length ? `${extras.join("\n")}\n\n` : ""}${block}`;
  }
  if (raw.trim() === "") return html ? blockHtml(block) : block;
  return html ? `${raw}<br><br>${blockHtml(block)}` : `${raw}\n\n${block}`;
}

function blockHtml(block: string): string {
  return block.split("\n").map(escapeHtml).join("<br>");
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Google Calendar's web editor saves descriptions as single-line HTML. bb's own
 * descriptions always contain newlines, so tag-like text bb wrote is never read as HTML.
 */
export function looksLikeEditorHtml(value: string): boolean {
  return !value.includes("\n") && /<(br|p|div|a|b|i|u|span|ul|ol|li|h[1-6]|strong|em)\b[^>]*>|<\/(p|div|a|b|i|u|span|ul|ol|li|h[1-6]|strong|em)>/i.test(value);
}

/**
 * Splits a description into her notes and bb's block. The block is found by the
 * text bb wrote, line by line, so lines she added inside or after it stay notes.
 */
export function splitDescription(
  description: string, knownBlocks: readonly (string | null | undefined)[],
): { notes: string; found: boolean; block: string | null } {
  const html = looksLikeEditorHtml(description);
  const lines = (html ? htmlToText(description) : description.replace(/\r\n?/g, "\n")).split("\n");
  const tidy = (text: string) => (html ? text.replace(/[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n").trim() : text.trim());
  for (const block of knownBlocks) {
    if (!block) continue;
    const blockLines = block.split("\n").map(normalizeLine);
    let at = -1;
    for (let index = lines.length - 1; index >= 0; index -= 1) {
      if (normalizeLine(lines[index]!) === blockLines[0]) { at = index; break; }
    }
    if (at < 0) continue;
    return { notes: tidy([...lines.slice(0, at), ...withoutBlockLines(lines.slice(at), blockLines)].join("\n")), found: true, block };
  }
  return { notes: tidy(lines.join("\n")), found: false, block: null };
}

/** Lines that aren't bb's block lines, which match in order; a line she edited or removed is skipped over. */
function withoutBlockLines(lines: readonly string[], blockLines: readonly string[]): string[] {
  const kept: string[] = [];
  let next = 0;
  for (const line of lines) {
    const match = blockLines.indexOf(normalizeLine(line), next);
    if (match >= 0) next = match + 1;
    else kept.push(line);
  }
  return kept;
}

function normalizeLine(line: string): string {
  return line.replace(/\s+/g, " ").trim();
}

/** Text of the HTML Google's editor saves; bb compares text, not markup. */
export function htmlToText(value: string): string {
  const text = value
    .replace(/\r?\n/g, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|ul|ol)>/gi, "\n")
    .replace(/<[^>]*>/g, "");
  return text.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (entity, name: string) => {
      const lower = name.toLowerCase();
      // Descriptions come from Google, where any app can write them; an out-of-range entity stays literal.
      const code = lower.startsWith("#x") ? Number.parseInt(lower.slice(2), 16) : lower.startsWith("#") ? Number.parseInt(lower.slice(1), 10) : null;
      if (code !== null) return Number.isInteger(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity;
      return ENTITIES[lower] ?? entity;
    });
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: " " };

// Dates and times, always in the calendar's zone.

function readWhen(value: EventDateTime | undefined): { date: string; time: string | null; ms: number | null } | null {
  if (!value) return null;
  if (value.date) return { date: value.date, time: null, ms: null };
  if (!value.dateTime) return null;
  const ms = Date.parse(value.dateTime);
  if (Number.isNaN(ms)) return null;
  // A dateTime without an offset is wall time in its own zone; bb only writes calendar-zone times.
  if (!/[zZ]|[+-]\d{2}:\d{2}$/.test(value.dateTime)) {
    return { date: value.dateTime.slice(0, 10), time: value.dateTime.slice(11, 16), ms: Date.parse(`${value.dateTime.slice(0, 16)}:00Z`) };
  }
  const parts = Object.fromEntries(LOCAL_FORMAT.formatToParts(new Date(ms)).map((part) => [part.type, part.value]));
  const hour = parts.hour === "24" ? "00" : parts.hour;
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${hour}:${parts.minute}`, ms };
}

const LOCAL_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: CALENDAR_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
});

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

function allDay(date: string, days: number): { start: EventDateTime; end: EventDateTime } {
  return {
    start: { date, dateTime: null, timeZone: null },
    end: { date: addDays(date, Math.max(1, days)), dateTime: null, timeZone: null },
  };
}

function timed(date: string, time: string, minutes: number): { start: EventDateTime; end: EventDateTime } {
  const startMs = Date.parse(`${date}T${time}:00Z`);
  const end = new Date(startMs + Math.max(0, minutes) * 60_000).toISOString().slice(0, 16);
  return {
    start: { date: null, dateTime: `${date}T${time}:00`, timeZone: CALENDAR_TIME_ZONE },
    end: { date: null, dateTime: `${end}:00`, timeZone: CALENDAR_TIME_ZONE },
  };
}

function parseJson(value: string | undefined): unknown {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}
