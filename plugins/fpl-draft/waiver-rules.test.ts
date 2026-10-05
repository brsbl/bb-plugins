import { describe, expect, it } from "vitest";
import { buildWaiverPlan, type Position, type SwapCandidate } from "./core";
import { assessWaiver } from "./waiver-rules";

// Published FPL values through GW3, recorded 2026-09-11. Names belong only to
// the regression data; production rules never special-case an identity.
const examples: { position: Position; out: SwapCandidate; in: SwapCandidate; fallbacks: SwapCandidate[] }[] = [
  {"position":"GKP","out":{"elementId":2,"name":"Arrizabalaga","team":"ARS","pointsPerGame":0,"minutesPerGame":0,"seasonPoints":0,"goals":0,"assists":0,"defending":0,"bonus":0,"fplStats":{"pointsPerMatch":0,"minutes":0,"starts":0,"cleanSheets":0,"expectedGoals":0,"expectedAssists":0},"availability":"a","news":"","opponents":[{"opponent":"SUN","averagePoints":null,"sample":0,"difficulty":3,"isHome":false,"event":4},{"opponent":"BHA","averagePoints":null,"sample":0,"difficulty":3,"isHome":false,"event":5},{"opponent":"LEE","averagePoints":null,"sample":0,"difficulty":2,"isHome":true,"event":6}]},"in":{"elementId":571,"name":"Tzolakis","team":"HUL","pointsPerGame":4.3,"minutesPerGame":90,"seasonPoints":26,"goals":0,"assists":0,"defending":0,"bonus":6,"fplStats":{"pointsPerMatch":8.7,"minutes":270,"starts":3,"cleanSheets":3,"expectedGoals":0,"expectedAssists":0},"availability":"a","news":"","opponents":[{"opponent":"CHE","averagePoints":null,"sample":0,"difficulty":4,"isHome":false,"event":4},{"opponent":"NEW","averagePoints":null,"sample":0,"difficulty":3,"isHome":false,"event":5},{"opponent":"EVE","averagePoints":null,"sample":0,"difficulty":3,"isHome":true,"event":6}]},"fallbacks":[]},
  {"position":"DEF","out":{"elementId":498,"name":"Senesi","team":"TOT","pointsPerGame":0.5,"minutesPerGame":30,"seasonPoints":3,"goals":0,"assists":0,"defending":16,"bonus":0,"fplStats":{"pointsPerMatch":3,"minutes":90,"starts":1,"cleanSheets":0,"expectedGoals":0,"expectedAssists":0.02},"availability":"a","news":"","opponents":[{"opponent":"EVE","averagePoints":null,"sample":0,"difficulty":3,"isHome":true,"event":4},{"opponent":"AVL","averagePoints":null,"sample":0,"difficulty":3,"isHome":true,"event":5},{"opponent":"MUN","averagePoints":null,"sample":0,"difficulty":4,"isHome":false,"event":6}]},"in":{"elementId":330,"name":"Bogle","team":"LEE","pointsPerGame":3.7,"minutesPerGame":72,"seasonPoints":22,"goals":1,"assists":0,"defending":12,"bonus":3,"fplStats":{"pointsPerMatch":7.3,"minutes":217,"starts":3,"cleanSheets":2,"expectedGoals":0.9,"expectedAssists":0.03},"availability":"a","news":"","opponents":[{"opponent":"NEW","averagePoints":null,"sample":0,"difficulty":2,"isHome":true,"event":4},{"opponent":"CRY","averagePoints":null,"sample":0,"difficulty":3,"isHome":true,"event":5},{"opponent":"ARS","averagePoints":null,"sample":0,"difficulty":5,"isHome":false,"event":6}]},"fallbacks":[{"elementId":504,"name":"Vuskovic","team":"BHA","pointsPerGame":3,"minutesPerGame":90,"seasonPoints":18,"goals":1,"assists":0,"defending":22,"bonus":2,"fplStats":{"pointsPerMatch":6,"minutes":270,"starts":3,"cleanSheets":1,"expectedGoals":0.35,"expectedAssists":0.06},"availability":"a","news":"","opponents":[{"opponent":"COV","averagePoints":null,"sample":0,"difficulty":2,"isHome":false,"event":4},{"opponent":"ARS","averagePoints":null,"sample":0,"difficulty":4,"isHome":true,"event":5},{"opponent":"SUN","averagePoints":null,"sample":0,"difficulty":3,"isHome":false,"event":6}]},{"elementId":204,"name":"Mitchell","team":"CRY","pointsPerGame":2.7,"minutesPerGame":84,"seasonPoints":16,"goals":2,"assists":0,"defending":16,"bonus":2,"fplStats":{"pointsPerMatch":5.3,"minutes":253,"starts":3,"cleanSheets":0,"expectedGoals":0.77,"expectedAssists":0.18},"availability":"a","news":"","opponents":[{"opponent":"IPS","averagePoints":null,"sample":0,"difficulty":2,"isHome":true,"event":4},{"opponent":"LEE","averagePoints":null,"sample":0,"difficulty":3,"isHome":false,"event":5},{"opponent":"NFO","averagePoints":null,"sample":0,"difficulty":3,"isHome":true,"event":6}]}]},
  {"position":"MID","out":{"elementId":43,"name":"Tielemans","team":"MUN","pointsPerGame":1.3,"minutesPerGame":82,"seasonPoints":8,"goals":0,"assists":0,"defending":25,"bonus":0,"fplStats":{"pointsPerMatch":2.7,"minutes":246,"starts":3,"cleanSheets":0,"expectedGoals":0.56,"expectedAssists":0.28},"availability":"a","news":"","opponents":[{"opponent":"MCI","averagePoints":null,"sample":0,"difficulty":4,"isHome":true,"event":4},{"opponent":"FUL","averagePoints":null,"sample":0,"difficulty":3,"isHome":false,"event":5},{"opponent":"TOT","averagePoints":null,"sample":0,"difficulty":3,"isHome":true,"event":6}]},"in":{"elementId":98,"name":"Janelt","team":"BRE","pointsPerGame":3.5,"minutesPerGame":90,"seasonPoints":21,"goals":2,"assists":0,"defending":35,"bonus":3,"fplStats":{"pointsPerMatch":7,"minutes":270,"starts":3,"cleanSheets":1,"expectedGoals":0.5,"expectedAssists":0.32},"availability":"a","news":"","opponents":[{"opponent":"BOU","averagePoints":null,"sample":0,"difficulty":3,"isHome":false,"event":4},{"opponent":"CHE","averagePoints":null,"sample":0,"difficulty":4,"isHome":true,"event":5},{"opponent":"AVL","averagePoints":null,"sample":0,"difficulty":4,"isHome":false,"event":6}]},"fallbacks":[{"elementId":242,"name":"George","team":"EVE","pointsPerGame":2.5,"minutesPerGame":78,"seasonPoints":15,"goals":1,"assists":0,"defending":13,"bonus":3,"fplStats":{"pointsPerMatch":5,"minutes":234,"starts":3,"cleanSheets":1,"expectedGoals":0.27,"expectedAssists":0.16},"availability":"a","news":"","opponents":[{"opponent":"TOT","averagePoints":null,"sample":0,"difficulty":3,"isHome":false,"event":4},{"opponent":"IPS","averagePoints":null,"sample":0,"difficulty":2,"isHome":true,"event":5},{"opponent":"HUL","averagePoints":null,"sample":0,"difficulty":2,"isHome":false,"event":6}]},{"elementId":286,"name":"Belloumi","team":"HUL","pointsPerGame":2.3,"minutesPerGame":84,"seasonPoints":14,"goals":0,"assists":1,"defending":32,"bonus":0,"fplStats":{"pointsPerMatch":4.7,"minutes":253,"starts":3,"cleanSheets":3,"expectedGoals":0.2,"expectedAssists":0.06},"availability":"a","news":"","opponents":[{"opponent":"CHE","averagePoints":null,"sample":0,"difficulty":4,"isHome":false,"event":4},{"opponent":"NEW","averagePoints":null,"sample":0,"difficulty":3,"isHome":false,"event":5},{"opponent":"EVE","averagePoints":null,"sample":0,"difficulty":3,"isHome":true,"event":6}]}]},
  {"position":"FWD","out":{"elementId":108,"name":"Wilson","team":"BRE","pointsPerGame":0.5,"minutesPerGame":4,"seasonPoints":3,"goals":0,"assists":0,"defending":2,"bonus":0,"fplStats":{"pointsPerMatch":1,"minutes":13,"starts":0,"cleanSheets":0,"expectedGoals":0.07,"expectedAssists":0.04},"availability":"a","news":"","opponents":[{"opponent":"BOU","averagePoints":null,"sample":0,"difficulty":3,"isHome":false,"event":4},{"opponent":"CHE","averagePoints":null,"sample":0,"difficulty":4,"isHome":true,"event":5},{"opponent":"AVL","averagePoints":null,"sample":0,"difficulty":4,"isHome":false,"event":6}]},"in":{"elementId":194,"name":"Thomas-Asante","team":"COV","pointsPerGame":0.7,"minutesPerGame":40,"seasonPoints":4,"goals":0,"assists":0,"defending":11,"bonus":0,"fplStats":{"pointsPerMatch":1.3,"minutes":120,"starts":1,"cleanSheets":0,"expectedGoals":0,"expectedAssists":0.02},"availability":"a","news":"","opponents":[{"opponent":"BHA","averagePoints":null,"sample":0,"difficulty":2,"isHome":true,"event":4},{"opponent":"NFO","averagePoints":null,"sample":0,"difficulty":3,"isHome":false,"event":5},{"opponent":"NEW","averagePoints":null,"sample":0,"difficulty":2,"isHome":true,"event":6}]},"fallbacks":[]}
];
const stats = { pointsPerMatch: 6, form: 6, minutes: 270, starts: 3, cleanSheets: 0, expectedGoals: 0.9, expectedAssists: 0.3 };
const player = (id: number, overrides: Partial<SwapCandidate> = {}, published: Partial<typeof stats> = {}): SwapCandidate => ({
  elementId: id, name: `Player ${id}`, team: "ARS", pointsPerGame: 3, minutesPerGame: 90,
  seasonPoints: 18, goals: 0, assists: 0, defending: 20, bonus: 0, availability: "a", news: "",
  opponents: [1, 2, 3].map(event => ({ opponent: "EVE", event, difficulty: 3, averagePoints: null, sample: 0, isHome: true })),
  fplStats: { ...stats, ...published }, ...overrides,
});
const assess = (out: SwapCandidate, incoming: SwapCandidate, position: Position = "MID") => assessWaiver({ out, incoming, position });

