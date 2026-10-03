import type { DigestDefinition } from "./model";

export type DigestRecipe = Pick<DigestDefinition, "id" | "name" | "instructions" | "connectionIds" | "schedule">;

/** Starters contain editable intent only. Collection mechanics live in prompts.ts and the agent skill. */
export const DIGEST_RECIPES: DigestRecipe[] = [
  {
    id: "unread-email", name: "Unread email", connectionIds: ["gmail"],
    schedule: { cron: "0 10 * * 1-5", timezone: "America/Los_Angeles" },
    instructions: "Unread emails that need a reply or a decision. Alerts first. Skip advisory and recruiting.",
  },
  {
    id: "money", name: "Money", connectionIds: ["gmail"],
    schedule: { cron: "0 10 * * 1", timezone: "America/Los_Angeles" },
    instructions: "Failed payments, bills due soon, last week's spending, and checks to deposit.",
  },
  {
    id: "reading", name: "Reading", connectionIds: ["gmail"],
    schedule: { cron: "0 11 * * 0", timezone: "America/Los_Angeles" },
    instructions: "My unread newsletters: the 3 worth reading in full, one line on the rest.",
  },
  {
    id: "x-scorecard", name: "X scorecard", connectionIds: ["x"], schedule: null,
    instructions: "How my posts performed this week, what worked, and one thing to try next.",
  },
];
