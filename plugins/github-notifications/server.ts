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
const MAX_NOTIFICATION_ROWS = 250;
const MAX_NOTIFICATION_PAGES =
  MAX_NOTIFICATION_ROWS / NOTIFICATION_PAGE_SIZE;
const OWNERSHIP_BATCH_SIZE = 50;
const ACTIVITY_BATCH_SIZE = 20;
const GH_CONCURRENCY = 3;
const GH_HINT = "Install the GitHub CLI and run `gh auth login`, then retry.";
const RESOLVED_IDS_KEY_PREFIX = "resolved-notification-ids:";
const RESOLVED_THROUGH_KEY_PREFIX = "resolved-notification-through:";

interface GithubIdentity {
  legacyKey: string;
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
    activityKind: z.enum(["comment", "mention"]),
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
    updated_at: z.string().optional(),
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
    id: z.number().int().positive(),
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
        identityKey: z.string().min(1),
        items: z.array(notificationItemSchema),
        login: z.string().min(1),
      })
      .strict(),
  },
  setNotificationResolved: {
    input: z
      .object({
        eventKey: z.string().nullable(),
        id: z.string().min(1),
        identityKey: z.string().min(1),
        resolved: z.boolean(),
        updatedAt: z.string(),
      })
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
  before?: string,
): Promise<{
  changedIds: Set<string>;
  rows: GithubNotificationRow[];
}> {
  const rows: GithubNotificationRow[] = [];
  const changedIds = new Set<string>();
  const seenIds = new Set<string>();
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
    if (before !== undefined) args.push("-f", `before=${before}`);
    const rawPage = await runGh(args);
    if (page > MAX_NOTIFICATION_PAGES) {
      if (Array.isArray(rawPage) && rawPage.length === 0) {
        return { changedIds, rows };
      }
      throw new Error(
        `GitHub activity exceeds the ${MAX_NOTIFICATION_ROWS}-notification safety limit.`,
      );
    }
    if (Array.isArray(rawPage)) {
      for (const entry of rawPage) {
        if (
          typeof entry === "object" &&
          entry !== null &&
          "id" in entry &&
          typeof entry.id === "string"
        ) {
          changedIds.add(entry.id);
        }
      }
    }
    const pageRows = parseNotificationRows(rawPage);
    for (const row of pageRows) {
      if (seenIds.has(row.id)) continue;
      seenIds.add(row.id);
      rows.push(row);
    }
    if (!Array.isArray(rawPage) || rawPage.length < NOTIFICATION_PAGE_SIZE) {
      return { changedIds, rows };
    }
  }
  return { changedIds, rows };
}

async function mapWithConcurrency<T, R>(
  values: readonly T[],
  limit: number,
  run: (value: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let nextIndex = 0;
  let firstError: unknown;
  async function worker(): Promise<void> {
    while (firstError === undefined && nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      try {
        results[index] = await run(values[index]!);
      } catch (error: unknown) {
        firstError ??= error;
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, values.length) }, () => worker()),
  );
  if (firstError !== undefined) throw firstError;
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
  const url = new URL(identity.url);
  const origin = url.origin.toLocaleLowerCase();
  const host = url.hostname.toLocaleLowerCase();
  const login = identity.login.toLocaleLowerCase();
  return {
    key: `${origin}/user/${identity.id}`,
    legacyKey: `${host}/${login}`,
    login: identity.login,
  };
}

function resolvedIdsKey(identity: GithubIdentity): string {
  return `${RESOLVED_IDS_KEY_PREFIX}${identity.key}`;
}

function resolvedThroughKey(identity: GithubIdentity): string {
  return `${RESOLVED_THROUGH_KEY_PREFIX}${identity.key}`;
}

function legacyResolvedIdsKey(identity: GithubIdentity): string {
  return `${RESOLVED_IDS_KEY_PREFIX}${identity.legacyKey}`;
}

