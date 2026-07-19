import { createRequire as __createRequire } from "node:module";
import { dirname as __pathDirname } from "node:path";
import { fileURLToPath as __fileURLToPath } from "node:url";
const require = __createRequire(import.meta.url);
var __filename = __fileURLToPath(import.meta.url);
var __dirname = __pathDirname(__filename);

// atlas-compatibility.js
var retrievedAt = "2026-07-17T00:00:00.000Z";
var w3cDocumentLicense = Object.freeze({
  name: "W3C Document License",
  url: "https://www.w3.org/copyright/document-license/"
});
var providerDefinitions = Object.freeze({
  "aria-apg": Object.freeze({
    provider: "aria-apg",
    name: "WAI-ARIA Authoring Practices Guide",
    canonicalUrl: "https://www.w3.org/WAI/ARIA/apg/",
    upstreamRevision: "WAI-ARIA APG snapshot 2026-07-17",
    retrievedAt,
    license: w3cDocumentLicense,
    contentMode: "terms-and-paraphrase",
    status: "available"
  }),
  html: Object.freeze({
    provider: "html",
    name: "HTML Living Standard",
    canonicalUrl: "https://html.spec.whatwg.org/",
    upstreamRevision: "WHATWG Living Standard snapshot 2026-07-17",
    retrievedAt,
    license: w3cDocumentLicense,
    contentMode: "terms-and-paraphrase",
    status: "available"
  })
});
function sourceEntry({
  provider,
  sourceId,
  name,
  aliases = [],
  description,
  canonicalUrl,
  recordType,
  legacyIds = []
}) {
  const source = providerDefinitions[provider];
  return Object.freeze({
    id: `${provider}:${sourceId}`,
    provider,
    sourceId,
    name,
    aliases: Object.freeze([...aliases]),
    description,
    recordType,
    canonicalUrl,
    upstreamRevision: source.upstreamRevision,
    retrievedAt: source.retrievedAt,
    license: source.license,
    contentMode: source.contentMode,
    status: source.status,
    legacyIds: Object.freeze([...legacyIds])
  });
}
var apg = (sourceId, name, aliases, description, legacyIds = [sourceId]) => sourceEntry({
  provider: "aria-apg",
  sourceId,
  name,
  aliases,
  description,
  recordType: "pattern",
  canonicalUrl: `https://www.w3.org/WAI/ARIA/apg/patterns/${sourceId}/`,
  legacyIds
});
var html = (sourceId, name, aliases, description, anchor, legacyIds = [sourceId]) => sourceEntry({
  provider: "html",
  sourceId,
  name,
  aliases,
  description,
  recordType: "element",
  canonicalUrl: `https://html.spec.whatwg.org/multipage/${anchor}`,
  legacyIds
});
var nativeEntries = Object.freeze([
  apg("alert", "Alert", [], "A non-modal live region for important, time-sensitive information."),
  apg("alertdialog", "Alert dialog", ["alert dialog"], "A modal dialog that interrupts work for an acknowledgement or decision.", ["alert-dialog"]),
  apg("button", "Button", ["button widget"], "A custom button pattern with its required keyboard and state behavior."),
  apg("checkbox", "Checkbox", [], "A checkable control pattern for independent binary choices."),
  apg("combobox", "Combobox", ["autocomplete", "editable select"], "A composite input that combines text entry or selection with a related popup."),
  apg("dialog-modal", "Modal dialog", ["modal dialog"], "A dialog pattern that makes content outside the dialog inert while it is open.", ["dialog"]),
  apg("grid", "Grid", ["data grid"], "A composite widget pattern for a two-dimensional collection of interactive cells.", ["data-grid"]),
  apg("link", "Link", [], "A custom link pattern for navigation to another resource or location."),
  apg("listbox", "Listbox", [], "A list of options with a selected value or values."),
  apg("menu-button", "Menu button", [], "A button that opens a menu of actions or choices."),
  apg("menubar", "Menu and menubar", ["menu", "menubar"], "A menu pattern for commands and a persistent menubar pattern for grouped menus.", ["menu"]),
  apg("radio", "Radio group", ["radio buttons"], "A group of mutually exclusive choices represented by radio controls.", ["radio-group"]),
  apg("slider", "Slider", [], "A control pattern for choosing a value from a continuous or discrete range."),
  apg("spinbutton", "Spinbutton", ["number input"], "A text input pattern for numeric values with increment and decrement controls."),
  apg("switch", "Switch", [], "A binary on-or-off control pattern."),
  apg("tabs", "Tabs", [], "A set of related panels with one tab selected at a time."),
  apg("toolbar", "Toolbar", [], "A grouped set of controls for a shared context."),
  apg("tooltip", "Tooltip", [], "A non-modal popup that provides supplemental descriptive text for a control."),
  apg("treegrid", "Treegrid", [], "A hierarchical grid pattern with rows, columns, and expandable items."),
  apg("treeview", "Tree view", ["tree"], "A hierarchical collection of expandable and selectable items.", ["tree-view"]),
  html("a", "a element", ["anchor", "link element"], "The native hyperlink element.", "text-level-semantics.html#the-a-element", ["link"]),
  html("button", "button element", ["native button"], "The native element for an actionable button.", "form-elements.html#the-button-element", ["button"]),
  html("input", "input element", ["text input"], "The native single-control form element with type-specific behavior.", "input.html#the-input-element", ["text-field"]),
  html("select", "select element", ["native select", "dropdown"], "The native control for selecting one or more options.", "form-elements.html#the-select-element", ["select"]),
  html("textarea", "textarea element", ["text area"], "The native multi-line plain-text input element.", "form-elements.html#the-textarea-element", ["text-area"])
].sort((left, right) => left.id.localeCompare(right.id)));
var providerRecordCounts = /* @__PURE__ */ new Map();
for (const entry of nativeEntries) {
  providerRecordCounts.set(entry.provider, (providerRecordCounts.get(entry.provider) ?? 0) + 1);
}
var providers = Object.freeze(
  Object.values(providerDefinitions).map((provider) => Object.freeze({
    ...provider,
    recordCount: providerRecordCounts.get(provider.provider) ?? 0
  })).sort((left, right) => left.provider.localeCompare(right.provider))
);
function legacyCandidatesFor(target) {
  const legacyId = target.trim().toLocaleLowerCase();
  return nativeEntries.filter((entry) => entry.legacyIds.includes(legacyId));
}

