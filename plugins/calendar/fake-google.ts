import type { GoogleEvent } from "./events.js";
import type { GoogleEndpoints } from "./google.js";

// An in-memory, read-only Google Calendar for tests and dev QA. Nothing here talks to Google.

export function createFakeGoogle(base = "https://fake-google.test") {
  const endpoints: GoogleEndpoints = { apiBase: `${base}/calendar/v3`, tokenUrl: `${base}/token` };
  const calendars = new Map<string, Map<string, GoogleEvent>>();
  const failing = new Set<string>();
  const calendar = (id: string) => {
    let events = calendars.get(id);
    if (!events) calendars.set(id, (events = new Map()));
    return events;
  };
  const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  const bounds = (event: GoogleEvent) => ({
    start: Date.parse(event.start?.dateTime ?? `${event.start?.date}T00:00:00Z`),
    end: Date.parse(event.end?.dateTime ?? `${event.end?.date}T00:00:00Z`),
  });

  async function handle(input: Parameters<typeof fetch>[0], init?: RequestInit): Promise<Response> {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url);
    if (url.toString().startsWith(endpoints.tokenUrl)) return json(200, { access_token: "fake-access-token", expires_in: 3600 });
    if (!new Headers(init?.headers).get("authorization")?.startsWith("Bearer ")) return json(401, { error: { message: "No token" } });
    const match = url.pathname.match(/\/calendar\/v3\/calendars\/([^/]+)\/events(?:\/([^/]+))?$/);
    if (!match) return json(404, { error: { message: "Not found" } });
    const calendarId = decodeURIComponent(match[1]!);
    if (failing.has(calendarId)) return json(503, { error: { message: "Backend error" } });
    const events = calendars.get(calendarId);
    if (!events) return json(404, { error: { message: "Not found" } });
    if (match[2]) {
      const event = events.get(decodeURIComponent(match[2]));
      return event ? json(200, event) : json(404, { error: { message: "Not found" } });
    }
    const timeMin = Date.parse(url.searchParams.get("timeMin") ?? "") || -Infinity;
    const timeMax = Date.parse(url.searchParams.get("timeMax") ?? "") || Infinity;
    const items = [...events.values()]
      .filter((event) => event.status !== "cancelled" && bounds(event).end > timeMin && bounds(event).start < timeMax)
      .sort((a, b) => bounds(a).start - bounds(b).start);
    return json(200, { items });
  }

  return {
    endpoints,
    fetch: handle as typeof fetch,
    addCalendar: (calendarId: string) => void calendar(calendarId),
    put(calendarId: string, event: GoogleEvent) {
      calendar(calendarId).set(event.id, { status: "confirmed", ...event });
    },
    /** Move a timed event, keeping its length. */
    move(calendarId: string, eventId: string, start: string) {
      const event = calendar(calendarId).get(eventId);
      if (!event?.start?.dateTime || !event.end?.dateTime) throw new Error(`No timed event ${eventId}`);
      const length = Date.parse(event.end.dateTime) - Date.parse(event.start.dateTime);
      event.start = { dateTime: new Date(Date.parse(start)).toISOString() };
      event.end = { dateTime: new Date(Date.parse(start) + length).toISOString() };
    },
    /** Google keeps canceled events with status "cancelled". */
    cancel(calendarId: string, eventId: string) {
      const event = calendar(calendarId).get(eventId);
      if (event) event.status = "cancelled";
    },
    remove: (calendarId: string, eventId: string) => void calendar(calendarId).delete(eventId),
    setFailing(calendarId: string, value: boolean) {
      if (value) failing.add(calendarId);
      else failing.delete(calendarId);
    },
    list: () => Object.fromEntries([...calendars].map(([id, events]) => [id, [...events.values()]])),
  };
}

export type FakeGoogle = ReturnType<typeof createFakeGoogle>;
