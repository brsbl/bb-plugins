import { z } from "zod";
export const scopes = ["channels:read", "channels:history", "groups:read", "groups:history", "search:read", "chat:write"];
export const channelId = z.string().regex(/^[CG][A-Z0-9]{5,}$/);
export const timestamp = z.string().regex(/^\d{10,}\.\d{6}$/);
export const tokenSchema = z.string().trim().max(500).regex(/^xoxp-[A-Za-z0-9-]+$/, "Use a Slack User OAuth Token in the masked Connect form.");
export const identitySchema = z.object({ team_id: z.string(), user_id: z.string(), team: z.string(), user: z.string() });
export type Identity = z.infer<typeof identitySchema>;
