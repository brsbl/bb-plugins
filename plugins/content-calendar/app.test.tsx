// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { loadPluginApp, renderSlot } from "@get-bb/plugin-sdk/testing/app";
import { afterEach, expect, it } from "vitest";
import type { ConnectionStatus } from "./contract.js";
import type { Item } from "./model.js";

afterEach(cleanup);

const status: ConnectionStatus = { state: "synced", calendarId: "cal", lastSyncedAt: new Date().toISOString(), queued: 0, conflicts: 0, message: null };
const item = (id: string, patch: Partial<Item>): Item => ({
  id, title: id, format: "tweet", status: "idea", date: null, time: null, days: 1, tray: null, target: null, notes: "",
  waitsOn: [], attachments: [], sync: "synced", conflict: null, pos: 1, notice: null, updatedAt: "2026-10-03T22:10:00Z", ...patch,
});
const fixtures = (): Item[] => [
  item("cc_posted", { title: "Portola tweet", status: "posted", date: "2026-10-01" }),
  item("cc_ambient", { title: "Ambient tweet", status: "drafting", date: "2026-10-07" }),
  item("cc_orchestr", { title: "Orchestration blog post", format: "blog", status: "ready", date: "2026-10-28", waitsOn: [{ id: "g1", kind: "pr", repo: "get-bb/bb", number: 4772, cleared: false }] }),
  item("cc_google", { title: "Made in Google", format: null, date: "2026-10-08" }),
  item("cc_later", { title: "Cloud sandboxes", format: "blog", tray: "later" }),
];

function rpc(items = fixtures()) {
  return {
    status: () => status,
    visible: () => ({ ok: true }),
    calendar: (input: unknown) => {
      const { from, to } = input as { from: string; to: string };
      return {
        items: items.filter((entry) => entry.date && entry.date >= from && entry.date <= to),
        evergreen: items.filter((entry) => entry.tray === "evergreen"),
        later: items.filter((entry) => entry.tray === "later"),
        status,
      };
    },
    move: (input: unknown) => {
      const { id, when } = input as { id: string; when: { date?: string; tray?: Item["tray"] } };
      const found = items.find((entry) => entry.id === id)!;
      Object.assign(found, { date: when.date ?? null, tray: when.tray ?? null });
      return found;
    },
  };
}

async function renderPage(subPath = "month/2026-10") {
  const app = await loadPluginApp(() => import("./app.js"));
  const page = app.navPanels.find((panel) => panel.id === "calendar")!;
  const slot = renderSlot(page, { subPath }, { rpc: rpc() });
  await screen.findByText("Ambient tweet");
  return slot;
}
const card = (title: string) => screen.getByText(title).closest<HTMLElement>("[data-item-id]")!;

it("registers the page, directive, detail panel, and connect form", async () => {
  const app = await loadPluginApp(() => import("./app.js"));
  expect(app.navPanels.map((panel) => [panel.id, panel.path, panel.icon])).toEqual([["calendar", "calendar", "Calendar"]]);
  expect(app.messageDirectives.map((directive) => directive.id)).toEqual(["content-calendar"]);
  expect(app.threadPanelActions.map((action) => action.id)).toEqual(["item"]);
  expect(app.pendingInteractions.map((interaction) => interaction.id)).toEqual(["connect-client"]);
});

it("gives every item a checkbox and never crosses anything out", async () => {
  await renderPage();
  expect(screen.getByRole("checkbox", { name: "Posted: Portola tweet" })).toHaveProperty("checked", true);
  expect(screen.getByRole("checkbox", { name: "Posted: Ambient tweet" })).toHaveProperty("checked", false);
  expect(screen.getByRole("checkbox", { name: "Posted: Cloud sandboxes" })).toHaveProperty("checked", false);
  // Posted items show only the format; the checkbox already says posted.
  expect(within(card("Portola tweet")).getByText("Tweet")).toBeTruthy();
  expect(within(card("Ambient tweet")).getByText("Tweet · Drafting")).toBeTruthy();
  for (const element of document.querySelectorAll<HTMLElement>("*")) expect(element.style.textDecoration).not.toContain("line-through");
  expect(readFileSync(new URL("./app.css", import.meta.url), "utf8")).not.toMatch(/line-through/);
});

it("labels items without a format and draws waiting items dashed", async () => {
  await renderPage();
  expect(within(card("Made in Google")).getByText("No format · Idea")).toBeTruthy();
  expect(card("Made in Google").className).toContain("cc-f-none");
  const gated = card("Orchestration blog post");
  expect(gated.dataset.gated).toBe("true");
  expect(gated.className).toContain("cc-gated");
  expect(within(gated).getByText("bb blog post · Waits on #4772")).toBeTruthy();
  expect(card("Ambient tweet").dataset.gated).toBe("false");
  expect(card("Ambient tweet").className).not.toContain("cc-gated");
});

