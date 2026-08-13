import { execFile } from "node:child_process";

import { defineRpcContract, type BbPluginApi } from "@bb/plugin-sdk";
import { z } from "zod";

import {
  buildGraphqlQuery,
  parseNotificationRows,
  projectOwnedNotifications,
} from "./core.js";

const CACHE_TTL_MS = 60_000;
const GH_HINT = "Install the GitHub CLI and run `gh auth login`, then retry.";

const notificationItemSchema = z.object({
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
}).strict();

export const rpcContract = defineRpcContract({
  listNotifications: {
    input: z.object({ force: z.boolean().optional() }).strict(),
    output: z.object({
      fetchedAt: z.string(),
      items: z.array(notificationItemSchema),
      login: z.string().min(1),
    }).strict(),
  },
});

export type NotificationsPayload = z.infer<
  (typeof rpcContract)["listNotifications"]["output"]
>;

export type RunGh = (args: string[]) => Promise<unknown>;

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
    for (const candidate of ["gh", "/opt/homebrew/bin/gh", "/usr/local/bin/gh"]) {
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
    let cache: { payload: NotificationsPayload; fetchedAtMs: number } | null = null;

    bb.rpc.register(rpcContract, {
      async listNotifications({ force }) {
        if (
          force !== true &&
          cache !== null &&
          Date.now() - cache.fetchedAtMs < CACHE_TTL_MS
        ) {
          return cache.payload;
        }
        try {
          const rawNotifications = await runGh([
            "api",
            "notifications",
            "--method",
            "GET",
            "-f",
            "all=true",
            "-f",
            "participating=true",
            "-f",
            "per_page=50",
          ]);
          const rows = parseNotificationRows(rawNotifications);
          const { lookups, query } = buildGraphqlQuery(rows);
          const rawGraphql = await runGh(["api", "graphql", "-f", `query=${query}`]);
          if (
            typeof rawGraphql !== "object" ||
            rawGraphql === null ||
            !("data" in rawGraphql) ||
            typeof rawGraphql.data !== "object" ||
            rawGraphql.data === null
          ) {
            throw new Error("GitHub returned an invalid activity response.");
          }
          const projected = projectOwnedNotifications({
            data: rawGraphql.data as Record<string, unknown>,
            lookups,
            rows,
          });
          const payload = {
            fetchedAt: new Date().toISOString(),
            items: projected.items,
            login: projected.login,
          };
          cache = { payload, fetchedAtMs: Date.now() };
          return payload;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          bb.log.warn(`GitHub notification refresh failed: ${message}`);
          throw new Error(`${message} ${GH_HINT}`);
        }
      },
    });
    bb.log.info("GitHub Activity loaded");
  };
}

export default createGithubNotificationsPlugin(defaultGhRunner());
