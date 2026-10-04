import type { PluginComposerApi } from "@get-bb/plugin-sdk/app";
import { expect, it, vi } from "vitest";
import type { Action, Item } from "./model.js";
import { insertActionMention, pendingLabel } from "./presentation.js";

function pending(action: Action, label?: string): Item {
  return { id: "switch", threadId: "thr_test", revision: 2, state: "pending", result: null, updatedAt: "2026-10-04T10:00:00Z",
    attempt: { id: "ea45f71a-c216-4da4-a226-65736f4eccfd", action, claimed: false },
    content: { type: "decide", question: "Switch your digests?", consequence: "Use Digests", yesLabel: label, noLabel: label },
  };
}

it.each([
  ["Switch", "Switching…"], ["Archive email", "Archiving…"], ["Approve", "Approving…"],
  ["Constructor", "Constructoring…"], ["Retry", "Retrying…"], ["Run", "Running…"], ["Agree", "Agreeing…"],
  ["Yes, archive", "Archiving…"], ["Yes", "Sending…"], ["👍", "Sending…"],
])("uses the chosen button's verb: %s", (label, expected) => {
  expect(pendingLabel(pending("yes", label))).toBe(expected);
  expect(pendingLabel(pending("no", label))).toBe(expected);
});

it.each<[Action, string]>([["send", "Sent"], ["yes", "Check"], ["no", "X"], ["later", "Clock"], ["skip", "inline-action-cards/skip-forward"], ["save-draft", "FileText"]])("adds the %s icon without losing draft or mention metadata", (action, icon) => {
  const existing = { from: 0, to: 4, label: "Docs", kind: "plugin", pluginId: "docs", provider: "doc", id: "one", icon: "File" };
  const inserted = { from: 5, to: 25, label: "Switch your digests?", kind: "plugin", pluginId: "installed-card-id", provider: "action", id: "ref", icon: null as string | null };
  const original = { text: "Docs Switch your digests?", mentions: [existing, inserted], attachments: [{ path: "/draft.txt" }] };
  let draft = original;
  const composer = {
    insertMention: vi.fn(),
    replace: (update: (current: typeof draft) => typeof draft) => { draft = update(draft); },
  };
  insertActionMention(composer as unknown as PluginComposerApi, pending(action, "Switch"));
  expect(composer.insertMention).toHaveBeenCalledWith({ provider: "action", id: "thr_test:switch:ea45f71a-c216-4da4-a226-65736f4eccfd", label: "Switch your digests" });
  expect(draft).toEqual({ ...original, mentions: [existing, { ...inserted, icon }] });
  expect(original.mentions[1]!.icon).toBeNull();
});

it("keeps change requests and older composers usable", () => {
  const insertMention = vi.fn();
  const replace = vi.fn((update) => expect(update({ mentions: [{ icon: null }] }).mentions[0].icon).toBe("Edit"));
  const item = { ...pending("yes"), state: "ready" as const, attempt: null };
  insertActionMention({ insertMention, replace } as unknown as PluginComposerApi, item, true);
  insertActionMention({ insertMention } as unknown as PluginComposerApi, item, true);
  expect(insertMention).toHaveBeenLastCalledWith({ provider: "action", id: "thr_test:switch:changes", label: "Switch your digests" });
});

it("trims trailing question marks and whitespace only in the inserted pill", () => {
  const item = pending("yes", "Switch");
  if (item.content.type !== "decide") throw new Error("Expected a decision");
  item.content.question = "Keep A? Switch B??  ";
  const insertMention = vi.fn();
  insertActionMention({ insertMention } as unknown as PluginComposerApi, item);
  expect(insertMention.mock.calls[0]![0].label).toBe("Keep A? Switch B");
  expect(item.content.question).toBe("Keep A? Switch B??  ");
});
