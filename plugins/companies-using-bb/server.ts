import { join } from "node:path";
import type { BbPluginApi } from "@get-bb/plugin-sdk";
import { parseCensus, type CensusEntry } from "./census.js";
import { createCli } from "./cli.js";
import { contract } from "./contract.js";
import { createDiscordApi, fetchDiscord, type DiscordCursor } from "./discord.js";
import { fetchGithub, fetchProfiles, ghApi, listRepositories } from "./github.js";
import type { Snapshot } from "./model.js";
import { missedScheduledRun, UPDATE_CRON } from "./schedule.js";
import { STATE_CHANGED } from "./signals.js";
import { createSnapshotStore } from "./store.js";
import { readProfiles } from "./update.js";
import { createUpdater } from "./updater.js";

export default function plugin(bb: BbPluginApi): void {
  const settings = bb.settings.define({
    discordBotToken: { type: "string", label: "Discord bot token", description: "Read-only bot in the community server. Without it, Discord counts keep their last values.", secret: true },
    discordGuildId: { type: "string", label: "Discord server ID", default: "" },
    censusHostId: { type: "string", label: "Census machine", description: "Host ID of the machine holding the census note.", default: "" },
    censusPath: { type: "string", label: "Census note path", description: "Absolute path to the Markdown note that maps people to employers.", default: "" },
    githubRepositories: { type: "string", label: "GitHub repositories", description: "Comma-separated owner/name, or owner/* for every public repository.", default: "get-bb/*" },
  });

  const lifetime = new AbortController();
  bb.onDispose(() => lifetime.abort());
  const store = createSnapshotStore(() => join(bb.server.experimental_dataDir, "plugins", bb.pluginId));
  const changed = () => bb.realtime.publish(STATE_CHANGED, {});

  async function readDiscord(previous: Snapshot, signal: AbortSignal): Promise<DiscordCursor | null> {
    const { discordBotToken, discordGuildId } = await settings.get();
    if (!discordBotToken || !discordGuildId) {
      bb.log.info("Discord isn't set up; Discord counts keep their last values.");
      return null;
    }
    try {
      const result = await fetchDiscord(createDiscordApi(discordBotToken), discordGuildId, previous.cursors?.discord, new Date(), signal);
      if (result.failures.length) bb.log.warn(`Discord: ${result.failures.length} channels or threads couldn't be read; they'll be retried next update.`);
      return result.cursor;
    } catch (error) {
      if (signal.aborted) throw error;
      bb.log.warn(`Discord couldn't be read; Discord counts keep their last values. ${error instanceof Error ? error.message : ""}`);
      return null;
    }
  }

  async function readCensus(signal: AbortSignal): Promise<CensusEntry[] | null> {
    const { censusHostId, censusPath } = await settings.get();
    if (!censusHostId || !censusPath) return null;
    try {
      const file = await bb.sdk.files.read({ hostId: censusHostId, path: censusPath, signal });
      if (file.contentEncoding !== "utf8") throw new Error("the census note isn't text");
      return parseCensus(file.content);
    } catch (error) {
      if (signal.aborted) throw error;
      bb.log.warn(`The census couldn't be read; no new people are added this update. ${error instanceof Error ? error.message : ""}`);
      return null;
    }
  }

  const updater = createUpdater({
    store,
    signal: lifetime.signal,
    onChange: changed,
    log: bb.log,
    async loadSources(previous, signal) {
      const { githubRepositories } = await settings.get();
      const repos = await listRepositories(ghApi, githubRepositories, signal);
      const issues = await fetchGithub(ghApi, repos, previous.cursors?.github, signal);
      const [discord, census] = [await readDiscord(previous, signal), await readCensus(signal)];
      const github = await readProfiles(previous, issues, census, (logins, cursor) => fetchProfiles(ghApi, logins, cursor, new Date(), signal));
      return { github, discord, census };
    },
  });

  bb.rpc.register(contract, {
    getState: async () => {
      let saved: Snapshot | null = null;
      try {
        saved = await store.read();
      } catch (error) {
        bb.log.warn(error instanceof Error ? error.message : String(error));
      }
      return { snapshot: saved && { updatedAt: saved.updatedAt, rows: saved.rows }, status: updater.status() };
    },
    refresh: () => {
      void updater.run();
      return updater.status();
    },
  });

  bb.cli.register(createCli(store, updater, changed));

  bb.background.schedule("daily-update", UPDATE_CRON, async () => {
    await updater.run();
    const status = updater.status();
    if (status.state === "failed") throw new Error(status.error ?? "Update failed");
  });
  bb.background.service("startup-catch-up", {
    async start(signal) {
      const saved = await store.read().catch(() => null);
      if (saved && missedScheduledRun(saved.updatedAt, new Date())) void updater.run();
      if (!signal.aborted) await new Promise(resolve => signal.addEventListener("abort", resolve, { once: true }));
    },
  });
}
