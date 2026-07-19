// @ts-nocheck

import {
  legacyCandidatesFor,
  nativeEntries,
  providers,
} from "./atlas-compatibility.js";

export const cliSchemaVersion = "3";
export const cliEnvelopeVersion = "1";

export const cliCommandInfo = Object.freeze([
  Object.freeze({ name: "search", summary: "Search provider-native UI records", usage: "ui-patterns search <terms> [--provider <id>] [--type element|pattern] [--limit N] [--json]" }),
  Object.freeze({ name: "show", summary: "Show one provider-native record ID", usage: "ui-patterns show <provider:id> [--json]" }),
  Object.freeze({ name: "list", summary: "List provider-native records", usage: "ui-patterns list [--provider <id>] [--type element|pattern] [--limit N] [--json]" }),
  Object.freeze({ name: "sources", summary: "Show provider provenance and content policy", usage: "ui-patterns sources [--provider <id>] [--json]" }),
  Object.freeze({ name: "status", summary: "Show Atlas provider and compatibility status", usage: "ui-patterns status [--json]" }),
]);

class CliError extends Error {
  constructor(code, message, exitCode = 2, details = null) {
    super(message);
    this.code = code;
    this.exitCode = exitCode;
    this.details = details;
  }
}

const helpText = `Pattern Atlas CLI v3

Retrieve source-native UI records and their explicit provenance.

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
  ui-patterns list --provider aria-apg --json
  ui-patterns sources --json
  ui-patterns status --json
`;

function envelope(command, data) {
  return { schemaVersion: cliSchemaVersion, envelopeVersion: cliEnvelopeVersion, command, data };
}

