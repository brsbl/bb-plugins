// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { loadPluginApp, renderSlot } from "@get-bb/plugin-sdk/testing/app";
import { afterEach, expect, it, vi } from "vitest";
import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import plugin from "./server.js";
import type { Item } from "./model.js";
const submittedMessages = vi.hoisted(() => [] as string[]);
vi.mock("@get-bb/plugin-sdk/app", async (importOriginal) => {
  const sdk = await importOriginal<typeof import("@get-bb/plugin-sdk/app")>();
  return { ...sdk, useComposer: () => {
    const composer = sdk.useComposer();
    let message = composer.text;
    return new Proxy(composer, { get(target, key) {
      if (key === "experimental_submit") return async (options: Parameters<typeof composer.experimental_submit>[0]) => {
        submittedMessages.push(message);
        const result = await composer.experimental_submit(options);
        message = "";
        return result;
      };
      if (key === "text") return message;
      if (key === "setText") return (value: string) => { message = value; composer.setText(value); };
      if (key === "updateText") return (update: (value: string) => string) => composer.updateText((value) => { message = update(value); return message; });
      return Reflect.get(target, key);
    } });
  } };
});
const fixture = (): Item => ({ id: "esc-1", threadId: "thr_test", revision: 1, state: "ready", attempt: null, result: null, updatedAt: "2026-10-01T10:42:00Z", content: { type: "reply", summary: "Escrow follow-up", subject: "Missing refund", to: ["escrow@example.com"], cc: [], bcc: [], original: { from: "Escrow", body: "Your refund is on its way." }, draft: "Original draft" } });
afterEach(() => { cleanup(); submittedMessages.length = 0; });
// Radix menus measure their content; jsdom has no ResizeObserver.
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
async function addRowNote(row: HTMLElement) {
  fireEvent.keyDown(within(row).getByRole("button", { name: "More actions" }), { key: "Enter" });
  fireEvent.click(await screen.findByRole("menuitem", { name: "Add note" }));
}
async function setup(composerText = "", saveFailure = false, initialItem = fixture()) {
  let item = initialItem;
  const calls: string[] = [];
  const app = await loadPluginApp(() => import("./app.js"));
  const slot = renderSlot(app.messageDirectives[0]!, { attributes: { id: item.id }, source: '::action{id="esc-1"}', message: { id: "msg_1", threadId: "thr_test", turnId: null, projectId: null }, openWorkspaceFile: null }, {
    composer: { scope: { kind: "thread", threadId: "thr_test" }, text: composerText },
    rpc: {
      get: () => item,
      save: (raw) => {
        const input = raw as { draft: string; revision: number };
        calls.push("save");
        if (saveFailure) throw new Error("Draft could not be saved. Retry.");
        item = { ...item, revision: item.revision + 1, content: { ...fixture().content, draft: input.draft } } as Item;
        return item;
      },
      prepare: (raw) => {
        const input = raw as { action: "send"; revision: number; note?: string };
        calls.push("prepare"); expect(input.revision).toBe(item.revision);
        item = { ...item, revision: item.revision + 1, state: "pending", attempt: { id: "ea45f71a-c216-4da4-a226-65736f4eccfd", action: input.action, claimed: false, note: input.note } }; return item;
      },
    },
  });
  await screen.findByRole("article");
  return { slot, calls, get: () => item, reportSuccess: async () => {
    item = { ...item, revision: item.revision + 1, state: "succeeded", result: { message: "Sent", retryable: false } };
    await slot.behavior.emitRealtime("items", {});
  } };
}
it("flushes an immediate edit before submitting Send exactly once", async () => {
  const { slot, calls, get } = await setup();
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "My latest edit" } });
  fireEvent.click(screen.getByRole("button", { name: /^Send$/ }));
  fireEvent.click(screen.getByRole("button", { name: /^Send$/ }));
  await waitFor(() => expect(slot.inspection.composer.submits).toHaveLength(1));
  expect(calls).toEqual(["save", "prepare"]);
  expect(slot.inspection.composer.mentions).toMatchObject([{ provider: "action", id: "thr_test:esc-1:ea45f71a-c216-4da4-a226-65736f4eccfd", label: "Escrow follow-up" }]);
  expect(get().content).toMatchObject({ draft: "My latest edit" });
  expect(screen.getByRole("textbox").getAttribute("readonly")).not.toBeNull();
});
it("preserves an existing composer message", async () => {
  const { slot, calls } = await setup("Please also check another message");
  fireEvent.click(screen.getByRole("button", { name: /^Send$/ }));
  await screen.findByRole("alert");
  expect(slot.inspection.composer.text).toBe("Please also check another message");
  expect(slot.inspection.composer.submits).toHaveLength(0);
  expect(calls).toEqual([]);
});
it("replaces an obsolete local error when the agent reports success", async () => {
  const { reportSuccess } = await setup("Another composer message");
  fireEvent.click(screen.getByRole("button", { name: /^Send$/ }));
  await screen.findByRole("alert");
  // Another client can complete the item while this view retains a local error.
  await reportSuccess();
  await screen.findByText(/Sent to escrow@example.com/);
  expect(screen.queryByRole("alert")).toBeNull();
});
it("keeps an unsaved edit visible and offers recovery without submitting", async () => {
  const { slot, calls } = await setup("", true);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Keep this edit" } });
  fireEvent.click(screen.getByRole("button", { name: /^Send$/ }));
  await screen.findByRole("button", { name: "Retry save" });
  expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe("Keep this edit");
  expect(calls).toEqual(["save"]);
  expect(slot.inspection.composer.submits).toHaveLength(0);
});

