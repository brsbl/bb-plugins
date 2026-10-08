import Database from "better-sqlite3";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createCalendarService } from "./engine.js";
import { FakeGoogle } from "./fake-google.js";
import { REDIRECT_URI, SCOPE } from "./google.js";
import { BLOCK_HEADER, TRAY_RULE, type GoogleEvent } from "./mapping.js";
import type { Credentials, ServiceDeps } from "./service-api.js";

const WEDNESDAY = new Date("2026-10-07T17:00:00Z"); // 10:00 in Los Angeles; the week starts Monday 2026-10-05
let clock = WEDNESDAY;

afterEach(() => {
  clock = WEDNESDAY;
});

const migrate: ServiceDeps["migrate"] = (db, statements) => {
  db.exec("CREATE TABLE IF NOT EXISTS test_migrations (id INTEGER PRIMARY KEY)");
  statements.forEach((statement, id) => {
    if (db.prepare("SELECT 1 FROM test_migrations WHERE id = ?").get(id)) return;
    db.exec(statement);
    db.prepare("INSERT INTO test_migrations (id) VALUES (?)").run(id);
  });
};

function setup(options: { google?: FakeGoogle; credentials?: Credentials } = {}) {
  const google = options.google ?? new FakeGoogle(() => clock);
  let credentials: Credentials = options.credentials ?? { clientId: "client", clientSecret: "secret" };
  const publish = vi.fn();
  const deps: ServiceDeps = {
    db: new Database(":memory:"),
    migrate,
    credentials: {
      get: async () => ({ ...credentials }),
      set: async (values) => {
        const next: Credentials = { ...credentials };
        if (values.refreshToken === null) delete next.refreshToken;
        else if (values.refreshToken !== undefined) next.refreshToken = values.refreshToken;
        if (values.calendarId === null) delete next.calendarId;
        else if (values.calendarId !== undefined) next.calendarId = values.calendarId;
        credentials = next;
      },
    },
    publish,
    fetch: google.fetch,
    now: () => clock,
    log: { info: () => {}, warn: () => {}, error: () => {} },
    google: google.endpoints,
  };
  const service = createCalendarService(deps);
  const connect = async (calendarId?: string) => {
    const { authUrl } = await service.connectStart(calendarId ? { calendarId } : {});
    return service.connectFinish({ redirectUrl: google.authorize(authUrl) });
  };
  return { service, google, publish, connect, credentials: () => credentials };
}

async function connected(options: Parameters<typeof setup>[0] = {}) {
  const context = setup(options);
  await context.connect();
  return context;
}

function only(google: FakeGoogle, ccId: string): GoogleEvent {
  const events = google.byCcId(ccId);
  expect(events).toHaveLength(1);
  return events[0]!;
}

