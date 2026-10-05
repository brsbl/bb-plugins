// @vitest-environment jsdom

import { act, cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { loadPluginApp, renderSlot } from "@get-bb/plugin-sdk/testing/app";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => { cleanup(); vi.useRealTimers(); });

const LEAGUE = {
  leagueName: "Globo Gym International Inc",
  scoring: "h",
  transactionMode: "waivers",
  currentEvent: 2,
  nextEvent: 3,
  events: [
    { id: 1, name: "Gameweek 1", deadlineTime: "2026-08-21T17:30:00Z", finished: true, started: true },
    { id: 2, name: "Gameweek 2", deadlineTime: "2026-08-28T17:30:00Z", finished: false, started: true },
    { id: 3, name: "Gameweek 3", deadlineTime: "2026-09-04T17:30:00Z", finished: false, started: false },
  ],
  managers: [
    { leagueEntryId: 126586, entryId: 126068, teamName: "Banana Breath", managerName: "P D", shortName: "BB", waiverPick: 6 },
    { leagueEntryId: 126585, entryId: 126067, teamName: "Mighty Frog FC", managerName: "W K", shortName: "MF", waiverPick: 3 },
  ],
  viewerLeagueEntryId: 126586,
  viewerWarning: null,
};

const WEEK = {
  event: 2,
  live: true,
  fetchedAt: "2026-09-01T12:00:00Z",
  matchups: [
    {
      event: 2, started: true, finished: false,
      home: { leagueEntryId: 126585, teamName: "Mighty Frog FC", managerName: "W K", points: 31, result: "L" as const },
      away: { leagueEntryId: 126586, teamName: "Banana Breath", managerName: "P D", points: 44, result: "W" as const },
    },
  ],
  table: [
    { leagueEntryId: 126586, rank: 1, won: 1, drawn: 1, lost: 0, played: 2, pointsFor: 81, pointsAgainst: 62, leaguePoints: 4, rankDelta: 2, liveLeaguePoints: 3, form: ["D", "W"] as const, averageFor: 40.5 },
    { leagueEntryId: 126585, rank: 2, won: 0, drawn: 0, lost: 2, played: 2, pointsFor: 62, pointsAgainst: 81, leaguePoints: 0, rankDelta: 0, liveLeaguePoints: 0, form: ["L", "L"] as const, averageFor: 31 },
  ],
};

const sq = (o: Record<string, unknown>) => ({
  elementId: 1, name: "Player", team: "EVE", position: "GKP" as const, slot: 1,
  starting: true, eventPoints: 3, eventMinutes: 90, minutesPerGame: 90,
  availability: "a", news: "", ...o,
});

/** One player per combination of availability and playing time. */
const MULTI_WEEK = {
  ...WEEK,
  matchups: [
    WEEK.matchups[0]!,
    {
      event: 2, started: true, finished: false,
      home: { leagueEntryId: 900, teamName: "Pot of Greed", managerName: "M M", points: 25, result: "L" as const },
      away: { leagueEntryId: 901, teamName: "Cosmic Gumbo", managerName: "P V", points: 39, result: "W" as const },
    },
  ],
};

const SQUAD = {
  available: true, reason: null,
  players: [
    sq({ elementId: 1, name: "Fit", minutesPerGame: 90 }),
    sq({ elementId: 2, name: "Injured", position: "DEF" as const, slot: 2, availability: "i", news: "Calf injury", minutesPerGame: 88 }),
    sq({ elementId: 3, name: "Doubtful", position: "DEF" as const, slot: 3, availability: "d", news: "Knock", minutesPerGame: 85 }),
    sq({ elementId: 4, name: "Fringe", position: "MID" as const, slot: 4, minutesPerGame: 12 }),
    sq({ elementId: 5, name: "InjuredFringe", position: "MID" as const, slot: 5, availability: "i", news: "Foot", minutesPerGame: 4 }),
    sq({ elementId: 6, name: "DoubtfulFringe", position: "FWD" as const, slot: 15, starting: false, availability: "d", news: "Ill", minutesPerGame: 9 }),
  ],
};

const cand = (o: Record<string, unknown> = {}) => ({
  elementId: 10, name: "Egan", team: "HUL", pointsPerGame: 3.4, minutesPerGame: 90,
  seasonPoints: 17, goals: 0, assists: 1, defending: 34, bonus: 1,
  availability: "a", news: "",
  fplStats: { pointsPerMatch: 6.8, form: 4.2, minutes: 450, starts: 5, cleanSheets: 2, expectedGoals: 1.23, expectedAssists: 0.45 },
  opponents: [{ opponent: "AVL", averagePoints: null, sample: 0, difficulty: 3, isHome: true, event: 3 }],
  ...o,
});

