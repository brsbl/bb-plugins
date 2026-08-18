import { execFile } from "node:child_process";

import { defineRpcContract, type BbPluginApi } from "@bb/plugin-sdk";
import { z } from "zod";

import {
  buildActivityQuery,
  buildOwnershipQuery,
  parseNotificationRows,
  projectOwnedNotifications,
  selectOwnedLookups,
  type GraphqlLookup,
  type GithubNotificationRow,
} from "./core.js";

const CACHE_TTL_MS = 60_000;
const NOTIFICATION_PAGE_SIZE = 50;
const MAX_NOTIFICATION_PAGES = 5;
const OWNERSHIP_BATCH_SIZE = 50;
const ACTIVITY_BATCH_SIZE = 20;
const GH_CONCURRENCY = 3;
const GH_HINT = "Install the GitHub CLI and run `gh auth login`, then retry.";

const notificationItemSchema = z
  .object({
    id: z.string(),
    activity: z.string(),
    activityKind: z.enum([
      "approved",
      "changes-requested",
      "comment",
      "mention",
      "review",
    ]),
    actor: z.string().nullable(),
    avatarUrl: z.string().url().nullable(),
    number: z.number().int().positive(),
    repo: z.string(),
    resourceKind: z.enum(["issue", "pr"]),
    title: z.string(),
    unread: z.boolean(),
    updatedAt: z.string(),
    url: z.string().url(),
  })
  .strict();

const inlineReviewCommentSchema = z
  .object({
    body: z.string(),
    created_at: z.string(),
    id: z.number().int().positive(),
    user: z
      .object({
        avatar_url: z.string().url().nullable(),
        login: z.string().min(1),
      })
      .nullable(),
  })
  .passthrough();

export const rpcContract = defineRpcContract({
  listNotifications: {
    input: z.object({ force: z.boolean().optional() }).strict(),
    output: z
      .object({
        fetchedAt: z.string(),
        items: z.array(notificationItemSchema),
        login: z.string().min(1),
      })
      .strict(),
  },
});

export type NotificationsPayload = z.infer<
  (typeof rpcContract)["listNotifications"]["output"]
>;

export type RunGh = (args: string[]) => Promise<unknown>;

function graphqlData(raw: unknown): Record<string, unknown> {
  if (
    typeof raw !== "object" ||
    raw === null ||
    !("data" in raw) ||
    typeof raw.data !== "object" ||
    raw.data === null
  ) {
    throw new Error("GitHub returned an invalid activity response.");
  }
  return raw.data as Record<string, unknown>;
}

function mergeGraphqlData(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): void {
  for (const [key, value] of Object.entries(source)) {
    if (key === "viewer" || typeof value !== "object" || value === null) {
      target[key] = value;
      continue;
    }
    const current = target[key];
    if (
      typeof current === "object" &&
      current !== null &&
      "resource" in current &&
      typeof current.resource === "object" &&
      current.resource !== null &&
      "resource" in value &&
      typeof value.resource === "object" &&
      value.resource !== null
    ) {
      target[key] = {
        ...current,
        ...value,
        resource: { ...current.resource, ...value.resource },
      };
    } else {
      target[key] = value;
    }
  }
}

async function fetchNotificationRows(
  runGh: RunGh,
  since?: string,
): Promise<GithubNotificationRow[]> {
  const rows: GithubNotificationRow[] = [];
  for (let page = 1; page <= MAX_NOTIFICATION_PAGES; page += 1) {
    const args = [
      "api",
      "notifications",
      "--method",
      "GET",
      "-f",
      "all=true",
      "-f",
      "participating=true",
      "-f",
      `per_page=${NOTIFICATION_PAGE_SIZE}`,
      "-f",
      `page=${page}`,
    ];
    if (since !== undefined) args.push("-f", `since=${since}`);
    const rawPage = await runGh(args);
    const pageRows = parseNotificationRows(rawPage);
    rows.push(...pageRows);
    if (!Array.isArray(rawPage) || rawPage.length < NOTIFICATION_PAGE_SIZE) {
      break;
    }
  }
  return rows;
}

async function mapWithConcurrency<T, R>(
  values: readonly T[],
  limit: number,
  run: (value: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let nextIndex = 0;
  async function worker(): Promise<void> {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await run(values[index]!);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, values.length) }, () => worker()),
  );
  return results;
}

function runGhCommand(file: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      file,
      args,
      { maxBuffer: 16 * 1024 * 1024, timeout: 30_000 },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr.trim() || error.message));
          return;
        }
        resolve(stdout);
      },
    );
  });
}

function defaultGhRunner(): RunGh {
  let ghPath: string | null = null;
  async function resolveGh(): Promise<string> {
    if (ghPath !== null) return ghPath;
    for (const candidate of [
      "gh",
      "/opt/homebrew/bin/gh",
      "/usr/local/bin/gh",
    ]) {
      try {
        await runGhCommand(candidate, ["--version"]);
        ghPath = candidate;
        return candidate;
      } catch {
        // Try the next standard installation path.
      }
    }
    throw new Error(`GitHub CLI not found. ${GH_HINT}`);
  }
  return async (args) => {
    const file = await resolveGh();
    const stdout = await runGhCommand(file, args);
    try {
      return JSON.parse(stdout) as unknown;
    } catch {
      throw new Error("GitHub returned an invalid JSON response.");
    }
  };
}

