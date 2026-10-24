import { describe, expect, it } from "vitest";

import {
  buildActivityQuery,
  buildOwnershipQuery,
  parseNotificationRows,
  projectOwnedNotifications,
} from "./core";

const rows = parseNotificationRows([
  {
    id: "n1",
    reason: "author",
    unread: true,
    updated_at: "2026-08-12T12:00:00Z",
    repository: { full_name: "example-org/project-demo" },
    subject: {
      latest_comment_url:
        "https://api.github.com/repos/example-org/project-demo/issues/comments/101",
      title: "Scannable activity",
      type: "PullRequest",
      url: "https://api.github.com/repos/example-org/project-demo/pulls/42",
    },
  },
  {
    id: "n2",
    reason: "mention",
    unread: false,
    updated_at: "2026-08-11T12:00:00Z",
    repository: { full_name: "example-org/notes-demo" },
    subject: {
      latest_comment_url:
        "https://api.github.com/repos/example-org/notes-demo/issues/comments/202",
      title: "Keep links local",
      type: "Issue",
      url: "https://api.github.com/repos/example-org/notes-demo/issues/7",
    },
  },
]);

describe("GitHub notification projection", () => {
  it("builds one bounded GraphQL lookup for each supported notification", () => {
    const { lookups, query } = buildOwnershipQuery(rows);
    expect(lookups).toEqual([
      expect.objectContaining({ number: 42, resourceKind: "pr" }),
      expect.objectContaining({ number: 7, resourceKind: "issue" }),
    ]);
    expect(query).toContain("pullRequest(number: 42)");
    expect(query).toContain("issue(number: 7)");
    expect(query).not.toContain("comments(");
    const activityQuery = buildActivityQuery({ lookups, rows });
    expect(activityQuery).not.toContain("reviews(");
    expect(activityQuery).toContain("databaseId");
    expect(activityQuery).toContain("avatarUrl");
    expect(activityQuery).not.toContain(" body ");
    expect(activityQuery).toContain("updatedAt");
  });

  it("keeps only incoming comments and mentions on resources the viewer authored", () => {
    const { lookups } = buildOwnershipQuery(rows);
    const result = projectOwnedNotifications({
      rows,
      lookups,
      data: {
        viewer: { login: "fixture-author" },
        notification0: {
          resource: {
            author: { login: "fixture-author" },
            number: 42,
            title: "Scannable activity",
            url: "https://github.com/example-org/project-demo/pull/42",
            comments: {
              nodes: [
                {
                  author: { login: "fixture-reviewer" },
                  bodyText: "nice",
                  createdAt: "2026-08-12T10:00:00Z",
                  databaseId: 101,
                },
              ],
            },
            reviews: {
              nodes: [
                {
                  author: {
                    login: "fixture-maintainer",
                    avatarUrl: "https://ghe.example.test/avatars/fixture-maintainer",
                  },
                  state: "APPROVED",
                  submittedAt: "2026-08-12T11:00:00Z",
                },
              ],
            },
          },
        },
        notification1: {
          resource: {
            author: { login: "someone-else" },
            number: 7,
            title: "Keep links local",
            url: "https://github.com/example-org/notes-demo/issues/7",
            comments: {
              nodes: [
                {
                  author: { login: "fixture-reviewer" },
                  bodyText: "@fixture-author look",
                  createdAt: "2026-08-11T11:00:00Z",
                },
              ],
            },
          },
        },
      },
    });
    expect(result.login).toBe("fixture-author");
    expect(result.items).toEqual([
      expect.objectContaining({
        activity: "New comment",
        activityKind: "comment",
        actor: "fixture-reviewer",
        repo: "example-org/project-demo",
        resourceKind: "pr",
      }),
    ]);
  });

  it("drops review-only activity before fetching resource details", () => {
    const reviewRows = parseNotificationRows([
      {
        id: "review-only",
        reason: "author",
        unread: true,
        updated_at: "2026-08-12T12:00:00Z",
        repository: { full_name: "example-org/project-demo" },
        subject: {
          latest_comment_url:
            "https://api.github.com/repos/example-org/project-demo/pulls/42",
          title: "Review-only activity",
          type: "PullRequest",
          url: "https://api.github.com/repos/example-org/project-demo/pulls/42",
        },
      },
    ]);

    expect(reviewRows).toEqual([]);
  });

  it("drops a sticky mention reason when the latest event is not a comment", () => {
    const reviewRows = parseNotificationRows([
      {
        id: "sticky-mention",
        reason: "mention",
        unread: true,
        updated_at: "2026-08-12T12:00:00Z",
        repository: { full_name: "example-org/project-demo" },
        subject: {
          latest_comment_url:
            "https://api.github.com/repos/example-org/project-demo/pulls/42/reviews/9",
          title: "Old mention, new review",
          type: "PullRequest",
          url: "https://api.github.com/repos/example-org/project-demo/pulls/42",
        },
      },
    ]);

    expect(reviewRows).toEqual([]);
  });

  it("attributes a mention to the comment identified by notification metadata", () => {
    const mentionRows = parseNotificationRows([
      {
        id: "mention-1",
        reason: "mention",
        unread: true,
        updated_at: "2026-08-12T12:00:00Z",
        repository: { full_name: "example-org/project-demo" },
        subject: {
          latest_comment_url:
            "https://api.github.com/repos/example-org/project-demo/issues/comments/101",
          title: "Correct mention actor",
          type: "Issue",
          url: "https://api.github.com/repos/example-org/project-demo/issues/42",
        },
      },
    ]);
    const { lookups } = buildOwnershipQuery(mentionRows);
    const result = projectOwnedNotifications({
      rows: mentionRows,
      lookups,
      data: {
        viewer: { login: "fixture-author" },
        notification0: {
          resource: {
            author: { login: "fixture-author" },
            number: 42,
            title: "Correct mention actor",
            url: "https://github.com/example-org/project-demo/issues/42",
            comments: {
              nodes: [
                {
                  author: { login: "fixture-reviewer" },
                  bodyText: "@fixture-author please take a look",
                  createdAt: "2026-08-12T10:00:00Z",
                  databaseId: 101,
                },
                {
                  author: { login: "fixture-maintainer" },
                  createdAt: "2026-08-12T11:00:00Z",
                  databaseId: 102,
                },
              ],
            },
          },
        },
      },
    });

    expect(result.items).toEqual([
      expect.objectContaining({
        activityKind: "mention",
        actor: "fixture-reviewer",
        updatedAt: "2026-08-12T10:00:00Z",
      }),
    ]);
  });

  it.each([
    {
      body: "@fixture-author, please take a look",
      expected: "mention",
      name: "a punctuation-delimited direct mention",
      reason: "author",
    },
    {
      body: "cc @fixture-author2 instead",
      expected: "comment",
      name: "another username with the viewer as a prefix",
      reason: "author",
    },
    {
      body: "Could @example-org/reviewers check this?",
      expected: "mention",
      name: "a team mention notification",
      reason: "team_mention",
    },
    {
      body: "Could @example-org/reviewers check this?",
      expected: "comment",
      name: "an unrelated team reference",
      reason: "author",
    },
    {
      body: "> @fixture-author said this earlier",
      expected: "comment",
      name: "a quoted direct mention",
      reason: "author",
    },
    {
      body: "Use `@fixture-author` in the example",
      expected: "comment",
      name: "an inline-code direct mention",
      reason: "author",
    },
    {
      body: "Use `first line\n@fixture-author\nlast line` in the example",
      expected: "comment",
      name: "a multiline-code direct mention",
      reason: "author",
    },
    {
      body: "```text\n@fixture-author\n```",
      expected: "comment",
      name: "a fenced-code direct mention",
      reason: "author",
    },
    {
      body: "    @fixture-author in an indented example",
      expected: "comment",
      name: "an indented-code direct mention",
      reason: "author",
    },
    {
      body: "<code>@fixture-author</code>",
      expected: "comment",
      name: "an HTML-code direct mention",
      reason: "author",
    },
    {
      body: "<!-- @fixture-author -->",
      expected: "comment",
      name: "an HTML-comment direct mention",
      reason: "author",
    },
    {
      body: "> quoted paragraph\n@fixture-author is still quoted lazily\n\nNew text",
      expected: "comment",
      name: "a lazy blockquote continuation mention",
      reason: "author",
    },
    {
      body: "> quoted paragraph\n\n@fixture-author is outside the quote",
      expected: "mention",
      name: "a direct mention after a blockquote",
      reason: "author",
    },
  ])("classifies $name exactly", ({ body, expected, reason }) => {
    const mentionRows = parseNotificationRows([
      {
        id: "mention-boundary",
        reason,
        unread: true,
        updated_at: "2026-08-12T12:00:00Z",
        repository: { full_name: "example-org/project-demo" },
        subject: {
          latest_comment_url:
            "https://api.github.com/repos/example-org/project-demo/issues/comments/101",
          title: "Mention boundaries",
          type: "Issue",
          url: "https://api.github.com/repos/example-org/project-demo/issues/42",
        },
      },
    ]);
    const { lookups } = buildOwnershipQuery(mentionRows);

    const result = projectOwnedNotifications({
      rows: mentionRows,
      lookups,
      data: {
        viewer: { login: "fixture-author" },
        notification0: {
          resource: {
            author: { login: "fixture-author" },
            number: 42,
            title: "Mention boundaries",
            url: "https://github.com/example-org/project-demo/issues/42",
            comments: {
              nodes: [
                {
                  author: { login: "fixture-reviewer" },
                  bodyText: body,
                  createdAt: "2026-08-12T11:00:00Z",
                  databaseId: 101,
                },
              ],
            },
          },
        },
      },
    });

    expect(result.items[0]?.activityKind).toBe(expected);
  });

  it("does not label a later ordinary comment as a persistent thread mention", () => {
    const mentionRows = parseNotificationRows([
      {
        id: "mention-ordinary",
        reason: "mention",
        unread: true,
        updated_at: "2026-08-12T12:00:00Z",
        repository: { full_name: "example-org/project-demo" },
        subject: {
          latest_comment_url:
            "https://api.github.com/repos/example-org/project-demo/issues/comments/102",
          title: "Persistent reason",
          type: "Issue",
          url: "https://api.github.com/repos/example-org/project-demo/issues/42",
        },
      },
    ]);
    const { lookups } = buildOwnershipQuery(mentionRows);
    const result = projectOwnedNotifications({
      rows: mentionRows,
      lookups,
      data: {
        viewer: { login: "fixture-author" },
        notification0: {
          resource: {
            author: { login: "fixture-author" },
            number: 42,
            title: "Persistent reason",
            url: "https://github.com/example-org/project-demo/issues/42",
            comments: {
              nodes: [
                {
                  author: { login: "fixture-reviewer" },
                  bodyText: "ordinary follow-up",
                  createdAt: "2026-08-12T11:00:00Z",
                  databaseId: 102,
                },
              ],
            },
          },
        },
      },
    });

    expect(result.items).toEqual([
      expect.objectContaining({
        activityKind: "comment",
        actor: "fixture-reviewer",
      }),
    ]);
  });

  it("projects the exact inline pull-request review comment from review threads", () => {
    const inlineRows = parseNotificationRows([
      {
        id: "inline-1",
        reason: "comment",
        unread: true,
        updated_at: "2026-08-12T12:00:00Z",
        repository: { full_name: "example-org/project-demo" },
        subject: {
          latest_comment_url:
            "https://api.github.com/repos/example-org/project-demo/pulls/comments/501",
          title: "Inline feedback",
          type: "PullRequest",
          url: "https://api.github.com/repos/example-org/project-demo/pulls/42",
        },
      },
    ]);
    const { lookups } = buildOwnershipQuery(inlineRows);

    const result = projectOwnedNotifications({
      rows: inlineRows,
      lookups,
      data: {
        viewer: { login: "fixture-author" },
        notification0: {
          resource: {
            author: { login: "fixture-author" },
            number: 42,
            title: "Inline feedback",
            url: "https://github.com/example-org/project-demo/pull/42",
            comments: { nodes: [] },
            reviews: { nodes: [] },
            reviewThreads: {
              nodes: [
                {
                  comments: {
                    nodes: [
                      {
                        author: {
                          login: "reviewer",
                          avatarUrl:
                            "https://ghe.example.test/avatars/reviewer",
                        },
                        bodyText: "Inline note",
                        createdAt: "2026-08-12T11:30:00Z",
                        databaseId: 501,
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      },
    });

    expect(result.items).toEqual([
      expect.objectContaining({
        activityKind: "comment",
        actor: "reviewer",
        avatarUrl: "https://ghe.example.test/avatars/reviewer",
        updatedAt: "2026-08-12T11:30:00Z",
      }),
    ]);
  });
});
