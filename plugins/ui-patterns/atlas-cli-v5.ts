import {
  providerIndex,
  providerSnapshot,
} from "./providers/generated-v2.js";
import {
  findAtlasEntry,
  searchProviderIndex,
} from "./providers/search-v2.js";
import type {
  AtlasEntry,
  AtlasEntryDocument,
  ProviderRecord,
  ProviderSnapshot,
} from "./providers/schema.js";

type SourceRecord = ProviderRecord & { id: `${string}:${string}` };
type CliAtlasEntry = AtlasEntry & { id: AtlasEntryDocument["key"] };
type CliOptionName = "provider" | "limit";
type CliOptions = Partial<Record<CliOptionName, string>>;

export interface AtlasCliResult {
  exitCode: number;
  stdout?: string;
  stderr?: string;
}

export const cliSchemaVersion = "5";
export const cliEnvelopeVersion = "1";

export const cliCommandInfo = Object.freeze([
  Object.freeze({ name: "search", summary: "Search library-agnostic Atlas entries", usage: "ui-patterns search <terms> [--provider <id>] [--limit N] [--json]" }),
  Object.freeze({ name: "show", summary: "Show an Atlas entry from one source-native record ID", usage: "ui-patterns show <provider:native-id> [--json]" }),
  Object.freeze({ name: "list", summary: "List Atlas entries", usage: "ui-patterns list [--provider <id>] [--limit N] [--json]" }),
  Object.freeze({ name: "sources", summary: "Show the four approved upstream sources", usage: "ui-patterns sources [--provider <id>] [--json]" }),
  Object.freeze({ name: "status", summary: "Show generated Atlas status", usage: "ui-patterns status [--json]" }),
]);

class CliError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly exitCode = 2,
    readonly details: unknown = null,
  ) {
    super(message);
  }
}

const helpText = `UI Pattern Atlas CLI v5

Browse library-agnostic entries assembled from approved upstream sources.

Usage:
  ui-patterns <command> [options]

Commands:
${cliCommandInfo.map((command) => `  ${command.name.padEnd(12)} ${command.summary}\n               ${command.usage}`).join("\n")}

Global option:
  --json       Emit one deterministic, versioned JSON envelope
  -h, --help   Show help

Examples:
  ui-patterns search combobox --json
  ui-patterns show aria-apg:combobox --json
  ui-patterns list --provider base-ui --json
  ui-patterns sources --json
`;

const providers = providerSnapshot.providers;
const providerIds = providers.map(({ id }) => id);
const records: SourceRecord[] = providers.flatMap((provider) =>
  provider.records.map((record) => ({
    ...record,
    id: `${provider.id}:${record.nativeId}` as const,
  })),
);
const recordsById = new Map<string, SourceRecord>(
  records.map((record) => [record.id, record]),
);
const entries = providerIndex.documents;
const noOptions = new Set<CliOptionName>();
const providerOptions = new Set<CliOptionName>(["provider"]);
const providerLimitOptions = new Set<CliOptionName>(["provider", "limit"]);

function envelope<T>(command: string, data: T) {
  return { schemaVersion: cliSchemaVersion, envelopeVersion: cliEnvelopeVersion, command, data };
}

function jsonLine(value: unknown) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function parseOptions(
  tokens: readonly string[],
  allowed: ReadonlySet<CliOptionName>,
) {
  const options: CliOptions = {};
  const positionals: string[] = [];
  let help = false;
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === "--") {
      positionals.push(...tokens.slice(index + 1));
      break;
    }
    if (token === "-h" || token === "--help") {
      help = true;
      continue;
    }
    if (!token.startsWith("--")) {
      positionals.push(token);
      continue;
    }
    const separator = token.indexOf("=");
    const flag = separator >= 0 ? token.slice(2, separator) : token.slice(2);
    if (!allowed.has(flag as CliOptionName)) throw new CliError("unknown-option", `Unknown option --${flag}.`);
    const inlineValue = separator >= 0 ? token.slice(separator + 1) : undefined;
    const value = inlineValue === undefined ? tokens[index + 1] : inlineValue;
    if (value === undefined || (inlineValue === undefined && value.startsWith("--"))) {
      throw new CliError("missing-option-value", `Option --${flag} requires a value.`);
    }
    options[flag as CliOptionName] = value;
    if (inlineValue === undefined) index += 1;
  }
  return { help, options, positionals };
}

