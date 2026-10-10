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
const fixture = (): Item => ({ id: "esc-1", threadId: "thr_test", revision: 1, state: "ready", attempt: null, result: null, updatedAt: "2026-10-01T10:42:00Z", content: { type: "reply", summary: "Billing follow-up", subject: "Missing refund", to: ["billing@example.com"], cc: [], bcc: [], original: { from: "Billing", body: "Your refund is on its way." }, draft: "Original draft" } });
afterEach(() => { cleanup(); submittedMessages.length = 0; localStorage.clear(); });
// Radix tooltips measure their content; jsdom has no ResizeObserver.
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
// Answer a form field the way a person does: pick the radio, then press Submit.
function answer(label: RegExp | string, within_: HTMLElement = document.body) {
  fireEvent.click(within(within_).getByRole("radio", { name: label }));
}
function submit(within_: HTMLElement = document.body) {
  fireEvent.click(within(within_).getByRole("button", { name: "Submit" }));
}
async function setup(composerText = "", saveFailure = false, initialItem = fixture(), beforeSubmitted?: Promise<void>) {
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
      submitted: async () => {
        await beforeSubmitted;
        calls.push("submitted");
        item = { ...item, revision: item.revision + 1, attempt: { ...item.attempt!, sentAt: "2026-10-01T19:09:00Z" } };
        return item;
      },
    },
  });
  await screen.findByRole("form");
  return { slot, calls, get: () => item, reportSuccess: async () => {
    item = { ...item, revision: item.revision + 1, state: "succeeded", result: { message: "Sent", retryable: false } };
    await slot.behavior.emitRealtime("items", {});
  } };
}
it("flushes an immediate edit before submitting Send exactly once", async () => {
  const { slot, calls, get } = await setup();
  fireEvent.change(screen.getByRole("textbox", { name: "Draft" }), { target: { value: "My latest edit" } });
  answer("Send");
  const button = screen.getByRole("button", { name: "Submit" });
  fireEvent.click(button);
  fireEvent.click(button);
  await waitFor(() => expect(calls).toEqual(["save", "prepare", "submitted"]));
  expect(slot.inspection.composer.submits).toHaveLength(1);
  expect(slot.inspection.composer.mentions).toMatchObject([{ provider: "action", id: "thr_test:esc-1:ea45f71a-c216-4da4-a226-65736f4eccfd", label: "Billing follow-up" }]);
  expect(get().content).toMatchObject({ draft: "My latest edit" });
  await screen.findByText(/Sent\. Waiting for the agent\./);
  expect(screen.getByText(/You chose Send/)).toBeTruthy();
  expect(screen.queryByRole("textbox")).toBeNull();
});
it("preserves an existing composer message", async () => {
  const { slot, calls } = await setup("Please also check another message");
  answer("Send");
  submit();
  await screen.findByRole("alert");
  expect(slot.inspection.composer.text).toBe("Please also check another message");
  expect(slot.inspection.composer.submits).toHaveLength(0);
  expect(calls).toEqual([]);
});
it("replaces an obsolete local error when the agent reports success", async () => {
  const { reportSuccess } = await setup("Another composer message");
  answer("Send");
  submit();
  await screen.findByRole("alert");
  // Another client can complete the item while this view retains a local error.
  await reportSuccess();
  await screen.findByText(/Sent to billing@example.com/);
  expect(screen.queryByRole("alert")).toBeNull();
});
it("keeps an unsaved edit visible and offers recovery without submitting", async () => {
  const { slot, calls } = await setup("", true);
  fireEvent.change(screen.getByRole("textbox", { name: "Draft" }), { target: { value: "Keep this edit" } });
  answer("Send");
  submit();
  await screen.findByRole("button", { name: "Retry save" });
  expect((screen.getByRole("textbox", { name: "Draft" }) as HTMLTextAreaElement).value).toBe("Keep this edit");
  expect(calls).toEqual(["save"]);
  expect(slot.inspection.composer.submits).toHaveLength(0);
});

