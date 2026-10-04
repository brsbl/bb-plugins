import type { DigestDefinition } from "./model.js";

const defaults: Record<string, string> = {
  "unread-email": "📬", money: "💰", reading: "📚", "x-scorecard": "📊", linkedin: "🤝",
};

export function digestEmoji(definition: Pick<DigestDefinition, "id" | "emoji" | "connectionIds">): string {
  return definition.emoji ?? defaults[definition.id]
    ?? (definition.connectionIds.includes("linkedin") ? "🤝" : definition.id.startsWith("digest-") ? "📰" : "");
}
