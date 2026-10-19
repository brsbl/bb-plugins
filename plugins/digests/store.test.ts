import type { BbPluginApi } from "@get-bb/plugin-sdk";
import Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";

import { createStore, type Owner } from "./store";

const databases: Database.Database[] = [];
afterEach(() => {
  for (const db of databases.splice(0)) db.close();
});

function harness() {
  const db = new Database(":memory:");
  databases.push(db);
  let migrated = false;
  const bb = {
    storage: {
      database: () => db,
      migrate(target: Database.Database, statements: string[]) {
        if (migrated) return;
        target.transaction(() => { for (const statement of statements) target.exec(statement); })();
        migrated = true;
      },
    },
  } as unknown as Pick<BbPluginApi, "storage">;
  const store = createStore(bb);
  store.definitions.put({
    id: "reading", name: "Reading", projectId: "proj_test", instructions: "Read newsletters.",
    connectionIds: ["gmail", "work-mail"], createdAt: 1,
  });
  return { db, bb, store };
}

const issue = (id: string, dedupeKey: string | null = null) => ({
  id, digestId: "reading", headline: "Reading is being prepared", createdAt: 10, dedupeKey,
});
const source = (messageId: string) => ({ connectionId: "gmail", messageId, threadId: `thread-${messageId}` });
const publication = (messageIds: string[]) => ({
  headline: "Two worthwhile reads", metrics: [{ label: "Newsletters", value: String(messageIds.length) }],
  details: "Read these stories for their product lessons.", sources: messageIds.map(source),
});