describe("waiver evidence rules", () => {
  it("distinguishes the four actual suggestions without player-specific rules", () => {
    const assessments = examples.map(example => assessWaiver({ ...example, incoming: example.in, coveredKeeper: true }));
    expect(assessments.map(a => a.strength)).toEqual(["depth", "upgrade", "weak", "depth"]);
    expect(assessments[0]!.cautions).toContain("clean-sheet-streak");
    expect(assessments[1]!.signals).toEqual(["playing-time", "attacking-involvement"]);
    expect(assessments[2]!.cautions).toEqual(expect.arrayContaining(["goals-ahead-of-xg", "no-supported-upgrade"]));
    expect(assessments[3]!.signals).toEqual(["depth-minutes"]);
    const renamed = examples.map(example => assessWaiver({ position: example.position,
      out: { ...example.out, elementId: 1, name: "A" }, incoming: { ...example.in, elementId: 2, name: "B" }, coveredKeeper: true }));
    expect(renamed).toEqual(assessments);
  });

  it("puts the supported defender first, keeps reserve upgrades and removes the points-led midfielder", () => {
    const squad = [...examples.map(e => e.out), player(999)];
    const pool = examples.flatMap(e => [e.in, ...e.fallbacks]);
    const swaps = buildWaiverPlan({ squad, pool, competition: new Map(),
      squadPositions: new Map([...examples.map(e => [e.out.elementId, e.position] as const), [999, "GKP"]]),
      poolPositions: new Map(examples.flatMap(e => [e.in, ...e.fallbacks].map(p => [p.elementId, e.position] as const))),
    });
    expect(swaps.map(s => s.in.name)).toEqual(["Bogle", "Tzolakis", "Thomas-Asante"]);
    expect(swaps.map(s => s.assessment?.strength)).toEqual(["upgrade", "depth", "depth"]);
    // The existing gain contract is preserved even though it no longer sets priority alone.
    expect(swaps.map(s => s.gain)).toEqual([2.84, 4.16, 0.3]);
    expect(swaps[0]!.fallbacks.map(p => p.name)).toEqual(["Vuskovic", "Mitchell"]);
  });

  it("does not count points and Form as two independent supporting signals", () => {
    expect(assess(player(1, {}, { form: 2 }), player(2, { pointsPerGame: 8 }, { form: 9 })).strength).toBe("weak");
  });

  it("does not redirect a points-led upgrade to another player on minutes alone", () => {
    const neto = player(100, { name: "Neto", minutesPerGame: 54 },
      { pointsPerMatch: 3.3, form: 3.3, minutes: 161, starts: 2, expectedGoals: 0.47, expectedAssists: 0.43 });
    const janelt = examples.find(example => example.position === "MID")!.in;
    expect(assess(neto, janelt)).toMatchObject({ strength: "weak", signals: ["playing-time"],
      cautions: expect.arrayContaining(["lower-attacking-involvement", "minutes-alone"]),
    });
  });

  it("does not call a high-xG cameo an established upgrade", () => {
    const out = player(1, { minutesPerGame: 0 }, { minutes: 0, starts: 0, expectedGoals: 0, expectedAssists: 0 });
    const incoming = player(2, { minutesPerGame: 40 }, { minutes: 120, starts: 1, expectedGoals: 2 });
    expect(assess(out, incoming)).toMatchObject({ strength: "depth", cautions: ["small-sample"] });
  });

  it("keeps absent xG/xA and fixture data unknown instead of fabricating an advantage", () => {
    const out = player(1);
    out.fplStats!.expectedGoals = null;
    expect(assess(out, player(2))).toMatchObject({ strength: "weak", cautions: expect.arrayContaining(["missing-stats"]) });
    const withoutStats = player(3, { fplStats: undefined });
    expect(assess(player(1), withoutStats).strength).toBe("weak");
    expect(assess(player(1, { opponents: [] }, { form: 1 }), player(2, {}, { minutes: 540, starts: 6 })).strength).toBe("weak");
  });

  it.each(["i", "s", "d", "u"])("rejects an incoming player with availability %s", availability => {
    expect(assess(player(1, { availability: "i" }), player(2, { availability })).strength).toBe("weak");
    expect(assess(player(1, { availability }), player(2)).signals).toContain("availability");
  });

  it.each([["DEF", 10], ["MID", 12], ["FWD", 12]] as const)("uses the %s defensive scoring threshold", (position, threshold) => {
    const out = player(1, { defending: (threshold - 3) * 3 });
    const incoming = player(2, { defending: threshold * 3 });
    expect(assess(out, incoming, position).signals).toEqual(["defensive-involvement"]);
    expect(assess(out, { ...incoming, defending: threshold * 3 - 1 }, position).strength).toBe("weak");
  });

  it("requires an established sample and easier fixtures to support a Form-led swap", () => {
    const out = player(1, {}, { form: 2 });
    const incoming = player(2, {}, { minutes: 540, starts: 6, form: 5 });
    incoming.opponents = incoming.opponents.map(fixture => ({ ...fixture, difficulty: 2 }));
    expect(assess(out, incoming).signals).toEqual(["form-and-fixtures"]);
    incoming.fplStats!.minutes = 270;
    incoming.fplStats!.starts = 3;
    expect(assess(out, incoming).strength).toBe("weak");
  });

  it("can choose a different outgoing player when the lowest points do not imply the weakest evidence", () => {
    const out = player(1, { pointsPerGame: 1 }, { expectedGoals: 4 });
    const other = player(2, { pointsPerGame: 2 }, { expectedGoals: 0 });
    const incoming = player(3, { pointsPerGame: 3 });
    const swaps = buildWaiverPlan({ squad: [out, other], pool: [incoming], competition: new Map(),
      squadPositions: new Map([[1, "MID"], [2, "MID"]]), poolPositions: new Map([[3, "MID"]]),
    });
    expect(swaps[0]?.out.elementId).toBe(2);
  });

  it("checks the best candidate and fallbacks with the same rules", () => {
    const out = player(1, { pointsPerGame: 1 });
    const pointsOnly = player(2, { pointsPerGame: 5 });
    const supported = player(3, { pointsPerGame: 4 }, { expectedGoals: 2 });
    const fallback = player(4, { pointsPerGame: 3 }, { expectedGoals: 1.8 });
    const swaps = buildWaiverPlan({ squad: [out], pool: [pointsOnly, supported, fallback], competition: new Map(),
      squadPositions: new Map([[1, "MID"]]), poolPositions: new Map([[2, "MID"], [3, "MID"], [4, "MID"]]),
    });
    expect(swaps[0]?.in.elementId).toBe(3);
    expect(swaps[0]?.fallbacks.map(p => p.elementId)).toEqual([4]);
  });
});
