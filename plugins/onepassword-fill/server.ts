import { setTimeout as delay } from "node:timers/promises";
import {
  cliCommand,
  defineCli,
  PluginCliError,
  type BbPluginApi,
  type PluginCliContext,
} from "@get-bb/plugin-sdk";
import { z } from "zod";
import {
  HINTS,
  signIn,
  type AuditEntry,
  type SignInCode,
  type SignInDeps,
  type SignInRequest,
} from "./signin.js";
import {
  openOnePassword,
  readServiceAccountToken,
  type FillField,
  type VaultReader,
} from "./vault.js";

const VERSION = "0.1.0";
const FIELDS = ["username", "password", "otp"] as const;
export const DEFAULT_TOKEN_FILE = "~/.config/bb/onepassword-fill.env";
const INSTRUCTIONS =
  "Agent Sign-in: never ask the user for a password, one-time code, or 1Password token, and never type one yourself. To sign in through a Browser Automation session, use the onepassword_fill tool (or `bb 1password fill`) for username, password, and otp. If it reports item_not_found or field_missing, ask the user to add that login to the Agents vault. Load the agent-sign-in skill first.";

const MIGRATIONS = [
  `CREATE TABLE fills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    at TEXT NOT NULL,
    thread_id TEXT NOT NULL,
    item TEXT NOT NULL,
    field TEXT NOT NULL,
    origin TEXT,
    result TEXT NOT NULL
  )`,
];

const auditRow = z.object({
  at: z.string(),
  thread_id: z.string(),
  item: z.string(),
  field: z.string(),
  origin: z.string().nullable(),
  result: z.string(),
});

export interface PluginOverrides {
  open?: (token: string) => Promise<VaultReader>;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
}

