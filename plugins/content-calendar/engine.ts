import { randomBytes } from "node:crypto";
import type { z } from "zod";
import type { AttachmentInput, ConnectionState, ConnectionStatus, RpcContract } from "./contract.js";
import {
  CALENDAR_NAME, CALENDAR_TIME_ZONE, LIMITS, addDays, mondayOf, todayInCalendar,
  type Attachment, type Gate, type Item, type StoredGate,
} from "./model.js";
import {
  CalendarError, type CalendarOperations, type CalendarService, type Credentials, type ServiceDeps,
} from "./service-api.js";
import {
  UNIT_NAMES, buildEvent, changedUnits, isUnit, occurrenceDate, parseEvent, pickUnit, renderBlock, sameUnit,
  oversizedProperty, slotCapacity, splitDescription, withUnit, type EventWrite, type Fields, type GoogleEvent, type ParsedEvent, type Unit,
} from "./mapping.js";
import {
  GOOGLE_ENDPOINTS, GoogleAuthRevoked, GoogleHttpError, GoogleUnavailable, buildAuthUrl, createGoogleClient, createPkce,
  exchangeCode, type GoogleEndpoints,
} from "./google.js";
import { createStore, type ItemRow, type Row } from "./store.js";

type In<K extends keyof RpcContract> = z.infer<RpcContract[K]["input"]>;
type StrictOps = CalendarService["strict"];

const VISIBLE_WINDOW = 90_000;
const VISIBLE_DELAY = 60_000;
const IDLE_DELAY = 600_000;
const RETRY_BASE = 60_000;
const RETRY_MAX = 6 * 60 * 60_000;
const PROPERTY_LIMIT_TEXT = "1,024 characters";
const DELETED_NOTICE = "Deleted in Google Calendar while you had unsynced changes";
const CONNECT_HINT = "Run `bb content-calendar connect`";
const ID_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
/** Google event IDs are base32hex. */
const EVENT_ID_ALPHABET = "0123456789abcdefghijklmnopqrstuv";
const UNIT_LABELS: Record<Unit, string> = {
  title: "title", format: "format", status: "checkbox", date: "date", time: "time", target: "target",
  notes: "notes", waitsOn: "waits-on", attachments: "attachments", pos: "order", slots: "unreadable records",
};

/** The Content calendar is gone in Google. */
class CalendarGone extends Error {}

type Failure = { state: "reconnect" | "calendar_deleted"; message: string };