describe("connect", () => {
  it("asks only for calendar.app.created and creates exactly one Content calendar", async () => {
    const { service, google, credentials } = setup();
    const { authUrl } = await service.connectStart({});
    const params = new URL(authUrl).searchParams;
    expect(params.get("scope")).toBe(SCOPE);
    expect(params.get("scope")).toBe("https://www.googleapis.com/auth/calendar.app.created");
    expect(params.get("code_challenge_method")).toBe("S256");
    expect(params.get("redirect_uri")).toBe(REDIRECT_URI);
    expect(params.get("access_type")).toBe("offline");
    expect(params.get("prompt")).toBe("consent");

    const status = await service.connectFinish({ redirectUrl: google.authorize(authUrl) });
    expect(status.state).toBe("synced");
    expect(google.calendarList()).toEqual([expect.objectContaining({ summary: "Content", timeZone: "America/Los_Angeles" })]);
    expect(status.calendarId).toBe(google.calendarList()[0]!.id);
    expect(credentials()).toMatchObject({ refreshToken: expect.any(String), calendarId: status.calendarId });
  });

  it("rejects a pasted address from another sign-in attempt", async () => {
    const { service, google } = setup();
    const first = await service.connectStart({});
    await service.connectStart({});
    await expect(service.connectFinish({ redirectUrl: google.authorize(first.authUrl) })).rejects.toMatchObject({ code: "auth_failed" });
  });

  it("reuses the same calendar after disconnecting and reconnecting", async () => {
    const { service, google, connect, credentials } = await connected();
    const item = await service.add({ title: "Ambient tweet", format: "tweet", when: { date: "2026-10-09" } });
    const { calendarId } = await service.status({});
    const disconnected = await service.disconnect({});
    expect(disconnected.state).toBe("not_connected");
    expect(credentials().refreshToken).toBeUndefined();
    expect(google.byCcId(item.id)).toHaveLength(1);

    const status = await connect();
    expect(status).toMatchObject({ state: "synced", calendarId });
    expect(google.calendarList()).toHaveLength(1);
    expect((await service.show({ id: item.id })).title).toBe("Ambient tweet");
  });

  it("reuses the calendar and rebuilds the cache when bb's data is lost", async () => {
    const first = await connected();
    const item = await first.service.add({ title: "Ambient tweet", format: "tweet", when: { tray: "evergreen" } });
    const calendarId = first.credentials().calendarId!;

    const fresh = setup({ google: first.google, credentials: { clientId: "client", clientSecret: "secret" } });
    await fresh.connect(calendarId);
    expect(first.google.calendarList()).toHaveLength(1);
    expect(await fresh.service.show({ id: item.id })).toMatchObject({ title: "Ambient tweet", tray: "evergreen", format: "tweet" });
  });

  it("needs a client before connecting and a connection before writing", async () => {
    const noClient = setup({ credentials: {} });
    await expect(noClient.service.connectStart({})).rejects.toMatchObject({ code: "needs_client" });
    expect((await noClient.service.status({})).state).toBe("needs_client");

    const { service } = setup();
    expect(await service.list({})).toEqual({ items: [], nextCursor: null });
    await expect(service.add({ title: "x", format: null, when: { date: "2026-10-09" } }))
      .rejects.toMatchObject({ code: "not_connected", hint: "Run `bb content-calendar connect`" });
  });
});

describe("writes", () => {
  it("add, update, move, check, and delete each change the Google event", async () => {
    const { service, google } = await connected();
    const item = await service.add({ title: "Orchestration blog post", format: "blog", when: { date: "2026-10-28" }, notes: "Publish first." });
    expect(item).toMatchObject({ sync: "synced", status: "idea", date: "2026-10-28", days: 1 });
    let event = only(google, item.id);
    expect(event).toMatchObject({ summary: "☐ Orchestration blog post", colorId: "10", start: { date: "2026-10-28" }, end: { date: "2026-10-29" } });
    expect(event.extendedProperties?.private).toMatchObject({ ccId: item.id, status: "idea", format: "blog" });
    expect(event.description).toBe(`Publish first.\n\n${BLOCK_HEADER}\nbb blog post · Idea`);

    await service.update({ id: item.id, title: "Orchestration tweet", format: "tweet", target: "Downloads baseline" });
    event = only(google, item.id);
    expect(event).toMatchObject({ summary: "☐ Orchestration tweet", colorId: "7" });
    expect(event.extendedProperties?.private?.target).toBe("Downloads baseline");

    await service.move({ id: item.id, when: { date: "2026-10-30" } });
    expect(only(google, item.id).start).toEqual({ date: "2026-10-30" });

    const checked = await service.update({ id: item.id, status: "posted" });
    expect(checked.status).toBe("posted");
    expect(only(google, item.id).summary).toBe("☑ Orchestration tweet");
    await service.update({ id: item.id, status: "ready" });
    expect(only(google, item.id).summary).toBe("☐ Orchestration tweet");

    expect(await service.delete({ id: item.id })).toEqual({ deleted: true });
    expect(google.byCcId(item.id)).toHaveLength(0);
    await service.tick();
    expect((await service.list({})).items).toEqual([]);
  });

  it("clears gate and attachment slots in Google when they're removed", async () => {
    const { service, google } = await connected();
    const item = await service.add({ title: "Saved Places", format: "site", when: { date: "2026-10-09" } });
    const gated = await service.gateAdd({ id: item.id, gate: { kind: "pr", repo: "get-bb/bb", number: 4772 } });
    const attached = await service.attach({ id: item.id, attachment: { kind: "url", url: "https://getbb.app/places" } });
    expect(only(google, item.id).extendedProperties?.private).toMatchObject({ gate1: expect.any(String), att1: expect.any(String) });
    await service.gateRemove({ id: item.id, gateId: gated.waitsOn[0]!.id });
    await service.detach({ id: item.id, attachmentId: attached.attachments[0]!.id });
    const props = only(google, item.id).extendedProperties?.private ?? {};
    expect(props.gate1).toBeUndefined();
    expect(props.att1).toBeUndefined();
  });

  it("refuses a sixth gate", async () => {
    const { service } = await connected();
    const item = await service.add({ title: "Gated", format: null, when: { date: "2026-10-09" } });
    for (let number = 1; number <= 5; number += 1) await service.gateAdd({ id: item.id, gate: { kind: "pr", repo: "get-bb/bb", number } });
    await expect(service.gateAdd({ id: item.id, gate: { kind: "text", text: "One more" } })).rejects.toMatchObject({ code: "limit" });
  });

  it("orders a day by fractional position and pages the list", async () => {
    const { service } = await connected();
    const a = await service.add({ title: "A", format: null, when: { date: "2026-10-09" } });
    const b = await service.add({ title: "B", format: null, when: { date: "2026-10-09" } });
    const c = await service.add({ title: "C", format: null, when: { date: "2026-10-09" } });
    await service.move({ id: c.id, when: { date: "2026-10-09" }, before: a.id });
    const first = await service.list({ limit: 2 });
    expect(first.items.map((item) => item.title)).toEqual(["C", "A"]);
    const rest = await service.list({ limit: 2, cursor: first.nextCursor! });
    expect(rest).toEqual({ items: [expect.objectContaining({ id: b.id })], nextCursor: null });
  });
});

