import { z } from "zod";

/** [title, created date YYYY-MM-DD, state, url] — newest first. */
export const itemSchema = z.tuple([z.string(), z.string(), z.string(), z.string()]);
export const discordSummarySchema = z.looseObject({
  m: z.number().nullable().optional(),
  f: z.string().optional(),
  l: z.string().optional(),
  u: z.string().optional(),
});
export const discordMessageSchema = z.object({ url: z.string(), date: z.string(), snippet: z.string() });

/** One person in a company row. Unknown fields from the page are kept as they are. */
export const personSchema = z.looseObject({
  n: z.string(),
  gh: z.string(),
  li: z.string(),
  d: z.boolean(),
  role: z.string(),
  champ: z.boolean(),
  sl: z.boolean(),
  i: z.number(),
  iu: z.string(),
  p: z.number(),
  pu: z.string(),
  il: z.array(itemSchema),
  pl: z.array(itemSchema),
  dd: discordSummarySchema.nullable().optional(),
  dm: z.array(discordMessageSchema).optional(),
  /** Discord username used to recount Discord messages. */
  dh: z.string().nullable().optional(),
});

/** One company row, in the page's ROWS format. */
export const rowSchema = z.looseObject({
  c: z.string(),
  url: z.string(),
  site: z.boolean(),
  seg: z.string(),
  /** Plan: "P1", "P2", a rank number, or "—". */
  pr: z.union([z.string(), z.number()]),
  emp: z.number(),
  size: z.string(),
  src: z.string(),
  country: z.string().optional(),
  region: z.string().optional(),
  unv: z.boolean().optional(),
  comp: z.boolean().optional(),
  full: z.string().optional(),
  iss: z.number(),
  prs: z.number(),
  dis: z.number(),
  slack: z.boolean(),
  n: z.number(),
  ppl: z.array(personSchema),
  slack_ch: z.string().optional(),
  slack_url: z.string().optional(),
});

/** [title, created date, state, kind, author login lowercased] keyed by URL. */
export const githubItemSchema = z.tuple([z.string(), z.string(), z.string(), z.enum(["i", "p"]), z.string()]);
export const githubProfileSchema = z.object({
  /** The profile's company field, as written ("@acme", "Acme Inc."), or null when empty. */
  company: z.string().nullable(),
  name: z.string().nullable(),
  fetchedAt: z.string(),
});
export const discordAuthorSchema = z.object({
  m: z.number().int(),
  f: z.string(),
  l: z.string(),
  u: z.string(),
  /** The two newest messages, newest first. */
  recent: z.array(discordMessageSchema.extend({ id: z.string() })),
});

/** Server-private source state. Never sent to the app. */
export const cursorsSchema = z.object({
  github: z.object({
    /** updated_at high-water mark per repository, `owner/name` → ISO. */
    repos: z.record(z.string(), z.string()),
    items: z.record(z.string(), githubItemSchema),
    /** Logins seen authoring as a repository owner or organization member: the project's own team. */
    team: z.array(z.string()).optional(),
    /** Public profile fields per lowercased login, read for new authors the census doesn't know. */
    profiles: z.record(z.string(), githubProfileSchema).optional(),
  }).optional(),
  discord: z.object({
    /** Newest message id read per channel or thread. */
    channels: z.record(z.string(), z.string()),
    /** Archived threads archived after this time are read again. */
    threadsCheckedAt: z.string().nullable(),
    authors: z.record(z.string(), discordAuthorSchema),
  }).optional(),
  census: z.object({
    /** Census handles (`gh:login`, `d:handle`) that already had activity when the table was built; never auto-added. */
    reviewed: z.array(z.string()),
  }).optional(),
});

export const snapshotSchema = z.object({
  version: z.literal(1),
  updatedAt: z.string().refine(value => Number.isFinite(Date.parse(value)), "updatedAt must be an ISO date"),
  rows: z.array(rowSchema),
  cursors: cursorsSchema.optional(),
});

export const statusSchema = z.object({
  state: z.enum(["idle", "updating", "failed"]),
  startedAt: z.string().optional(),
  lastAttemptAt: z.string().optional(),
  error: z.string().optional(),
});

export type Item = z.infer<typeof itemSchema>;
export type Person = z.infer<typeof personSchema>;
export type Row = z.infer<typeof rowSchema>;
export type GithubItem = z.infer<typeof githubItemSchema>;
export type GithubProfile = z.infer<typeof githubProfileSchema>;
export type DiscordAuthor = z.infer<typeof discordAuthorSchema>;
export type Cursors = z.infer<typeof cursorsSchema>;
export type Snapshot = z.infer<typeof snapshotSchema>;
export type Status = z.infer<typeof statusSchema>;
