import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import { describe, expect, it } from "vitest";

import {
  createFplDraftPlugin,
  type LeaguePayload,
  type PlayersPayload,
  type SquadPayload,
  type WaiverPlanPayload,
  type WeekPayload,
} from "./server";

import { BOOTSTRAP, DETAILS, fakeFetch, type FetchLog } from "./fixtures/api";

type Harness = ReturnType<typeof createFakePluginHost>["harness"];

const call = {
  getLeague: (harness: Harness) =>
    harness.behavior.callRpc("getLeague", null) as Promise<LeaguePayload>,
  getWeek: (harness: Harness, input: { event: number }) =>
    harness.behavior.callRpc("getWeek", input) as Promise<WeekPayload>,
  getSquad: (harness: Harness, input: { event: number; leagueEntryId: number; current?: boolean }) =>
    harness.behavior.callRpc("getSquad", input) as Promise<SquadPayload>,
  getPlayers: (harness: Harness) =>
    harness.behavior.callRpc("getPlayers", null) as Promise<PlayersPayload>,
  getWaiverPlan: (harness: Harness) =>
    harness.behavior.callRpc("getWaiverPlan", null) as Promise<WaiverPlanPayload>,
};

async function bootPlugin(overrides: Record<string, unknown> = {}) {
  const log: FetchLog = { urls: [] };
  const { bb, harness } = createFakePluginHost({ pluginId: "fpl-draft" });
  createFplDraftPlugin(fakeFetch(log, overrides))(bb);
  await harness.behavior.setSettings({ leagueId: "900001", managerName: "Alpha" });
  return { harness, log };
}