function filtersFromOptions(options: CliOptions, defaultLimit: number) {
  const provider = options.provider?.trim().toLocaleLowerCase() || null;
  if (provider && !providerIds.includes(provider)) {
    throw new CliError("unknown-provider", `Unknown provider “${options.provider}”.`, 2, {
      validProviders: providerIds,
    });
  }
  const limit = options.limit === undefined ? defaultLimit : Number(options.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > entries.length) {
    throw new CliError("invalid-limit", `Limit must be an integer from 1 to ${entries.length}.`);
  }
  return { provider, limit };
}

function withoutIndexFields(document: AtlasEntryDocument): AtlasEntry {
  const { key: _key, search: _search, ...entry } = document;
  return entry;
}

function entryResult(document: AtlasEntryDocument): CliAtlasEntry {
  return {
    id: document.key,
    ...withoutIndexFields(document),
  };
}

function sourceResult(provider: ProviderSnapshot) {
  return {
    id: provider.id,
    name: provider.name,
    homepage: provider.homepage,
    repository: provider.source.repository,
    revision: provider.source.revision,
    observedAt: provider.source.observedAt,
    sourcePaths: provider.source.sourcePaths,
    license: provider.license,
    build: provider.build,
    recordCount: provider.records.length,
  };
}

function humanRows(results: readonly CliAtlasEntry[]) {
  if (!results.length) return "No matching Atlas entries.\n";
  return `${results.map((entry, index) => `${index + 1}. ${entry.name} [${entry.id}]\n   ${entry.kind} · ${entry.sourceRecordIds.length} ${entry.sourceRecordIds.length === 1 ? "source" : "sources"} · ${entry.exampleCount} ${entry.exampleCount === 1 ? "example" : "examples"}${entry.summary ? `\n   ${entry.summary.text}` : ""}`).join("\n\n")}\n`;
}

function commandHelp(command: string) {
  const metadata = cliCommandInfo.find((item) => item.name === command);
  return metadata ? `${metadata.summary}\n\nUsage: ${metadata.usage}\n` : helpText;
}

