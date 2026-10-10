import { defineRpcContract } from "@get-bb/plugin-sdk";
import { z } from "zod";

export const RINGS_CHANNEL = "rings";
export const RING_KEY_MAX_LENGTH = 256;
export const RINGS_MAX = 200;

export const hexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/u)
  .transform((value) => value.toLowerCase());

export const ringSchema = z
  .object({ from: hexColorSchema, to: hexColorSchema.nullable() })
  .strict();
export type Ring = z.infer<typeof ringSchema>;

export const ringSettingSchema = z.union([ringSchema, z.literal("none")]);
export type RingSetting = z.infer<typeof ringSettingSchema>;

export const ringKeySchema = z.string().min(1).max(RING_KEY_MAX_LENGTH);
export const ringsSchema = z.record(ringKeySchema, ringSettingSchema);
export type Rings = z.infer<typeof ringsSchema>;

export const ringsContract = defineRpcContract({
  listRings: { input: z.null(), output: ringsSchema },
  setRing: {
    input: z
      .object({ key: ringKeySchema, ring: ringSettingSchema.nullable() })
      .strict(),
    output: ringsSchema,
  },
});

export const RING_PRESETS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
] as const;

export function withRing(
  rings: Rings,
  key: string,
  ring: RingSetting | null,
): Rings {
  const next: Rings = { ...rings };
  if (ring === null) delete next[key];
  else next[key] = ring;
  if (Object.keys(next).length > RINGS_MAX)
    throw new Error(`At most ${RINGS_MAX} server rings can be saved.`);
  return next;
}

export function ringBackground(ring: Ring): string {
  return ring.to === null
    ? ring.from
    : `linear-gradient(135deg, ${ring.from}, ${ring.to})`;
}

export function parseRingArgs(colors: readonly string[]): Ring {
  if (colors.length < 1 || colors.length > 2)
    throw new Error("Give one color, or two for a gradient.");
  const parsed = ringSchema.safeParse({
    from: colors[0],
    to: colors[1] ?? null,
  });
  if (!parsed.success)
    throw new Error("Colors must be hex values such as #3b82f6.");
  return parsed.data;
}

export function defaultRings(keys: readonly string[]): Map<string, Ring> {
  const count = RING_PRESETS.length;
  return new Map(
    [...new Set(keys)].sort().map((key, index) => {
      const from = index % count;
      const gap = 2 + (Math.floor(index / count) % (count - 2));
      return [
        key,
        { from: RING_PRESETS[from]!, to: RING_PRESETS[(from + gap) % count]! },
      ];
    }),
  );
}

export function resolveRing(
  rings: Rings,
  key: string,
  fallback: Ring | null,
): Ring | null {
  const setting = rings[key];
  if (setting === "none") return null;
  if (setting !== undefined) return setting;
  return fallback;
}

export function describeRing(setting: RingSetting): string {
  if (setting === "none") return "none";
  return `${setting.from}${setting.to === null ? "" : ` → ${setting.to}`}`;
}
