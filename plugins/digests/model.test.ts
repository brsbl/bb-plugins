import { describe, expect, it } from "vitest";

import { ConnectionSchema, DigestDefinitionSchema, IssuePatchSchema, IssueSchema, PublishInputSchema, ScheduleSchema } from "./model";
import { DIGEST_RECIPES } from "./recipes";

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

  it("keeps the settled schedules and requires source-based read-only newsletter tracking", () => {
    expect(DIGEST_RECIPES.map(({ id, schedule }) => [id, schedule?.cron ?? null])).toEqual([
      ["unread-email", "0 10 * * 1-5"], ["money", "0 10 * * 1"], ["reading", "0 11 * * 0"], ["x-scorecard", null],
    ]);
    const reading = DIGEST_RECIPES.find((recipe) => recipe.id === "reading")!;
    expect(reading.instructions).toContain("Never mark newsletters read");
    expect(reading.instructions).toContain("records IDs only when publication succeeds");
    expect(reading.instructions).toContain("snippet-only");
    for (const recipe of DIGEST_RECIPES) {
      expect(recipe.instructions).toContain("Only an explicit user click");
      expect(recipe.instructions).toContain("Never open an unread Gmail message");
      expect(recipe.instructions).not.toMatch(/thr_[a-z0-9]+|host_[a-z0-9]+|[\w.]+@gmail\.com/u);
    }
  });
});