describe("Google Calendar edits", () => {
  it("a drag, rename, ☑, ☐, color, and delete come back on the next tick", async () => {
    const { service, google } = await connected();
    const item = await service.add({ title: "Ambient tweet", format: "tweet", when: { date: "2026-10-09" } });
    const eventId = only(google, item.id).id;

    google.drag(eventId, "2026-10-12");
    google.rename(eventId, "☑ Ambient launch tweet");
    await service.tick();
    expect(await service.show({ id: item.id })).toMatchObject({ date: "2026-10-12", title: "Ambient launch tweet", status: "posted", sync: "synced" });

    google.rename(eventId, "☐ Ambient launch tweet");
    await service.tick();
    expect((await service.show({ id: item.id })).status).toBe("ready");

    google.rename(eventId, "No prefix");
    google.setColor(eventId, "6");
    await service.tick();
    expect(await service.show({ id: item.id })).toMatchObject({ title: "No prefix", status: "ready", format: "essay" });

    google.deleteEvent(eventId);
    await service.tick();
    await expect(service.show({ id: item.id })).rejects.toMatchObject({ code: "not_found" });
  });

  it("gives an event created in Google an ID, no format, status Idea, ☐, and the block", async () => {
    const { service, google, credentials } = await connected();
    const eventId = google.createEvent(credentials().calendarId!, { summary: "Her idea", date: "2026-10-16", description: "From my phone" });
    await service.tick();
    const [item] = (await service.list({})).items;
    expect(item).toMatchObject({ title: "Her idea", format: null, status: "idea", date: "2026-10-16", notes: "From my phone", sync: "synced" });
    const event = google.event(eventId);
    expect(event.summary).toBe("☐ Her idea");
    expect(event.description).toBe(`From my phone\n\n${BLOCK_HEADER}\nNo format · Idea`);
    expect(event.extendedProperties?.private?.ccId).toBe(item!.id);
  });

  it("a duplicated event becomes a second item with its own ID", async () => {
    const { service, google } = await connected();
    const item = await service.add({ title: "Ambient tweet", format: "tweet", when: { date: "2026-10-09" } });
    const original = only(google, item.id).id;
    const copy = google.duplicate(original);
    await service.tick();
    const items = (await service.list({})).items;
    expect(items).toHaveLength(2);
    expect(new Set(items.map((entry) => entry.id)).size).toBe(2);
    expect(only(google, item.id).id).toBe(original);
    expect(google.event(copy).extendedProperties?.private?.ccId).not.toBe(item.id);
  });

  it("text she adds inside or after the block survives the next bb write", async () => {
    const { service, google } = await connected();
    const item = await service.add({ title: "Essay", format: "essay", when: { date: "2026-10-20" }, notes: "Outline first." });
    const event = only(google, item.id);
    const description = event.description!.replace(BLOCK_HEADER, `${BLOCK_HEADER}\nInside the block`);
    google.editDescription(event.id, `${description}\nAfter the block`);

    const updated = await service.update({ id: item.id, target: "Newsletter signups" });
    expect(updated).toMatchObject({ sync: "synced", target: "Newsletter signups", notes: "Outline first.\n\nInside the block\nAfter the block" });
    const written = only(google, item.id).description!;
    expect(written).toBe(`Outline first.\n\nInside the block\nAfter the block\n\n${BLOCK_HEADER}\nEssay · Idea · Target: Newsletter signups`);
  });

  it("a dated event she makes repeat moves to Later and keeps her rule until scheduled", async () => {
    const { service, google } = await connected();
    const item = await service.add({ title: "Weekly roundup", format: "blog", when: { date: "2026-10-09" } });
    const eventId = only(google, item.id).id;
    google.addRule(eventId, "RRULE:FREQ=WEEKLY;BYDAY=FR");
    await service.tick();
    expect(await service.show({ id: item.id })).toMatchObject({ tray: "later", date: null });
    expect(google.event(eventId).recurrence).toEqual(["RRULE:FREQ=WEEKLY;BYDAY=FR"]);

    await service.move({ id: item.id, when: { date: "2026-10-23" } });
    expect(google.event(eventId)).toMatchObject({ start: { date: "2026-10-23" } });
    expect(google.event(eventId).recurrence).toBeUndefined();
  });

  it("runs a full resync when the sync token expires", async () => {
    const { service, google } = await connected();
    const item = await service.add({ title: "Ambient tweet", format: "tweet", when: { date: "2026-10-09" } });
    google.expireSyncTokens();
    google.rename(only(google, item.id).id, "☐ Renamed in Google");
    await service.tick();
    expect(await service.show({ id: item.id })).toMatchObject({ title: "Renamed in Google", sync: "synced" });
    expect((await service.status({})).state).toBe("synced");
    expect(google.requests.some((request) => request.status === 410)).toBe(true);
  });
});

