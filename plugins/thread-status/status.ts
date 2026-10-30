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

export const PRESETS: ReadonlyArray<{ label: string; tone: Tone; use: string }> = [
  { label: "Blocked", tone: "danger", use: "cannot continue without something outside this thread" },
  { label: "Failing", tone: "danger", use: "tests, CI, or the build are red" },
  { label: "Needs input", tone: "warning", use: "waiting on a user decision or answer" },
  { label: "In review", tone: "info", use: "work is done and under review" },
  { label: "Working", tone: "info", use: "actively implementing or investigating" },
  { label: "Passing", tone: "success", use: "tests and checks are green" },
  { label: "Done", tone: "success", use: "the thread's work is complete" },
  { label: "Paused", tone: "neutral", use: "intentionally on hold" },
];

export type StatusResult = { ok: true; label: string; tone: Tone } | { ok: false; error: string; hint: string };

export function resolveStatus(raw: string, tone: Tone | undefined): StatusResult {
  const label = normalizeLabel(raw);
  if (!label.ok) return { ok: false, error: label.error, hint: "Use 1-2 short words, for example \"Needs input\"." };
  const preset = PRESETS.find((candidate) => candidate.label.toLowerCase() === label.label.toLowerCase());
  if (preset) {
    if (tone !== undefined && tone !== preset.tone) {
      return {
        ok: false,
        error: `"${preset.label}" is a preset and is always ${preset.tone}`,
        hint: `Drop --tone, or use a custom label if ${tone} fits better.`,
      };
    }
    return { ok: true, label: preset.label, tone: preset.tone };
  }
  if (tone === undefined) {
    return {
      ok: false,
      error: `"${label.label}" is a custom label and needs --tone`,
      hint: `Pass --tone ${TONES.join("|")}, or use a preset (bb thread-status presets).`,
    };
  }
  return { ok: true, label: label.label, tone };
}
