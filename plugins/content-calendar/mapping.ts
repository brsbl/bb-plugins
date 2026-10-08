import {
  CALENDAR_TIME_ZONE, FORMATS, FORMAT_COLOR_IDS, FORMAT_LABELS, LIMITS, NO_FORMAT_LABEL, STAGE_LABELS, STATUSES, TRAYS,
  addDays, attachmentSchema, storedGateSchema, type Attachment, type Format, type Status, type StoredGate, type Tray,
} from "./model.js";

// Pure item ⇄ Google Calendar event mapping. No I/O, no clock.

export const TRAY_RULE = "RRULE:FREQ=WEEKLY;BYDAY=MO";
export const BLOCK_HEADER = "── bb Content Calendar · updated by bb ──";
export const CC_ID = /^cc_[a-z0-9]{4,32}$/;
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
  for (const key of UNITS[unit]) if (key in values) next[key] = (values as unknown as Record<string, unknown>)[key];
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

/** A PATCH/insert body. `null` clears a field or a private property. */
export interface EventWrite {
  summary: string;
  description: string;
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

  const gates: StoredGate[] = [];
  for (let index = 1; index <= LIMITS.gates; index += 1) {
    const parsed = storedGateSchema.safeParse(parseJson(props[`gate${index}`]));
    if (parsed.success) gates.push(parsed.data);
  }
  const attachments: Attachment[] = [];
  for (let index = 1; index <= LIMITS.attachments; index += 1) {
    const parsed = attachmentSchema.safeParse(parseJson(props[`att${index}`]));
    if (parsed.success) attachments.push(parsed.data);
  }
  const pos = Number(props.pos);
  const { notes, found } = splitDescription(event.description ?? "", knownBlocks);
  return {
    fields: {
      title, format, status, date, time, minutes, days, tray, rrule, anchor,
      target: props.target ? props.target : null,
      notes, gates, attachments,
      pos: props.pos && Number.isFinite(pos) ? pos : 0,
    },
    ccId: props.ccId && CC_ID.test(props.ccId) ? props.ccId : null,
    blockFound: found,
    prefixed: prefix !== null,
    start: start?.date ?? null,
  };
}

/** The date of the occurrence an exception replaces, in the calendar's zone. */
export function occurrenceDate(event: GoogleEvent): string | null {
  return readWhen(event.originalStartTime)?.date ?? readWhen(event.start)?.date ?? null;
}

export function buildEvent(ccId: string, fields: Fields, monday: string, itemTitle: ItemTitle): { body: EventWrite; block: string } {
  const block = renderBlock(fields, itemTitle);
  const notes = fields.notes.trim();
  const props: Record<string, string | null> = {
    ccId,
    status: fields.status,
    format: fields.format,
    tray: fields.tray,
    target: fields.target,
    pos: String(fields.pos),
  };
  for (let index = 0; index < LIMITS.gates; index += 1) {
    const gate = fields.gates[index];
    props[`gate${index + 1}`] = gate ? JSON.stringify(gate) : null;
  }
  for (let index = 0; index < LIMITS.attachments; index += 1) {
    const attachment = fields.attachments[index];
    props[`att${index + 1}`] = attachment ? JSON.stringify(attachment) : null;
  }
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
      description: notes ? `${notes}\n\n${block}` : block,
      colorId: fields.format ? FORMAT_COLOR_IDS[fields.format] : null,
      ...range,
      recurrence,
      extendedProperties: { private: props },
    },
    block,
  };
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

/**
 * Splits a description into her notes and bb's block. The block is found by the
 * text bb wrote, line by line, so lines she added inside or after it stay notes.
 */
export function splitDescription(description: string, knownBlocks: readonly (string | null | undefined)[]): { notes: string; found: boolean } {
  const lines = htmlToText(description).split("\n");
  for (const block of knownBlocks) {
    if (!block) continue;
    const blockLines = block.split("\n").map(normalizeLine);
    let at = -1;
    for (let index = lines.length - 1; index >= 0; index -= 1) {
      if (normalizeLine(lines[index]!) === blockLines[0]) { at = index; break; }
    }
    if (at < 0) continue;
    const kept = lines.slice(0, at);
    let next = 1;
    for (const line of lines.slice(at + 1)) {
      // Block lines match in order; a line she edited or removed is skipped over.
      const match = blockLines.indexOf(normalizeLine(line), next);
      if (match >= 0) next = match + 1;
      else kept.push(line);
    }
    return { notes: tidyNotes(kept.join("\n")), found: true };
  }
  return { notes: tidyNotes(lines.join("\n")), found: false };
}

function tidyNotes(text: string): string {
  return text.replace(/[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n").trim();
}

function normalizeLine(line: string): string {
  return line.replace(/\s+/g, " ").trim();
}

/** Google's editor may save descriptions as HTML; bb compares text. */
export function htmlToText(value: string): string {
  let text = value.replace(/\r\n?/g, "\n");
  if (/<(br|p|div|a|b|i|u|span|ul|ol|li|h[1-6]|strong|em)\b[^>]*>|<\/[a-z][a-z0-9]*>/i.test(text)) {
    text = text
      .replace(/\n/g, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6]|ul|ol)>/gi, "\n")
      .replace(/<[^>]*>/g, "");
  }
  return text.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (entity, name: string) => {
      const lower = name.toLowerCase();
      if (lower.startsWith("#x")) return String.fromCodePoint(Number.parseInt(lower.slice(2), 16));
      if (lower.startsWith("#")) return String.fromCodePoint(Number.parseInt(lower.slice(1), 10));
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
