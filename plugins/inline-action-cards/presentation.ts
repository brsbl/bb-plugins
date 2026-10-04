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
  insertMention(composer, item, mentionId(item, changes), changes ? "Edit" : actionIcons[item.attempt!.action]);
}

export function insertCommentMention(composer: PluginComposerApi, item: Item, commentId: string): void {
  insertMention(composer, item, `${item.threadId}:${item.id}:comment_${commentId}`, "MessageSquare");
}

function insertMention(composer: PluginComposerApi, item: Item, id: string, icon: string): void {
  composer.insertMention({ provider: "action", id, label: title(item).replace(/[?\s]+$/, "") });
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

export function appendActionNote(composer: PluginComposerApi, item: Item): void {
  if (item.attempt?.note) composer.updateText((value) => `${value} — ${item.attempt!.note}`);
}

// Once the request leaves the composer the buttons are done; the card shows what was sent.
export function sentStatus(item: Item): { label: string; time: string } | null {
  const attempt = item.attempt;
  if (item.state !== "pending" || !attempt || !(attempt.sentAt || attempt.claimed)) return null;
  const label = attempt.action === "send" ? "Approved to send" : `${actionLabel(item, attempt.action)} sent`;
  // Older records were claimed before sentAt existed.
  return { label, time: attempt.sentAt ?? item.updatedAt };
}
