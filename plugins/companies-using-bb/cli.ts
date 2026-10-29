import { readFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";
import { cliCommand, defineCli, PluginCliError } from "@get-bb/plugin-sdk";
import { snapshotSchema } from "./model.js";
import type { SnapshotStore } from "./store.js";
import type { Updater } from "./updater.js";

export function createCli(store: SnapshotStore, updater: Updater, changed: () => void) {
  return defineCli({
    name: "companies-using-bb",
    summary: "Load the Companies using bb table",
    commands: {
      import: cliCommand({
        summary: "Replace the saved table with a snapshot file ({ version: 1, updatedAt, rows })",
        positionals: [{ name: "file", required: true, description: "JSON snapshot on the machine running the bb server" }],
        options: { json: { type: "boolean", description: "Emit machine-readable JSON" } },
        run: async ({ positionals, options }, ctx) => {
          if (updater.status().state === "updating") {
            throw new PluginCliError("An update is running.", { code: "busy", hint: "Retry when it finishes." });
          }
          const path = isAbsolute(positionals.file) ? positionals.file : resolve(ctx.cwd ?? process.cwd(), positionals.file);
          let data: unknown;
          try {
            data = JSON.parse(await readFile(path, "utf8"));
          } catch (error) {
            throw new PluginCliError(`Couldn't read ${positionals.file}: ${error instanceof Error ? error.message : String(error)}`, { code: "invalid_input" });
          }
          const parsed = snapshotSchema.safeParse(data);
          if (!parsed.success) {
            const issues = parsed.error.issues.slice(0, 5).map(issue => (issue.path.join(".") || "(root)") + ": " + issue.message);
            throw new PluginCliError("Not a valid snapshot: " + issues.join("; "), { code: "invalid_input" });
          }
          await store.write(parsed.data);
          changed();
          const result = {
            companies: parsed.data.rows.length,
            users: parsed.data.rows.reduce((sum, row) => sum + row.ppl.length, 0),
            updatedAt: parsed.data.updatedAt,
          };
          return {
            exitCode: 0,
            stdout: options.json ? JSON.stringify(result) : `Imported ${result.companies} companies and ${result.users} users (data from ${result.updatedAt}).`,
          };
        },
      }),
    },
  });
}
