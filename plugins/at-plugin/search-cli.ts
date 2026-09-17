import type { BbPluginApi } from "@get-bb/plugin-sdk";
import { type CatalogDetails, readCatalogDetails } from "./catalog-details";
import { COMMUNITY_MARKETPLACE, searchCommunityPlugins } from "./community-catalog";
import { type InstalledPluginRecord, searchInstalledPlugins } from "./installed-catalog";
import {
  decodeCommunityItemId, decodeInstalledItemId, normalizeUntrustedText, truncateUtf8,
} from "./mention-context";
import { isPluginBrowseQuery } from "./mention-query";
import { boundedSdkRead } from "./sdk-read";

const HELP = `Usage:
  bb at-plugin search [query] [--scope all|installed|community] [--limit 1..20] [--offset N] [--json]
  bb at-plugin show <plugin-id> [--json]

Search names, IDs, full descriptions, catalog metadata, and available overviews.
Results include overview text and screenshot/icon URLs when supplied by BB.
Images are references, not downloaded bytes. No install or invocation is performed.
`;

interface Options {
  command: "search" | "show";
  query: string;
  scope: "all" | "installed" | "community";
  limit: number;
  offset: number;
  json: boolean;
}

function parse(argv: string[]): Options {
  const [command, ...args] = argv;
  if (command !== "search" && command !== "show") throw new Error("Expected search or show.");
  const options: Options = { command, query: "", scope: "all", limit: 10, offset: 0, json: false };
  const words: string[] = [];
  for (let index = 0; index < args.length; index++) {
    const arg = args[index]!;
    if (arg === "--") { words.push(...args.slice(index + 1)); break; }
    if (arg === "--json") { options.json = true; continue; }
    if (arg === "--scope" || arg === "--limit" || arg === "--offset") {
      if (command === "show") throw new Error(`${arg} is only supported by search.`);
      const value = args[++index];
      if (arg === "--scope") {
        if (value !== "all" && value !== "installed" && value !== "community") {
          throw new Error("Scope must be all, installed, or community.");
        }
        options.scope = value;
      } else {
        const number = value === undefined || !/^\d+$/.test(value) ? NaN : Number(value);
        if (!Number.isSafeInteger(number) || number < (arg === "--limit" ? 1 : 0)
          || number > (arg === "--limit" ? 20 : 1_000_000)) {
          throw new Error(`Invalid ${arg}.`);
        }
        if (arg === "--limit") options.limit = number;
        else options.offset = number;
      }
    } else if (arg.startsWith("-")) throw new Error(`Unknown option: ${arg}`);
    else words.push(arg);
  }
  options.query = normalizeUntrustedText(words.join(" "));
  if (options.query.length > 512) throw new Error("Query must be at most 512 characters.");
  if (command === "show" && words.length !== 1) throw new Error("Show requires one exact plugin ID.");
  return options;
}

function imageUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

function detail(plugin: InstalledPluginRecord | null, entry?: CatalogDetails) {
  const description = plugin?.description ?? entry?.description ?? "";
  const overview = typeof entry?.overview === "string" ? entry.overview : null;
  const imageFields = (plugin ?? {}) as { screenshots?: string[] };
  const screenshots = (entry?.screenshots ?? imageFields.screenshots ?? [])
    .map(imageUrl).filter((url): url is string => url !== null).slice(0, 6);
  return {
    pluginId: plugin?.id ?? entry!.pluginId,
    name: truncateUtf8(plugin?.name ?? entry?.displayName ?? plugin!.id, 512),
    availability: plugin ? "installed" : "not-installed",
    description: truncateUtf8(description, 16_384),
    overview: overview === null ? null : truncateUtf8(overview, 16_384),
    textTruncated: Buffer.byteLength(description) > 16_384
      || (overview !== null && Buffer.byteLength(overview) > 16_384),
    screenshots,
    iconUrl: imageUrl(entry?.iconUrl ?? plugin?.iconUrl),
    marketplace: entry?.marketplace ?? null,
    entryId: entry?.entryId ?? null,
    category: entry?.category ?? null,
    cliCommand: plugin?.cliCommand ?? null,
    requiresInstallation: plugin === null,
  };
}

function installedEntry(plugin: InstalledPluginRecord, entries: CatalogDetails[]) {
  const candidates = entries.filter((entry) => entry.pluginId === plugin.id);
  if (plugin.catalogMarketplaceName && plugin.catalogEntryId) {
    return candidates.find((entry) => entry.marketplace === plugin.catalogMarketplaceName
      && entry.entryId === plugin.catalogEntryId);
  }
  return candidates.length === 1 ? candidates[0] : undefined;
}