it("keeps the expanded table reply in place while Send is pending", async () => {
  let items = [fixture(), { ...fixture(), id: "esc-2" }];
  const app = await loadPluginApp(() => import("./app.js"));
  const slot = renderSlot(app.messageDirectives[1]!, { attributes: { id: "inbox" }, source: '::actions{id="inbox"}', message: { id: "msg_1", threadId: "thr_test", turnId: null, projectId: null }, openWorkspaceFile: null }, {
    composer: { scope: { kind: "thread", threadId: "thr_test" } },
    rpc: {
      table: () => ({ id: "inbox", threadId: "thr_test", title: "Replies", ids: items.map((item) => item.id), items }),
      get: (raw) => items.find((item) => item.id === (raw as { id: string }).id),
      prepare: (raw) => {
        const id = (raw as { id: string }).id;
        items = items.map((item): Item => item.id === id ? { ...item, revision: 2, state: "pending", attempt: { id: "ea45f71a-c216-4da4-a226-65736f4eccfd", action: "send", claimed: false } } : item);
        return items.find((item) => item.id === id);
      },
    },
  });
  const reviews = await screen.findAllByRole("button", { name: /Review/ });
  fireEvent.click(reviews[0]!);
  expect(screen.getAllByRole("textbox", { name: "Draft" })).toHaveLength(1);
  fireEvent.click(screen.getByRole("button", { name: /Review/ }));
  expect(screen.getAllByRole("textbox", { name: "Draft" })).toHaveLength(1);
  fireEvent.click(screen.getByRole("button", { name: /^Send$/ }));
  await waitFor(() => expect(slot.inspection.composer.submits).toHaveLength(1));
  expect(screen.getByRole("textbox", { name: "Draft" }).getAttribute("readonly")).not.toBeNull();
  expect(screen.getByRole("button", { name: "Sending…" }).getAttribute("aria-busy")).toBe("true");
  fireEvent.click(screen.getByRole("button", { name: /Close/ }));
  expect(screen.queryByRole("textbox", { name: "Draft" })).toBeNull();
  const pendingReview = screen.getAllByRole("button", { name: /Review/ })[1]!;
  expect((pendingReview as HTMLButtonElement).disabled).toBe(false);
  fireEvent.click(pendingReview);
  expect(within(screen.getAllByRole("article")[1]!).getByRole("button", { name: "More actions" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Sending…" }).getAttribute("aria-busy")).toBe("true");
});

it.each(["send", "yes", "no"] as const)("keeps %s on the pressed button and disables its siblings", async (action) => {
  const item = fixture();
  if (action !== "send") item.content = { type: "decide", question: "Switch digests?", consequence: "Keep schedules", yesLabel: "Switch", noLabel: "Keep" };
  const { slot } = await setup("", false, item);
  const label = action === "send" ? "Send" : action === "yes" ? "Switch" : "Keep";
  const button = screen.getByRole("button", { name: label });
  const classes = button.className;
  fireEvent.click(button);
  await waitFor(() => expect(slot.inspection.composer.submits).toHaveLength(1));
  const pending = screen.getByRole("button", { name: action === "send" ? "Sending…" : action === "yes" ? "Switching…" : "Keeping…" });
  expect(pending).toBe(button);
  expect(pending.className).toBe(classes);
  expect(pending.getAttribute("aria-busy")).toBe("true");
  expect((pending as HTMLButtonElement).disabled).toBe(true);
  const other = screen.getByRole("button", { name: action === "send" ? "Add note" : action === "yes" ? "Keep" : "Switch" });
  expect((other as HTMLButtonElement).disabled).toBe(true);
  expect((screen.getByRole("button", { name: "Skip" }) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByRole("button", { name: "More actions" })).toBeTruthy();
});

it("keeps the bulk button busy until its own attempts finish, without treating a row click as bulk", async () => {
  let items: Item[] = ["one", "two"].map((id) => ({ ...fixture(), id, content: { type: "decide", question: `Switch ${id}?`, consequence: "Keep schedules", yesLabel: "Switch", actionKey: "switch" } }));
  const app = await loadPluginApp(() => import("./app.js"));
  const prepare = (item: Item): Item => ({ ...item, revision: item.revision + 1, state: "pending", attempt: { id: item.id === "one" ? "ea45f71a-c216-4da4-a226-65736f4eccfd" : "ea45f71a-c216-4da4-a226-65736f4eccfe", action: "yes", claimed: false } });
  const slot = renderSlot(app.messageDirectives[1]!, { attributes: { id: "digests" }, source: '::actions{id="digests"}', message: { id: "msg_1", threadId: "thr_test", turnId: null, projectId: null }, openWorkspaceFile: null }, {
    composer: { scope: { kind: "thread", threadId: "thr_test" } },
    rpc: {
      table: () => ({ id: "digests", threadId: "thr_test", title: "Digests", ids: items.map((item) => item.id), items }),
      get: (raw) => items.find((item) => item.id === (raw as { id: string }).id),
      prepare: (raw) => { items = items.map((item) => item.id === (raw as { id: string }).id ? prepare(item) : item); return items[0]; },
      prepareTable: () => { items = items.map((item) => item.state === "ready" ? prepare(item) : item); return [items[1]]; },
    },
  });
  const button = await screen.findByRole("button", { name: "Switch all" });
  fireEvent.click(within(screen.getAllByRole("article")[0]!).getByRole("button", { name: "Switch" }));
  await waitFor(() => expect(slot.inspection.composer.submits).toHaveLength(1));
  expect(button.getAttribute("aria-busy")).toBeNull();
  fireEvent.click(button);
  await waitFor(() => expect(slot.inspection.composer.submits).toHaveLength(2));
  expect(button.getAttribute("aria-busy")).toBe("true");
  items = items.map((item) => item.id === "two" ? { ...item, revision: item.revision + 1, state: "succeeded", result: { message: "Switched", retryable: false } } : item);
  await slot.behavior.emitRealtime("items", {});
  await waitFor(() => expect(button.getAttribute("aria-busy")).toBeNull());
});

it.each(["reply", "decide"] as const)("round-trips a %s note through click, message context, CLI claim, reload and result", async (type) => {
  let host = createFakePluginHost({ pluginId: "inline-action-cards" });
  plugin(host.bb);
  const item = fixture();
  if (type === "decide") item.content = { type: "decide", question: "Switch digests?", consequence: "Switch the email digests", yesLabel: "Switch" };
  const note = "but keep Money on the old automation";
  try {
    await host.harness.behavior.runCli(["create", item.id, "--thread", item.threadId, "--item", JSON.stringify(item.content)]);
    const app = await loadPluginApp(() => import("./app.js"));
    const slot = renderSlot(app.messageDirectives[0]!, { attributes: { id: item.id }, source: '::action{id="esc-1"}', message: { id: "msg_1", threadId: item.threadId, turnId: null, projectId: null }, openWorkspaceFile: null }, {
      composer: { scope: { kind: "thread", threadId: item.threadId } },
      rpc: {
        get: (input) => host.harness.behavior.callRpc("get", input),
        prepare: (input) => host.harness.behavior.callRpc("prepare", input),
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Add note" }));
    const field = screen.getByRole("textbox", { name: "Note for your choice" });
    expect(document.activeElement).toBe(field);
    fireEvent.change(field, { target: { value: note } });
    fireEvent.click(screen.getByRole("button", { name: type === "reply" ? "Send" : "Switch" }));
    await waitFor(() => expect(slot.inspection.composer.submits).toHaveLength(1));
    expect(submittedMessages[0]).toContain(` — ${note}`);
    const mention = slot.inspection.composer.mentions[0]!;
    const resolved = await host.harness.registrations.mentionProviders[0]!.resolve(mention.id);
    const context = JSON.parse(resolved.context);
    expect(context).toMatchObject({ note, intent: "approved-action" });
    const claimed = await host.harness.behavior.runCli(["claim", item.id, "--thread", item.threadId, "--attempt", context.attemptId]);
    expect(JSON.parse(claimed.stdout!).attempt).toMatchObject({ note, claimed: true });
    host = await host.harness.lifecycle.reload(plugin);
    const saved = await host.harness.behavior.runCli(["get", item.id, "--thread", item.threadId]);
    expect(JSON.parse(saved.stdout!).attempt.note).toBe(note);
    await host.harness.behavior.runCli(["report", item.id, "--thread", item.threadId, "--attempt", context.attemptId, "--outcome", "succeeded", "--message", "Switched"]);
    await slot.behavior.emitRealtime("items", {});
    await screen.findByText("Switched");
    expect(screen.getByText(note).className).toContain("iac-result-note");
    slot.lifecycle.unmount();
  } finally { await host.harness.lifecycle.dispose(); }
});

it("dismisses a note with Escape or clearing, keeping empty approval unchanged", async () => {
  const { slot, get } = await setup();
  fireEvent.click(screen.getByRole("button", { name: "Add note" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Note for your choice" }), { target: { value: "Do not send" } });
  fireEvent.keyDown(screen.getByRole("textbox", { name: "Note for your choice" }), { key: "Escape" });
  expect(screen.queryByRole("textbox", { name: "Note for your choice" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Add note" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Note for your choice" }), { target: { value: "Temporary" } });
  fireEvent.change(screen.getByRole("textbox", { name: "Note for your choice" }), { target: { value: "" } });
  expect(screen.queryByRole("textbox", { name: "Note for your choice" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  await waitFor(() => expect(slot.inspection.composer.submits).toHaveLength(1));
  expect(get().attempt?.note).toBe("");
  expect(submittedMessages[0]).not.toContain(" — ");
});

it.each(["reply", "decide"] as const)("round-trips a %s comment without reserving an attempt or disabling choices", async (type) => {
  let host = createFakePluginHost({ pluginId: "inline-action-cards" });
  plugin(host.bb);
  const item = fixture();
  if (type === "decide") item.content = { type: "decide", question: "Switch digests?", consequence: "Switch the email digests", yesLabel: "Switch" };
  try {
    await host.harness.behavior.runCli(["create", item.id, "--thread", item.threadId, "--item", JSON.stringify(item.content)]);
    const app = await loadPluginApp(() => import("./app.js"));
    const slot = renderSlot(app.messageDirectives[0]!, { attributes: { id: item.id }, source: '::action{id="esc-1"}', message: { id: "msg_1", threadId: item.threadId, turnId: null, projectId: null }, openWorkspaceFile: null }, {
      composer: { scope: { kind: "thread", threadId: item.threadId } },
      rpc: {
        get: (input) => host.harness.behavior.callRpc("get", input),
        comment: (input) => host.harness.behavior.callRpc("comment", input),
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Add note" }));
    expect(screen.queryByRole("button", { name: "Comment" })).toBeNull();
    const note = "Can you keep Money on the old one?";
    fireEvent.change(screen.getByRole("textbox", { name: "Note for your choice" }), { target: { value: note } });
    fireEvent.click(screen.getByRole("button", { name: "Comment" }));
    await waitFor(() => expect(slot.inspection.composer.submits).toHaveLength(1));
    expect(submittedMessages[0]).toContain(note);
    expect(submittedMessages[0]).toMatch(type === "reply" ? /^Escrow follow-up / : /^Switch digests /);
    const mention = slot.inspection.composer.mentions[0]!;
    host = await host.harness.lifecycle.reload(plugin);
    const context = JSON.parse((await host.harness.registrations.mentionProviders[0]!.resolve(mention.id)).context);
    expect(context).toMatchObject({ intent: "comment", note, itemId: item.id });
    expect(context).not.toHaveProperty("action");
    expect(context).not.toHaveProperty("attemptId");
    const saved = JSON.parse((await host.harness.behavior.runCli(["get", item.id, "--thread", item.threadId])).stdout!);
    expect(saved).toMatchObject({ state: "ready", attempt: null, revision: 1 });
    expect((screen.getByRole("button", { name: type === "reply" ? "Send" : "Switch" }) as HTMLButtonElement).disabled).toBe(false);
    expect(screen.queryByRole("textbox", { name: "Note for your choice" })).toBeNull();
    slot.lifecycle.unmount();
  } finally { await host.harness.lifecycle.dispose(); }
});

it("keeps separate row notes on bulk choices and offers comments on collapsed Reply rows", async () => {
  const host = createFakePluginHost({ pluginId: "inline-action-cards" });
  plugin(host.bb);
  try {
    for (const id of ["one", "two"]) await host.harness.behavior.runCli(["create", id, "--thread", "thr_test", "--item", JSON.stringify({ type: "decide", question: `Switch ${id}?`, consequence: "Keep schedules", yesLabel: "Switch", actionKey: "switch" })]);
    await host.harness.behavior.runCli(["create-table", "digests", "--thread", "thr_test", "--table", JSON.stringify({ title: "Digests", ids: ["one", "two"] })]);
    const app = await loadPluginApp(() => import("./app.js"));
    const slot = renderSlot(app.messageDirectives[1]!, { attributes: { id: "digests" }, source: '::actions{id="digests"}', message: { id: "msg_1", threadId: "thr_test", turnId: null, projectId: null }, openWorkspaceFile: null }, {
      composer: { scope: { kind: "thread", threadId: "thr_test" } },
      rpc: {
        table: (input) => host.harness.behavior.callRpc("table", input),
        get: (input) => host.harness.behavior.callRpc("get", input),
        prepareTable: (input) => host.harness.behavior.callRpc("prepareTable", input),
      },
    });
    await screen.findByRole("button", { name: "Switch all" });
    expect(screen.queryByRole("alert")).toBeNull();
    const rows = screen.getAllByRole("article");
    for (const [index, row] of rows.entries()) {
      expect(within(row).queryByRole("button", { name: "Add note" })).toBeNull();
      await addRowNote(row);
      fireEvent.change(await within(row).findByRole("textbox", { name: "Note for your choice" }), { target: { value: `Condition ${index}` } });
    }
    fireEvent.click(screen.getByRole("button", { name: "Switch all" }));
    await waitFor(() => expect(slot.inspection.composer.submits).toHaveLength(1));
    expect(submittedMessages[0]).toContain(" — Condition 0");
    expect(submittedMessages[0]).toContain(" — Condition 1");
    for (const [index, mention] of slot.inspection.composer.mentions.entries()) {
      const context = JSON.parse((await host.harness.registrations.mentionProviders[0]!.resolve(mention.id)).context);
      const claimed = JSON.parse((await host.harness.behavior.runCli(["claim", context.itemId, "--thread", "thr_test", "--attempt", context.attemptId])).stdout!);
      expect(claimed.attempt.note).toBe(`Condition ${index}`);
    }
    slot.lifecycle.unmount();
  } finally { await host.harness.lifecycle.dispose(); }

  const app = await loadPluginApp(() => import("./app.js"));
  const item = fixture();
  const replySlot = renderSlot(app.messageDirectives[1]!, { attributes: { id: "replies" }, source: '::actions{id="replies"}', message: { id: "msg_1", threadId: "thr_test", turnId: null, projectId: null }, openWorkspaceFile: null }, {
    composer: { scope: { kind: "thread", threadId: "thr_test" } },
    rpc: { table: () => ({ id: "replies", threadId: "thr_test", title: "Replies", ids: [item.id], items: [item] }), get: () => item },
  });
  await addRowNote(await screen.findByRole("article"));
  expect(screen.getByRole("textbox", { name: "Draft" })).toBeTruthy();
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Note for your choice" })));
  replySlot.lifecycle.unmount();
});
