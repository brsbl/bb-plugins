/** Join class names, skipping falsy parts. Callers never pass conflicting utilities, so no merge step is needed. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