it("stages a reviewed table reply and sends it only with the sheet", async () => {
  let items = [fixture(), { ...fixture(), id: "esc-2" }];
  const calls: unknown[] = [];
  const app = await loadPluginApp(() => import("./app.js"));
  const slot = renderSlot(app.messageDirectives[1]!, { attributes: { id: "inbox" }, source: '::actions{id="inbox"}', message: { id: "msg_1", threadId: "thr_test", turnId: null, projectId: null }, openWorkspaceFile: null }, {
    composer: { scope: { kind: "thread", threadId: "thr_test" } },
    rpc: {
      table: () => ({ id: "inbox", threadId: "thr_test", title: "Replies", ids: items.map((item) => item.id), items: items.map((item) => ({ ...item, followUps: [] })) }),
      get: (raw) => items.find((item) => item.id === (raw as { id: string }).id),
      prepareBatch: (raw) => {
        const input = raw as { items: { id: string; revision: number; action: NonNullable<Item["attempt"]>["action"]; note?: string }[] };
        calls.push(input);
        items = items.map((item, index): Item => {
          const entry = input.items.find((candidate) => candidate.id === item.id);
          return entry ? { ...item, revision: item.revision + 1, state: "pending", attempt: { id: `ea45f71a-c216-4da4-a226-65736f4eccf${index}`, action: entry.action, claimed: false, ...(entry.note ? { note: entry.note } : {}) } } : item;
        });
        return items.filter((item) => input.items.some((entry) => entry.id === item.id));
      },
      submitted: (raw) => {
        const id = (raw as { id: string }).id;
        items = items.map((item): Item => item.id === id ? { ...item, revision: item.revision + 1, attempt: { ...item.attempt!, sentAt: "2026-10-01T19:09:00Z" } } : item);
        return items.find((item) => item.id === id);
      },
    },
  });
  const rows = await screen.findAllByRole("group", { name: /^Reply:/ });
  // A form shows every draft; nothing hides behind Review.
  expect(screen.getAllByRole("textbox", { name: "Draft" })).toHaveLength(2);
  answer("Send", rows[1]!);
  expect(slot.inspection.composer.submits).toHaveLength(0);
  submit();
  await waitFor(() => expect(slot.inspection.composer.submits).toHaveLength(1));
  expect(calls).toEqual([expect.objectContaining({ items: [expect.objectContaining({ id: "esc-2", action: "send" })] })]);
  await screen.findByText(/Sent\. Waiting for the agent\./);
});