// atlas-cli-v3.js
var cliSchemaVersion = "3";
var cliEnvelopeVersion = "1";
var cliCommandInfo = Object.freeze([
  Object.freeze({ name: "search", summary: "Search provider-native UI records", usage: "ui-patterns search <terms> [--provider <id>] [--type element|pattern] [--limit N] [--json]" }),
  Object.freeze({ name: "show", summary: "Show one provider-native record ID", usage: "ui-patterns show <provider:id> [--json]" }),
  Object.freeze({ name: "list", summary: "List provider-native records", usage: "ui-patterns list [--provider <id>] [--type element|pattern] [--limit N] [--json]" }),
  Object.freeze({ name: "sources", summary: "Show provider provenance and content policy", usage: "ui-patterns sources [--provider <id>] [--json]" }),
  Object.freeze({ name: "status", summary: "Show Atlas provider and compatibility status", usage: "ui-patterns status [--json]" })
]);
var CliError = class extends Error {
  constructor(code, message, exitCode = 2, details = null) {
    super(message);
    this.code = code;
    this.exitCode = exitCode;
    this.details = details;
  }
};
var helpText = `Pattern Atlas CLI v3

Retrieve source-native UI records and their explicit provenance.

Usage:
  ui-patterns <command> [options]

Commands:
${cliCommandInfo.map((command) => `  ${command.name.padEnd(12)} ${command.summary}
               ${command.usage}`).join("\n")}

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
  return `${JSON.stringify(value, null, 2)}