describe("offline and failures", () => {
  it("queues writes while offline and applies them in order without duplicates", async () => {
    const { service, google } = await connected();
    const a = await service.add({ title: "A", format: "tweet", when: { date: "2026-10-12" } });
    google.offline = true;
    const b = await service.add({ title: "B", format: "blog", when: { date: "2026-10-13" } });
    expect(b.sync).toBe("queued");
    expect((await service.update({ id: a.id, title: "A edited" })).sync).toBe("queued");
    expect((await service.move({ id: b.id, when: { tray: "later" } })).sync).toBe("queued");
    expect(await service.status({})).toMatchObject({ state: "offline", queued: 2 });
    expect(service.nextTickDelay()).toBe(60_000);

    google.offline = false;
    const before = google.requests.length;
    await service.tick();
    const writes = google.requests.slice(before).filter((request) => request.method === "POST" || request.method === "PATCH");
    expect(writes.map((request) => request.method)).toEqual(["POST", "PATCH"]);
    expect(await service.status({})).toMatchObject({ state: "synced", queued: 0 });
    expect((await service.list({})).items.every((item) => item.sync === "synced")).toBe(true);
    expect(google.list()).toHaveLength(2);
    expect(only(google, a.id).summary).toBe("☐ A edited");
    expect(only(google, b.id).recurrence).toEqual([TRAY_RULE]);
  });

  it("recreates an item in Later when Google deletes it while bb has unsynced edits", async () => {
    const { service, google } = await connected();
    const item = await service.add({ title: "Draft", format: "essay", when: { date: "2026-10-14" } });
    const eventId = only(google, item.id).id;
    google.offline = true;
    await service.update({ id: item.id, title: "Draft, edited offline" });
    google.offline = false;
    google.deleteEvent(eventId);
    await service.tick();
    expect(await service.show({ id: item.id })).toMatchObject({
      title: "Draft, edited offline", tray: "later", date: null, sync: "synced",
      notice: "Deleted in Google Calendar while you had unsynced changes",
    });
    const recreated = only(google, item.id);
    expect(recreated.id).not.toBe(eventId);
    expect(recreated.recurrence).toEqual([TRAY_RULE]);
  });

  it("keeps accepting writes after access is revoked and replays them after reconnecting", async () => {
    const { service, google, connect } = await connected();
    const item = await service.add({ title: "Ambient tweet", format: "tweet", when: { date: "2026-10-09" } });
    google.revoke();
    await service.tick();
    expect((await service.status({})).state).toBe("reconnect");
    expect((await service.update({ id: item.id, title: "Edited while revoked" })).sync).toBe("queued");
    expect(await connect()).toMatchObject({ state: "synced", queued: 0 });
    expect(only(google, item.id).summary).toBe("☐ Edited while revoked");
    expect(google.calendarList()).toHaveLength(1);
  });

  it("reports a deleted calendar and restores every item into a new one", async () => {
    const { service, google, credentials } = await connected();
    const dated = await service.add({ title: "Dated", format: "site", when: { date: "2026-10-09" } });
    const tray = await service.add({ title: "Tray", format: "tweet", when: { tray: "evergreen" } });
    const oldId = credentials().calendarId!;
    google.deleteCalendar(oldId);
    await service.tick();
    expect((await service.status({})).state).toBe("calendar_deleted");

    const status = await service.restoreCalendar({});
    expect(status.state).toBe("synced");
    expect(status.calendarId).not.toBe(oldId);
    expect(google.calendarList()).toHaveLength(1);
    const restored = google.list(status.calendarId!);
    expect(restored.map((event) => event.extendedProperties?.private?.ccId).sort()).toEqual([dated.id, tray.id].sort());
  });
});