it.each(["send", "yes", "no"] as const)("shows %s as submitting only while it is sent, then confirms the choice", async (action) => {
  const item = fixture();
  if (action !== "send") item.content = { type: "decide", question: "Switch digests?", consequence: "Keep schedules", yesLabel: "Switch", noLabel: "Keep" };
  let release!: () => void;
  const { slot } = await setup("", false, item, new Promise<void>((resolve) => { release = resolve; }));
  const label = action === "send" ? "Send" : action === "yes" ? "Switch" : "Keep";
  answer(label);
  const button = screen.getByRole("button", { name: "Submit" });
  fireEvent.click(button);
  await waitFor(() => expect(slot.inspection.composer.submits).toHaveLength(1));
  const pending = screen.getByRole("button", { name: "Submitting…" });
  expect(pending).toBe(button);
  expect(pending.getAttribute("aria-busy")).toBe("true");
  expect((pending as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByRole("radio", { name: label }).matches(":disabled")).toBe(true);
  release();
  expect(await screen.findByText(new RegExp(`You chose ${label}$`))).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Submit" })).toBeNull();
  expect(screen.queryByRole("radio")).toBeNull();
});

it("answers several rows as one form and sends every answer in one message", async () => {
  let items: Item[] = ["one", "two", "three"].map((id) => ({ ...fixture(), id, content: { type: "decide", question: `Switch ${id}?`, consequence: "Keep schedules", yesLabel: "Switch", noLabel: "Keep", actionKey: "switch" } }));
  const calls: { items: { id: string; action: string }[] }[] = [];
  const app = await loadPluginApp(() => import("./app.js"));
  const slot = renderSlot(app.messageDirectives[1]!, { attributes: { id: "digests" }, source: '::actions{id="digests"}', message: { id: "msg_1", threadId: "thr_test", turnId: null, projectId: null }, openWorkspaceFile: null }, {
    composer: { scope: { kind: "thread", threadId: "thr_test" } },
    rpc: {
      table: () => ({ id: "digests", threadId: "thr_test", title: "Digests", ids: items.map((item) => item.id), items: items.map((item) => ({ ...item, followUps: [] })) }),
      get: (raw) => items.find((item) => item.id === (raw as { id: string }).id),
      prepareBatch: (raw) => {
        const input = raw as { items: { id: string; revision: number; action: NonNullable<Item["attempt"]>["action"]; note?: string }[] };
        calls.push(input as never);
        items = items.map((item, index): Item => {
          const entry = input.items.find((candidate) => candidate.id === item.id);
          return entry ? { ...item, revision: item.revision + 1, state: "pending", attempt: { id: `ea45f71a-c216-4da4-a226-65736f4eccf${index}`, action: entry.action, claimed: false, ...(entry.note ? { note: entry.note } : {}) } } : item;
        });
        return items.filter((item) => input.items.some((entry) => entry.id === item.id));
      },
      submitted: (raw) => {
        const id = (raw as { id: string }).id;
        items = items.map((item): Item => item.id === id ? { ...item, revision: item.revision + 1, attempt: { ...item.attempt!, sentAt: "2026-10-01T19:09:00Z" } } : item);
        return items.find((item) => item.id === id);
      },
    },
  });
  const rows = await screen.findAllByRole("group", { name: /^Decision:/ });
  expect((screen.getByRole("button", { name: "Submit" }) as HTMLButtonElement).disabled).toBe(true);
  answer("Switch", rows[0]!);
  answer("Keep", rows[1]!);
  expect(slot.inspection.composer.submits).toHaveLength(0);
  submit();
  await waitFor(() => expect(slot.inspection.composer.submits).toHaveLength(1));
  expect(calls).toEqual([{ id: "digests", threadId: "thr_test", items: [expect.objectContaining({ id: "one", action: "yes" }), expect.objectContaining({ id: "two", action: "no" })] }]);
  expect(submittedMessages[0]!.split("\n")).toHaveLength(2);
  expect(slot.inspection.composer.mentions).toHaveLength(2);
  await waitFor(() => expect(screen.getAllByText(/Sent\. Waiting for the agent\./)).toHaveLength(2));
  expect(within(rows[2]!).getByRole("radio", { name: "Switch" })).toBeTruthy();
});

it("shows a card whose request never reached the agent as not sent, with Resend", async () => {
  const item: Item = { ...fixture(), revision: 3, state: "pending", attempt: { id: "ea45f71a-c216-4da4-a226-65736f4eccfd", action: "yes", claimed: false, note: "how do i test?" }, content: { type: "decide", question: "Merge PR #42?", consequence: "Squash-merge it.", yesLabel: "Merge" } };
  const { slot } = await setup("", false, item);
  expect((await screen.findByRole("status")).textContent).toContain("Not sent: it didn't reach the agent.");
  expect(screen.getByText(/You chose Merge/)).toBeTruthy();
  expect(screen.getByText("how do i test?")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Resend" }));
  await waitFor(() => expect(slot.inspection.composer.submits).toHaveLength(1));
  expect(slot.inspection.composer.mentions).toMatchObject([{ id: "thr_test:esc-1:ea45f71a-c216-4da4-a226-65736f4eccfd" }]);
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
      submitted: (raw) => {
        const id = (raw as { id: string }).id;
        items = items.map((item): Item => item.id === id ? { ...item, revision: item.revision + 1, attempt: { ...item.attempt!, sentAt: "2026-10-01T19:09:00Z" } } : item);
        return items.find((item) => item.id === id);
      },
    },
  });
  fireEvent.click(await screen.findByRole("button", { name: "Resend" }));
  await waitFor(() => expect(slot.inspection.composer.submits).toHaveLength(1));
  expect(slot.inspection.composer.mentions).toMatchObject([{ id: "thr_test:one:ea45f71a-c216-4da4-a226-65736f4eccfd" }]);
  expect(await screen.findByText(/Sent\. Waiting for the agent\./)).toBeTruthy();
});

