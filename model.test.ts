import { describe, expect, it } from "vitest";

import { EmailReadInputSchema, EmojiSchema, ConnectionSchema, DigestDefinitionSchema, IssuePatchSchema, IssueSchema, PublishInputSchema, ScheduleSchema } from "./model";
import { DIGEST_RECIPES } from "./recipes";
import { collectionInstructions, issueTitle } from "./prompts";

describe("digest contracts", () => {
  it("keeps new definitions disabled and supplies a complete project-default execution shape", () => {
    const definition = DigestDefinitionSchema.parse({
      id: "reading", name: "Reading", projectId: "proj_test", instructions: "Read newsletters.", createdAt: 1,
    });
    expect(definition).toMatchObject({
      enabled: false, schedule: null, automationId: null, providerId: null, model: null, reasoningLevel: null,
      permissionMode: "auto", environment: { type: "project-default" }, connectionIds: [],
    });
    expect(DigestDefinitionSchema.safeParse({ ...definition, id: "../reading" }).success).toBe(false);
  });

  it("validates schedule syntax and timezones before an automation is created", () => {
    expect(ScheduleSchema.safeParse({ cron: "0 11 * * 0", timezone: "America/Los_Angeles" }).success).toBe(true);
    expect(ScheduleSchema.safeParse({ cron: "0 25 * * 0", timezone: "America/Los_Angeles" }).success).toBe(false);
    expect(ScheduleSchema.safeParse({ cron: "0 11 * * 0", timezone: "Unknown/Zone" }).success).toBe(false);
  });

  it("stores connection metadata without accepting cookies or URL credentials", () => {
    const connection = { id: "gmail", name: "Gmail", url: "https://mail.google.com/" };
    expect(ConnectionSchema.parse(connection)).toMatchObject({ status: "unknown", checkedAt: null, browserHostId: null });
    expect(ConnectionSchema.safeParse({ ...connection, cookies: "secret" }).success).toBe(false);
    expect(ConnectionSchema.safeParse({ ...connection, url: "https://user:secret@example.com" }).success).toBe(false);
    expect(ConnectionSchema.safeParse({ ...connection, url: "file:///private/mail" }).success).toBe(false);
  });

  it("bounds issue content and rejects repeated source IDs within one publication", () => {
    const payload = { headline: "Three pieces worth reading", details: "The best stories this week.", sources: [{ connectionId: "gmail", messageId: "message-1" }] };
    expect(PublishInputSchema.parse(payload).metrics).toEqual([]);
    expect(PublishInputSchema.safeParse({ ...payload, sources: [...payload.sources, ...payload.sources] }).success).toBe(false);
    expect(PublishInputSchema.safeParse({ ...payload, metrics: Array.from({ length: 7 }, () => ({ label: "Stories", value: "3" })) }).success).toBe(false);
    expect(PublishInputSchema.safeParse({ ...payload, details: "a".repeat(100_001) }).success).toBe(false);
    expect(IssueSchema.safeParse({ id: "iss_1", digestId: "reading", headline: "News", createdAt: -1 }).success).toBe(false);
  });

  it("does not insert defaults into partial updates or expose an alternate success path", () => {
    expect(IssuePatchSchema.parse({ readAt: 10 })).toEqual({ readAt: 10 });
    expect(IssuePatchSchema.safeParse({ state: "ready" }).success).toBe(false);
    expect(IssuePatchSchema.safeParse({ sources: [] }).success).toBe(false);
    expect(IssuePatchSchema.safeParse({ publishedAt: 10 }).success).toBe(false);
  });

  it("keeps starters as editable intent and puts collection safeguards in the runtime", () => {
    expect(DIGEST_RECIPES.map(({ id, schedule }) => [id, schedule?.cron ?? null])).toEqual([
      ["unread-email", "0 10 * * 1-5"], ["money", "0 10 * * 1"], ["reading", "0 11 * * 0"], ["x-scorecard", null],
    ]);
    for (const recipe of DIGEST_RECIPES) {
      expect(recipe.instructions).not.toMatch(/digest_processed|label:|is:unread|read.only|snippet|thread storage/iu);
      const definition = DigestDefinitionSchema.parse({ ...recipe, projectId: "proj_test", createdAt: 1 });
      const runtime = collectionInstructions(definition);
      expect(runtime).toContain(recipe.instructions);
      expect(runtime).toContain("Never send, reply, archive");
      expect(runtime).toContain("digest_processed");
      expect(runtime).toContain("No source is recorded as processed until publication succeeds");
      expect(runtime).toContain("read their full bodies");
      expect(runtime).toContain("digest_email_read");
      expect(runtime).toContain("Keep unread (default)");
      expect(runtime).toContain("only a user CLICK");
    }
  });

  it("exposes the journal boolean as a root tool property and keeps validation strict", () => {
    expect(EmailReadInputSchema.toJSONSchema().properties?.wasUnread).toMatchObject({ type: "boolean" });
    expect(EmailReadInputSchema.safeParse({ status: "opening", messageId: "mail1", wasUnread: "true" }).success).toBe(false);
    expect(EmailReadInputSchema.parse({ status: "opening", messageId: "mail1", wasUnread: true }).wasUnread).toBe(true);
  });

  it("requires new count links to reference a section while retaining old saved issues", () => {
    const brief = { heading: "Needs you", items: [], summaryLinks: [{ label: "2 routine", section: "tail" }] };
    expect(PublishInputSchema.safeParse({ headline: "A quiet day", details: "Two updates.", brief }).success).toBe(false);
    expect(IssueSchema.safeParse({ id: "old", digestId: "reading", headline: "Old issue", createdAt: 1, brief }).success).toBe(true);
    expect(PublishInputSchema.safeParse({ headline: "A quiet day", details: "Two updates.", brief: { ...brief, tail: { label: "Routine (2)", details: "Two updates." } } }).success).toBe(true);
  });

  it("adds semantic tone and separate sender fields without changing saved briefings", () => {
    const row = { title: "Robinhood · Account update", text: "Statement available.", url: "https://example.test/mail" };
    const payload = { headline: "One update", details: "Statement available.", brief: { heading: "Needs you", items: [], all: { label: "All unread", items: [row] } } };
    expect(PublishInputSchema.parse(payload).brief?.all?.items[0]).toEqual(row);
    const next = { ...payload, brief: { ...payload.brief, tone: "success", all: { label: "All unread", items: [{ ...row, sender: "Robinhood", subject: "Account update" }] } } };
    expect(PublishInputSchema.parse(next).brief?.tone).toBe("success");
    expect(PublishInputSchema.parse(next).brief?.all?.items[0]?.sender).toBe("Robinhood");
    expect(PublishInputSchema.safeParse({ ...next, brief: { ...next.brief, tone: "urgent" } }).success).toBe(false);
  });

  it("accepts optional source date and type without requiring them on older rows", () => {
    const row = { title: "Receipt", text: "Payment complete.", url: "https://example.test/mail" };
    const payload = (item: unknown) => ({ headline: "All caught up", details: "One receipt.", brief: { heading: "Needs you", items: [], all: { label: "All unread", items: [item] } } });
    expect(PublishInputSchema.safeParse(payload(row)).success).toBe(true);
    expect(PublishInputSchema.parse(payload({ ...row, receivedAt: 1791000000000, kind: "receipt" })).brief?.all?.items[0]).toMatchObject({ receivedAt: 1791000000000, kind: "receipt" });
    expect(PublishInputSchema.safeParse(payload({ ...row, receivedAt: -1 })).success).toBe(false);
    expect(PublishInputSchema.safeParse(payload({ ...row, kind: "urgent" })).success).toBe(false);
  });

  it("uses an explicit emoji or a backward-compatible starter default in issue titles", () => {
    for (const emoji of ["📬", "👩🏽‍💻", "🇺🇸", "1️⃣"]) expect(EmojiSchema.safeParse(emoji).success).toBe(true);
    for (const emoji of ["", "A", "📬📚"]) expect(EmojiSchema.safeParse(emoji).success).toBe(false);
    const old = DigestDefinitionSchema.parse({ id: "reading", name: "Reading", projectId: "proj_test", instructions: "My newsletters.", createdAt: 1 });
    const date = Date.UTC(2026, 9, 5, 17);
    expect(issueTitle({ ...old, id: "custom-old" }, date)).toBe("Reading · Mon Oct 5");
    expect(issueTitle({ ...old, id: "digest-new" }, date)).toBe("📰 Reading · Mon Oct 5");
    expect(issueTitle({ ...old, id: "coworkers", connectionIds: ["linkedin"] }, date)).toBe("🤝 Reading · Mon Oct 5");
    expect(issueTitle(old, date)).toBe("📚 Reading · Mon Oct 5");
    expect(issueTitle({ ...old, emoji: "👩🏽‍💻" }, date)).toBe("👩🏽‍💻 Reading · Mon Oct 5");
    // Starters saved before emoji existed keep their template emoji.
    for (const { emoji, ...recipe } of DIGEST_RECIPES) {
      const stored = DigestDefinitionSchema.parse({ ...recipe, projectId: "proj_test", createdAt: 1 });
      expect(stored.emoji).toBeUndefined();
      expect(issueTitle(stored, date)).toBe(`${emoji} ${recipe.name} · Mon Oct 5`);
    }
  });
});
