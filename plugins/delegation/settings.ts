import { z } from "zod";

// The plugin holds no standing rules of its own. Each setting resolves, in order:
// 1. a source: what the user's own instructions say (AGENTS.md, CLAUDE.md, their
//    skills, their memory), recorded with a quote by the delegation-defaults skill;
// 2. the user's override from Settings or `bb delegation set`;
// 3. a neutral fallback that defers to bb or the spawn skill.
// The skills read the result with `bb delegation settings --json`.

const count = (min: number, max: number) => z.number().int().min(min).max(max);

export const settingsSchema = z.object({
  provider: z.string(),
  model: z.string(),
  reasoningLevel: z.string(),
  qaProvider: z.string(),
  qaModel: z.string(),
  qaReasoningLevel: z.string(),
  avoidModels: z.string(),
  machine: z.string(),
  environment: z.enum(["", "worktree", "personal", "lead"]),
  section: z.string(),
  parentWorkers: z.boolean(),
  workerReportLines: count(1, 20),
  reportMaxBullets: count(1, 20),
  reportStyle: z.enum(["bullets", "prose"]),
  decisionsAsActionCards: z.boolean(),
  evidenceInline: z.boolean(),
  relayBatching: z.enum(["batch", "each"]),
  retryLimit: count(0, 10),
  mayArchiveOrStop: z.boolean(),
}).strict();

export type DelegationSettings = z.infer<typeof settingsSchema>;
export type SettingKey = keyof DelegationSettings;
export type SettingValue = DelegationSettings[SettingKey];

/** Used only when neither a source nor an override sets a value. Blank defers to bb or spawn. */
export const FALLBACKS: DelegationSettings = {
  provider: "",
  model: "",
  reasoningLevel: "",
  qaProvider: "",
  qaModel: "",
  qaReasoningLevel: "",
  avoidModels: "",
  machine: "",
  environment: "",
  section: "",
  parentWorkers: true,
  workerReportLines: 3,
  reportMaxBullets: 5,
  reportStyle: "bullets",
  decisionsAsActionCards: true,
  evidenceInline: true,
  relayBatching: "batch",
  retryLimit: 2,
  mayArchiveOrStop: false,
};

export const SETTING_KEYS = Object.keys(FALLBACKS) as SettingKey[];

export const overridesSchema = settingsSchema.partial();
export type SettingsOverrides = z.infer<typeof overridesSchema>;

export const sourceSchema = z.object({
  value: z.union([z.string(), z.number(), z.boolean()]),
  /** Where the rule lives, such as ~/.bb/AGENTS.md or skill:spawn. */
  source: z.string().min(1).max(300),
  /** The user's words that set it, quoted exactly. */
  quote: z.string().min(1).max(600),
  /** Optional: which other source disagrees and why this one wins. */
  note: z.string().max(400).optional(),
}).strict();
export type SettingSource = z.infer<typeof sourceSchema>;

export const originSchema = z.enum(["source", "override", "fallback"]);
export const resolvedSchema = z.object({
  value: z.union([z.string(), z.number(), z.boolean()]),
  origin: originSchema,
  source: z.string().optional(),
  quote: z.string().optional(),
  note: z.string().optional(),
  /** An override the user saved that a source outranks. */
  ignoredOverride: z.union([z.string(), z.number(), z.boolean()]).optional(),
});
export type Resolved = z.infer<typeof resolvedSchema>;

export const stateSchema = z.object({
  settings: settingsSchema,
  explain: z.record(z.string(), resolvedSchema),
  /** When an agent last read the user's instructions into sources; null if never. */
  checkedAt: z.number().nullable(),
});
export type DelegationState = z.infer<typeof stateSchema>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/**
 * Read stored overrides key by key, so a value another plugin version wrote
 * (an unknown key, or one this version no longer accepts) is skipped instead
 * of discarding every setting.
 */
export function readOverrides(stored: unknown): SettingsOverrides {
  if (!isRecord(stored)) return {};
  const result: Record<string, unknown> = {};
  for (const key of SETTING_KEYS) {
    if (!Object.hasOwn(stored, key)) continue;
    const parsed = settingsSchema.shape[key].safeParse(stored[key]);
    if (parsed.success) result[key] = parsed.data;
  }
  return result as SettingsOverrides;
}

/** Sources whose value is valid for their setting, keyed by setting. */
export function readSources(stored: unknown): { values: Partial<Record<SettingKey, SettingSource>>; checkedAt: number | null } {
  if (!isRecord(stored)) return { values: {}, checkedAt: null };
  const checkedAt = typeof stored.checkedAt === "number" ? stored.checkedAt : null;
  const values: Partial<Record<SettingKey, SettingSource>> = {};
  const raw = isRecord(stored.values) ? stored.values : {};
  for (const key of SETTING_KEYS) {
    const entry = sourceSchema.safeParse(raw[key]);
    if (entry.success && settingsSchema.shape[key].safeParse(entry.data.value).success) values[key] = entry.data;
  }
  return { values, checkedAt };
}

export function resolve(storedOverrides: unknown, storedSources: unknown): DelegationState {
  const overrides = readOverrides(storedOverrides);
  const { values: sources, checkedAt } = readSources(storedSources);
  const settings = { ...FALLBACKS } as Record<SettingKey, SettingValue>;
  const explain: Record<string, Resolved> = {};
  for (const key of SETTING_KEYS) {
    const source = sources[key];
    const override = overrides[key];
    if (source) {
      settings[key] = source.value as SettingValue;
      explain[key] = {
        value: source.value, origin: "source", source: source.source, quote: source.quote,
        ...(source.note ? { note: source.note } : {}),
        ...(override !== undefined && override !== source.value ? { ignoredOverride: override } : {}),
      };
    } else if (override !== undefined) {
      settings[key] = override;
      explain[key] = { value: override, origin: "override" };
    } else {
      explain[key] = { value: FALLBACKS[key], origin: "fallback" };
    }
  }
  return { settings: settings as DelegationSettings, explain, checkedAt };
}

/** Coerce a CLI string to the setting's type, then validate it. */
export function parseSettingValue(key: SettingKey, raw: string): SettingsOverrides {
  const current = FALLBACKS[key];
  const value = typeof current === "boolean"
    ? raw === "true" || raw === "on" ? true : raw === "false" || raw === "off" ? false : raw
    : typeof current === "number" ? Number(raw) : raw;
  return overridesSchema.parse({ [key]: value });
}

export function isSettingKey(value: string): value is SettingKey {
  return Object.hasOwn(FALLBACKS, value);
}

/** Realtime channel the form listens on for saves from the CLI or another window. */
export const CHANGED = "settings-changed";
