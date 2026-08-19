import type { CompactComposerValue } from "@get-bb/plugin-sdk/app";

const DRAFT_TTL = 24 * 60 * 60 * 1_000;

export type TimelineCommentComposerValue = CompactComposerValue;

export function emptyCommentValue(): TimelineCommentComposerValue {
  return { text: "", mentions: [] };
}

function isMention(value: unknown): value is CompactComposerValue["mentions"][number] {
  if (typeof value !== "object" || value === null) return false;
  const mention = value as Record<string, unknown>;
  return (
    Number.isInteger(mention.from) &&
    Number.isInteger(mention.to) &&
    typeof mention.provider === "string" &&
    typeof mention.id === "string" &&
    typeof mention.label === "string"
  );
}

function parseValue(value: unknown): TimelineCommentComposerValue | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.text !== "string" ||
    !Array.isArray(candidate.mentions) ||
    !candidate.mentions.every(isMention)
  ) {
    return null;
  }
  return {
    text: candidate.text,
    mentions: candidate.mentions.map((mention) => ({ ...mention })),
  };
}

export function readCommentDraft(
  key: string,
): TimelineCommentComposerValue | null {
  const saved = sessionStorage.getItem(key);
  if (saved === null) return null;
  try {
    const parsed = JSON.parse(saved) as {
      value?: unknown;
      body?: unknown;
      expiresAt?: unknown;
    };
    if (typeof parsed.expiresAt !== "number" || parsed.expiresAt <= Date.now()) {
      throw new Error("Expired draft");
    }
    const value = parseValue(parsed.value);
    if (value !== null) return value;
    // Drafts written by every pre-CompactComposer release stored only `body`.
    if (typeof parsed.body === "string") {
      return { text: parsed.body, mentions: [] };
    }
  } catch {
    // Invalid or expired drafts are discarded below.
  }
  sessionStorage.removeItem(key);
  return null;
}

export function writeCommentDraft(
  key: string,
  value: TimelineCommentComposerValue,
): void {
  if (value.text.trim() === "") {
    sessionStorage.removeItem(key);
    return;
  }
  sessionStorage.setItem(
    key,
    JSON.stringify({ value, expiresAt: Date.now() + DRAFT_TTL }),
  );
}

export function trimCommentValue(
  value: TimelineCommentComposerValue,
): TimelineCommentComposerValue {
  const leadingWhitespace = value.text.length - value.text.trimStart().length;
  const text = value.text.trim();
  const end = leadingWhitespace + text.length;
  return {
    text,
    mentions: value.mentions
      .filter(
        (mention) =>
          mention.from >= leadingWhitespace && mention.to <= end,
      )
      .map((mention) => ({
        ...mention,
        from: mention.from - leadingWhitespace,
        to: mention.to - leadingWhitespace,
      })),
  };
}

export function commentValuesEqual(
  left: TimelineCommentComposerValue,
  right: TimelineCommentComposerValue,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
