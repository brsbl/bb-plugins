import type { BbPluginApi } from "@get-bb/plugin-sdk";
import Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";

import { createStore } from "./store";

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