function legacyResolvedThroughKey(identity: GithubIdentity): string {
  return `${RESOLVED_THROUGH_KEY_PREFIX}${identity.legacyKey}`;
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
      const current = await bb.storage.kv.get<unknown>(resolvedIdsKey(identity));
      const stored =
        current === undefined
          ? await bb.storage.kv.get<unknown>(legacyResolvedIdsKey(identity))
          : current;
      if (!Array.isArray(stored)) return new Set();
      return new Set(
        stored.filter((id): id is string => typeof id === "string"),
      );
    }

    async function loadResolvedState(identity: GithubIdentity): Promise<{
      cursors: Map<string, ResolvedCursor>;
      exists: boolean;
      legacyCutoffAt: string | null;
      needsMigration: boolean;
      pendingLegacyIds: Set<string>;
    }> {
      const current = await bb.storage.kv.get<unknown>(
        resolvedThroughKey(identity),
      );
      const legacy =
        current === undefined
          ? await bb.storage.kv.get<unknown>(legacyResolvedThroughKey(identity))
          : undefined;
      const stored = current ?? legacy;
      if (stored === undefined) {
        return {
          cursors: new Map(),
          exists: false,
          legacyCutoffAt: null,
          needsMigration: false,
          pendingLegacyIds: new Set(),
        };
      }
      if (typeof stored !== "object" || stored === null || Array.isArray(stored)) {
        return {
          cursors: new Map(),
          exists: true,
          legacyCutoffAt: null,
          needsMigration: legacy !== undefined,
          pendingLegacyIds: new Set(),
        };
      }
      const record = stored as Record<string, unknown>;
      const rawCursors =
        (record.version === 1 || record.version === 2) &&
        typeof record.cursors === "object" &&
        record.cursors !== null &&
        !Array.isArray(record.cursors)
          ? (record.cursors as Record<string, unknown>)
          : record;
      const pendingLegacyIds =
        (record.version === 1 || record.version === 2) &&
        Array.isArray(record.pendingLegacyIds)
          ? new Set(
              record.pendingLegacyIds.filter(
                (id): id is string => typeof id === "string",
              ),
            )
          : new Set<string>();
      const legacyCutoffAt =
        record.version === 2 &&
        typeof record.legacyCutoffAt === "string" &&
        Number.isFinite(Date.parse(record.legacyCutoffAt))
          ? record.legacyCutoffAt
          : null;
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
      return {
        cursors,
        exists: true,
        legacyCutoffAt,
        needsMigration: legacy !== undefined || record.version !== 2,
        pendingLegacyIds,
      };
    }

    async function storeResolvedState(
      identity: GithubIdentity,
      cursors: Map<string, ResolvedCursor>,
      legacyCutoffAt: string | null,
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
          legacyCutoffAt,
          pendingLegacyIds: [...pendingLegacyIds].sort(),
          version: 2,
        },
      );
    }

    async function applyResolvedState(
      identity: GithubIdentity,
      items: NotificationsPayload["items"],
      migrationCutoffAt: string,
    ): Promise<NotificationsPayload["items"]> {
      const resolvedState = await loadResolvedState(identity);
      const pendingLegacyIds = resolvedState.exists
        ? resolvedState.pendingLegacyIds
        : await loadResolvedIds(identity);
      const cursors = resolvedState.cursors;
      let legacyCutoffAt = resolvedState.legacyCutoffAt;
      if (legacyCutoffAt === null && pendingLegacyIds.size > 0) {
        legacyCutoffAt = migrationCutoffAt;
      }
      let stateChanged = !resolvedState.exists || resolvedState.needsMigration;
      const nextItems = items.map((item) => {
        let cursor = cursors.get(item.id);
        if (cursor === undefined && pendingLegacyIds.has(item.id)) {
          if (
            legacyCutoffAt !== null &&
            Date.parse(item.updatedAt) <= Date.parse(legacyCutoffAt)
          ) {
            // Legacy state knew only the notification id. Snapshot only an
            // event that existed when migration began; later events reopen it.
            cursor = {
              eventKey: item.eventKey ?? null,
              updatedAt: item.updatedAt,
            };
            cursors.set(item.id, cursor);
          }
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
        await storeResolvedState(
          identity,
          cursors,
          legacyCutoffAt,
          pendingLegacyIds,
        );
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
      fullSnapshot = false,
    ): Promise<NotificationsPayload> {
      const previous = cache;
      const refreshedAtMs = Date.now();
      const sameIdentity = previous?.identity.key === identity.key;
      const notificationResult = await fetchNotificationRows(
        runGh,
        fullSnapshot || !sameIdentity || previous === null
          ? undefined
          : new Date(previous.fetchedAtMs).toISOString(),
        new Date(refreshedAtMs).toISOString(),
      );
      const { changedIds, rows } = notificationResult;
      if (
        !fullSnapshot &&
        sameIdentity &&
        previous !== null &&
        changedIds.size === 0
      ) {
        const confirmedIdentity = await fetchGithubIdentity(runGh);
        if (confirmedIdentity.key !== identity.key) {
          if (identityRetries >= 2) {
            throw new Error("GitHub account changed repeatedly during refresh.");
          }
          return refresh(confirmedIdentity, identityRetries + 1, fullSnapshot);
        }
        return withResolvedState(async () => {
          const payload = {
            ...previous.payload,
            fetchedAt: new Date(refreshedAtMs).toISOString(),
            items: await applyResolvedState(
              identity,
              previous.payload.items,
              new Date(refreshedAtMs).toISOString(),
            ),
            identityKey: identity.key,
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
      const exactCommentLookups = owned.lookups.flatMap((lookup) => {
        const index = Number(lookup.alias.replace("notification", ""));
        const row = Number.isSafeInteger(index) ? rows[index] : undefined;
        return row !== undefined &&
          row.latestCommentUrl !== null &&
          (row.reason !== "comment" ||
            /\/pulls\/comments\/\d+$/u.test(row.latestCommentUrl))
          ? [
              {
                inline: /\/pulls\/comments\/\d+$/u.test(row.latestCommentUrl),
                lookup,
                url: row.latestCommentUrl,
              },
            ]
          : [];
      });
      const exactCommentResults = await mapWithConcurrency(
        exactCommentLookups,
        GH_CONCURRENCY,
        async ({ inline, lookup, url }) => {
          try {
            return {
              comment: inlineReviewCommentSchema.parse(
                await runGh(["api", url]),
              ),
              inline,
              lookup,
            };
          } catch (error: unknown) {
            const message =
              error instanceof Error ? error.message : String(error);
            bb.log.warn(
              `Skipping unavailable GitHub comment for ${lookup.alias}: ${message}`,
            );
            return null;
          }
        },
      );
      const groupsFor = (lookups: GraphqlLookup[], size: number) =>
        Array.from(
          { length: Math.ceil(lookups.length / size) },
          (_, index) => lookups.slice(index * size, (index + 1) * size),
        );
      const activityGroups = [
        ...groupsFor(owned.lookups, ACTIVITY_BATCH_SIZE),
      ];
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
      for (const result of exactCommentResults) {
        if (result === null) continue;
        const { comment, inline, lookup } = result;
        const normalizedComment = {
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
          updatedAt: comment.updated_at ?? comment.created_at,
        };
        mergeGraphqlData(combinedData, {
          [lookup.alias]: {
            resource: {
              ...(inline
                ? {
                    reviewThreads: {
                      nodes: [{ comments: { nodes: [normalizedComment] } }],
                    },
                  }
                : { comments: { nodes: [normalizedComment] } }),
            },
          },
        });
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
        return refresh(confirmedIdentity, identityRetries + 1, fullSnapshot);
      }
      const refreshedItems =
        fullSnapshot || !sameIdentity || previous === null
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
        const items = await applyResolvedState(
          identity,
          refreshedItems,
          new Date(refreshedAtMs).toISOString(),
        );
        const payload = {
          fetchedAt: new Date(refreshedAtMs).toISOString(),
          identityKey: identity.key,
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
      const promise = refresh(identity, 0, force === true)
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
      async setNotificationResolved({
        eventKey,
        id,
        identityKey,
        resolved,
        updatedAt,
      }) {
        return withResolvedState(async () => {
          if (cache === null) {
            throw new Error("Load GitHub activity before updating its state.");
          }
          const identity = cache.identity;
          if (identity.key !== identityKey) {
            throw new Error("GitHub account changed. Refresh activity and try again.");
          }
          const item = cache.payload.items.find((candidate) => candidate.id === id);
          if (
            item === undefined ||
            (item.eventKey ?? null) !== eventKey ||
            item.updatedAt !== updatedAt
          ) {
            throw new Error("GitHub activity changed. Refresh and try again.");
          }
          const { cursors, legacyCutoffAt, pendingLegacyIds } =
            await loadResolvedState(identity);
          pendingLegacyIds.delete(id);
          if (resolved) {
            cursors.set(id, {
              eventKey,
              updatedAt,
            });
          } else {
            cursors.delete(id);
          }
          await storeResolvedState(
            identity,
            cursors,
            legacyCutoffAt,
            pendingLegacyIds,
          );
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
