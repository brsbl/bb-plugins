import { defineRpcContract } from "@get-bb/plugin-sdk";
import { z } from "zod";

export const statusSchema = z.object({ configured: z.boolean(), connected: z.boolean(), customerSelected: z.boolean(), downloadsSelected: z.boolean(), readOnly: z.literal(true) });
export const rpcContract = defineRpcContract({
  status: { input: z.object({}).strict(), output: statusSchema },
  connectStart: { input: z.object({}).strict(), output: z.object({ authUrl: z.string() }) },
  connectFinish: { input: z.object({ redirectUrl: z.string().max(8192) }).strict(), output: statusSchema },
  disconnect: { input: z.object({}).strict(), output: statusSchema },
});
const brief = z.string().trim().min(1).max(3000);
export const proposalSchema = z.object({
  title: z.string().trim().min(1).max(200).regex(/^[^\r\n]+$/),
  what: brief, whyNow: brief, options: z.array(brief).min(2).max(6), recommendation: brief, next: brief,
}).strict().refine(p => JSON.stringify(p).length < 16_000, "Keep the brief under 16,000 characters.");
export function decisionCard(p: z.infer<typeof proposalSchema>) {
  return { type: "decide" as const, question: p.title,
    consequence: "Approval records your decision. You make the change in Google Ads; bb does not apply it.",
    yesLabel: "I'll make this change", noLabel: "Keep as is",
    context: `**What this is:** ${p.what}\n\n**Why now:** ${p.whyNow}\n\n**Options:**\n${p.options.map(s => `- ${s}`).join("\n")}\n\n**Recommendation:** ${p.recommendation}\n\n**What happens next:** ${p.next}\n\n**Manual change only:** If approved, brsbl makes the change at https://ads.google.com/. The agent may record the decision and later read the account to verify it. Approval never authorizes an API write or browser automation. Declining leaves the account as it is.` };
}