describe("FPL Draft plugin", () => {
  it("returns a next-window estimate and demand without changing the published pick", async () => {
    const { harness } = await bootPlugin({
      "/bootstrap-static": { ...BOOTSTRAP,
        events: { ...BOOTSTRAP.events, data: BOOTSTRAP.events.data.map(event => event.id === 3 ? { ...event, waivers_time: "2099-09-11T12:00:00Z" } : event) },
        settings: { ...BOOTSTRAP.settings, squad: { ...BOOTSTRAP.settings.squad, play: 1, size: 1 } },
      },
      "/entry/900/event/2": { picks: [{ element: 1, position: 1 }] },
      "/entry/800/event/2": { picks: [{ element: 3, position: 1 }] },
      "/event/2/live": { elements: { "1": { stats: { total_points: 6, minutes: 90 } }, "3": { stats: { total_points: 0, minutes: 0 } } } },
    });
    const next = await harness.behavior.callRpc("getNextWaiverOrder", null);
    expect(next).toMatchObject({ event: 3, throughEvent: 2, live: true, min: 2, max: 2, totalManagers: 2,
      competition: expect.arrayContaining([{ position: "MID", minAhead: 1, maxAhead: 1 }]),
    });
    expect((await call.getLeague(harness)).managers[0]!.waiverPick).toBe(1);
    await harness.lifecycle.dispose();
  });

  it("resolves waiver context for the referenced team after settings change", async () => {
    const { harness, log } = await bootPlugin();
    const provider = harness.inspection.registrations.mentionProviders.find(item => item.id === "waivers")!;
    const items = await provider.search({ trigger: "@", query: "waivers", projectId: null, threadId: null });
    expect(items).toEqual([{ id: '["900001",100]', title: "FPL Draft · Waivers" }]);
    const plan = await call.getWaiverPlan(harness);
    await harness.behavior.setSettings({ leagueId: "9999", managerName: "Beta" });
    const { context } = await provider.resolve(items[0]!.id);
    const resolved = JSON.parse(context);
    expect(resolved).toMatchObject({ source: "FPL Draft", league: { id: 900001, name: "Test League" },
      team: { leagueEntryId: 100, teamName: "Alpha" },
      plan: { available: true, weakSpots: plan.weakSpots, swaps: plan.swaps },
    });
    expect(resolved.scope).toContain("full squad");
    expect(resolved.notes).toContain("not the next confirmed order");
    expect(log.urls).not.toContain("https://draft.premierleague.com/api/league/9999/details");
    await harness.lifecycle.dispose();
  });

  it.each(['not-json', '["900001",0]', '["900001",999]', '["not-a-league",100]'])(
    "rejects an invalid or unavailable waiver reference: %s", async id => {
      const { harness } = await bootPlugin();
      const provider = harness.inspection.registrations.mentionProviders.find(item => item.id === "waivers")!;
      await expect(provider.resolve(id)).rejects.toThrow(/FPL Draft/);
      await harness.lifecycle.dispose();
    },
  );

  it("blocks sending a waiver mention when its squad is unavailable", async () => {
    const { harness } = await bootPlugin({ "/entry/900/event/2": null });
    const provider = harness.inspection.registrations.mentionProviders.find(item => item.id === "waivers")!;
    await expect(provider.resolve('["900001",100]')).rejects.toThrow();
    await harness.lifecycle.dispose();
  });

  it("resolves the mentioned week in its original league after settings change", async () => {
    const { harness, log } = await bootPlugin();
    const provider = harness.inspection.registrations.mentionProviders[0]!;
    const items = await provider.search({ trigger: "@", query: "gameweek 1", projectId: null, threadId: null });
    expect(items).toMatchObject([{ id: '["900001",1]', title: "FPL Draft · GW 1" }]);
    await harness.behavior.setSettings({ leagueId: "9999", managerName: "" });
    const { context } = await provider.resolve(items[0]!.id);
    const resolved = JSON.parse(context);
    expect(resolved).toMatchObject({ source: "FPL Draft", league: { id: 900001, name: "Test League" }, gameweek: 1 });
    expect(resolved.matchups).toMatchObject([{ event: 1, home: { points: 60 }, away: { points: 20 } }]);
    expect(resolved.table).toHaveLength(2);
    expect(resolved.tableScope).toContain("including later gameweeks");
    expect(log.urls).not.toContain("https://draft.premierleague.com/api/league/9999/details");
    await harness.lifecycle.dispose();
  });

  it.each(['not-json', '["900001",0]', '["900001",99]', '["not-a-league",1]'])(
    "rejects an invalid or unavailable week mention: %s", async (id) => {
      const { harness } = await bootPlugin();
      await expect(harness.inspection.registrations.mentionProviders[0]!.resolve(id)).rejects.toThrow(/FPL Draft/);
      await harness.lifecycle.dispose();
    },
  );

  it("loads through the bb plugin harness", async () => {
    const { bb, harness } = createFakePluginHost({ pluginId: "fpl-draft" });
    createFplDraftPlugin(fakeFetch({ urls: [] }))(bb);
    expect(harness.inspection.logEntries.at(-1)?.message).toBe("FPL Draft loaded");
    await harness.lifecycle.dispose();
  });

  it("asks for configuration until a league id is set", async () => {
    const { bb, harness } = createFakePluginHost({ pluginId: "fpl-draft" });
    createFplDraftPlugin(fakeFetch({ urls: [] }))(bb);
    await expect(call.getLeague(harness)).rejects.toThrow(/league id/i);
    await harness.lifecycle.dispose();
  });

  it("accepts a league URL as well as a bare id", async () => {
    const log: FetchLog = { urls: [] };
    const { bb, harness } = createFakePluginHost({ pluginId: "fpl-draft" });
    createFplDraftPlugin(fakeFetch(log))(bb);
    await harness.behavior.setSettings({
      leagueId: "https://draft.premierleague.com/league/900001/standings",
      managerName: "",
    });
    await call.getLeague(harness);
    expect(log.urls.some((url) => url.includes("/league/900001/details"))).toBe(true);
    await harness.lifecycle.dispose();
  });

  it("returns league metadata and resolves the viewer by team name", async () => {
    const { harness } = await bootPlugin();
    const league = await call.getLeague(harness);
    expect(league.leagueName).toBe("Test League");
    expect(league.managers).toHaveLength(2);
    expect(league.viewerLeagueEntryId).toBe(100);
    expect(league.viewerWarning).toBeNull();
    expect(league.events.map((event) => event.started)).toEqual([true, true, false]);
    await harness.lifecycle.dispose();
  });

  it("warns instead of failing when the viewer name matches nothing", async () => {
    const { bb, harness } = createFakePluginHost({ pluginId: "fpl-draft" });
    createFplDraftPlugin(fakeFetch({ urls: [] }))(bb);
    await harness.behavior.setSettings({ leagueId: "900001", managerName: "Nobody" });
    const league = await call.getLeague(harness);
    expect(league.viewerLeagueEntryId).toBeNull();
    expect(league.viewerWarning).toMatch(/Nobody/);
    await harness.lifecycle.dispose();
  });

  it("projects the table from in-flight scores and reports the rank movement", async () => {
    const { harness } = await bootPlugin();
    const week = await call.getWeek(harness, { event: 2 });
    expect(week.live).toBe(true);
    expect(week.matchups).toHaveLength(1);
    expect(week.matchups[0]?.home.points).toBe(70);
    expect(week.matchups[0]?.home.result).toBe("W");
    // Beta wins GW2 live, drawing level on 3 points and leading on points for.
    const beta = week.table.find((row) => row.leagueEntryId === 200);
    expect(beta?.form).toEqual(["L", "W"]);
    expect(beta?.averageFor).toBe(45);
    expect(beta?.rank).toBe(1);
    expect(beta?.rankDelta).toBe(1);
    expect(beta?.played).toBe(2);
    await harness.lifecycle.dispose();
  });

  it("reports a future week as not live and without results", async () => {
    const { harness } = await bootPlugin();
    const week = await call.getWeek(harness, { event: 3 });
    expect(week.live).toBe(false);
    expect(week.matchups[0]?.home.result).toBeNull();
    await harness.lifecycle.dispose();
  });

  it("replays moves made since the lineup when the current roster is asked for", async () => {
    const { harness } = await bootPlugin();
    const played = await call.getSquad(harness, { event: 2, leagueEntryId: 100 });
    // The published GW2 lineup is unchanged.
    expect(played.players.map((p) => p.elementId)).toEqual([1, 2]);
    const now = await call.getSquad(harness, { event: 2, leagueEntryId: 100, current: true });
    // Element 1 was swapped for element 2 after GW2; the denied claim is ignored.
    expect(now.players.map((p) => p.elementId)).toEqual([2, 2]);
    await harness.lifecycle.dispose();
  });

  it("returns a squad with live points for a started week", async () => {
    const { harness } = await bootPlugin();
    const squad = await call.getSquad(harness, { event: 2, leagueEntryId: 100 });
    expect(squad.available).toBe(true);
    expect(squad.players).toHaveLength(2);
    expect(squad.players[0]?.starting).toBe(true);
    expect(squad.players[0]?.eventPoints).toBe(6);
    expect(squad.players[1]?.slot).toBe(12);
    // Playing time travels with the squad so the card can fade independently.
    expect(squad.players[0]?.minutesPerGame).toBe(45);
    await harness.lifecycle.dispose();
  });

  it("explains rather than errors when a week has no published squads", async () => {
    const { harness } = await bootPlugin({ "/entry/": null });
    const squad = await call.getSquad(harness, { event: 3, leagueEntryId: 100 });
    expect(squad.available).toBe(false);
    expect(squad.reason).toMatch(/not published/i);
    expect(squad.players).toEqual([]);
    await harness.lifecycle.dispose();
  });

  it("rejects a team that is not in this league", async () => {
    const { harness } = await bootPlugin();
    const squad = await call.getSquad(harness, { event: 2, leagueEntryId: 999 });
    expect(squad.available).toBe(false);
    expect(squad.reason).toMatch(/unknown team/i);
    await harness.lifecycle.dispose();
  });

  it("builds player rows with ownership and fixture difficulty", async () => {
    const { harness } = await bootPlugin();
    const players = await call.getPlayers(harness);
    // The player with status "u" is excluded.
    expect(players.players).toHaveLength(2);
    const semenyo = players.players.find((player) => player.name === "Midfielder Indigo");
    expect(semenyo?.ownedBy).toBe("Alpha");
    expect(semenyo?.goals).toBe(3);
    expect(semenyo?.defensiveContribution).toBe(4);
    expect(semenyo?.form).toBe(7.3);
    const raya = players.players.find((player) => player.name === "Keeper Amber");
    expect(raya?.ownedBy).toBeNull();
    expect(raya?.fixtureDifficulty).toBe(2);
    await harness.lifecycle.dispose();
  });

  it("busts the edge cache on the ownership request", async () => {
    const { harness, log } = await bootPlugin();
    await call.getPlayers(harness);
    const ownership = log.urls.find((url) => url.includes("/element-status"));
    // Fastly caches this path for 48h despite the origin's no-store header.
    expect(ownership).toMatch(/element-status\?_=\d+/);
    await harness.lifecycle.dispose();
  });

  it("fetches fixture difficulty once per team, not once per player", async () => {
    const { harness, log } = await bootPlugin();
    await call.getPlayers(harness);
    const summaries = log.urls.filter((url) => url.includes("/element-summary/"));
    expect(summaries).toHaveLength(BOOTSTRAP.teams.length);
    await harness.lifecycle.dispose();
  });

  it("serves repeat reads from cache and refetches after settings change", async () => {
    const { harness, log } = await bootPlugin();
    await call.getLeague(harness);
    await call.getLeague(harness);
    const first = log.urls.filter((url) => url.includes("/details")).length;
    expect(first).toBe(1);
    await harness.behavior.setSettings({ leagueId: "900001", managerName: "Beta" });
    await call.getLeague(harness);
    expect(log.urls.filter((url) => url.includes("/details")).length).toBe(2);
    await harness.lifecycle.dispose();
  });

  it("refreshes cached upstream data on entry while preserving ordinary cached reads", async () => {
    const { harness, log } = await bootPlugin();
    await call.getLeague(harness);
    await call.getWeek(harness, { event: 2 });
    expect(log.urls.filter(url => url.endsWith("/bootstrap-static"))).toHaveLength(1);
    await harness.behavior.callRpc("getLeague", { refresh: true });
    await call.getWeek(harness, { event: 2 });
    expect(log.urls.filter(url => url.endsWith("/bootstrap-static"))).toHaveLength(2);
    expect(log.urls.filter(url => url.endsWith("/details"))).toHaveLength(2);
    await harness.lifecycle.dispose();
  });

  it.each([
    ["7.3", 7.3], ["0.0", 0], ["", null], [undefined, null], ["unknown", null],
  ])("returns published display stats with form %s separately from the smoothed ranking values", async (form, expectedForm) => {
    const { harness } = await bootPlugin({
      "/bootstrap-static": { ...BOOTSTRAP, elements: [
        { ...BOOTSTRAP.elements[0], status: "i" },
        { ...BOOTSTRAP.elements[1], element_type: 1, form },
      ] },
      "/entry/900/event/2": { picks: [{ element: 1, position: 1 }] },
      "/draft/league/900001/transactions": { transactions: [] },
      "/league/900001/element-status": { element_status: [
        { element: 1, owner: 900, status: "o", in_accepted_trade: false },
        { element: 2, owner: null, status: "a", in_accepted_trade: false },
      ] },
    });
    const plan = await call.getWaiverPlan(harness);
    expect(plan.swaps).toHaveLength(1);
    expect(plan.swaps[0]!.in.fplStats).toEqual({ pointsPerMatch: 12, form: expectedForm, minutes: 180, starts: 2, cleanSheets: 0, expectedGoals: 1.2, expectedAssists: 0.4 });
    expect(plan.swaps[0]!.out.fplStats?.form).toBe(3);
    expect(plan.swaps[0]!.assessment).toMatchObject({ strength: "upgrade", signals: expect.arrayContaining(["availability"]) });
    expect(plan.swaps[0]!.in.pointsPerGame).not.toBe(12);
    await harness.lifecycle.dispose();
  });

  it("builds a waiver plan of positional swaps with honest competition", async () => {
    const { harness } = await bootPlugin();
    const plan = await call.getWaiverPlan(harness);
    expect(plan.available).toBe(true);
    expect(plan.waiverPick).toBe(1);
    expect(plan.totalManagers).toBe(2);
    for (const swap of plan.swaps) {
      // A swap is always like-for-like; Draft permits nothing else.
      expect(swap.in.elementId).not.toBe(swap.out.elementId);
      expect(swap.competition.totalManagers).toBeGreaterThan(0);
      // Stats arrive in plain per-game terms, rounded to one decimal.
      expect(Number.isFinite(swap.in.pointsPerGame)).toBe(true);
      expect(Math.round(swap.in.pointsPerGame * 10) / 10).toBe(swap.in.pointsPerGame);
    }
    // Every claim drops a different player so none is skipped.
    const outgoing = plan.swaps.map((swap) => swap.out.elementId);
    expect(new Set(outgoing).size).toBe(outgoing.length);
    // Whoever a claim would drop is also a named weak spot.
    const weak = new Set(plan.weakSpots.map((spot) => spot.player.elementId));
    for (const id of outgoing) expect(weak.has(id)).toBe(true);
    for (const swap of plan.swaps) {
      for (const pick of swap.competition.needingPicks) {
        expect(pick).toBeGreaterThanOrEqual(1);
        expect(pick).toBeLessThanOrEqual(plan.totalManagers);
      }
    }
    await harness.lifecycle.dispose();
  });

  it("asks for the viewer rather than guessing when no team is set", async () => {
    const { bb, harness } = createFakePluginHost({ pluginId: "fpl-draft" });
    createFplDraftPlugin(fakeFetch({ urls: [] }))(bb);
    await harness.behavior.setSettings({ leagueId: "900001", managerName: "" });
    const plan = await call.getWaiverPlan(harness);
    expect(plan.available).toBe(false);
    expect(plan.reason).toMatch(/which team is yours/i);
    expect(plan.swaps).toEqual([]);
    await harness.lifecycle.dispose();
  });

  it("surfaces an upstream failure as an error rather than empty data", async () => {
    const log: FetchLog = { urls: [] };
    const { bb, harness } = createFakePluginHost({ pluginId: "fpl-draft" });
    createFplDraftPlugin(async () => ({
      ok: false, status: 503, json: async () => ({}),
    }))(bb);
    await harness.behavior.setSettings({ leagueId: "900001", managerName: "" });
    await expect(call.getLeague(harness)).rejects.toThrow(/503/);
    expect(log.urls).toEqual([]);
    await harness.lifecycle.dispose();
  });
});
