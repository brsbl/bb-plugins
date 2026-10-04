// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { loadPluginApp, renderSlot } from "@get-bb/plugin-sdk/testing/app";
import { afterEach, expect, it } from "vitest";
import type { Item } from "./model.js";
const fixture = (): Item => ({ id: "esc-1", threadId: "thr_test", revision: 1, state: "ready", attempt: null, result: null, updatedAt: "2026-10-01T10:42:00Z", content: { type: "reply", summary: "Escrow follow-up", subject: "Missing refund", to: ["escrow@example.com"], cc: [], bcc: [], original: { from: "Escrow", body: "Your refund is on its way." }, draft: "Original draft" } });
afterEach(cleanup);
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
      prepare: (raw) => {
        const input = raw as { action: "send"; revision: number };
        calls.push("prepare"); expect(input.revision).toBe(item.revision);
        item = { ...item, revision: item.revision + 1, state: "pending", attempt: { id: "ea45f71a-c216-4da4-a226-65736f4eccfd", action: input.action, claimed: false } }; return item;
      },
      submitted: async (raw) => {
        const input = raw as { queued: boolean; sendAt?: number };
        // Host RPC rejects undefined values, so an immediate send must omit sendAt.
        expect("sendAt" in input && input.sendAt === undefined).toBe(false);
        await beforeSubmitted;
        calls.push(input.sendAt ? "scheduled" : "submitted");
        item = { ...item, revision: item.revision + 1, attempt: { ...item.attempt!, ...(input.queued ? { queued: true, sendAt: input.sendAt } : { sentAt: "2026-10-01T19:09:00Z" }) } };
        return item;
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
  await waitFor(() => expect(calls).toEqual(["save", "prepare", "submitted"]));
  expect(slot.inspection.composer.submits).toHaveLength(1);
  expect(slot.inspection.composer.mentions).toMatchObject([{ provider: "action", id: "thr_test:esc-1:ea45f71a-c216-4da4-a226-65736f4eccfd", label: "Escrow follow-up" }]);
  expect(get().content).toMatchObject({ draft: "My latest edit" });
  await screen.findByText("Send request sent");
  expect(screen.queryByRole("textbox")).toBeNull();
});
it("keeps Ask for changes in the composer without submitting", async () => {
  const { slot } = await setup();
  fireEvent.click(screen.getByRole("button", { name: "Ask for changes" }));
  await waitFor(() => expect(slot.inspection.composer.text).toContain("Ask for changes to"));
  expect(slot.inspection.composer.submits).toHaveLength(0);
  expect(slot.inspection.composer.focusCount).toBeGreaterThan(0);
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
      submitted: (raw) => {
        const id = (raw as { id: string }).id;
        items = items.map((item): Item => item.id === id ? { ...item, revision: item.revision + 1, attempt: { ...item.attempt!, sentAt: "2026-10-01T19:09:00Z" } } : item);
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
  await screen.findByText("Send request sent");
  expect(screen.getByRole("textbox", { name: "Draft" }).getAttribute("readonly")).not.toBeNull();
  expect(screen.queryByRole("button", { name: "Sending…" })).toBeNull();
});

it.each(["send", "yes", "no"] as const)("shows %s loading only while it is sent, then settles", async (action) => {
  const item = fixture();
  if (action !== "send") item.content = { type: "decide", question: "Switch digests?", consequence: "Keep schedules", yesLabel: "Switch", noLabel: "Keep" };
  let release!: () => void;
  const { slot } = await setup("", false, item, new Promise<void>((resolve) => { release = resolve; }));
  const label = action === "send" ? "Send" : action === "yes" ? "Switch" : "Keep";
  const button = screen.getByRole("button", { name: label });
  const classes = button.className;
  fireEvent.click(button);
  await waitFor(() => expect(slot.inspection.composer.submits).toHaveLength(1));
  const pending = screen.getByRole("button", { name: action === "send" ? "Sending…" : action === "yes" ? "Switching…" : "Keeping…" });
  expect(pending).toBe(button);
  expect(pending.className).toBe(classes);
  expect(pending.getAttribute("aria-busy")).toBe("true");
  expect((screen.getByRole("button", { name: action === "send" ? "Ask for changes" : action === "yes" ? "Keep" : "Switch" }) as HTMLButtonElement).disabled).toBe(true);
  expect((screen.getByRole("button", { name: "Skip" }) as HTMLButtonElement).disabled).toBe(true);
  release();
  const status = await screen.findByRole("status");
  expect(status.textContent).toMatch(new RegExp(`^✓ ${action === "send" ? "Send request" : label} sent · `));
  expect(screen.queryByRole("button", { name: label })).toBeNull();
  expect(screen.queryByRole("button", { name: "Skip" })).toBeNull();
});

it("queues the primary action from Send options and shows it as queued", async () => {
  const item = fixture();
  item.content = { type: "decide", question: "Merge PR?", consequence: "Squash into main", yesLabel: "Merge" };
  const { slot, calls } = await setup("", false, item);
  const options = screen.getByRole("button", { name: "Send options" });
  fireEvent.keyDown(options, { key: "Enter" });
  fireEvent.click(await screen.findByRole("menuitem", { name: "Tomorrow morning" }));
  await waitFor(() => expect(calls).toEqual(["prepare", "scheduled"]));
  const submit = slot.inspection.composer.submits[0] as { sendAt?: number };
  expect(submit.sendAt).toBeGreaterThan(Date.now());
  expect((await screen.findByRole("status")).textContent).toMatch(/^Merge queued · sends /);
});

it("keeps the bulk button busy only while sending, without treating a row click as bulk", async () => {
  let items: Item[] = ["one", "two"].map((id) => ({ ...fixture(), id, content: { type: "decide", question: `Switch ${id}?`, consequence: "Keep schedules", yesLabel: "Switch", actionKey: "switch" } }));
  const app = await loadPluginApp(() => import("./app.js"));
  const prepare = (item: Item): Item => ({ ...item, revision: item.revision + 1, state: "pending", attempt: { id: item.id === "one" ? "ea45f71a-c216-4da4-a226-65736f4eccfd" : "ea45f71a-c216-4da4-a226-65736f4eccfe", action: "yes", claimed: false } });
  const settle = (id: string) => { items = items.map((item) => item.id === id ? { ...item, revision: item.revision + 1, attempt: { ...item.attempt!, sentAt: "2026-10-01T19:09:00Z" } } : item); return items.find((item) => item.id === id); };
  const slot = renderSlot(app.messageDirectives[1]!, { attributes: { id: "digests" }, source: '::actions{id="digests"}', message: { id: "msg_1", threadId: "thr_test", turnId: null, projectId: null }, openWorkspaceFile: null }, {
    composer: { scope: { kind: "thread", threadId: "thr_test" } },
    rpc: {
      table: () => ({ id: "digests", threadId: "thr_test", title: "Digests", ids: items.map((item) => item.id), items }),
      get: (raw) => items.find((item) => item.id === (raw as { id: string }).id),
      prepare: (raw) => { items = items.map((item) => item.id === (raw as { id: string }).id ? prepare(item) : item); return items[0]; },
      prepareTable: () => { items = items.map((item) => item.state === "ready" ? prepare(item) : item); return [items[1]]; },
      submitted: (raw) => settle((raw as { id: string }).id),
    },
  });
  const button = await screen.findByRole("button", { name: "Switch all" });
  fireEvent.click(within(screen.getAllByRole("article")[0]!).getByRole("button", { name: "Switch" }));
  await waitFor(() => expect(slot.inspection.composer.submits).toHaveLength(1));
  expect(button.getAttribute("aria-busy")).toBeNull();
  fireEvent.click(button);
  await waitFor(() => expect(slot.inspection.composer.submits).toHaveLength(2));
  await waitFor(() => expect(button.getAttribute("aria-busy")).toBeNull());
  await waitFor(() => expect(screen.getAllByText("Switch sent")).toHaveLength(2));
});