export function runAtlasCli(argv: readonly string[]): AtlasCliResult {
  const json = argv.includes("--json");
  const args = argv.filter((argument) => argument !== "--json");
  const command = args[0];
  try {
    if (!command || command === "help" || command === "-h" || command === "--help") {
      return { exitCode: 0, stdout: json ? jsonLine(envelope("help", { status: "ok", help: helpText })) : helpText };
    }
    if (command === "search") {
      const parsed = parseOptions(args.slice(1), providerLimitOptions);
      if (parsed.help) return { exitCode: 0, stdout: json ? jsonLine(envelope(command, { status: "ok", help: commandHelp(command) })) : commandHelp(command) };
      const query = parsed.positionals.join(" ").trim();
      if (!query) throw new CliError("missing-query", "search requires one or more terms.");
      const filters = filtersFromOptions(parsed.options, 10);
      const search = searchProviderIndex(providerIndex, {
        query,
        providerId: filters.provider ?? undefined,
        limit: entries.length,
      });
      const results = search.results.slice(0, filters.limit).map(({ entry }) => entryResult(entry));
      const data = {
        status: "ok",
        query,
        filters: { provider: filters.provider },
        retrieval: { mode: search.mode, queryTerms: search.queryTerms },
        total: search.results.length,
        returned: results.length,
        results,
      };
      return { exitCode: 0, stdout: json ? jsonLine(envelope(command, data)) : `${search.results.length} ${search.results.length === 1 ? "match" : "matches"} for “${query}”\n\n${humanRows(results)}` };
    }
    if (command === "show") {
      const parsed = parseOptions(args.slice(1), noOptions);
      if (parsed.help) return { exitCode: 0, stdout: json ? jsonLine(envelope(command, { status: "ok", help: commandHelp(command) })) : commandHelp(command) };
      const target = parsed.positionals.join(" ").trim().toLocaleLowerCase();
      if (!target) throw new CliError("missing-id", "show requires a source-native record ID.");
      const record = recordsById.get(target);
      if (!record) {
        throw new CliError("unknown-source-record", `No source record matches “${target}”.`, 1, {
          suggestion: "Run search, then pass one returned sourceRecordId to show.",
        });
      }
      const document = findAtlasEntry(providerIndex, target);
      if (!document) throw new CliError("entry-not-generated", `No Atlas entry contains “${target}”.`, 1);
      const result = entryResult(document);
      const sourceRecords = result.sourceRecordIds
        .map((id) => recordsById.get(id))
        .filter((source): source is SourceRecord => Boolean(source));
      const data = { status: "ok", entry: result, sourceRecords };
      const human = `${result.name} [${result.id}]\n${result.kind} · ${result.sourceRecordIds.length} ${result.sourceRecordIds.length === 1 ? "source" : "sources"}\n${result.aliases.length ? `Also called ${result.aliases.join(", ")}\n` : ""}${result.summary ? `\n${result.summary.text}\n` : ""}\n${sourceRecords.map((source) => `${source.provenance.providerId}: ${source.canonicalUrl}`).join("\n")}\n`;
      return { exitCode: 0, stdout: json ? jsonLine(envelope(command, data)) : human };
    }
    if (command === "list") {
      const parsed = parseOptions(args.slice(1), providerLimitOptions);
      if (parsed.help) return { exitCode: 0, stdout: json ? jsonLine(envelope(command, { status: "ok", help: commandHelp(command) })) : commandHelp(command) };
      if (parsed.positionals.length) throw new CliError("unexpected-arguments", "list does not accept search terms; use search instead.");
      const filters = filtersFromOptions(parsed.options, entries.length);
      const matching = searchProviderIndex(providerIndex, {
        providerId: filters.provider ?? undefined,
        limit: entries.length,
      }).results;
      const results = matching.slice(0, filters.limit).map(({ entry }) => entryResult(entry));
      const data = { status: "ok", filters: { provider: filters.provider }, total: matching.length, returned: results.length, results };
      return { exitCode: 0, stdout: json ? jsonLine(envelope(command, data)) : `${results.length} ${results.length === 1 ? "entry" : "entries"}\n\n${humanRows(results)}` };
    }
    if (command === "sources") {
      const parsed = parseOptions(args.slice(1), providerOptions);
      if (parsed.help) return { exitCode: 0, stdout: json ? jsonLine(envelope(command, { status: "ok", help: commandHelp(command) })) : commandHelp(command) };
      if (parsed.positionals.length) throw new CliError("unexpected-arguments", "sources does not accept positional arguments.");
      const providerId = parsed.options.provider?.trim().toLocaleLowerCase();
      if (providerId && !providerIds.includes(providerId)) {
        throw new CliError("unknown-provider", `Unknown provider “${parsed.options.provider}”.`, 2, { validProviders: providerIds });
      }
      const sources = providers.filter(({ id }) => !providerId || id === providerId).map(sourceResult);
      const data = { status: "ok", sources };
      const human = `${sources.map((source) => `${source.name} [${source.id}]\n${source.homepage}\n${source.revision.slice(0, 7)} · ${source.recordCount} records\n${source.license.expression}`).join("\n\n")}\n`;
      return { exitCode: 0, stdout: json ? jsonLine(envelope(command, data)) : human };
    }
    if (command === "status") {
      const parsed = parseOptions(args.slice(1), noOptions);
      if (parsed.help) return { exitCode: 0, stdout: json ? jsonLine(envelope(command, { status: "ok", help: commandHelp(command) })) : commandHelp(command) };
      if (parsed.positionals.length) throw new CliError("unexpected-arguments", "status does not accept arguments.");
      const data = {
        status: "ready",
        snapshotSchemaVersion: providerSnapshot.schemaVersion,
        snapshotFingerprint: providerSnapshot.fingerprint,
        assembledAt: providerSnapshot.assembledAt,
        entryCount: providerSnapshot.entries.length,
        sourceRecordCount: records.length,
        providers: providers.map(sourceResult),
      };
      const human = `Atlas ready · ${data.entryCount} entries from ${data.sourceRecordCount} source records\n${data.providers.map((source) => `- ${source.id}: ${source.recordCount} records at ${source.revision.slice(0, 7)}`).join("\n")}\n`;
      return { exitCode: 0, stdout: json ? jsonLine(envelope(command, data)) : human };
    }
    throw new CliError("unknown-command", `Unknown command “${command}”.`);
  } catch (error) {
    const cliError = error instanceof CliError
      ? error
      : new CliError("internal-error", error instanceof Error ? error.message : "Unknown CLI error.", 1);
    const data = { status: "error", error: { code: cliError.code, message: cliError.message, details: cliError.details } };
    return {
      exitCode: cliError.exitCode,
      stderr: json ? jsonLine(envelope(command || "unknown", data)) : `Error: ${cliError.message}\nRun ui-patterns --help for usage.\n`,
    };
  }
}
