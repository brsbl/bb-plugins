import { cliCommand, defineCli, PluginCliError } from "@get-bb/plugin-sdk";
import { z } from "zod";
import { CUSTOMER_STAGES, INVESTOR_STAGES } from "./model.js";
import type { Priorities } from "./priorities.js";
import { CrmError, type Store } from "./store.js";

const json = { type: "boolean", description: "Emit machine-readable JSON" } as const;
const optional = (description: string) => ({ type: "string", description }) as const;
const idPosition = [{ name: "id", required: true, description: "Record ID from add or list" }] as const;
const page = {
  limit: { type: "integer", min: 1, max: 100, default: 50, description: "Maximum records (1–100)" },
  offset: { type: "integer", min: 0, max: 1_000_000, default: 0, description: "Next offset returned by list" },
} as const;
const trackFields = {
  person: optional("Contact's person ID"),
  stage: optional("Customer milestone: " + CUSTOMER_STAGES.join(" → ") + "; legacy investor metadata only: " + INVESTOR_STAGES.join(" → ")),
  next: { ...optional("Next step, up to 1000 characters; empty text clears it"), aliases: ["next-step"], stdin: true },
  owner: optional("Responsible person or thread label, up to 200 characters; empty text clears it"),
  date: optional("Next step date, YYYY-MM-DD"),
};
const scoreOption = (criterion: string) => ({ type: "integer", min: 0, max: 5, description: criterion + " score (0–5; omitted fields are preserved)" }) as const;
const defined = (value: Record<string, unknown>) => Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined));
function nonempty(patch: Record<string, unknown>) {
  if (!Object.keys(patch).length) throw new CrmError("Supply at least one field to update.");
  return patch;
}

