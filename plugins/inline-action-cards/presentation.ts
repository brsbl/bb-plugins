import type { PluginComposerApi } from "@get-bb/plugin-sdk/app";
import { actionLabel, mentionId, title, type Action, type Item } from "./model.js";

const actionIcons: Record<Action, string> = {
  send: "Sent", "save-draft": "FileText", yes: "Check", no: "X", later: "Clock", skip: "inline-action-cards/skip-forward",
};

// SDK 0.6.16's published replace(updater) supports mention icons. Keep the
// repository's 0.5.9 SDK/build pin and old hosts working; only narrow the fields
// this optional capability reads. All other draft/mention data passes through.
// Published source: get-bb/bb@cd12e7a9dfb372432cd748eafcd73d142e15c16f.
// API introduced by PR #4474; no new SDK contract or higher host minimum.
type IconDraft = { mentions: readonly { icon?: string | null }[] };
type IconComposer = PluginComposerApi & {
  replace?: (update: (draft: IconDraft) => IconDraft) => void;
};

export function insertActionMention(composer: PluginComposerApi, item: Item, changes = false): void {
  composer.insertMention({ provider: "action", id: mentionId(item, changes), label: title(item).replace(/[?\s]+$/, "") });
  const icon = changes ? "Edit" : actionIcons[item.attempt!.action];
  // insertMention appends the new pill; retain the host-assigned plugin identity,
  // ranges and surrounding draft rather than reconstructing a mention resource.
  (composer as IconComposer).replace?.((draft) => ({
    ...draft,
    mentions: draft.mentions.map((mention, index) => index === draft.mentions.length - 1 ? { ...mention, icon } : mention),
  }));
}

export function pendingLabel(item: Item, action = item.attempt?.action): string {
  if (!action || action === "send") return "Sending…";
  if (action === "save-draft") return "Saving to Gmail…";
  if (action === "later") return "Deferring…";
  if (action === "skip") return "Skipping…";
  const verb = actionLabel(item, action).trim().replace(/^(?:yes|no)[,!:]?\s+/i, "").match(/^[a-z]+\b/i)?.[0]?.toLowerCase();
  if (!verb || /^(yes|no|ok|okay|sure|sounds)$/.test(verb)) return "Sending…";
  const irregular: Record<string, string> = { be: "being", do: "doing", die: "dying", lie: "lying", tie: "tying", run: "running", stop: "stopping", skip: "skipping", pin: "pinning", plan: "planning", get: "getting", set: "setting", put: "putting", let: "letting", begin: "beginning" };
  const ongoing = (Object.hasOwn(irregular, verb) ? irregular[verb] : undefined) ?? (verb.endsWith("e") && !/(ee|ye|oe)$/.test(verb) ? `${verb.slice(0, -1)}ing` : `${verb}ing`);
  return `${ongoing[0]!.toUpperCase()}${ongoing.slice(1)}…`;
}

const clock = (at: number | string) => new Date(at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

// Once the request leaves the composer the buttons are done; the card shows what was sent.
export function sentStatus(item: Item): { label: string; time: string | null; queued: boolean } | null {
  const attempt = item.attempt;
  if (item.state !== "pending" || !attempt || !(attempt.queued || attempt.sentAt || attempt.claimed)) return null;
  const choice = attempt.action === "send" ? "Send request" : actionLabel(item, attempt.action);
  if (attempt.queued) return { label: `${choice} queued${attempt.sendAt ? ` · sends ${clock(attempt.sendAt)}` : ""}`, time: null, queued: true };
  // Older records were claimed before sentAt existed.
  return { label: `${choice} sent`, time: attempt.sentAt ?? item.updatedAt, queued: false };
}

// The composer's Send later presets.
export function sendLaterOptions(now = new Date()): { label: string; at: number }[] {
  const at = (days: number, hour: number) => { const date = new Date(now); date.setDate(date.getDate() + days); date.setHours(hour, 0, 0, 0); return date.getTime(); };
  const minutes = (count: number) => now.getTime() + count * 60_000;
  return [
    { label: "In 30 minutes", at: minutes(30) }, { label: "In 1 hour", at: minutes(60) }, { label: "In 2 hours", at: minutes(120) },
    { label: "This evening", at: at(0, 18) }, { label: "Tomorrow morning", at: at(1, 9) },
  ].filter((option) => option.at > now.getTime());
}