const LIVRAMENTO = cand({ elementId: 3, name: "Livramento", team: "NEW", pointsPerGame: 0, minutesPerGame: 0, seasonPoints: 0, goals: 0, assists: 0, defending: 0, bonus: 0, availability: "i", news: "Calf injury", opponents: [] });
const PERRI = cand({ elementId: 4, name: "Perri", team: "LEE", pointsPerGame: 0, minutesPerGame: 0, seasonPoints: 0, opponents: [] });

const PLAN = {
  available: true, reason: null, waiverPick: 6, totalManagers: 12,
  fetchedAt: "2026-09-01T12:00:00Z",
  weakSpots: [
    { position: "DEF" as const, player: LIVRAMENTO, weakness: "injured" as const },
    { position: "GKP" as const, player: PERRI, weakness: "fringe" as const },
    { position: "FWD" as const, player: cand({ elementId: 6, name: "DoubtfulFringe", team: "BRE", minutesPerGame: 9, pointsPerGame: 0.2, availability: "d", news: "Ill" }), weakness: "doubtful" as const },
  ],
  swaps: [
    {
      position: "DEF" as const,
      out: LIVRAMENTO,
      in: cand(),
      fallbacks: [cand({ elementId: 11, name: "Dedić", pointsPerGame: 2.4 })],
      gain: 3.1,
      // Nine managers need a defender; four of them pick before seat 6.
      competition: { position: "DEF" as const, managersNeeding: 9, totalManagers: 12, needingPicks: [1, 2, 4, 5, 7, 8, 9, 11, 12] },
    },
    {
      position: "GKP" as const,
      out: PERRI,
      in: cand({ elementId: 12, name: "Rushworth", team: "COV", pointsPerGame: 0.6 }),
      fallbacks: [],
      gain: 0.5,
      competition: { position: "GKP" as const, managersNeeding: 4, totalManagers: 12, needingPicks: [6, 8, 10, 12] },
    },
  ],
};

const rpc = (o: Record<string, unknown> = {}) => ({
  getLeague: () => LEAGUE, getWeek: () => WEEK, getSquad: () => SQUAD, getWaiverPlan: () => PLAN, getNextWaiverOrder: () => null, ...o,
});

async function render(opts: { subPath?: string; rpc?: Record<string, unknown> } = {}) {
  const app = await loadPluginApp(() => import("./app"));
  return renderSlot(app.navPanels[0]!, { subPath: opts.subPath ?? "" }, {
    rpc: rpc(opts.rpc), settings: { leagueId: "4211" },
  });
}

/** The pitch cards for a player, found by a stable hook rather than styling. */
function playerCards(name: string): HTMLElement[] {
  return screen
    .queryAllByText(name)
    .map((node) => node.closest("[data-player-card]"))
    .filter((el): el is HTMLElement => el !== null);
}

describe("league surface", () => {
  it("asks the agent with a week mention while preserving the existing draft", async () => {
    const slot = await render();
    await screen.findByRole("button", { name: "Ask agent" });
    await slot.behavior.setComposerText("My question.");
    fireEvent.click(screen.getByRole("button", { name: "Ask agent" }));
    expect(slot.inspection.composer.mentions).toEqual([
      { provider: "week", id: '["4211",2]', label: "FPL Draft · GW 2" },
    ]);
    expect(slot.inspection.composer.text).toContain("My question.\n\nWhat does this week");
    expect(slot.inspection.composer.text).not.toContain("Banana Breath");
    expect(slot.inspection.navigateCalls).toEqual([
      { method: "toCompose", options: { focusPrompt: true } },
    ]);
  });

  it("lists every matchup with its score", async () => {
    await render();
    const row = await screen.findByRole("button", { name: /Mighty Frog FC.*31.*44.*Banana Breath/ });
    expect(within(row).getByText("Mighty Frog FC")).toBeTruthy();
    expect(within(row).getByText("Banana Breath")).toBeTruthy();
    expect(within(row).getByText("31")).toBeTruthy();
    expect(within(row).getByText("44")).toBeTruthy();
  });

  it.each([false, true])("orders matches by the winning score and refreshes the order (live: %s)", async live => {
    const match = (id: number, name: string, home: number, away: number) => ({
      ...WEEK.matchups[0]!, finished: !live,
      home: { ...WEEK.matchups[0]!.home, leagueEntryId: id, teamName: name, points: home },
      away: { ...WEEK.matchups[0]!.away, leagueEntryId: id + 1, teamName: `${name} opponent`, points: away },
    });
    const matchups = [
      match(10, "Lower winner", 39, 38),
      match(20, "Draw", 44, 44),
      WEEK.matchups[0]!,
      match(30, "Away winner", 5, 60),
      match(40, "Home winner", 60, 1),
      { ...match(50, "Unplayed", 0, 0), started: false },
    ];
    const originalOrder = matchups.map(row => row.home.teamName);
    await render({ rpc: { getWeek: () => ({ ...WEEK, live, matchups }) } });
    await screen.findByRole("button", { name: /Home winner.*60/ });
    const names = () => Array.from(document.querySelectorAll('[data-match-toggle]'))
      .map(row => row.firstElementChild?.firstElementChild?.firstElementChild?.textContent);
    expect(names()).toEqual(["Away winner", "Home winner", "Draw", "Mighty Frog FC", "Lower winner", "Unplayed"]);
    expect(matchups.map(row => row.home.teamName)).toEqual(originalOrder);
    expect(screen.getByRole("button", { name: /Mighty Frog FC.*Banana Breath/ }).getAttribute("aria-expanded")).toBe("true");

    matchups[0]!.home.points = 70;
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await waitFor(() => expect(names()[0]).toBe("Lower winner"));
  });

  it("opens your own match by default and shows both squads", async () => {
    await render();
    await waitFor(() => expect(playerCards("Fit").length).toBe(2));
    const rows = screen.getAllByRole("button", { expanded: true });
    expect(rows).toHaveLength(1);
  });

  it("keeps several matchups open at once", async () => {
    await render({ rpc: { getWeek: () => MULTI_WEEK } });
    await screen.findByText("Pot of Greed");
    const collapsed = screen.getAllByRole("button", { expanded: false });
    fireEvent.click(collapsed[0]!);
    await waitFor(() =>
      expect(screen.getAllByRole("button", { expanded: true }).length).toBe(2),
    );
  });

  it("explains an unpublished week rather than rendering an empty pitch", async () => {
    await render({
      rpc: { getSquad: () => ({ available: false, reason: "Squads for gameweek 3 are not published yet.", players: [] }) },
    });
    await waitFor(() => expect(screen.getAllByText(/not published yet/).length).toBe(2));
  });
});