describe("conflicts", () => {
  it("reapplies only bb's fields when Google changed others", async () => {
    const { service, google } = await connected();
    const item = await service.add({ title: "Ambient tweet", format: "tweet", when: { date: "2026-10-09" } });
    google.rename(only(google, item.id).id, "☐ Her title");
    const moved = await service.move({ id: item.id, when: { date: "2026-10-16" } });
    expect(moved).toMatchObject({ title: "Her title", date: "2026-10-16", sync: "synced", conflict: null });
    expect(only(google, item.id)).toMatchObject({ summary: "☐ Her title", start: { date: "2026-10-16" } });
  });

  it("keeps Google's value on a same-field conflict; strict rejects; reapply writes bb's value", async () => {
    const { service, google } = await connected();
    const item = await service.add({ title: "Ambient tweet", format: "tweet", when: { date: "2026-10-12" } });
    const eventId = only(google, item.id).id;

    google.drag(eventId, "2026-10-14");
    const moved = await service.move({ id: item.id, when: { date: "2026-10-15" } });
    expect(moved).toMatchObject({ date: "2026-10-14", sync: "conflict" });
    expect(moved.conflict).toMatchObject({ fields: ["date"], values: { date: "2026-10-15" } });
    expect(moved.conflict?.message).toBe("Changed in Google Calendar; your date change wasn't applied");
    expect((await service.status({})).conflicts).toBe(1);

    const reapplied = await service.reapply({ id: item.id });
    expect(reapplied).toMatchObject({ date: "2026-10-15", sync: "synced", conflict: null });
    expect(google.event(eventId).start).toEqual({ date: "2026-10-15" });

    google.drag(eventId, "2026-10-20");
    await expect(service.strict.move({ id: item.id, when: { date: "2026-10-21" } })).rejects.toMatchObject({ code: "conflict", fields: ["date"] });
    expect(google.event(eventId).start).toEqual({ date: "2026-10-20" });
  });
});

