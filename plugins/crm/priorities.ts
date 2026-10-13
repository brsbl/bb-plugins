import { z } from "zod";
import { CrmError, type Db } from "./store.js";
import { customerScoresSchema, investorScoresSchema, priorityInputSchema, rankInputSchema, tierInputSchema, whySchema, type Company, type Person, type Track, type CustomerRow, type InvestorRow, type CustomerScores, type InvestorScores } from "./model.js";

const total = (scores: Record<string, number | null>) => Object.values(scores).every(v => v === null) ? null : Object.values(scores).reduce<number>((sum, v) => sum + (v ?? 0), 0);
const customerPatch = customerScoresSchema.partial().extend({ why: whySchema.optional() }).strict();
const investorPatch = investorScoresSchema.partial().extend({ why: whySchema.optional() }).strict();
const customerEmpty: CustomerScores = { championStrength: null, roomToGrow: null, caseStudyValue: null, activePeople: null };
const investorEmpty: InvestorScores = { companyScale: null, socialProof: null, introductions: null, coMarketing: null };
type InvestorScoreRecord = InvestorScores & { trackId: string; sequence: number; rankOverride: number | null; why: string; legacyStage: string };
type CustomerScoreRecord = CustomerScores & { companyId: string; tierOverride: number | null; why: string };

