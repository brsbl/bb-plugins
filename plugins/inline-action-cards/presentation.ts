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

export function pendingStatus(item: Item, now: number): string | null {
  if (item.state !== "pending" || !item.attempt) return null;
  if (!item.attempt.claimed) return now - Date.parse(item.updatedAt) >= 120_000 ? "Not picked up yet" : null;
  // Older pending records used updatedAt for the claim's timestamp.
  const since = Date.parse(item.attempt.claimedAt ?? item.updatedAt);
  if (!Number.isFinite(since)) return "Agent is working on it";
  const seconds = Math.max(0, Math.floor((now - since) / 1_000));
  const elapsed = seconds < 60 ? `${seconds} sec` : `${Math.floor(seconds / 60)} min`;
  return `Agent is working on it · ${elapsed}`;
}