describe("trays", () => {
  it("a tray item is one Monday series, shown once in its tray", async () => {
    const { service, google } = await connected();
    const item = await service.add({ title: "Ambient clip", format: "tweet", when: { tray: "evergreen" } });
    expect(item).toMatchObject({ tray: "evergreen", date: null });
    const event = only(google, item.id);
    expect(event).toMatchObject({ recurrence: [TRAY_RULE], start: { date: "2026-10-05" } });
    expect(event.extendedProperties?.private?.tray).toBe("evergreen");

    const view = await service.calendar({ from: "2026-09-28", to: "2026-11-08" });
    expect(view.items).toEqual([]);
    expect(view.evergreen.map((entry) => entry.id)).toEqual([item.id]);
  });

  it("moving between a day and a tray keeps the ID and leaves exactly one event", async () => {
    const { service, google } = await connected();
    const item = await service.add({ title: "Ambient clip", format: "tweet", when: { tray: "later" } });
    const eventId = only(google, item.id).id;

    const dated = await service.move({ id: item.id, when: { date: "2026-10-20" } });
    expect(dated).toMatchObject({ id: item.id, date: "2026-10-20", tray: null });
    expect(only(google, item.id)).toMatchObject({ id: eventId, start: { date: "2026-10-20" } });
    expect(google.event(eventId).recurrence).toBeUndefined();

    const back = await service.move({ id: item.id, when: { tray: "evergreen" } });
    expect(back).toMatchObject({ id: item.id, tray: "evergreen", date: null });
    expect(only(google, item.id)).toMatchObject({ id: eventId, recurrence: [TRAY_RULE] });
    expect(google.list()).toHaveLength(1);
  });

  it("rolls each series forward to the new week's Monday", async () => {
    const { service, google } = await connected();
    const item = await service.add({ title: "Ambient clip", format: "tweet", when: { tray: "evergreen" } });
    clock = new Date("2026-10-12T17:00:00Z");
    await service.tick();
    expect(only(google, item.id)).toMatchObject({ start: { date: "2026-10-12" }, recurrence: [TRAY_RULE] });
    const writes = google.requests.filter((request) => request.method === "PATCH").length;
    await service.tick();
    expect(google.requests.filter((request) => request.method === "PATCH")).toHaveLength(writes);
  });

  it("checking a tray item dates it today and stops it repeating", async () => {
    const { service, google } = await connected();
    const item = await service.add({ title: "Ambient clip", format: "tweet", when: { tray: "evergreen" } });
    const checked = await service.update({ id: item.id, status: "posted" });
    expect(checked).toMatchObject({ status: "posted", date: "2026-10-07", tray: null });
    const event = only(google, item.id);
    expect(event).toMatchObject({ summary: "☑ Ambient clip", start: { date: "2026-10-07" } });
    expect(event.recurrence).toBeUndefined();
  });

  it("☑ on one occurrence posts the item on that date; other occurrence edits change nothing", async () => {
    const { service, google } = await connected();
    const item = await service.add({ title: "Ambient clip", format: "tweet", when: { tray: "evergreen" } });
    const eventId = only(google, item.id).id;

    google.deleteOccurrence(eventId, "2026-10-12");
    google.editOccurrence(eventId, "2026-10-19", "☐ Ambient clip, retitled once");
    await service.tick();
    expect(await service.show({ id: item.id })).toMatchObject({ tray: "evergreen", status: "idea", title: "Ambient clip" });

    google.editOccurrence(eventId, "2026-10-26", "☑ Ambient clip");
    await service.tick();
    expect(await service.show({ id: item.id })).toMatchObject({ status: "posted", date: "2026-10-26", tray: null });
    expect(google.event(eventId)).toMatchObject({ summary: "☑ Ambient clip", start: { date: "2026-10-26" } });
    expect(google.event(eventId).recurrence).toBeUndefined();
  });
});

describe("gates", () => {
  it("an item gate clears while its item is checked, without writing the waiting item", async () => {
    const { service, google } = await connected();
    const blog = await service.add({ title: "Orchestration blog post", format: "blog", when: { date: "2026-10-28" } });
    const tweet = await service.add({ title: "Orchestration tweet", format: "tweet", when: { date: "2026-10-29" } });
    const gated = await service.gateAdd({ id: tweet.id, gate: { kind: "item", itemId: blog.id } });
    expect(gated.waitsOn).toEqual([expect.objectContaining({ kind: "item", cleared: false, title: "Orchestration blog post", date: "2026-10-28" })]);
    const etag = only(google, tweet.id).etag;

    await service.update({ id: blog.id, status: "posted" });
    expect((await service.show({ id: tweet.id })).waitsOn[0]).toMatchObject({ cleared: true });
    await service.update({ id: blog.id, status: "ready" });
    expect((await service.show({ id: tweet.id })).waitsOn[0]).toMatchObject({ cleared: false });
    expect(only(google, tweet.id).etag).toBe(etag);

    await service.delete({ id: blog.id });
    expect((await service.show({ id: tweet.id })).waitsOn[0]).toMatchObject({ cleared: false, title: null });
  });
});

describe("polling", () => {
  it("polls every minute while a view is visible and every ten minutes otherwise", async () => {
    const { service } = await connected();
    expect(service.nextTickDelay()).toBe(600_000);
    await service.visible({});
    expect(service.nextTickDelay()).toBe(60_000);
    clock = new Date(WEDNESDAY.getTime() + 91_000);
    expect(service.nextTickDelay()).toBe(600_000);
  });
});

