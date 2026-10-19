import { describe, expect, it } from "vitest";
import { buildWaiverPlan, type Position, type SwapCandidate } from "./core";
import { assessWaiver } from "./waiver-rules";

// Invented regression scenarios for the evidence thresholds; no live player data.
const examples: { position: Position; out: SwapCandidate; in: SwapCandidate; fallbacks: SwapCandidate[] }[] = [
  {
    "position": "GKP",
    "out": {
      "elementId": 930002,
      "name": "Keeper Cedar",
      "team": "AMB",
      "pointsPerGame": 0,
      "minutesPerGame": 0,
      "seasonPoints": 2,
      "goals": 0,
      "assists": 0,
      "defending": 0,
      "bonus": 0,
      "fplStats": {
        "pointsPerMatch": 0,
        "minutes": 5,
        "starts": 0,
        "cleanSheets": 0,
        "expectedGoals": 0.02,
        "expectedAssists": 0.01
      },
      "availability": "a",
      "news": "",
      "opponents": [
        {
          "opponent": "SUN",
          "averagePoints": null,
          "sample": 0,
          "difficulty": 3,
          "isHome": false,
          "event": 4
        },
        {
          "opponent": "FER",
          "averagePoints": null,
          "sample": 0,
          "difficulty": 3,
          "isHome": false,
          "event": 5
        },
        {
          "opponent": "VIO",
          "averagePoints": null,
          "sample": 0,
          "difficulty": 2,
          "isHome": true,
          "event": 6
        }
      ]
    },
    "in": {
      "elementId": 930571,
      "name": "Keeper Quartz",
      "team": "SIL",
      "pointsPerGame": 4.3,
      "minutesPerGame": 90,
      "seasonPoints": 28,
      "goals": 0,
      "assists": 0,
      "defending": 0,
      "bonus": 6,
      "fplStats": {
        "pointsPerMatch": 8.7,
        "minutes": 275,
        "starts": 3,
        "cleanSheets": 3,
        "expectedGoals": 0.02,
        "expectedAssists": 0.01
      },
      "availability": "a",
      "news": "",
      "opponents": [
        {
          "opponent": "LIL",
          "averagePoints": null,
          "sample": 0,
          "difficulty": 4,
          "isHome": false,
          "event": 4
        },
        {
          "opponent": "QUA",
          "averagePoints": null,
          "sample": 0,
          "difficulty": 3,
          "isHome": false,
          "event": 5
        },
        {
          "opponent": "ROS",
          "averagePoints": null,
          "sample": 0,
          "difficulty": 3,
          "isHome": true,
          "event": 6
        }
      ]
    },
    "fallbacks": []
  },
  {
    "position": "DEF",
    "out": {
      "elementId": 930498,
      "name": "Defender Silver",
      "team": "GOL",
      "pointsPerGame": 0.5,
      "minutesPerGame": 30,
      "seasonPoints": 5,
      "goals": 0,
      "assists": 0,
      "defending": 16,
      "bonus": 0,
      "fplStats": {
        "pointsPerMatch": 3,
        "minutes": 95,
        "starts": 1,
        "cleanSheets": 0,
        "expectedGoals": 0.02,
        "expectedAssists": 0.03
      },
      "availability": "a",
      "news": "",
      "opponents": [
        {
          "opponent": "ROS",
          "averagePoints": null,
          "sample": 0,
          "difficulty": 3,
          "isHome": true,
          "event": 4
        },
        {
          "opponent": "CED",
          "averagePoints": null,
          "sample": 0,
          "difficulty": 3,
          "isHome": true,
          "event": 5
        },
        {
          "opponent": "OCH",
          "averagePoints": null,
          "sample": 0,
          "difficulty": 4,
          "isHome": false,
          "event": 6
        }
      ]
    },
    "in": {
      "elementId": 930330,
      "name": "Defender Indigo",
      "team": "VIO",
      "pointsPerGame": 3.7,
      "minutesPerGame": 72,
      "seasonPoints": 24,
      "goals": 1,
      "assists": 0,
      "defending": 12,
      "bonus": 3,
      "fplStats": {
        "pointsPerMatch": 7.3,
        "minutes": 222,
        "starts": 3,
        "cleanSheets": 2,
        "expectedGoals": 0.92,
        "expectedAssists": 0.04
      },
      "availability": "a",
      "news": "",
      "opponents": [
        {
          "opponent": "QUA",
          "averagePoints": null,
          "sample": 0,
          "difficulty": 2,
          "isHome": true,
          "event": 4
        },
        {
          "opponent": "CRY",
          "averagePoints": null,
          "sample": 0,
          "difficulty": 3,
          "isHome": true,
          "event": 5
        },
        {
          "opponent": "AMB",
          "averagePoints": null,
          "sample": 0,
          "difficulty": 5,
          "isHome": false,
          "event": 6
        }
      ]
    },
    "fallbacks": [
      {
        "elementId": 930504,
        "name": "Defender Violet",
        "team": "FER",
        "pointsPerGame": 3,
        "minutesPerGame": 90,
        "seasonPoints": 20,
        "goals": 1,
        "assists": 0,
        "defending": 22,
        "bonus": 2,
        "fplStats": {
          "pointsPerMatch": 6,
          "minutes": 275,
          "starts": 3,
          "cleanSheets": 1,
          "expectedGoals": 0.37,
          "expectedAssists": 0.07
        },
        "availability": "a",
        "news": "",
        "opponents": [
          {
            "opponent": "TEA",
            "averagePoints": null,
            "sample": 0,
            "difficulty": 2,
            "isHome": false,
            "event": 4
          },
          {
            "opponent": "AMB",
            "averagePoints": null,
            "sample": 0,
            "difficulty": 4,
            "isHome": true,
            "event": 5
          },
          {
            "opponent": "SUN",
            "averagePoints": null,
            "sample": 0,
            "difficulty": 3,
            "isHome": false,
            "event": 6
          }
        ]
      },
      {
        "elementId": 930204,
        "name": "Defender Copper",
        "team": "CRY",
        "pointsPerGame": 2.7,
        "minutesPerGame": 84,
        "seasonPoints": 18,
        "goals": 2,
        "assists": 0,
        "defending": 16,
        "bonus": 2,
        "fplStats": {
          "pointsPerMatch": 5.3,
          "minutes": 258,
          "starts": 3,
          "cleanSheets": 0,
          "expectedGoals": 0.79,
          "expectedAssists": 0.19
        },
        "availability": "a",
        "news": "",
        "opponents": [
          {
            "opponent": "BLU",
            "averagePoints": null,
            "sample": 0,
            "difficulty": 2,
            "isHome": true,
            "event": 4
          },
          {
            "opponent": "VIO",
            "averagePoints": null,
            "sample": 0,
            "difficulty": 3,
            "isHome": false,
            "event": 5
          },
          {
            "opponent": "ASH",
            "averagePoints": null,
            "sample": 0,
            "difficulty": 3,
            "isHome": true,
            "event": 6
          }
        ]
      }
    ]
  },
  {
    "position": "MID",
    "out": {
      "elementId": 930043,
      "name": "Midfielder Amber",
      "team": "OCH",
      "pointsPerGame": 1.3,
      "minutesPerGame": 82,
      "seasonPoints": 10,
      "goals": 0,
      "assists": 0,
      "defending": 25,
      "bonus": 0,
      "fplStats": {
        "pointsPerMatch": 2.7,
        "minutes": 251,
        "starts": 3,
        "cleanSheets": 0,
        "expectedGoals": 0.58,
        "expectedAssists": 0.29
      },
      "availability": "a",
      "news": "",
      "opponents": [
        {
          "opponent": "UMB",
          "averagePoints": null,
          "sample": 0,
          "difficulty": 4,
          "isHome": true,
          "event": 4
        },
        {
          "opponent": "PIN",
          "averagePoints": null,
          "sample": 0,
          "difficulty": 3,
          "isHome": false,
          "event": 5
        },
        {
          "opponent": "GOL",
          "averagePoints": null,
          "sample": 0,
          "difficulty": 3,
          "isHome": true,
          "event": 6
        }
      ]
    },
    "in": {
      "elementId": 930098,
      "name": "Midfielder Cedar",
      "team": "COP",
      "pointsPerGame": 3.5,
      "minutesPerGame": 90,
      "seasonPoints": 23,
      "goals": 2,
      "assists": 0,
      "defending": 35,
      "bonus": 3,
      "fplStats": {
        "pointsPerMatch": 7,
        "minutes": 275,
        "starts": 3,
        "cleanSheets": 1,
        "expectedGoals": 0.52,
        "expectedAssists": 0.33
      },
      "availability": "a",
      "news": "",
      "opponents": [
        {
          "opponent": "IND",
          "averagePoints": null,
          "sample": 0,
          "difficulty": 3,
          "isHome": false,
          "event": 4
        },
        {
          "opponent": "LIL",
          "averagePoints": null,
          "sample": 0,
          "difficulty": 4,
          "isHome": true,
          "event": 5
        },
        {
          "opponent": "CED",
          "averagePoints": null,
          "sample": 0,
          "difficulty": 4,
          "isHome": false,
          "event": 6
        }
      ]
    },
    "fallbacks": [
      {
        "elementId": 930242,
        "name": "Midfielder Quartz",
        "team": "ROS",
        "pointsPerGame": 2.5,
        "minutesPerGame": 78,
        "seasonPoints": 17,
        "goals": 1,
        "assists": 0,
        "defending": 13,
        "bonus": 3,
        "fplStats": {
          "pointsPerMatch": 5,
          "minutes": 239,
          "starts": 3,
          "cleanSheets": 1,
          "expectedGoals": 0.29,
          "expectedAssists": 0.17
        },
        "availability": "a",
        "news": "",
        "opponents": [
          {
            "opponent": "GOL",
            "averagePoints": null,
            "sample": 0,
            "difficulty": 3,
            "isHome": false,
            "event": 4
          },
          {
            "opponent": "BLU",
            "averagePoints": null,
            "sample": 0,
            "difficulty": 2,
            "isHome": true,
            "event": 5
          },
          {
            "opponent": "SIL",
            "averagePoints": null,
            "sample": 0,
            "difficulty": 2,
            "isHome": false,
            "event": 6
          }
        ]
      },
      {
        "elementId": 930286,
        "name": "Midfielder Violet",
        "team": "SIL",
        "pointsPerGame": 2.3,
        "minutesPerGame": 84,
        "seasonPoints": 16,
        "goals": 0,
        "assists": 1,
        "defending": 32,
        "bonus": 0,
        "fplStats": {
          "pointsPerMatch": 4.7,
          "minutes": 258,
          "starts": 3,
          "cleanSheets": 3,
          "expectedGoals": 0.22,
          "expectedAssists": 0.07
        },
        "availability": "a",
        "news": "",
        "opponents": [
          {
            "opponent": "LIL",
            "averagePoints": null,
            "sample": 0,
            "difficulty": 4,
            "isHome": false,
            "event": 4
          },
          {
            "opponent": "QUA",
            "averagePoints": null,
            "sample": 0,
            "difficulty": 3,
            "isHome": false,
            "event": 5
          },
          {
            "opponent": "ROS",
            "averagePoints": null,
            "sample": 0,
            "difficulty": 3,
            "isHome": true,
            "event": 6
          }
        ]
      }
    ]
  },
  {
    "position": "FWD",
    "out": {
      "elementId": 930108,
      "name": "Forward Amber",
      "team": "COP",
      "pointsPerGame": 0.5,
      "minutesPerGame": 4,
      "seasonPoints": 5,
      "goals": 0,
      "assists": 0,
      "defending": 2,
      "bonus": 0,
      "fplStats": {
        "pointsPerMatch": 1,
        "minutes": 18,
        "starts": 0,
        "cleanSheets": 0,
        "expectedGoals": 0.09,
        "expectedAssists": 0.05
      },
      "availability": "a",
      "news": "",
      "opponents": [
        {
          "opponent": "IND",
          "averagePoints": null,
          "sample": 0,
          "difficulty": 3,
          "isHome": false,
          "event": 4
        },
        {
          "opponent": "LIL",
          "averagePoints": null,
          "sample": 0,
          "difficulty": 4,
          "isHome": true,
          "event": 5
        },
        {
          "opponent": "CED",
          "averagePoints": null,
          "sample": 0,
          "difficulty": 4,
          "isHome": false,
          "event": 6
        }
      ]
    },
    "in": {
      "elementId": 930194,
      "name": "Forward Copper",
      "team": "TEA",
      "pointsPerGame": 0.7,
      "minutesPerGame": 40,
      "seasonPoints": 6,
      "goals": 0,
      "assists": 0,
      "defending": 11,
      "bonus": 0,
      "fplStats": {
        "pointsPerMatch": 1.3,
        "minutes": 125,
        "starts": 1,
        "cleanSheets": 0,
        "expectedGoals": 0.02,
        "expectedAssists": 0.03
      },
      "availability": "a",
      "news": "",
      "opponents": [
        {
          "opponent": "FER",
          "averagePoints": null,
          "sample": 0,
          "difficulty": 2,
          "isHome": true,
          "event": 4
        },
        {
          "opponent": "ASH",
          "averagePoints": null,
          "sample": 0,
          "difficulty": 3,
          "isHome": false,
          "event": 5
        },
        {
          "opponent": "QUA",
          "averagePoints": null,
          "sample": 0,
          "difficulty": 2,
          "isHome": true,
          "event": 6
        }
      ]
    },
    "fallbacks": []
  }
];
const stats = { pointsPerMatch: 6, form: 6, minutes: 270, starts: 3, cleanSheets: 0, expectedGoals: 0.9, expectedAssists: 0.3 };
const player = (id: number, overrides: Partial<SwapCandidate> = {}, published: Partial<typeof stats> = {}): SwapCandidate => ({
  elementId: id, name: `Player ${id}`, team: "AMB", pointsPerGame: 3, minutesPerGame: 90,
  seasonPoints: 18, goals: 0, assists: 0, defending: 20, bonus: 0, availability: "a", news: "",
  opponents: [1, 2, 3].map(event => ({ opponent: "ROS", event, difficulty: 3, averagePoints: null, sample: 0, isHome: true })),
  fplStats: { ...stats, ...published }, ...overrides,
});
const assess = (out: SwapCandidate, incoming: SwapCandidate, position: Position = "MID") => assessWaiver({ out, incoming, position });