export function createCalendarService(deps: ServiceDeps): CalendarService {
  const store = createStore(deps.db, deps.migrate);
  const endpoints: GoogleEndpoints = {
    apiBase: deps.google?.apiBase ?? GOOGLE_ENDPOINTS.apiBase,
    authUrl: deps.google?.authUrl ?? GOOGLE_ENDPOINTS.authUrl,
    tokenUrl: deps.google?.tokenUrl ?? GOOGLE_ENDPOINTS.tokenUrl,
  };
  const google = createGoogleClient({ fetch: deps.fetch, endpoints, now: deps.now, credentials: () => deps.credentials.get() });
  const nowIso = () => deps.now().toISOString();
  const today = () => todayInCalendar(deps.now());
  const monday = () => mondayOf(today());

  let offline: string | null = null;
  let failures = 0;
  let lastVisible = Number.NEGATIVE_INFINITY;
  let syncing = false;
  /** A sync step failed for a reason other than Google being unreachable. */
  let syncError: string | null = null;
  let disposed = false;

  let chain: Promise<unknown> = Promise.resolve();
  const serialize = <T>(operation: () => Promise<T>): Promise<T> => {
    const result = chain.then(operation);
    chain = result.then(() => undefined, () => undefined);
    return result;
  };

  const failure = (): Failure | null => {
    const raw = store.meta.get("failure");
    return raw ? (JSON.parse(raw) as Failure) : null;
  };
  const setFailure = (value: Failure | null) => store.meta.set("failure", value ? JSON.stringify(value) : null);

  // Reading and viewing items.

  const live = (ccId: string): Row | null => {
    const row = store.row(ccId);
    return row && !row.deleted ? row : null;
  };
  const itemTitle = (ccId: string) => store.item(ccId)?.fields.title ?? null;

  type Lookup = (ccId: string) => ItemRow | null;
  const lookupIn = (rows: readonly ItemRow[]): Lookup => {
    const byId = new Map(rows.map((row) => [row.ccId, row]));
    return (ccId) => byId.get(ccId) ?? null;
  };

  const readGate = (gate: StoredGate, lookup: Lookup): Gate => {
    if (gate.kind !== "item") return { ...gate };
    const target = lookup(gate.itemId);
    return {
      id: gate.id, kind: "item", itemId: gate.itemId,
      cleared: target?.fields.status === "posted",
      title: target ? target.fields.title : null,
      date: target && !target.fields.tray ? target.fields.date : null,
    };
  };

  const view = (row: ItemRow, lookup: Lookup = (ccId) => store.item(ccId)): Item => {
    const fields = row.fields;
    return {
      id: row.ccId,
      title: fields.title,
      format: fields.format,
      status: fields.status,
      date: fields.tray ? null : fields.date,
      time: fields.tray ? null : fields.time,
      days: fields.tray ? 1 : fields.days,
      tray: fields.tray,
      target: fields.target,
      notes: fields.notes,
      waitsOn: fields.gates.map((gate) => readGate(gate, lookup)),
      attachments: fields.attachments,
      sync: row.conflict ? "conflict" : row.seq !== null ? "queued" : "synced",
      conflict: row.conflict,
      pos: fields.pos,
      notice: row.failed ?? row.notice,
      updatedAt: row.updatedAt,
    };
  };
  const views = (rows: readonly ItemRow[]): Item[] => {
    const lookup = lookupIn(rows);
    return rows.map((row) => view(row, lookup)).sort(compareItems);
  };
  const inRange = (fields: Fields, from?: string, to?: string) =>
    !fields.tray && fields.date !== null && (!from || addDays(fields.date, fields.days - 1) >= from) && (!to || fields.date <= to);

  const compareItems = (a: Item, b: Item): number => {
    const rank = (item: Item) => (item.tray === null ? 0 : item.tray === "evergreen" ? 1 : 2);
    return rank(a) - rank(b) || (a.date ?? "").localeCompare(b.date ?? "") || a.pos - b.pos || a.id.localeCompare(b.id);
  };
  const intersects = (item: Item, from?: string, to?: string) =>
    item.date !== null && (!from || addDays(item.date, item.days - 1) >= from) && (!to || item.date <= to);

  // Connection state.

  const statusNow = async (): Promise<ConnectionStatus> => {
    const credentials = await deps.credentials.get();
    const problem = failure();
    let state: ConnectionState;
    let message: string | null = null;
    const calendarId = store.meta.get("calendarId") ?? credentials.calendarId ?? null;
    if (!credentials.clientId || !credentials.clientSecret) state = "needs_client";
    else if (!credentials.refreshToken || (!calendarId && !problem)) state = "not_connected";
    else if (problem) ({ state, message } = problem);
    else if (offline) { state = "offline"; message = offline; }
    else if (syncError) { state = "offline"; message = syncError; }
    else state = syncing || !store.meta.get("lastSyncedAt") ? "syncing" : "synced";
    const counts = store.counts();
    if (counts.failed > 0 && state !== "needs_client" && state !== "not_connected") {
      const failed = `${counts.failed} ${counts.failed === 1 ? "change" : "changes"} couldn't be saved to Google Calendar; retrying`;
      message = message ? `${message}. ${failed}` : failed;
    }
    return {
      state,
      calendarId,
      lastSyncedAt: store.meta.get("lastSyncedAt"),
      queued: counts.queued,
      conflicts: counts.conflicts,
      message,
    };
  };

  const needsClient = () =>
    new CalendarError("needs_client", "Add the Google OAuth client ID and secret first", "Enter them on the plugin's Settings page, or run `bb content-calendar connect`");

  const ensureWritable = async (): Promise<Credentials> => {
    const credentials = await deps.credentials.get();
    if (!credentials.clientId || !credentials.clientSecret) throw needsClient();
    if (!credentials.refreshToken) throw new CalendarError("not_connected", "Google Calendar isn't connected", CONNECT_HINT);
    return credentials;
  };

  const connected = async (): Promise<boolean> => {
    const credentials = await deps.credentials.get();
    return !!(credentials.clientId && credentials.clientSecret && credentials.refreshToken);
  };

  /** Reads need a connection, like writes; the cache isn't shown while Google is disconnected. */
  const ensureReadable = async (): Promise<void> => {
    await ensureWritable();
  };

  const liveRow = (ccId: string): Row => {
    const row = live(ccId);
    if (!row) throw new CalendarError("not_found", `No item ${ccId}`, "Run `bb content-calendar list` to see item IDs");
    return row;
  };

  // Local edits.

  const freshId = (): string => {
    for (;;) {
      const id = `cc_${[...randomBytes(8)].map((byte) => ID_ALPHABET[byte % ID_ALPHABET.length]).join("")}`;
      if (!store.row(id)) return id;
    }
  };

  const newClientId = () => [...randomBytes(26)].map((byte) => EVENT_ID_ALPHABET[byte % EVENT_ID_ALPHABET.length]).join("");

  const sameBucket = (a: Fields, b: Fields) => (a.tray ? b.tray === a.tray : !b.tray && b.date === a.date);
  const bucket = (fields: Fields, except: string | null) =>
    store.items().filter((row) => row.ccId !== except && sameBucket(fields, row.fields)).sort((a, b) => a.fields.pos - b.fields.pos);
  const appendPos = (fields: Fields, except: string | null) => {
    const rows = bucket(fields, except);
    return rows.length ? rows[rows.length - 1]!.fields.pos + 1 : 1;
  };

  const withoutUnits = (row: Row, units: readonly Unit[]) => {
    if (!row.conflict) return;
    const fields = row.conflict.fields.filter((field) => !units.includes(field as Unit));
    if (fields.length === 0) {
      row.conflict = null;
      row.lost = null;
      return;
    }
    const values = { ...row.conflict.values };
    for (const unit of units) for (const key of conflictKeys(unit)) delete values[key];
    row.conflict = { fields, values, message: conflictMessage(fields) };
  };

  const commitLocal = (row: Row, next: Fields, units: readonly Unit[]) => {
    row.fields = next;
    row.dirty = [...new Set([...row.dirty, ...units])];
    withoutUnits(row, units);
    row.updatedAt = nowIso();
    row.retryAt = null;
    row.seq ??= store.nextSeq();
    store.put(row);
  };

  /** Google's limit is per private property; refuse before queueing a write it would reject. */
  const assertFits = (ccId: string, fields: Fields) => {
    const key = oversizedProperty(ccId, fields);
    if (key) {
      throw new CalendarError("limit", `This is too long to store in Google Calendar (${key} is over ${PROPERTY_LIMIT_TEXT})`, "Use a shorter text, URL, path, or title");
    }
  };

  // Pushing to Google.

  const calendarId = (): string => {
    const id = store.meta.get("calendarId");
    if (!id) throw new CalendarGone("No Content calendar yet");
    return id;
  };

  const assertCalendar = async (id: string) => {
    try {
      await google.getCalendar(id);
    } catch (error) {
      if (error instanceof GoogleHttpError && (error.status === 404 || error.status === 410)) throw new CalendarGone();
      throw error;
    }
  };

  /** Reads an event against what bb knows of it. An unchanged description keeps the notes bb already has. */
  const read = (event: GoogleEvent, row: Row | null): ParsedEvent => {
    const first = parseEvent(event, [row?.block], row?.base?.status);
    if (row?.base && row.raw !== null && (event.description ?? "") === row.raw) {
      return { ...first, fields: { ...first.fields, notes: row.base.notes }, blockFound: true, block: row.block };
    }
    if (first.blockFound) return first;
    const guess = renderBlock(first.fields, itemTitle);
    const split = splitDescription(event.description ?? "", [guess]);
    return split.found ? { ...first, fields: { ...first.fields, notes: split.notes }, blockFound: true, block: guess } : first;
  };

  /** Google's version wins wherever bb has no unsynced change; same-field changes become a conflict. */
  const merge = (row: Row, event: GoogleEvent) => {
    const parsed = read(event, row);
    const theirs = parsed.fields;
    let fields = row.fields;
    const dirty: Unit[] = [];
    const lostUnits: Unit[] = [];
    let lost: Partial<Fields> = row.lost ?? {};
    for (const unit of UNIT_NAMES) {
      // bb never edits records it couldn't read, so Google's copy of them always wins.
      if (!row.dirty.includes(unit) || unit === "slots") {
        fields = withUnit(fields, theirs, unit);
        continue;
      }
      const changedThere = !row.base || !sameUnit(theirs, row.base, unit);
      if (sameUnit(theirs, fields, unit)) continue;
      if (!changedThere) {
        dirty.push(unit);
        continue;
      }
      lostUnits.push(unit);
      lost = { ...lost, ...pickUnit(fields, unit) };
      fields = withUnit(fields, theirs, unit);
    }
    if (lostUnits.length) {
      const conflictFields = [...new Set([...(row.conflict?.fields ?? []), ...lostUnits])];
      const values: Record<string, unknown> = { ...(row.conflict?.values ?? {}) };
      for (const unit of lostUnits) Object.assign(values, conflictValues(row.fields, unit));
      row.conflict = { fields: conflictFields, values, message: conflictMessage(conflictFields) };
      row.lost = lost;
    }
    row.fields = fields;
    row.base = theirs;
    row.dirty = dirty;
    row.eventId = event.id;
    row.etag = event.etag ?? null;
    row.created = event.created ?? row.created;
    row.seriesStart = parsed.start;
    row.raw = event.description ?? "";
    row.block ??= parsed.block;
    row.updatedAt = event.updated ?? nowIso();
    if (!dirty.length && !row.rewrite) row.seq = null;
  };

  /** Google accepted bb's write: what bb sent is now the base. No re-parse, so nothing bb wrote is reinterpreted. */
  const confirm = (row: Row, event: GoogleEvent, body: EventWrite, block: string) => {
    row.eventId = event.id;
    row.etag = event.etag ?? null;
    row.created = event.created ?? row.created;
    if (body.description !== undefined) row.block = block;
    row.raw = event.description ?? body.description ?? row.raw;
    row.seriesStart = parseEvent(event, []).start;
    row.base = row.fields;
    row.dirty = [];
    row.rewrite = false;
    row.seq = null;
    store.put(row);
  };

  /** The event is gone in Google. Unsynced edits are kept by recreating the item in Later. */
  const goneInGoogle = (row: Row): boolean => {
    if (row.deleted || row.dirty.length === 0) {
      store.remove(row.ccId);
      return false;
    }
    row.fields = { ...row.fields, tray: "later", date: null, rrule: null, anchor: null, time: null, minutes: null, days: 1 };
    unlinkEvent(row);
    row.notice = DELETED_NOTICE;
    row.seq ??= store.nextSeq();
    store.put(row);
    return true;
  };

  /** Forget the Google event so the next push inserts a new one, keeping her raw description for the splice. */
  const unlinkEvent = (row: Row) => {
    row.eventId = null;
    row.etag = null;
    row.created = null;
    row.base = null;
    row.seriesStart = null;
    row.clientId = newClientId();
    row.dirty = UNIT_NAMES.filter((unit) => unit !== "notes" || row.dirty.includes("notes"));
  };

  const isGone = (error: unknown) => error instanceof GoogleHttpError && (error.status === 404 || error.status === 410);

  const getOrNull = (calendar: string, eventId: string) =>
    google.getEvent(calendar, eventId).catch((error: unknown) => {
      if (isGone(error)) return null;
      throw error;
    });

  const push = async (calendar: string, row: Row): Promise<void> => {
    if (row.deleted) {
      // An insert whose response was lost may still have created the event under its client ID.
      const eventId = row.eventId ?? row.clientId;
      if (eventId) {
        try {
          await google.deleteEvent(calendar, eventId);
        } catch (error) {
          if (!isGone(error)) throw error;
          await assertCalendar(calendar);
        }
        store.markDeleted(eventId, nowIso());
      }
      store.remove(row.ccId);
      return;
    }
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const previous = { raw: row.raw, block: row.block, notesDirty: row.dirty.includes("notes") };
      const { body, block } = buildEvent(row.ccId, row.fields, monday(), itemTitle, previous, !row.eventId);
      if (!row.eventId) {
        const clientId = (row.clientId ??= newClientId());
        try {
          confirm(row, await google.insertEvent(calendar, { ...body, id: clientId }), body, block);
          return;
        } catch (error) {
          if (!(error instanceof GoogleHttpError && error.status === 409)) {
            if (isGone(error)) await assertCalendar(calendar);
            throw error;
          }
          // An earlier insert landed: take that event and write bb's version over it.
          const existing = await getOrNull(calendar, clientId);
          if (existing && existing.status !== "cancelled") {
            const parsed = read(existing, null);
            row.eventId = existing.id;
            row.etag = existing.etag ?? null;
            row.created = existing.created ?? null;
            row.base = parsed.fields;
            row.raw = existing.description ?? "";
            row.block = parsed.block ?? row.block;
            row.seriesStart = parsed.start;
            row.dirty = [...UNIT_NAMES];
          } else {
            row.clientId = newClientId();
          }
          store.put(row);
          continue;
        }
      }
      let updated: GoogleEvent;
      try {
        updated = await google.patchEvent(calendar, row.eventId, body, row.etag);
      } catch (error) {
        if (!(error instanceof GoogleHttpError)) throw error;
        if (error.status === 412) {
          // Changed in Google since bb last saw it: read her latest version, keep bb-only changes, then retry.
          const latest = await getOrNull(calendar, row.eventId);
          if (latest && latest.status !== "cancelled") {
            merge(row, latest);
            store.put(row);
            if (!row.dirty.length && !row.rewrite) return;
            continue;
          }
        } else if (isGone(error)) {
          await assertCalendar(calendar);
        } else {
          throw error;
        }
        if (!goneInGoogle(row)) return;
        continue;
      }
      if (body.recurrence.length === 0 && (updated.recurrence ?? []).length > 0) {
        // Google kept the repeat rule: replace the series with a single event carrying the same ccId.
        row.etag = updated.etag ?? null;
        store.put(row);
        try {
          await google.deleteEvent(calendar, updated.id);
        } catch (error) {
          if (!isGone(error)) throw error;
        }
        store.markDeleted(updated.id, nowIso());
        if (body.description !== undefined) row.block = block;
        row.raw = updated.description ?? body.description ?? row.raw;
        unlinkEvent(row);
        store.put(row);
        continue;
      }
      confirm(row, updated, body, block);
      return;
    }
    deps.log.warn(`Content Calendar: ${row.ccId} kept changing in Google Calendar; retrying on the next sync`);
  };

  const globalFailure = (error: unknown) =>
    error instanceof GoogleUnavailable || error instanceof GoogleAuthRevoked || error instanceof CalendarGone;

  /**
   * Pushes queued rows in order. One row's failure never blocks the others: it is
   * recorded on the row and retried with backoff, and skipped for the rest of this sync.
   */
  const flush = async (failed: Set<string>): Promise<boolean> => {
    const calendar = calendarId();
    const now = deps.now().getTime();
    let pushed = false;
    for (const queued of store.queued()) {
      if (failed.has(queued.ccId) || (queued.retryAt && Date.parse(queued.retryAt) > now)) continue;
      const row = store.row(queued.ccId);
      if (!row || row.seq === null) continue;
      try {
        await push(calendar, row);
        pushed = true;
        const after = store.row(row.ccId);
        if (after && (after.failed || after.attempts)) {
          after.failed = null;
          after.attempts = 0;
          after.retryAt = null;
          store.put(after);
        }
      } catch (error) {
        if (globalFailure(error)) throw error;
        failed.add(row.ccId);
        const reason = error instanceof Error ? error.message : String(error);
        const current = store.row(row.ccId) ?? row;
        current.attempts += 1;
        current.retryAt = new Date(now + Math.min(RETRY_BASE * 2 ** (current.attempts - 1), RETRY_MAX)).toISOString();
        current.failed = error instanceof GoogleHttpError ? `Google Calendar rejected this change: ${reason}` : `Couldn't sync this change: ${reason}`;
        store.put(current);
        deps.log.warn(`Content Calendar: ${row.ccId} wasn't saved to Google Calendar: ${reason}`);
      }
    }
    return pushed;
  };

  // Pulling from Google.

  const cancelled = (eventId: string): boolean => {
    if (store.wasDeleted(eventId)) {
      store.forgetDeleted(eventId);
      return false;
    }
    const row = store.rowByEvent(eventId) ?? store.rowByClient(eventId);
    if (!row) return false;
    goneInGoogle(row);
    return true;
  };

  const upsert = (event: GoogleEvent): boolean => {
    const pending = store.rowByClient(event.id);
    if (pending) {
      // bb's own insert, whose response was lost: adopt the event; the queued push writes bb's version.
      const parsed = read(event, null);
      pending.eventId = event.id;
      pending.etag = event.etag ?? null;
      pending.created = event.created ?? null;
      pending.base = parsed.fields;
      pending.raw = event.description ?? "";
      pending.block = parsed.block ?? pending.block;
      pending.seriesStart = parsed.start;
      pending.dirty = [...UNIT_NAMES];
      pending.seq ??= store.nextSeq();
      store.put(pending);
      return true;
    }
    const existing = store.rowByEvent(event.id);
    if (existing) {
      if (existing.etag && existing.etag === event.etag) return false;
      merge(existing, event);
      store.put(existing);
      return true;
    }
    const parsed = read(event, null);
    const base = parsed.fields;
    const fields = { ...base };
    let ccId = parsed.ccId;
    let rewrite = false;
    if (!ccId) {
      // Created in Google Calendar: a new Idea whose format follows a format color; bb adds ☐ and its block.
      ccId = freshId();
      rewrite = true;
      fields.pos = appendPos(fields, null);
    } else {
      const owner = store.row(ccId);
      if (owner) {
        // Two events share an ID (she duplicated one): the older event keeps it.
        const ownerOlder = !owner.created || !event.created || owner.created <= event.created;
        if (ownerOlder) {
          ccId = freshId();
          rewrite = true;
        } else {
          const moved = freshId();
          store.rename(owner.ccId, moved);
          const renamed = store.row(moved)!;
          renamed.rewrite = true;
          renamed.seq ??= store.nextSeq();
          store.put(renamed);
        }
      }
    }
    const dirty = changedUnits(base, fields);
    store.put({
      ccId,
      eventId: event.id,
      etag: event.etag ?? null,
      created: event.created ?? null,
      fields,
      base,
      dirty,
      rewrite,
      seq: rewrite || dirty.length ? store.nextSeq() : null,
      deleted: false,
      block: parsed.block,
      raw: event.description ?? "",
      clientId: null,
      attempts: 0,
      retryAt: null,
      failed: null,
      seriesStart: parsed.start,
      conflict: null,
      lost: null,
      notice: null,
      updatedAt: event.updated ?? nowIso(),
    });
    return true;
  };

  /** Single-occurrence edits stay in Google, except ☑ on one occurrence, which posts the item on that date. */
  const exception = (event: GoogleEvent): boolean => {
    if (event.status === "cancelled" || !event.recurringEventId || !/^\s*☑/u.test(event.summary ?? "")) return false;
    const row = store.rowByEvent(event.recurringEventId);
    const date = occurrenceDate(event);
    if (!row || row.deleted || !row.fields.tray || !date) return false;
    const next: Fields = { ...row.fields, status: "posted", date, tray: null, rrule: null, anchor: null, time: null, minutes: null, days: 1 };
    commitLocal(row, next, changedUnits(row.fields, next));
    return true;
  };

  const pull = async (): Promise<boolean> => {
    const calendar = calendarId();
    const syncToken = store.meta.get("syncToken");
    const events: GoogleEvent[] = [];
    let nextSyncToken: string | null = null;
    let pageToken: string | undefined;
    try {
      do {
        const page = await google.listEvents(calendar, { syncToken: syncToken ?? undefined, pageToken });
        events.push(...(page.items ?? []));
        pageToken = page.nextPageToken;
        nextSyncToken = page.nextSyncToken ?? nextSyncToken;
      } while (pageToken);
    } catch (error) {
      if (syncToken && error instanceof GoogleHttpError && error.status === 410) {
        store.meta.set("syncToken", null);
        return pull();
      }
      if (isGone(error)) throw new CalendarGone();
      throw error;
    }
    const full = !syncToken;
    const changed = store.transaction(() => {
      let any = false;
      const seen = new Set<string>();
      const exceptions: GoogleEvent[] = [];
      for (const event of events) {
        if (event.recurringEventId) {
          exceptions.push(event);
          continue;
        }
        seen.add(event.id);
        any = (event.status === "cancelled" ? cancelled(event.id) : upsert(event)) || any;
      }
      for (const event of exceptions) any = exception(event) || any;
      if (full) {
        // Anything no longer listed left the calendar.
        for (const row of store.rows()) if (row.eventId && !seen.has(row.eventId)) any = cancelled(row.eventId) || any;
      }
      return any;
    });
    store.meta.set("syncToken", nextSyncToken);
    store.meta.set("lastSyncedAt", nowIso());
    return changed;
  };

  /** On a new calendar week, move each tray series' start to this Monday. */
  const roll = (): boolean => {
    const week = monday();
    if (store.meta.get("rolledWeek") === week) return false;
    let any = false;
    for (const row of store.rows()) {
      if (row.deleted || !row.eventId || !row.fields.tray || row.fields.rrule || row.seriesStart === week) continue;
      row.rewrite = true;
      row.seq ??= store.nextSeq();
      store.put(row);
      any = true;
    }
    store.meta.set("rolledWeek", week);
    return any;
  };

  const canSync = async (force: boolean): Promise<boolean> => {
    const credentials = await deps.credentials.get();
    if (!credentials.clientId || !credentials.clientSecret || !credentials.refreshToken || !store.meta.get("calendarId")) return false;
    if (force && failure()?.state === "reconnect") setFailure(null);
    return failure() === null;
  };

  const handleSyncError = (error: unknown) => {
    syncError = null;
    if (error instanceof GoogleUnavailable) {
      failures += 1;
      offline = error.rateLimited ? "Google Calendar is rate-limiting bb; changes are queued" : "Google Calendar is unreachable; changes are queued";
    } else if (error instanceof GoogleAuthRevoked) {
      google.clearAccessToken();
      setFailure({ state: "reconnect", message: "Reconnect Google Calendar" });
    } else if (error instanceof CalendarGone) {
      setFailure({ state: "calendar_deleted", message: "The Content calendar was deleted in Google Calendar" });
    } else {
      failures += 1;
      const reason = error instanceof Error ? error.message : String(error);
      syncError = `Sync failed: ${reason}`;
      deps.log.error(`Content Calendar sync failed: ${reason}`);
    }
    deps.publish("status");
  };

  /** Flush queued writes in order, pull Google's changes, roll trays forward, and flush what that produced. */
  /** Returns the rows whose push failed during this sync. */
  const runSync = async (force = false): Promise<Set<string>> => {
    const failed = new Set<string>();
    if (disposed || !(await canSync(force))) return failed;
    const wasOffline = offline !== null || syncError !== null;
    syncing = true;
    try {
      let changed = await flush(failed);
      changed = (await pull()) || changed;
      if (roll() || store.counts().queued > failed.size) changed = (await flush(failed)) || changed;
      offline = null;
      syncError = null;
      failures = 0;
      if (changed || wasOffline) deps.publish(changed ? "sync" : "status");
    } catch (error) {
      handleSyncError(error);
    } finally {
      syncing = false;
    }
    return failed;
  };

  // Operations.

  const finishWrite = async (ccId: string, units: readonly Unit[], strict: boolean): Promise<Item> => {
    deps.publish("items");
    const failed = await runSync();
    const row = store.item(ccId);
    if (!row) throw new CalendarError("not_found", `${ccId} was deleted in Google Calendar`);
    if (strict && failed.has(ccId) && row.failed) {
      throw new CalendarError("rejected", row.failed, "The change is saved in bb and retries automatically; fix the item or run `bb content-calendar sync` later");
    }
    if (strict && row.conflict && row.conflict.fields.some((field) => units.includes(field as Unit))) {
      throw new CalendarError("conflict", row.conflict.message, `Run \`bb content-calendar reapply ${ccId}\` to write your value over Google Calendar's`, row.conflict.fields);
    }
    return view(row);
  };

  const mutate = (ccId: string, strict: boolean, change: (fields: Fields, row: Row) => Fields): Promise<Item> =>
    serialize(async () => {
      await ensureWritable();
      const row = liveRow(ccId);
      const next = change(structuredClone(row.fields), row);
      const units = changedUnits(row.fields, next);
      if (units.length === 0) return view(row);
      assertFits(ccId, next);
      commitLocal(row, next, units);
      return finishWrite(ccId, units, strict);
    });

  const nextChildId = (prefix: string, existing: { id: string }[]) => {
    const numbers = existing.map((entry) => (entry.id.startsWith(prefix) ? Number(entry.id.slice(prefix.length)) : 0)).filter(Number.isFinite);
    return `${prefix}${Math.max(0, ...numbers) + 1}`;
  };

  const limit = (message: string, hint?: string) => new CalendarError("limit", message, hint);

  const datedFrom = (fields: Fields, date: string): Fields => ({ ...fields, date, tray: null, rrule: null, anchor: null, time: null, minutes: null, days: 1 });

  const add = (input: In<"add">, strict: boolean): Promise<Item> =>
    serialize(async () => {
      await ensureWritable();
      const ccId = freshId();
      let fields: Fields = {
        title: input.title.trim(),
        format: input.format,
        status: input.status ?? "idea",
        date: "date" in input.when ? input.when.date : null,
        time: null,
        minutes: null,
        days: 1,
        tray: "tray" in input.when ? input.when.tray : null,
        rrule: null,
        anchor: null,
        target: input.target?.trim() || null,
        notes: input.notes?.trim() ?? "",
        gates: [],
        attachments: [],
        pos: 0,
      };
      if (fields.status === "posted" && fields.tray) fields = datedFrom(fields, today());
      fields.pos = appendPos(fields, null);
      store.put({
        ccId, eventId: null, etag: null, created: null, fields, base: null, dirty: [...UNIT_NAMES], rewrite: false,
        seq: store.nextSeq(), deleted: false, block: null, raw: null, clientId: newClientId(),
        attempts: 0, retryAt: null, failed: null, seriesStart: null, conflict: null, lost: null, notice: null, updatedAt: nowIso(),
      });
      return finishWrite(ccId, UNIT_NAMES, strict);
    });

  const update = (input: In<"update">, strict: boolean) =>
    mutate(input.id, strict, (fields) => {
      if (input.title !== undefined) fields.title = input.title.trim();
      if (input.format !== undefined) fields.format = input.format;
      if (input.target !== undefined) fields.target = input.target?.trim() || null;
      if (input.notes !== undefined) fields.notes = input.notes.trim();
      if (input.time !== undefined) {
        if (input.time !== null && fields.tray) throw new CalendarError("invalid", "Tray items have no time of day", "Move the item to a date first");
        fields.time = input.time;
        fields.minutes = input.time ? fields.minutes ?? 60 : null;
      }
      if (input.status !== undefined) {
        if (input.status === "posted" && fields.status !== "posted" && fields.tray) {
          // Checking a tray item gives it today's date and stops it repeating.
          fields = datedFrom(fields, today());
          fields.pos = appendPos(fields, input.id);
        }
        fields.status = input.status;
      }
      return fields;
    });

  const move = (input: In<"move">, strict: boolean) =>
    mutate(input.id, strict, (fields, row) => {
      const before = row.fields;
      if ("date" in input.when) {
        fields = before.tray ? datedFrom(fields, input.when.date) : { ...fields, date: input.when.date };
      } else {
        if (!before.tray) fields = { ...fields, date: null, rrule: null, anchor: null, time: null, minutes: null, days: 1 };
        fields.tray = input.when.tray;
      }
      const reference = input.before ?? input.after;
      if (reference) {
        if (reference === input.id) throw new CalendarError("invalid", "An item can't be placed next to itself");
        const other = liveRow(reference);
        if (!sameBucket(fields, other.fields)) throw new CalendarError("invalid", `${reference} isn't on that day or in that tray`);
        const rows = bucket(fields, input.id);
        const index = rows.findIndex((entry) => entry.ccId === reference);
        const neighbor = input.before ? rows[index - 1] : rows[index + 1];
        const pos = other.fields.pos;
        fields.pos = neighbor ? (pos + neighbor.fields.pos) / 2 : input.before ? pos - 1 : pos + 1;
      } else if (!sameBucket(before, fields)) {
        fields.pos = appendPos(fields, input.id);
      }
      return fields;
    });

  const gateAdd = (input: In<"gateAdd">, strict: boolean) =>
    mutate(input.id, strict, (fields) => {
      if (fields.gates.length >= slotCapacity(fields, "gate")) throw limit(`An item can wait on up to ${LIMITS.gates} things`, "Remove or clear a gate first");
      const id = nextChildId("g", fields.gates);
      const gate = input.gate;
      if (gate.kind === "item") {
        if (gate.itemId === input.id) throw new CalendarError("invalid", "An item can't wait on itself");
        liveRow(gate.itemId);
        fields.gates.push({ id, kind: "item", itemId: gate.itemId });
      } else if (gate.kind === "pr") {
        fields.gates.push({ id, kind: "pr", repo: gate.repo, number: gate.number, cleared: false });
      } else {
        fields.gates.push(gate.url ? { id, kind: "text", text: gate.text.trim(), url: gate.url, cleared: false } : { id, kind: "text", text: gate.text.trim(), cleared: false });
      }
      return fields;
    });

  const findGate = (fields: Fields, gateId: string) => {
    const gate = fields.gates.find((entry) => entry.id === gateId);
    if (!gate) throw new CalendarError("not_found", `No gate ${gateId}`, "Run `bb content-calendar show <id>` to see gate IDs");
    return gate;
  };

  const gateClear = (input: In<"gateClear">, strict: boolean) =>
    mutate(input.id, strict, (fields) => {
      const gate = findGate(fields, input.gateId);
      if (gate.kind === "item") throw new CalendarError("invalid", "A calendar-item gate clears when that item is checked", "Check the item it waits on, or remove the gate");
      gate.cleared = input.cleared ?? true;
      return fields;
    });

  const gateRemove = (input: In<"gateRemove">, strict: boolean) =>
    mutate(input.id, strict, (fields) => {
      findGate(fields, input.gateId);
      fields.gates = fields.gates.filter((gate) => gate.id !== input.gateId);
      return fields;
    });

  const attach = (input: { id: string; attachment: AttachmentInput }, strict: boolean) =>
    mutate(input.id, strict, (fields) => {
      if (fields.attachments.length >= slotCapacity(fields, "att")) throw limit(`An item can have up to ${LIMITS.attachments} attachments`, "Detach one first");
      const attachment = { ...input.attachment, id: nextChildId("a", fields.attachments) } as Attachment;
      const reference = attachment.kind === "file" ? attachment.path : attachment.kind === "url" ? attachment.url : "";
      if (reference.length > LIMITS.reference) throw limit(`Keep URLs and paths to ${LIMITS.reference} characters`);
      fields.attachments.push(attachment);
      return fields;
    });

  const detach = (input: In<"detach">, strict: boolean) =>
    mutate(input.id, strict, (fields) => {
      if (!fields.attachments.some((entry) => entry.id === input.attachmentId)) {
        throw new CalendarError("not_found", `No attachment ${input.attachmentId}`, "Run `bb content-calendar show <id>` to see attachment IDs");
      }
      fields.attachments = fields.attachments.filter((entry) => entry.id !== input.attachmentId);
      return fields;
    });

  const reapply = (input: In<"reapply">, strict: boolean) =>
    serialize(async () => {
      await ensureWritable();
      const row = liveRow(input.id);
      if (!row.conflict) return view(row);
      const units = row.conflict.fields.filter(isUnit);
      let next = row.fields;
      for (const unit of units) next = withUnit(next, row.lost ?? {}, unit);
      row.conflict = null;
      row.lost = null;
      commitLocal(row, next, units);
      return finishWrite(row.ccId, units, strict);
    });

  const resolveCalendar = async (credentials: Credentials, requested: string | null): Promise<string | null> => {
    const stored = store.meta.get("calendarId") ?? credentials.calendarId ?? null;
    if (stored) {
      try {
        await google.getCalendar(stored);
        return stored;
      } catch (error) {
        if (!isGone(error)) throw error;
        if (!requested || requested === stored) {
          store.meta.set("calendarId", stored);
          setFailure({ state: "calendar_deleted", message: "The Content calendar was deleted in Google Calendar" });
          return null;
        }
      }
    }
    if (requested) {
      try {
        await google.getCalendar(requested);
        return requested;
      } catch (error) {
        if (!isGone(error) && !(error instanceof GoogleHttpError && error.status === 403)) throw error;
        throw new CalendarError("invalid", "bb can't reach a calendar with that ID", "Use the ID of the Content calendar bb created, from its settings in Google Calendar");
      }
    }
    if (store.meta.get("everConnected") || store.items().length > 0) {
      throw new CalendarError(
        "calendar_id_required",
        "bb was connected before, so it won't create a second Content calendar",
        "Copy the calendar ID from the Content calendar's settings in Google Calendar, then run `bb content-calendar connect --calendar-id <ID>`",
      );
    }
    return (await google.insertCalendar({ summary: CALENDAR_NAME, timeZone: CALENDAR_TIME_ZONE })).id;
  };

  const useCalendar = async (id: string, keepItems: boolean) => {
    const previous = store.meta.get("calendarId");
    if (previous !== id) {
      if (!keepItems && previous) store.clearItems();
      store.clearDeleted();
      store.meta.set("syncToken", null);
    }
    store.meta.set("calendarId", id);
    store.meta.set("everConnected", "1");
    await deps.credentials.set({ calendarId: id });
  };

  const parseRedirect = (value: string): { code: string | null; state: string | null; error: string | null } => {
    const trimmed = value.trim();
    let url: URL | null = null;
    try {
      url = new URL(trimmed);
    } catch {
      if (/(^|[?&])(code|error)=/.test(trimmed)) url = new URL(`http://127.0.0.1/?${trimmed.replace(/^[^?]*\?/, "")}`);
    }
    if (url) return { code: url.searchParams.get("code"), state: url.searchParams.get("state"), error: url.searchParams.get("error") };
    if (!/^[A-Za-z0-9/_.~%-]+$/.test(trimmed)) return { code: null, state: null, error: null };
    try {
      return { code: decodeURIComponent(trimmed), state: null, error: null };
    } catch {
      return { code: trimmed, state: null, error: null };
    }
  };

  const operations: CalendarOperations = {
    status: () => statusNow(),

    // The page shows the connect steps from `status`, so a disconnected calendar is empty arrays plus that status.
    calendar: async (input) => {
      const status = await statusNow();
      if (!(await connected())) return { items: [], evergreen: [], later: [], status };
      const rows = store.items();
      const lookup = lookupIn(rows);
      const trays = input.trays !== false;
      const pick = (keep: (fields: Fields) => boolean) =>
        rows.filter((row) => keep(row.fields)).map((row) => view(row, lookup)).sort(compareItems);
      return {
        items: pick((fields) => inRange(fields, input.from, input.to)),
        evergreen: trays ? pick((fields) => fields.tray === "evergreen") : [],
        later: trays ? pick((fields) => fields.tray === "later") : [],
        status,
      };
    },

    list: async (input) => {
      await ensureReadable();
      let items = views(store.items());
      if (input.tray) items = items.filter((item) => item.tray === input.tray);
      if (input.from || input.to) items = items.filter((item) => item.tray === null && intersects(item, input.from, input.to));
      if (input.format) items = items.filter((item) => item.format === input.format);
      if (input.status) items = items.filter((item) => item.status === input.status);
      let offset = 0;
      if (input.cursor) {
        try {
          const decoded = JSON.parse(Buffer.from(input.cursor, "base64url").toString("utf8")) as { o?: unknown };
          if (typeof decoded.o !== "number" || !Number.isInteger(decoded.o) || decoded.o < 0) throw new Error("bad cursor");
          offset = decoded.o;
        } catch {
          throw new CalendarError("invalid", "That cursor isn't valid", "Pass the nextCursor from the previous page");
        }
      }
      const size = input.limit ?? LIMITS.listDefault;
      const end = offset + size;
      return {
        items: items.slice(offset, end),
        nextCursor: end < items.length ? Buffer.from(JSON.stringify({ o: end })).toString("base64url") : null,
      };
    },

    show: async (input) => service.get(input.id),

    add: (input) => add(input, false),
    update: (input) => update(input, false),
    move: (input) => move(input, false),
    gateAdd: (input) => gateAdd(input, false),
    gateClear: (input) => gateClear(input, false),
    gateRemove: (input) => gateRemove(input, false),
    attach: (input) => attach(input, false),
    detach: (input) => detach(input, false),
    reapply: (input) => reapply(input, false),

    delete: (input) =>
      serialize(async () => {
        await ensureWritable();
        const row = liveRow(input.id);
        if (!row.eventId && !row.clientId) {
          store.remove(row.ccId);
        } else {
          row.deleted = true;
          row.seq ??= store.nextSeq();
          row.updatedAt = nowIso();
          store.put(row);
        }
        deps.publish("items");
        await runSync();
        return { deleted: true };
      }),

    sync: () =>
      serialize(async () => {
        await runSync(true);
        return statusNow();
      }),

    export: async () => {
      await ensureReadable();
      return { exportedAt: nowIso(), items: views(store.items()) };
    },

    visible: async () => {
      lastVisible = deps.now().getTime();
      return { ok: true };
    },

    connectStart: async (input) => {
      const credentials = await deps.credentials.get();
      if (!credentials.clientId || !credentials.clientSecret) throw needsClient();
      const { verifier, challenge, state } = createPkce();
      store.meta.set("oauth", JSON.stringify({ verifier, state, calendarId: input.calendarId ?? null }));
      return { authUrl: buildAuthUrl(endpoints, credentials.clientId, challenge, state) };
    },

    connectFinish: (input) =>
      serialize(async () => {
        const credentials = await deps.credentials.get();
        if (!credentials.clientId || !credentials.clientSecret) throw needsClient();
        const raw = store.meta.get("oauth");
        if (!raw) throw new CalendarError("invalid", "Start Google sign-in first", CONNECT_HINT);
        const pending = JSON.parse(raw) as { verifier: string; state: string; calendarId: string | null };
        const { code, state, error } = parseRedirect(input.redirectUrl);
        if (error) throw new CalendarError("auth_failed", `Google sign-in failed: ${error}`, CONNECT_HINT);
        if (!code) throw new CalendarError("invalid", "That address has no sign-in code", "Paste the full address of the page that didn't load after you allowed access");
        if (state && state !== pending.state) throw new CalendarError("auth_failed", "That address is from a different sign-in attempt", "Run connect again and paste the newest address");
        let tokens: Awaited<ReturnType<typeof exchangeCode>>;
        try {
          tokens = await exchangeCode(deps.fetch, endpoints, { clientId: credentials.clientId, clientSecret: credentials.clientSecret, code, verifier: pending.verifier });
        } catch (failed) {
          throw new CalendarError("auth_failed", `Google sign-in failed: ${failed instanceof Error ? failed.message : String(failed)}`, CONNECT_HINT);
        }
        if (!tokens.refreshToken) {
          throw new CalendarError("auth_failed", "Google didn't return a refresh token", "Remove bb's access at https://myaccount.google.com/permissions, then connect again");
        }
        await deps.credentials.set({ refreshToken: tokens.refreshToken });
        google.setAccessToken(tokens.accessToken, tokens.expiresIn);
        store.meta.set("oauth", null);
        setFailure(null);
        offline = null;
        failures = 0;
        const id = await resolveCalendar(credentials, pending.calendarId);
        if (id) {
          await useCalendar(id, false);
          await runSync();
        }
        deps.publish("connection");
        return statusNow();
      }),

    disconnect: () =>
      serialize(async () => {
        await deps.credentials.set({ refreshToken: null });
        google.clearAccessToken();
        setFailure(null);
        offline = null;
        failures = 0;
        deps.publish("connection");
        return statusNow();
      }),

    restoreCalendar: () =>
      serialize(async () => {
        await ensureWritable();
        const current = store.meta.get("calendarId");
        if (current) {
          try {
            await google.getCalendar(current);
            throw new CalendarError("invalid", "The Content calendar still exists in Google Calendar", "Nothing to restore; run `bb content-calendar sync` instead");
          } catch (error) {
            if (!isGone(error)) throw error;
          }
        }
        const created = await google.insertCalendar({ summary: CALENDAR_NAME, timeZone: CALENDAR_TIME_ZONE });
        store.transaction(() => {
          for (const row of store.queued().concat(store.rows().filter((entry) => entry.seq === null))) {
            if (row.deleted) {
              store.remove(row.ccId);
              continue;
            }
            unlinkEvent(row);
            row.rewrite = true;
            row.seq ??= store.nextSeq();
            store.put(row);
          }
        });
        await useCalendar(created.id, true);
        setFailure(null);
        await runSync();
        deps.publish("connection");
        return statusNow();
      }),
  };

  const strict: StrictOps = {
    add: (input) => add(input, true),
    update: (input) => update(input, true),
    move: (input) => move(input, true),
    gateAdd: (input) => gateAdd(input, true),
    gateClear: (input) => gateClear(input, true),
    gateRemove: (input) => gateRemove(input, true),
    attach: (input) => attach(input, true),
    detach: (input) => detach(input, true),
    reapply: (input) => reapply(input, true),
  };

  const service: CalendarService = {
    ...operations,
    strict,
    get: async (id) => {
      await ensureReadable();
      const row = store.item(id);
      if (!row) throw new CalendarError("not_found", `No item ${id}`, "Run `bb content-calendar list` to see item IDs");
      return view(row);
    },
    tick: () => serialize(() => runSync()),
    nextTickDelay: () => {
      const now = deps.now().getTime();
      const { queued, failed, nextRetry } = store.counts();
      if (failures > 0 && queued > 0) return Math.min(15_000 * 2 ** (failures - 1), 300_000);
      const polling = now - lastVisible <= VISIBLE_WINDOW ? VISIBLE_DELAY : IDLE_DELAY;
      // Rows waiting out a rejection retry when due; other queued rows retry on the next poll.
      if (failed > 0 && nextRetry) return Math.max(1_000, Math.min(polling, Date.parse(nextRetry) - now));
      return polling;
    },
    trustFile: (machineId, path) => store.trustFile(machineId, path),
    isTrustedFile: (machineId, path) => store.isTrustedFile(machineId, path),
    dispose: () => {
      disposed = true;
    },
  };
  return service;
}

function conflictKeys(unit: Unit): string[] {
  if (unit === "date") return ["date", "tray", "days"];
  return [unit];
}

/** bb's losing values, keyed by the item fields she sees. */
function conflictValues(fields: Fields, unit: Unit): Record<string, unknown> {
  if (unit === "date") return { date: fields.tray ? null : fields.date, tray: fields.tray, days: fields.days };
  if (unit === "waitsOn") return { waitsOn: fields.gates };
  return { [unit]: (fields as unknown as Record<string, unknown>)[unit] };
}

function conflictMessage(fields: readonly string[]): string {
  const labels = fields.map((field) => (isUnit(field) ? UNIT_LABELS[field] : field));
  const list = labels.length > 1 ? `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}` : labels[0] ?? "";
  return `Changed in Google Calendar; your ${list} ${labels.length > 1 ? "changes weren't" : "change wasn't"} applied`;
}
