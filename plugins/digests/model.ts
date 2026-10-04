import { CronExpressionParser } from "cron-parser";
import { z } from "zod";

/** Public bounds also apply to CLI files, agent tools, and persisted JSON. */
export const IdSchema = z.string().min(1).max(160).regex(/^[A-Za-z0-9][A-Za-z0-9_.:-]*$/u);
export const DigestIdSchema = z.string().min(1).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u);
const timestamp = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const timezone = z.string().min(1).max(100).refine((value) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}, "Use a valid timezone, such as America/Los_Angeles.");

export const ScheduleSchema = z.object({
  cron: z.string().trim().min(1).max(120).refine((value) => {
    if (value.split(/\s+/u).length !== 5) return false;
    try {
      CronExpressionParser.parse(value);
      return true;
    } catch {
      return false;
    }
  }, "Use a valid five-field cron schedule."),
  timezone,
}).strict();

export const EmojiSchema = z.string().trim().min(1).max(32).refine((value) =>
  [...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(value)].length === 1
    && /[\p{Extended_Pictographic}\p{Regional_Indicator}\u20e3]/u.test(value),
"Choose one emoji.");

export const ExecutionChoiceSchema = z.object({
  projectId: IdSchema,
  hostId: IdSchema,
  environmentId: IdSchema.optional(),
}).strict();
export const ExplicitEnvironmentSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("reuse"), environmentId: IdSchema }).strict(),
  z.object({ type: z.literal("host"), hostId: IdSchema, workspace: z.discriminatedUnion("type", [
    z.object({ type: z.literal("personal") }).strict(),
    z.object({ type: z.literal("unmanaged"), path: z.string().min(1) }).strict(),
  ]) }).strict(),
]);

export const DigestDefinitionSchema = z.object({
  /** The stable, human-readable slug used by `bb digest --digest`. */
  id: DigestIdSchema,
  name: z.string().trim().min(1).max(100),
  // Retained for saved definitions and existing clients; never rendered.
  emoji: EmojiSchema.optional(),
  projectId: IdSchema,
  instructions: z.string().trim().min(1).max(30_000),
  afterReading: z.enum(["keep-unread", "mark-read"]).optional(),
  connectionIds: z.array(DigestIdSchema).max(20).default([]).refine(
    (ids) => new Set(ids).size === ids.length,
    "List each connection only once.",
  ),
  schedule: ScheduleSchema.nullable().default(null),
  automationId: IdSchema.nullable().default(null),
  // Optional additions preserve saved definitions and existing clients.
  execution: ExecutionChoiceSchema.optional(),
  automationProjectId: IdSchema.optional(),
  automationEnvironment: ExplicitEnvironmentSchema.optional(),
  enabled: z.boolean().default(false),
  providerId: IdSchema.nullable().default(null),
  model: z.string().min(1).max(160).nullable().default(null),
  reasoningLevel: z.enum(["none", "low", "medium", "high", "xhigh", "max", "ultra", "ultracode"]).nullable().default(null),
  permissionMode: z.enum(["accept-edits", "auto", "full"]).default("auto"),
  environment: z.union([
    z.object({ type: z.literal("project-default") }).strict(),
    ExplicitEnvironmentSchema,
  ]).default({ type: "project-default" }),
  createdAt: timestamp,
}).strict();

export const ConnectionSchema = z.object({
  id: DigestIdSchema,
  name: z.string().trim().min(1).max(100),
  url: z.string().url().max(2_048).refine((value) => {
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
    } catch {
      return false;
    }
  }, "Use an HTTP or HTTPS site URL without credentials."),
  browserHostId: IdSchema.nullable().default(null),
  desktopInstanceId: IdSchema.nullable().default(null),
  status: z.enum(["unknown", "signed-in", "signed-out", "expired", "unavailable", "upgrade-required"]).default("unknown"),
  accountName: z.string().trim().max(160).nullable().optional(),
  checkedAt: timestamp.nullable().default(null),
  detail: z.string().max(2_000).nullable().default(null),
}).strict();

export const MetricSchema = z.object({
  label: z.string().trim().min(1).max(80),
  value: z.string().trim().min(1).max(100),
}).strict();

export const SourceSchema = z.object({
  connectionId: DigestIdSchema,
  messageId: IdSchema,
  threadId: IdSchema.optional(),
  /** Ordinary inbox updates can revisit mail; newsletter dedup stays on. */
  deduplicate: z.boolean().optional(),
}).strict();

const sources = z.array(SourceSchema).max(1_000).refine((items) => {
  const keys = items.map((source) => `${source.connectionId}\u0000${source.messageId}`);
  return new Set(keys).size === keys.length;
}, "Each source message must appear only once in an issue.");

const sourceLink = z.object({
  label: z.string().trim().min(1).max(40),
  url: z.string().url().max(2048).refine((value) => {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  }, "Use an HTTPS source or review URL."),
}).strict();

export const EmailReadSchema = z.object({
  messageId: IdSchema,
  threadId: IdSchema.optional(),
  wasUnread: z.boolean(),
  title: z.string().trim().min(1).max(180).optional(),
  url: sourceLink.shape.url.optional(),
  afterReading: z.enum(["keep-unread", "mark-read"]),
  status: z.enum(["opening", "restored-unread", "left-read", "unchanged-read", "restore-failed"]),
}).strict();
// Tool transports need root object properties to preserve boolean argument types.
export const EmailReadInputSchema = z.object({
  status: EmailReadSchema.shape.status, messageId: IdSchema, threadId: IdSchema.optional(),
  wasUnread: z.boolean().optional(), title: EmailReadSchema.shape.title, url: EmailReadSchema.shape.url,
}).strict();

