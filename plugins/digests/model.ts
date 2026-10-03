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

export const DigestDefinitionSchema = z.object({
  /** The stable, human-readable slug used by `bb digest --digest`. */
  id: DigestIdSchema,
  name: z.string().trim().min(1).max(100),
  projectId: IdSchema,
  instructions: z.string().trim().min(1).max(30_000),
  connectionIds: z.array(DigestIdSchema).max(20).default([]).refine(
    (ids) => new Set(ids).size === ids.length,
    "List each connection only once.",
  ),
  schedule: ScheduleSchema.nullable().default(null),
  automationId: IdSchema.nullable().default(null),
  enabled: z.boolean().default(false),
  providerId: IdSchema.nullable().default(null),
  model: z.string().min(1).max(160).nullable().default(null),
  reasoningLevel: z.enum(["none", "low", "medium", "high", "xhigh", "max", "ultra", "ultracode"]).nullable().default(null),
  permissionMode: z.enum(["accept-edits", "auto", "full"]).default("auto"),
  environment: z.object({ type: z.literal("project-default") }).strict().default({ type: "project-default" }),
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
}).strict();

const sources = z.array(SourceSchema).max(1_000).refine((items) => {
  const keys = items.map((source) => `${source.connectionId}\u0000${source.messageId}`);
  return new Set(keys).size === keys.length;
}, "Each source message must appear only once in an issue.");

export const PublishInputSchema = z.object({
  headline: z.string().trim().min(1).max(240),
  metrics: z.array(MetricSchema).max(6).default([]),
  details: z.string().trim().min(1).max(100_000),
  sources: sources.default([]),
}).strict();

export const IssueSchema = z.object({
  id: IdSchema,
  digestId: DigestIdSchema,
  threadId: IdSchema.nullable().default(null),
  headline: z.string().trim().min(1).max(240),
  metrics: z.array(MetricSchema).max(6).default([]),
  details: z.string().max(100_000).default(""),
  state: z.enum(["collecting", "ready", "failed"]).default("collecting"),
  recovery: z.enum(["retry", "reconnect", "upgrade"]).nullable().default(null),
  createdAt: timestamp,
  publishedAt: timestamp.nullable().default(null),
  readAt: timestamp.nullable().default(null),
  dedupeKey: z.string().min(1).max(240).nullable().default(null),
  sources: sources.default([]),
}).strict();

/** Successful publication and processed sources have one atomic write path. */
export const IssuePatchSchema = z.object({
  threadId: IdSchema.nullable().optional(),
  headline: IssueSchema.shape.headline.optional(),
  metrics: z.array(MetricSchema).max(6).optional(),
  details: z.string().max(100_000).optional(),
  recovery: z.enum(["retry", "reconnect", "upgrade"]).nullable().optional(),
  readAt: timestamp.nullable().optional(),
  state: z.enum(["collecting", "failed"]).optional(),
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
