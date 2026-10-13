import type { DigestDefinition } from "./model";

export type DigestRecipe = Pick<DigestDefinition, "id" | "name" | "emoji" | "instructions" | "connectionIds" | "schedule">;

/** Starters contain editable intent only. Collection mechanics live in prompts.ts and the agent skill. */
export const DIGEST_RECIPES: DigestRecipe[] = [
  {
    id: "unread-email", name: "Unread email", emoji: "📬", connectionIds: ["gmail"],
    schedule: { cron: "0 10 * * 1-5", timezone: "America/Los_Angeles" },
    instructions: "Go through my unread email from the last day (the whole weekend on Mondays). Start with anything urgent: security alerts, failed payments, or anything due today. Then tell me who needs a reply, what they want, and how soon, putting people I know first. Then list quick yes/no decisions. Sum up everything else in one line. Skip advisory and expert-network requests and recruiters, and just count them.",
  },
  {
    id: "money", name: "Money", emoji: "💰", connectionIds: ["gmail"],
    schedule: { cron: "0 10 * * 1", timezone: "America/Los_Angeles" },
    instructions: "Look at my receipts, bills and account emails from the past week. First tell me anything I need to act on: failed or declined payments, bills or autopay due in the next 10 days, documents my accountant asked for, checks or refunds to deposit, and changed subscriptions. Then show what I spent by type (food delivery, shopping, transfers, subscriptions) with totals, and flag anything unusually large. End with one line on investment and retirement notices. Never show full card or account numbers.",
  },
  {
    id: "reading", name: "Reading", emoji: "📚", connectionIds: ["gmail"],
    schedule: { cron: "0 11 * * 0", timezone: "America/Los_Angeles" },
    instructions: "Go through my unread newsletters. Pick the 3 most worth reading in full for someone building bb, an agentic IDE, and say in one line why each matters. Then give one useful takeaway from each of the rest, grouped by newsletter. Skip anything that's just a promotion.",
  },
  {
    id: "x-scorecard", name: "X scorecard", emoji: "📊", connectionIds: ["x"], schedule: null,
    instructions: "How my posts did this week: followers and net follows against my usual pace, my top post and why it worked, impressions and profile visits compared with last week, and one thing to try next.",
  },
];
