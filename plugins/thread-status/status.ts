import { z } from "zod";

export const TONES = ["neutral", "info", "success", "warning", "danger"] as const;
export type Tone = (typeof TONES)[number];

export const MAX_LABEL_LENGTH = 18;
export const MAX_LABEL_WORDS = 2;

export const toneSchema = z.enum(TONES);

export const statusSchema = z.object({
  label: z.string().min(1).max(MAX_LABEL_LENGTH),
  tone: toneSchema,
  updatedAt: z.number().int().nonnegative(),
});
export type ThreadStatus = z.infer<typeof statusSchema>;

export type LabelResult = { ok: true; label: string } | { ok: false; error: string };

export function normalizeLabel(raw: string): LabelResult {
  const label = raw.trim().replace(/\s+/g, " ");
  if (label.length === 0) return { ok: false, error: "status label is empty" };
  const words = label.split(" ").length;
  if (words > MAX_LABEL_WORDS) {
    return { ok: false, error: `status label must be 1-${MAX_LABEL_WORDS} words, got ${words}: "${label}"` };
  }
  if (label.length > MAX_LABEL_LENGTH) {
    return { ok: false, error: `status label must be at most ${MAX_LABEL_LENGTH} characters, got ${label.length}: "${label}"` };
  }
  return { ok: true, label };
}