export function registerSearchCli(bb: BbPluginApi): void {
  bb.cli.register({
    name: "at-plugin",
    summary: "Find plugins for a task; read full overviews and screenshot URLs",
    commands: [
      { name: "search", summary: "Search installed and Community plugins, including overviews",
        usage: "bb at-plugin search [query] [--scope all|installed|community] [--limit 1..20] [--offset N] [--json]" },
      { name: "show", summary: "Get plugin details, full overview, and screenshot/image URLs",
        usage: "bb at-plugin show <plugin-id> [--json]" },
    ],
    async run(argv, context) {
      if (argv.length === 0 || argv[0] === "help" || argv.includes("--help")) {
        return { exitCode: 0, stdout: HELP };
      }
      let options: Options;
      try { options = parse(argv); }
      catch (error) { return { exitCode: 2, stderr: `${(error as Error).message}\n${HELP}` }; }
      const query = options.command === "show" || isPluginBrowseQuery(options.query) ? "" : options.query;
      const [inventory, catalog] = await Promise.allSettled([
        boundedSdkRead((signal) => bb.sdk.plugins.list({ signal }), context.signal),
        boundedSdkRead((signal) => readCatalogDetails(bb, query, signal), context.signal),
      ]);
      if (context.signal?.aborted) return { exitCode: 1, stderr: "Plugin search cancelled.\n" };
      const warnings: string[] = [];
      if (inventory.status === "rejected") warnings.push("Installed plugins could not be read; results may be incomplete.");
      if (catalog.status === "rejected") warnings.push("Catalog details could not be read; overview search and Community results are unavailable.");
      if (inventory.status === "rejected" && catalog.status === "rejected") {
        return { exitCode: 1, stderr: `${warnings.join("\n")}\n` };
      }
      const plugins = inventory.status === "fulfilled" ? inventory.value.plugins : [];
      const entries = catalog.status === "fulfilled" ? catalog.value.entries : [];
      const matches = catalog.status === "fulfilled" ? catalog.value.matches : [];
      const installedIds = new Set(plugins.map((plugin) => plugin.id));
      const results: ReturnType<typeof detail>[] = [];
      if (options.scope !== "community") {
        const rows = searchInstalledPlugins(plugins, query, {
          limit: null, catalogMatches: new Set(matches.map((entry) => entry.pluginId)),
        });
        for (const row of rows) {
          const plugin = plugins.find((plugin) => plugin.id === decodeInstalledItemId(row.id).pluginId)!;
          results.push(detail(plugin, installedEntry(plugin, entries)));
        }
      }
      if (options.scope !== "installed") {
        const rows = searchCommunityPlugins(matches.filter((entry) => !installedIds.has(entry.pluginId)), query, null);
        for (const row of rows) {
          const identity = decodeCommunityItemId(row.id);
          const entry = matches.find((entry) => entry.marketplace === COMMUNITY_MARKETPLACE
            && entry.entryId === identity.entryId && entry.pluginId === identity.pluginId)!;
          results.push(detail(null, entry));
        }
      }
      if (options.command === "show") {
        const result = results.find((result) => result.pluginId === options.query);
        if (!result) return { exitCode: 1, stderr: "Plugin not found among enabled installed or compatible Community plugins.\n" };
        return { exitCode: 0, stdout: options.json
          ? `${JSON.stringify({ result, warnings }, null, 2)}\n`
          : `${render(result)}${warnings.map((warning) => `Warning: ${warning}\n`).join("")}` };
      }
      const page: typeof results = [];
      let bytes = 0;
      for (const result of results.slice(options.offset, options.offset + options.limit)) {
        const size = Buffer.byteLength(JSON.stringify(result, null, 2));
        if (bytes + size > 512_000) break;
        page.push(result);
        bytes += size;
      }
      const end = options.offset + page.length;
      const nextOffset = end < results.length ? end : null;
      const output = { query: options.query, results: page, total: results.length, nextOffset, warnings };
      return { exitCode: 0, stdout: options.json ? `${JSON.stringify(output, null, 2)}\n`
        : `${page.length ? page.map(render).join("\n") : "No plugins found.\n"}${nextOffset === null ? "" : `More results: repeat with --offset ${nextOffset}\n`}${warnings.map((warning) => `Warning: ${warning}\n`).join("")}` };
    },
  });
}

function render(result: ReturnType<typeof detail>): string {
  return [
    `${result.name} (${result.pluginId}) — ${result.availability}`,
    result.description,
    result.overview === null ? "Overview: not provided by BB." : `Overview:\n${result.overview}`,
    ...(result.iconUrl ? [`Icon: ${result.iconUrl}`] : []),
    ...result.screenshots.map((url) => `Screenshot: ${url}`),
    ...(result.textTruncated ? ["Text truncated to the CLI output limit."] : []),
    "",
  ].join("\n");
}