const emailRow = z.object({ title: z.string().trim().min(1).max(180), text: z.string().trim().max(200), url: sourceLink.shape.url }).strict();

/** Optional so existing Markdown publishers and stored issues remain valid. */
export const BriefSchema = z.object({
  summaryLinks: z.array(z.union([
    z.object({ label: z.string().trim().min(1).max(80), section: z.enum(["items", "later", "tail", "all"]) }).strict(),
    // Retain old saved links, but never open them from a count in the renderer.
    sourceLink,
  ])).max(6).optional(),
  heading: z.string().trim().min(1).max(60),
  items: z.array(z.object({
    title: z.string().trim().min(1).max(140),
    text: z.string().trim().max(200),
    context: z.string().max(60).optional(),
    urgency: z.enum(["today", "week", "later"]).optional(),
    deadline: z.string().trim().min(1).max(40).optional(),
    action: sourceLink,
    secondaryAction: sourceLink.optional(),
  }).strict()).max(8),
  later: z.array(z.object({ title: z.string().trim().min(1).max(180), action: sourceLink.optional() }).strict()).max(12).default([]),
  laterLabel: z.string().max(60).default("Later"),
  tail: z.object({ label: z.string().trim().min(1).max(80), details: z.string().trim().min(1).max(20000),
    items: z.array(emailRow).max(100).optional(),
  }).strict().optional(),
  all: z.object({ label: z.string().trim().min(1).max(80), items: z.array(emailRow).max(1000) }).strict().optional(),
}).strict();

export const SaveDigestSchema = z.object({
  id: DigestIdSchema.optional(),
  connectionId: DigestIdSchema,
  name: DigestDefinitionSchema.shape.name,
  // Retained for saved definitions and existing clients; never rendered.
  emoji: EmojiSchema.optional(),
  instructions: DigestDefinitionSchema.shape.instructions,
  afterReading: DigestDefinitionSchema.shape.afterReading,
  schedule: ScheduleSchema.nullable(),
  execution: ExecutionChoiceSchema.nullable().optional(),
}).strict();
export type SaveDigest = z.infer<typeof SaveDigestSchema>;

export const PublishInputSchema = z.object({
  headline: z.string().trim().min(1).max(240),
  lede: z.string().trim().max(2_000).default(""),
  metrics: z.array(MetricSchema).max(6).default([]),
  brief: BriefSchema.optional(),
  details: z.string().trim().min(1).max(100_000),
  sources: sources.default([]),
}).strict().superRefine((input, ctx) => {
  const brief = input.brief;
  if (!brief) return;
  brief.summaryLinks?.forEach((link, index) => {
    if (!("section" in link)) return;
    const target = brief[link.section];
    if (!target || (Array.isArray(target) && !target.length)) ctx.addIssue({ code: "custom", path: ["brief", "summaryLinks", index, "section"], message: "Each count needs a matching section in this issue." });
  });
});

export const IssueSchema = z.object({
  id: IdSchema,
  digestId: DigestIdSchema,
  threadId: IdSchema.nullable().default(null),
  headline: z.string().trim().min(1).max(240),
  lede: z.string().trim().max(2_000).default(""),
  metrics: z.array(MetricSchema).max(6).default([]),
  brief: BriefSchema.optional(),
  details: z.string().max(100_000).default(""),
  state: z.enum(["collecting", "ready", "failed"]).default("collecting"),
  recovery: z.enum(["retry", "reconnect", "upgrade"]).nullable().default(null),
  createdAt: timestamp,
  publishedAt: timestamp.nullable().default(null),
  readAt: timestamp.nullable().default(null),
  dedupeKey: z.string().min(1).max(240).nullable().default(null),
  sources: sources.default([]),
  emailReads: z.array(EmailReadSchema).max(1000).optional(),
}).strict();

/** Successful publication and processed sources have one atomic write path. */
export const IssuePatchSchema = z.object({
  threadId: IdSchema.nullable().optional(),
  headline: IssueSchema.shape.headline.optional(),
  lede: z.string().trim().max(2_000).optional(),
  metrics: z.array(MetricSchema).max(6).optional(),
  brief: BriefSchema.optional(),
  details: z.string().max(100_000).optional(),
  recovery: z.enum(["retry", "reconnect", "upgrade"]).nullable().optional(),
  readAt: timestamp.nullable().optional(),
  state: z.enum(["collecting", "failed"]).optional(),
  emailReads: IssueSchema.shape.emailReads,
}).strict();

export const IssueListInputSchema = z.object({
  digestId: DigestIdSchema.optional(),
  state: IssueSchema.shape.state.unwrap().optional(),
  limit: z.number().int().min(1).max(500).default(100),
  offset: z.number().int().nonnegative().max(1_000_000).default(0),
}).strict();

export type DigestDefinition = z.infer<typeof DigestDefinitionSchema>;
export type Connection = z.infer<typeof ConnectionSchema>;
export type Issue = z.infer<typeof IssueSchema>;
export type PublishInput = z.infer<typeof PublishInputSchema>;
export type IssuePatch = z.infer<typeof IssuePatchSchema>;
export type IssueListInput = z.input<typeof IssueListInputSchema>;

export const digestDefinitionSchema = DigestDefinitionSchema;
export const connectionSchema = ConnectionSchema;
export const issueSchema = IssueSchema;
export const publishInputSchema = PublishInputSchema;
