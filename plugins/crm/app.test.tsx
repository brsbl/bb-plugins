// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { loadPluginApp, renderSlot } from "@get-bb/plugin-sdk/testing/app";
import { afterEach, expect, it } from "vitest";
afterEach(cleanup);
it("shows the two tracks together, expands history, filters and clears a search", async () => {
  const app = await loadPluginApp(() => import("./app"));
  const person = { id: "alex", name: "Alex Example", role: "Founder", companyId: "acme" };
  const tracks = ["customer", "investor"].map(kind => ({ id: kind, subjectType: "company", subjectId: "acme", kind, personId: "alex", stage: kind === "customer" ? "Champion engaged" : "Conversation", nextStep: kind === "customer" ? "Schedule the demo" : "Send the update", owner: "Sam Demo", date: null }));
  const slot = renderSlot(app.navPanels[0]!, { subPath: "" }, { rpc: {
    view: (input: any) => ({ groups: input.query ? [] : [{ subjectType: "company", subjectId: "acme", name: "Acme Example", people: [person], tracks: tracks.filter(t => !input.kind || t.kind === input.kind), historyCount: 1 }], total: input.query ? 0 : 1, nextOffset: null }),
    history: () => ({ items: [{ id: "event", companyId: "acme", personId: "alex", kind: "call", date: "2026-10-11", note: "<script>Fictional call note</script>", track: null, createdAt: "2026-10-11T00:00:00Z" }], people: [person], nextOffset: null }),
  }});
  expect(await slot.findByText("Schedule the demo")).toBeDefined();
  expect(screen.getAllByText("Alex Example")).toHaveLength(2);
  fireEvent.click(screen.getByRole("button", { name: "History for Acme Example" }));
  expect(await screen.findByText("<script>Fictional call note</script>")).toBeDefined();
  expect(document.querySelector("script")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Investors" }));
  await waitFor(() => expect(screen.queryByText("Schedule the demo")).toBeNull());
  expect(await screen.findByText("Send the update")).toBeDefined();
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Missing example" } });
  expect(await screen.findByText("No conversations found")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
  expect(await screen.findByText("Schedule the demo")).toBeDefined();
});
it("offers a retry after a failed read", async () => {
  const app = await loadPluginApp(() => import("./app"));
  let calls = 0;
  renderSlot(app.navPanels[0]!, { subPath: "" }, { rpc: { view: () => { if (++calls === 1) throw new Error("unavailable"); return { groups: [], total: 0, nextOffset: null }; } } });
  expect(await screen.findByText("Conversations couldn’t load.")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByText("Your conversations go here")).toBeDefined();
});

