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
afterEach(() => { cleanup(); submittedMessages.length = 0; submittedMentions.length = 0; localStorage.clear(); sessionStorage.clear(); });
// Radix tooltips measure their content; jsdom has no ResizeObserver.
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
// Answer a form field the way a person does: pick the radio, then press Submit.
function answer(label: RegExp | string, within_: HTMLElement = document.body) {
  fireEvent.click(within(within_).getByRole("radio", { name: label }));
}
function submit(within_: HTMLElement = document.body) {
  fireEvent.click(within(within_).getByRole("button", { name: /^Submit( \d+ answers?)?$/ }));
}
const source = { threadTitle: "Billing", threadProjectId: null };
const directiveProps = (id: string, threadId = "thr_test") => ({ attributes: { id }, source: `::action{id="${id}"}`, message: { id: "msg_1", threadId, turnId: null, projectId: null }, openWorkspaceFile: null });
const inThread = { composer: { scope: { kind: "thread" as const, threadId: "thr_test" } } };
// Open Waiting on you and the given item, the way a person does; a single item opens straight to its answer.
async function openItem(question: RegExp | string) {
  const header = await screen.findByRole("button", { name: /^Waiting on you/ });
  if (header.getAttribute("aria-expanded") === "false") fireEvent.click(header);
  const row = screen.queryByRole("button", { name: typeof question === "string" ? `Answer: ${question}` : question });
  if (row) fireEvent.click(row);
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
it("shows the brief in Waiting on you without naming the thread, and keeps the Decision log one click away", async () => {
  const item = { ...fixture(), threadTitle: "Workflow Inbox", threadProjectId: "proj_origin", content: { ...fixture().content, context: "What this is: the Inbox plan.\n\nNext: I keep the draft open if declined." } };
  const app = await loadPluginApp(() => import("./app.js"));
  const slot = renderSlot(app.composerCustomizations[0]!.banners![0]!, {}, { ...inThread, rpc: { waiting: () => [item], get: () => item } });
  await openItem(/^Answer: /);
  await screen.findByText(/Next: I keep the draft open/);
  expect(screen.queryByRole("button", { name: "Show more" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Add note" })).toBeNull();
  expect(screen.queryByText("Workflow Inbox")).toBeNull();
  expect(screen.queryByRole("button", { name: /Open thread/ })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Decision log" }));
  expect(slot.inspection.navigateCalls).toContainEqual(expect.objectContaining({ method: "toPluginPanel" }));
});

it("shows the original context on one line, never altered, with more only when some of it is hidden", async () => {
  const literal = "Keep `dry_run` enabled when revenue > cost.";
  const item = { ...fixture(), id: "merge-1", content: { type: "decide", question: "Merge the Inbox fix?", consequence: "Release it.", context: literal }, threadTitle: "Ops", threadProjectId: null } as const;
  const app = await loadPluginApp(() => import("./app.js"));
  renderSlot(app.composerCustomizations[0]!.banners![0]!, {}, { ...inThread, rpc: { waiting: () => [item], get: () => item } });
  await openItem(/^Answer: /);
  const line = document.querySelector<HTMLElement>(".ac-context-summary")!;
  // Identifiers and comparisons survive; it all fits, so there is nothing to reveal.
  expect(line.textContent).toContain("dry_run");
  expect(line.textContent).toContain("revenue > cost");
  expect(screen.queryByRole("button", { name: "Show all context" })).toBeNull();
  expect(screen.getAllByRole("radio")).toHaveLength(2);
});

it("offers more for a short context whose image the one-line view hides", async () => {
  const item = { ...fixture(), id: "chart-1", content: { type: "decide", question: "Ship the chart?", consequence: "Publish it.", context: "Before: ![chart](https://example.com/chart.png)" }, threadTitle: "Ops", threadProjectId: null } as const;
  const app = await loadPluginApp(() => import("./app.js"));
  renderSlot(app.composerCustomizations[0]!.banners![0]!, {}, { ...inThread, rpc: { waiting: () => [item], get: () => item } });
  await openItem(/^Answer: /);
  fireEvent.click(await screen.findByRole("button", { name: "Show all context" }));
  // The full view renders the original context, image included.
  expect(document.querySelector(".ac-context-full")?.textContent).toContain("Before:");
});

it("keeps question, options, then Dismiss and Submit at 390px", async () => {
  const { readFile } = await import("node:fs/promises");
  const { existsSync } = await import("node:fs");
  const local = `${process.cwd()}/app.css`;
  const css = await readFile(existsSync(local) ? local : `${process.cwd()}/plugins/inline-action-cards/app.css`, "utf8");
  // The phone layout flattens the card into one ordered column; the action row must sort after the options.
  const phone = css.slice(css.indexOf("@media (max-width: 639px)"));
  const orderOf = (selector: string) => Number(new RegExp(`${selector.replace(/[.]/g, "\\.")}[^{]*\\{[^}]*order: (\\d+)`).exec(phone)?.[1] ?? 0);
  expect(orderOf(".ac-drawer .ac-options")).toBe(1);
  expect(orderOf(".ac-drawer .iac-drawer-actions")).toBeGreaterThan(orderOf(".ac-drawer .ac-options"));
  // And in the document the options come before the action row.
  const item = { ...fixture(), id: "merge-1", content: { type: "decide", question: "Merge the PR?", consequence: "Squash-merge it." }, threadTitle: "Ops", threadProjectId: null } as const;
  const app = await loadPluginApp(() => import("./app.js"));
  renderSlot(app.composerCustomizations[0]!.banners![0]!, {}, { ...inThread, rpc: { waiting: () => [item], get: () => item } });
  await openItem(/^Answer: /);
  const options = document.querySelector(".ac-options")!;
  const actions = document.querySelector(".iac-drawer-actions")!;
  expect(options.compareDocumentPosition(actions) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

it("keeps rendered context in the line's muted color and small size", async () => {
  // jsdom gives import.meta.url an http scheme, so read the stylesheet from the plugin directory the tests run in.
  const { readFile } = await import("node:fs/promises");
  const { existsSync } = await import("node:fs");
  const local = `${process.cwd()}/ui/components.css`;
  const css = await readFile(existsSync(local) ? local : `${process.cwd()}/plugins/inline-action-cards/ui/components.css`, "utf8");
  expect(css).toMatch(/\.ac-context-line \* \{ color: inherit; font-size: inherit; line-height: inherit; \}/);
  expect(css).toMatch(/\.ac-context-line \{[^}]*color: var\(--muted-foreground\)[^}]*font-size: var\(--ac-meta\)/);
});

it("offers more for clipped context and shows the full original", async () => {
  const width = vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockImplementation(function (this: HTMLElement) { return this.classList.contains("ac-context-summary") ? 900 : 0; });
  const client = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(function (this: HTMLElement) { return this.classList.contains("ac-context-summary") ? 300 : 0; });
  try {
    const item = { ...fixture(), id: "merge-1", content: { type: "decide", question: "Merge the Inbox fix?", consequence: "Release it.", context: "- **What:** the fix.\n- **Checks:** [CI passed](https://example.com/ci)." }, threadTitle: "Ops", threadProjectId: null } as const;
    const app = await loadPluginApp(() => import("./app.js"));
    renderSlot(app.composerCustomizations[0]!.banners![0]!, {}, { ...inThread, rpc: { waiting: () => [item], get: () => item } });
    await openItem(/^Answer: /);
    fireEvent.click(await screen.findByRole("button", { name: "Show all context" }));
    expect(document.querySelector(".ac-context-full")?.textContent).toContain("CI passed");
    fireEvent.click(screen.getByRole("button", { name: "Show less context" }));
    expect(document.querySelector(".ac-context-full")).toBeNull();
  } finally { width.mockRestore(); client.mockRestore(); }
});

it("shows a waiting card's context and its answer form in the Decision log", async () => {
  const item = { ...fixture(), threadTitle: "Workflow Inbox", threadProjectId: null, content: { ...fixture().content, context: "Why now: the planning lead needs your direction." } };
  const app = await loadPluginApp(() => import("./app.js"));
  renderSlot(app.navPanels[0]!, { subPath: "" }, { rpc: { log: () => ({ waiting: [item], done: [] }) } });
  await screen.findByText(/Why now: the planning lead/);
  expect(screen.getByRole("button", { name: "Submit" })).toBeTruthy();
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
  // The last item answered: nothing waits, and the drawer confirms the answer instead of vanishing.
  expect((await screen.findByRole("status")).textContent).toBe("Sent “Send”");
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

it("leaves an unsent answer as one line that opens Waiting on you, where Resend sends it", async () => {
  let item: Item = { ...fixture(), revision: 3, state: "pending", attempt: { id: "ea45f71a-c216-4da4-a226-65736f4eccfd", action: "yes", claimed: false, note: "how do i test?" }, content: { type: "decide", question: "Merge PR #42?", consequence: "Squash-merge it.", yesLabel: "Merge" } };
  const app = await loadPluginApp(() => import("./app.js"));
  const rpc = { waiting: () => item.attempt?.sentAt ? [] : [{ ...item, ...source }], get: () => item, dispatch: async () => { const next = await dispatchFixture([item]); item = next[0]!; return next; } };
  renderSlot(app.messageDirectives[0]!, directiveProps(item.id), { rpc });
  renderSlot(app.composerCustomizations[0]!.banners![0]!, {}, { ...inThread, rpc });
  const line = await screen.findByRole("button", { name: "Not sent, in Waiting on you: Merge PR #42?" });
  fireEvent.click(line);
  expect(await screen.findByText(/Not sent: it didn't reach the agent\./)).toBeTruthy();
  expect(screen.getByText("“how do i test?”")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Resend" }));
  await waitFor(() => expect(submittedMessages).toHaveLength(1));
  expect(submittedMentions).toMatchObject([{ id: "thr_test:esc-1:ea45f71a-c216-4da4-a226-65736f4eccfd" }]);
});

it("shows answered and pending table rows as plain lines, never as cards", async () => {
  const items: Item[] = [
    { ...fixture(), id: "one", revision: 2, state: "pending", attempt: { id: "ea45f71a-c216-4da4-a226-65736f4eccfd", action: "yes", claimed: false }, content: { type: "decide", question: "Switch one?", consequence: "Keep schedules", yesLabel: "Switch" } },
    { ...fixture(), id: "two", revision: 3, state: "succeeded", attempt: { id: "ea45f71a-c216-4da4-a226-65736f4eccfe", action: "no", claimed: true }, result: { message: "Kept", retryable: false }, content: { type: "decide", question: "Switch two?", consequence: "Keep schedules", yesLabel: "Switch", noLabel: "Keep" } },
  ];
  const app = await loadPluginApp(() => import("./app.js"));
  renderSlot(app.messageDirectives[1]!, { attributes: { id: "digests" }, source: '::actions{id="digests"}', message: { id: "msg_1", threadId: "thr_test", turnId: null, projectId: null }, openWorkspaceFile: null }, {
    rpc: {
      table: () => ({ id: "digests", threadId: "thr_test", title: "Digests", ids: items.map((item) => item.id), items: items.map((item) => ({ ...item, followUps: [] })) }),
      get: (raw) => ({ ...items.find((item) => item.id === (raw as { id: string }).id)!, followUps: [] }),
    },
  });
  expect(await screen.findByRole("button", { name: "Not sent, in Waiting on you: Switch one?" })).toBeTruthy();
  expect(await screen.findByText("Decision: Keep")).toBeTruthy();
  cleanup();
  // An answered ask shows what the user wrote, once.
  const ask: Item = { ...fixture(), id: "channel", revision: 3, state: "succeeded", attempt: { id: "ea45f71a-c216-4da4-a226-65736f4eccfd", action: "answer", claimed: true, note: "#feedback" }, result: { message: "Answered", retryable: false }, content: { type: "ask", question: "Which channel?" } };
  renderSlot(app.messageDirectives[0]!, directiveProps(ask.id), { rpc: { get: () => ask } });
  expect(await screen.findByText("Answer: #feedback")).toBeTruthy();
  expect(screen.queryByText(/Answer: Answer/)).toBeNull();
  expect(screen.queryByRole("form")).toBeNull();
  expect(screen.queryByRole("button", { name: "Resend" })).toBeNull();
});

it("Decision log refresh updates the reviewed draft while preserving unsaved local edits", async () => {
  let item = { ...fixture(), threadTitle: "Refund follow-up", threadProjectId: "proj_cards" };
  const app = await loadPluginApp(() => import("./app.js"));
  const slot = renderSlot(app.navPanels[0]!, { subPath: "" }, { rpc: {
    log: () => ({ waiting: [item], done: [] }),
    save: () => { throw new Error("Offline: keep local changes"); },
  } });
  // A waiting reply is answered in place, so its draft is already in view.
  expect(((await screen.findByRole("textbox", { name: "Draft" })) as HTMLTextAreaElement).value).toBe("Original draft");
  item = { ...item, revision: 2, content: { ...item.content, draft: "Updated elsewhere" } } as typeof item;
  await slot.behavior.emitRealtime("items", {});
  await waitFor(() => expect((screen.getByRole("textbox", { name: "Draft" }) as HTMLTextAreaElement).value).toBe("Updated elsewhere"));
  fireEvent.change(screen.getByRole("textbox", { name: "Draft" }), { target: { value: "Unsaved local edit" } });
  item = { ...item, revision: 3, content: { ...item.content, draft: "Another remote update" } } as typeof item;
  await slot.behavior.emitRealtime("items", {});
  expect((screen.getByRole("textbox", { name: "Draft" }) as HTMLTextAreaElement).value).toBe("Unsaved local edit");
});

it("Decision log answers waiting cards in place, keeps failures and Later cards waiting with their controls, and collapses Done", async () => {
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
  // Waiting cards are forms: their options, then Dismiss and Submit.
  expect(within(decide!).getAllByRole("radio").map((radio) => radio.closest("label")?.textContent)).toEqual(["Merge", "Keep open"]);
  expect(within(decide!).getAllByRole("button").map((button) => button.textContent)).toEqual(["Dismiss", "Submit"]);
  // Labels that collide with Object.prototype keys render as plain options instead of crashing the log.
  expect(within(waiting).getByRole("radio", { name: "Constructor run" })).toBeTruthy();
  expect(within(ready!).getByRole("radio", { name: "Send" })).toBeTruthy();
  expect(within(ready!).getByRole("textbox", { name: "Draft" })).toBeTruthy();
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
  await waitFor(() => expect(screen.queryByRole("form")).toBeNull());
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

it("answers a choice in the Decision log: question, context, options, then Submit", async () => {
  const host = recordingHost(); plugin(host.bb);
  try {
    await host.harness.behavior.runCli(["create", "setup", "--thread", "thr_test", "--item", JSON.stringify({ type: "choice", question: "Which account setup?", recommended: "multi", context: "Existing threads keep theirs.", options: [{ id: "single", label: "One account" }, { id: "multi", label: "Several accounts" }] })]);
    const app = await loadPluginApp(() => import("./app.js"));
    const rpc = Object.fromEntries(["log", "get", "choose", "dispatch"].map((name) => [name, (input: unknown) => host.harness.behavior.callRpc(name, input)]));
    const slot = renderSlot(app.navPanels[0]!, { subPath: "" }, { rpc });
    const row = await screen.findByRole("article", { name: "Choice: Which account setup?" });
    // Reading order: question, context, options, then Submit.
    const parts = [within(row).getByText("Which account setup?", { selector: ".iac-log-title" }), within(row).getByText("Existing threads keep theirs."), within(row).getByRole("radio", { name: /One account/ }), within(row).getByRole("button", { name: "Submit" })];
    for (let index = 1; index < parts.length; index++) expect(parts[index - 1]!.compareDocumentPosition(parts[index]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(row).getAllByRole("radio").some((radio) => (radio as HTMLInputElement).checked)).toBe(false);
    fireEvent.click(within(row).getByRole("radio", { name: /Several accounts/ }));
    fireEvent.click(within(row).getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(submittedMentions).toHaveLength(1));
    expect(JSON.parse((await host.harness.behavior.runCli(["get", "setup", "--thread", "thr_test"])).stdout!)).toMatchObject({ state: "pending", attempt: { action: "choose", choice: { id: "multi" } } });
    expect(slot.inspection.navigateCalls).toEqual([]);
  } finally { await host.harness.lifecycle.dispose(); }
});

it("dismisses a waiting item from the Decision log with a reason, telling its thread once", async () => {
  const host = recordingHost(); plugin(host.bb);
  try {
    await host.harness.behavior.runCli(["create", "budget", "--thread", "thr_test", "--item", JSON.stringify({ type: "decide", question: "Raise the ads budget?", consequence: "Spend $50 a day.", context: "Brief." })]);
    const app = await loadPluginApp(() => import("./app.js"));
    const rpc = Object.fromEntries(["log", "get", "dismiss"].map((name) => [name, (input: unknown) => host.harness.behavior.callRpc(name, input)]));
    renderSlot(app.navPanels[0]!, { subPath: "" }, { rpc });
    const row = await screen.findByRole("article", { name: "Decision: Raise the ads budget?" });
    fireEvent.click(within(row).getByRole("button", { name: "Dismiss" }));
    const reason = screen.getByRole("textbox", { name: "Reason (optional)" });
    fireEvent.change(reason, { target: { value: "Paused the campaign" } });
    fireEvent.keyDown(reason, { key: "Enter" });
    await waitFor(() => expect(submittedMessages).toEqual(["brsbl dismissed: Raise the ads budget · Paused the campaign"]));
    const saved = JSON.parse((await host.harness.behavior.runCli(["get", "budget", "--thread", "thr_test"])).stdout!);
    expect(saved).toMatchObject({ state: "succeeded", attempt: null, result: { message: "Dismissed · Paused the campaign" }, dismissed: { reason: "Paused the campaign" } });
    const context = JSON.parse((await host.harness.registrations.mentionProviders[0]!.resolve(submittedMentions[0]!.id)).context);
    expect(context).toMatchObject({ intent: "dismissed", reason: "Paused the campaign" });
    expect(await screen.findByRole("region", { name: "Done" })).toBeTruthy();
  } finally { await host.harness.lifecycle.dispose(); }
});

it("Undo takes a dismissal back before anything is stored or sent", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  try {
    const item = { ...fixture(), id: "merge-1", content: { type: "decide", question: "Merge the PR?", consequence: "Squash-merges it." }, threadTitle: "Ops", threadProjectId: null } as const;
    const calls: unknown[] = [];
    const app = await loadPluginApp(() => import("./app.js"));
    renderSlot(app.navPanels[0]!, { subPath: "" }, { rpc: { log: () => ({ waiting: [item], done: [] }), dismiss: (input) => { calls.push(input); return { ...item, state: "succeeded" }; } } });
    const row = await screen.findByRole("article");
    fireEvent.click(within(row).getByRole("button", { name: "Dismiss" }));
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    await vi.advanceTimersByTimeAsync(10_000);
    expect(calls).toEqual([]);
    expect(within(row).getByRole("button", { name: "Dismiss" })).toBeTruthy();
    // Without Undo it goes through on its own, with no reason.
    fireEvent.click(within(row).getByRole("button", { name: "Dismiss" }));
    await vi.advanceTimersByTimeAsync(6_000);
    expect(calls).toEqual([expect.not.objectContaining({ reason: expect.anything() })]);
  } finally { vi.useRealTimers(); }
});

it("removes Undo as soon as a dismissal starts committing", async () => {
  const item = { ...fixture(), id: "merge-1", content: { type: "decide", question: "Merge the PR?", consequence: "Squash-merges it." }, threadTitle: "Ops", threadProjectId: null } as const;
  let finish!: () => void;
  const gate = new Promise<void>((resolve) => { finish = resolve; });
  const app = await loadPluginApp(() => import("./app.js"));
  renderSlot(app.navPanels[0]!, { subPath: "" }, { rpc: { log: () => ({ waiting: [item], done: [] }), dismiss: async () => { await gate; return { ...item, revision: 2, state: "succeeded", result: { message: "Dismissed", retryable: false }, dismissed: { at: "2026-10-18T10:00:00.000Z", notice: "sent" } }; } } });
  const row = await screen.findByRole("article");
  fireEvent.click(within(row).getByRole("button", { name: "Dismiss" }));
  expect(within(row).getByRole("button", { name: "Undo" })).toBeTruthy();
  fireEvent.keyDown(within(row).getByRole("textbox", { name: "Reason (optional)" }), { key: "Enter" });
  // Committing: Undo can no longer prevent the dismissal or its notice, so it is gone.
  expect(within(row).queryByRole("button", { name: "Undo" })).toBeNull();
  expect(within(row).getByText("Dismissing…")).toBeTruthy();
  finish();
  await waitFor(() => expect(within(row).queryByText("Dismissing…")).toBeNull());
});

it("shows a known undelivered dismissal notice and sends it once on retry", async () => {
  const item = { ...fixture(), id: "merge-1", revision: 2, state: "succeeded", result: { message: "Dismissed", retryable: false }, content: { type: "decide", question: "Merge the PR?", consequence: "Squash-merges it." }, dismissed: { at: "2026-10-18T10:00:00.000Z", notice: "failed", noticeError: "HTTP 409: Thread is archived" }, threadTitle: "Ops", threadProjectId: null } as const;
  const calls: unknown[] = [];
  const app = await loadPluginApp(() => import("./app.js"));
  renderSlot(app.navPanels[0]!, { subPath: "" }, { rpc: { log: () => ({ waiting: [], done: [item] }), notifyDismissed: (input) => { calls.push(input); return { ...item, revision: 3, dismissed: { at: item.dismissed.at, notice: "sent" } }; } } });
  expect(await screen.findByText(/its thread wasn't told/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Tell the thread" }));
  await waitFor(() => expect(screen.queryByText(/its thread wasn't told/)).toBeNull());
  expect(calls).toEqual([{ id: "merge-1", threadId: "thr_test" }]);
});

it.each([
  ["a safe failure", { state: "failed", attempt: { id: "ea45f71a-c216-4da4-a226-65736f4eccfd", action: "yes", claimed: true }, result: { message: "Head moved; nothing merged", retryable: true } }],
  ["an answer that never reached the agent", { state: "pending", attempt: { id: "ea45f71a-c216-4da4-a226-65736f4eccfd", action: "yes", claimed: false } }],
] as const)("offers Dismiss beside recovery in Waiting on you for %s", async (_, recovery) => {
  const item = { ...fixture(), id: "merge-1", revision: 3, content: { type: "decide", question: "Merge the PR?", consequence: "Squash-merge it." }, ...recovery, ...source } as Item & typeof source;
  const calls: unknown[] = [];
  const app = await loadPluginApp(() => import("./app.js"));
  renderSlot(app.composerCustomizations[0]!.banners![0]!, {}, { ...inThread, rpc: {
    waiting: () => calls.length ? [] : [item], get: () => item,
    dismiss: (input) => { calls.push(input); return { ...item, revision: 4, state: "succeeded", result: { message: "Dismissed", retryable: false }, dismissed: { at: "2026-10-18T10:00:00.000Z", notice: "sent" } }; },
  } });
  const header = await screen.findByRole("button", { name: /^Waiting on you/ });
  if (header.getAttribute("aria-expanded") === "false") fireEvent.click(header);
  fireEvent.click(await screen.findByRole("button", { name: "Dismiss" }));
  fireEvent.keyDown(screen.getByRole("textbox", { name: "Reason (optional)" }), { key: "Enter" });
  await waitFor(() => expect(calls).toEqual([expect.objectContaining({ id: "merge-1", revision: 3 })]));
});

it("locks recovery during a pending dismissal and drops the dismissal if the item changes", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  try {
    let item = { ...fixture(), id: "merge-1", revision: 3, state: "failed", attempt: { id: "ea45f71a-c216-4da4-a226-65736f4eccfd", action: "yes", claimed: true }, result: { message: "Head moved", retryable: true }, content: { type: "decide", question: "Merge the PR?", consequence: "Squash-merge it." }, ...source } as Item & typeof source;
    const calls: unknown[] = [];
    const app = await loadPluginApp(() => import("./app.js"));
    const slot = renderSlot(app.composerCustomizations[0]!.banners![0]!, {}, { ...inThread, rpc: {
      waiting: () => [item], get: () => item,
      dismiss: (input) => { calls.push(input); return { ...item, state: "succeeded" }; },
    } });
    const header = await screen.findByRole("button", { name: /^Waiting on you/ });
    if (header.getAttribute("aria-expanded") === "false") fireEvent.click(header);
    fireEvent.click(await screen.findByRole("button", { name: "Dismiss" }));
    expect((screen.getByRole("button", { name: "Choose again" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Retry" }) as HTMLButtonElement).disabled).toBe(true);
    // Another client reopens it before the Undo window ends: the pending dismissal must not carry over.
    item = { ...item, revision: 4, state: "ready", attempt: null, result: null };
    await slot.behavior.emitRealtime("items", {});
    await waitFor(() => expect(screen.queryByRole("button", { name: "Undo" })).toBeNull());
    await vi.advanceTimersByTimeAsync(10_000);
    expect(calls).toEqual([]);
  } finally { vi.useRealTimers(); }
});

it("dismisses the open item in Waiting on you", async () => {
  const item = fixture();
  let dismissed = false;
  const app = await loadPluginApp(() => import("./app.js"));
  renderSlot(app.composerCustomizations[0]!.banners![0]!, {}, { composer: { scope: { kind: "thread", threadId: "thr_test" } }, rpc: {
    waiting: () => dismissed ? [] : [{ ...item, ...source }], get: () => item,
    dismiss: () => { dismissed = true; return { ...item, revision: 2, state: "succeeded", result: { message: "Dismissed", retryable: false }, dismissed: { at: "2026-10-18T10:00:00.000Z" } }; },
  } });
  await openItem(/^Answer: /);
  fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
  fireEvent.keyDown(screen.getByRole("textbox", { name: "Reason (optional)" }), { key: "Enter" });
  await waitFor(() => expect(screen.queryByRole("form")).toBeNull());
  expect(screen.getByText("Dismissed")).toBeTruthy();
  expect(dismissed).toBe(true);
});

it("lists a failed reply in Waiting on you, where Retry sends it again", async () => {
  const failed: Item = { ...fixture(), revision: 3, state: "failed", attempt: { id: "ea45f71a-c216-4da4-a226-65736f4eccfd", action: "send", claimed: true }, result: { message: "Reconnect Gmail", retryable: true } };
  const calls: string[] = [];
  const app = await loadPluginApp(() => import("./app.js"));
  const rpc = {
    waiting: () => calls.length ? [] : [{ ...failed, ...source }],
    get: () => failed,
    prepare: () => { calls.push("prepare"); return { ...failed, revision: 4, state: "pending", attempt: { id: "ea45f71a-c216-4da4-a226-65736f4eccfe", action: "send", claimed: false } }; },
    dispatch: () => dispatchFixture([{ ...failed, revision: 4, state: "pending", attempt: { id: "ea45f71a-c216-4da4-a226-65736f4eccfe", action: "send", claimed: false } }]),
  };
  renderSlot(app.messageDirectives[0]!, directiveProps(failed.id), { rpc });
  renderSlot(app.composerCustomizations[0]!.banners![0]!, {}, { ...inThread, rpc });
  fireEvent.click(await screen.findByRole("button", { name: "Failed, in Waiting on you: Reply to billing@example.com: Missing refund" }));
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
  renderSlot(app.composerCustomizations[0]!.banners![0]!, {}, { ...inThread, rpc: { waiting: () => [{ ...item, ...source }], get: () => item } });
  renderSlot(app.messageDirectives[0]!, directiveProps(item.id), { rpc: { get: () => item } });
  fireEvent.click(await screen.findByRole("button", { name: "In Waiting on you: Reply to billing@example.com: Missing refund" }));
  expect(await screen.findByRole("form")).toBeTruthy();
  expect(screen.getByRole("button", { name: /^Waiting on you/ }).getAttribute("aria-expanded")).toBe("true");
});

it("lists this thread's items urgent first with age, steps through them, and hides when nothing waits", async () => {
  const at = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();
  const decide = (id: string, question: string, minutes: number, priority?: "urgent" | "low") => ({ ...fixture(), id, updatedAt: at(minutes), content: { type: "decide" as const, question, consequence: "Do it.", ...(priority ? { priority } : {}) }, threadTitle: `Thread ${id}`, threadProjectId: null });
  let waiting = [decide("urgent", "Ship it?", 5, "urgent"), decide("old", "Archive it?", 3 * 24 * 60), decide("new", "Rename it?", 90)];
  const app = await loadPluginApp(() => import("./app.js"));
  const slot = renderSlot(app.composerCustomizations[0]!.banners![0]!, {}, { ...inThread, rpc: { waiting: () => waiting, get: (raw) => waiting.find((item) => item.id === (raw as { id: string }).id)! } });
  const header = await screen.findByRole("button", { name: /^Waiting on you/ });
  // Collapsed by default: one quiet line with the top question and a count.
  expect(header.getAttribute("aria-expanded")).toBe("false");
  expect(header.textContent).toBe("Waiting on you· Urgent · Ship it?3");
  fireEvent.click(header);
  const rows = within(await screen.findByRole("list")).getAllByRole("button");
  expect(rows.map((row) => row.getAttribute("aria-label"))).toEqual(["Answer: Ship it?", "Answer: Archive it?", "Answer: Rename it?"]);
  expect(rows[0]!.textContent).not.toContain("Thread urgent");
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

it("marks a question asked again with the earlier answer, steps through items, and collapses on Escape", async () => {
  const at = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();
  const waiting = [
    { ...fixture(), id: "headline-v2", updatedAt: at(1), earlier: "Run your agents like a team", content: { type: "decide" as const, question: "Which headline?", consequence: "Use it." }, ...source },
    { ...fixture(), id: "budget", updatedAt: at(5), content: { type: "decide" as const, question: "Raise the budget?", consequence: "Do it." }, ...source },
  ];
  const app = await loadPluginApp(() => import("./app.js"));
  renderSlot(app.composerCustomizations[0]!.banners![0]!, {}, { ...inThread, rpc: { waiting: () => waiting, get: (raw) => waiting.find((item) => item.id === (raw as { id: string }).id)! } });
  const header = await screen.findByRole("button", { name: /^Waiting on you/ });
  if (header.getAttribute("aria-expanded") === "false") fireEvent.click(header);
  expect(header.textContent).toContain("· 2");
  const row = screen.getByRole("button", { name: "Answer: Which headline?" });
  expect(row.textContent).toContain("Asked again · you said “Run your agents like a team”");
  fireEvent.click(row);
  expect(within(await screen.findByRole("form")).queryByText("1 of 2")).toBeNull();
  expect(screen.getByText("1 of 2")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(await screen.findByText("2 of 2")).toBeTruthy();
  // Number keys pick an option, as in bb's question form, only while focus is in the open card.
  expect(screen.getByText("2", { selector: "kbd" })).toBeTruthy();
  const composer = document.body.appendChild(document.createElement("textarea"));
  fireEvent.keyDown(composer, { key: "1" });
  fireEvent.keyDown(window, { key: "1" });
  expect((screen.getByRole("radio", { name: /^Yes/ }) as HTMLInputElement).checked).toBe(false);
  fireEvent.keyDown(screen.getByRole("radio", { name: /^No/ }), { key: "1" });
  expect((screen.getByRole("radio", { name: /^Yes/ }) as HTMLInputElement).checked).toBe(true);
  // Focus follows the pick, so Enter submits it rather than a focused header control.
  expect(document.activeElement).toBe(screen.getByRole("radio", { name: /^Yes/ }));
  composer.remove();
  fireEvent.keyDown(screen.getByRole("form"), { key: "Escape" });
  await waitFor(() => expect(header.getAttribute("aria-expanded")).toBe("false"));
});

it("never answers a collapsed or unfocused card from the keyboard", async () => {
  const item = { ...fixture(), content: { type: "decide" as const, question: "Merge it?", consequence: "Squash-merge it." }, ...source };
  const calls: string[] = [];
  const app = await loadPluginApp(() => import("./app.js"));
  renderSlot(app.composerCustomizations[0]!.banners![0]!, {}, { ...inThread, rpc: { waiting: () => [item], get: () => item, prepare: () => { calls.push("prepare"); return item; } } });
  const header = await screen.findByRole("button", { name: /^Waiting on you/ });
  if (header.getAttribute("aria-expanded") === "true") fireEvent.click(header);
  expect(header.getAttribute("aria-expanded")).toBe("false");
  for (const target of [document.body, window, header]) { fireEvent.keyDown(target, { key: "1" }); fireEvent.keyDown(target, { key: "Enter" }); }
  fireEvent.click(header);
  await screen.findByRole("radio", { name: /^Yes/ });
  // Open but not focused: the keys still do nothing.
  fireEvent.keyDown(document.body, { key: "1" });
  expect((screen.getByRole("radio", { name: /^Yes/ }) as HTMLInputElement).checked).toBe(false);
  expect(calls).toEqual([]);
});

it("asks only for the current thread's items and stays away outside a thread", async () => {
  const calls: unknown[] = [];
  const app = await loadPluginApp(() => import("./app.js"));
  renderSlot(app.composerCustomizations[0]!.banners![0]!, {}, { composer: { scope: { kind: "thread", threadId: "thr_other" } }, rpc: { waiting: (input) => { calls.push(input); return []; } } });
  await waitFor(() => expect(calls).toContainEqual({ threadId: "thr_other" }));
  expect(screen.queryByRole("region", { name: "Waiting on you" })).toBeNull();
  cleanup();
  renderSlot(app.composerCustomizations[0]!.banners![0]!, {}, { composer: { scope: { kind: "new-thread", projectId: null } }, rpc: { waiting: (input) => { calls.push(input); return []; } } });
  expect(screen.queryByRole("region", { name: "Waiting on you" })).toBeNull();
  expect(calls.every((input) => (input as { threadId: string }).threadId === "thr_other")).toBe(true);
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
    const field = screen.getByRole("textbox", { name: "Your answer" });
    fireEvent.change(field, { target: { value: "#feedback" } });
    fireEvent.keyDown(field, { key: "Enter", shiftKey: true });
    expect(submittedMessages).toEqual([]);
    fireEvent.keyDown(field, { key: "Enter" });
    await waitFor(() => expect(submittedMessages).toEqual(["Answer Which channel should the report post to — #feedback"]));
    expect((await screen.findByRole("status")).textContent).toBe("Sent “#feedback”");
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
