// View model for the Companies using bb page: the row shape the server saves,
// plus the pure filter, sort and panel-item logic ported from the original page.

import type { Person, Row } from "../model.js";
import type { State } from "../contract.js";

export type { Person, Row, State };
/** Per-item engagement some seeded people carry (opened or commented), preferred over il/pl when present. */
type Engagement = { k: string; t: string; s: string; u: string; d: string; roles: string[] };
export type Snapshot = NonNullable<State["snapshot"]>;
export type Status = State["status"];

export type SortKey = "c" | "country" | "emp" | "seg" | "n" | "iss" | "prs" | "dis" | "slack";
export type Signal = "n" | "iss" | "prs" | "dis" | "slack";
export type View = { plan: string; reg: string; q: string; sort: SortKey; dir: 1 | -1 };

export const PLANS: [string, string][] = [["all", "All"], ["Team", "Team"], ["Enterprise", "Enterprise"], ["Strategic", "Strategic"], ["Small team", "Under 20"]];
const REGIONS = ["North America", "Europe", "Asia-Pacific", "Middle East & Africa", "Latin America"];
export const COLS: { key: SortKey; label: string; num?: boolean; tip?: string }[] = [
  { key: "c", label: "Company" },
  { key: "country", label: "Country", tip: "Headquarters country" },
  { key: "emp", label: "Employees", num: true },
  { key: "seg", label: "Plan" },
  { key: "n", label: "Users", num: true, tip: "People at this company using bb" },
  { key: "iss", label: "Issues", num: true, tip: "Issues opened in get-bb repos by this company's people" },
  { key: "prs", label: "PRs", num: true, tip: "PRs opened in get-bb repos by this company's people" },
  { key: "dis", label: "Discord", num: true, tip: "Messages this company's people posted in the bb Discord, all time" },
  { key: "slack", label: "Slack Connect", tip: "Has a Slack Connect channel with us" },
];
const ORDER: Record<string, number> = { Team: 1, Enterprise: 2, Strategic: 3, "Small team": 4, "Size unknown": 5 };

export function regions(rows: Row[]): [string, string][] {
  return [["all", "All"], ...REGIONS.filter((g) => rows.some((r) => r.region === g)).map((g): [string, string] => [g, g])];
}

export function visibleRows(rows: Row[], view: View): Row[] {
  const q = view.q.toLowerCase().trim();
  const k = view.sort, d = view.dir;
  const value = (row: Row): unknown => k === "seg" ? ORDER[row.seg] : row[k];
  return rows
    .filter((x) => (view.plan === "all" || x.seg === view.plan) && (view.reg === "all" || x.region === view.reg) &&
      (!q || x.c.toLowerCase().includes(q) || x.ppl.some((p) => `${p.n} ${p.gh}`.toLowerCase().includes(q))))
    .sort((x, y) => {
      const a = value(x), b = value(y);
      if (typeof a === "string") return d * a.localeCompare(String(b ?? ""));
      return d * (Number(a ?? 0) - Number(b ?? 0)) || (y.n - x.n) || (y.emp - x.emp);
    });
}

/** Clicking a header toggles direction on the active column; text columns start ascending. */
export function nextSort(view: View, key: SortKey): View {
  if (view.sort === key) return { ...view, dir: view.dir === 1 ? -1 : 1 };
  return { ...view, sort: key, dir: key === "c" || key === "seg" ? 1 : -1 };
}

export type PanelItem = { k: "Issue" | "PR" | "Discord" | "Slack"; t: string; st?: string; u: string; d: string; opened?: boolean };

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function itemsOf(p: Person, x: Row): PanelItem[] {
  const it: PanelItem[] = [];
  // Updates refresh only `il`/`pl`, so they win over the imported `eng` for titles and states, and any item they add is listed too.
  const authored = new Map<string, PanelItem>();
  for (const e of p.il) authored.set(e[3], { k: "Issue", t: e[0], st: e[2], u: e[3], d: e[1], opened: true });
  for (const e of p.pl) authored.set(e[3], { k: "PR", t: e[0], st: e[2], u: e[3], d: e[1], opened: true });
  for (const e of (p as { eng?: Engagement[] }).eng ?? []) {
    if (!authored.has(e.u)) it.push({ k: e.k === "pr" ? "PR" : "Issue", t: e.t, st: e.s, u: e.u, d: e.d, opened: e.roles.includes("opened") });
  }
  it.push(...authored.values());
  if (p.dm?.length) for (const m of p.dm) it.push({ k: "Discord", t: m.snippet || "Message", u: m.url, d: m.date });
  else if (p.d) it.push({ k: "Discord", t: p.dd?.m ? plural(p.dd.m, "message", "messages") : "Posted in Discord", u: p.dd?.u || "", d: p.dd?.l || "" });
  if (p.sl) it.push({ k: "Slack", t: "#" + (x.slack_ch || "Slack Connect channel"), u: x.slack_url || "", d: "" });
  return it;
}

const KEEP: Record<Signal, (i: PanelItem) => boolean> = {
  n: () => true,
  iss: (i) => i.k === "Issue" && !!i.opened,
  prs: (i) => i.k === "PR" && !!i.opened,
  dis: (i) => i.k === "Discord",
  slack: (i) => i.k === "Slack",
};

export type PanelPerson = { person: Person; link: string; items: PanelItem[] };

/** The people (and their items) behind one count, newest items first, plus the panel heading. */
export function panelFor(x: Row, sig: Signal): { people: PanelPerson[]; head: string } {
  const people: PanelPerson[] = [];
  let count = 0;
  for (const p of x.ppl) {
    const items = itemsOf(p, x).filter(KEEP[sig]).sort((m, n) => (n.d || "").localeCompare(m.d || ""));
    if (!items.length && sig !== "n") continue;
    count += items.filter((i) => i.k === "Issue" || i.k === "PR").length;
    people.push({ person: p, link: p.li || (p.gh ? `https://github.com/${p.gh}` : ""), items });
  }
  const shown = people.length;
  const head = {
    n: plural(shown, "user", "users"), slack: plural(shown, "user", "users"),
    iss: plural(count, "issue", "issues"), prs: plural(count, "PR", "PRs"), dis: plural(x.dis, "message", "messages"),
  }[sig];
  return { people, head };
}

export const fmtDay = (d: string) => d ? new Date(`${d}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";

/** "Oct 29, 6:00" in the viewer's local time. */
export function fmtStamp(iso: string): string {
  const at = new Date(iso);
  if (!Number.isFinite(at.getTime())) return "unknown";
  const day = at.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${day}, ${at.getHours()}:${String(at.getMinutes()).padStart(2, "0")}`;
}

export function heatMax(rows: Row[]): Record<"iss" | "prs" | "dis", number> {
  return {
    iss: Math.max(1, ...rows.map((r) => r.iss)),
    prs: Math.max(1, ...rows.map((r) => r.prs)),
    dis: Math.max(1, ...rows.map((r) => r.dis)),
  };
}
export const heatAlpha = (value: number, max: number) => (0.025 + 0.11 * (Math.log1p(value) / Math.log1p(max))).toFixed(3);