function jsonLine(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function normalize(value) {
  return value
    .toLocaleLowerCase()
    .replace(/[/:_-]/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function editDistance(left, right) {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = Array(right.length + 1).fill(0);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    current[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length];
}

function entrySummary(entry) {
  return {
    id: entry.id,
    name: entry.name,
    aliases: [...entry.aliases],
    description: entry.description,
    recordType: entry.recordType,
    provider: entry.provider,
    canonicalUrl: entry.canonicalUrl,
    upstreamRevision: entry.upstreamRevision,
    retrievedAt: entry.retrievedAt,
    license: entry.license,
    contentMode: entry.contentMode,
    status: entry.status,
  };
}

function sourceSummary(provider) {
  return {
    provider: provider.provider,
    name: provider.name,
    canonicalUrl: provider.canonicalUrl,
    upstreamRevision: provider.upstreamRevision,
    retrievedAt: provider.retrievedAt,
    license: provider.license,
    contentMode: provider.contentMode,
    status: provider.status,
    recordCount: provider.recordCount,
  };
}

function rankEntries(query, filters) {
  const queryTerms = normalize(query);
  const candidates = nativeEntries.filter((entry) =>
    (!filters.provider || entry.provider === filters.provider) &&
    (filters.type === "all" || entry.recordType === filters.type),
  );
  const hits = candidates.map((entry) => {
    const fields = [
      ["id", entry.id, 1_000],
      ["name", entry.name, 900],
      ["aliases", entry.aliases.join(" "), 700],
      ["description", entry.description, 120],
    ];
    const matchedTerms = [];
    const unmatchedTerms = [];
    const matchedFields = new Set();
    const strategies = new Set();
    let score = 0;

    for (const term of queryTerms) {
      let best = null;
      for (const [field, value, weight] of fields) {
        for (const token of normalize(value)) {
          let strength = 0;
          let strategy = null;
          if (term === token) {
            strength = 1;
            strategy = "exact";
          } else if (term.length >= 3 && token.startsWith(term)) {
            strength = 0.82;
            strategy = "prefix";
          } else if (term.length >= 4 && token.length >= 4 && editDistance(term, token) <= 1) {
            strength = 0.68;
            strategy = "tolerant";
          }
          if (strategy && (!best || weight * strength > best.weight * best.strength)) {
            best = { field, weight, strength, strategy };
          }
        }
      }
      if (!best) {
        unmatchedTerms.push(term);
        continue;
      }
      matchedTerms.push(term);
      matchedFields.add(best.field);
      strategies.add(best.strategy);
      score += best.weight * best.strength;
    }

    return {
      entry,
      score,
      match: {
        matchedTerms,
        unmatchedTerms,
        fields: [...matchedFields].sort(),
        strategies: [...strategies].sort(),
      },
    };
  }).filter(({ score }) => score > 0);

  const mode = hits.some(({ match }) => match.unmatchedTerms.length === 0 && match.strategies.includes("exact"))
    ? "exact"
    : hits.some(({ match }) => match.strategies.includes("prefix") || match.strategies.includes("tolerant"))
      ? "tolerant"
      : "expanded";

  return {
    queryTerms,
    mode,
    hits: hits.sort((left, right) => right.score - left.score || left.entry.id.localeCompare(right.entry.id)),
  };
}

function parseOptions(tokens, allowed) {
  const options = {};
  const positionals = [];
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
    if (flag === "category") {
      throw new CliError(
        "atlas-v2-house-taxonomy-retired",
        "--category is retired in v3 because provider-native records do not use the Atlas house taxonomy.",
      );
    }
    if (flag === "context") {
      throw new CliError(
        "atlas-v2-context-retired",
        "--context is retired in v3; use --provider to bound a source-native inventory.",
      );
    }
    if (!allowed.has(flag)) throw new CliError("unknown-option", `Unknown option --${flag}.`);
    const inlineValue = separator >= 0 ? token.slice(separator + 1) : undefined;
    const value = inlineValue === undefined ? tokens[index + 1] : inlineValue;
    if (value === undefined || (inlineValue === undefined && value.startsWith("--"))) {
      throw new CliError("missing-option-value", `Option --${flag} requires a value.`);
    }
    options[flag] = value;
    if (inlineValue === undefined) index += 1;
  }
  return { help, options, positionals };
}

function filtersFromOptions(options, defaultLimit) {
  const notices = [];
  const provider = options.provider?.trim().toLocaleLowerCase() || null;
  if (provider && !providers.some((candidate) => candidate.provider === provider)) {
    throw new CliError("unknown-provider", `Unknown provider “${options.provider}”.`, 2, {
      validProviders: providers.map((candidate) => candidate.provider),
    });
  }
  let type = options.type?.trim().toLocaleLowerCase() || "all";
  if (type === "component") {
    type = "element";
    notices.push({
      code: "atlas-v2-component-type-deprecated",
      message: "--type component is accepted for this compatibility release and maps to the provider-native element type.",
    });
  }
  if (!["all", "element", "pattern"].includes(type)) {
    throw new CliError("unknown-type", `Unknown type “${options.type}”. Use element or pattern.`, 2, {
      validTypes: ["element", "pattern"],
    });
  }
  const limit = options.limit === undefined ? defaultLimit : Number(options.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > nativeEntries.length) {
    throw new CliError("invalid-limit", `Limit must be an integer from 1 to ${nativeEntries.length}.`);
  }
  return { provider, type, limit, notices };
}

function humanRows(results) {
  if (!results.length) return "No matching provider-native records.\n";
  return `${results.map((entry, index) => `${index + 1}. ${entry.name} [${entry.id}]\n   ${entry.provider} · ${entry.recordType}\n   ${entry.description}\n   ${entry.canonicalUrl}`).join("\n\n")}\n`;
}

function commandHelp(command) {
  const metadata = cliCommandInfo.find((item) => item.name === command);
  return metadata ? `${metadata.summary}\n\nUsage: ${metadata.usage}\n` : helpText;
}

function compatibilityResponse(command, legacyId, json) {
  const candidates = legacyCandidatesFor(legacyId).map(entrySummary);
  const data = {
    status: "deprecated",
    deprecation: {
      code: "atlas-v2-identity-retired",
      legacyId,
      message: "Legacy Atlas v2 identities do not select a provider. Choose one explicit provider-native candidate.",
    },
    candidates,
  };
  const human = `Deprecated legacy identity “${legacyId}”.\nChoose an explicit provider-native ID:\n${candidates.map((candidate) => `- ${candidate.id} — ${candidate.canonicalUrl}`).join("\n")}\n`;
  return { exitCode: 0, stdout: json ? jsonLine(envelope(command, data)) : human };
}

export function runAtlasCli(argv) {
  const json = argv.includes("--json");
  const args = argv.filter((argument) => argument !== "--json");
  const command = args[0];
  try {
    if (!command || command === "help" || command === "-h" || command === "--help") {
      return { exitCode: 0, stdout: json ? jsonLine(envelope("help", { status: "ok", help: helpText })) : helpText };
    }
    if (command === "search") {
      const parsed = parseOptions(args.slice(1), new Set(["provider", "type", "limit"]));
      if (parsed.help) return { exitCode: 0, stdout: json ? jsonLine(envelope(command, { status: "ok", help: commandHelp(command) })) : commandHelp(command) };
      const query = parsed.positionals.join(" ").trim();
      if (!query) throw new CliError("missing-query", "search requires one or more terms.");
      const filters = filtersFromOptions(parsed.options, 10);
      const search = rankEntries(query, filters);
      const results = search.hits.slice(0, filters.limit).map(({ entry, match }) => ({ ...entrySummary(entry), match }));
      const data = {
        status: "ok",
        query,
        filters: { provider: filters.provider, type: filters.type },
        retrieval: { mode: search.mode, queryTerms: search.queryTerms },
        compatibility: filters.notices,
        total: search.hits.length,
        returned: results.length,
        results,
      };
      return { exitCode: 0, stdout: json ? jsonLine(envelope(command, data)) : `${search.hits.length} ${search.hits.length === 1 ? "match" : "matches"} for “${query}”\n\n${humanRows(results)}` };
    }
    if (command === "show") {
      const parsed = parseOptions(args.slice(1), new Set());
      if (parsed.help) return { exitCode: 0, stdout: json ? jsonLine(envelope(command, { status: "ok", help: commandHelp(command) })) : commandHelp(command) };
      const target = parsed.positionals.join(" ").trim();
      if (!target) throw new CliError("missing-id", "show requires a provider-native record ID.");
      const legacyId = target.startsWith("entry/") ? target.slice("entry/".length) : target.includes(":") ? null : target;
      if (legacyId !== null) {
        if (legacyCandidatesFor(legacyId).length) return compatibilityResponse(command, legacyId, json);
        throw new CliError("unknown-legacy-id", `No provider-native candidates are registered for legacy identity “${legacyId}”.`, 1);
      }
      const entry = nativeEntries.find((candidate) => candidate.id === target.toLocaleLowerCase());
      if (!entry) {
        throw new CliError("unknown-provider-id", `No provider-native record matches “${target}”.`, 1, {
          suggestion: "Run search, then pass an explicit provider-native ID to show.",
        });
      }
      const result = entrySummary(entry);
      return {
        exitCode: 0,
        stdout: json
          ? jsonLine(envelope(command, { status: "ok", entry: result }))
          : `${result.name} [${result.id}]\n${result.provider} · ${result.recordType}\n\n${result.description}\n\n${result.canonicalUrl}\nRetrieved ${result.retrievedAt} · ${result.upstreamRevision}\n`,
      };
    }
    if (command === "list") {
      const parsed = parseOptions(args.slice(1), new Set(["provider", "type", "limit"]));
      if (parsed.help) return { exitCode: 0, stdout: json ? jsonLine(envelope(command, { status: "ok", help: commandHelp(command) })) : commandHelp(command) };
      if (parsed.positionals.length) throw new CliError("unexpected-arguments", "list does not accept search terms; use search instead.");
      const filters = filtersFromOptions(parsed.options, nativeEntries.length);
      const matchingEntries = nativeEntries
        .filter((entry) => (!filters.provider || entry.provider === filters.provider) && (filters.type === "all" || entry.recordType === filters.type));
      const results = matchingEntries.slice(0, filters.limit).map(entrySummary);
      const data = {
        status: "ok",
        filters: { provider: filters.provider, type: filters.type },
        compatibility: filters.notices,
        total: matchingEntries.length,
        returned: results.length,
        results,
      };
      return { exitCode: 0, stdout: json ? jsonLine(envelope(command, data)) : `${results.length} ${results.length === 1 ? "record" : "records"}\n\n${humanRows(results)}` };
    }
    if (command === "sources") {
      const parsed = parseOptions(args.slice(1), new Set(["provider"]));
      if (parsed.help) return { exitCode: 0, stdout: json ? jsonLine(envelope(command, { status: "ok", help: commandHelp(command) })) : commandHelp(command) };
      if (parsed.positionals.length) throw new CliError("unexpected-arguments", "sources does not accept positional arguments.");
      const provider = parsed.options.provider?.trim().toLocaleLowerCase();
      if (provider && !providers.some((candidate) => candidate.provider === provider)) {
        throw new CliError("unknown-provider", `Unknown provider “${parsed.options.provider}”.`, 2, {
          validProviders: providers.map((candidate) => candidate.provider),
        });
      }
      const sources = providers.filter((candidate) => !provider || candidate.provider === provider).map(sourceSummary);
      const data = { status: "ok", sources };
      const human = `${sources.map((source) => `${source.name} [${source.provider}]\n${source.canonicalUrl}\n${source.upstreamRevision} · retrieved ${source.retrievedAt}\n${source.license.name} · ${source.contentMode}`).join("\n\n")}\n`;
      return { exitCode: 0, stdout: json ? jsonLine(envelope(command, data)) : human };
    }
    if (command === "status") {
      const parsed = parseOptions(args.slice(1), new Set());
      if (parsed.help) return { exitCode: 0, stdout: json ? jsonLine(envelope(command, { status: "ok", help: commandHelp(command) })) : commandHelp(command) };
      if (parsed.positionals.length) throw new CliError("unexpected-arguments", "status does not accept arguments.");
      const sourceStatus = providers.map(sourceSummary);
      const data = {
        status: "ready",
        compatibilityRelease: "atlas-v3",
        recordCount: nativeEntries.length,
        providers: sourceStatus,
        legacyIdentityPolicy: "Legacy v2 identities return a deprecation and provider candidates; they never select a preferred provider.",
      };
      const human = `Atlas v3 ready · ${nativeEntries.length} provider-native records\n${sourceStatus.map((source) => `- ${source.provider}: ${source.status} (${source.recordCount} records; retrieved ${source.retrievedAt})`).join("\n")}\n`;
      return { exitCode: 0, stdout: json ? jsonLine(envelope(command, data)) : human };
    }
    throw new CliError("unknown-command", `Unknown command “${command}”.`);
  } catch (error) {
    const cliError = error instanceof CliError
      ? error
      : new CliError("internal-error", error instanceof Error ? error.message : "Unknown CLI error.", 1);
    const data = {
      status: "error",
      error: { code: cliError.code, message: cliError.message, details: cliError.details },
    };
    return {
      exitCode: cliError.exitCode,
      stderr: json ? jsonLine(envelope(command || "unknown", data)) : `Error: ${cliError.message}\nRun ui-patterns --help for usage.\n`,
    };
  }
}
