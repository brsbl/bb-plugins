// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { loadPluginApp, renderSlot } from "@get-bb/plugin-sdk/testing/app";
import { afterEach, expect, it, vi } from "vitest";
import type { State } from "./contract.js";
import type { Person, Row } from "./model.js";

afterEach(cleanup);

const person = (n: string, gh: string, extra: Partial<Person> = {}): Person => ({
  n, gh, li: "", d: false, role: "", champ: false, sl: false, i: 0, iu: "", p: 0, pu: "", il: [], pl: [], ...extra,
});
const row = (c: string, extra: Partial<Row>): Row => ({
  c, url: `https://${c.toLowerCase()}.example`, site: true, seg: "Team", pr: "P2", emp: 30, size: "11–50", src: "",
  country: "United States", region: "North America", iss: 0, prs: 0, dis: 0, slack: false, n: 1, ppl: [], ...extra,
});

const issues = Array.from({ length: 7 }, (_, i): [string, string, string, string] =>
  [`Issue ${i + 1}`, `2026-10-0${i + 1}`, i % 2 ? "closed" : "open", `https://github.com/example/repo/issues/${i + 1}`]);
const rows: Row[] = [
  row("Acme", { iss: 7, prs: 1, dis: 3, n: 2, slack: true, slack_ch: "acme-bb", ppl: [
    person("Ada Example", "octocat", { champ: true, role: "Engineer", il: issues, pl: [["Add a thing", "2026-10-02", "merged", "https://github.com/example/repo/pull/9"]], sl: true }),
    person("Bo Example", "hubot", { d: true, dd: { m: 3, l: "2026-10-03", u: "https://discord.example/m/1" } }),
  ] }),
  row("Globex", { seg: "Enterprise", emp: 5000, size: "1,001–5,000", country: "Germany", region: "Europe", prs: 2, n: 1, ppl: [
    person("Cy Sample", "monalisa", { pl: [["Fix it", "2026-09-01", "open", "https://github.com/example/repo/pull/1"], ["Fix more", "2026-09-02", "closed", "https://github.com/example/repo/pull/2"]] }),
  ] }),
  row("Initech", { seg: "Small team", emp: 8, size: "2–10", country: "", region: "", dis: 1, n: 3, ppl: [] }),
];
const snapshot = { updatedAt: "2026-10-29T06:00:00", rows };
const idle: State = { snapshot, status: { state: "idle" } };

async function setup(rpc: { getState: () => State | Promise<State>; refresh?: () => State["status"] }) {
  const app = await loadPluginApp(() => import("./app.js"));
  const view = renderSlot(app.navPanels[0]!, { subPath: "" }, { rpc: { refresh: () => ({ state: "updating" as const }), ...rpc } });
  return view;
}
const bodyRows = () => within(screen.getByRole("table")).getAllByRole("row").slice(1);
const companyOrder = () => bodyRows().map((r) => within(r).getAllByRole("cell")[0]!.textContent);

it("renders the saved table sorted by Users with totals, filters, search and sorting", async () => {
  await setup({ getState: () => idle });
  expect(await screen.findByRole("table")).toBeTruthy();
  expect(screen.getByText("Using = opening a GitHub issue or PR, posting in Discord, or having Slack Connect with us")).toBeTruthy();
  expect(screen.getByText(/Updated/).textContent).toBe("Updated Oct 29, 6:00 · updates daily");
  expect(companyOrder()).toEqual(["Initech", "Acme", "Globex"]);
  expect(screen.getByRole("columnheader", { name: /Users/ }).getAttribute("aria-sort")).toBe("descending");
  expect(document.querySelector(".sum")!.textContent).toBe("3 companies · 6 users");
  expect(screen.getByRole("link", { name: "Acme" }).getAttribute("href")).toBe("https://acme.example");
  expect(document.querySelector(".chip.pl-Small")!.textContent).toBe("Under 20");

  fireEvent.click(screen.getByRole("button", { name: "Company" }));
  expect(companyOrder()).toEqual(["Acme", "Globex", "Initech"]);
  fireEvent.click(screen.getByRole("button", { name: /Company/ }));
  expect(companyOrder()).toEqual(["Initech", "Globex", "Acme"]);
  fireEvent.click(screen.getByRole("button", { name: "Employees" }));
  expect(companyOrder()).toEqual(["Globex", "Acme", "Initech"]);

  fireEvent.change(screen.getByLabelText("bb plan"), { target: { value: "Enterprise" } });
  expect(companyOrder()).toEqual(["Globex"]);
  expect(document.querySelector(".sum")!.textContent).toBe("1 company · 1 user");
  fireEvent.change(screen.getByLabelText("bb plan"), { target: { value: "all" } });
  const regions = Array.from((screen.getByLabelText("Region") as HTMLSelectElement).options).map((o) => o.text);
  expect(regions).toEqual(["All", "North America", "Europe"]);
  fireEvent.change(screen.getByLabelText("Region"), { target: { value: "North America" } });
  expect(companyOrder()).toEqual(["Acme"]);
  fireEvent.change(screen.getByLabelText("Region"), { target: { value: "all" } });

  fireEvent.change(screen.getByLabelText("Search company or person"), { target: { value: "monalisa" } });
  expect(companyOrder()).toEqual(["Globex"]);
  fireEvent.change(screen.getByLabelText("Search company or person"), { target: { value: "bo example" } });
  expect(companyOrder()).toEqual(["Acme"]);
  expect(document.querySelector(".sum")!.textContent).toBe("1 company · 2 users");
  fireEvent.change(screen.getByLabelText("Search company or person"), { target: { value: "" } });
  fireEvent.click(screen.getByRole("button", { name: /Employees/ }));
  fireEvent.click(screen.getByRole("button", { name: "Users" }));
});

