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
const NOTIFICATION_PAGE_SIZE = 100;
const MAX_NOTIFICATION_ROWS = 5_000;
const MAX_NOTIFICATION_PAGES =
  MAX_NOTIFICATION_ROWS / NOTIFICATION_PAGE_SIZE;
const OWNERSHIP_BATCH_SIZE = 50;
const ACTIVITY_BATCH_SIZE = 20;
const GH_CONCURRENCY = 3;
const GH_HINT = "Install the GitHub CLI and run `gh auth login`, then retry.";
const RESOLVED_IDS_KEY_PREFIX = "resolved-notification-ids:";
const RESOLVED_THROUGH_KEY_PREFIX = "resolved-notification-through:";

interface GithubIdentity {
  host: string;
  key: string;
  login: string;
}

interface ResolvedCursor {
  eventKey: string | null;
  updatedAt: string;
}

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
    eventKey: z.string().nullable().optional(),
    number: z.number().int().positive(),
    repo: z.string(),
    resolved: z.boolean(),
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

const viewerIdentitySchema = z
  .object({
    login: z.string().min(1),
    url: z.string().url(),
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
  setNotificationResolved: {
    input: z
      .object({ id: z.string().min(1), resolved: z.boolean() })
      .strict(),
    output: z
      .object({ id: z.string().min(1), resolved: z.boolean() })
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
  for (let page = 1; page <= MAX_NOTIFICATION_PAGES + 1; page += 1) {
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
    if (page > MAX_NOTIFICATION_PAGES) {
      if (Array.isArray(rawPage) && rawPage.length === 0) return rows;
      throw new Error(
        `GitHub activity exceeds the ${MAX_NOTIFICATION_ROWS}-notification safety limit.`,
      );
    }
    const pageRows = parseNotificationRows(rawPage);
    rows.push(...pageRows);
    if (!Array.isArray(rawPage) || rawPage.length < NOTIFICATION_PAGE_SIZE) {
      return rows;
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

async function fetchGithubIdentity(runGh: RunGh): Promise<GithubIdentity> {
  const identity = viewerIdentitySchema.parse(await runGh(["api", "user"]));
  const host = new URL(identity.url).hostname.toLocaleLowerCase();
  const login = identity.login.toLocaleLowerCase();
  return { host, key: `${host}/${login}`, login: identity.login };
}

function resolvedIdsKey(identity: GithubIdentity): string {
  return `${RESOLVED_IDS_KEY_PREFIX}${identity.key}`;
}

function resolvedThroughKey(identity: GithubIdentity): string {
  return `${RESOLVED_THROUGH_KEY_PREFIX}${identity.key}`;
}

export function createGithubNotificationsPlugin(runGh: RunGh) {
  return function githubNotificationsPlugin(bb: BbPluginApi): void {
    let cache: {
      fetchedAtMs: number;
      identity: GithubIdentity;
      payload: NotificationsPayload;
    } | null = null;
    let activeRefresh: {
      identityKey: string;
      promise: Promise<NotificationsPayload>;
    } | null = null;
    let resolvedStateQueue: Promise<void> = Promise.resolve();

    async function loadResolvedIds(
      identity: GithubIdentity,
    ): Promise<Set<string>> {
      const stored = await bb.storage.kv.get<unknown>(resolvedIdsKey(identity));
      if (!Array.isArray(stored)) return new Set();
      return new Set(
        stored.filter((id): id is string => typeof id === "string"),
      );
    }

    async function loadResolvedState(identity: GithubIdentity): Promise<{
      cursors: Map<string, ResolvedCursor>;
      exists: boolean;
      pendingLegacyIds: Set<string>;
    }> {
      const stored = await bb.storage.kv.get<unknown>(
        resolvedThroughKey(identity),
      );
      if (stored === undefined) {
        return {
          cursors: new Map(),
          exists: false,
          pendingLegacyIds: new Set(),
        };
      }
      if (typeof stored !== "object" || stored === null || Array.isArray(stored)) {
        return {
          cursors: new Map(),
          exists: true,
          pendingLegacyIds: new Set(),
        };
      }
      const record = stored as Record<string, unknown>;
      const rawCursors =
        record.version === 1 &&
        typeof record.cursors === "object" &&
        record.cursors !== null &&
        !Array.isArray(record.cursors)
          ? (record.cursors as Record<string, unknown>)
          : record;
      const pendingLegacyIds =
        record.version === 1 && Array.isArray(record.pendingLegacyIds)
          ? new Set(
              record.pendingLegacyIds.filter(
                (id): id is string => typeof id === "string",
              ),
            )
          : new Set<string>();
      const cursors = new Map<string, ResolvedCursor>();
      for (const [id, value] of Object.entries(rawCursors)) {
        if (typeof value === "string" && Number.isFinite(Date.parse(value))) {
          cursors.set(id, { eventKey: null, updatedAt: value });
          continue;
        }
        if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value) &&
          "updatedAt" in value &&
          typeof value.updatedAt === "string" &&
          Number.isFinite(Date.parse(value.updatedAt)) &&
          "eventKey" in value &&
          (typeof value.eventKey === "string" || value.eventKey === null)
        ) {
          cursors.set(id, {
            eventKey: value.eventKey,
            updatedAt: value.updatedAt,
          });
        }
      }
      return { cursors, exists: true, pendingLegacyIds };
    }

    async function storeResolvedState(
      identity: GithubIdentity,
      cursors: Map<string, ResolvedCursor>,
      pendingLegacyIds: Set<string>,
    ): Promise<void> {
      await bb.storage.kv.set(
        resolvedThroughKey(identity),
        {
          cursors: Object.fromEntries(
            [...cursors.entries()].sort(([left], [right]) =>
              left.localeCompare(right),
            ),
          ),
          pendingLegacyIds: [...pendingLegacyIds].sort(),
          version: 1,
        },
      );
    }

    async function applyResolvedState(
      identity: GithubIdentity,
      items: NotificationsPayload["items"],
    ): Promise<NotificationsPayload["items"]> {
      const resolvedState = await loadResolvedState(identity);
      const pendingLegacyIds = resolvedState.exists
        ? resolvedState.pendingLegacyIds
        : await loadResolvedIds(identity);
      const cursors = resolvedState.cursors;
      let stateChanged = !resolvedState.exists;
      const nextItems = items.map((item) => {
        let cursor = cursors.get(item.id);
        if (cursor === undefined && pendingLegacyIds.has(item.id)) {
          // Legacy state knew only the notification id. Snapshot the current
          // event once so all later activity can reopen the thread.
          cursor = {
            eventKey: item.eventKey ?? null,
            updatedAt: item.updatedAt,
          };
          cursors.set(item.id, cursor);
          pendingLegacyIds.delete(item.id);
          stateChanged = true;
        }
        const timestampOrder =
          cursor === undefined
            ? 1
            : Date.parse(item.updatedAt) - Date.parse(cursor.updatedAt);
        const sameEvent =
          cursor !== undefined &&
          timestampOrder === 0 &&
          (cursor.eventKey === null ||
            cursor.eventKey === (item.eventKey ?? null));
        const resolved =
          cursor !== undefined && (timestampOrder < 0 || sameEvent);
        if (!resolved && cursor !== undefined) {
          cursors.delete(item.id);
          stateChanged = true;
        }
        return { ...item, resolved };
      });
      if (stateChanged) {
        await storeResolvedState(identity, cursors, pendingLegacyIds);
      }
      return nextItems;
    }

    function withResolvedState<T>(run: () => Promise<T>): Promise<T> {
      const result = resolvedStateQueue.then(run, run);
      resolvedStateQueue = result.then(
        () => undefined,
        () => undefined,
      );
      return result;
    }

    async function refresh(
      identity: GithubIdentity,
      identityRetries = 0,
    ): Promise<NotificationsPayload> {
      const previous = cache;
      const refreshedAtMs = Date.now();
      const sameIdentity = previous?.identity.key === identity.key;
      const rows = await fetchNotificationRows(
        runGh,
        !sameIdentity || previous === null
          ? undefined
          : new Date(previous.fetchedAtMs).toISOString(),
      );
      if (sameIdentity && previous !== null && rows.length === 0) {
        const confirmedIdentity = await fetchGithubIdentity(runGh);
        if (confirmedIdentity.key !== identity.key) {
          if (identityRetries >= 2) {
            throw new Error("GitHub account changed repeatedly during refresh.");
          }
          return refresh(confirmedIdentity, identityRetries + 1);
        }
        return withResolvedState(async () => {
          const payload = {
            ...previous.payload,
            fetchedAt: new Date(refreshedAtMs).toISOString(),
            items: await applyResolvedState(
              identity,
              previous.payload.items,
            ),
            login: identity.login,
          };
          cache = { identity, payload, fetchedAtMs: refreshedAtMs };
          return payload;
        });
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
        async ({ lookup, url }) => {
          try {
            return {
              comment: inlineReviewCommentSchema.parse(
                await runGh(["api", url]),
              ),
              lookup,
            };
          } catch (error: unknown) {
            const message =
              error instanceof Error ? error.message : String(error);
            bb.log.warn(
              `Skipping unavailable GitHub review comment for ${lookup.alias}: ${message}`,
            );
            return null;
          }
        },
      );
      for (const result of inlineReviewResults) {
        if (result === null) continue;
        const { comment, lookup } = result;
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
                          body: comment.body,
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
      const confirmedIdentity = await fetchGithubIdentity(runGh);
      if (
        confirmedIdentity.key !== identity.key ||
        projected.login.toLocaleLowerCase() !== identity.login.toLocaleLowerCase()
      ) {
        if (identityRetries >= 2) {
          throw new Error("GitHub account changed repeatedly during refresh.");
        }
        return refresh(confirmedIdentity, identityRetries + 1);
      }
      const changedIds = new Set(rows.map((row) => row.id));
      const refreshedItems =
        !sameIdentity || previous === null
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
      return withResolvedState(async () => {
        const items = await applyResolvedState(identity, refreshedItems);
        const payload = {
          fetchedAt: new Date(refreshedAtMs).toISOString(),
          items,
          login: projected.login,
        };
        cache = { identity, payload, fetchedAtMs: refreshedAtMs };
        return payload;
      });
    }

    async function listNotifications(
      force: boolean | undefined,
    ): Promise<NotificationsPayload> {
      const identity = await fetchGithubIdentity(runGh);
      if (
        force !== true &&
        cache !== null &&
        cache.identity.key === identity.key &&
        Date.now() - cache.fetchedAtMs < CACHE_TTL_MS
      ) {
        return cache.payload;
      }
      if (activeRefresh !== null) {
        if (activeRefresh.identityKey === identity.key) {
          return activeRefresh.promise;
        }
        try {
          await activeRefresh.promise;
        } catch {
          // A different identity still needs its own refresh after this settles.
        }
        return listNotifications(false);
      }
      const promise = refresh(identity)
        .catch((error: unknown) => {
          const message =
            error instanceof Error ? error.message : String(error);
          bb.log.warn(`GitHub notification refresh failed: ${message}`);
          throw new Error(message);
        })
        .finally(() => {
          if (activeRefresh?.promise === promise) activeRefresh = null;
        });
      activeRefresh = { identityKey: identity.key, promise };
      return promise;
    }

    bb.rpc.register(rpcContract, {
      async listNotifications({ force }) {
        return listNotifications(force);
      },
      async setNotificationResolved({ id, resolved }) {
        return withResolvedState(async () => {
          if (cache === null) {
            throw new Error("Load GitHub activity before updating its state.");
          }
          const identity = cache.identity;
          const item = cache.payload.items.find((candidate) => candidate.id === id);
          const { cursors, pendingLegacyIds } = await loadResolvedState(identity);
          pendingLegacyIds.delete(id);
          if (resolved) {
            cursors.set(id, {
              eventKey: item?.eventKey ?? null,
              updatedAt: item?.updatedAt ?? new Date().toISOString(),
            });
          } else {
            cursors.delete(id);
          }
          await storeResolvedState(identity, cursors, pendingLegacyIds);
          if (cache.identity.key === identity.key) {
            cache = {
              ...cache,
              payload: {
                ...cache.payload,
                items: cache.payload.items.map((item) =>
                  item.id === id ? { ...item, resolved } : item,
                ),
              },
            };
          }
          return { id, resolved };
        });
      },
    });
    bb.log.info("GitHub Activity loaded");
  };
}

export default createGithubNotificationsPlugin(defaultGhRunner());
