import { createHash } from "node:crypto";
import { addDays } from "./model.js";
import type { GoogleEvent } from "./mapping.js";
import type { GoogleEndpoints } from "./google.js";

// An in-memory Google Calendar v3 API and OAuth token endpoint behind a fetch-compatible function,
// plus helpers that make the edits brsbl makes in Google Calendar.

export const FAKE_ENDPOINTS: GoogleEndpoints = {
  apiBase: "https://calendar.fake/calendar/v3",
  authUrl: "https://accounts.fake/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.fake/token",
};

interface FakeCalendar {
  id: string;
  summary: string;
  timeZone: string;
  deleted: boolean;
}

interface StoredEvent extends GoogleEvent {
  calendarId: string;
  seq: number;
}

type Json = Record<string, unknown>;

export class FakeGoogle {
  readonly endpoints = FAKE_ENDPOINTS;
  readonly calendars = new Map<string, FakeCalendar>();
  readonly requests: { method: string; path: string; status: number }[] = [];
  /** Network down: every request rejects like fetch does. */
  offline = false;
  /** The next N API requests answer 429. */
  rateLimited = 0;
  /** The next N requests reach Google, but their responses are lost on the way back. */
  loseResponses = 0;
  /** PATCH with `recurrence: []` leaves the repeat rule in place. */
  ignoreEmptyRecurrence = false;
  /** The next N event inserts or patches answer 400, as Google does for a body it won't accept. */
  rejectWrites = 0;
  private readonly events = new Map<string, StoredEvent>();
  private readonly codes = new Map<string, { challenge: string; scope: string; clientId: string }>();
  private readonly refreshTokens = new Set<string>();
  private readonly accessTokens = new Set<string>();
  private seq = 0;
  private ids = 0;
  private minSyncSeq = 0;

  constructor(private readonly clock: () => Date = () => new Date()) {}