`;
}
function normalize(value) {
  return value.toLocaleLowerCase().replace(/[/:_-]/g, " ").replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
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
        previous[rightIndex - 1] + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1)
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
    status: entry.status
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
    recordCount: provider.recordCount
  };
}
function rankEntries(query, filters) {
  const queryTerms = normalize(query);
  const candidates = nativeEntries.filter(
    (entry) => (!filters.provider || entry.provider === filters.provider) && (filters.type === "all" || entry.recordType === filters.type)
  );
  const hits = candidates.map((entry) => {
    const fields = [
      ["id", entry.id, 1e3],
      ["name", entry.name, 900],
      ["aliases", entry.aliases.join(" "), 700],
      ["description", entry.description, 120]
    ];
    const matchedTerms = [];
    const unmatchedTerms = [];
    const matchedFields = /* @__PURE__ */ new Set();
    const strategies = /* @__PURE__ */ new Set();
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
        strategies: [...strategies].sort()
      }
    };
  }).filter(({ score }) => score > 0);
  const mode = hits.some(({ match }) => match.unmatchedTerms.length === 0 && match.strategies.includes("exact")) ? "exact" : hits.some(({ match }) => match.strategies.includes("prefix") || match.strategies.includes("tolerant")) ? "tolerant" : "expanded";
  return {
    queryTerms,
    mode,
    hits: hits.sort((left, right) => right.score - left.score || left.entry.id.localeCompare(right.entry.id))
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
        "--category is retired in v3 because provider-native records do not use the Atlas house taxonomy."
      );
    }
    if (flag === "context") {
      throw new CliError(
        "atlas-v2-context-retired",
        "--context is retired in v3; use --provider to bound a source-native inventory."
      );
    }
    if (!allowed.has(flag)) throw new CliError("unknown-option", `Unknown option --${flag}.`);
    const inlineValue = separator >= 0 ? token.slice(separator + 1) : void 0;
    const value = inlineValue === void 0 ? tokens[index + 1] : inlineValue;
    if (value === void 0 || inlineValue === void 0 && value.startsWith("--")) {
      throw new CliError("missing-option-value", `Option --${flag} requires a value.`);
    }
    options[flag] = value;
    if (inlineValue === void 0) index += 1;
  }
  return { help, options, positionals };
}
function filtersFromOptions(options, defaultLimit) {
  const notices = [];
  const provider = options.provider?.trim().toLocaleLowerCase() || null;
  if (provider && !providers.some((candidate) => candidate.provider === provider)) {
    throw new CliError("unknown-provider", `Unknown provider \u201C${options.provider}\u201D.`, 2, {
      validProviders: providers.map((candidate) => candidate.provider)
    });
  }
  let type = options.type?.trim().toLocaleLowerCase() || "all";
  if (type === "component") {
    type = "element";
    notices.push({
      code: "atlas-v2-component-type-deprecated",
      message: "--type component is accepted for this compatibility release and maps to the provider-native element type."
    });
  }
  if (!["all", "element", "pattern"].includes(type)) {
    throw new CliError("unknown-type", `Unknown type \u201C${options.type}\u201D. Use element or pattern.`, 2, {
      validTypes: ["element", "pattern"]
    });
  }
  const limit = options.limit === void 0 ? defaultLimit : Number(options.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > nativeEntries.length) {
    throw new CliError("invalid-limit", `Limit must be an integer from 1 to ${nativeEntries.length}.`);
  }
  return { provider, type, limit, notices };
}
function humanRows(results) {
  if (!results.length) return "No matching provider-native records.\n";
  return `${results.map((entry, index) => `${index + 1}. ${entry.name} [${entry.id}]
   ${entry.provider} \xB7 ${entry.recordType}
   ${entry.description}
   ${entry.canonicalUrl}`).join("\n\n")}