export function createGithubNotificationsPlugin(runGh: RunGh) {
  return function githubNotificationsPlugin(bb: BbPluginApi): void {
    let cache: { payload: NotificationsPayload; fetchedAtMs: number } | null =
      null;
    let activeRefresh: Promise<NotificationsPayload> | null = null;

    async function refresh(): Promise<NotificationsPayload> {
      const previous = cache;
      const refreshedAtMs = Date.now();
      const rows = await fetchNotificationRows(
        runGh,
        previous === null
          ? undefined
          : new Date(previous.fetchedAtMs).toISOString(),
      );
      if (previous !== null && rows.length === 0) {
        const payload = {
          ...previous.payload,
          fetchedAt: new Date(refreshedAtMs).toISOString(),
        };
        cache = { payload, fetchedAtMs: refreshedAtMs };
        return payload;
      }
      const combinedData: Record<string, unknown> = {};
      const allLookups: GraphqlLookup[] = [];
      const ownershipBatchCount = Math.max(
        1,
        Math.ceil(rows.length / OWNERSHIP_BATCH_SIZE),
      );
      const ownershipResults = await mapWithConcurrency(
        Array.from({ length: ownershipBatchCount }, (_, batch) => batch),
        GH_CONCURRENCY,
        async (batch) => {
          const start = batch * OWNERSHIP_BATCH_SIZE;
          const { lookups, query } = buildOwnershipQuery(
            rows.slice(start, start + OWNERSHIP_BATCH_SIZE),
            start,
          );
          const data = graphqlData(
            await runGh(["api", "graphql", "-f", `query=${query}`]),
          );
          return { data, lookups };
        },
      );
      for (const { data, lookups } of ownershipResults) {
        allLookups.push(...lookups);
        mergeGraphqlData(combinedData, data);
      }
      const owned = selectOwnedLookups({
        data: combinedData,
        lookups: allLookups,
      });
      const inlineReviewLookups = owned.lookups.flatMap((lookup) => {
        const index = Number(lookup.alias.replace("notification", ""));
        const row = Number.isSafeInteger(index) ? rows[index] : undefined;
        return row !== undefined &&
          row.latestCommentUrl !== null &&
          /\/pulls\/comments\/\d+$/u.test(row.latestCommentUrl)
          ? [{ lookup, url: row.latestCommentUrl }]
          : [];
      });
      const inlineReviewResults = await mapWithConcurrency(
        inlineReviewLookups,
        GH_CONCURRENCY,
        async ({ lookup, url }) => ({
          comment: inlineReviewCommentSchema.parse(await runGh(["api", url])),
          lookup,
        }),
      );
      for (const { comment, lookup } of inlineReviewResults) {
        mergeGraphqlData(combinedData, {
          [lookup.alias]: {
            resource: {
              reviewThreads: {
                nodes: [
                  {
                    comments: {
                      nodes: [
                        {
                          author:
                            comment.user === null
                              ? null
                              : {
                                  avatarUrl: comment.user.avatar_url,
                                  login: comment.user.login,
                                },
                          bodyText: comment.body,
                          createdAt: comment.created_at,
                          databaseId: comment.id,
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        });
      }
      const activityGroups = Array.from(
        { length: Math.ceil(owned.lookups.length / ACTIVITY_BATCH_SIZE) },
        (_, index) =>
          owned.lookups.slice(
            index * ACTIVITY_BATCH_SIZE,
            (index + 1) * ACTIVITY_BATCH_SIZE,
          ),
      );
      const activityResults = await mapWithConcurrency(
        activityGroups,
        GH_CONCURRENCY,
        async (lookups) => {
          const query = buildActivityQuery({ lookups, rows });
          return graphqlData(
            await runGh(["api", "graphql", "-f", `query=${query}`]),
          );
        },
      );
      for (const data of activityResults) {
        mergeGraphqlData(combinedData, data);
      }
      const projected = projectOwnedNotifications({
        data: combinedData,
        lookups: owned.lookups,
        rows,
      });
      const changedIds = new Set(rows.map((row) => row.id));
      const items =
        previous === null
          ? projected.items
          : [
              ...projected.items,
              ...previous.payload.items.filter(
                (item) => !changedIds.has(item.id),
              ),
            ].sort(
              (left, right) =>
                Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
            );
      const payload = {
        fetchedAt: new Date(refreshedAtMs).toISOString(),
        items,
        login: projected.login,
      };
      cache = { payload, fetchedAtMs: refreshedAtMs };
      return payload;
    }

    bb.rpc.register(rpcContract, {
      async listNotifications({ force }) {
        if (
          force !== true &&
          cache !== null &&
          Date.now() - cache.fetchedAtMs < CACHE_TTL_MS
        ) {
          return cache.payload;
        }
        if (activeRefresh !== null) return activeRefresh;
        activeRefresh = refresh()
          .catch((error: unknown) => {
            const message =
              error instanceof Error ? error.message : String(error);
            bb.log.warn(`GitHub notification refresh failed: ${message}`);
            throw new Error(`${message} ${GH_HINT}`);
          })
          .finally(() => {
            activeRefresh = null;
          });
        return activeRefresh;
      },
    });
    bb.log.info("GitHub Activity loaded");
  };
}

export default createGithubNotificationsPlugin(defaultGhRunner());
