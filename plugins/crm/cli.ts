import { cliCommand, defineCli, PluginCliError } from "@get-bb/plugin-sdk";
import { z } from "zod";
import { CUSTOMER_STAGES, INVESTOR_STAGES } from "./model.js";
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
  stage: optional("Stage name; customer: " + CUSTOMER_STAGES.join(", ") + "; investor: " + INVESTOR_STAGES.join(", ")),
  next: { ...optional("Next step, up to 1000 characters; empty text clears it"), aliases: ["next-step"], stdin: true },
  owner: optional("Responsible person or thread label, up to 200 characters; empty text clears it"),
  date: optional("Next step date, YYYY-MM-DD"),
};
const defined = (value: Record<string, unknown>) => Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined));
function nonempty(patch: Record<string, unknown>) {
  if (!Object.keys(patch).length) throw new CrmError("Supply at least one field to update.");
  return patch;
}

export function createCli(store: Store, changed: () => void) {
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
          type: { type: "enum", values: ["companies", "people", "tracks", "interactions"], default: "tracks", description: "Record type (default tracks)" },
          company: optional("Filter by company ID"), person: optional("Filter people, tracks or interactions by person ID"), ...page, json,
        },
        run: ({ options }) => run(() => store.list(options), options.json, false),
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

