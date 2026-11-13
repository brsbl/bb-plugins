import { beforeEach, describe, expect, it } from "vitest";
import { createEngine, emptyState, MINUTE, SETTLE, type CalendarState, type ThreadPort, type ThreadState } from "./engine";
import type { GoogleEvent } from "./events";
import { createFakeGoogle, type FakeGoogle } from "./fake-google";
import { createGoogleClient } from "./google";

const TZ = "America/Los_Angeles";
const START = Date.parse("2026-10-28T08:00:00-07:00"); // Wed 8am PT
const config = { calendars: ["primary", "family"], timeZone: TZ };

const at = (iso: string) => new Date(Date.parse(iso)).toISOString();
const event = (id: string, startIso: string, overrides: Partial<GoogleEvent> = {}): GoogleEvent => ({
  id,
  summary: `Event ${id}`,
  start: { dateTime: at(startIso) },
  end: { dateTime: new Date(Date.parse(startIso) + 30 * MINUTE).toISOString() },
  created: new Date(START - 24 * 60 * MINUTE).toISOString(),
  htmlLink: `https://www.google.com/calendar/event?eid=${id}`,
  ...overrides,
});

interface FakeThread { id: string; title: string; eventId: string | null; notify: boolean; replies: string[]; archived: boolean; status: ThreadState }

function setup() {
  let now = START;
  const google = createFakeGoogle();
  google.addCalendar("primary");
  google.addCalendar("family");
  const threads = new Map<string, FakeThread>();
  const spawned: FakeThread[] = [];
  const reply = (prompt: string) => prompt.split("<<<CALENDAR\n")[1]!.split("\nCALENDAR>>>")[0]!;
  const port: ThreadPort = {
    async spawn({ title, prompt, eventId, notify }) {
      const thread: FakeThread = { id: `thr_${threads.size + 1}`, title, eventId, notify, replies: [reply(prompt)], archived: false, status: { state: "idle", settledAt: now } };
      threads.set(thread.id, thread);
      spawned.push(thread);
      return thread.id;
    },
    async find(eventId) {
      return [...threads.values()].find((thread) => thread.eventId === eventId && !thread.archived)?.id ?? null;
    },
    async state(threadId) {
      const thread = threads.get(threadId)!;
      return thread.archived ? { state: "gone" } : thread.status;
    },
    async send(threadId, prompt) {
      const thread = threads.get(threadId)!;
      thread.replies.push(reply(prompt));
      thread.status = { state: "idle", settledAt: now };
    },
    async retitle(threadId, title) {
      threads.get(threadId)!.title = title;
    },
    async archive(threadId) {
      threads.get(threadId)!.archived = true;
    },
  };
  let saved: CalendarState = emptyState();
  let onSave = () => {};
  const engine = () => createEngine({
    google: createGoogleClient({ fetch: google.fetch, endpoints: google.endpoints, now: () => now, credentials: async () => ({ clientId: "id", clientSecret: "secret", refreshToken: "refresh" }) }),
    threads: port,
    load: async () => structuredClone(saved),
    save: async (state) => { saved = structuredClone(state); onSave(); },
    now: () => now,
    log: { warn: () => undefined },
  });
  let current = engine();
  return {
    google,
    threads,
    spawned,
    get state() { return saved; },
    set state(value: CalendarState) { saved = value; },
    advance(ms: number) { now += ms; },
    get now() { return now; },
    tick: (fetch = true) => current.tick(config, { fetch }),
    restart() { current = engine(); },
    onSave(listener: () => void) { onSave = listener; },
    /** Lets a sent notice settle, then runs a state-only pass. */
    async settle() { now += SETTLE; await current.tick(config, { fetch: false }); },
  };
}

let t: ReturnType<typeof setup>;
beforeEach(() => { t = setup(); });

const replies = (id: string) => t.threads.get(id)!.replies.map((reply) => reply.split("\n")[0]);