export function createCli(store: Store, priorities: Priorities, changed: () => void) {
  const run = (operation: () => unknown, asJson: boolean, write = true) => {
    try {
      const result = operation();
      if (write) changed();
      return { exitCode: 0, stdout: asJson ? JSON.stringify(result) : JSON.stringify(result, null, 2) };
    } catch (error) {
      if (error instanceof CrmError) throw new PluginCliError(error.message, { code: error.code });
      if (error instanceof z.ZodError) throw new PluginCliError(error.issues.map(issue => issue.path.join(".") + ": " + issue.message).join("; "), { code: "invalid_input" });
      throw error;
    }
  };
  return defineCli({
    name: "crm", summary: "Manage private customer and investor conversations",
    commands: {
      "add investor": cliCommand({
        summary: "Add a person to the independent investor ranking (company contacts or angels)",
        positionals: [{ name: "person", required: true, description: "Existing person ID" }],
        options: { id: optional("Optional stable entry ID"), ask: { ...optional("The ask, up to 1000 characters"), stdin: true }, owner: trackFields.owner, date: trackFields.date, json },
        run: ({ options, positionals }) => run(() => store.addTrack({ ...defined({ id: options.id }), subjectType: "person", subjectId: positionals.person, personId: positionals.person, kind: "investor", stage: "", nextStep: options.ask ?? "", owner: options.owner ?? "", date: options.date ?? null }), options.json),
      }),
      "score customer": cliCommand({
        summary: "Score company impact, 0–5 each. Total 15–20 = Tier 1, 8–14 = Tier 2, 0–7/unscored = Tier 3",
        positionals: [{ name: "id", required: true, description: "Company ID" }],
        options: { "champion-strength": scoreOption("Champion strength"), "room-to-grow": scoreOption("Room to grow"), "case-study-value": scoreOption("Case-study value"), "active-people": scoreOption("Active people"), why: optional("Why this company has this priority, up to 2000 characters"), "clear-scores": { type: "boolean", description: "Clear all four scores before applying supplied scores" }, json },
        run: ({ options, positionals }) => run(() => priorities.scoreCustomer(positionals.id, defined({ championStrength: options["champion-strength"], roomToGrow: options["room-to-grow"], caseStudyValue: options["case-study-value"], activePeople: options["active-people"], why: options.why }), options["clear-scores"]), options.json),
      }),
      "score investor": cliCommand({
        summary: "Score investor value, 0–5 each; unpinned entries rank by the total",
        positionals: idPosition,
        options: { "company-scale": scoreOption("Company scale"), "social-proof": scoreOption("Social proof"), introductions: scoreOption("Introductions"), "co-marketing": scoreOption("Co-marketing"), why: optional("Why this person ranks here, up to 2000 characters"), "clear-scores": { type: "boolean", description: "Clear all four scores before applying supplied scores" }, json },
        run: ({ options, positionals }) => run(() => priorities.scoreInvestor(positionals.id, defined({ companyScale: options["company-scale"], socialProof: options["social-proof"], introductions: options.introductions, coMarketing: options["co-marketing"], why: options.why }), options["clear-scores"]), options.json),
      }),
      "tier set": cliCommand({
        summary: "Override a company's impact tier with a reason; milestone is unchanged",
        positionals: [{ name: "id", required: true, description: "Company ID" }],
        options: { tier: { type: "integer", min: 1, max: 3, required: true, description: "Tier 1, 2 or 3" }, why: { type: "string", required: true, description: "Reason for the override" }, json },
        run: ({ options, positionals }) => run(() => priorities.setTier({ id: positionals.id, tier: options.tier, why: options.why }), options.json),
      }),
      "tier auto": cliCommand({
        summary: "Restore the tier derived from the company's scores", positionals: idPosition, options: { json },
        run: ({ options, positionals }) => run(() => priorities.autoTier(positionals.id), options.json),
      }),
      park: cliCommand({
        summary: "Hide an investor from ranking; preserve scores, history and customer visibility", positionals: idPosition,
        options: { reason: optional("Optional parking reason, up to 2000 characters"), json },
        run: ({ options, positionals }) => run(() => priorities.setParked({ id: positionals.id, parked: true, reason: options.reason }), options.json),
      }),
      unpark: cliCommand({
        summary: "Return an investor to score order without restoring its old manual rank", positionals: idPosition,
        options: { reason: optional("Optional return reason, up to 2000 characters"), json },
        run: ({ options, positionals }) => run(() => priorities.setParked({ id: positionals.id, parked: false, reason: options.reason }), options.json),
      }),
      "rank set": cliCommand({
        summary: "Pin an investor at rank 1…N with a reason; other unpinned people still follow totals", positionals: idPosition,
        options: { rank: { type: "integer", min: 1, max: 1_000_000, required: true, description: "Position in the full investor list" }, why: { type: "string", required: true, description: "Why this person ranks here" }, json },
        run: ({ options, positionals }) => run(() => priorities.setRank({ id: positionals.id, rank: options.rank, why: options.why }), options.json),
      }),
      "rank move": cliCommand({
        summary: "Move an investor up or down one place in the current full ranking", positionals: idPosition,
        options: { direction: { type: "enum", values: ["up", "down"], required: true, description: "Move direction" }, why: { type: "string", required: true, description: "Why the rank is changing" }, json },
        run: ({ options, positionals }) => run(() => priorities.moveRank(positionals.id, options.direction, options.why), options.json),
      }),
      "rank auto": cliCommand({
        summary: "Remove an investor's manual rank override and follow their score again", positionals: idPosition, options: { json },
        run: ({ options, positionals }) => run(() => priorities.autoRank(positionals.id), options.json),
      }),
      "add company": cliCommand({
        summary: "Add a company",
        positionals: [{ name: "name", required: true, description: "Company name (up to 200 characters)" }],
        options: { id: optional("Optional stable import ID; duplicates fail without changes"), json },
        run: ({ options, positionals }) => run(() => store.addCompany({ name: positionals.name, ...defined({ id: options.id }) }), options.json),
      }),
      "add person": cliCommand({
        summary: "Add a company contact or independent angel",
        positionals: [{ name: "name", required: true, description: "Person's name (up to 200 characters)" }],
        options: { id: optional("Optional stable import ID"), company: optional("Company ID; omit for an independent person"), role: optional("Role (up to 200 characters)"), json },
        run: ({ options, positionals }) => run(() => store.addPerson({ name: positionals.name, role: options.role ?? "", companyId: options.company ?? null, ...defined({ id: options.id }) }), options.json),
      }),
      "add track": cliCommand({
        summary: "Start one customer or investor track for a company, or a standalone investor",
        options: { id: optional("Optional stable import ID"), company: optional("Company ID; omit for an independent investor"), kind: { type: "enum", values: ["customer", "investor"], required: true, description: "Track type" }, ...trackFields, json },
        constraints: [{ kind: "at-least-one", options: ["company", "person"] }],
        run: ({ options }) => run(() => store.addTrack({
          ...defined({ id: options.id }), subjectType: options.company ? "company" : "person", subjectId: options.company ?? options.person!,
          personId: options.person ?? null, kind: options.kind, stage: options.stage ?? (options.kind === "customer" ? CUSTOMER_STAGES[0] : INVESTOR_STAGES[0]),
          nextStep: options.next ?? "", owner: options.owner ?? "", date: options.date ?? null,
        }), options.json),
      }),
      "update company": cliCommand({
        summary: "Rename a company", positionals: idPosition,
        options: { name: { type: "string", required: true, description: "New company name" }, json },
        run: ({ options, positionals }) => run(() => store.updateCompany(positionals.id, { name: options.name }), options.json),
      }),
      "update person": cliCommand({
        summary: "Update a person's name, role or company", positionals: idPosition,
        options: { name: optional("New name"), role: optional("New role; empty text clears it"), company: optional("New company ID"), "clear-company": { type: "boolean", description: "Make a person independent, if no track assignment prevents it" }, json },
        constraints: [{ kind: "at-most-one", options: ["company", "clear-company"] }],
        run: ({ options, positionals }) => run(() => store.updatePerson(positionals.id, nonempty(defined({ name: options.name, role: options.role, companyId: options["clear-company"] ? null : options.company }))), options.json),
      }),
      "update track": cliCommand({
        summary: "Update a track's contact, stage, next step, owner or date", positionals: idPosition,
        options: { ...trackFields, "clear-person": { type: "boolean", description: "Remove a company track's contact" }, "clear-date": { type: "boolean", description: "Clear the next step date" }, json },
        constraints: [{ kind: "at-most-one", options: ["person", "clear-person"] }, { kind: "at-most-one", options: ["date", "clear-date"] }],
        run: ({ options, positionals }) => run(() => store.updateTrack(positionals.id, nonempty(defined({
          personId: options["clear-person"] ? null : options.person, stage: options.stage, nextStep: options.next, owner: options.owner,
          date: options["clear-date"] ? null : options.date,
        }))), options.json),
      }),
      list: cliCommand({
        summary: "List records; follow nextOffset until null to read every page",
        options: {
          type: { type: "enum", values: ["companies", "people", "tracks", "interactions", "customers", "investors"], default: "tracks", description: "Record type (default tracks)" },
          status: { type: "enum", values: ["active", "parked", "all"], default: "active", description: "Investor visibility (default active); other record types ignore active" },
          company: optional("Filter by company ID"), person: optional("Filter people, tracks or interactions by person ID"), ...page, json,
        },
        run: ({ options }) => run(() => {
          if (options.type !== "investors" && options.status !== "active") throw new CrmError("--status parked/all requires --type investors.");
          if (options.type === "customers" || options.type === "investors") {
            if (options.company || options.person) throw new CrmError("For priority lists, use pagination; --company/--person filter the original record types.");
            return options.type === "investors" ? priorities.investors({ limit: options.limit, offset: options.offset, status: options.status }) : priorities.customers({ limit: options.limit, offset: options.offset });
          }
          return store.list({ ...options, type: options.type });
        }, options.json, false),
      }),
      view: cliCommand({
        summary: "Print the inline-CRM directive to paste once, on its own line, in chat",
        options: { type: { type: "enum", values: ["customers", "investors"], default: "customers", description: "Customer pipeline (tiers and milestones) or investor ranking (default customers)" }, json },
        run: ({ options }) => {
          const directive = `::crm{view="${options.type}"}`;
          return { exitCode: 0, stdout: options.json ? JSON.stringify({ view: options.type, directive }) : `${directive}\nPaste the line above once, on its own line, in your reply. It shows the live CRM.` };
        },
      }),
      log: cliCommand({
        summary: "Record a message, call or introduction without sending anything",
        options: {
          id: optional("Optional stable import ID; duplicates fail without changes"),
          company: optional("Company ID; inferred from a person's current company when omitted"),
          person: optional("Person ID; must belong to --company when both are supplied"),
          kind: { type: "enum", values: ["message", "call", "intro"], required: true, description: "Interaction type" },
          date: { type: "string", required: true, description: "Interaction date, YYYY-MM-DD" },
          note: { type: "string", required: true, stdin: true, description: "Short note (1–2000 characters)" },
          track: { type: "enum", values: ["customer", "investor"], description: "Optional track context; omit for both or general conversation" }, json,
        },
        constraints: [{ kind: "at-least-one", options: ["company", "person"] }],
        run: ({ options }) => run(() => store.log({ ...defined({ id: options.id }), companyId: options.company ?? null, personId: options.person ?? null, kind: options.kind, date: options.date, note: options.note, track: options.track ?? null }), options.json),
      }),
    },
  });
}

