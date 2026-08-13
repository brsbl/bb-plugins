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
    expect(ownershipQueries).toHaveLength(3);
    expect(
      ownershipQueries.every((query) => !query.includes("comments(")),
    ).toBe(true);
    expect(activityQueries).toHaveLength(1);
    expect(activityQueries[0]).toContain("notification50");
    expect(activityQueries[0]).not.toContain("notification0:");
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
});
