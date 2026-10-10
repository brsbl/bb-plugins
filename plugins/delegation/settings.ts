import { z } from "zod";

// The skills never restate these values; they read the effective ones with
// `bb delegation settings --json`. Defaults are brsbl's standing rules.

const count = (min: number, max: number) => z.number().int().min(min).max(max);

export const settingsSchema = z.object({
  provider: z.string().min(1),
  model: z.string(),
  reasoningLevel: z.string(),
  qaModel: z.string().min(1),
  machine: z.string(),
  environment: z.enum(["worktree", "personal", "lead"]),
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

export const DEFAULTS: DelegationSettings = {
  provider: "claude-code",
  model: "",
  reasoningLevel: "",
  qaModel: "cheapest",
  machine: "",
  environment: "worktree",
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

export const SETTING_KEYS = Object.keys(DEFAULTS) as SettingKey[];

export const overridesSchema = settingsSchema.partial();
export type SettingsOverrides = z.infer<typeof overridesSchema>;

/**
 * Read stored overrides key by key, so a value another plugin version wrote
 * (an unknown key, or one this version no longer accepts) is skipped instead
 * of discarding every setting.
 */
export function readOverrides(stored: unknown): SettingsOverrides {
  if (stored === null || typeof stored !== "object" || Array.isArray(stored)) return {};
  const result: Record<string, unknown> = {};
  for (const key of SETTING_KEYS) {
    if (!Object.hasOwn(stored, key)) continue;
    const parsed = settingsSchema.shape[key].safeParse((stored as Record<string, unknown>)[key]);
    if (parsed.success) result[key] = parsed.data;
  }
  return result as SettingsOverrides;
}

export function effectiveSettings(stored: unknown): DelegationSettings {
  return { ...DEFAULTS, ...readOverrides(stored) };
}

/** Coerce a CLI string to the setting's type, then validate it. */
export function parseSettingValue(key: SettingKey, raw: string): SettingsOverrides {
  const current = DEFAULTS[key];
  const value = typeof current === "boolean"
    ? raw === "true" || raw === "on" ? true : raw === "false" || raw === "off" ? false : raw
    : typeof current === "number" ? Number(raw) : raw;
  return overridesSchema.parse({ [key]: value });
}

export function isSettingKey(value: string): value is SettingKey {
  return Object.hasOwn(DEFAULTS, value);
}

/** Realtime channel the form listens on for saves from the CLI or another window. */
export const CHANGED = "settings-changed";