describe("listing", () => {
  it("lists existing events quietly on the first sync and skips all-day events", async () => {
    t.google.put("primary", event("b", "2026-10-29T14:00:00-07:00"));
    t.google.put("primary", event("a", "2026-10-28T12:00:00-07:00"));
    t.google.put("primary", { id: "allday", summary: "Holiday", start: { date: "2026-10-29" }, end: { date: "2026-10-30" } });
    t.google.put("primary", event("far", "2026-11-06T09:00:00-08:00"));
    await t.tick();
    expect(t.spawned.map((thread) => [thread.title, thread.notify])).toEqual([["Event a · Wed 12pm", false], ["Event b · Thu 2pm", false]]);
    expect(t.spawned[0]!.replies[0]).toMatch(/^When: Wed, Oct 28, 12–12:30pm PT/);
  });

  it("announces events created after the first sync", async () => {
    await t.tick();
    t.advance(MINUTE);
    t.google.put("primary", event("booked", "2026-10-28T09:00:00-07:00", {
      summary: "30 min intro call",
      created: new Date(t.now).toISOString(),
      description: "Booked by\nAda Lovelace\nada@example.com",
      extendedProperties: { shared: { "goo.createdBySet": "1" } },
      hangoutLink: "https://meet.google.com/abc",
    }));
    await t.tick();
    expect(t.spawned).toHaveLength(1);
    expect(t.spawned[0]).toMatchObject({ title: "Ada Lovelace · Wed 9am", notify: true, eventId: "booked" });
    expect(replies("thr_1")).toEqual(["New event: 30 min intro call"]);
  });

  it("keeps one thread when an event is on two calendars", async () => {
    t.google.put("primary", event("shared", "2026-10-28T12:00:00-07:00"));
    t.google.put("family", event("shared", "2026-10-28T12:00:00-07:00"));
    await t.tick();
    await t.tick();
    expect(t.spawned).toHaveLength(1);
    expect(t.state.events.shared!.event.calendarId).toBe("primary");
  });
});

