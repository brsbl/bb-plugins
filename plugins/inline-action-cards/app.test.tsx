// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { loadPluginApp, renderSlot } from "@get-bb/plugin-sdk/testing/app";
import { afterEach, expect, it } from "vitest";
import type { Item } from "./model.js";
const fixture = (): Item => ({ id: "esc-1", threadId: "thr_test", revision: 1, state: "ready", attempt: null, result: null, updatedAt: "2026-10-01T10:42:00Z", content: { type: "reply", summary: "Escrow follow-up", subject: "Missing refund", to: ["escrow@example.com"], cc: [], bcc: [], original: { from: "Escrow", body: "Your refund is on its way." }, draft: "Original draft" } });
afterEach(cleanup);
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
        const input = raw as { action: "send"; revision: number };
        calls.push("prepare"); expect(input.revision).toBe(item.revision);
        item = { ...item, revision: item.revision + 1, state: "pending", attempt: { id: "ea45f71a-c216-4da4-a226-65736f4eccfd", action: input.action, claimed: false } }; return item;
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
  expect(screen.getByRole("button", { name: "More actions" })).toBeTruthy();
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
  const other = screen.getByRole("button", { name: action === "send" ? "Ask for changes" : action === "yes" ? "Keep" : "Switch" });
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

it("log refresh updates the reviewed draft while preserving unsaved local edits", async () => {
  let item = { ...fixture(), threadTitle: "Refund follow-up", threadProjectId: "proj_cards" };
  const app = await loadPluginApp(() => import("./app.js"));
  const slot = renderSlot(app.navPanels[0]!, { subPath: "" }, { rpc: {
    log: () => ({ waiting: [item], decided: [] }),
    save: () => { throw new Error("Offline: keep local changes"); },
  } });
  await screen.findByRole("button", { name: "Review" });
  fireEvent.click(screen.getByRole("button", { name: "Review" }));
  expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe("Original draft");
  item = { ...item, revision: 2, content: { ...item.content, draft: "Updated elsewhere" } } as typeof item;
  await slot.behavior.emitRealtime("items", {});
  await waitFor(() => expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe("Updated elsewhere"));
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Unsaved local edit" } });
  item = { ...item, revision: 3, content: { ...item.content, draft: "Another remote update" } } as typeof item;
  await slot.behavior.emitRealtime("items", {});
  expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe("Unsaved local edit");
});