it("drops an answer when the agent changes its row, and keeps answers across a remount", async () => {
  let items: Item[] = ["one", "two"].map((id) => ({ ...fixture(), id, content: { type: "choice", question: `Pick ${id}`, recommended: "b", options: [{ id: "a", label: "Plan A" }, { id: "b", label: "Plan B" }] } }));
  const app = await loadPluginApp(() => import("./app.js"));
  const props = { attributes: { id: "plans" }, source: '::actions{id="plans"}', message: { id: "msg_1", threadId: "thr_test", turnId: null, projectId: null }, openWorkspaceFile: null };
  const rpc = {
    table: () => ({ id: "plans", threadId: "thr_test", title: "Plans", ids: items.map((item) => item.id), items: items.map((item) => ({ ...item, followUps: [] })) }),
    get: (raw: unknown) => ({ ...items.find((item) => item.id === (raw as { id: string }).id)!, followUps: [] }),
  };
  const checked = () => screen.getAllByRole("radio").filter((radio) => (radio as HTMLInputElement).checked).length;
  let slot = renderSlot(app.messageDirectives[1]!, props, { composer: { scope: { kind: "thread", threadId: "thr_test" } }, rpc });
  const rows = await screen.findAllByRole("group", { name: /^Choice:/ });
  answer(/^Plan B/, rows[0]!);
  answer(/^Plan A/, rows[1]!);
  expect(checked()).toBe(2);
  slot.lifecycle.unmount();
  slot = renderSlot(app.messageDirectives[1]!, props, { composer: { scope: { kind: "thread", threadId: "thr_test" } }, rpc });
  await screen.findAllByRole("group", { name: /^Choice:/ });
  await waitFor(() => expect(checked()).toBe(2));
  items = items.map((item) => item.id === "two" ? { ...item, revision: 2 } : item);
  await slot.behavior.emitRealtime("items", {});
  await waitFor(() => expect(checked()).toBe(1));
  slot.lifecycle.unmount();
  localStorage.clear();
});

