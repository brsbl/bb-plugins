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
const OWNERSHIP_BATCH_SIZE = 25;
const ACTIVITY_BATCH_SIZE = 10;
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
    number: z.number().int().positive(),
    repo: z.string(),
    resourceKind: z.enum(["issue", "pr"]),
    title: z.string(),
    unread: z.boolean(),
    updatedAt: z.string(),
    url: z.string().url(),
  })
  .strict();

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
): Promise<GithubNotificationRow[]> {
  const rows: GithubNotificationRow[] = [];
  for (let page = 1; page <= MAX_NOTIFICATION_PAGES; page += 1) {
    const rawPage = await runGh([
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
    ]);
    const pageRows = parseNotificationRows(rawPage);
    rows.push(...pageRows);
    if (!Array.isArray(rawPage) || rawPage.length < NOTIFICATION_PAGE_SIZE) {
      break;
    }
  }
  return rows;
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
      const rows = await fetchNotificationRows(runGh);
      const combinedData: Record<string, unknown> = {};
      const allLookups: GraphqlLookup[] = [];
      const ownershipBatchCount = Math.max(
        1,
        Math.ceil(rows.length / OWNERSHIP_BATCH_SIZE),
      );
      for (let batch = 0; batch < ownershipBatchCount; batch += 1) {
        const start = batch * OWNERSHIP_BATCH_SIZE;
        const { lookups, query } = buildOwnershipQuery(
          rows.slice(start, start + OWNERSHIP_BATCH_SIZE),
          start,
        );
        allLookups.push(...lookups);
        mergeGraphqlData(
          combinedData,
          graphqlData(await runGh(["api", "graphql", "-f", `query=${query}`])),
        );
      }
      const owned = selectOwnedLookups({
        data: combinedData,
        lookups: allLookups,
      });
      for (
        let start = 0;
        start < owned.lookups.length;
        start += ACTIVITY_BATCH_SIZE
      ) {
        const query = buildActivityQuery({
          lookups: owned.lookups.slice(start, start + ACTIVITY_BATCH_SIZE),
          rows,
        });
        mergeGraphqlData(
          combinedData,
          graphqlData(await runGh(["api", "graphql", "-f", `query=${query}`])),
        );
      }
      const projected = projectOwnedNotifications({
        data: combinedData,
        lookups: owned.lookups,
        rows,
      });
      const payload = {
        fetchedAt: new Date().toISOString(),
        items: projected.items,
        login: projected.login,
      };
      cache = { payload, fetchedAtMs: Date.now() };
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