export function createPlugin(overrides: PluginOverrides = {}) {
  return function plugin(bb: BbPluginApi): void {
    const settings = bb.settings.define({
      enabled: {
        type: "boolean",
        label: "Let agents fill sign-ins",
        description:
          "Kill switch. While off, every fill is refused and logged. Turn on only after the vault and service account are set up.",
        default: false,
      },
      vaultName: {
        type: "string",
        label: "Vault",
        description: "The only 1Password vault fills read from.",
        default: "Agents",
      },
      tokenFile: {
        type: "string",
        label: "Service account token file",
        description:
          "Dotenv file with OP_SERVICE_ACCOUNT_TOKEN, created by `bb secret request` with mode 0600. Read at fill time.",
        default: DEFAULT_TOKEN_FILE,
      },
    });
    const db = bb.storage.database();
    bb.storage.migrate(db, MIGRATIONS);
    const insert = db.prepare(
      "INSERT INTO fills (at, thread_id, item, field, origin, result) VALUES (?, ?, ?, ?, ?, ?)",
    );
    const recent = db.prepare(
      "SELECT at, thread_id, item, field, origin, result FROM fills ORDER BY id DESC LIMIT ?",
    );
    const now = overrides.now ?? Date.now;
    const deps: SignInDeps = {
      enabled: async () => (await settings.get()).enabled,
      vaultName: async () => (await settings.get()).vaultName,
      token: async () => readServiceAccountToken((await settings.get()).tokenFile),
      open: overrides.open ?? ((token) => openOnePassword(token, VERSION)),
      browser: {
        call: (method, input) =>
          bb.sdk.plugins.callRpc({
            pluginId: "browser-automation",
            method,
            input: JSON.parse(JSON.stringify(input)),
            outputSchema: z.unknown(),
          }),
      },
      audit(entry: AuditEntry) {
        insert.run(
          new Date(now()).toISOString(),
          entry.threadId,
          entry.item,
          entry.field,
          entry.origin,
          entry.result,
        );
      },
      now,
      sleep: overrides.sleep ?? ((ms) => delay(ms)),
    };
    const fill = (request: SignInRequest) => signIn(deps, request);
    const report = (code: SignInCode) =>
      code === "ok"
        ? { ok: true as const }
        : { ok: false as const, error: code, hint: HINTS[code] };

    bb.agents.registerTool({
      name: "onepassword_fill",
      description:
        "Type a username, password, or current one-time code from the user's 1Password Agents vault into a Browser Automation page. Returns only ok or an error code; the value is never shown.",
      instructions:
        "Use for every sign-in field instead of asking the user for a password or code.",
      parameters: z.object({
        sessionId: z.string().uuid().describe("Browser Automation session ID from this thread"),
        item: z.string().min(1).max(200).describe("Exact title of the login in the vault"),
        field: z.enum(FIELDS),
        selector: z.string().min(1).max(1_000).describe("CSS selector of the input on the page"),
        page: z.string().min(1).max(120).default("main").describe("DevBrowser page name"),
      }),
      async execute(input, context) {
        return JSON.stringify(report(await fill({ ...input, threadId: context.threadId })));
      },
    });
    bb.agents.configure(() => ({
      tools: ["onepassword_fill"],
      skills: ["agent-sign-in"],
      instructions: INSTRUCTIONS,
    }));

    const threadOf = (option: string | undefined, ctx: PluginCliContext) => {
      const threadId = option ?? ctx.threadId;
      if (!threadId)
        throw new PluginCliError("Run this from a thread or pass --thread.", {
          code: "missing_thread",
        });
      return threadId;
    };
    bb.cli.register(
      defineCli({
        name: "1password",
        summary: "Sign agents in with logins from a 1Password vault, without revealing them",
        commands: {
          fill: cliCommand({
            summary:
              "Type one field of a vault login into a Browser Automation page; prints only ok or an error code",
            options: {
              session: { type: "string", required: true, description: "Browser Automation session ID" },
              item: { type: "string", required: true, description: "Exact title of the login in the vault" },
              field: { type: "enum", values: FIELDS, required: true, description: "username, password, or otp" },
              selector: { type: "string", required: true, description: "CSS selector of the input" },
              page: { type: "string", description: "DevBrowser page name (default main)" },
              thread: { type: "string", description: "Thread that owns the session (default: this thread)" },
              json: { type: "boolean", description: "Print the result as JSON" },
            },
            run: async ({ options }, ctx) => {
              const result = report(
                await fill({
                  threadId: threadOf(options.thread, ctx),
                  sessionId: options.session,
                  page: options.page ?? "main",
                  selector: options.selector,
                  item: options.item,
                  field: options.field as FillField,
                }),
              );
              if (options.json)
                return { exitCode: result.ok ? 0 : 1, stdout: JSON.stringify(result) };
              if (result.ok) return { exitCode: 0, stdout: "ok" };
              return { exitCode: 1, stdout: "", stderr: `${result.error}: ${result.hint}` };
            },
          }),
          log: cliCommand({
            summary: "Show recent fills: time, thread, item, field, origin, and result (never values)",
            options: {
              limit: { type: "integer", min: 1, max: 500, description: "Entries to show (default 50)" },
              json: { type: "boolean", description: "Print the entries as JSON" },
            },
            run: async ({ options }) => {
              const entries = z
                .array(auditRow)
                .parse(recent.all(options.limit ?? 50))
                .map((row) => ({
                  at: row.at,
                  threadId: row.thread_id,
                  item: row.item,
                  field: row.field,
                  origin: row.origin,
                  result: row.result,
                }));
              if (options.json) return { exitCode: 0, stdout: JSON.stringify(entries) };
              return {
                exitCode: 0,
                stdout: entries.length
                  ? entries
                      .map((entry) =>
                        [entry.at, entry.threadId, entry.item, entry.field, entry.origin ?? "-", entry.result].join("  "),
                      )
                      .join("\n")
                  : "No fills yet.",
              };
            },
          }),
        },
      }),
    );
  };
}

export default createPlugin();