  readonly fetch: typeof fetch = async (input, init) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url);
    const method = (init?.method ?? "GET").toUpperCase();
    if (this.offline) throw new TypeError("fetch failed");
    const response = this.handle(method, url, new Headers(init?.headers), typeof init?.body === "string" ? init.body : "");
    this.requests.push({ method, path: url.pathname, status: response.status });
    if (this.loseResponses > 0) {
      this.loseResponses -= 1;
      throw new TypeError("fetch failed");
    }
    return response;
  };

  // OAuth.

  /** What Google does when she allows access: returns the loopback address to paste back. */
  authorize(authUrl: string): string {
    const url = new URL(authUrl);
    const params = url.searchParams;
    if (params.get("code_challenge_method") !== "S256") throw new Error("PKCE S256 required");
    const code = `4/code-${this.nextId()}`;
    this.codes.set(code, { challenge: params.get("code_challenge") ?? "", scope: params.get("scope") ?? "", clientId: params.get("client_id") ?? "" });
    const redirect = new URL(params.get("redirect_uri") ?? "");
    redirect.searchParams.set("state", params.get("state") ?? "");
    redirect.searchParams.set("code", code);
    redirect.searchParams.set("scope", params.get("scope") ?? "");
    return redirect.toString();
  }

  /** She removes bb's access in her Google account. */
  revoke(): void {
    this.refreshTokens.clear();
    this.accessTokens.clear();
  }

  // Inspection.

  /** Live calendars. */
  calendarList(): FakeCalendar[] {
    return [...this.calendars.values()].filter((calendar) => !calendar.deleted);
  }

  event(id: string): GoogleEvent {
    const event = this.events.get(id);
    if (!event) throw new Error(`No fake event ${id}`);
    return publicEvent(event);
  }

  /** Live events and series (not single-occurrence exceptions). */
  list(calendarId?: string): GoogleEvent[] {
    return [...this.events.values()]
      .filter((event) => event.status !== "cancelled" && !event.recurringEventId && (!calendarId || event.calendarId === calendarId))
      .map(publicEvent);
  }

  byCcId(ccId: string): GoogleEvent[] {
    return this.list().filter((event) => event.extendedProperties?.private?.ccId === ccId);
  }

  // Edits she makes in Google Calendar.

  rename(id: string, summary: string): void {
    this.edit(id, (event) => { event.summary = summary; });
  }

  /** Drags the event to another day, keeping its length and time. */
  drag(id: string, date: string): void {
    this.edit(id, (event) => {
      const from = event.start?.date ?? event.start?.dateTime?.slice(0, 10);
      if (!from) return;
      const shift = Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
      event.start = shiftWhen(event.start, shift);
      event.end = shiftWhen(event.end, shift);
    });
  }

  editDescription(id: string, description: string): void {
    this.edit(id, (event) => { event.description = description; });
  }

  setColor(id: string, colorId: string | null): void {
    this.edit(id, (event) => {
      if (colorId === null) delete event.colorId;
      else event.colorId = colorId;
    });
  }

  /** Another app writes a private property (or removes it with `null`). */
  setPrivate(id: string, key: string, value: string | null): void {
    this.edit(id, (event) => {
      const props = { ...(event.extendedProperties?.private ?? {}) };
      if (value === null) delete props[key];
      else props[key] = value;
      event.extendedProperties = { ...event.extendedProperties, private: props };
    });
  }

  addRule(id: string, rule: string): void {
    this.edit(id, (event) => { event.recurrence = [rule]; });
  }

  deleteEvent(id: string): void {
    this.cancel(id);
  }

  /** Google's Duplicate: a new event with every field, private properties included. */
  duplicate(id: string): string {
    const source = this.stored(id);
    const copy: StoredEvent = { ...structuredClone(source), id: this.nextId() };
    this.stamp(copy, true);
    this.events.set(copy.id, copy);
    return copy.id;
  }

  createEvent(calendarId: string, input: { summary: string; date: string; description?: string; colorId?: string }): string {
    const event: StoredEvent = {
      id: this.nextId(), calendarId, seq: 0, status: "confirmed", summary: input.summary,
      start: { date: input.date }, end: { date: addDays(input.date, 1) },
    };
    if (input.description !== undefined) event.description = input.description;
    if (input.colorId !== undefined) event.colorId = input.colorId;
    this.stamp(event, true);
    this.events.set(event.id, event);
    return event.id;
  }

  /** Types a new title on one occurrence of a series, which Google stores as an exception. */
  editOccurrence(id: string, date: string, summary: string): string {
    const exception = this.exception(id, date);
    exception.summary = summary;
    this.stamp(exception);
    return exception.id;
  }

  deleteOccurrence(id: string, date: string): void {
    const exception = this.exception(id, date);
    exception.status = "cancelled";
    this.stamp(exception);
  }

  deleteCalendar(calendarId: string): void {
    const calendar = this.calendars.get(calendarId);
    if (calendar) calendar.deleted = true;
  }

  /** Every outstanding sync token now answers 410. */
  expireSyncTokens(): void {
    this.minSyncSeq = this.seq + 1;
  }

  // Internals.

  private nextId(): string {
    this.ids += 1;
    return `ev${this.ids.toString(36).padStart(6, "0")}`;
  }

  private stored(id: string): StoredEvent {
    const event = this.events.get(id);
    if (!event) throw new Error(`No fake event ${id}`);
    return event;
  }

  private stamp(event: StoredEvent, created = false): void {
    this.seq += 1;
    event.seq = this.seq;
    event.etag = `"${this.seq}"`;
    // Offset by the sequence so creation order is strict even with a frozen clock.
    const at = new Date(this.clock().getTime() + this.seq).toISOString();
    event.updated = at;
    if (created) event.created = at;
  }

  private edit(id: string, change: (event: StoredEvent) => void): void {
    const event = this.stored(id);
    change(event);
    this.stamp(event);
  }

  private cancel(id: string): void {
    const event = this.stored(id);
    event.status = "cancelled";
    this.stamp(event);
    if (!event.recurringEventId) this.cancelExceptions(id);
  }

  private cancelExceptions(masterId: string): void {
    for (const event of this.events.values()) {
      if (event.recurringEventId === masterId && event.status !== "cancelled") {
        event.status = "cancelled";
        this.stamp(event);
      }
    }
  }

  private exception(masterId: string, date: string): StoredEvent {
    const master = this.stored(masterId);
    const id = `${masterId}_${date.replace(/-/g, "")}`;
    let exception = this.events.get(id);
    if (!exception) {
      exception = {
        ...structuredClone(master), id, recurringEventId: masterId, originalStartTime: { date },
        start: { date }, end: { date: addDays(date, 1) },
      };
      delete exception.recurrence;
      this.stamp(exception, true);
      this.events.set(id, exception);
    }
    return exception;
  }

  private handle(method: string, url: URL, headers: Headers, body: string): Response {
    if (`${url.origin}${url.pathname}` === this.endpoints.tokenUrl) return this.token(new URLSearchParams(body));
    const base = new URL(this.endpoints.apiBase);
    if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) return error(404, "Unknown endpoint");
    const auth = headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
    if (!this.accessTokens.has(auth)) return error(401, "Invalid Credentials");
    if (this.rateLimited > 0) {
      this.rateLimited -= 1;
      return error(429, "Rate Limit Exceeded");
    }
    const parts = url.pathname.slice(base.pathname.length).split("/").filter(Boolean).map(decodeURIComponent);
    if (parts[0] !== "calendars") return error(404, "Not Found");
    if (parts.length === 1 && method === "POST") return this.insertCalendar(parseBody(body));
    const calendar = this.calendars.get(parts[1] ?? "");
    if (!calendar || calendar.deleted) return error(404, "Not Found");
    if (parts.length === 2 && method === "GET") return json(200, { id: calendar.id, summary: calendar.summary, timeZone: calendar.timeZone });
    if (parts[2] !== "events") return error(404, "Not Found");
    if (parts.length === 3 && method === "GET") return this.listEvents(calendar.id, url.searchParams);
    if (parts.length === 3 && method === "POST") return this.insertEvent(calendar.id, parseBody(body));
    const event = this.events.get(parts[3] ?? "");
    if (!event || event.calendarId !== calendar.id) return error(404, "Not Found");
    if (method === "GET") return json(200, publicEvent(event));
    if (event.status === "cancelled") return error(410, "Resource has been deleted");
    const ifMatch = headers.get("if-match");
    if (ifMatch && ifMatch !== event.etag) return error(412, "Precondition Failed");
    if (method === "DELETE") {
      this.cancel(event.id);
      return new Response(null, { status: 204 });
    }
    if (method === "PATCH") return this.patchEvent(event, parseBody(body));
    return error(405, "Method Not Allowed");
  }

  private token(form: URLSearchParams): Response {
    if (form.get("grant_type") === "authorization_code") {
      const code = this.codes.get(form.get("code") ?? "");
      const verifier = form.get("code_verifier") ?? "";
      if (!code || createHash("sha256").update(verifier).digest("base64url") !== code.challenge || code.clientId !== form.get("client_id")) {
        return json(400, { error: "invalid_grant", error_description: "Bad Request" });
      }
      this.codes.delete(form.get("code") ?? "");
      const refresh = `1//refresh-${this.nextId()}`;
      const access = `ya29.access-${this.nextId()}`;
      this.refreshTokens.add(refresh);
      this.accessTokens.add(access);
      return json(200, { access_token: access, refresh_token: refresh, expires_in: 3599, scope: code.scope, token_type: "Bearer" });
    }
    if (form.get("grant_type") === "refresh_token") {
      if (!this.refreshTokens.has(form.get("refresh_token") ?? "")) return json(400, { error: "invalid_grant", error_description: "Token has been expired or revoked." });
      const access = `ya29.access-${this.nextId()}`;
      this.accessTokens.add(access);
      return json(200, { access_token: access, expires_in: 3599, token_type: "Bearer" });
    }
    return json(400, { error: "unsupported_grant_type" });
  }

  private insertCalendar(body: Json): Response {
    const id = `${this.nextId()}@group.calendar.google.com`;
    const calendar: FakeCalendar = { id, summary: String(body.summary ?? ""), timeZone: String(body.timeZone ?? "UTC"), deleted: false };
    this.calendars.set(id, calendar);
    return json(200, { id, summary: calendar.summary, timeZone: calendar.timeZone });
  }

  private listEvents(calendarId: string, params: URLSearchParams): Response {
    const syncToken = params.get("syncToken");
    let after = 0;
    if (syncToken) {
      after = Number(syncToken.replace(/^sync:/, ""));
      if (!Number.isFinite(after) || after < this.minSyncSeq) return error(410, "Sync token is no longer valid, a full sync is required.");
    }
    const matching = [...this.events.values()]
      .filter((event) => event.calendarId === calendarId && event.seq > after)
      .filter((event) => syncToken || params.get("showDeleted") === "true" || event.status !== "cancelled")
      .sort((a, b) => a.seq - b.seq);
    const max = Number(params.get("maxResults") ?? "250");
    const offset = Number(params.get("pageToken") ?? "0");
    const page = matching.slice(offset, offset + max);
    const more = offset + max < matching.length;
    return json(200, {
      items: page.map(publicEvent),
      ...(more ? { nextPageToken: String(offset + max) } : { nextSyncToken: `sync:${this.seq}` }),
    });
  }

  private insertEvent(calendarId: string, body: Json): Response {
    // Like Google, insert rejects null values (PATCH uses them to clear fields).
    if (hasNull(body)) return error(400, "Required");
    let id = this.nextId();
    const requested = body.id;
    if (requested !== undefined) {
      if (typeof requested !== "string" || !/^[a-v0-9]{5,1024}$/.test(requested)) return error(400, "Invalid resource id value.");
      // IDs stay taken after delete, like Google's.
      if (this.events.has(requested)) return error(409, "The requested identifier already exists.");
      id = requested;
    }
    if (this.rejectWrites > 0) {
      this.rejectWrites -= 1;
      return error(400, "Bad Request");
    }
    const event: StoredEvent = { id, calendarId, seq: 0, status: "confirmed" };
    applyPatch(event, body);
    if (!validWhen(event)) return error(400, "Invalid start or end");
    if (oversized(event)) return error(400, "Extended property value too long");
    this.stamp(event, true);
    this.events.set(event.id, event);
    return json(200, publicEvent(event));
  }

  private patchEvent(event: StoredEvent, body: Json): Response {
    if (this.rejectWrites > 0) {
      this.rejectWrites -= 1;
      return error(400, "Bad Request");
    }
    const draft = structuredClone(event);
    const hadRule = (draft.recurrence ?? []).length > 0;
    const recurrence = body.recurrence;
    const ignored = this.ignoreEmptyRecurrence && Array.isArray(recurrence) && recurrence.length === 0;
    applyPatch(draft, ignored ? Object.fromEntries(Object.entries(body).filter(([key]) => key !== "recurrence")) : body);
    if (!validWhen(draft)) return error(400, "Invalid start or end");
    if (oversized(draft)) return error(400, "Extended property value too long");
    this.events.set(event.id, draft);
    this.stamp(draft);
    if (hadRule && !(draft.recurrence ?? []).length) this.cancelExceptions(draft.id);
    return json(200, publicEvent(draft));
  }
}

