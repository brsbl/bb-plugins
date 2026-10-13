// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { loadPluginApp, renderSlot } from "@get-bb/plugin-sdk/testing/app";
import { afterEach, expect, it } from "vitest";
afterEach(cleanup);
const person = { id: "alex", name: "Alex Example", role: "Founder", companyId: "acme" };
const company = { id: "acme", name: "Acme Example" };
const track = { id: "customer", subjectType: "company", subjectId: "acme", kind: "customer", personId: "alex", stage: "M3 · Team", nextStep: "Schedule the demo", owner: "Sam Demo", date: null };
const customer = { company, person, track, scores: { championStrength: 5, roomToGrow: 4, caseStudyValue: 5, activePeople: 2 }, total: 16, tier: 1, tierOverride: null, why: "Fictional expansion potential" };
const investor = { company, person, track: { ...track, id: "investor", kind: "investor", stage: "Conversation", nextStep: "An introduction" }, scores: { companyScale: 4, socialProof: 3, introductions: 5, coMarketing: 2 }, total: 14, rank: 1, rankOverride: null, why: "Fictional introductions", legacyStage: "Conversation" };
it("shows independent heatmaps with numeric scores, milestones, and preserved investor history", async () => {
  const app = await loadPluginApp(() => import("./app"));
  const slot = renderSlot(app.navPanels[0]!, { subPath: "" }, { rpc: {
    customers: () => ({ items: [customer], total: 1, nextOffset: null }),
    investors: (input: any) => ({ items: input.query ? [] : [investor], total: input.query ? 0 : 1, rankCount: 1, nextOffset: null }),
    history: () => ({ items: [{ id: "note", companyId: "acme", personId: "alex", kind: "call", date: "2026-10-12", note: "<script>Fictional note</script>", track: "investor", createdAt: "now" }], people: [person], nextOffset: null }),
  }});
  expect(await slot.findByText("M3 · Team")).toBeDefined();
  expect(screen.getByLabelText("Champion strength: 5 of 5").textContent).toBe("5");
  fireEvent.click(screen.getByRole("button", { name: "Customers", exact: true }));
  expect(screen.queryByText("Loading pipeline…")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Investors", exact: true }));
  expect(await screen.findByText("An introduction")).toBeDefined();
  expect(screen.queryByText("M3 · Team")).toBeNull(); expect(screen.queryByText("Conversation")).toBeNull();
  expect(screen.getByLabelText("Introductions: 5 of 5").textContent).toBe("5");
  fireEvent.click(screen.getByRole("button", { name: "History for Alex Example" }));
  expect(await screen.findByText("<script>Fictional note</script>")).toBeDefined();
  expect(screen.getByText("Conversation")).toBeDefined(); expect(document.querySelector("script")).toBeNull();
  fireEvent.change(screen.getByRole("textbox", { name: "Search people or companies" }), { target: { value: "Missing Example" } });
  expect(await screen.findByText("No matches")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
  expect(await screen.findByText("An introduction")).toBeDefined();
});
it("keeps a failed manual rank editable, retries, and can restore score ordering", async () => {
  const app = await loadPluginApp(() => import("./app"));
  let calls = 0;
  const slot = renderSlot(app.navPanels[0]!, { subPath: "" }, { rpc: {
    customers: () => ({ items: [], total: 0, nextOffset: null }),
    investors: () => ({ items: [investor], total: 1, rankCount: 1, nextOffset: null }),
    setRank: () => { if (++calls === 1) throw new Error("Offline"); return { ...investor, rankOverride: 1 }; },
    autoRank: () => investor,
  }});
  await screen.findByText("Your customer companies go here"); fireEvent.click(screen.getByRole("button", { name: "Investors", exact: true }));
  fireEvent.click(await screen.findByRole("button", { name: "Change rank for Alex Example" }));
  fireEvent.change(screen.getByLabelText("Why it belongs here"), { target: { value: "Demo judgment" } });
  fireEvent.click(screen.getByRole("button", { name: "Save", exact: true }));
  expect(await screen.findByRole("alert")).toBeDefined(); expect(screen.getByLabelText("Why it belongs here").getAttribute("value")).toBe("Demo judgment");
  fireEvent.click(screen.getByRole("button", { name: "Save", exact: true }));
  await waitFor(() => expect(screen.queryByRole("form", { name: "Edit priority" })).toBeNull());
  expect(slot.inspection.rpcCalls.filter(c => c.method === "setRank").at(-1)?.input).toEqual({ id: "investor", rank: 1, why: "Demo judgment" });
  fireEvent.click(screen.getByRole("button", { name: "Change rank for Alex Example" }));
  fireEvent.click(screen.getByRole("button", { name: "Use score order" }));
  await waitFor(() => expect(slot.inspection.rpcCalls.some(c => c.method === "autoRank")).toBe(true));
});
it("offers retry after a failed read", async () => {
  const app = await loadPluginApp(() => import("./app")); let calls = 0;
  renderSlot(app.navPanels[0]!, { subPath: "" }, { rpc: { customers: () => { if (++calls === 1) throw new Error("unavailable"); return { items: [], total: 0, nextOffset: null }; } } });
  expect(await screen.findByText("Pipeline couldn’t load.")).toBeDefined(); fireEvent.click(screen.getByRole("button", { name: "Try again" })); expect(await screen.findByText("Your customer companies go here")).toBeDefined();
});