it("opens the people and items behind a count, and closes on Escape", async () => {
  await setup({ getState: () => idle });
  const acme = (await screen.findByRole("link", { name: "Acme" })).closest("tr")!;
  fireEvent.click(within(acme).getByRole("button", { name: "7" }));
  const panel = screen.getByRole("dialog");
  expect(panel.querySelector("h2")!.textContent).toBe("Acme 7 issues");
  expect(within(panel).getByRole("link", { name: "Ada Example" }).getAttribute("href")).toBe("https://github.com/octocat");
  expect(within(panel).getByText("Champion")).toBeTruthy();
  expect(within(panel).queryByText("Bo Example")).toBeNull();
  expect(within(panel).getAllByRole("listitem").map((li) => li.querySelector(".t")!.textContent)).toEqual(["Issue 7", "Issue 6", "Issue 5", "Issue 4", "Issue 3"]);
  fireEvent.click(within(panel).getByRole("button", { name: "Show 2 more" }));
  expect(within(panel).getAllByRole("listitem")).toHaveLength(7);
  fireEvent.click(within(panel).getByRole("button", { name: "Collapse all" }));
  expect(panel.querySelector(".pp")!.getAttribute("data-open")).toBe("0");
  expect(within(panel).getByRole("button", { name: "Expand all" })).toBeTruthy();
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.queryByRole("dialog")).toBeNull();

  fireEvent.click(within(acme).getByRole("button", { name: "2" }));
  expect(screen.getByRole("dialog").querySelector("h2")!.textContent).toBe("Acme 2 users");
  fireEvent.click(within(acme).getByRole("button", { name: "Connected" }));
  const slack = screen.getByRole("dialog");
  expect(slack.querySelector("h2")!.textContent).toBe("Acme 1 user");
  expect(within(slack).getByText("#acme-bb")).toBeTruthy();
  fireEvent.click(within(slack).getByRole("button", { name: "Close" }));
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("keeps the saved table while an update runs, then swaps to the new data in one step", async () => {
  let state: State = { snapshot, status: { state: "updating", startedAt: "2026-10-29T07:00:00Z" } };
  const view = await setup({ getState: () => state });
  expect(await screen.findByRole("table")).toBeTruthy();
  expect(screen.getByText(/Updated/).textContent).toBe("Updated Oct 29, 6:00 · updates daily · Updating…");
  const refresh = screen.getByRole("button", { name: "Update now" });
  expect(refresh.hasAttribute("disabled")).toBe(true);
  expect(refresh.querySelector(".spin")).toBeTruthy();
  expect(screen.queryByLabelText("Loading companies")).toBeNull();

  const grown = rows.map((r) => r.c === "Globex" ? { ...r, n: 9 } : r);
  state = { snapshot: { updatedAt: "2026-10-29T07:05:00", rows: grown }, status: { state: "idle" } };
  await view.emitRealtime("state-changed", {});
  await waitFor(() => expect(screen.getByText(/Updated/).textContent).toBe("Updated Oct 29, 7:05 · updates daily"));
  expect(companyOrder()).toEqual(["Globex", "Initech", "Acme"]);
  expect(document.querySelector(".sum")!.textContent).toBe("3 companies · 14 users");
  expect(screen.getByRole("button", { name: "Update now" }).querySelector(".spin")).toBeNull();
});

it("shows the failure banner over the saved table, and Retry calls refresh", async () => {
  let state: State = { snapshot, status: { state: "failed", error: "GitHub rate limit reached." } };
  const refresh = vi.fn(() => {
    state = { snapshot, status: { state: "updating" } };
    return state.status;
  });
  const view = await setup({ getState: () => state, refresh });
  const alert = await screen.findByRole("alert");
  expect(alert.querySelector("p")!.textContent).toBe("Couldn't update: GitHub rate limit reached. Showing data from Oct 29, 6:00.");
  expect(screen.getByRole("table")).toBeTruthy();
  fireEvent.click(within(alert).getByRole("button", { name: "Retry" }));
  await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  expect(screen.getByText(/Updated/).textContent).toContain("· Updating…");
  expect(view.rpcCalls.map((c) => c.method)).toContain("refresh");
});

it("shows a loading placeholder only before anything is saved", async () => {
  let state: State = { snapshot: null, status: { state: "updating" } };
  const view = await setup({ getState: () => state });
  expect(await screen.findByLabelText("Loading companies")).toBeTruthy();
  expect(screen.queryByRole("table")).toBeNull();
  expect(screen.queryByText(/Updated/)).toBeNull();
  state = idle;
  await view.emitRealtime("state-changed", {});
  expect(await screen.findByRole("table")).toBeTruthy();
  expect(screen.queryByLabelText("Loading companies")).toBeNull();
});