export function createFakeGoogle(clock?: () => Date): FakeGoogle {
  return new FakeGoogle(clock);
}

/** PATCH semantics: top-level fields replace, `null` clears, private properties merge with `null` deleting a key. */
function applyPatch(event: StoredEvent, body: Json): void {
  const target = event as unknown as Json;
  for (const [key, value] of Object.entries(body)) {
    if (key === "id" || key === "etag" || key === "calendarId" || key === "seq") continue;
    if (key === "extendedProperties") {
      const incoming = ((value as { private?: Record<string, string | null> } | null)?.private) ?? {};
      const current = { ...(event.extendedProperties?.private ?? {}) };
      for (const [name, inner] of Object.entries(incoming)) {
        if (inner === null) delete current[name];
        else current[name] = inner;
      }
      event.extendedProperties = { ...event.extendedProperties, private: current };
    } else if (key === "start" || key === "end") {
      const when = Object.fromEntries(Object.entries((value ?? {}) as Json).filter(([, inner]) => inner !== null && inner !== undefined));
      target[key] = when;
    } else if (key === "recurrence" && Array.isArray(value) && value.length === 0) {
      delete event.recurrence;
    } else if (value === null) {
      delete target[key];
    } else {
      target[key] = structuredClone(value);
    }
  }
}