it("Action log refresh updates the reviewed draft while preserving unsaved local edits", async () => {
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

it("Action log keeps failures and Later cards waiting, orders row controls with the primary last, and collapses Done", async () => {
  const entry = { threadTitle: "Refund follow-up", threadProjectId: "proj_cards" };
  const attempt = { id: "ea45f71a-c216-4da4-a226-65736f4eccfd", action: "send", claimed: true } as const;
  const failed = { ...fixture(), id: "esc-2", revision: 3, state: "failed", attempt, result: { message: "Reconnect Gmail", retryable: true }, ...entry } as const;
  const later = { ...fixture(), id: "esc-3", revision: 3, state: "succeeded", attempt: { ...attempt, action: "later" }, result: { message: "Later", retryable: false }, ...entry } as const;
  const decision = { ...fixture(), id: "merge-1", content: { type: "decide", question: "Merge the PR?", consequence: "Squash-merges it.", yesLabel: "Merge", noLabel: "Keep open" }, ...entry } as const;
  const oddLabel = { ...fixture(), id: "odd-1", content: { type: "decide", question: "Build it?", consequence: "Runs the build.", yesLabel: "Constructor run", noLabel: "toString" }, ...entry } as const;
  const done = Array.from({ length: 6 }, (_, index) => ({ ...fixture(), id: `sent-${index}`, revision: 3, state: "succeeded", attempt, result: { message: "Sent", retryable: false }, ...entry } as const));
  const app = await loadPluginApp(() => import("./app.js"));
  expect([app.navPanels[0]!.title, app.threadPanelActions[0]!.title]).toEqual(["Action log", "Action log"]);
  expect([app.navPanels[0]!.icon, app.threadPanelActions[0]!.icon]).toEqual(["inline-action-cards/action-log", "inline-action-cards/action-log"]);
  renderSlot(app.navPanels[0]!, { subPath: "" }, { rpc: { log: () => ({ waiting: [{ ...fixture(), ...entry }, failed, later, decision, oddLabel], done }) } });
  const waiting = await screen.findByRole("region", { name: "Waiting on you" });
  const [ready, failure, deferred, decide] = within(waiting).getAllByRole("article");
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

it("thread panel Action log lists only its thread, drops thread names, and links to the full page", async () => {
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
  expect(screen.getByText("(recommended)").closest("label")?.textContent).toContain("UserMultiple");
  expect(screen.getAllByRole("radio").some((radio) => (radio as HTMLInputElement).checked)).toBe(false);
  expect((screen.getByRole("button", { name: "Submit" }) as HTMLButtonElement).disabled).toBe(true);
  answer(/^UserSingle/);
  submit();
  await waitFor(() => expect(slot.inspection.composer.submits).toHaveLength(1));
  expect(calls).toEqual(["choose"]);
  expect(get().attempt).toMatchObject({ action: "choose", choice: { id: "single", label: "UserSingle" } });
  expect(slot.inspection.composer.mentions).toMatchObject([{ provider: "action", id: "thr_test:setup:ea45f71a-c216-4da4-a226-65736f4eccfd", label: "Which account setup" }]);
  expect(screen.getByRole("button", { name: "Submitting…" }).getAttribute("aria-busy")).toBe("true");
  release();
  expect(await screen.findByText(/You chose UserSingle/)).toBeTruthy();
  expect(calls).toEqual(["choose", "submitted"]);
});
it("sends the note along with the chosen option", async () => {
  const content = { type: "choice" as const, question: "Which account setup?", recommended: "multi", options: [{ id: "single", label: "UserSingle" }, { id: "multi", label: "UserMultiple" }] };
  const { slot, get } = await setup("", false, { ...fixture(), id: "setup", content });
  answer(/^UserMultiple/);
  fireEvent.change(await screen.findByRole("textbox", { name: "Note (optional)" }), { target: { value: "Keep the pool as backup" } });
  submit();
  await waitFor(() => expect(slot.inspection.composer.submits).toHaveLength(1));
  expect(get().attempt).toMatchObject({ action: "choose", note: "Keep the pool as backup" });
  expect(submittedMessages[0]).toContain(" — Keep the pool as backup");
});
it("keeps Submit disabled until an option is picked or a note is written", async () => {
  const content = { type: "choice" as const, question: "Pick a plan", options: [{ id: "a", label: "Plan A" }, { id: "b", label: "Plan B" }] };
  await setup("", false, { ...fixture(), id: "plan", content });
  const button = await screen.findByRole("button", { name: "Submit" });
  expect((button as HTMLButtonElement).disabled).toBe(true);
  answer("Plan B");
  expect((button as HTMLButtonElement).disabled).toBe(false);
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
        submitted: (input) => host.harness.behavior.callRpc("submitted", input),
      },
    });
    await screen.findByRole("radio", { name: type === "reply" ? "Send" : "Switch" });
    answer(type === "reply" ? "Send" : "Switch");
    fireEvent.change(await screen.findByRole("textbox", { name: "Note (optional)" }), { target: { value: note } });
    submit();
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

it("sends an answer without a note as plain approval", async () => {
  const { slot, get } = await setup();
  answer("Send");
  submit();
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
    const note = "Can you keep Money on the old one?";
    // A note with no answer picked is sent on its own as a question.
    fireEvent.change(await screen.findByRole("textbox", { name: "Note (optional)" }), { target: { value: note } });
    submit();
    await waitFor(() => expect(slot.inspection.composer.submits).toHaveLength(1));
    expect(submittedMessages[0]).toContain(note);
    expect(submittedMessages[0]).toMatch(type === "reply" ? /^Billing follow-up / : /^Switch digests /);
    const mention = slot.inspection.composer.mentions[0]!;
    host = await host.harness.lifecycle.reload(plugin);
    const context = JSON.parse((await host.harness.registrations.mentionProviders[0]!.resolve(mention.id)).context);
    expect(context).toMatchObject({ intent: "comment", note, itemId: item.id });
    expect(context).not.toHaveProperty("action");
    expect(context).not.toHaveProperty("attemptId");
    const saved = JSON.parse((await host.harness.behavior.runCli(["get", item.id, "--thread", item.threadId])).stdout!);
    expect(saved).toMatchObject({ state: "ready", attempt: null, revision: 1 });
    expect((screen.getByRole("radio", { name: type === "reply" ? "Send" : "Switch" }) as HTMLInputElement).disabled).toBe(false);
    expect((screen.getByRole("textbox", { name: "Note (optional)" }) as HTMLInputElement).value).toBe("");
    slot.lifecycle.unmount();
  } finally { await host.harness.lifecycle.dispose(); }
});

it("keeps each row's own note in one submitted form, and shows Reply rows in full", async () => {
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
        prepareBatch: (input) => host.harness.behavior.callRpc("prepareBatch", input),
        submitted: (input) => host.harness.behavior.callRpc("submitted", input),
      },
    });
    const rows = await screen.findAllByRole("group", { name: /^Decision:/ });
    expect(screen.queryByRole("alert")).toBeNull();
    for (const [index, row] of rows.entries()) {
      answer("Switch", row);
      fireEvent.change(within(row).getByRole("textbox", { name: "Note (optional)" }), { target: { value: `Condition ${index}` } });
    }
    submit();
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
  await screen.findByRole("group", { name: /^Reply:/ });
  expect(screen.getByRole("textbox", { name: "Draft" })).toBeTruthy();
  expect(screen.getByRole("textbox", { name: "Note (optional)" })).toBeTruthy();
  replySlot.lifecycle.unmount();
});