describe("notices", () => {
  beforeEach(async () => {
    t.google.put("primary", event("e", "2026-10-28T12:00:00-07:00"));
    await t.tick();
    t.advance(MINUTE);
  });

  it("moves the entry and notifies once with the new time", async () => {
    t.google.move("primary", "e", "2026-10-29T14:00:00-07:00");
    await t.tick();
    expect(t.threads.get("thr_1")).toMatchObject({ title: "Event e · Thu 2pm" });
    expect(replies("thr_1")).toEqual(["When: Wed, Oct 28, 12–12:30pm PT", "Moved to Thu 2pm"]);
    await t.tick();
    await t.settle();
    expect(replies("thr_1")).toHaveLength(2);
  });

  it("waits for a running or just-finished turn before sending", async () => {
    t.threads.get("thr_1")!.status = { state: "busy" };
    t.google.move("primary", "e", "2026-10-29T14:00:00-07:00");
    await t.tick();
    expect(replies("thr_1")).toHaveLength(1);
    t.threads.get("thr_1")!.status = { state: "idle", settledAt: t.now };
    await t.tick(false);
    expect(replies("thr_1")).toHaveLength(1);
    await t.settle();
    expect(replies("thr_1").at(-1)).toBe("Moved to Thu 2pm");
  });

  it("notifies a cancellation, then archives the entry without a reminder", async () => {
    t.google.cancel("primary", "e");
    await t.tick();
    expect(replies("thr_1").at(-1)).toBe("Canceled");
    expect(t.threads.get("thr_1")!.archived).toBe(false);
    await t.settle();
    expect(t.threads.get("thr_1")!.archived).toBe(true);
    t.advance(4 * 60 * MINUTE - 10 * MINUTE);
    await t.tick();
    expect(replies("thr_1")).toEqual(["When: Wed, Oct 28, 12–12:30pm PT", "Canceled"]);
  });

  it("treats a deleted event as canceled", async () => {
    t.google.remove("primary", "e");
    await t.tick();
    expect(replies("thr_1").at(-1)).toBe("Canceled");
  });

  it("says where an event moved past the next 7 days, then removes the entry", async () => {
    t.google.move("primary", "e", "2026-11-10T10:00:00-08:00");
    await t.tick();
    expect(replies("thr_1").at(-1)).toBe("Moved to Tue 10am");
    await t.settle();
    expect(t.threads.get("thr_1")!.archived).toBe(true);
  });

  it("lists an event again when it moves back into the next 7 days", async () => {
    t.google.move("primary", "e", "2026-11-05T10:00:00-08:00");
    await t.tick();
    await t.settle();
    expect(t.threads.get("thr_1")!.archived).toBe(true);
    t.advance(Date.parse("2026-10-29T12:00:00-07:00") - t.now);
    await t.tick();
    expect(t.spawned.map((thread) => [thread.title, thread.notify])).toEqual([["Event e · Wed 12pm", false], ["Event e · Thu 10am", false]]);
    t.advance(Date.parse("2026-11-05T09:50:00-08:00") - t.now);
    await t.tick();
    expect(replies("thr_2").at(-1)).toBe("Starts in 10 min.");
  });

  it("does not rewrite state when nothing changed", async () => {
    let saves = 0;
    const before = JSON.stringify(t.state);
    t.onSave(() => { saves += 1; });
    await t.tick();
    expect(saves).toBeLessThanOrEqual(2);
    expect(JSON.stringify(t.state.events)).toBe(JSON.stringify(JSON.parse(before).events));
  });

  it("reminds once, 10 minutes before the start", async () => {
    t.advance(Date.parse("2026-10-28T11:49:00-07:00") - t.now);
    await t.tick(false);
    expect(replies("thr_1")).toHaveLength(1);
    t.advance(MINUTE);
    await t.tick(false);
    expect(replies("thr_1").at(-1)).toBe("Starts in 10 min.");
    t.advance(MINUTE);
    await t.tick();
    await t.settle();
    expect(replies("thr_1")).toHaveLength(2);
  });

  it("archives 30 minutes after the end", async () => {
    t.advance(Date.parse("2026-10-28T12:59:00-07:00") - t.now);
    await t.tick();
    expect(t.threads.get("thr_1")!.archived).toBe(false);
    t.advance(MINUTE);
    await t.tick();
    expect(t.threads.get("thr_1")!.archived).toBe(true);
  });

  it("leaves an entry alone after she archives it", async () => {
    t.threads.get("thr_1")!.archived = true;
    t.google.move("primary", "e", "2026-10-29T14:00:00-07:00");
    await t.tick();
    await t.settle();
    expect(t.state.events.e!.phase).toBe("done");
    expect(t.spawned).toHaveLength(1);
  });

  it("does not treat events on an unreadable calendar as canceled", async () => {
    t.google.setFailing("primary", true);
    await t.tick();
    await t.settle();
    expect(replies("thr_1")).toHaveLength(1);
    expect(t.state.lastError).toContain("primary");
  });
});

describe("added close to the start", () => {
  it("gets only the first alert", async () => {
    await t.tick();
    t.google.put("primary", event("soon", "2026-10-28T08:08:00-07:00", { created: new Date(t.now).toISOString() }));
    await t.tick();
    await t.settle();
    t.advance(2 * MINUTE);
    await t.tick(false);
    expect(replies("thr_1")).toEqual(["New event: Wed, Oct 28, 8:08–8:38am PT"]);
  });
});

describe("restarts", () => {
  it("never spawns a second thread for an event", async () => {
    t.google.put("primary", event("e", "2026-10-28T12:00:00-07:00"));
    await t.tick();
    t.restart();
    await t.tick();
    expect(t.spawned).toHaveLength(1);
  });

  it("adopts the thread an interrupted spawn made", async () => {
    t.google.put("primary", event("e", "2026-10-28T12:00:00-07:00"));
    await t.tick();
    const state = structuredClone(t.state);
    state.events.e!.threadId = null;
    t.state = state;
    t.restart();
    await t.tick();
    expect(t.spawned).toHaveLength(1);
    expect(t.state.events.e!.threadId).toBe("thr_1");
  });
});

describe("failures", () => {
  it("raises one alert after an hour without Google", async () => {
    t.google.setFailing("primary", true);
    t.google.setFailing("family", true);
    await t.tick();
    t.advance(59 * MINUTE);
    await t.tick();
    expect(t.spawned).toHaveLength(0);
    t.advance(MINUTE);
    await t.tick();
    await t.tick();
    expect(t.spawned.map((thread) => [thread.title, thread.notify])).toEqual([["Calendar can't reach Google", true]]);
  });
});
