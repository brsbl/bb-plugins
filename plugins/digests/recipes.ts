import type { DigestDefinition } from "./model";

export type DigestRecipe = Pick<DigestDefinition, "id" | "name" | "emoji" | "instructions" | "connectionIds" | "schedule">;

const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

/** Starters contain editable intent only. Collection mechanics live in prompts.ts and the agent skill. */
export const DIGEST_RECIPES: DigestRecipe[] = [
  {
    id: "unread-email", name: "Unread email", emoji: "📬", connectionIds: ["gmail"],
    schedule: { cron: "0 10 * * 1-5", timezone },
    instructions: "Review my unread email from the last day, including the weekend on Mondays. Highlight urgent deadlines and messages that need a reply or decision. Summarize routine updates separately.",
  },
  {
    id: "money", name: "Money", emoji: "💰", connectionIds: ["gmail"],
    schedule: { cron: "0 10 * * 1", timezone },
    instructions: "Review my receipts, bills, and account notices from the past week. Highlight payments or upcoming bills that need attention, summarize spending by category, and note subscription changes. Never show full card or account numbers.",
  },
  {
    id: "reading", name: "Reading", emoji: "📚", connectionIds: ["gmail"],
    schedule: { cron: "0 11 * * 0", timezone },
    instructions: "Read my unread newsletters for me so I don't have to. First list anything I must act on or decide, if any. Then give the key takeaways from each newsletter. Don't recommend what to read. Skip anything that's just a promotion.",
  },
  {
    id: "x-scorecard", name: "X scorecard", emoji: "📊", connectionIds: ["x"], schedule: null,
    instructions: "Summarize how my posts performed this week: follower changes, top posts, impressions, and profile visits compared with the previous week. Suggest one thing to try next.",
  },
];