export function createPriorities(db: Db) {
  const lookup = () => ({
    companies: new Map((db.prepare("SELECT * FROM crm_companies").all() as Company[]).map(c => [c.id, c])),
    people: new Map((db.prepare("SELECT * FROM crm_people").all() as Person[]).map(p => [p.id, p])),
  });
  const investors = (): InvestorRow[] => {
    const { companies, people } = lookup();
    const scores = new Map((db.prepare("SELECT * FROM crm_investor_scores").all() as InvestorScoreRecord[]).map(s => [s.trackId, s]));
    const rows = (db.prepare("SELECT * FROM crm_tracks WHERE kind='investor'").all() as Track[]).map(track => {
      const saved = scores.get(track.id)!;
      const { companyScale, socialProof, introductions, coMarketing } = saved;
      const values = { companyScale, socialProof, introductions, coMarketing };
      const person = track.personId ? people.get(track.personId) ?? null : null;
      return { track, person, company: companies.get(track.subjectType === "company" ? track.subjectId : person?.companyId ?? "") ?? null, scores: values, total: total(values), rank: 0, rankOverride: saved.rankOverride, why: saved.why, legacyStage: saved.legacyStage };
    }).sort((a, b) => (b.total ?? -1) - (a.total ?? -1) || scores.get(a.track.id)!.sequence - scores.get(b.track.id)!.sequence || a.track.id.localeCompare(b.track.id));
    // Manual entries occupy explicit slots; all other people still follow their totals.
    const ordered = rows.filter(row => row.rankOverride === null);
    for (const row of rows.filter(row => row.rankOverride !== null).sort((a, b) => a.rankOverride! - b.rankOverride! || a.track.id.localeCompare(b.track.id))) {
      ordered.splice(Math.min(row.rankOverride! - 1, ordered.length), 0, row);
    }
    return ordered.map((row, index) => ({ ...row, rank: index + 1 }));
  };
  const customers = (): CustomerRow[] => {
    const { companies, people } = lookup();
    const tracks = new Map((db.prepare("SELECT * FROM crm_tracks WHERE kind='customer'").all() as Track[]).map(t => [t.subjectId, t]));
    return (db.prepare("SELECT * FROM crm_customer_scores WHERE companyId IN (SELECT subjectId FROM crm_tracks WHERE kind='customer')").all() as CustomerScoreRecord[]).map(saved => {
      const { championStrength, roomToGrow, caseStudyValue, activePeople } = saved;
      const scores = { championStrength, roomToGrow, caseStudyValue, activePeople };
      const sum = total(scores);
      const track = tracks.get(saved.companyId) ?? null;
      return { company: companies.get(saved.companyId)!, person: track?.personId ? people.get(track.personId) ?? null : null, track, scores, total: sum, tier: saved.tierOverride ?? ((sum ?? 0) >= 15 ? 1 : (sum ?? 0) >= 8 ? 2 : 3), tierOverride: saved.tierOverride, why: saved.why };
    }).sort((a, b) => a.tier - b.tier || (b.total ?? -1) - (a.total ?? -1) || a.company.name.localeCompare(b.company.name) || a.company.id.localeCompare(b.company.id));
  };
  const requireCustomer = (id: string) => {
    if (!customers().some(row => row.company.id === id)) throw new CrmError("Customer track not found. Add this company's customer track first.", "not_found");
  };
  const update = (table: "crm_customer_scores" | "crm_investor_scores", key: "companyId" | "trackId", id: string, changes: Record<string, unknown>) => {
    if (!db.prepare(`SELECT ${key} FROM ${table} WHERE ${key}=?`).get(id)) throw new CrmError("Priority entry not found. List customers or investors first.", "not_found");
    const keys = Object.keys(changes);
    if (!keys.length) throw new CrmError("Supply at least one score or why text.");
    // Keys are parsed by the strict schemas above, never taken directly from callers.
    db.prepare(`UPDATE ${table} SET ${keys.map(key => `${key}=@${key}`).join(",")} WHERE ${key}=@id`).run({ ...changes, id });
  };
  return {
    customers(input: z.input<typeof priorityInputSchema>) {
      const { query, limit, offset } = priorityInputSchema.parse(input);
      const needle = query.trim().toLowerCase();
      const all = customers().filter(row => (row.company.name + " " + (row.person?.name ?? "")).toLowerCase().includes(needle));
      return { items: all.slice(offset, offset + limit), total: all.length, nextOffset: offset + limit < all.length ? offset + limit : null };
    },
    investors(input: z.input<typeof priorityInputSchema>) {
      const { query, limit, offset } = priorityInputSchema.parse(input);
      const all = investors();
      const needle = query.trim().toLowerCase();
      const filtered = all.filter(row => ((row.person?.name ?? "No contact assigned") + " " + (row.company?.name ?? "")).toLowerCase().includes(needle));
      return { items: filtered.slice(offset, offset + limit), total: filtered.length, rankCount: all.length, nextOffset: offset + limit < filtered.length ? offset + limit : null };
    },
    scoreCustomer(id: string, input: unknown, clear = false) {
      const patch = customerPatch.parse(input);
      requireCustomer(id);
      update("crm_customer_scores", "companyId", id, { ...(clear ? customerEmpty : {}), ...patch });
      return customers().find(row => row.company.id === id)!;
    },
    scoreInvestor(id: string, input: unknown, clear = false) {
      const patch = investorPatch.parse(input);
      update("crm_investor_scores", "trackId", id, { ...(clear ? investorEmpty : {}), ...patch });
      return investors().find(row => row.track.id === id)!;
    },
    autoTier(id: string) {
      requireCustomer(id);
      update("crm_customer_scores", "companyId", id, { tierOverride: null });
      return customers().find(row => row.company.id === id)!;
    },
    setTier(input: z.input<typeof tierInputSchema>) {
      const { id, tier, why } = tierInputSchema.parse(input);
      requireCustomer(id);
      if (tier !== null && !why) throw new CrmError("Explain the manual tier in --why.");
      update("crm_customer_scores", "companyId", id, { tierOverride: tier, why });
      return customers().find(row => row.company.id === id)!;
    },
    setRank(input: z.input<typeof rankInputSchema>) {
      return db.transaction(() => {
        const { id, rank, why } = rankInputSchema.parse(input);
        const ordered = investors();
        const index = ordered.findIndex(row => row.track.id === id);
        if (index < 0) throw new CrmError("Investor entry not found.", "not_found");
        if (rank > ordered.length) throw new CrmError("Rank must be between 1 and " + ordered.length + ".");
        const [moved] = ordered.splice(index, 1);
        ordered.splice(rank - 1, 0, moved!);
        ordered.forEach((row, index) => {
          if (row.rankOverride !== null || row.track.id === id) update("crm_investor_scores", "trackId", row.track.id, { rankOverride: index + 1, ...(row.track.id === id ? { why } : {}) });
        });
        return investors().find(row => row.track.id === id)!;
      })();
    },
    moveRank(id: string, direction: "up" | "down", why: string): InvestorRow {
      return db.transaction(() => {
        const row = investors().find(row => row.track.id === id);
        if (!row) throw new CrmError("Investor entry not found.", "not_found");
        return this.setRank({ id, rank: row.rank + (direction === "up" ? -1 : 1), why });
      })();
    },
    autoRank(id: string) {
      update("crm_investor_scores", "trackId", id, { rankOverride: null });
      return investors().find(row => row.track.id === id)!;
    },
  };
}
export type Priorities = ReturnType<typeof createPriorities>;