describe("digest store", () => {
  it("reads definitions and briefs stored by a newer build with unknown keys stripped", () => {
    const { db, store } = harness();
    const definition = { ...store.definitions.get("reading")!, owns: ["newsletters"], futureOption: true };
    db.prepare("UPDATE digest_definitions SET data = ? WHERE id = ?").run(JSON.stringify(definition), "reading");
    store.issues.create(issue("iss_newer"));
    const stored = { ...store.issues.get("iss_newer")!, state: "ready", publishedAt: 20, futureField: true,
      sources: [{ ...source("m1"), class: "money", placement: "shown", futureKey: 1 }],
      brief: { heading: "Needs you", messageIdsVersion: 1,
        items: [{ title: "Upload receipt", text: "Mercury needs it.", messageId: "m1", futureKey: 1, action: { label: "Upload receipt", url: "https://app.mercury.com/" } }],
        later: [{ title: "Renew", messageId: "m2", futureKey: 1 }],
        laterLabel: "Later", all: { label: "All unread", items: [{ title: "A · B", text: "", url: "https://mail.google.com/", messageIds: ["m1"], futureKey: 1 }] } } };
    db.prepare("UPDATE digest_issues SET state = 'ready', data = ? WHERE id = ?").run(JSON.stringify(stored), "iss_newer");

    expect(store.definitions.get("reading")).not.toHaveProperty("futureOption");
    expect(store.definitions.list()[0]).toMatchObject({ owns: ["newsletters"] });
    const read = store.issues.get("iss_newer")!;
    expect(read).not.toHaveProperty("futureField");
    expect(read.sources[0]).toEqual({ ...source("m1"), class: "money", placement: "shown" });
    expect(read.brief).not.toHaveProperty("messageIdsVersion");
    expect(read.brief?.items[0]).toEqual({ title: "Upload receipt", text: "Mercury needs it.", messageId: "m1", action: { label: "Upload receipt", url: "https://app.mercury.com/" } });
    expect(read.brief?.later[0]).toEqual({ title: "Renew", messageId: "m2" });
    expect(read.brief?.all?.items[0]).toEqual({ title: "A · B", text: "", url: "https://mail.google.com/", messageIds: ["m1"] });
    expect(store.issues.list()[0]).toEqual(read);
    expect(store.issues.update("iss_newer", { readAt: 30 }).readAt).toBe(30);
    // Writes stay strict.
    expect(() => store.issues.update("iss_newer", { futureField: true } as never)).toThrow();
  });

  it("retains metadata and idempotency across store reinitialization", () => {
    const { store, bb } = harness();
    store.connections.put({ id: "gmail", name: "Gmail", url: "https://mail.google.com/", status: "signed-in", checkedAt: 10 });
    const first = store.issues.create(issue("iss_first", "reading:2026-10-04"));
    const reopened = createStore(bb);
    expect(reopened.definitions.get("reading")?.enabled).toBe(false);
    expect(reopened.connections.get("gmail")?.status).toBe("signed-in");
    expect(reopened.issues.create(issue("iss_duplicate", "reading:2026-10-04"))).toEqual(first);
    expect(reopened.issues.list()).toHaveLength(1);
    expect(reopened.issues.getByKey("reading", "reading:2026-10-04")).toEqual(first);
  });

  it("leaves failed sources available for retry and commits sources only with the ready issue", () => {
    const { store } = harness();
    store.issues.create(issue("iss_retry"));
    store.issues.update("iss_retry", { state: "failed", recovery: "reconnect", details: "Signed out of Gmail." });
    expect(store.processed("reading", "gmail", ["m1", "m2"])).toEqual([]);
    store.issues.update("iss_retry", { state: "collecting", recovery: null });
    const result = store.issues.publish("iss_retry", publication(["m1", "m2"]), 20);
    expect(result).toMatchObject({ state: "ready", publishedAt: 20, recovery: null });
    expect(store.processed("reading", "gmail", ["m2", "m2", "m1", "m3"])).toEqual(["m2", "m1"]);
    expect(store.issues.publish("iss_retry", publication(["m3"]), 30)).toEqual(result);
    expect(store.processed("reading", "gmail", ["m3"])).toEqual([]);
  });

  it("rejects an entire publication containing an old newsletter without consuming new ones", () => {
    const { store } = harness();
    store.issues.create(issue("iss_previous"));
    store.issues.publish("iss_previous", publication(["old"]), 20);
    store.issues.create(issue("iss_next"));
    expect(() => store.issues.publish("iss_next", publication(["new", "old"]), 30)).toThrow("already digested");
    expect(store.issues.get("iss_next")).toMatchObject({ state: "collecting", publishedAt: null, sources: [] });
    expect(store.processed("reading", "gmail", ["new", "old"])).toEqual(["old"]);
    expect(store.issues.publish("iss_next", publication(["new"]), 40).sources).toEqual([source("new")]);
  });

  it("allows an explicit fresh inbox read while preserving legacy newsletter deduplication", () => {
    const { store } = harness();
    store.issues.create(issue("iss_snippet"));
    store.issues.publish("iss_snippet", publication(["mail1"]), 20);
    store.issues.create(issue("iss_full"));
    const refreshed = store.issues.publish("iss_full", { ...publication([]), sources: [{ ...source("mail1"), deduplicate: false }] }, 30);
    expect(refreshed.state).toBe("ready");
    expect(store.processed("reading", "gmail", ["mail1"])).toEqual(["mail1"]);
    store.issues.create(issue("iss_newsletter"));
    expect(() => store.issues.publish("iss_newsletter", publication(["mail1"]), 40)).toThrow("already digested");
  });

  it("rolls back the issue and sources if a database write fails during publication", () => {
    const { store, db } = harness();
    store.issues.create(issue("iss_failure"));
    db.exec(`CREATE TRIGGER fail_source BEFORE INSERT ON digest_processed_sources
      WHEN NEW.message_id = 'fail' BEGIN SELECT RAISE(ABORT, 'simulated storage failure'); END`);
    expect(() => store.issues.publish("iss_failure", publication(["first", "fail"]), 20)).toThrow("simulated storage failure");
    expect(store.issues.get("iss_failure")).toMatchObject({ state: "collecting", publishedAt: null, sources: [] });
    expect(store.processed("reading", "gmail", ["first", "fail"])).toEqual([]);
  });

  it("scopes processed messages to both digest and connection", () => {
    const { store } = harness();
    store.issues.create(issue("iss_personal"));
    store.issues.publish("iss_personal", publication(["same-id"]), 20);
    expect(store.processed("money", "gmail", ["same-id"])).toEqual([]);
    expect(store.processed("reading", "work-mail", ["same-id"])).toEqual([]);
    store.issues.create(issue("iss_work"));
    expect(store.issues.publish("iss_work", {
      ...publication([]), sources: [{ connectionId: "work-mail", messageId: "same-id" }],
    }, 30).state).toBe("ready");
  });

  it("preserves published content when marking read and prevents moving its thread or bypassing publish", () => {
    const { store } = harness();
    store.issues.create(issue("iss_bound"));
    store.issues.update("iss_bound", { threadId: "thr_issue" });
    const ready = store.issues.publish("iss_bound", publication(["m1"]), 20);
    expect(store.issues.update("iss_bound", { readAt: 30 })).toEqual({ ...ready, readAt: 30 });
    expect(store.issues.getByThread("thr_issue")?.id).toBe("iss_bound");
    expect(() => store.issues.update("iss_bound", { details: "Replacement" })).toThrow("cannot be rewritten");
    expect(() => store.issues.update("iss_bound", { threadId: "thr_other" })).toThrow("already belongs");
    expect(() => store.issues.create({ ...issue("iss_bypass"), state: "ready", sources: [source("m2")] })).toThrow("Use publish");
    expect(store.processed("reading", "gmail", ["m2"])).toEqual([]);
  });

  it("bounds issue listings and rejects publication through an unlisted connection", () => {
    const { store } = harness();
    store.issues.create(issue("iss_one"));
    store.issues.create({ ...issue("iss_two"), createdAt: 20 });
    store.issues.update("iss_two", { state: "failed", recovery: "retry" });
    expect(store.issues.list({ limit: 1 }).map(({ id }) => id)).toEqual(["iss_two"]);
    expect(store.issues.list({ state: "collecting" }).map(({ id }) => id)).toEqual(["iss_one"]);
    expect(() => store.issues.list({ limit: 501 })).toThrow();
    expect(() => store.issues.publish("iss_one", {
      ...publication([]), sources: [{ connectionId: "unknown", messageId: "m1" }],
    }, 30)).toThrow("not listed");
    expect(store.issues.get("iss_one")?.state).toBe("collecting");
  });
});

