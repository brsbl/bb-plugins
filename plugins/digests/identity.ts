/** A missing emoji in an older definition keeps a useful display default. */
export function defaultDigestEmoji(connectionId?: string): string {
  return ({ gmail: "📬", x: "📈", linkedin: "💼" } as Record<string, string>)[connectionId ?? ""] ?? "📰";
}

export function digestEmoji(definition: { id: string; emoji?: string; connectionIds: string[] }): string {
  return definition.emoji ?? ({ "unread-email": "📬", money: "💵", reading: "📚", "x-scorecard": "📈" } as Record<string, string>)[definition.id] ?? defaultDigestEmoji(definition.connectionIds[0]);
}
