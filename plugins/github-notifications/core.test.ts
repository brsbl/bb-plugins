import { describe, expect, it } from "vitest";

import {
  buildGraphqlQuery,
  parseNotificationRows,
  projectOwnedNotifications,
} from "./core";

const rows = parseNotificationRows([
  {
    id: "n1",
    reason: "author",
    unread: true,
    updated_at: "2026-08-12T12:00:00Z",
    repository: { full_name: "get-bb/bb" },
    subject: {
      title: "Scannable activity",
      type: "PullRequest",
      url: "https://api.github.com/repos/get-bb/bb/pulls/42",
    },
  },
  {
    id: "n2",
    reason: "mention",
    unread: false,
    updated_at: "2026-08-11T12:00:00Z",
    repository: { full_name: "brsbl/moss" },
    subject: {
      title: "Keep links local",
      type: "Issue",
      url: "https://api.github.com/repos/brsbl/moss/issues/7",
    },
  },
]);

describe("GitHub notification projection", () => {
  it("builds one bounded GraphQL lookup for each supported notification", () => {
    const { lookups, query } = buildGraphqlQuery(rows);
    expect(lookups).toEqual([
      expect.objectContaining({ number: 42, resourceKind: "pr" }),
      expect.objectContaining({ number: 7, resourceKind: "issue" }),
    ]);
    expect(query).toContain("pullRequest(number: 42)");
    expect(query).toContain("issue(number: 7)");
    expect(query).toContain("reviews(last: 20)");
  });

  it("keeps only incoming comment and review activity on resources the viewer authored", () => {
    const { lookups } = buildGraphqlQuery(rows);
    const result = projectOwnedNotifications({
      rows,
      lookups,
      data: {
        viewer: { login: "brsbl" },
        notification0: {
          resource: {
            author: { login: "brsbl" },
            number: 42,
            title: "Scannable activity",
            url: "https://github.com/get-bb/bb/pull/42",
            comments: { nodes: [{ author: { login: "alice" }, bodyText: "nice", createdAt: "2026-08-12T10:00:00Z" }] },
            reviews: { nodes: [{ author: { login: "bob" }, state: "APPROVED", submittedAt: "2026-08-12T11:00:00Z" }] },
          },
        },
        notification1: {
          resource: {
            author: { login: "someone-else" },
            number: 7,
            title: "Keep links local",
            url: "https://github.com/brsbl/moss/issues/7",
            comments: { nodes: [{ author: { login: "alice" }, bodyText: "@brsbl look", createdAt: "2026-08-11T11:00:00Z" }] },
          },
        },
      },
    });
    expect(result.login).toBe("brsbl");
    expect(result.items).toEqual([
      expect.objectContaining({
        activity: "Approved",
        activityKind: "approved",
        actor: "bob",
        repo: "get-bb/bb",
        resourceKind: "pr",
      }),
    ]);
  });
});