it("Action log offers a choice card Choose, Skip and Review, never Yes or No", async () => {
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

it("Action log Send on a collapsed reply opens the email first and sends only once it is visible", async () => {
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
      submitted: () => ({ ...failed, revision: 5, state: "pending", attempt: { id: "ea45f71a-c216-4da4-a226-65736f4eccfe", action: "send", claimed: false, sentAt: "2026-10-01T19:09:00Z" } }),
    },
  });
  expect(await screen.findByText("Reconnect Gmail")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await waitFor(() => expect(slot.inspection.composer.submits).toHaveLength(1));
  expect(calls).toEqual(["prepare"]);
});
it("never offers a bulk action, and Submit waits for an answer", async () => {
  const items = [fixture(), { ...fixture(), id: "esc-2" }];
  const app = await loadPluginApp(() => import("./app.js"));
  renderSlot(app.messageDirectives[1]!, { attributes: { id: "replies" }, source: '::actions{id="replies"}', message: { id: "msg_1", threadId: "thr_test", turnId: null, projectId: null }, openWorkspaceFile: null }, {
    composer: { scope: { kind: "thread", threadId: "thr_test" } },
    rpc: { table: () => ({ id: "replies", threadId: "thr_test", title: "Replies", ids: items.map((item) => item.id), items }), get: (raw) => items.find((item) => item.id === (raw as { id: string }).id) },
  });
  expect(await screen.findAllByRole("group", { name: /^Reply:/ })).toHaveLength(2);
  expect(screen.queryByRole("button", { name: /all$/ })).toBeNull();
  expect((screen.getByRole("button", { name: "Submit" }) as HTMLButtonElement).disabled).toBe(true);
});