describe("waiver surface", () => {
  async function open() {
    await render({ subPath: "waivers" });
    await screen.findByText("League: Globo Gym International Inc");
    await screen.findByText("Egan");
  }

  it("lists the weakest spots worst first, each with a plain reason", async () => {
    await open();
    const spots = document.querySelectorAll("[data-weak-spot]");
    expect(spots.length).toBe(3);
    expect(spots[0]?.textContent).toContain("Livramento");
    expect(spots[0]?.textContent).toContain("Injured");
    expect(spots[1]?.textContent).toContain("Limited minutes");
    expect(spots[2]?.textContent).toContain("Doubtful");
    const stats = within(spots[2] as HTMLElement);
    expect(stats.getByText("17")).toBeTruthy();
    expect(stats.getByText("450")).toBeTruthy();
    expect(stats.queryByText("0.2")).toBeNull();
  });

  it("numbers the weak spots on the pitch to match the list", async () => {
    await open();
    await screen.findByText("Egan");
    const badges = Array.from(document.querySelectorAll("[data-player-card] [data-badge]"), (b) => b.textContent);
    // Weak spots 1 and 3 (ids 3 and 6) are in the squad fixture; spot 2 (id 4) is Fringe, so it is too.
    expect(badges).toEqual(["1", "2", "3"]);
  });

  it("orders the claims and leads with the position, outgoing player, then incoming player", async () => {
    await open();
    const claims = document.querySelectorAll("[data-claim]");
    expect(claims.length).toBe(2);
    for (const [index, position, outgoing, incoming] of [[0, "DEF", "Livramento", "Egan"], [1, "GKP", "Perri", "Rushworth"]] as const) {
      const card = claims[index]!;
      expect(card.querySelector("[data-claim-header]")?.textContent).toBe(`${position}Priority ${index + 1}`);
      const transfer = within(card.querySelector<HTMLElement>("[data-claim-transfer]")!);
      expect(transfer.getByText(outgoing).compareDocumentPosition(transfer.getByText(incoming)) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });

  it("toggles once when clicking stats, fixtures, header, or the expanded comparison", async () => {
    await open();
    const card = document.querySelector<HTMLElement>("[data-claim]")!;
    const toggle = within(card).getByRole("button", { name: "Claim 1, defender: Livramento out, Egan in" });
    fireEvent.click(within(card).getByText("Minutes played"));
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(within(card.querySelector<HTMLElement>("[data-claim-stats]")!).getByText("xG"));
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(within(card).getByRole("img", { name: /AVL home/ }));
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(within(card).getAllByText("Egan")[0]!);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
  });

  it.each(["Enter", " "])("supports %j to expand and collapse the whole card", async key => {
    await open();
    const card = document.querySelector<HTMLElement>("[data-claim]")!;
    const toggle = within(card).getByRole("button", { name: "Claim 1, defender: Livramento out, Egan in" });
    toggle.focus();
    expect(document.activeElement).toBe(toggle);
    fireEvent.keyDown(toggle, { key });
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    fireEvent.keyDown(toggle, { key, repeat: true });
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    fireEvent.keyUp(toggle, { key });
    fireEvent.keyDown(toggle, { key });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("counts only the rivals ahead in the waiver order who need the position", async () => {
    await open();
    const [first, second] = Array.from(document.querySelectorAll("[data-claim]"));
    // Nine managers need a defender, but only seats 1, 2, 4 and 5 beat seat 6.
    expect(first?.textContent).not.toContain("Est. demand");
    fireEvent.click(first!.querySelector('[role="button"]')!);
    expect(first?.textContent).toMatch(/4 of 5 ahead in the last published order need a defender/);
    expect(first?.querySelector("[role=img][aria-label^='Last published order']")).toBeTruthy();
    fireEvent.click(second!.querySelector('[role="button"]')!);
    expect(second?.textContent).toMatch(/0 of 5 ahead in the last published order need a keeper/);
  });

  it("names the fallbacks for each claim", async () => {
    await open();
    const [first, second] = Array.from(document.querySelectorAll("[data-claim]"));
    expect(first?.textContent).not.toContain("If taken");
    fireEvent.click(first!.querySelector('[role="button"]')!);
    expect(first?.textContent).toMatch(/If taken\s*Dedić/);
    fireEvent.click(second!.querySelector('[role="button"]')!);
    expect(second?.textContent).toMatch(/If taken\s*nobody else worth it/);
  });

  it("asks about the full squad without assuming an optimized starting lineup", async () => {
    const slot = await render({ subPath: "waivers", rpc: {
      getWaiverPlan: () => ({ ...PLAN, swaps: [{ ...PLAN.swaps[1]!, lineupGain: 0.5, lineupOut: "Pickford" }] }),
    } });
    await screen.findByText("Rushworth");
    await slot.behavior.setComposerText("My question.");
    fireEvent.click(screen.getByRole("button", { name: "Ask agent" }));
    expect(slot.inspection.navigateCalls[0]).toMatchObject({
      method: "toCompose", options: { focusPrompt: true },
    });
    expect(slot.inspection.navigateCalls[0]).not.toHaveProperty("options.initialPrompt");
    expect(slot.inspection.composer.text).toContain("My question.\n\nReview the waiver options for my full squad.");
    expect(slot.inspection.composer.mentions).toEqual([
      { provider: "waivers", id: '["4211",126586]', label: "FPL Draft · Waivers" },
    ]);
    expect(slot.inspection.composer.text).not.toContain("Rushworth");
  });

  it("labels the published position as historical, not an estimate", async () => {
    await open();
    expect(await screen.findByText("Last published · 6 of 12")).toBeTruthy();
    expect(document.querySelector('[data-waiver-status="historical"]')).toBeTruthy();
    expect(screen.getByRole("img", { name: "Historical position; next order unverified" })).toBeTruthy();
  });

  it("shows compact rule assessments without expanding them into the draft", async () => {
    const slot = await render({ subPath: "waivers", rpc: {
      getWaiverPlan: () => ({ ...PLAN, swaps: PLAN.swaps.map((swap, index) => ({ ...swap,
        assessment: index === 0
          ? { strength: "upgrade", signals: ["playing-time", "attacking-involvement"], cautions: ["harder-fixtures"] }
          : { strength: "depth", signals: ["keeper-cover"], cautions: ["clean-sheet-streak"] },
      })) }),
    } });
    expect(await screen.findByText("Priority 1 · Supported upgrade")).toBeTruthy();
    expect(screen.getByText("Priority 2 · Depth option")).toBeTruthy();
    expect(screen.queryByText("Higher xG + xA per 90")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Ask agent" }));
    expect(slot.inspection.composer.mentions).toHaveLength(1);
    expect(slot.inspection.composer.text).not.toContain("Programmatic assessment");
    expect(slot.inspection.composer.text).not.toContain("Depth option");
  });

  it("preserves the historical fallback when no next-order estimate is available", async () => {
    await render({ subPath: "waivers", rpc: {
      getLeague: () => ({ ...LEAGUE, events: LEAGUE.events.map(event => ({ ...event, finished: true })) }),
    } });
    expect(await screen.findByText("Last published · 6 of 12")).toBeTruthy();
    expect(document.querySelector('[data-waiver-status="estimated"]')).toBeNull();
  });

  it.each([false, true])("shows a next-window range and projected rival demand (live: %s)", async live => {
    await render({ subPath: "waivers", rpc: {
      getNextWaiverOrder: () => ({ event: 3, throughEvent: 2, live, min: 4, max: 5, totalManagers: 12,
        competition: [{ position: "DEF", minAhead: 2, maxAhead: 3 }] }),
    } });
    expect(await screen.findByText("Est. 4–5 of 12 Waiver Position")).toBeTruthy();
    expect(screen.queryByText("Last published · 6 of 12")).toBeNull();
    expect(screen.getByRole("img", { name: live ? "GW 3 · If current starting-XI scores hold" : "GW 3 · Based on GW 2 scores" })).toBeTruthy();
    const first = document.querySelector('[data-claim]')!;
    fireEvent.click(first.querySelector('[role="button"]')!);
    expect(first.textContent).toContain("2–3 ahead need a defender");
    expect(first.textContent).not.toContain("last published order");
  });

  it("retains claims and labels history when the projection request fails", async () => {
    await render({ subPath: "waivers", rpc: { getNextWaiverOrder: () => { throw new Error("Unavailable"); } } });
    expect(await screen.findByText("Last published · 6 of 12")).toBeTruthy();
    expect(screen.getByText("Egan")).toBeTruthy();
  });

  it.each([null, 0, 13])("avoids a made-up rank when the published pick is %s", async (waiverPick) => {
    await render({ subPath: "waivers", rpc: {
      getWaiverPlan: () => ({ ...PLAN, waiverPick }),
    } });
    expect(await screen.findByText("Order unavailable")).toBeTruthy();
    expect(document.querySelector('[data-waiver-status="unavailable"]')).toBeTruthy();
    const first = document.querySelector('[data-claim]')!;
    fireEvent.click(first.querySelector('[role="button"]')!);
    expect(first.textContent).toContain("9 managers need a defender; order unavailable");
    expect(first.querySelector('[aria-label^="Last published order"]')).toBeNull();
  });

  it("shows official FPL stats and xG/xA without card tooltips", async () => {
    await open();
    const card = document.querySelector<HTMLElement>("[data-claim]")!;
    expect(within(card).getAllByText("6.8")).toHaveLength(2);
    expect(within(card).queryByText("3.4")).toBeNull();
    fireEvent.click(card.querySelector('[role="button"]')!);
    const stats = within(card.querySelector<HTMLElement>("[data-claim-stats]")!);
    for (const label of ["Total points", "Points per match", "Form", "Minutes played", "Starts", "Goals scored", "Assists", "xG", "xA", "Clean sheets", "Defensive contributions", "Bonus"]) {
      expect(stats.getByText(label), label).toBeTruthy();
    }
    expect(stats.getAllByText("1.23").length).toBeGreaterThan(0);
    expect(stats.getAllByText("0.45").length).toBeGreaterThan(0);
    expect(card.querySelector('[role="tooltip"], [data-tip-trigger], [title]')).toBeNull();
    expect(document.querySelector('[data-ranking-details]')).toBeNull();
  });

  it("compares published form for outgoing, incoming and fallback players", async () => {
    const player = (elementId: number, form: number) => cand({ elementId, fplStats: { ...cand().fplStats, form } });
    await render({ subPath: "waivers", rpc: {
      getWaiverPlan: () => ({ ...PLAN, swaps: [{ ...PLAN.swaps[0],
        out: player(10, 1.3), in: player(20, 4.2), fallbacks: [player(30, 6.8), player(40, 3)],
      }] }),
    } });
    const card = (await screen.findByText("Suggested waivers")).closest("section")!.querySelector<HTMLElement>("[data-claim]")!;
    fireEvent.click(card.querySelector('[role="button"]')!);
    const row = within(card).getByText("Form").parentElement!;
    expect(Array.from(row.children).map(cell => cell.textContent)).toEqual(["Form", "1.3", "4.2", "6.8", "3.0"]);
    expect(row.querySelectorAll(".font-bold")).toHaveLength(1);
    expect(row.querySelector(".font-bold")!.textContent).toBe("6.8");
  });

  it.each([0, null, undefined])("keeps missing published stats unknown with form %s, while preserving published zeroes", async (form) => {
    await render({ subPath: "waivers", rpc: {
      getWaiverPlan: () => ({ ...PLAN, swaps: [{ ...PLAN.swaps[0],
        out: (({ fplStats: _stats, ...candidate }) => candidate)(cand()),
        in: cand({ elementId: 20, fplStats: { pointsPerMatch: 0, ...(form === undefined ? {} : { form }), minutes: 0, starts: 0, cleanSheets: 0, expectedGoals: null, expectedAssists: 0 } }),
        fallbacks: [],
      }] }),
    } });
    const card = (await screen.findByText("Suggested waivers")).closest("section")!.querySelector<HTMLElement>("[data-claim]")!;
    fireEvent.click(card.querySelector('[role="button"]')!);
    const grid = card.querySelector('[data-claim-stats]')!;
    const expectedGoals = Array.from(grid.children).find(e => e.textContent?.startsWith("xG"))!;
    const expectedAssists = Array.from(grid.children).find(e => e.textContent?.startsWith("xA"))!;
    expect(expectedGoals.textContent).toBe("xG——");
    expect(expectedAssists.textContent).toBe("xA—0.00");
    expect(within(grid as HTMLElement).getByText("Form").parentElement!.textContent).toBe(form === 0 ? "Form—0.0" : "Form——");
  });

  it("says so plainly when nothing is worth claiming", async () => {
    await render({
      subPath: "waivers",
      rpc: { getWaiverPlan: () => ({ ...PLAN, swaps: [] }) },
    });
    expect(await screen.findByText(/No clear upgrades found/)).toBeTruthy();
  });

  it("says so plainly when the squad has no weak spot", async () => {
    await render({
      subPath: "waivers",
      rpc: { getWaiverPlan: () => ({ ...PLAN, weakSpots: [], swaps: [] }) },
    });
    expect(await screen.findByText(/No squad problems identified/)).toBeTruthy();
  });

  it("asks for configuration instead of erroring when the viewer is unknown", async () => {
    await render({
      subPath: "waivers",
      rpc: {
        getWaiverPlan: () => ({
          available: false, reason: "Set which team is yours in FPL Draft settings to get a waiver plan.",
          waiverPick: null, totalManagers: 12, weakSpots: [], swaps: [], fetchedAt: "x",
        }),
      },
    });
    expect(await screen.findByText(/Set which team is yours/)).toBeTruthy();
  });
});

describe("waiver gameweek total", () => {
  it("uses the viewer's official match total, not a sum of today's roster", async () => {
    await render({ subPath: "waivers" });
    const score = await screen.findByLabelText("Gameweek 2 team total: 44 points, live");
    expect(score).toHaveProperty("textContent", "GW 2 · 44 pts · Live");
    expect(score.closest("[data-pitch]")).toBeTruthy();
  });

  it("shows a settled zero without treating it as unavailable", async () => {
    await render({ subPath: "waivers", rpc: {
      getWeek: () => ({ ...WEEK, matchups: [{ ...WEEK.matchups[0], finished: true,
        home: { ...WEEK.matchups[0]!.away, points: 0 }, away: WEEK.matchups[0]!.home,
      }] }),
    } });
    expect(await screen.findByLabelText("Gameweek 2 team total: 0 points")).toHaveProperty("textContent", "GW 2 · 0 pts");
  });

  it("keeps claims usable when the total is unavailable", async () => {
    await render({ subPath: "waivers", rpc: { getWeek: () => { throw new Error("Scores unavailable"); } } });
    expect(await screen.findByLabelText("Gameweek 2 team total unavailable")).toHaveProperty("textContent", "GW 2 · — pts");
    expect(screen.getByText("Egan")).toBeTruthy();
  });

  it("keeps the total visible when the squad is unavailable", async () => {
    await render({ subPath: "waivers", rpc: {
      getSquad: () => ({ available: false, reason: "Squad unavailable", players: [] }),
    } });
    expect(await screen.findByLabelText("Gameweek 2 team total: 44 points, live")).toHaveProperty("textContent", "GW 2 · 44 pts · Live");
    expect(document.querySelector("[data-pitch]")).toBeNull();
    expect(screen.getByText("Egan")).toBeTruthy();
  });
});

describe("fixture encoding", () => {
  it("prints the difficulty numeral so colour is never the only signal", async () => {
    await render({ subPath: "waivers" });
    await screen.findByText("Egan");
    const chips = screen.getAllByRole("img", { name: /Difficulty 3\/5/ });
    expect(chips.length).toBeGreaterThan(0);
    expect(chips[0]?.textContent).toMatch(/3/);
    expect(chips[0]?.getAttribute("aria-label")).toMatch(/5 hardest/);
  });
});


describe("status and playing time are independent signals", () => {
  async function openSquads() {
    await render();
    await waitFor(() => expect(playerCards("Fit").length).toBe(2));
  }
  const cardFor = (name: string) => playerCards(name)[0]!;

  it("shows a warning triangle for doubtful and an alert for out", async () => {
    await openSquads();
    expect(screen.getAllByRole("img", { name: /^Injured — Calf injury$/ }).length).toBe(2);
    expect(screen.getAllByRole("img", { name: /^Doubtful — Knock$/ }).length).toBe(2);
    const injured = screen.getAllByRole("img", { name: /^Injured — Calf injury$/ })[0]!;
    const doubtful = screen.getAllByRole("img", { name: /^Doubtful — Knock$/ })[0]!;
    expect(injured.querySelector("svg")?.getAttribute("class")).toMatch(/circle-alert/);
    expect(doubtful.querySelector("svg")?.getAttribute("class")).toMatch(/triangle-alert/);
  });

  it("fades a fringe player without giving them a status icon", async () => {
    await openSquads();
    const card = cardFor("Fringe");
    expect(card.hasAttribute("data-fringe")).toBe(true);
    expect(within(card).queryByRole("img")).toBeNull();
  });

  it("does not fade an unavailable player who normally starts", async () => {
    await openSquads();
    const card = cardFor("Injured");
    expect(card.hasAttribute("data-fringe")).toBe(false);
    expect(within(card).getByRole("img", { name: /Injured/ })).toBeTruthy();
  });

  it("applies both signals when a player is unavailable and a substitute", async () => {
    await openSquads();
    for (const [name, label] of [["InjuredFringe", /Injured/], ["DoubtfulFringe", /Doubtful/]] as const) {
      const card = cardFor(name);
      expect(card.hasAttribute("data-fringe")).toBe(true);
      expect(within(card).getByRole("img", { name: label })).toBeTruthy();
    }
  });

  it("gives a fit starter neither signal", async () => {
    await openSquads();
    const card = cardFor("Fit");
    expect(card.hasAttribute("data-fringe")).toBe(false);
    expect(within(card).queryByRole("img")).toBeNull();
  });
});

describe("table surface", () => {
  async function openTable() {
    await render({ subPath: "table" });
    // The table fetches its own week; wait for a real row before querying.
    await screen.findByText("Banana Breath");
  }

  it("uses plain column labels without tooltip triggers or extra tab stops", async () => {
    await openTable();
    for (const label of ["#", "Team", "Pts", "Played", "W", "D", "L", "Scored", "Form"]) {
      const heading = screen.getAllByText(label).find(element => element.closest("button") === null);
      expect(heading, label).toBeTruthy();
    }
    expect(document.querySelector('[data-table] button, [data-table] [role="tooltip"]')).toBeNull();
  });

  it("renders the form strip with a letter in each result", async () => {
    await openTable();
    const strip = await screen.findByLabelText("drew, won");
    expect(strip.textContent).toBe("DW");
  });

  it("shows league-wide columns without abbreviating them away", async () => {
    await openTable();
    for (const label of ["Played", "Scored", "Form"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });
});


describe("load recovery", () => {
  it("retries a failed initial league request without treating it as a settings error", async () => {
    let calls = 0;
    await render({ subPath: "waivers", rpc: {
      getLeague: () => { if (++calls === 1) throw new Error("Connection lost"); return LEAGUE; },
    } });
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", expect.stringContaining("Connection lost"));
    expect(screen.queryByText(/Add your league id/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("Egan")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("keeps the last plan and squad together when the squad refresh fails, then retries", async () => {
    let squadCalls = 0;
    let planCalls = 0;
    const replacement = { ...PLAN, swaps: [{ ...PLAN.swaps[0]!, in: { ...PLAN.swaps[0]!.in, name: "Replacement" } }] };
    await render({ subPath: "waivers", rpc: {
      getWaiverPlan: () => ++planCalls === 1 ? PLAN : replacement,
      getSquad: () => { if (++squadCalls === 2) throw new Error("Connection lost"); return SQUAD; },
    } });
    await screen.findByText("Egan");
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await screen.findByRole("alert");
    expect(screen.getByText("Egan")).toBeTruthy();
    expect(screen.queryByText("Replacement")).toBeNull();
    expect(document.querySelectorAll("[data-player-card]").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("Replacement")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("keeps navigation available when the table fails and retries the table", async () => {
    let calls = 0;
    await render({ subPath: "table", rpc: {
      getWeek: () => { if (++calls === 1) throw new Error("Table unavailable"); return WEEK; },
    } });
    await screen.findByRole("alert");
    expect(screen.getByRole("tab", { name: "Waivers" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("Mighty Frog FC")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});


describe("live refresh", () => {
  it("refreshes mounted pitches together with same-week match totals", async () => {
    let points = 3;
    await render({ rpc: {
      getSquad: () => ({ ...SQUAD, players: [sq({ name: "Live player", eventPoints: points })] }),
    } });
    await waitFor(() => expect(playerCards("Live player")).toHaveLength(2));
    expect(playerCards("Live player")[0]?.textContent).toContain("3");
    points = 17;
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await waitFor(() => expect(playerCards("Live player")[0]?.textContent).toContain("17"));
  });

  it("polls live Table and stops after results settle or the view is left", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    let calls = 0;
    await render({ subPath: "table", rpc: {
      getWeek: () => ({ ...WEEK, live: ++calls === 1, table: [{ ...WEEK.table[0], pointsFor: calls === 1 ? 81 : 92 }] }),
    } });
    await screen.findByText("81");
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(screen.getByText("92")).toBeTruthy();
    expect(calls).toBe(2);
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(calls).toBe(2);
    fireEvent.click(screen.getByRole("tab", { name: "Waivers" }));
    await screen.findByText("Suggested waivers");
    const afterLeaving = calls;
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(calls).toBe(afterLeaving);
  });

  it("ignores an earlier gameweek response after navigation", async () => {
    let resolveEarlier!: (week: typeof WEEK) => void;
    const earlier = new Promise<typeof WEEK>(resolve => { resolveEarlier = resolve; });
    await render({ rpc: {
      getWeek: ({ event }: { event: number }) => event === 1 ? earlier : { ...WEEK, event },
    } });
    await screen.findByRole("button", { name: "Ask agent" });
    fireEvent.click(screen.getByRole("button", { name: "Previous gameweek" }));
    await screen.findByText("Gameweek 1");
    fireEvent.click(screen.getByRole("button", { name: "Next gameweek" }));
    await screen.findByRole("button", { name: "Ask agent" });
    await act(async () => { resolveEarlier({ ...WEEK, event: 1, matchups: [] }); });
    expect(screen.getByText("Gameweek 2")).toBeTruthy();
    expect(screen.queryByText("No matches this gameweek.")).toBeNull();
    expect(screen.getByRole("button", { name: "Ask agent" })).toBeTruthy();
  });
});

describe("refresh on page entry", () => {
  it("refreshes Table and asks about its gameweek while preserving the draft", async () => {
    let score = 81;
    let calls = 0;
    const slot = await render({ subPath: "table", rpc: {
      getWeek: () => { calls++; return { ...WEEK, table: [{ ...WEEK.table[0], pointsFor: score }] }; },
    } });
    await screen.findByText("81");
    score = 92;
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await screen.findByText("92");
    expect(calls).toBe(2);
    expect(screen.queryByText("81")).toBeNull();
    await slot.behavior.setComposerText("My question.");
    fireEvent.click(screen.getByRole("button", { name: "Ask agent" }));
    expect(slot.inspection.composer.mentions).toEqual([
      { provider: "week", id: '["4211",2]', label: "FPL Draft · GW 2" },
    ]);
    expect(slot.inspection.composer.text).toContain("My question.\n\nReview my league position");
    expect(slot.inspection.navigateCalls).toEqual([{ method: "toCompose", options: { focusPrompt: true } }]);
  });

  it("refreshes on open and each page switch, including returning to Table", async () => {
    let refreshes = 0;
    let score = 81;
    const slot = await render({ subPath: "table", rpc: {
      getLeague: (input: { refresh?: boolean }) => { if (input.refresh) refreshes++; return LEAGUE; },
      getWeek: () => ({ ...WEEK, table: [{ ...WEEK.table[0], pointsFor: score }] }),
    } });
    await screen.findByText("81");
    expect(refreshes).toBe(1);
    score = 92;
    fireEvent.click(screen.getByRole("tab", { name: "Waivers" }));
    await screen.findByText("Suggested waivers");
    expect(refreshes).toBe(2);
    fireEvent.click(screen.getByRole("tab", { name: "Table" }));
    await screen.findByText("92");
    expect(refreshes).toBe(3);
    expect(screen.queryByText("81")).toBeNull();
    slot.lifecycle.unmount();
    await render({ subPath: "table", rpc: {
      getLeague: (input: { refresh?: boolean }) => { if (input.refresh) refreshes++; return LEAGUE; },
    } });
    await screen.findByText("81");
    expect(refreshes).toBe(4);
  });
});


describe("header actions and content disclosure", () => {
  it.each(["matches", "table", "waivers"])("places icon actions beside the tabs with keyboard tooltips in %s", async subPath => {
    await render({ subPath });
    if (subPath === "matches") await waitFor(() => expect(document.querySelector('[data-player-card]')).toBeTruthy());
    if (subPath === "table") await screen.findByText("Scored");
    if (subPath === "waivers") {
      await screen.findByText("Suggested waivers");
      fireEvent.click(document.querySelector('[data-claim] [role="button"]')!);
    }
    const content = document.querySelector('[data-view-frame]')!;
    expect(content.querySelector('[title], [role="tooltip"], [data-tip-trigger]')).toBeNull();
    const actions = document.querySelector('[data-view-actions]')!;
    expect(actions.parentElement?.querySelector('[role="tablist"]')).toBeTruthy();
    expect(actions.querySelectorAll('button')).toHaveLength(2);
    for (const name of ["Ask agent", "Refresh"]) {
      const button = within(actions as HTMLElement).getByRole("button", { name });
      expect(button.textContent).toBe("");
      expect(button.querySelector('svg')).toBeTruthy();
      fireEvent.focus(button);
      expect((await screen.findByRole("tooltip")).textContent).toBe(name);
      fireEvent.keyDown(document, { key: "Escape" });
      await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull());
      fireEvent.blur(button);
    }
  });

  it("reveals the squads by clicking the score without a disclosure caret", async () => {
    await render();
    await waitFor(() => expect(document.querySelector('[data-player-card]')).toBeTruthy());
    const toggle = document.querySelector<HTMLElement>('[data-match-toggle]')!;
    expect(toggle.querySelector("svg")).toBeNull();
    fireEvent.click(within(toggle).getByText("31"));
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(within(toggle).getByText("31"));
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    await waitFor(() => expect(document.querySelectorAll('[data-pitch]').length).toBe(2));
  });
});