const HOUR = 3_600_000;
// 06:00 UTC, so every shown date below reads Oct 19 from UTC-11 to UTC+11.
const NOW = Date.UTC(2026, 9, 19, 6);
const moneyOwner: Owner = { class: "money", digestId: "money", name: "Money", connectionIds: ["gmail", "work-mail"], nextRunAt: NOW + 6 * HOUR };
const readingOwner: Owner = { class: "newsletters", digestId: "reading", name: "Reading", connectionIds: ["gmail", "work-mail"], nextRunAt: NOW + 2 * HOUR };
const owners = [moneyOwner, readingOwner];
const base = { headline: "Brief", details: "Details." };
const mailUrl = (messageId: string) => `https://mail.google.com/mail/u/0/#inbox/${messageId}`;

function ledger() {
  const context = harness();
  const { store } = context;
  store.connections.put({ id: "gmail", name: "Personal", url: "https://mail.google.com/mail/u/0/" });
  store.connections.put({ id: "work-mail", name: "Work", url: "https://mail.google.com/mail/u/1/" });
  store.connections.put({ id: "x", name: "X", url: "https://x.com/" });
  for (const [id, name] of [["money", "Money"], ["inbox", "Inbox"]]) {
    store.definitions.put({ id, name, projectId: "proj_test", instructions: "Brief me.", connectionIds: ["gmail", "work-mail"], createdAt: 1 });
  }
  store.definitions.put({ id: "x-feed", name: "X feed", projectId: "proj_test", instructions: "Read X.", connectionIds: ["x"], createdAt: 1 });
  let count = 0;
  const begin = (digestId: string, at = NOW) => store.issues.create({ id: `iss_${digestId}_${count += 1}`, digestId, headline: "Preparing", createdAt: at }).id;
  const handOff = (messageId: string, at = NOW) => {
    store.issues.publish(begin("inbox", at), { ...base, sources: [{ connectionId: "gmail", messageId, class: "money", placement: "handoff" }] }, at, { strict: true, owners });
    return store.emailStatus("money", [{ connectionId: "gmail", messageId }], owners, [])[0] as { emailId: string };
  };
  return { ...context, begin, handOff };
}