`;
}
function commandHelp(command) {
  const metadata = cliCommandInfo.find((item) => item.name === command);
  return metadata ? `${metadata.summary}

Usage: ${metadata.usage}
` : helpText;
}
function compatibilityResponse(command, legacyId, json) {
  const candidates = legacyCandidatesFor(legacyId).map(entrySummary);
  const data = {
    status: "deprecated",
    deprecation: {
      code: "atlas-v2-identity-retired",
      legacyId,
      message: "Legacy Atlas v2 identities do not select a provider. Choose one explicit provider-native candidate."
    },
    candidates
  };
  const human = `Deprecated legacy identity \u201C${legacyId}\u201D.
Choose an explicit provider-native ID:
${candidates.map((candidate) => `- ${candidate.id} \u2014 ${candidate.canonicalUrl}`).join("\n")}
`;
  return { exitCode: 0, stdout: json ? jsonLine(envelope(command, data)) : human };
}
function runAtlasCli(argv) {
  const json = argv.includes("--json");
  const args = argv.filter((argument) => argument !== "--json");
  const command = args[0];
  try {
    if (!command || command === "help" || command === "-h" || command === "--help") {
      return { exitCode: 0, stdout: json ? jsonLine(envelope("help", { status: "ok", help: helpText })) : helpText };
    }
    if (command === "search") {
      const parsed = parseOptions(args.slice(1), /* @__PURE__ */ new Set(["provider", "type", "limit"]));
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
        results
      };
      return { exitCode: 0, stdout: json ? jsonLine(envelope(command, data)) : `${search.hits.length} ${search.hits.length === 1 ? "match" : "matches"} for \u201C${query}\u201D

${humanRows(results)}` };
    }
    if (command === "show") {
      const parsed = parseOptions(args.slice(1), /* @__PURE__ */ new Set());
      if (parsed.help) return { exitCode: 0, stdout: json ? jsonLine(envelope(command, { status: "ok", help: commandHelp(command) })) : commandHelp(command) };
      const target = parsed.positionals.join(" ").trim();
      if (!target) throw new CliError("missing-id", "show requires a provider-native record ID.");
      const legacyId = target.startsWith("entry/") ? target.slice("entry/".length) : target.includes(":") ? null : target;
      if (legacyId !== null) {
        if (legacyCandidatesFor(legacyId).length) return compatibilityResponse(command, legacyId, json);
        throw new CliError("unknown-legacy-id", `No provider-native candidates are registered for legacy identity \u201C${legacyId}\u201D.`, 1);
      }
      const entry = nativeEntries.find((candidate) => candidate.id === target.toLocaleLowerCase());
      if (!entry) {
        throw new CliError("unknown-provider-id", `No provider-native record matches \u201C${target}\u201D.`, 1, {
          suggestion: "Run search, then pass an explicit provider-native ID to show."
        });
      }
      const result = entrySummary(entry);
      return {
        exitCode: 0,
        stdout: json ? jsonLine(envelope(command, { status: "ok", entry: result })) : `${result.name} [${result.id}]
${result.provider} \xB7 ${result.recordType}

${result.description}

${result.canonicalUrl}
Retrieved ${result.retrievedAt} \xB7 ${result.upstreamRevision}
`
      };
    }
    if (command === "list") {
      const parsed = parseOptions(args.slice(1), /* @__PURE__ */ new Set(["provider", "type", "limit"]));
      if (parsed.help) return { exitCode: 0, stdout: json ? jsonLine(envelope(command, { status: "ok", help: commandHelp(command) })) : commandHelp(command) };
      if (parsed.positionals.length) throw new CliError("unexpected-arguments", "list does not accept search terms; use search instead.");
      const filters = filtersFromOptions(parsed.options, nativeEntries.length);
      const matchingEntries = nativeEntries.filter((entry) => (!filters.provider || entry.provider === filters.provider) && (filters.type === "all" || entry.recordType === filters.type));
      const results = matchingEntries.slice(0, filters.limit).map(entrySummary);
      const data = {
        status: "ok",
        filters: { provider: filters.provider, type: filters.type },
        compatibility: filters.notices,
        total: matchingEntries.length,
        returned: results.length,
        results
      };
      return { exitCode: 0, stdout: json ? jsonLine(envelope(command, data)) : `${results.length} ${results.length === 1 ? "record" : "records"}

