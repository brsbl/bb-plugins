import data from "@emoji-mart/data/sets/15/native.json";

export interface Emoji {
  id: string;
  name: string;
  keywords: string[];
  skins: { native: string; unified: string }[];
}

const catalog: { emojis: Record<string, Emoji>; categories: { id: string; emojis: string[] }[]; aliases: Record<string, string> } = data;
export const emojis = catalog.emojis;
export const categories = [
  { id: "people", label: "Smileys & people", icon: "Smile" },
  { id: "nature", label: "Animals & nature", icon: "Leaf" },
  { id: "foods", label: "Food & drink", icon: "Coffee" },
  { id: "activity", label: "Activities", icon: "Trophy" },
  { id: "places", label: "Travel & places", icon: "Plane" },
  { id: "objects", label: "Objects", icon: "Lightbulb" },
  { id: "symbols", label: "Symbols", icon: "Heart" },
  { id: "flags", label: "Flags", icon: "Flag" },
];
export const tones = ["Default", "Light", "Medium-light", "Medium", "Medium-dark", "Dark"];
export const toneSamples = ["👋", "👋🏻", "👋🏼", "👋🏽", "👋🏾", "👋🏿"];

function normalize(value: string): string {
  return value.toLocaleLowerCase("en").replace(/[:_-]/g, " ").trim();
}

const aliases = new Map<string, string[]>();
for (const [alias, id] of Object.entries(catalog.aliases)) {
  aliases.set(id, [...(aliases.get(id) ?? []), alias]);
}
const searchIndex = Object.values(emojis).map((emoji) => ({
  emoji,
  text: normalize([emoji.id, emoji.name, ...emoji.keywords, ...(aliases.get(emoji.id) ?? [])].join(" ")),
}));

export function searchEmojis(query: string): Emoji[] {
  const normalized = normalize(query);
  const terms = normalized.split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  return searchIndex
    .filter(({ emoji, text }) => terms.every((term) => text.includes(term)) || emoji.skins.some((skin) => skin.native === query.trim()))
    .sort((a, b) => Number(normalize(b.emoji.id) === normalized) - Number(normalize(a.emoji.id) === normalized))
    .map(({ emoji }) => emoji);
}

export function categoryEmojis(id: string): Emoji[] {
  return (catalog.categories.find((category) => category.id === id)?.emojis ?? []).flatMap((key) => emojis[key] ? [emojis[key]] : []);
}

export function nativeEmoji(emoji: Emoji, tone: number): string {
  return (emoji.skins[tone] ?? emoji.skins[0]).native;
}

export interface Preferences {
  tone: number;
  recent: string[];
}
export const storageKey = "bb:emoji-picker:preferences:v1";
export const defaultPreferences: Preferences = { tone: 0, recent: [] };

export function parsePreferences(raw: string | null): Preferences {
  try {
    const value: unknown = JSON.parse(raw ?? "null");
    if (!value || typeof value !== "object") return defaultPreferences;
    const { tone, recent } = value as Record<string, unknown>;
    return {
      tone: typeof tone === "number" && Number.isInteger(tone) && tone >= 0 && tone < tones.length ? tone : 0,
      recent: Array.isArray(recent) ? [...new Set(recent.filter((id): id is string => typeof id === "string" && Object.hasOwn(emojis, id)))].slice(0, 24) : [],
    };
  } catch {
    return defaultPreferences;
  }
}

export function readPreferences(): Preferences {
  try {
    return parsePreferences(localStorage.getItem(storageKey));
  } catch {
    return defaultPreferences;
  }
}