describe("waiver evidence rules", () => {
  it("distinguishes the four synthetic suggestions without player-specific rules", () => {
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
    expect(swaps.map(s => s.in.name)).toEqual(["Defender Indigo", "Keeper Quartz", "Forward Copper"]);
    expect(swaps.map(s => s.assessment?.strength)).toEqual(["upgrade", "depth", "depth"]);
    // The existing gain contract is preserved even though it no longer sets priority alone.
    expect(swaps.map(s => s.gain)).toEqual([2.84, 4.16, 0.3]);
    expect(swaps[0]!.fallbacks.map(p => p.name)).toEqual(["Defender Violet", "Defender Copper"]);
  });

  it("does not count points and Form as two independent supporting signals", () => {
    expect(assess(player(1, {}, { form: 2 }), player(2, { pointsPerGame: 8 }, { form: 9 })).strength).toBe("weak");
  });

  it("does not redirect a points-led upgrade to another player on minutes alone", () => {
    const fringeMidfielder = player(100, { name: "Midfielder Silver", minutesPerGame: 54 },
      { pointsPerMatch: 3.3, form: 3.3, minutes: 161, starts: 2, expectedGoals: 0.47, expectedAssists: 0.43 });
    const freeMidfielder = examples.find(example => example.position === "MID")!.in;
    expect(assess(fringeMidfielder, freeMidfielder)).toMatchObject({ strength: "weak", signals: ["playing-time"],
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
