import { createFakePluginHost } from "@bb/plugin-sdk/testing";
import { describe, expect, it, vi } from "vitest";

import {
  createGithubNotificationsPlugin,
  type NotificationsPayload,
  type RunGh,
} from "./server";

function notification(index: number, overrides: Record<string, unknown> = {}) {
  return {
    id: `n${index}`,
    reason: "author",
    unread: true,
    updated_at: "2026-08-12T12:00:00Z",
    repository: { full_name: "get-bb/bb" },
    subject: {
      title: `Notification ${index}`,
      type: "PullRequest",
      url: `https://api.github.com/repos/get-bb/bb/pulls/${index + 1}`,
    },
    ...overrides,
  };
}

function queryFrom(args: string[]): string {
  return args.find((arg) => arg.startsWith("query="))?.slice(6) ?? "";
}

describe("GitHub Activity plugin", () => {
  it("registers the feed RPC and serves scoped activity through the harness", async () => {
    const runGh = vi
      .fn<RunGh>()
      .mockResolvedValueOnce([notification(41)])
      .mockResolvedValueOnce({
        data: {
          viewer: { login: "brsbl" },
          notification0: {
            resource: {
              author: { login: "brsbl" },
              number: 42,
              title: "Scannable activity",
              url: "https://github.com/get-bb/bb/pull/42",
            },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          notification0: {
            resource: {
              comments: { nodes: [] },
              reviews: {
                nodes: [
                  {
                    author: { login: "alice" },
                    state: "CHANGES_REQUESTED",
                    submittedAt: "2026-08-12T11:00:00Z",
                  },
                ],
              },
            },
          },
        },
      });
    const { bb, harness } = createFakePluginHost({
      pluginId: "github-notifications",
    });
    createGithubNotificationsPlugin(runGh)(bb);

    expect(harness.inspection.registrations.rpcMethods).toEqual([
      "listNotifications",
    ]);
    await expect(
      harness.behavior.callRpc("listNotifications", { force: false }),
    ).resolves.toEqual(
      expect.objectContaining({
        login: "brsbl",
        items: [
          expect.objectContaining({
            activity: "Changes requested",
            resourceKind: "pr",
          }),
        ],
      }),
    );
    await harness.lifecycle.dispose();
  });

  it("finds owned activity on a later bounded notification page and fetches activity only for owned resources", async () => {
    const firstPage = Array.from({ length: 50 }, (_, index) =>
      notification(index),
    );
    const laterNotification = notification(999);
    const graphqlQueries: string[] = [];
    const runGh = vi.fn<RunGh>(async (args) => {
      if (args.includes("notifications")) {
        return args.includes("page=1") ? firstPage : [laterNotification];
      }
      const query = queryFrom(args);
      graphqlQueries.push(query);
      const aliases = [
        ...query.matchAll(/(notification\d+): repository/gu),
      ].map((match) => match[1]!);
      if (query.includes("query GithubNotifications")) {
        return {
          data: Object.fromEntries([
            ["viewer", { login: "brsbl" }],
            ...aliases.map((alias) => {
              const index = Number(alias.replace("notification", ""));
              const owned = index === 50;
              return [
                alias,
                {
                  resource: {
                    author: { login: owned ? "brsbl" : "someone-else" },
                    number: owned ? 1000 : index + 1,
                    title: owned ? "Later owned PR" : `Unrelated ${index}`,
                    url: `https://github.com/get-bb/bb/pull/${owned ? 1000 : index + 1}`,
                  },
                },
              ];
            }),
          ]),
        };
      }
      return {
        data: {
          notification50: {
            resource: {
              comments: {
                nodes: [
                  {
                    author: { login: "alice" },
                    createdAt: "2026-08-12T11:00:00Z",
                    databaseId: 1001,
                  },
                ],
              },
              reviews: { nodes: [] },
            },
          },
        },
      };
    });
    const { bb, harness } = createFakePluginHost({
      pluginId: "github-notifications",
    });
    createGithubNotificationsPlugin(runGh)(bb);

    const result = (await harness.behavior.callRpc("listNotifications", {
      force: false,
    })) as NotificationsPayload;

    expect(result.items).toEqual([
      expect.objectContaining({ number: 1000, title: "Later owned PR" }),
    ]);
    const ownershipQueries = graphqlQueries.filter((query) =>
      query.includes("query GithubNotifications"),
    );
    const activityQueries = graphqlQueries.filter((query) =>
      query.includes("query GithubNotificationActivity"),
    );
    expect(ownershipQueries).toHaveLength(2);
    expect(
      ownershipQueries.every((query) => !query.includes("comments(")),
    ).toBe(true);
    expect(activityQueries).toHaveLength(1);
    expect(activityQueries[0]).toContain("notification50");
    expect(activityQueries[0]).not.toContain("notification0:");
    await harness.lifecycle.dispose();
  });

  it("fetches the exact inline review comment identified by notification metadata", async () => {
    const inlineNotification = notification(41, {
      subject: {
        latest_comment_url:
          "https://api.github.example.test/repos/get-bb/bb/pulls/comments/501",
        title: "Inline feedback",
        type: "PullRequest",
        url: "https://api.github.example.test/repos/get-bb/bb/pulls/42",
      },
    });
    const runGh = vi.fn<RunGh>(async (args) => {
      if (args.includes("notifications")) return [inlineNotification];
      if (
        args.includes(
          "https://api.github.example.test/repos/get-bb/bb/pulls/comments/501",
        )
      ) {
        return {
          body: "Inline note",
          created_at: "2026-08-12T11:30:00Z",
          id: 501,
          user: {
            avatar_url: "https://github.example.test/avatars/reviewer",
            login: "reviewer",
          },
        };
      }
      const query = queryFrom(args);
      if (query.includes("query GithubNotifications")) {
        return {
          data: {
            viewer: { login: "brsbl" },
            notification0: {
              resource: {
                author: { login: "brsbl" },
                number: 42,
                title: "Inline feedback",
                url: "https://github.example.test/get-bb/bb/pull/42",
              },
            },
          },
        };
      }
      return {
        data: {
          notification0: {
            resource: {
              comments: { nodes: [] },
              reviews: { nodes: [] },
            },
          },
        },
      };
    });
    const { bb, harness } = createFakePluginHost({
      pluginId: "github-notifications",
    });
    createGithubNotificationsPlugin(runGh)(bb);

    await expect(
      harness.behavior.callRpc("listNotifications", { force: false }),
    ).resolves.toEqual(
      expect.objectContaining({
        items: [
          expect.objectContaining({
            actor: "reviewer",
            avatarUrl: "https://github.example.test/avatars/reviewer",
            updatedAt: "2026-08-12T11:30:00Z",
          }),
        ],
      }),
    );
    expect(runGh).toHaveBeenCalledWith([
      "api",
      "https://api.github.example.test/repos/get-bb/bb/pulls/comments/501",
    ]);
    await harness.lifecycle.dispose();
  });

  it("shares one active refresh across concurrent cache misses and forced refreshes", async () => {
    let resolveNotifications!: (value: unknown) => void;
    const notifications = new Promise<unknown>((resolve) => {
      resolveNotifications = resolve;
    });
    const runGh = vi
      .fn<RunGh>()
      .mockImplementationOnce(() => notifications)
      .mockResolvedValueOnce({ data: { viewer: { login: "brsbl" } } });
    const { bb, harness } = createFakePluginHost({
      pluginId: "github-notifications",
    });
    createGithubNotificationsPlugin(runGh)(bb);

    const first = harness.behavior.callRpc("listNotifications", {
      force: false,
    });
    const second = harness.behavior.callRpc("listNotifications", {
      force: true,
    });
    await vi.waitFor(() => expect(runGh).toHaveBeenCalledTimes(1));

    resolveNotifications([]);
    await expect(Promise.all([first, second])).resolves.toEqual([
      expect.objectContaining({ items: [], login: "brsbl" }),
      expect.objectContaining({ items: [], login: "brsbl" }),
    ]);
    expect(runGh).toHaveBeenCalledTimes(2);
    await harness.lifecycle.dispose();
  });

  it("uses incremental notification data after the initial load", async () => {
    const runGh = vi.fn<RunGh>(async (args) => {
      if (args.includes("notifications")) return [];
      return { data: { viewer: { login: "brsbl" } } };
    });
    const { bb, harness } = createFakePluginHost({
      pluginId: "github-notifications",
    });
    createGithubNotificationsPlugin(runGh)(bb);

    await harness.behavior.callRpc("listNotifications", { force: false });
    await harness.behavior.callRpc("listNotifications", { force: true });

    const notificationCalls = runGh.mock.calls
      .map(([args]) => args)
      .filter((args) => args.includes("notifications"));
    expect(notificationCalls).toHaveLength(2);
    expect(notificationCalls[0]!.some((arg) => arg.startsWith("since="))).toBe(
      false,
    );
    expect(notificationCalls[1]!.some((arg) => arg.startsWith("since="))).toBe(
      true,
    );
    await harness.lifecycle.dispose();
  });

  it("bounds concurrent GraphQL batches while avoiding serial owned-resource fetches", async () => {
    const rows = Array.from({ length: 100 }, (_, index) => notification(index));
    let activeGraphql = 0;
    let maxActiveGraphql = 0;
    const graphqlQueries: string[] = [];
    const runGh = vi.fn<RunGh>(async (args) => {
      if (args.includes("notifications")) {
        if (args.includes("page=1")) return rows.slice(0, 50);
        if (args.includes("page=2")) return rows.slice(50);
        return [];
      }
      const query = queryFrom(args);
      graphqlQueries.push(query);
      activeGraphql += 1;
      maxActiveGraphql = Math.max(maxActiveGraphql, activeGraphql);
      await new Promise((resolve) => setTimeout(resolve, 5));
      activeGraphql -= 1;
      const aliases = [
        ...query.matchAll(/(notification\d+): repository/gu),
      ].map((match) => match[1]!);
      if (query.includes("query GithubNotifications")) {
        return {
          data: Object.fromEntries([
            ["viewer", { login: "brsbl" }],
            ...aliases.map((alias) => {
              const index = Number(alias.replace("notification", ""));
              return [
                alias,
                {
                  resource: {
                    author: { login: "brsbl" },
                    number: index + 1,
                    title: `Notification ${index}`,
                    url: `https://github.com/get-bb/bb/pull/${index + 1}`,
                  },
                },
              ];
            }),
          ]),
        };
      }
      return {
        data: Object.fromEntries(
          aliases.map((alias) => [
            alias,
            {
              resource: {
                comments: {
                  nodes: [
                    {
                      author: { login: "alice", avatarUrl: null },
                      bodyText: "comment",
                      createdAt: "2026-08-12T11:00:00Z",
                      databaseId: 1,
                    },
                  ],
                },
                reviews: { nodes: [] },
              },
            },
          ]),
        ),
      };
    });
    const { bb, harness } = createFakePluginHost({
      pluginId: "github-notifications",
    });
    createGithubNotificationsPlugin(runGh)(bb);

    const result = (await harness.behavior.callRpc("listNotifications", {
      force: false,
    })) as NotificationsPayload;

    expect(result.items).toHaveLength(100);
    expect(maxActiveGraphql).toBeGreaterThan(1);
    expect(maxActiveGraphql).toBeLessThanOrEqual(3);
    expect(
      graphqlQueries.filter((query) =>
        query.includes("query GithubNotifications"),
      ),
    ).toHaveLength(2);
    expect(
      graphqlQueries.filter((query) =>
        query.includes("query GithubNotificationActivity"),
      ),
    ).toHaveLength(5);
    await harness.lifecycle.dispose();
  });
});
