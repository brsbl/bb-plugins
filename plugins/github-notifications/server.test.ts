import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createGithubNotificationsPlugin,
  type NotificationsPayload,
  type RunGh,
} from "./server";

afterEach(() => vi.useRealTimers());

function notification(index: number, overrides: Record<string, unknown> = {}) {
  return {
    id: `n${index}`,
    reason: "comment",
    unread: true,
    updated_at: "2026-08-12T12:00:00Z",
    repository: { full_name: "get-bb/bb" },
    subject: {
      latest_comment_url:
        "https://api.github.com/repos/get-bb/bb/issues/comments/1",
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

function identity(
  login = "brsbl",
  host = "api.github.com",
  id = 1,
): Record<string, unknown> {
  return { id, login, url: `https://${host}/users/${login}` };
}

function isIdentityCall(args: string[]): boolean {
  return args.length === 2 && args[0] === "api" && args[1] === "user";
}

function resolutionInput(
  payload: NotificationsPayload,
  id: string,
  resolved: boolean,
) {
  const item = payload.items.find((candidate) => candidate.id === id);
  if (item === undefined) throw new Error(`Missing test notification ${id}`);
  return {
    eventKey: item.eventKey ?? null,
    id,
    identityKey: payload.identityKey,
    resolved,
    updatedAt: item.updatedAt,
  };
}

function resolvedStateKey(host = "api.github.com", id = 1): string {
  return `resolved-notification-through:https://${host}/user/${id}`;
}

describe("GitHub Activity plugin", () => {
  it("registers the feed RPC and serves scoped activity through the harness", async () => {
    const runGh = vi
      .fn<RunGh>()
      .mockResolvedValueOnce(identity())
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
              comments: {
                nodes: [
                  {
                    author: { login: "alice" },
                    bodyText: "Please take a look",
                    createdAt: "2026-08-12T10:00:00Z",
                    databaseId: 1,
                  },
                ],
              },
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
      })
      .mockResolvedValue(identity());
    const { bb, harness } = createFakePluginHost({
      pluginId: "github-notifications",
    });
    createGithubNotificationsPlugin(runGh)(bb);

    expect(harness.inspection.registrations.rpcMethods).toEqual([
      "listNotifications",
      "setNotificationResolved",
    ]);
    const initial = (await harness.behavior.callRpc("listNotifications", {
      force: false,
    })) as NotificationsPayload;
    expect(initial).toEqual(
      expect.objectContaining({
        login: "brsbl",
        items: [
          expect.objectContaining({
            activity: "New comment",
            activityKind: "comment",
            resolved: false,
            resourceKind: "pr",
          }),
        ],
      }),
    );
    await expect(
      harness.behavior.callRpc("setNotificationResolved", {
        ...resolutionInput(initial, "n41", true),
        identityKey: "https://api.github.com/user/999",
      }),
    ).rejects.toThrow("GitHub account changed");
    await expect(
      harness.behavior.callRpc("setNotificationResolved", {
        ...resolutionInput(initial, "n41", true),
      }),
    ).resolves.toEqual({ id: "n41", resolved: true });
    await expect(
      harness.behavior.callRpc("listNotifications", { force: false }),
    ).resolves.toEqual(
      expect.objectContaining({
        items: [expect.objectContaining({ id: "n41", resolved: true })],
      }),
    );
    await expect(
      bb.storage.kv.get("resolved-notification-ids"),
    ).resolves.toBeUndefined();
    await expect(
      bb.storage.kv.get("resolved-notification-ids:api.github.com/brsbl"),
    ).resolves.toBeUndefined();
    await expect(
      bb.storage.kv.get(resolvedStateKey()),
    ).resolves.toEqual({
      cursors: {
        n41: expect.objectContaining({
          eventKey: expect.any(String),
          updatedAt: "2026-08-12T10:00:00Z",
        }),
      },
      pendingLegacyIds: [],
      legacyCutoffAt: null,
      version: 2,
    });
    await harness.lifecycle.dispose();
  });

  it("reopens on a distinct event and does not re-resolve after fallback", async () => {
    let activityAt = "2026-08-12T11:00:00Z";
    let activityId = 1;
    const runGh = vi.fn<RunGh>(async (args) => {
      if (isIdentityCall(args)) return identity();
      if (args.includes("notifications")) {
        return [
          notification(0, {
            subject: {
              latest_comment_url: `https://api.github.com/repos/get-bb/bb/issues/comments/${activityId}`,
              title: "Activity lifecycle",
              type: "PullRequest",
              url: "https://api.github.com/repos/get-bb/bb/pulls/1",
            },
            updated_at: activityAt,
          }),
        ];
      }
      const query = queryFrom(args);
      if (query.includes("query GithubNotifications")) {
        return {
          data: {
            viewer: { login: "brsbl" },
            notification0: {
              resource: {
                author: { login: "brsbl" },
                number: 1,
                title: "Activity lifecycle",
                url: "https://github.com/get-bb/bb/pull/1",
              },
            },
          },
        };
      }
      return {
        data: {
          notification0: {
            resource: {
              comments: {
                nodes: [
                  {
                    author: { login: "alice" },
                    bodyText: "comment",
                    createdAt: activityAt,
                    databaseId: activityId,
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

    const initial = (await harness.behavior.callRpc("listNotifications", {
      force: false,
    })) as NotificationsPayload;
    await harness.behavior.callRpc("setNotificationResolved", {
      ...resolutionInput(initial, "n0", true),
    });

    activityId = 2;
    const sameSecond = (await harness.behavior.callRpc("listNotifications", {
      force: true,
    })) as NotificationsPayload;
    expect(sameSecond.items[0]).toEqual(
      expect.objectContaining({
        eventKey: "comment:2",
        resolved: false,
        updatedAt: "2026-08-12T11:00:00Z",
      }),
    );

    await harness.behavior.callRpc("setNotificationResolved", {
      ...resolutionInput(sameSecond, "n0", true),
    });
    activityAt = "2026-08-13T11:00:00Z";
    activityId = 3;
    const refreshed = (await harness.behavior.callRpc("listNotifications", {
      force: true,
    })) as NotificationsPayload;

    expect(refreshed.items[0]).toEqual(
      expect.objectContaining({
        id: "n0",
        resolved: false,
        updatedAt: "2026-08-13T11:00:00Z",
      }),
    );
    await expect(
      bb.storage.kv.get(resolvedStateKey()),
    ).resolves.toEqual({
      cursors: {},
      legacyCutoffAt: null,
      pendingLegacyIds: [],
      version: 2,
    });

    activityAt = "2026-08-12T11:00:00Z";
    activityId = 1;
    const fallback = (await harness.behavior.callRpc("listNotifications", {
      force: true,
    })) as NotificationsPayload;
    expect(fallback.items[0]?.resolved).toBe(false);
    await harness.lifecycle.dispose();
  });

  it("reopens a resolved comment when an edit adds a mention", async () => {
    const createdAt = "2026-08-12T11:00:00Z";
    let updatedAt = createdAt;
    let body = "Ordinary comment";
    const runGh = vi.fn<RunGh>(async (args) => {
      if (isIdentityCall(args)) return identity();
      if (args.includes("notifications")) {
        return [notification(0, { reason: "mention" })];
      }
      if (
        args.includes(
          "https://api.github.com/repos/get-bb/bb/issues/comments/1",
        )
      ) {
        return {
          body,
          created_at: createdAt,
          id: 1,
          updated_at: updatedAt,
          user: { avatar_url: null, login: "alice" },
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
                number: 1,
                title: "Edited comment",
                url: "https://github.com/get-bb/bb/pull/1",
              },
            },
          },
        };
      }
      return {
        data: {
          notification0: {
            resource: {
              comments: {
                nodes: [
                  {
                    author: { login: "alice" },
                    body,
                    createdAt,
                    databaseId: 1,
                    updatedAt,
                  },
                ],
              },
            },
          },
        },
      };
    });
    const { bb, harness } = createFakePluginHost({
      pluginId: "github-notifications",
    });
    createGithubNotificationsPlugin(runGh)(bb);

    const initial = (await harness.behavior.callRpc("listNotifications", {
      force: false,
    })) as NotificationsPayload;
    await harness.behavior.callRpc(
      "setNotificationResolved",
      resolutionInput(initial, "n0", true),
    );
    body = `${"x".repeat(1_000_000)} @brsbl please revisit`;
    updatedAt = "2026-08-13T11:00:00Z";
    const edited = (await harness.behavior.callRpc("listNotifications", {
      force: true,
    })) as NotificationsPayload;
    expect(edited.items).toEqual([
      expect.objectContaining({
        activityKind: "mention",
        eventKey: "comment:1",
        resolved: false,
        updatedAt,
      }),
    ]);
    await harness.lifecycle.dispose();
  });

  it("migrates legacy resolved IDs to event-scoped state", async () => {
    let activityAt = "2026-08-12T11:00:00Z";
    let includeSecond = false;
    const runGh = vi.fn<RunGh>(async (args) => {
      if (isIdentityCall(args)) return identity();
      if (args.includes("notifications")) {
        return [
          notification(0, { updated_at: activityAt }),
          ...(includeSecond
            ? [notification(1, { updated_at: activityAt })]
            : []),
        ];
      }
      const query = queryFrom(args);
      if (query.includes("query GithubNotifications")) {
        return {
          data: {
            viewer: { login: "brsbl" },
            notification0: {
              resource: {
                author: { login: "brsbl" },
                number: 1,
                title: "Legacy resolved activity",
                url: "https://github.com/get-bb/bb/pull/1",
              },
            },
            notification1: {
              resource: {
                author: { login: "brsbl" },
                number: 2,
                title: "Second legacy activity",
                url: "https://github.com/get-bb/bb/pull/2",
              },
            },
          },
        };
      }
      return {
        data: {
          notification0: {
            resource: {
              comments: {
                nodes: [
                  {
                    author: { login: "alice" },
                    bodyText: "comment",
                    createdAt: activityAt,
                    databaseId: 1,
                  },
                ],
              },
              reviews: { nodes: [] },
            },
          },
          notification1: {
            resource: {
              comments: {
                nodes: [
                  {
                    author: { login: "alice" },
                    bodyText: "second comment",
                    createdAt: activityAt,
                    databaseId: 1,
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
    await bb.storage.kv.set(
      "resolved-notification-ids:api.github.com/brsbl",
      ["n0", "n1"],
    );
    createGithubNotificationsPlugin(runGh)(bb);

    const migrated = (await harness.behavior.callRpc("listNotifications", {
      force: false,
    })) as NotificationsPayload;
    expect(migrated.items[0]?.resolved).toBe(true);
    await expect(
      bb.storage.kv.get(
        resolvedStateKey(),
      ),
    ).resolves.toEqual({
      cursors: {
        n0: {
          eventKey: "comment:1",
          updatedAt: activityAt,
        },
      },
      legacyCutoffAt: expect.any(String),
      pendingLegacyIds: ["n1"],
      version: 2,
    });

    includeSecond = true;
    const completedMigration = (await harness.behavior.callRpc(
      "listNotifications",
      { force: true },
    )) as NotificationsPayload;
    expect(completedMigration.items).toEqual([
      expect.objectContaining({ id: "n0", resolved: true }),
      expect.objectContaining({ id: "n1", resolved: true }),
    ]);
    await expect(
      bb.storage.kv.get(
        resolvedStateKey(),
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        cursors: expect.objectContaining({
          n0: expect.any(Object),
          n1: expect.any(Object),
        }),
        pendingLegacyIds: [],
      }),
    );

    activityAt = "2026-08-13T11:00:00Z";
    const refreshed = (await harness.behavior.callRpc("listNotifications", {
      force: true,
    })) as NotificationsPayload;
    expect(refreshed.items[0]?.resolved).toBe(false);
    await harness.lifecycle.dispose();
  });

  it("does not resolve activity created after a legacy migration cutoff", async () => {
    let includeActivity = false;
    const createdAfterMigration = "2026-08-20T11:00:00Z";
    const runGh = vi.fn<RunGh>(async (args) => {
      if (isIdentityCall(args)) return identity();
      if (args.includes("notifications")) {
        return includeActivity
          ? [notification(0, { updated_at: createdAfterMigration })]
          : [];
      }
      const query = queryFrom(args);
      if (query.includes("query GithubNotifications")) {
        return {
          data: {
            viewer: { login: "brsbl" },
            notification0: {
              resource: {
                author: { login: "brsbl" },
                number: 1,
                title: "New activity after migration",
                url: "https://github.com/get-bb/bb/pull/1",
              },
            },
          },
        };
      }
      return {
        data: {
          notification0: {
            resource: {
              comments: {
                nodes: [
                  {
                    author: { login: "alice" },
                    createdAt: createdAfterMigration,
                    databaseId: 1,
                  },
                ],
              },
            },
          },
        },
      };
    });
    const { bb, harness } = createFakePluginHost({
      pluginId: "github-notifications",
    });
    await bb.storage.kv.set(
      "resolved-notification-ids:api.github.com/brsbl",
      ["n0"],
    );
    createGithubNotificationsPlugin(runGh)(bb);

    await harness.behavior.callRpc("listNotifications", { force: false });
    includeActivity = true;
    const refreshed = (await harness.behavior.callRpc("listNotifications", {
      force: true,
    })) as NotificationsPayload;
    expect(refreshed.items).toEqual([
      expect.objectContaining({ id: "n0", resolved: false }),
    ]);
    await expect(bb.storage.kv.get(resolvedStateKey())).resolves.toEqual(
      expect.objectContaining({ pendingLegacyIds: [] }),
    );
    await harness.lifecycle.dispose();
  });

  it("finds owned activity on a later bounded notification page and fetches activity only for owned resources", async () => {
    const firstPage = Array.from({ length: 50 }, (_, index) =>
      notification(index),
    );
    const laterNotification = notification(999);
    const graphqlQueries: string[] = [];
    const notificationCalls: string[][] = [];
    const runGh = vi.fn<RunGh>(async (args) => {
      if (isIdentityCall(args)) return identity();
      if (args.includes("notifications")) {
        notificationCalls.push(args);
        return args.includes("page=1")
          ? firstPage
          : [notification(49), laterNotification];
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
                    databaseId: 1,
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
    expect(notificationCalls).toHaveLength(2);
    const snapshotBounds = notificationCalls.map((args) =>
      args.find((arg) => arg.startsWith("before=")),
    );
    expect(snapshotBounds[0]).toMatch(/^before=/u);
    expect(new Set(snapshotBounds).size).toBe(1);
    expect(
      notificationCalls.every((args) => args.includes("per_page=50")),
    ).toBe(true);
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
      if (isIdentityCall(args)) {
        return identity("brsbl", "github.example.test");
      }
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

  it("keeps valid activity when an inline review comment is unavailable", async () => {
    const staleInline = notification(0, {
      subject: {
        latest_comment_url:
          "https://api.github.com/repos/get-bb/bb/pulls/comments/404",
        title: "Deleted inline feedback",
        type: "PullRequest",
        url: "https://api.github.com/repos/get-bb/bb/pulls/1",
      },
    });
    const runGh = vi.fn<RunGh>(async (args) => {
      if (isIdentityCall(args)) return identity();
      if (args.includes("notifications")) {
        return [staleInline, notification(1)];
      }
      if (
        args.includes(
          "https://api.github.com/repos/get-bb/bb/pulls/comments/404",
        )
      ) {
        throw new Error("HTTP 404: review comment was deleted");
      }
      const query = queryFrom(args);
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
        data: {
          notification0: {
            resource: { comments: { nodes: [] }, reviews: { nodes: [] } },
          },
          notification1: {
            resource: {
              comments: {
                nodes: [
                  {
                    author: { login: "alice" },
                    bodyText: "Still available",
                    createdAt: "2026-08-12T11:00:00Z",
                    databaseId: 1,
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

    await expect(
      harness.behavior.callRpc("listNotifications", { force: false }),
    ).resolves.toEqual(
      expect.objectContaining({
        items: [expect.objectContaining({ id: "n1", actor: "alice" })],
      }),
    );
    await harness.lifecycle.dispose();
  });

  it("does not append setup advice to non-authentication failures", async () => {
    const runGh = vi.fn<RunGh>(async (args) => {
      if (isIdentityCall(args)) return identity();
      throw new Error("HTTP 500: GitHub is temporarily unavailable");
    });
    const { bb, harness } = createFakePluginHost({
      pluginId: "github-notifications",
    });
    createGithubNotificationsPlugin(runGh)(bb);

    const failure = harness.behavior.callRpc("listNotifications", {
      force: false,
    });
    await expect(failure).rejects.toThrow(
      "HTTP 500: GitHub is temporarily unavailable",
    );
    await expect(failure).rejects.not.toThrow("gh auth login");
    await harness.lifecycle.dispose();
  });

  it("invalidates cached activity when the authenticated account or host changes", async () => {
    let activeIdentity = identity("account-a", "api.github.com");
    let currentRows: unknown[] = [notification(0)];
    const notificationCalls: string[][] = [];
    const runGh = vi.fn<RunGh>(async (args) => {
      if (isIdentityCall(args)) return activeIdentity;
      if (args.includes("notifications")) {
        notificationCalls.push(args);
        return currentRows;
      }
      const query = queryFrom(args);
      const login = String(activeIdentity.login);
      const aliases = [
        ...query.matchAll(/(notification\d+): repository/gu),
      ].map((match) => match[1]!);
      if (query.includes("query GithubNotifications")) {
        return {
          data: Object.fromEntries([
            ["viewer", { login }],
            ...aliases.map((alias) => [
              alias,
              {
                resource: {
                  author: { login },
                  number: 1,
                  title: `Private activity for ${login}`,
                  url: "https://github.com/get-bb/bb/pull/1",
                },
              },
            ]),
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
                      author: { login: "reviewer" },
                      bodyText: "Private feedback",
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

    const accountA = (await harness.behavior.callRpc("listNotifications", {
      force: false,
    })) as NotificationsPayload;
    expect(accountA.login).toBe("account-a");
    expect(accountA.items).toHaveLength(1);

    activeIdentity = identity("account-b", "api.github.com", 2);
    currentRows = [];
    const accountB = (await harness.behavior.callRpc("listNotifications", {
      force: false,
    })) as NotificationsPayload;
    expect(accountB).toEqual(
      expect.objectContaining({ login: "account-b", items: [] }),
    );

    activeIdentity = identity("account-a", "api.enterprise.test");
    currentRows = [notification(0)];
    const enterprise = (await harness.behavior.callRpc("listNotifications", {
      force: true,
    })) as NotificationsPayload;
    expect(enterprise.login).toBe("account-a");
    expect(enterprise.items).toHaveLength(1);
    expect(
      notificationCalls.slice(1).every(
        (args) => !args.some((arg) => arg.startsWith("since=")),
      ),
    ).toBe(true);
    await harness.lifecycle.dispose();
  });

  it("restarts an in-flight refresh when the authenticated account changes", async () => {
    let identityCalls = 0;
    const runGh = vi.fn<RunGh>(async (args) => {
      if (isIdentityCall(args)) {
        identityCalls += 1;
        return identity(
          identityCalls === 1 ? "account-a" : "account-b",
          "api.github.com",
          identityCalls === 1 ? 1 : 2,
        );
      }
      if (args.includes("notifications")) {
        return identityCalls === 1 ? [notification(0)] : [];
      }
      const login = identityCalls === 1 ? "account-a" : "account-b";
      const query = queryFrom(args);
      if (query.includes("query GithubNotifications")) {
        return {
          data: {
            viewer: { login },
            ...(identityCalls === 1
              ? {
                  notification0: {
                    resource: {
                      author: { login },
                      number: 1,
                      title: "Account A private activity",
                      url: "https://github.com/get-bb/bb/pull/1",
                    },
                  },
                }
              : {}),
          },
        };
      }
      return {
        data: {
          notification0: {
            resource: {
              comments: {
                nodes: [
                  {
                    author: { login: "reviewer" },
                    body: "Private feedback",
                    createdAt: "2026-08-12T11:00:00Z",
                    databaseId: 1,
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
    expect(result).toEqual(
      expect.objectContaining({ login: "account-b", items: [] }),
    );
    expect(identityCalls).toBe(3);
    await harness.lifecycle.dispose();
  });

  it("keeps resolved IDs independent across GitHub accounts and hosts", async () => {
    let activeIdentity = identity("brsbl", "api.github.com");
    const runGh = vi.fn<RunGh>(async (args) => {
      if (isIdentityCall(args)) return activeIdentity;
      if (args.includes("notifications")) return [notification(0)];
      const query = queryFrom(args);
      const login = String(activeIdentity.login);
      if (query.includes("query GithubNotifications")) {
        return {
          data: {
            viewer: { login },
            notification0: {
              resource: {
                author: { login },
                number: 1,
                title: "Same notification ID",
                url: "https://github.com/get-bb/bb/pull/1",
              },
            },
          },
        };
      }
      return {
        data: {
          notification0: {
            resource: {
              comments: {
                nodes: [
                  {
                    author: { login: "alice" },
                    bodyText: "comment",
                    createdAt: "2026-08-12T11:00:00Z",
                    databaseId: 1,
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
    const accountA = (await harness.behavior.callRpc("listNotifications", {
      force: false,
    })) as NotificationsPayload;
    await harness.behavior.callRpc("setNotificationResolved", {
      ...resolutionInput(accountA, "n0", true),
    });

    activeIdentity = identity("someone-else", "api.github.com", 2);
    const otherAccount = (await harness.behavior.callRpc(
      "listNotifications",
      { force: true },
    )) as NotificationsPayload;
    expect(otherAccount.items[0]?.resolved).toBe(false);
    await expect(
      bb.storage.kv.get(
        "resolved-notification-ids:api.github.com/someone-else",
      ),
    ).resolves.toBeUndefined();

    activeIdentity = identity("brsbl", "api.enterprise.test");
    const enterprise = (await harness.behavior.callRpc("listNotifications", {
      force: true,
    })) as NotificationsPayload;
    expect(enterprise.items[0]?.resolved).toBe(false);
    await expect(
      bb.storage.kv.get("resolved-notification-ids:api.github.com/brsbl"),
    ).resolves.toBeUndefined();
    await expect(
      bb.storage.kv.get(resolvedStateKey()),
    ).resolves.toEqual({
      cursors: {
        n0: expect.objectContaining({ updatedAt: "2026-08-12T11:00:00Z" }),
      },
      legacyCutoffAt: null,
      pendingLegacyIds: [],
      version: 2,
    });
    await expect(
      bb.storage.kv.get(
        "resolved-notification-ids:api.enterprise.test/brsbl",
      ),
    ).resolves.toBeUndefined();
    await harness.lifecycle.dispose();
  });

  it("keys resolved state by immutable user id and full GitHub origin", async () => {
    let activeIdentity = identity(
      "old-login",
      "github.example.test:8443",
      77,
    );
    const runGh = vi.fn<RunGh>(async (args) => {
      if (isIdentityCall(args)) return activeIdentity;
      if (args.includes("notifications")) return [notification(0)];
      const query = queryFrom(args);
      const login = String(activeIdentity.login);
      if (query.includes("query GithubNotifications")) {
        return {
          data: {
            viewer: { login },
            notification0: {
              resource: {
                author: { login },
                number: 1,
                title: "Identity-scoped state",
                url: "https://github.example.test/get-bb/bb/pull/1",
              },
            },
          },
        };
      }
      return {
        data: {
          notification0: {
            resource: {
              comments: {
                nodes: [
                  {
                    author: { login: "alice" },
                    createdAt: "2026-08-12T11:00:00Z",
                    databaseId: 1,
                  },
                ],
              },
            },
          },
        },
      };
    });
    const { bb, harness } = createFakePluginHost({
      pluginId: "github-notifications",
    });
    createGithubNotificationsPlugin(runGh)(bb);
    const initial = (await harness.behavior.callRpc("listNotifications", {
      force: false,
    })) as NotificationsPayload;
    await harness.behavior.callRpc(
      "setNotificationResolved",
      resolutionInput(initial, "n0", true),
    );

    activeIdentity = identity(
      "renamed-login",
      "github.example.test:8443",
      77,
    );
    const renamed = (await harness.behavior.callRpc("listNotifications", {
      force: true,
    })) as NotificationsPayload;
    expect(renamed.items[0]?.resolved).toBe(true);

    activeIdentity = identity(
      "renamed-login",
      "github.example.test:9443",
      77,
    );
    const otherPort = (await harness.behavior.callRpc("listNotifications", {
      force: true,
    })) as NotificationsPayload;
    expect(otherPort.items[0]?.resolved).toBe(false);

    activeIdentity = identity(
      "old-login",
      "github.example.test:8443",
      88,
    );
    const reusedLogin = (await harness.behavior.callRpc(
      "listNotifications",
      { force: true },
    )) as NotificationsPayload;
    expect(reusedLogin.items[0]?.resolved).toBe(false);
    await harness.lifecycle.dispose();
  });

  it("shares one active refresh across concurrent cache misses and forced refreshes", async () => {
    let resolveNotifications!: (value: unknown) => void;
    const notifications = new Promise<unknown>((resolve) => {
      resolveNotifications = resolve;
    });
    const runGh = vi.fn<RunGh>(async (args) => {
      if (isIdentityCall(args)) return identity();
      if (args.includes("notifications")) return notifications;
      return { data: { viewer: { login: "brsbl" } } };
    });
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
    await vi.waitFor(() => expect(runGh).toHaveBeenCalledTimes(3));

    resolveNotifications([]);
    await expect(Promise.all([first, second])).resolves.toEqual([
      expect.objectContaining({ items: [], login: "brsbl" }),
      expect.objectContaining({ items: [], login: "brsbl" }),
    ]);
    expect(runGh).toHaveBeenCalledTimes(5);
    await harness.lifecycle.dispose();
  });

  it("uses a full notification snapshot for forced refreshes", async () => {
    const runGh = vi.fn<RunGh>(async (args) => {
      if (isIdentityCall(args)) return identity();
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
      false,
    );
    await harness.lifecycle.dispose();
  });

  it("removes vanished activity during a forced full refresh", async () => {
    let includeActivity = true;
    const runGh = vi.fn<RunGh>(async (args) => {
      if (isIdentityCall(args)) return identity();
      if (args.includes("notifications")) {
        return includeActivity ? [notification(0)] : [];
      }
      const query = queryFrom(args);
      if (query.includes("query GithubNotifications")) {
        return {
          data: {
            viewer: { login: "brsbl" },
            notification0: {
              resource: {
                author: { login: "brsbl" },
                number: 1,
                title: "Activity that disappears",
                url: "https://github.com/get-bb/bb/pull/1",
              },
            },
          },
        };
      }
      return {
        data: {
          notification0: {
            resource: {
              comments: {
                nodes: [
                  {
                    author: { login: "alice" },
                    createdAt: "2026-08-12T11:00:00Z",
                    databaseId: 1,
                  },
                ],
              },
            },
          },
        },
      };
    });
    const { bb, harness } = createFakePluginHost({
      pluginId: "github-notifications",
    });
    createGithubNotificationsPlugin(runGh)(bb);

    const initial = (await harness.behavior.callRpc("listNotifications", {
      force: false,
    })) as NotificationsPayload;
    expect(initial.items).toHaveLength(1);
    includeActivity = false;
    const refreshed = (await harness.behavior.callRpc("listNotifications", {
      force: true,
    })) as NotificationsPayload;
    expect(refreshed.items).toEqual([]);
    await harness.lifecycle.dispose();
  });

  it("evicts a cached comment after an incremental review-only update", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-08-18T00:00:00Z"));
    let notificationFetches = 0;
    const runGh = vi.fn<RunGh>(async (args) => {
      if (isIdentityCall(args)) return identity();
      if (args.includes("notifications")) {
        notificationFetches += 1;
        return notificationFetches === 1
          ? [notification(0)]
          : [
              notification(0, {
                reason: "mention",
                subject: {
                  latest_comment_url:
                    "https://api.github.com/repos/get-bb/bb/pulls/1",
                  title: "Review-only update",
                  type: "PullRequest",
                  url: "https://api.github.com/repos/get-bb/bb/pulls/1",
                },
              }),
            ];
      }
      const query = queryFrom(args);
      if (query.includes("query GithubNotifications")) {
        return {
          data: {
            viewer: { login: "brsbl" },
            notification0: {
              resource: {
                author: { login: "brsbl" },
                number: 1,
                title: "Cached comment",
                url: "https://github.com/get-bb/bb/pull/1",
              },
            },
          },
        };
      }
      return {
        data: {
          notification0: {
            resource: {
              comments: {
                nodes: [
                  {
                    author: { login: "alice" },
                    createdAt: "2026-08-17T23:00:00Z",
                    databaseId: 1,
                  },
                ],
              },
            },
          },
        },
      };
    });
    const { bb, harness } = createFakePluginHost({
      pluginId: "github-notifications",
    });
    createGithubNotificationsPlugin(runGh)(bb);

    const initial = (await harness.behavior.callRpc("listNotifications", {
      force: false,
    })) as NotificationsPayload;
    expect(initial.items).toHaveLength(1);
    vi.setSystemTime(new Date("2026-08-18T00:01:01Z"));
    const refreshed = (await harness.behavior.callRpc("listNotifications", {
      force: false,
    })) as NotificationsPayload;
    expect(refreshed.items).toEqual([]);
    const secondNotificationCall = runGh.mock.calls
      .map(([args]) => args)
      .filter((args) => args.includes("notifications"))[1]!;
    expect(secondNotificationCall.some((arg) => arg.startsWith("since="))).toBe(
      true,
    );
    await harness.lifecycle.dispose();
    vi.useRealTimers();
  });

  it("loads eligible activity beyond the first notification page", async () => {
    const rows = Array.from({ length: 201 }, (_, index) => notification(index));
    const notificationCalls: string[][] = [];
    const runGh = vi.fn<RunGh>(async (args) => {
      if (isIdentityCall(args)) return identity();
      if (args.includes("notifications")) {
        notificationCalls.push(args);
        const page = Number(
          args.find((arg) => arg.startsWith("page="))?.slice(5),
        );
        const start = (page - 1) * 50;
        return rows.slice(start, start + 50);
      }
      const query = queryFrom(args);
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
                    author: {
                      login: index === 200 ? "brsbl" : "someone-else",
                    },
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
        data: {
          notification200: {
            resource: {
              comments: {
                nodes: [
                  {
                    author: { login: "alice" },
                    bodyText: "Found after page one",
                    createdAt: "2026-08-12T11:00:00Z",
                    databaseId: 1,
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
      expect.objectContaining({ id: "n200", number: 201 }),
    ]);
    expect(notificationCalls).toHaveLength(5);
    expect(
      notificationCalls.every((args) => args.includes("per_page=50")),
    ).toBe(true);
    await harness.lifecycle.dispose();
  });

  it("serializes concurrent resolved-state updates", async () => {
    const runGh = vi.fn<RunGh>(async (args) => {
      if (isIdentityCall(args)) return identity();
      if (args.includes("notifications")) {
        return [notification(1), notification(2)];
      }
      const query = queryFrom(args);
      const aliases = [...query.matchAll(/(notification\d+): repository/gu)].map(
        (match) => match[1]!,
      );
      return {
        data: Object.fromEntries([
          ...(query.includes("query GithubNotifications")
            ? [["viewer", { login: "brsbl" }]]
            : []),
          ...aliases.map((alias) => [
            alias,
            {
              resource: query.includes("query GithubNotifications")
                ? {
                    author: { login: "brsbl" },
                    number: Number(alias.replace("notification", "")) + 1,
                    title: alias,
                    url: `https://github.com/get-bb/bb/pull/${Number(alias.replace("notification", "")) + 1}`,
                  }
                : {
                    comments: {
                      nodes: [
                        {
                          author: { login: "alice" },
                          createdAt: "2026-08-12T11:00:00Z",
                          databaseId: 1,
                        },
                      ],
                    },
                  },
            },
          ]),
        ]),
      };
    });
    const { bb, harness } = createFakePluginHost({
      pluginId: "github-notifications",
    });
    createGithubNotificationsPlugin(runGh)(bb);
    const payload = (await harness.behavior.callRpc("listNotifications", {
      force: false,
    })) as NotificationsPayload;

    const key = resolvedStateKey();
    const originalGet = bb.storage.kv.get.bind(bb.storage.kv);
    let reads = 0;
    let releaseReads!: () => void;
    const readsReleased = new Promise<void>((resolve) => {
      releaseReads = resolve;
    });
    vi.spyOn(bb.storage.kv, "get").mockImplementation(async (requestedKey) => {
      const value = await originalGet(requestedKey);
      if (requestedKey !== key) return value;
      reads += 1;
      if (reads === 1) setTimeout(releaseReads, 5);
      if (reads === 2) releaseReads();
      await readsReleased;
      return value;
    });

    await Promise.all([
      harness.behavior.callRpc("setNotificationResolved", {
        ...resolutionInput(payload, "n1", true),
      }),
      harness.behavior.callRpc("setNotificationResolved", {
        ...resolutionInput(payload, "n2", true),
      }),
    ]);
    await expect(originalGet(key)).resolves.toEqual({
      cursors: {
        n1: expect.objectContaining({ eventKey: "comment:1" }),
        n2: expect.objectContaining({ eventKey: "comment:1" }),
      },
      legacyCutoffAt: null,
      pendingLegacyIds: [],
      version: 2,
    });
    await harness.lifecycle.dispose();
  });

  it("does not apply a resolved mutation when its canonical write fails", async () => {
    const runGh = vi.fn<RunGh>(async (args) => {
      if (isIdentityCall(args)) return identity();
      if (args.includes("notifications")) return [notification(0)];
      const query = queryFrom(args);
      if (query.includes("query GithubNotifications")) {
        return {
          data: {
            viewer: { login: "brsbl" },
            notification0: {
              resource: {
                author: { login: "brsbl" },
                number: 1,
                title: "Atomic resolved state",
                url: "https://github.com/get-bb/bb/pull/1",
              },
            },
          },
        };
      }
      return {
        data: {
          notification0: {
            resource: {
              comments: {
                nodes: [
                  {
                    author: { login: "alice" },
                    bodyText: "comment",
                    createdAt: "2026-08-12T11:00:00Z",
                    databaseId: 1,
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
    const payload = (await harness.behavior.callRpc("listNotifications", {
      force: false,
    })) as NotificationsPayload;

    const key = resolvedStateKey();
    const originalSet = bb.storage.kv.set.bind(bb.storage.kv);
    vi.spyOn(bb.storage.kv, "set").mockImplementation(
      async (requestedKey, value) => {
        if (requestedKey === key) throw new Error("storage unavailable");
        return originalSet(requestedKey, value);
      },
    );

    await expect(
      harness.behavior.callRpc("setNotificationResolved", {
        ...resolutionInput(payload, "n0", true),
      }),
    ).rejects.toThrow("storage unavailable");
    await expect(bb.storage.kv.get(key)).resolves.toEqual({
      cursors: {},
      legacyCutoffAt: null,
      pendingLegacyIds: [],
      version: 2,
    });
    const cached = (await harness.behavior.callRpc("listNotifications", {
      force: false,
    })) as NotificationsPayload;
    expect(cached.items[0]?.resolved).toBe(false);
    await harness.lifecycle.dispose();
  });

  it("rejects a resolved mutation when a refresh advances the event", async () => {
    let notificationFetches = 0;
    const runGh = vi.fn<RunGh>(async (args) => {
      if (isIdentityCall(args)) return identity();
      if (args.includes("notifications")) {
        notificationFetches += 1;
        return [
          notification(0, {
            subject: {
              latest_comment_url: `https://api.github.com/repos/get-bb/bb/issues/comments/${notificationFetches}`,
              title: "Race-safe activity",
              type: "PullRequest",
              url: "https://api.github.com/repos/get-bb/bb/pulls/1",
            },
          }),
        ];
      }
      const query = queryFrom(args);
      if (query.includes("query GithubNotifications")) {
        return {
          data: {
            viewer: { login: "brsbl" },
            notification0: {
              resource: {
                author: { login: "brsbl" },
                number: 1,
                title: "Race-safe activity",
                url: "https://github.com/get-bb/bb/pull/1",
              },
            },
          },
        };
      }
      return {
        data: {
          notification0: {
            resource: {
              comments: {
                nodes: [
                  {
                    author: { login: "alice" },
                    bodyText: "comment",
                    createdAt: "2026-08-12T11:00:00Z",
                    databaseId: notificationFetches,
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
    const initial = (await harness.behavior.callRpc("listNotifications", {
      force: false,
    })) as NotificationsPayload;

    const key = resolvedStateKey();
    const originalGet = bb.storage.kv.get.bind(bb.storage.kv);
    let blockedRefreshRead = false;
    let releaseRefresh!: () => void;
    const refreshReleased = new Promise<void>((resolve) => {
      releaseRefresh = resolve;
    });
    vi.spyOn(bb.storage.kv, "get").mockImplementation(async (requestedKey) => {
      const value = await originalGet(requestedKey);
      if (requestedKey === key && !blockedRefreshRead) {
        blockedRefreshRead = true;
        await refreshReleased;
      }
      return value;
    });

    const refresh = harness.behavior.callRpc("listNotifications", {
      force: true,
    });
    await vi.waitFor(() => expect(blockedRefreshRead).toBe(true));
    const resolveItem = harness.behavior.callRpc("setNotificationResolved", {
      ...resolutionInput(initial, "n0", true),
    });
    setTimeout(releaseRefresh, 5);
    await refresh;
    await expect(resolveItem).rejects.toThrow("GitHub activity changed");

    const cached = (await harness.behavior.callRpc("listNotifications", {
      force: false,
    })) as NotificationsPayload;
    expect(cached.items[0]).toEqual(
      expect.objectContaining({ eventKey: "comment:2", resolved: false }),
    );
    await expect(originalGet(key)).resolves.toEqual({
      cursors: {},
      legacyCutoffAt: null,
      pendingLegacyIds: [],
      version: 2,
    });
    await harness.lifecycle.dispose();
  });

  it("waits for active GraphQL workers before a failed refresh can retry", async () => {
    const rows = Array.from({ length: 100 }, (_, index) => notification(index));
    let failNextOwnership = true;
    let activeOwnership = 0;
    let maxActiveOwnership = 0;
    let releaseSibling!: () => void;
    const siblingReleased = new Promise<void>((resolve) => {
      releaseSibling = resolve;
    });
    let observeFailure!: () => void;
    const failureObserved = new Promise<void>((resolve) => {
      observeFailure = resolve;
    });
    const runGh = vi.fn<RunGh>(async (args) => {
      if (isIdentityCall(args)) return identity();
      if (args.includes("notifications")) {
        return args.includes("page=1") ? rows : [];
      }
      const query = queryFrom(args);
      if (!query.includes("query GithubNotifications")) {
        return { data: {} };
      }
      activeOwnership += 1;
      maxActiveOwnership = Math.max(maxActiveOwnership, activeOwnership);
      if (failNextOwnership && query.includes("notification0:")) {
        failNextOwnership = false;
        activeOwnership -= 1;
        observeFailure();
        throw new Error("ownership failed");
      }
      if (!failNextOwnership && maxActiveOwnership === 2) {
        await siblingReleased;
      }
      activeOwnership -= 1;
      const aliases = [...query.matchAll(/(notification\d+): repository/gu)].map(
        (match) => match[1]!,
      );
      return {
        data: Object.fromEntries([
          ["viewer", { login: "brsbl" }],
          ...aliases.map((alias) => [
            alias,
            { resource: { author: { login: "someone-else" } } },
          ]),
        ]),
      };
    });
    const { bb, harness } = createFakePluginHost({
      pluginId: "github-notifications",
    });
    createGithubNotificationsPlugin(runGh)(bb);

    let settled = false;
    const failedRefresh = harness.behavior
      .callRpc("listNotifications", { force: false })
      .finally(() => {
        settled = true;
      });
    await failureObserved;
    await Promise.resolve();
    expect(settled).toBe(false);
    releaseSibling();
    await expect(failedRefresh).rejects.toThrow("ownership failed");

    await expect(
      harness.behavior.callRpc("listNotifications", { force: false }),
    ).resolves.toEqual(expect.objectContaining({ items: [] }));
    expect(maxActiveOwnership).toBeLessThanOrEqual(3);
    await harness.lifecycle.dispose();
  });

  it("bounds concurrent GraphQL batches while avoiding serial owned-resource fetches", async () => {
    const rows = Array.from({ length: 100 }, (_, index) => notification(index));
    let activeGraphql = 0;
    let maxActiveGraphql = 0;
    const graphqlQueries: string[] = [];
    const runGh = vi.fn<RunGh>(async (args) => {
      if (isIdentityCall(args)) return identity();
      if (args.includes("notifications")) {
        if (args.includes("page=1")) return rows;
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
