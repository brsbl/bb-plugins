import { randomUUID } from "node:crypto";
import type { BbPluginApi } from "@get-bb/plugin-sdk";
import { z } from "zod";
import { CUSTOMER_STAGES, INVESTOR_STAGES, companySchema, personSchema, trackSchema, interactionSchema, subjectSchema, viewInputSchema, historyInputSchema, pageSchema, type Company, type Person, type Track, type Interaction, type Subject, type Group } from "./model.js";

type Db = ReturnType<BbPluginApi["storage"]["database"]>;
export const MIGRATIONS = [
  "CREATE TABLE crm_companies (id TEXT PRIMARY KEY, name TEXT NOT NULL)",
  "CREATE TABLE crm_people (id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL, companyId TEXT REFERENCES crm_companies(id))",
  "CREATE INDEX crm_people_company ON crm_people(companyId)",
  "CREATE TABLE crm_tracks (id TEXT PRIMARY KEY, subjectType TEXT NOT NULL CHECK(subjectType IN ('company','person')), subjectId TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN ('customer','investor')), personId TEXT REFERENCES crm_people(id), stage TEXT NOT NULL, nextStep TEXT NOT NULL, owner TEXT NOT NULL, date TEXT, UNIQUE(subjectType, subjectId, kind))",
  "CREATE TABLE crm_interactions (id TEXT PRIMARY KEY, companyId TEXT REFERENCES crm_companies(id), personId TEXT REFERENCES crm_people(id), kind TEXT NOT NULL, date TEXT NOT NULL, note TEXT NOT NULL, track TEXT, createdAt TEXT NOT NULL, CHECK(companyId IS NOT NULL OR personId IS NOT NULL))",
  "CREATE INDEX crm_interactions_company ON crm_interactions(companyId, date DESC, createdAt DESC, id)",
  "CREATE INDEX crm_interactions_person ON crm_interactions(personId, date DESC, createdAt DESC, id)",
];
const addCompanySchema = companySchema.partial({ id: true });
const addPersonSchema = personSchema.partial({ id: true });
const addTrackSchema = trackSchema.partial({ id: true });
const addLogSchema = interactionSchema.omit({ createdAt: true }).partial({ id: true });
const tables = { companies: "crm_companies", people: "crm_people", tracks: "crm_tracks", interactions: "crm_interactions" } as const;
export class CrmError extends Error { constructor(message: string, public code = "invalid_input") { super(message); } }