it("shows both trays, with an empty tray inviting a drop", async () => {
  await renderPage();
  const evergreen = screen.getByRole("region", { name: "Evergreen" });
  expect(within(evergreen).getByText("Drop items here.")).toBeTruthy();
  expect(within(screen.getByRole("region", { name: "Later" })).getByText("Cloud sandboxes")).toBeTruthy();
});

it("moves an item a day with the keyboard and announces each step", async () => {
  const slot = await renderPage();
  const ambient = card("Ambient tweet");
  ambient.focus();
  fireEvent.keyDown(ambient, { key: " " });
  expect(screen.getByText(/Picked up Ambient tweet\. Wednesday, October 7\./)).toBeTruthy();
  fireEvent.keyDown(ambient, { key: "ArrowRight" });
  expect(screen.getByText(/^Thursday, October 8\./)).toBeTruthy();
  fireEvent.keyDown(ambient, { key: " " });
  await waitFor(() => expect(slot.inspection.rpcCalls).toContainEqual({ method: "move", input: { id: "cc_ambient", when: { date: "2026-10-08" }, after: "cc_google" } }));
  expect(screen.getByText(/Dropped Ambient tweet on Thursday, October 8\./)).toBeTruthy();
  await waitFor(() => expect(within(screen.getByRole("group", { name: "Thursday, October 8" })).getByText("Ambient tweet")).toBeTruthy());
});

it("cancels a keyboard move with Escape", async () => {
  const slot = await renderPage();
  const ambient = card("Ambient tweet");
  fireEvent.keyDown(ambient, { key: " " });
  fireEvent.keyDown(ambient, { key: "ArrowDown" });
  fireEvent.keyDown(ambient, { key: "Escape" });
  expect(screen.getByText(/Move cancelled\. Ambient tweet stays on Wednesday, October 7\./)).toBeTruthy();
  expect(slot.inspection.rpcCalls.some((call) => call.method === "move")).toBe(false);
});

it("renders an inline week from the directive and opens items in the side panel", async () => {
  const app = await loadPluginApp(() => import("./app.js"));
  const slot = renderSlot(app.messageDirectives[0]!, {
    attributes: { view: "week", start: "2026-10-05" }, source: '::content-calendar{view="week" start="2026-10-05"}',
    message: { id: "msg_1", threadId: "thr_test", turnId: null, projectId: null }, openWorkspaceFile: null,
  }, { rpc: rpc(), openThreadPanel: () => true });
  await screen.findByText("Ambient tweet");
  expect(screen.getByRole("region", { name: "Content calendar, Oct 5 – 11, 2026" })).toBeTruthy();
  expect(screen.getAllByRole("group", { name: /, October (5|6|7|8|9|10|11)$/ })).toHaveLength(7);
  expect(screen.queryByRole("region", { name: "Later" })).toBeNull();
  expect(slot.inspection.rpcCalls).toContainEqual({ method: "calendar", input: { from: "2026-10-05", to: "2026-10-11", trays: false } });
  fireEvent.click(screen.getByText("Ambient tweet"));
  expect(slot.inspection.navigateCalls).toContainEqual({ method: "openThreadPanel", options: { actionId: "item", title: "Ambient tweet", params: { itemId: "cc_ambient" } } });
  fireEvent.click(screen.getByRole("button", { name: "Open calendar" }));
  expect(slot.inspection.navigateCalls).toContainEqual({ method: "toPluginPanel", path: "calendar", options: { subPath: "week/2026-10-05" } });
});

it("explains invalid directive attributes", async () => {
  const app = await loadPluginApp(() => import("./app.js"));
  renderSlot(app.messageDirectives[0]!, {
    attributes: { view: "year", start: "2026" }, source: '::content-calendar{view="year"}',
    message: { id: "msg_1", threadId: "thr_test", turnId: null, projectId: null }, openWorkspaceFile: null,
  }, { rpc: rpc() });
  expect(screen.getByRole("alert").textContent).toContain("Unknown view");
});

it("submits the masked client form without rendering the values", async () => {
  const app = await loadPluginApp(() => import("./app.js"));
  const submitted: unknown[] = [];
  renderSlot(app.pendingInteractions[0]!, {
    interaction: { id: "int_1", threadId: "thr_test", title: "Google OAuth client", payload: null, createdAt: 0, expiresAt: null },
    submit: async (value) => { submitted.push(value); },
    cancel: async () => {},
  });
  const id = screen.getByLabelText("Client ID") as HTMLInputElement;
  const secret = screen.getByLabelText("Client secret") as HTMLInputElement;
  expect(id.type).toBe("password");
  expect(secret.type).toBe("password");
  fireEvent.change(id, { target: { value: "client-123" } });
  fireEvent.change(secret, { target: { value: "s3cret" } });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(submitted).toEqual([{ clientId: "client-123", clientSecret: "s3cret" }]));
  expect(document.body.textContent).not.toContain("s3cret");
});
