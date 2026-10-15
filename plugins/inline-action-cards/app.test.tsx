// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { loadPluginApp, renderSlot } from "@get-bb/plugin-sdk/testing/app";
import { afterEach, expect, it, vi } from "vitest";
import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import plugin from "./server.js";
import type { BbPluginApi } from "@get-bb/plugin-sdk";
import type { Item } from "./model.js";
const submittedMessages: string[] = [];
const submittedMentions: { provider: string; id: string; label: string }[] = [];
function recordSend(request: Parameters<BbPluginApi["sdk"]["threads"]["send"]>[0]) {
  const parts = request.input.filter((part) => part.type === "text");
  submittedMessages.push(parts.map((part) => part.text).join("\n"));
  for (const part of parts) for (const { resource } of part.mentions ?? []) {
    if (resource.kind === "plugin") submittedMentions.push({ provider: "action", id: resource.itemId.slice("action:".length), label: resource.label });
  }
  return { ok: true as const, delivery: "sent" as const };
}
function recordingHost() { return createFakePluginHost({ pluginId: "inline-action-cards", sdk: { threads: { send: recordSend } } }); }
// Keep the UI fixtures small, but run their dispatch through the real server handler.
async function dispatchFixture(items: Item[]): Promise<Item[]> {
  const host = recordingHost(); plugin(host.bb);
  try {
    for (const item of items) host.bb.storage.database().prepare("INSERT INTO action_items VALUES (?, ?, ?)").run(item.threadId, item.id, JSON.stringify(item));
    return await host.harness.behavior.callRpc("dispatch", { threadId: items[0]!.threadId, entries: items.map((item) => ({ kind: "action", id: item.id, attemptId: item.attempt!.id })) }) as Item[];
  } finally { await host.harness.lifecycle.dispose(); }
}
const fixture = (): Item => ({ id: "esc-1", threadId: "thr_test", revision: 1, state: "ready", attempt: null, result: null, updatedAt: "2026-10-01T10:42:00Z", content: { type: "reply", summary: "Billing follow-up", subject: "Missing refund", to: ["billing@example.com"], cc: [], bcc: [], original: { from: "Billing", body: "Your refund is on its way." }, draft: "Original draft" } });
afterEach(() => { cleanup(); submittedMessages.length = 0; submittedMentions.length = 0; localStorage.clear(); });
// Radix tooltips measure their content; jsdom has no ResizeObserver.
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
// Answer a form field the way a person does: pick the radio, then press Submit.
function answer(label: RegExp | string, within_: HTMLElement = document.body) {
  fireEvent.click(within(within_).getByRole("radio", { name: label }));
}
function submit(within_: HTMLElement = document.body) {
  fireEvent.click(within(within_).getByRole("button", { name: /^Submit( \d+ answers?)?$/ }));
}
// After submitting, the drawer drops the item and says what was sent where.
const sent = (label: string) => screen.findByText(`Sent “${label}” to Billing`);
const source = { threadTitle: "Billing", threadProjectId: null };
const directiveProps = (id: string, threadId = "thr_test") => ({ attributes: { id }, source: `::action{id="${id}"}`, message: { id: "msg_1", threadId, turnId: null, projectId: null }, openWorkspaceFile: null });
// Open Waiting on you and the given item, the way a person does.
async function openItem(question: RegExp | string) {
  fireEvent.click(await screen.findByRole("button", { name: /^Waiting on you/ }));
  fireEvent.click(await screen.findByRole("button", { name: typeof question === "string" ? `Answer: ${question}` : question }));
  return screen.findByRole("form");
}
async function setup(composerText = "", saveFailure = false, initialItem = fixture(), beforeSubmitted?: Promise<void>, dispatchFailure = false) {
  let item = initialItem;
  const calls: string[] = [];
  const app = await loadPluginApp(() => import("./app.js"));
  const slot = renderSlot(app.composerCustomizations[0]!.banners![0]!, {}, {
    composer: { scope: { kind: "thread", threadId: "thr_test" }, text: composerText },
    rpc: {
      waiting: () => item.state === "ready" ? [{ ...item, ...source }] : [],
      get: () => ({ ...item, ...source }),
      save: (raw) => {
        const input = raw as { draft: string; revision: number };
        calls.push("save");
        if (saveFailure) throw new Error("Draft could not be saved. Retry.");
        item = { ...item, revision: item.revision + 1, content: { ...fixture().content, draft: input.draft } } as Item;
        return item;
      },
      choose: (raw) => {
        const input = raw as { choice: string; revision: number; note?: string };
        calls.push("choose"); expect(input.revision).toBe(item.revision);
        const option = item.content.type === "choice" ? item.content.options.find((candidate) => candidate.id === input.choice)! : null;
        item = { ...item, revision: item.revision + 1, state: "pending", attempt: { id: "ea45f71a-c216-4da4-a226-65736f4eccfd", action: "choose", claimed: false, note: input.note, choice: { id: option!.id, label: option!.label } } }; return item;
      },
      prepare: (raw) => {
        const input = raw as { action: "send"; revision: number; note?: string };
        calls.push("prepare"); expect(input.revision).toBe(item.revision);
        item = { ...item, revision: item.revision + 1, state: "pending", attempt: { id: "ea45f71a-c216-4da4-a226-65736f4eccfd", action: input.action, claimed: false, note: input.note } }; return item;
      },
      dispatch: async () => {
        if (dispatchFailure) throw new Error("Host disconnected");
        const sent = await dispatchFixture([item]);
        await beforeSubmitted;
        calls.push("submitted");
        item = sent[0]!;
        return sent;
      },
    },
  });
  await openItem(/^Answer: /);
  return { slot, calls, get: () => item, reportSuccess: async () => {
    item = { ...item, revision: item.revision + 1, state: "succeeded", result: { message: "Sent", retryable: false } };
    await slot.behavior.emitRealtime("items", {});
  } };
}
it("shows the brief in Waiting on you and opens the owning thread", async () => {
  const item = { ...fixture(), threadTitle: "Workflow Inbox", threadProjectId: "proj_origin", content: { ...fixture().content, context: "What this is: the Inbox plan.\n\nNext: I keep the draft open if declined." } };
  const app = await loadPluginApp(() => import("./app.js"));
  const slot = renderSlot(app.composerCustomizations[0]!.banners![0]!, {}, { rpc: { waiting: () => [item], get: () => item } });
  await openItem(/^Answer: /);
  await screen.findByText(/Next: I keep the draft open/);
  expect(screen.queryByRole("button", { name: "Show more" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Add note" })).toBeNull();
  expect(screen.getByText("Workflow Inbox")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: /Open thread/ }));
  expect(slot.inspection.navigateCalls).toContainEqual(expect.objectContaining({ method: "toThread", threadId: "thr_test" }));
});

it("shows a waiting card's brief in the Decision log before Review is opened", async () => {
  const item = { ...fixture(), threadTitle: "Workflow Inbox", threadProjectId: null, content: { ...fixture().content, context: "Why now: the planning lead needs your direction." } };
  const app = await loadPluginApp(() => import("./app.js"));
  renderSlot(app.navPanels[0]!, { subPath: "" }, { rpc: { log: () => ({ waiting: [item], done: [] }) } });
  await screen.findByText(/Why now: the planning lead/);
  expect(screen.getByRole("button", { name: "Review" }).getAttribute("aria-expanded")).toBe("false");
  expect(screen.getByText("Workflow Inbox")).toBeTruthy();
});

it("flushes an immediate edit before submitting Send exactly once", async () => {
  const { slot, calls, get } = await setup();
  fireEvent.change(screen.getByRole("textbox", { name: "Draft" }), { target: { value: "My latest edit" } });
  answer("Send");
  const button = screen.getByRole("button", { name: "Submit" });
  fireEvent.click(button);
  fireEvent.click(button);
  await waitFor(() => expect(calls).toEqual(["save", "prepare", "submitted"]));
  expect(submittedMessages).toHaveLength(1);
  expect(submittedMentions).toMatchObject([{ provider: "action", id: "thr_test:esc-1:ea45f71a-c216-4da4-a226-65736f4eccfd", label: "Billing follow-up" }]);
  expect(get().content).toMatchObject({ draft: "My latest edit" });
  expect(await sent("Send")).toBeTruthy();
  expect(screen.queryByRole("form")).toBeNull();
});
it("preserves an existing composer message", async () => {
  const { slot, calls } = await setup("Please also check another message");
  answer("Send");
  submit();
  await waitFor(() => expect(calls).toEqual(["prepare", "submitted"]));
  expect(slot.inspection.composer.text).toBe("Please also check another message");
  expect(slot.inspection.composer.submits).toHaveLength(0);
  expect(submittedMessages).toHaveLength(1);
});
it("replaces an obsolete local error when the agent reports success", async () => {
  const { reportSuccess } = await setup("", false, fixture(), undefined, true);
  answer("Send");
  submit();
  await screen.findByRole("alert");
  // Another client can complete the item while this view retains a local error.
  await reportSuccess();
  await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  expect(screen.queryByRole("form")).toBeNull();
});
it("keeps an unsaved edit visible and offers recovery without submitting", async () => {
  const { slot, calls } = await setup("", true);
  fireEvent.change(screen.getByRole("textbox", { name: "Draft" }), { target: { value: "Keep this edit" } });
  answer("Send");
  submit();
  await screen.findByRole("button", { name: "Retry save" });
  expect((screen.getByRole("textbox", { name: "Draft" }) as HTMLTextAreaElement).value).toBe("Keep this edit");
  expect(calls).toEqual(["save"]);
  expect(submittedMessages).toHaveLength(0);
  // Recovery buttons sit inside the card's form; clicking them must never submit the picked answer.
  let submits = 0;
  screen.getByRole("form").addEventListener("submit", () => { submits += 1; });
  fireEvent.click(screen.getByRole("button", { name: "Retry save" }));
  // Retrying clears the error until the save fails again and recovery controls return.
  fireEvent.click(await screen.findByRole("button", { name: "Load saved draft" }));
  expect(submits).toBe(0);
  await waitFor(() => expect((screen.getByRole("textbox", { name: "Draft" }) as HTMLTextAreaElement).value).toBe("Original draft"));
  expect(calls).toEqual(["save", "save"]);
  expect(submittedMessages).toHaveLength(0);
});

it("shows a card whose request never reached the agent as not sent, with Resend", async () => {
  let item: Item = { ...fixture(), revision: 3, state: "pending", attempt: { id: "ea45f71a-c216-4da4-a226-65736f4eccfd", action: "yes", claimed: false, note: "how do i test?" }, content: { type: "decide", question: "Merge PR #42?", consequence: "Squash-merge it.", yesLabel: "Merge" } };
  const app = await loadPluginApp(() => import("./app.js"));
  renderSlot(app.messageDirectives[0]!, directiveProps(item.id), { rpc: { get: () => item, dispatch: async () => { const next = await dispatchFixture([item]); item = next[0]!; return next; } } });
  expect(await screen.findByText(/Not sent: it didn't reach the agent\./)).toBeTruthy();
  expect(screen.getByText("Merge", { selector: ".ac-outcome-answer" })).toBeTruthy();
  expect(screen.getByText("“how do i test?”")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Resend" }));
  await waitFor(() => expect(submittedMessages).toHaveLength(1));
  expect(submittedMentions).toMatchObject([{ id: "thr_test:esc-1:ea45f71a-c216-4da4-a226-65736f4eccfd" }]);
});

it("keeps a prepared but unsent row in place with Resend", async () => {
  let items: Item[] = [
    { ...fixture(), id: "one", revision: 2, state: "pending", attempt: { id: "ea45f71a-c216-4da4-a226-65736f4eccfd", action: "yes", claimed: false }, content: { type: "decide", question: "Switch one?", consequence: "Keep schedules", yesLabel: "Switch" } },
    { ...fixture(), id: "two", content: { type: "decide", question: "Switch two?", consequence: "Keep schedules", yesLabel: "Switch" } },
  ];
  const app = await loadPluginApp(() => import("./app.js"));
  const slot = renderSlot(app.messageDirectives[1]!, { attributes: { id: "digests" }, source: '::actions{id="digests"}', message: { id: "msg_1", threadId: "thr_test", turnId: null, projectId: null }, openWorkspaceFile: null }, {
    composer: { scope: { kind: "thread", threadId: "thr_test" } },
    rpc: {
      table: () => ({ id: "digests", threadId: "thr_test", title: "Digests", ids: items.map((item) => item.id), items: items.map((item) => ({ ...item, followUps: [] })) }),
      get: (raw) => ({ ...items.find((item) => item.id === (raw as { id: string }).id)!, followUps: [] }),
      dispatch: async (raw) => {
        const ids = (raw as { entries: { id: string }[] }).entries.map((entry) => entry.id);
        const sent = await dispatchFixture(items.filter((item) => ids.includes(item.id)));
        items = items.map((item) => sent.find((next) => next.id === item.id) ?? item);
        return sent;
      },
    },
  });
  fireEvent.click(await screen.findByRole("button", { name: "Resend" }));
  await waitFor(() => expect(submittedMessages).toHaveLength(1));
  expect(submittedMentions).toMatchObject([{ id: "thr_test:one:ea45f71a-c216-4da4-a226-65736f4eccfd" }]);
  expect(await screen.findByText(/Sent\. Waiting for the agent\./)).toBeTruthy();
});

it("Decision log refresh updates the reviewed draft while preserving unsaved local edits", async () => {
  let item = { ...fixture(), threadTitle: "Refund follow-up", threadProjectId: "proj_cards" };
  const app = await loadPluginApp(() => import("./app.js"));
  const slot = renderSlot(app.navPanels[0]!, { subPath: "" }, { rpc: {
    log: () => ({ waiting: [item], done: [] }),
    save: () => { throw new Error("Offline: keep local changes"); },
  } });
  await screen.findByRole("button", { name: "Review" });
  fireEvent.click(screen.getByRole("button", { name: "Review" }));
  expect((screen.getByRole("textbox", { name: "Draft" }) as HTMLTextAreaElement).value).toBe("Original draft");
  item = { ...item, revision: 2, content: { ...item.content, draft: "Updated elsewhere" } } as typeof item;
  await slot.behavior.emitRealtime("items", {});
  await waitFor(() => expect((screen.getByRole("textbox", { name: "Draft" }) as HTMLTextAreaElement).value).toBe("Updated elsewhere"));
  fireEvent.change(screen.getByRole("textbox", { name: "Draft" }), { target: { value: "Unsaved local edit" } });
  item = { ...item, revision: 3, content: { ...item.content, draft: "Another remote update" } } as typeof item;
  await slot.behavior.emitRealtime("items", {});
  expect((screen.getByRole("textbox", { name: "Draft" }) as HTMLTextAreaElement).value).toBe("Unsaved local edit");
});

it("Decision log keeps failures and Later cards waiting, orders row controls with the primary last, and collapses Done", async () => {
  const entry = { threadTitle: "Refund follow-up", threadProjectId: "proj_cards" };
  const attempt = { id: "ea45f71a-c216-4da4-a226-65736f4eccfd", action: "send", claimed: true } as const;
  const failed = { ...fixture(), id: "esc-2", revision: 3, state: "failed", attempt, result: { message: "Reconnect Gmail", retryable: true }, ...entry } as const;
  const later = { ...fixture(), id: "esc-3", revision: 3, state: "succeeded", attempt: { ...attempt, action: "later" }, result: { message: "Later", retryable: false }, ...entry } as const;
  const decision = { ...fixture(), id: "merge-1", content: { type: "decide", question: "Merge the PR?", consequence: "Squash-merges it.", yesLabel: "Merge", noLabel: "Keep open" }, ...entry } as const;
  const oddLabel = { ...fixture(), id: "odd-1", content: { type: "decide", question: "Build it?", consequence: "Runs the build.", yesLabel: "Constructor run", noLabel: "toString" }, ...entry } as const;
  const done = Array.from({ length: 6 }, (_, index) => ({ ...fixture(), id: `sent-${index}`, revision: 3, state: "succeeded", attempt, result: { message: "Sent", retryable: false }, ...entry } as const));
  const app = await loadPluginApp(() => import("./app.js"));
  expect([app.navPanels[0]!.title, app.threadPanelActions[0]!.title]).toEqual(["Decision log", "Decision log"]);
  expect([app.navPanels[0]!.icon, app.threadPanelActions[0]!.icon]).toEqual(["inline-action-cards/action-log", "inline-action-cards/action-log"]);
  renderSlot(app.navPanels[0]!, { subPath: "" }, { rpc: { log: () => ({ waiting: [{ ...fixture(), ...entry }, failed, later, decision, oddLabel], done }) } });
  const waiting = await screen.findByRole("region", { name: "Waiting on you" });
  const [ready, failure, deferred, decide] = await within(waiting).findAllByRole("article");
  expect(within(decide!).getAllByRole("button").map((button) => button.getAttribute("aria-label"))).toEqual(["Review", "More actions", "Keep open", "Merge"]);
  // Labels that collide with Object.prototype keys fall back to the role icon instead of crashing the log.
  expect(within(waiting).getByRole("button", { name: "Constructor run" })).toBeTruthy();
  // Icon peers first, then secondary, with the primary always rightmost.
  expect(within(ready!).getAllByRole("button").map((button) => button.getAttribute("aria-label"))).toEqual(["Review", "More actions", "Comment", "Review and send"]);
  expect(within(failure!).getByRole("img", { name: "Failed" })).toBeTruthy();
  expect(within(failure!).getByText(/Reconnect Gmail/)).toBeTruthy();
  expect(within(failure!).getByRole("button", { name: "Review and retry" })).toBeTruthy();
  // A lone Open thread is its own button, never a one-item ⋯ menu.
  expect(within(failure!).queryByRole("button", { name: "More actions" })).toBeNull();
  expect(within(failure!).getByRole("button", { name: "Open thread" })).toBeTruthy();
  expect(within(deferred!).getByText("Later")).toBeTruthy();
  expect(within(deferred!).getAllByRole("button").map((button) => button.getAttribute("aria-label"))).toEqual(["Review", "Open thread", "Comment", "Resume"]);
  const doneGroup = screen.getByRole("region", { name: "Done" });
  expect(within(doneGroup).getAllByRole("article")).toHaveLength(5);
  expect(within(doneGroup).getAllByRole("button", { name: "More actions" })).toHaveLength(5);
  fireEvent.click(within(doneGroup).getByRole("button", { name: "Show all 6" }));
  expect(within(doneGroup).getAllByRole("article")).toHaveLength(6);
});

it("thread panel Decision log lists only its thread, drops thread names, and links to the full page", async () => {
  const calls: unknown[] = [];
  const app = await loadPluginApp(() => import("./app.js"));
  const slot = renderSlot(app.threadPanelActions[0]!, { threadId: "thr_test", params: null }, { rpc: { log: (input) => { calls.push(input); return { waiting: [{ ...fixture(), threadTitle: "Refund follow-up", threadProjectId: null }], done: [] }; } } });
  await screen.findByRole("article");
  expect(calls[0]).toEqual({ threadId: "thr_test" });
  expect(screen.queryByText("Refund follow-up")).toBeNull();
  expect(screen.queryByRole("combobox")).toBeNull();
  fireEvent.click(screen.getByRole("link", { name: "See all" }));
  expect(slot.inspection.navigateCalls).toContainEqual(expect.objectContaining({ method: "toPluginPanel" }));
});

it("submits the picked option from a choice card, marking but never preselecting the recommendation", async () => {
  const content = { type: "choice" as const, question: "Which account setup?", recommended: "multi", options: [
    { id: "single", label: "UserSingle", hint: "One account for every thread" }, { id: "multi", label: "UserMultiple" }, { id: "pool", label: "Pool" },
  ] };
  let release!: () => void;
  const { slot, calls, get } = await setup("", false, { ...fixture(), id: "setup", content }, new Promise<void>((resolve) => { release = resolve; }));
  await screen.findByRole("group", { name: "Which account setup?" });
  expect(screen.getByText("Recommended").closest("label")?.textContent).toContain("UserMultiple");
  expect(screen.getAllByRole("radio").some((radio) => (radio as HTMLInputElement).checked)).toBe(false);
  expect((screen.getByRole("button", { name: "Submit" }) as HTMLButtonElement).disabled).toBe(true);
  answer(/^UserSingle/);
  submit();
  await waitFor(() => expect(submittedMessages).toHaveLength(1));
  expect(calls).toEqual(["choose"]);
  expect(get().attempt).toMatchObject({ action: "choose", choice: { id: "single", label: "UserSingle" } });
  expect(submittedMentions).toMatchObject([{ provider: "action", id: "thr_test:setup:ea45f71a-c216-4da4-a226-65736f4eccfd", label: "Which account setup" }]);
  expect(screen.getByRole("button", { name: "Submitting…" }).getAttribute("aria-busy")).toBe("true");
  release();
  expect(await sent("UserSingle")).toBeTruthy();
  expect(calls).toEqual(["choose", "submitted"]);
});
it("keeps Submit disabled until an option is picked", async () => {
  const content = { type: "choice" as const, question: "Pick a plan", options: [{ id: "a", label: "Plan A" }, { id: "b", label: "Plan B" }] };
  await setup("", false, { ...fixture(), id: "plan", content });
  const button = await screen.findByRole("button", { name: "Submit" });
  expect((button as HTMLButtonElement).disabled).toBe(true);
  answer("Plan B");
  expect((button as HTMLButtonElement).disabled).toBe(false);
});

it.each(["reply", "decide"] as const)("round-trips a %s answer from Waiting on you through message context, CLI claim, reload and result", async (type) => {
  let host = recordingHost();
  plugin(host.bb);
  const item = fixture();
  if (type === "decide") item.content = { type: "decide", question: "Switch digests?", consequence: "Switch the email digests", yesLabel: "Switch" };
  try {
    await host.harness.behavior.runCli(["create", item.id, "--thread", item.threadId, "--item", JSON.stringify(item.content)]);
    const app = await loadPluginApp(() => import("./app.js"));
    const rpc = Object.fromEntries(["waiting", "get", "prepare", "dispatch"].map((name) => [name, (input: unknown) => host.harness.behavior.callRpc(name, input)]));
    const slot = renderSlot(app.composerCustomizations[0]!.banners![0]!, {}, { composer: { scope: { kind: "thread", threadId: item.threadId } }, rpc });
    await openItem(/^Answer: /);
    answer(type === "reply" ? "Send" : "Switch");
    submit();
    await waitFor(() => expect(submittedMessages).toHaveLength(1));
    expect(submittedMessages[0]).not.toContain(" — ");
    const context = JSON.parse((await host.harness.registrations.mentionProviders[0]!.resolve(submittedMentions[0]!.id)).context);
    expect(context).toMatchObject({ intent: "approved-action", action: type === "reply" ? "send" : "yes" });
    const claimed = await host.harness.behavior.runCli(["claim", item.id, "--thread", item.threadId, "--attempt", context.attemptId]);
    expect(JSON.parse(claimed.stdout!).attempt).toMatchObject({ claimed: true });
    host = await host.harness.lifecycle.reload(plugin);
    await host.harness.behavior.runCli(["report", item.id, "--thread", item.threadId, "--attempt", context.attemptId, "--outcome", "succeeded", "--message", "Switched"]);
    expect(JSON.parse((await host.harness.behavior.runCli(["get", item.id, "--thread", item.threadId])).stdout!)).toMatchObject({ state: "succeeded", result: { message: "Switched" } });
    // Answered, it leaves Waiting on you.
    await waitFor(() => expect(screen.queryByRole("button", { name: /^Answer: / })).toBeNull());
    slot.lifecycle.unmount();
  } finally { await host.harness.lifecycle.dispose(); }
});

it("sends an answer without a note as plain approval", async () => {
  const { slot, get } = await setup();
  answer("Send");
  submit();
  await waitFor(() => expect(submittedMessages).toHaveLength(1));
  expect(get().attempt?.note).toBe("");
  expect(submittedMessages[0]).not.toContain(" — ");
});

it("Decision log offers a choice card Choose, Skip and Review, never Yes or No", async () => {
  const content = { type: "choice", question: "Which account setup?", recommended: "multi", options: [{ id: "single", label: "One account" }, { id: "multi", label: "Several accounts" }] } as const;
  const item = { ...fixture(), id: "setup", content, threadTitle: "Accounts", threadProjectId: "proj_cards" } as const;
  const app = await loadPluginApp(() => import("./app.js"));
  const slot = renderSlot(app.navPanels[0]!, { subPath: "" }, { rpc: { log: () => ({ waiting: [item], done: [] }) } });
  const row = await screen.findByRole("article", { name: "Choice: Which account setup?" });
  expect(within(row).getAllByRole("button").map((button) => button.getAttribute("aria-label"))).toEqual(["Review", "More actions", "Choose"]);
  fireEvent.click(within(row).getByRole("button", { name: "Review" }));
  expect(within(row).getByText("Several accounts")).toBeTruthy();
  fireEvent.click(within(row).getByRole("button", { name: "Choose" }));
  expect(slot.inspection.navigateCalls).toContainEqual(expect.objectContaining({ method: "toThread" }));
});

it("Decision log Send on a collapsed reply opens the email first and sends only once it is visible", async () => {
  const item = { ...fixture(), content: { ...fixture().content, cc: ["ops@example.com"] }, threadTitle: "Refund follow-up", threadProjectId: "proj_cards" } as const;
  const calls: unknown[] = [];
  const app = await loadPluginApp(() => import("./app.js"));
  renderSlot(app.navPanels[0]!, { subPath: "" }, { rpc: {
    log: () => ({ waiting: [item], done: [] }),
    decideFromLog: (input) => { calls.push(input); return { ...item, revision: 2, state: "pending", attempt: { id: "ea45f71a-c216-4da4-a226-65736f4eccfd", action: "send", claimed: false, sentAt: "2026-10-01T19:09:00Z" } }; },
  } });
  const row = await screen.findByRole("article");
  expect(within(row).queryByRole("textbox", { name: "Draft" })).toBeNull();
  const now = vi.spyOn(Date, "now").mockReturnValue(1_000);
  fireEvent.click(within(row).getByRole("button", { name: "Review and send" }));
  // The second click of a double-click only finishes opening the email.
  fireEvent.click(within(row).getByRole("button", { name: "Send" }));
  expect(calls).toHaveLength(0);
  expect((within(row).getByRole("textbox", { name: "Draft" }) as HTMLTextAreaElement).value).toBe("Original draft");
  expect(within(row).getByText(/To billing@example.com · Missing refund/)).toBeTruthy();
  expect(within(row).getByText("Cc ops@example.com")).toBeTruthy();
  expect(within(row).getByText(/Your refund is on its way/, { selector: "summary span" })).toBeTruthy();
  const send = within(row).getByRole("button", { name: "Send" });
  await waitFor(() => expect(document.activeElement).toBe(send));
  now.mockReturnValue(2_000);
  fireEvent.click(send);
  await waitFor(() => expect(calls).toEqual([expect.objectContaining({ id: "esc-1", action: "send" })]));
  now.mockRestore();
});

it("retries a failed table reply from its confirmation", async () => {
  const failed: Item = { ...fixture(), revision: 3, state: "failed", attempt: { id: "ea45f71a-c216-4da4-a226-65736f4eccfd", action: "send", claimed: true }, result: { message: "Reconnect Gmail", retryable: true } };
  const calls: string[] = [];
  const app = await loadPluginApp(() => import("./app.js"));
  const slot = renderSlot(app.messageDirectives[1]!, { attributes: { id: "replies" }, source: '::actions{id="replies"}', message: { id: "msg_1", threadId: "thr_test", turnId: null, projectId: null }, openWorkspaceFile: null }, {
    composer: { scope: { kind: "thread", threadId: "thr_test" } },
    rpc: {
      table: () => ({ id: "replies", threadId: "thr_test", title: "Replies", ids: [failed.id], items: [failed] }),
      get: () => failed,
      prepare: () => { calls.push("prepare"); return { ...failed, revision: 4, state: "pending", attempt: { id: "ea45f71a-c216-4da4-a226-65736f4eccfe", action: "send", claimed: false } }; },
      dispatch: () => dispatchFixture([{ ...failed, revision: 4, state: "pending", attempt: { id: "ea45f71a-c216-4da4-a226-65736f4eccfe", action: "send", claimed: false } }]),
    },
  });
  expect(await screen.findByText("Reconnect Gmail")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await waitFor(() => expect(submittedMessages).toHaveLength(1));
  expect(calls).toEqual(["prepare"]);
});
it("shows a past table's unanswered rows as lines into Waiting on you, never as a form", async () => {
  const items = [fixture(), { ...fixture(), id: "esc-2" }];
  const app = await loadPluginApp(() => import("./app.js"));
  renderSlot(app.messageDirectives[1]!, { attributes: { id: "replies" }, source: '::actions{id="replies"}', message: { id: "msg_1", threadId: "thr_test", turnId: null, projectId: null }, openWorkspaceFile: null }, {
    composer: { scope: { kind: "thread", threadId: "thr_test" } },
    rpc: { table: () => ({ id: "replies", threadId: "thr_test", title: "Replies", ids: items.map((item) => item.id), items: items.map((item) => ({ ...item, followUps: [] })) }), get: (raw) => ({ ...items.find((item) => item.id === (raw as { id: string }).id)!, followUps: [] }) },
  });
  expect(await screen.findAllByRole("button", { name: /^In Waiting on you: / })).toHaveLength(2);
  expect(screen.queryByRole("form")).toBeNull();
  expect(screen.queryByRole("button", { name: /all$/ })).toBeNull();
});

it("opens an unanswered card from its timeline line in Waiting on you", async () => {
  const item = fixture();
  const app = await loadPluginApp(() => import("./app.js"));
  renderSlot(app.composerCustomizations[0]!.banners![0]!, {}, { rpc: { waiting: () => [{ ...item, ...source }], get: () => item } });
  renderSlot(app.messageDirectives[0]!, directiveProps(item.id), { rpc: { get: () => item } });
  fireEvent.click(await screen.findByRole("button", { name: "In Waiting on you: Reply to billing@example.com: Missing refund" }));
  expect(await screen.findByRole("form")).toBeTruthy();
  expect(screen.getByRole("button", { name: /^Waiting on you/ }).getAttribute("aria-expanded")).toBe("true");
});

it("lists items urgent first with thread and age, steps through them, and hides when nothing waits", async () => {
  const at = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();
  const decide = (id: string, question: string, minutes: number, priority?: "urgent" | "low") => ({ ...fixture(), id, updatedAt: at(minutes), content: { type: "decide" as const, question, consequence: "Do it.", ...(priority ? { priority } : {}) }, threadTitle: `Thread ${id}`, threadProjectId: null });
  let waiting = [decide("urgent", "Ship it?", 5, "urgent"), decide("old", "Archive it?", 3 * 24 * 60), decide("new", "Rename it?", 90)];
  const app = await loadPluginApp(() => import("./app.js"));
  const slot = renderSlot(app.composerCustomizations[0]!.banners![0]!, {}, { rpc: { waiting: () => waiting, get: (raw) => waiting.find((item) => item.id === (raw as { id: string }).id)! } });
  const header = await screen.findByRole("button", { name: /^Waiting on you/ });
  // Collapsed by default: one quiet line with a count and no item text.
  expect(header.getAttribute("aria-expanded")).toBe("false");
  expect(header.textContent).toBe("Waiting on you · 3");
  fireEvent.click(header);
  expect(localStorage.getItem("inline-action-cards:waiting-expanded")).toBe("1");
  const rows = within(screen.getByRole("list")).getAllByRole("button");
  expect(rows.map((row) => row.getAttribute("aria-label"))).toEqual(["Answer: Ship it?", "Answer: Archive it?", "Answer: Rename it?"]);
  expect(rows[0]!.textContent).toContain("Thread urgent");
  expect(rows[1]!.textContent).toContain("3d");
  fireEvent.click(rows[0]!);
  expect(await screen.findByText("1 of 3")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(await screen.findByText("2 of 3")).toBeTruthy();
  expect(screen.getByText("Archive it?", { selector: "p" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Previous" }));
  fireEvent.click(screen.getByRole("button", { name: "Previous" }));
  expect(await screen.findByText("3 of 3")).toBeTruthy();
  waiting = [];
  await slot.behavior.emitRealtime("items", {});
  await waitFor(() => expect(screen.queryByRole("region", { name: "Waiting on you" })).toBeNull());
});

it("shows at most five rows and sends the rest to the Decision log", async () => {
  const waiting = Array.from({ length: 7 }, (_, index) => ({ ...fixture(), id: `item-${index}`, threadId: `thr_${index}`, content: { type: "decide" as const, question: `Question ${index}?`, consequence: "Do it." }, ...source }));
  localStorage.setItem("inline-action-cards:waiting-expanded", "1");
  const app = await loadPluginApp(() => import("./app.js"));
  const slot = renderSlot(app.composerCustomizations[0]!.banners![0]!, {}, { rpc: { waiting: () => waiting, get: () => waiting[0]! } });
  // The remembered choice opens it expanded.
  expect((await screen.findByRole("button", { name: /^Waiting on you/ })).getAttribute("aria-expanded")).toBe("true");
  expect(within(screen.getByRole("list")).getAllByRole("button")).toHaveLength(5);
  fireEvent.click(screen.getByRole("button", { name: "+2 more in the Decision log" }));
  expect(slot.inspection.navigateCalls).toContainEqual(expect.objectContaining({ method: "toPluginPanel" }));
});

it("answers an ask in its own words and settles it without a claim", async () => {
  const host = recordingHost();
  plugin(host.bb);
  try {
    await host.harness.behavior.runCli(["ask", "channel", "Which channel should the report post to?", "--thread", "thr_test", "--urgent"]);
    const app = await loadPluginApp(() => import("./app.js"));
    const rpc = Object.fromEntries(["waiting", "get", "prepare", "dispatch"].map((name) => [name, (input: unknown) => host.harness.behavior.callRpc(name, input)]));
    renderSlot(app.composerCustomizations[0]!.banners![0]!, {}, { composer: { scope: { kind: "thread", threadId: "thr_test" } }, rpc });
    await openItem("Which channel should the report post to?");
    const button = screen.getByRole("button", { name: "Submit" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.change(screen.getByRole("textbox", { name: "Your answer" }), { target: { value: "#feedback" } });
    submit();
    await waitFor(() => expect(submittedMessages).toEqual(["Answer Which channel should the report post to — #feedback"]));
    expect(await screen.findByText(/Sent “#feedback” to/)).toBeTruthy();
    const context = JSON.parse((await host.harness.registrations.mentionProviders[0]!.resolve(submittedMentions[0]!.id)).context);
    expect(context).toMatchObject({ intent: "answer", answer: "#feedback" });
    expect(JSON.parse((await host.harness.behavior.runCli(["get", "channel", "--thread", "thr_test"])).stdout!)).toMatchObject({ state: "succeeded", result: { message: "Answered" } });
  } finally { await host.harness.lifecycle.dispose(); }
});

it.each(["action", "actions"])("reserves the last %s height across virtualized reloads", async (directive) => {
  const item = { ...fixture(), id: `height-${directive}` };
  const app = await loadPluginApp(() => import("./app.js"));
  const target = app.messageDirectives[directive === "action" ? 0 : 1]!;
  const props = { attributes: { id: item.id }, source: "", message: { id: "height-message", threadId: item.threadId, turnId: null, projectId: null }, openWorkspaceFile: null };
  const table = { id: item.id, threadId: item.threadId, title: "Reload fixture", ids: [item.id], items: [{ ...item, followUps: [] }] };
  let width = 350;
  const original = HTMLElement.prototype.getBoundingClientRect;
  const bounds = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    return this.classList.contains("iac-container") ? { width, height: 650, x: 0, y: 0, top: 0, left: 0, right: width, bottom: 650, toJSON() {} } : original.call(this);
  });
  try {
    let slot = renderSlot(target, props, { rpc: { get: () => item, table: () => table } });
    await screen.findByRole("button", { name: /^In Waiting on you: / });
    slot.lifecycle.unmount();
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => { finish = resolve; });
    slot = renderSlot(target, props, { rpc: { get: async () => { await pending; return item; }, table: async () => { await pending; return table; } } });
    expect(screen.getByRole("status").closest<HTMLElement>(".iac-container")!.style.minHeight).toBe("650px");
    finish();
    await screen.findByRole("button", { name: /^In Waiting on you: / });
    await waitFor(() => expect(document.querySelector<HTMLElement>(".iac-container")!.style.minHeight).toBe(""));
    slot.lifecycle.unmount();
    // A desktop measurement must not reserve the wrong space after resizing to mobile.
    width = 280;
    slot = renderSlot(target, props, { rpc: { get: () => new Promise(() => {}), table: () => new Promise(() => {}) } });
    expect(screen.getByRole("status").closest<HTMLElement>(".iac-container")!.style.minHeight).toBe("");
    slot.lifecycle.unmount();
  } finally { bounds.mockRestore(); }
});