export function createStore(db: Db) {
  const company = (id: string) => {
    const row = db.prepare("SELECT * FROM crm_companies WHERE id = ?").get(id) as Company | undefined;
    if (!row) throw new CrmError("Company not found. Run bb crm list --type companies --json.", "not_found");
    return row;
  };
  const person = (id: string) => {
    const row = db.prepare("SELECT * FROM crm_people WHERE id = ?").get(id) as Person | undefined;
    if (!row) throw new CrmError("Person not found. Run bb crm list --type people --json.", "not_found");
    return row;
  };
  const subject = (value: Subject) => value.subjectType === "company" ? company(value.subjectId) : person(value.subjectId);
  const track = (id: string) => {
    const row = db.prepare("SELECT * FROM crm_tracks WHERE id = ?").get(id) as Track | undefined;
    if (!row) throw new CrmError("Track not found. Run bb crm list --type tracks --json.", "not_found");
    return row;
  };
  const insert = <T extends { id: string }>(table: typeof tables[keyof typeof tables], row: T): T => {
    if (db.prepare(`SELECT id FROM ${table} WHERE id = ?`).get(row.id)) throw new CrmError("That ID already exists. Use update to change it.", "already_exists");
    const keys = Object.keys(row);
    db.prepare(`INSERT INTO ${table} (${keys.join(",")}) VALUES (${keys.map(key => "@" + key).join(",")})`).run(row);
    return row;
  };
  const validateTrack = (value: Track) => {
    subject(value);
    const stages: readonly string[] = value.kind === "customer" ? CUSTOMER_STAGES : INVESTOR_STAGES;
    if (!stages.includes(value.stage)) throw new CrmError(`Invalid ${value.kind} stage. Use: ${stages.join(" → ")}.`);
    if (value.subjectType === "person") {
      const target = person(value.subjectId);
      if (target.companyId !== null || value.kind !== "investor" || value.personId !== target.id) {
        throw new CrmError("A standalone investor track must belong to an independent person and use that person as its contact.");
      }
    } else if (value.personId && person(value.personId).companyId !== value.subjectId) {
      throw new CrmError("The track contact must belong to this company.");
    }
  };
  return {
    addCompany(input: z.input<typeof addCompanySchema>) {
      const row = companySchema.parse({ id: "c_" + randomUUID(), ...addCompanySchema.parse(input) });
      return insert(tables.companies, row);
    },
    updateCompany(id: string, patch: unknown) {
      const changes = companySchema.omit({ id: true }).partial().strict().parse(patch);
      const row = companySchema.parse({ ...company(id), ...changes });
      db.prepare("UPDATE crm_companies SET name = @name WHERE id = @id").run(row);
      return row;
    },
    addPerson(input: z.input<typeof addPersonSchema>) {
      const row = personSchema.parse({ id: "p_" + randomUUID(), ...addPersonSchema.parse(input) });
      if (row.companyId) company(row.companyId);
      return insert(tables.people, row);
    },
    updatePerson(id: string, patch: unknown) {
      return db.transaction(() => {
        const changes = personSchema.omit({ id: true }).partial().strict().parse(patch);
        const before = person(id);
        const row = personSchema.parse({ ...before, ...changes });
        if (row.companyId) company(row.companyId);
        if (row.companyId !== before.companyId && db.prepare("SELECT id FROM crm_tracks WHERE personId = ? LIMIT 1").get(id)) {
          throw new CrmError("Clear this person's company-track assignments before changing their company. An independent investor with a track must remain independent.");
        }
        db.prepare("UPDATE crm_people SET name = @name, role = @role, companyId = @companyId WHERE id = @id").run(row);
        return row;
      })();
    },
    addTrack(input: z.input<typeof addTrackSchema>) {
      return db.transaction(() => {
        const row = trackSchema.parse({ id: "t_" + randomUUID(), ...addTrackSchema.parse(input) });
        validateTrack(row);
        if (db.prepare("SELECT id FROM crm_tracks WHERE subjectType = ? AND subjectId = ? AND kind = ?").get(row.subjectType, row.subjectId, row.kind)) {
          throw new CrmError("This track already exists. Use bb crm update track with its ID.", "already_exists");
        }
        return insert(tables.tracks, row);
      })();
    },
    updateTrack(id: string, patch: unknown) {
      return db.transaction(() => {
        const changes = trackSchema.omit({ id: true, subjectType: true, subjectId: true, kind: true }).partial().strict().parse(patch);
        const row = trackSchema.parse({ ...track(id), ...changes });
        validateTrack(row);
        db.prepare("UPDATE crm_tracks SET personId = @personId, stage = @stage, nextStep = @nextStep, owner = @owner, date = @date WHERE id = @id").run(row);
        return row;
      })();
    },
    log(input: z.input<typeof addLogSchema>) {
      const parsed = addLogSchema.parse(input);
      const contact = parsed.personId ? person(parsed.personId) : null;
      const companyId = parsed.companyId ?? contact?.companyId ?? null;
      if (companyId) company(companyId);
      if (!companyId && !contact) throw new CrmError("Choose a company or a person to log this interaction.");
      if (parsed.companyId && contact && contact.companyId !== parsed.companyId) throw new CrmError("This person does not belong to the supplied company.");
      const row = interactionSchema.parse({ ...parsed, companyId, id: parsed.id ?? "i_" + randomUUID(), createdAt: new Date().toISOString() });
      return insert(tables.interactions, row);
    },
    list(input: { type: keyof typeof tables; company?: string; person?: string; limit?: number; offset?: number }) {
      const page = pageSchema.parse(input);
      const table = tables[input.type];
      if (!table) throw new CrmError("Unknown record type.");
      if (input.company) company(input.company);
      if (input.person) person(input.person);
      const predicates: string[] = [];
      const args: string[] = [];
      if (input.company) {
        predicates.push(input.type === "companies" ? "id = ?" : input.type === "tracks" ? "(subjectType = 'company' AND subjectId = ?)" : "companyId = ?");
        args.push(input.company);
      }
      if (input.person) {
        if (input.type === "companies") throw new CrmError("--person cannot filter companies.");
        predicates.push(input.type === "people" ? "id = ?" : "personId = ?");
        args.push(input.person);
      }
      const where = predicates.length ? " WHERE " + predicates.join(" AND ") : "";
      const order = input.type === "interactions" ? "date DESC, createdAt DESC, id" : "id";
      const items = db.prepare(`SELECT * FROM ${table}${where} ORDER BY ${order} LIMIT ? OFFSET ?`).all(...args, page.limit + 1, page.offset);
      return { items: items.slice(0, page.limit), nextOffset: items.length > page.limit ? page.offset + page.limit : null };
    },
    view(input: z.input<typeof viewInputSchema>) {
      const { query, kind, limit, offset } = viewInputSchema.parse(input);
      const from = `FROM (
        SELECT 'company' AS subjectType, id AS subjectId, name FROM crm_companies
        UNION ALL SELECT 'person', id, name FROM crm_people WHERE companyId IS NULL
      ) g WHERE (
        instr(lower(g.name), lower(@query)) > 0 OR EXISTS (
          SELECT 1 FROM crm_people p WHERE g.subjectType = 'company' AND p.companyId = g.subjectId AND instr(lower(p.name), lower(@query)) > 0
        )
      ) AND (@kind IS NULL OR EXISTS (
        SELECT 1 FROM crm_tracks t WHERE t.subjectType = g.subjectType AND t.subjectId = g.subjectId AND t.kind = @kind
      ))`;
      const parameters = { query: query.trim(), kind: kind ?? null };
      const { total } = db.prepare("SELECT COUNT(*) AS total " + from).get(parameters) as { total: number };
      const subjects = db.prepare("SELECT g.* " + from + " ORDER BY lower(g.name), g.subjectType, g.subjectId LIMIT @limit OFFSET @offset").all({ ...parameters, limit, offset }) as (Subject & { name: string })[];
      const groups: Group[] = subjects.map(value => {
        const people = value.subjectType === "company"
          ? db.prepare("SELECT * FROM crm_people WHERE companyId = ? ORDER BY name, id").all(value.subjectId) as Person[]
          : [person(value.subjectId)];
        const tracks = db.prepare("SELECT * FROM crm_tracks WHERE subjectType = ? AND subjectId = ? AND (? IS NULL OR kind = ?) ORDER BY kind").all(value.subjectType, value.subjectId, kind ?? null, kind ?? null) as Track[];
        const { count } = db.prepare(`SELECT COUNT(*) AS count FROM crm_interactions WHERE ${value.subjectType === "company" ? "companyId" : "personId"} = ?`).get(value.subjectId) as { count: number };
        return { ...value, people, tracks, historyCount: count };
      });
      return { groups, total, nextOffset: offset + limit < total ? offset + limit : null };
    },
    history(input: z.input<typeof historyInputSchema>) {
      const value = historyInputSchema.parse(input);
      subject(subjectSchema.parse({ subjectType: value.subjectType, subjectId: value.subjectId }));
      const rows = db.prepare(`SELECT * FROM crm_interactions WHERE ${value.subjectType === "company" ? "companyId" : "personId"} = ? ORDER BY date DESC, createdAt DESC, id LIMIT 21 OFFSET ?`).all(value.subjectId, value.offset) as Interaction[];
      const ids = [...new Set(rows.slice(0, 20).flatMap(row => row.personId ? [row.personId] : []))];
      return { items: rows.slice(0, 20), people: ids.map(person), nextOffset: rows.length > 20 ? value.offset + 20 : null };
    },
  };
}
export type Store = ReturnType<typeof createStore>;

