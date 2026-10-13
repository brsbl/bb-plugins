import { z } from "zod";

export const CUSTOMER_STAGES = ["Champion identified", "M1 · Relationship", "M2 · Value", "M3 · Team", "M4 · Team usage + expansion"] as const;
export const INVESTOR_STAGES = ["Identified", "Intro requested", "Intro made", "Conversation", "Committed"] as const;
export const kindSchema = z.enum(["customer", "investor"]);
export const idSchema = z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/, "Use an ID of 1–80 letters, numbers, underscores or hyphens");
export const nameSchema = z.string().trim().min(1).max(200);
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(value + "T00:00:00Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Use a real calendar date (YYYY-MM-DD)");
export const companySchema = z.object({ id: idSchema, name: nameSchema }).strict();
export const personSchema = z.object({ id: idSchema, name: nameSchema, role: z.string().max(200), companyId: idSchema.nullable() }).strict();
export const subjectSchema = z.object({ subjectType: z.enum(["company", "person"]), subjectId: idSchema }).strict();
export const trackSchema = subjectSchema.extend({
  id: idSchema, kind: kindSchema, personId: idSchema.nullable(), stage: z.string(),
  nextStep: z.string().max(1000), owner: z.string().max(200), date: dateSchema.nullable(),
}).strict();
export const interactionSchema = z.object({
  id: idSchema, companyId: idSchema.nullable(), personId: idSchema.nullable(),
  kind: z.enum(["message", "call", "intro"]), date: dateSchema, note: z.string().trim().min(1).max(2000),
  track: kindSchema.nullable(), createdAt: z.string(),
}).strict();
export const groupSchema = subjectSchema.extend({
  name: z.string(), people: z.array(personSchema), tracks: z.array(trackSchema), historyCount: z.number().int().nonnegative(),
}).strict();
export type Company = z.infer<typeof companySchema>;
export type Person = z.infer<typeof personSchema>;
export type Track = z.infer<typeof trackSchema>;
export type Interaction = z.infer<typeof interactionSchema>;
export type Group = z.infer<typeof groupSchema>;
export type Subject = z.infer<typeof subjectSchema>;
export type Kind = z.infer<typeof kindSchema>;
export const pageSchema = z.object({ limit: z.number().int().min(1).max(100).default(50), offset: z.number().int().min(0).max(1_000_000).default(0) });
export const viewInputSchema = pageSchema.extend({ query: z.string().max(200).default(""), kind: kindSchema.optional() }).strict();
export const historyInputSchema = subjectSchema.extend({ offset: z.number().int().min(0).max(1_000_000).default(0) }).strict();


export const scoreSchema = z.number().int().min(0).max(5).nullable();
export const customerScoresSchema = z.object({ championStrength: scoreSchema, roomToGrow: scoreSchema, caseStudyValue: scoreSchema, activePeople: scoreSchema }).strict();
export const investorScoresSchema = z.object({ companyScale: scoreSchema, socialProof: scoreSchema, introductions: scoreSchema, coMarketing: scoreSchema }).strict();
export const whySchema = z.string().trim().max(2000);
export const tierSchema = z.number().int().min(1).max(3);
export const rankInputSchema = z.object({ id: idSchema, rank: z.number().int().min(1).max(1_000_000), why: whySchema.min(1) }).strict();
export const tierInputSchema = z.object({ id: idSchema, tier: tierSchema.nullable(), why: whySchema }).strict();
export const priorityInputSchema = pageSchema.extend({ query: z.string().max(200).default("") }).strict();
export const investorStatusSchema = z.enum(["active", "parked", "all"]);
export const investorInputSchema = priorityInputSchema.extend({ status: investorStatusSchema.default("active") }).strict();
export const parkingInputSchema = z.object({ id: idSchema, parked: z.boolean(), reason: whySchema.optional() }).strict();
export const customerRowSchema = z.object({ company: companySchema, person: personSchema.nullable(), track: trackSchema.nullable(), scores: customerScoresSchema, total: z.number().int().nullable(), tier: tierSchema, tierOverride: tierSchema.nullable(), why: whySchema }).strict();
export const investorRowSchema = z.object({ track: trackSchema, person: personSchema.nullable(), company: companySchema.nullable(), scores: investorScoresSchema, total: z.number().int().nullable(), rank: z.number().int(), rankOverride: z.number().int().nullable(), why: whySchema, legacyStage: z.string(), parked: z.boolean(), statusReason: whySchema }).strict();
export type CustomerRow = z.infer<typeof customerRowSchema>;
export type InvestorRow = z.infer<typeof investorRowSchema>;
export type CustomerScores = z.infer<typeof customerScoresSchema>;
export type InvestorScores = z.infer<typeof investorScoresSchema>;
export const CUSTOMER_CRITERIA = [["championStrength", "Champion strength"], ["roomToGrow", "Room to grow"], ["caseStudyValue", "Case-study value"], ["activePeople", "Active people"]] as const;
export const INVESTOR_CRITERIA = [["companyScale", "Company scale"], ["socialProof", "Social proof"], ["introductions", "Introductions"], ["coMarketing", "Co-marketing"]] as const;