/** Google caps each private property value at 1,024 characters. */
function oversized(event: StoredEvent): boolean {
  return Object.values(event.extendedProperties?.private ?? {}).some((value) => value.length > 1024);
}

function validWhen(event: StoredEvent): boolean {
  const ok = (when: GoogleEvent["start"]) => !!when && (!!when.date !== !!when.dateTime);
  return ok(event.start) && ok(event.end);
}

function shiftWhen(when: GoogleEvent["start"], days: number): GoogleEvent["start"] {
  if (!when) return when;
  if (when.date) return { ...when, date: addDays(when.date, days) };
  if (when.dateTime) return { ...when, dateTime: `${addDays(when.dateTime.slice(0, 10), days)}${when.dateTime.slice(10)}` };
  return when;
}

function publicEvent(event: StoredEvent): GoogleEvent {
  const { calendarId: _calendarId, seq: _seq, ...rest } = structuredClone(event);
  if (rest.status === "cancelled") {
    // Google returns only the identity of cancelled events in incremental syncs.
    return rest.recurringEventId
      ? { id: rest.id, etag: rest.etag, status: rest.status, recurringEventId: rest.recurringEventId, originalStartTime: rest.originalStartTime }
      : { id: rest.id, etag: rest.etag, status: rest.status };
  }
  return rest;
}

function parseBody(body: string): Json {
  if (!body) return {};
  return JSON.parse(body) as Json;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function error(status: number, message: string): Response {
  return json(status, { error: { code: status, message, errors: [{ reason: status === 429 ? "rateLimitExceeded" : "fake" }] } });
}

function hasNull(value: unknown): boolean {
  if (value === null) return true;
  if (Array.isArray(value)) return value.some(hasNull);
  if (typeof value === "object") return Object.values(value as Json).some(hasNull);
  return false;
}
