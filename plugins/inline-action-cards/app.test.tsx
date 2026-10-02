// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { loadPluginApp, renderSlot } from "@get-bb/plugin-sdk/testing/app";
import { afterEach, expect, it } from "vitest";
import type { Item } from "./model.js";
const fixture = (): Item => ({ id: "esc-1", threadId: "thr_test", revision: 1, state: "ready", attempt: null, result: null, updatedAt: "2026-10-01T10:42:00Z", content: { type: "reply", summary: "Escrow follow-up", subject: "Missing refund", to: ["escrow@example.com"], cc: [], bcc: [], original: { from: "Escrow", body: "Your refund is on its way." }, draft: "Original draft" } });
afterEach(cleanup);
async function setup(composerText = "", saveFailure = false) {
  let item = fixture();
  const calls: string[] = [];
  const app = await loadPluginApp(() => import("./app.js"));
  const slot = renderSlot(app.messageDirectives[0]!, { attributes: { id: item.id }, source: '::action{id="esc-1"}', message: { id: "msg_1", threadId: "thr_test", turnId: null, projectId: null }, openWorkspaceFile: null }, {
    composer: { scope: { kind: "thread", threadId: "thr_test" }, text: composerText },
    rpc: {
      get: () => item,
      save: (input: { draft: string; revision: number }) => {
        calls.push("save");
        if (saveFailure) throw new Error("Draft could not be saved. Retry.");
        item = { ...item, revision: item.revision + 1, content: { ...fixture().content, draft: input.draft } } as Item;
        return item;
      },
      prepare: (input: { action: "send"; revision: number }) => {
        calls.push("prepare"); expect(input.revision).toBe(item.revision);
        item = { ...item, revision: item.revision + 1, state: "pending", attempt: { id: "ea45f71a-c216-4da4-a226-65736f4eccfd", action: input.action, claimed: false } }; return item;
      },
    },
  });
  await screen.findByRole("textbox", { name: "Draft" });
  return { slot, calls, get: () => item };
}
it("flushes an immediate edit before submitting Send exactly once", async () => {
  const { slot, calls, get } = await setup();
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "My latest edit" } });
  fireEvent.click(screen.getByRole("button", { name: "Send", exact: true }));
  fireEvent.click(screen.getByRole("button", { name: "Send", exact: true }));
  await waitFor(() => expect(slot.inspection.composer.submits).toHaveLength(1));
  expect(calls).toEqual(["save", "prepare"]);
  expect(get().content).toMatchObject({ draft: "My latest edit" });
  expect(screen.getByRole("textbox").getAttribute("readonly")).not.toBeNull();
});
it("keeps Ask for changes in the composer without submitting", async () => {
  const { slot } = await setup();
  fireEvent.click(screen.getByRole("button", { name: "Ask for changes" }));
  await waitFor(() => expect(slot.inspection.composer.text).toContain("[action:esc-1]"));
  expect(slot.inspection.composer.submits).toHaveLength(0);
  expect(slot.inspection.composer.focusCount).toBe(1);
});
it("preserves an existing composer message", async () => {
  const { slot, calls } = await setup("Please also check another message");
  fireEvent.click(screen.getByRole("button", { name: "Send", exact: true }));
  await screen.findByRole("alert");
  expect(slot.inspection.composer.text).toBe("Please also check another message");
  expect(slot.inspection.composer.submits).toHaveLength(0);
  expect(calls).toEqual([]);
});
it("keeps an unsaved edit visible and offers recovery without submitting", async () => {
  const { slot, calls } = await setup("", true);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Keep this edit" } });
  fireEvent.click(screen.getByRole("button", { name: "Send", exact: true }));
  await screen.findByRole("button", { name: "Retry save" });
  expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe("Keep this edit");
  expect(calls).toEqual(["save"]);
  expect(slot.inspection.composer.submits).toHaveLength(0);
});