describe("email ledger", () => {
  it("flags a newsletter from another inbox as a possible copy and joins same-run copies to one email", () => {
    const { store, db, begin } = ledger();
    const first = begin("reading");
    store.issues.publish(first, { ...base,
      sources: [{ connectionId: "gmail", messageId: "cc1", class: "newsletters", placement: "shown", from: "Claude Code <news@anthropic.com>", subject: "What's new in Claude Code", receivedAt: NOW }],
      brief: { heading: "Reads", items: [], all: { label: "All", items: [{ title: "Claude Code", text: "Plugins land.", url: mailUrl("cc1"), messageIds: ["cc1"] }] } },
    }, NOW, { strict: true, owners });
    const later = NOW + 18.5 * HOUR;
    const candidate = { connectionId: "work-mail", messageId: "cc2", from: "NEWS@anthropic.com", subject: "what's new in  claude code", receivedAt: later };
    expect(store.emailStatus("reading", [candidate, { ...candidate, receivedAt: NOW + 73 * HOUR }], owners, [])).toEqual([
      { status: "possible-copy", digestId: "reading", digestName: "Reading", issueId: first, row: { title: "Claude Code", text: "Plugins land." } },
      { status: "new" },
    ]);

    const second = begin("inbox", later);
    const statement = { from: "alerts@bank.com", subject: "Your statement", receivedAt: later };
    store.issues.publish(second, { ...base, sources: [
      { connectionId: "gmail", messageId: "st1", class: "other", placement: "shown", ...statement },
      { connectionId: "work-mail", messageId: "st2", copyOf: { connectionId: "gmail", messageId: "st1" }, ...statement },
    ], brief: { heading: "Inbox", items: [], all: { label: "All", items: [{ title: "Bank", text: "Statement", url: mailUrl("st1"), messageIds: ["st1"], copies: [{ label: "Work", url: mailUrl("st2") }] }] } } }, later, { strict: true, owners });
    const copies = db.prepare("SELECT DISTINCT email_id FROM digest_email_copies WHERE gmail_message_id IN ('st1', 'st2')").all();
    expect(copies).toHaveLength(1);
    expect(db.prepare("SELECT count(*) AS count FROM digest_email_copies WHERE gmail_message_id IN ('st1', 'st2')").get()).toEqual({ count: 2 });
    expect(store.emailStatus("money", [{ connectionId: "work-mail", messageId: "st2" }], owners, [])[0])
      .toMatchObject({ status: "shown", digestId: "inbox", digestName: "Inbox", issueId: second, shownAt: later });
  });

  it("hands money mail to its owner and keeps every other brief from showing it again", () => {
    const { store, begin, handOff } = ledger();
    const { emailId } = handOff("bill1");
    expect(() => store.issues.publish(begin("inbox"), { ...base, sources: [{ connectionId: "gmail", messageId: "bill1", class: "other", placement: "shown" }] }, NOW, { strict: true, owners }))
      .toThrow("Message bill1 from gmail is waiting for Money. Leave it out, or set urgent.");
    expect(store.emailStatus("reading", [{ connectionId: "gmail", messageId: "bill1" }], owners, []))
      .toEqual([{ status: "handed-off", ownerDigestId: "money", ownerName: "Money", until: moneyOwner.nextRunAt + 24 * HOUR }]);
    expect(store.handoffsFor("reading", ["gmail", "work-mail"], new Set(["money", "reading"]), NOW)).toEqual([]);
    expect(store.handoffsFor("money", ["gmail", "work-mail"], new Set(["money", "reading"]), NOW)).toEqual([{
      emailId, connectionId: "gmail", messageId: "bill1", class: "money", ownerDigestId: "money",
      handedOffBy: "inbox", handedOffByName: "Inbox", since: NOW,
    }]);

    const at = moneyOwner.nextRunAt;
    store.issues.publish(begin("money", at), { ...base, sources: [{ connectionId: "gmail", messageId: "bill1", class: "money", placement: "shown" }] }, at, { strict: true, owners, returnedHandoffs: [emailId] });
    expect(store.handoffsFor("money", ["gmail"], new Set(["money"]), at)).toEqual([]);

    const retry = begin("reading", at);
    expect(() => store.issues.publish(retry, { ...base, sources: [{ connectionId: "gmail", messageId: "fresh" }, { connectionId: "gmail", messageId: "bill1" }] }, at))
      .toThrow("Message bill1 from gmail was already shown in Money on Mon Oct 19. Remove it and publish again.");
    expect(store.issues.get(retry)).toMatchObject({ state: "collecting", sources: [] });
    expect(store.emailStatus("reading", [{ connectionId: "gmail", messageId: "fresh" }], owners, [])).toEqual([{ status: "new" }]);
    expect(store.issues.publish(retry, { ...base, sources: [{ connectionId: "gmail", messageId: "fresh" }] }, at).state).toBe("ready");
  });

  it("lets an urgent email bypass its owner", () => {
    const { store, begin } = ledger();
    const issueId = begin("inbox");
    const due = { connectionId: "gmail", messageId: "due1", class: "money" as const, placement: "shown" as const };
    expect(() => store.issues.publish(issueId, { ...base, sources: [due] }, NOW, { strict: true, owners }))
      .toThrow("Money owns money mail from gmail; hand it off with placement handoff, or set urgent.");
    expect(store.issues.publish(issueId, { ...base, sources: [{ ...due, urgent: true }] }, NOW, { strict: true, owners }).state).toBe("ready");
  });

  it("rejects strict publications whose cards or returned handoffs do not match their sources", () => {
    const { store, begin, handOff } = ledger();
    const shown = { connectionId: "gmail", messageId: "m1", class: "other" as const, placement: "shown" as const };
    const card = { title: "Pay", text: "Due Friday.", action: { label: "Open email", url: mailUrl("m1") } };
    const issueId = begin("inbox");
    expect(() => store.issues.publish(issueId, { ...base, sources: [shown], brief: { heading: "Inbox", items: [card] } }, NOW, { strict: true, owners }))
      .toThrow("Each card in items needs the Gmail message ID");
    expect(() => store.issues.publish(issueId, { ...base, sources: [{ ...shown, placement: undefined }] }, NOW, { strict: true, owners }))
      .toThrow("needs a placement");
    expect(() => store.issues.publish(issueId, {
      ...base, sources: [shown, { connectionId: "gmail", messageId: "bill2", class: "money", placement: "handoff" }],
      brief: { heading: "Inbox", items: [{ ...card, messageId: "m1" }], later: [{ title: "Bill", messageId: "bill2" }] },
    }, NOW, { strict: true, owners })).toThrow("Message bill2 is handoff, so it cannot appear in the brief.");
    expect(store.issues.get(issueId)?.state).toBe("collecting");

    const { emailId } = handOff("bill3");
    expect(() => store.issues.publish(begin("money"), { ...base }, NOW, { strict: true, owners, returnedHandoffs: [emailId] }))
      .toThrow(`Show or release every email handed to this brief: ${emailId}.`);
  });

  it("returns orphaned handoffs to another brief reading the inbox, which can show or release them", () => {
    const { store, begin, handOff } = ledger();
    const shown = handOff("bill4");
    const released = handOff("bill5", NOW + 1);
    const expired = moneyOwner.nextRunAt + 24 * HOUR + 1;
    const ids = (handoffs: { emailId: string }[]) => handoffs.map(({ emailId }) => emailId);
    expect(store.handoffsFor("reading", ["gmail"], new Set(["money", "reading"]), NOW)).toEqual([]);
    expect(ids(store.handoffsFor("reading", ["gmail"], new Set(["reading"]), NOW))).toEqual([shown.emailId, released.emailId]);
    expect(ids(store.handoffsFor("reading", ["gmail"], new Set(["money", "reading"]), expired))).toEqual([shown.emailId, released.emailId]);
    expect(store.handoffsFor("reading", ["x"], new Set(["reading"]), expired)).toEqual([]);

    const returned = [shown.emailId, released.emailId];
    expect(store.emailStatus("reading", [{ connectionId: "gmail", messageId: "bill4" }], owners, returned))
      .toEqual([{ status: "handed-to-you", emailId: shown.emailId, class: "money", handedOffBy: "inbox" }]);
    const issueId = begin("reading", expired);
    store.issues.publish(issueId, { ...base, sources: [
      { connectionId: "gmail", messageId: "bill4", class: "money", placement: "shown" },
      { connectionId: "gmail", messageId: "bill5", class: "money", placement: "released", reason: "Already paid" },
    ] }, expired, { strict: true, owners, returnedHandoffs: returned });
    expect(store.emailStatus("inbox", [{ connectionId: "gmail", messageId: "bill4" }, { connectionId: "gmail", messageId: "bill5" }], owners, [])).toEqual([
      { status: "shown", digestId: "reading", digestName: "Reading", issueId, threadId: null, shownAt: expired },
      { status: "released", reason: "Already paid" },
    ]);
    expect(store.handoffsFor("reading", ["gmail"], new Set(["reading"]), expired)).toEqual([]);
  });

  it("never collapses same-subject emails to different inboxes on its own", () => {
    const { store, db, begin } = ledger();
    const statement = { class: "money" as const, placement: "shown" as const, from: "statements@bank.com", subject: "Your statement is ready", receivedAt: NOW };
    expect(store.issues.publish(begin("money"), { ...base, sources: [
      { connectionId: "gmail", messageId: "s1", ...statement },
      { connectionId: "work-mail", messageId: "s2", ...statement },
    ] }, NOW, { strict: true, owners }).state).toBe("ready");
    expect(db.prepare("SELECT count(*) AS count FROM digest_emails WHERE state = 'shown'").get()).toEqual({ count: 2 });
  });

  it("backfills every legacy Gmail source as a shown email, idempotently", () => {
    const { db, bb } = ledger();
    const insert = db.prepare("INSERT INTO digest_processed_sources VALUES (?, ?, ?, ?, ?, ?)");
    insert.run("money", "gmail", "old1", "t1", "iss_legacy_b", 20);
    insert.run("reading", "gmail", "old1", "t1", "iss_legacy_a", 10);
    insert.run("reading", "work-mail", "old2", null, "iss_legacy_a", 10);
    insert.run("reading", "gmail-old", "old3", null, "iss_legacy_a", 5);
    insert.run("x-feed", "x", "post1", null, "iss_x", 10);
    createStore(bb);
    const reopened = createStore(bb);
    expect(db.prepare("SELECT id, state, owner_digest_id, issue_id FROM digest_emails ORDER BY id").all()).toEqual([
      { id: "legacy:gmail-old:old3", state: "shown", owner_digest_id: "reading", issue_id: "iss_legacy_a" },
      { id: "legacy:gmail:old1", state: "shown", owner_digest_id: "reading", issue_id: "iss_legacy_a" },
      { id: "legacy:work-mail:old2", state: "shown", owner_digest_id: "reading", issue_id: "iss_legacy_a" },
    ]);
    expect(db.prepare("SELECT count(*) AS count FROM digest_email_copies").get()).toEqual({ count: 3 });
    expect(reopened.emailStatus("money", [{ connectionId: "gmail", messageId: "old1" }], owners, []))
      .toEqual([{ status: "shown", digestId: "reading", digestName: "Reading", issueId: "iss_legacy_a", threadId: null, shownAt: 10 }]);
  });

  it("keeps Gmail to one brief even with deduplicate false, while other sources may still repeat", () => {
    const { store, begin } = ledger();
    store.issues.publish(begin("reading"), { ...base, sources: [{ connectionId: "gmail", messageId: "g1" }] }, NOW);
    expect(() => store.issues.publish(begin("inbox"), { ...base, sources: [{ connectionId: "gmail", messageId: "g1", deduplicate: false }] }, NOW))
      .toThrow("was already shown in Reading");
    store.issues.publish(begin("x-feed"), { ...base, sources: [{ connectionId: "x", messageId: "post1" }] }, NOW);
    expect(store.issues.publish(begin("x-feed"), { ...base, sources: [{ connectionId: "x", messageId: "post1", deduplicate: false }] }, NOW).state).toBe("ready");
    expect(() => store.issues.publish(begin("x-feed"), { ...base, sources: [{ connectionId: "x", messageId: "post1" }] }, NOW)).toThrow("already digested");
  });
});