${humanRows(results)}` };
    }
    if (command === "sources") {
      const parsed = parseOptions(args.slice(1), /* @__PURE__ */ new Set(["provider"]));
      if (parsed.help) return { exitCode: 0, stdout: json ? jsonLine(envelope(command, { status: "ok", help: commandHelp(command) })) : commandHelp(command) };
      if (parsed.positionals.length) throw new CliError("unexpected-arguments", "sources does not accept positional arguments.");
      const provider = parsed.options.provider?.trim().toLocaleLowerCase();
      if (provider && !providers.some((candidate) => candidate.provider === provider)) {
        throw new CliError("unknown-provider", `Unknown provider \u201C${parsed.options.provider}\u201D.`, 2, {
          validProviders: providers.map((candidate) => candidate.provider)
        });
      }
      const sources = providers.filter((candidate) => !provider || candidate.provider === provider).map(sourceSummary);
      const data = { status: "ok", sources };
      const human = `${sources.map((source) => `${source.name} [${source.provider}]
${source.canonicalUrl}
${source.upstreamRevision} \xB7 retrieved ${source.retrievedAt}
${source.license.name} \xB7 ${source.contentMode}`).join("\n\n")}
`;
      return { exitCode: 0, stdout: json ? jsonLine(envelope(command, data)) : human };
    }
    if (command === "status") {
      const parsed = parseOptions(args.slice(1), /* @__PURE__ */ new Set());
      if (parsed.help) return { exitCode: 0, stdout: json ? jsonLine(envelope(command, { status: "ok", help: commandHelp(command) })) : commandHelp(command) };
      if (parsed.positionals.length) throw new CliError("unexpected-arguments", "status does not accept arguments.");
      const sourceStatus = providers.map(sourceSummary);
      const data = {
        status: "ready",
        compatibilityRelease: "atlas-v3",
        recordCount: nativeEntries.length,
        providers: sourceStatus,
        legacyIdentityPolicy: "Legacy v2 identities return a deprecation and provider candidates; they never select a preferred provider."
      };
      const human = `Atlas v3 ready \xB7 ${nativeEntries.length} provider-native records
${sourceStatus.map((source) => `- ${source.provider}: ${source.status} (${source.recordCount} records; retrieved ${source.retrievedAt})`).join("\n")}
`;
      return { exitCode: 0, stdout: json ? jsonLine(envelope(command, data)) : human };
    }
    throw new CliError("unknown-command", `Unknown command \u201C${command}\u201D.`);
  } catch (error) {
    const cliError = error instanceof CliError ? error : new CliError("internal-error", error instanceof Error ? error.message : "Unknown CLI error.", 1);
    const data = {
      status: "error",
      error: { code: cliError.code, message: cliError.message, details: cliError.details }
    };
    return {
      exitCode: cliError.exitCode,
      stderr: json ? jsonLine(envelope(command || "unknown", data)) : `Error: ${cliError.message}
Run ui-patterns --help for usage.
`
    };
  }
}

// server.ts
async function plugin(bb) {
  bb.cli.register({
    name: "ui-patterns",
    summary: "Search and inspect the Pattern Atlas UI vocabulary",
    commands: cliCommandInfo.map((command) => ({
      name: command.name,
      summary: command.summary,
      usage: `bb ${command.usage}`
    })),
    run(argv) {
      return runAtlasCli(argv);
    }
  });
  bb.log.info("UI Patterns library loaded");
  bb.onDispose(() => bb.log.info("UI Patterns library disposed"));
}
export {
  plugin as default
};
//# sourceMappingURL=server.js.map