describe("descriptions bb didn't write", () => {
  it("keeps tag-like text bb wrote intact across writes and syncs", async () => {
    const { service, google } = await connected();
    const notes = "Use <br> tags\nand </div> too";
    const item = await service.add({ title: "Markup post", format: "blog", when: { date: "2026-10-09" }, notes });
    await service.gateAdd({ id: item.id, gate: { kind: "text", text: "fix </div> bug" } });
    await service.update({ id: item.id, title: "Markup post, again" });
    google.rename(only(google, item.id).id, "☐ Renamed in Google");
    await service.tick();
    await service.update({ id: item.id, target: "Readers" });

    expect((await service.show({ id: item.id })).notes).toBe(notes);
    const description = only(google, item.id).description!;
    expect(description.startsWith(`${notes}\n\n${BLOCK_HEADER}`)).toBe(true);
    expect(description.split(BLOCK_HEADER)).toHaveLength(2);
    expect(description).toContain("fix </div> bug (not cleared)");
  });

  it("never resends her HTML description unless the block changed, and then keeps her markup", async () => {
    const { service, google } = await connected();
    const item = await service.add({ title: "Essay", format: "essay", when: { date: "2026-10-20" }, notes: "Outline" });
    const eventId = only(google, item.id).id;
    const block = google.event(eventId).description!.slice("Outline\n\n".length);
    const prefix = "<p>Read <a href=\"https://example.com/draft\">the draft</a></p>";
    const html = `${prefix}${block.split("\n").join("<br>")}`;
    google.editDescription(eventId, html);

    const renamed = await service.update({ id: item.id, title: "Essay, retitled" });
    expect(renamed).toMatchObject({ title: "Essay, retitled", notes: "Read the draft", sync: "synced" });
    expect(google.event(eventId).description).toBe(html);

    await service.update({ id: item.id, target: "Subscribers" });
    const written = google.event(eventId).description!;
    expect(written.startsWith(prefix)).toBe(true);
    expect(written).toContain("Target: Subscribers");
    expect(written.split(BLOCK_HEADER)).toHaveLength(2);
  });
});

describe("inserts and repeat rules", () => {
  it("a retried insert after a lost response doesn't duplicate the event", async () => {
    const { service, google } = await connected();
    google.loseResponses = 1;
    const item = await service.add({ title: "Ambient tweet", format: "tweet", when: { date: "2026-10-09" } });
    expect(item.sync).toBe("queued");
    expect(google.list()).toHaveLength(1);

    await service.tick();
    expect(google.requests.some((request) => request.status === 409)).toBe(true);
    expect(google.list()).toHaveLength(1);
    expect(only(google, item.id).summary).toBe("☐ Ambient tweet");
    expect(await service.show({ id: item.id })).toMatchObject({ sync: "synced" });
  });

  it("deleting an item whose insert response was lost deletes the event it created", async () => {
    const { service, google } = await connected();
    google.loseResponses = 1;
    const item = await service.add({ title: "Ambient tweet", format: "tweet", when: { date: "2026-10-09" } });
    expect(google.list()).toHaveLength(1);
    await service.delete({ id: item.id });
    expect(google.list()).toHaveLength(0);
    await service.tick();
    expect((await service.list({})).items).toEqual([]);
  });

  it("replaces a series with a single event when Google keeps the repeat rule", async () => {
    const { service, google } = await connected();
    const item = await service.add({ title: "Ambient clip", format: "tweet", when: { tray: "evergreen" } });
    const seriesId = only(google, item.id).id;
    google.ignoreEmptyRecurrence = true;

    const dated = await service.move({ id: item.id, when: { date: "2026-10-20" } });
    expect(dated).toMatchObject({ id: item.id, date: "2026-10-20", tray: null, sync: "synced" });
    const single = only(google, item.id);
    expect(single.id).not.toBe(seriesId);
    expect(single.recurrence).toBeUndefined();
    expect(single.start).toEqual({ date: "2026-10-20" });

    await service.tick();
    expect(await service.show({ id: item.id })).toMatchObject({ date: "2026-10-20", tray: null });
    expect(google.list()).toHaveLength(1);
  });
});
