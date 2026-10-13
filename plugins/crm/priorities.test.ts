import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import type { BbPluginApi } from "@get-bb/plugin-sdk";
import { afterEach, expect, it } from "vitest";
import plugin from "./server.js";
import { MIGRATIONS } from "./store.js";
const cleanups: (() => Promise<void>)[] = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0)) await cleanup(); });
function setup(before?: (bb: BbPluginApi) => void) {
  const { bb, harness } = createFakePluginHost({ pluginId: "crm" });
  before?.(bb); plugin(bb); cleanups.push(() => harness.lifecycle.dispose());
  const cli = (...argv: string[]) => harness.behavior.runCli([...argv, "--json"]);
  const ok = async (...argv: string[]) => { const r = await cli(...argv); expect(r.exitCode, r.stderr).toBe(0); return JSON.parse(r.stdout!); };
  return { harness, cli, ok };
}
it("upgrades the exact eight-statement 6a18e79 schema without changing records, notes or unknown stages", async () => {
  let oldTracks: unknown[];
  const { harness, ok } = setup(bb => {
    const db = bb.storage.database(); bb.storage.migrate(db, MIGRATIONS.slice(0, 8));
    db.prepare("INSERT INTO crm_companies VALUES (?,?)").run("alpha", "Alpha Demo");
    db.prepare("INSERT INTO crm_companies VALUES (?,?)").run("zeta", "Zeta Example");
    db.prepare("INSERT INTO crm_people VALUES (?,?,?,?)").run("alex", "Alex Example", "Founder", "alpha");
    db.prepare("INSERT INTO crm_people VALUES (?,?,?,?)").run("angel", "Middle Fiction", "Angel", null);
    const add = db.prepare("INSERT INTO crm_tracks VALUES (?,?,?,?,?,?,?,?,?)");
    add.run("alpha-investor", "company", "alpha", "investor", "alex", "Conversation", "Keep this ask", "Sam Demo", "2026-10-20");
    add.run("zeta-investor", "company", "zeta", "investor", null, "Future demo stage", "Keep unassigned ask", "Taylor Example", null);
    add.run("angel-investor", "person", "angel", "investor", "angel", "Committed", "Keep angel ask", "Sam Demo", null);
    add.run("customer", "company", "alpha", "customer", "alex", "M3 · Team", "Keep customer step", "Sam Demo", null);
    db.prepare("INSERT INTO crm_interactions VALUES (?,?,?,?,?,?,?,?)").run("note", "alpha", "alex", "call", "2026-10-12", "Keep this fictional note", "investor", "2026-10-12T00:00:00Z");
    oldTracks = db.prepare("SELECT * FROM crm_tracks ORDER BY id").all();
  });
  expect((await ok("list", "--type", "tracks")).items).toEqual(oldTracks!);
  const ranked = (await ok("list", "--type", "investors")).items;
  expect(ranked.map((r: any) => [r.track.id, r.rank, r.total, r.legacyStage])).toEqual([["alpha-investor",1,null,"Conversation"],["angel-investor",2,null,"Committed"],["zeta-investor",3,null,"Future demo stage"]]);
  expect(ranked[2].person).toBeNull();
  expect((await ok("list", "--type", "people")).items).toHaveLength(2);
  expect((await ok("list", "--type", "companies")).items).toHaveLength(2);
  expect((await ok("list", "--type", "interactions")).items[0]).toMatchObject({ id: "note", note: "Keep this fictional note", personId: "alex", companyId: "alpha" });
  expect((await ok("list", "--type", "customers")).items).toHaveLength(1);
  expect((await harness.behavior.callRpc("history", { subjectType: "company", subjectId: "alpha" }) as any).items[0].id).toBe("note");
  const reload = await harness.lifecycle.reload(plugin); cleanups.push(() => reload.harness.lifecycle.dispose());
  expect(JSON.parse((await reload.harness.behavior.runCli(["list", "--type", "investors", "--json"])).stdout!).items).toEqual(ranked);
});
it("derives customer tiers independently, accepts overrides, and preserves the milestone and other track", async () => {
  const { ok, cli } = setup();
  await ok("add", "company", "Acme Example", "--id", "acme");
  await ok("add", "person", "Alex Example", "--id", "alex", "--company", "acme");
  await ok("add", "investor", "alex", "--id", "investor", "--ask", "An introduction");
  expect((await ok("list", "--type", "customers")).items).toHaveLength(0);
  await ok("add", "track", "--company", "acme", "--person", "alex", "--kind", "customer", "--id", "customer", "--stage", "M2 · Value");
  const tracks = await ok("list", "--type", "tracks");
  const investor = await ok("list", "--type", "investors");
  expect((await ok("list", "--type", "customers")).items[0]).toMatchObject({ tier: 3, total: null });
  for (const [scores, tier] of [["1",3],["2",2],["4",1]] as const) {
    expect(await ok("score", "customer", "acme", "--champion-strength", scores, "--room-to-grow", scores, "--case-study-value", scores, "--active-people", scores)).toMatchObject({ tier });
  }
  expect(await ok("tier", "set", "acme", "--tier", "2", "--why", "Fictional capacity limit")).toMatchObject({ tier: 2, tierOverride: 2 });
  expect(await ok("score", "customer", "acme", "--champion-strength", "5")).toMatchObject({ tier: 2, total: 17 });
  expect(await ok("tier", "auto", "acme")).toMatchObject({ tier: 1, tierOverride: null, why: "Fictional capacity limit" });
  const before = await ok("list", "--type", "customers");
  for (const args of [["score","customer","acme","--active-people","6"],["score","customer","acme","--active-people","1.5"],["tier","set","acme","--tier","1","--why"," "]]) expect((await cli(...args)).exitCode).not.toBe(0);
  expect(await ok("list", "--type", "customers")).toEqual(before);
  expect(await ok("list", "--type", "tracks")).toEqual(tracks);
  expect(await ok("list", "--type", "investors")).toEqual(investor);
});
it("orders investors by total with stable ties, preserves manual positions, and clears an override", async () => {
  const { ok, cli, harness } = setup();
  for (const id of ["a","b","c"]) {
    await ok("add", "person", "Demo " + id, "--id", id);
    await ok("add", "investor", id, "--id", "i_" + id);
  }
  const order = async () => (await ok("list", "--type", "investors")).items.map((r: any) => r.track.id);
  await ok("score", "investor", "i_b", "--company-scale", "4", "--social-proof", "3", "--why", "Demo social proof");
  await ok("score", "investor", "i_c", "--introductions", "5", "--co-marketing", "2");
  expect(await order()).toEqual(["i_b","i_c","i_a"]);
  await ok("rank", "set", "i_a", "--rank", "2", "--why", "Fictional warm relationship");
  expect(await order()).toEqual(["i_b","i_a","i_c"]);
  await ok("score", "investor", "i_c", "--company-scale", "5");
  expect(await order()).toEqual(["i_c","i_a","i_b"]);
  await ok("rank", "move", "i_b", "--direction", "up", "--why", "Fictional time-sensitive ask");
  expect(await order()).toEqual(["i_c","i_b","i_a"]);
  await ok("rank", "auto", "i_a"); await ok("rank", "auto", "i_b");
  expect(await order()).toEqual(["i_c","i_b","i_a"]);
  const before = await ok("list", "--type", "investors");
  for (const args of [["rank","set","i_a","--rank","4","--why","Too far"],["rank","move","i_c","--direction","up","--why","Past top"],["score","investor","i_b","--social-proof","-1"],["rank","set","i_a","--rank","1","--why"," "]]) expect((await cli(...args)).exitCode).not.toBe(0);
  await expect(harness.behavior.callRpc("setRank", { id: "i_b", rank: 1.5, why: "Invalid fraction" })).rejects.toThrow();
  expect(await ok("list", "--type", "investors")).toEqual(before);
  const page = await ok("list", "--type", "investors", "--limit", "1", "--offset", "1");
  expect(page.items[0].rank).toBe(2); expect(page.nextOffset).toBe(2);
});
it("ranks multiple people at one company and preserves their identities and note history when affiliations change", async () => {
  const { ok, cli } = setup();
  await ok("add", "company", "Demo Company", "--id", "company");
  for (const id of ["alex","blair"]) { await ok("add", "person", "Example " + id, "--id", id, "--company", "company"); await ok("add", "investor", id, "--id", "i_" + id); }
  expect((await cli("add", "track", "--company", "company", "--person", "alex", "--kind", "investor")).exitCode).not.toBe(0);
  await ok("log", "--person", "alex", "--kind", "call", "--date", "2026-10-12", "--note", "Fictional company conversation");
  await ok("update", "person", "alex", "--clear-company");
  const rows = (await ok("list", "--type", "investors")).items;
  expect(rows).toHaveLength(2); expect(rows[0].company).toBeNull(); expect(rows[1].company.id).toBe("company");
  expect((await ok("list", "--type", "interactions")).items[0].companyId).toBe("company");
  await ok("update", "track", "i_alex", "--next", "New fictional ask");
  expect((await ok("list", "--type", "investors")).items[0].track.nextStep).toBe("New fictional ask");
});
it("upgrades the exact 4a05713 schema and retains scores, manual priorities and all original records on reload", async () => {
  let scores: unknown[]; let tracks: unknown[];
  const { ok, harness } = setup(bb => {
    const db = bb.storage.database(); bb.storage.migrate(db, MIGRATIONS.slice(0, 14));
    db.prepare("INSERT INTO crm_companies VALUES (?,?)").run("demo", "Demo Company");
    db.prepare("INSERT INTO crm_people VALUES (?,?,?,?)").run("alex", "Alex Example", "Founder", "demo");
    db.prepare("INSERT INTO crm_tracks VALUES (?,?,?,?,?,?,?,?,?)").run("investor", "company", "demo", "investor", "alex", "Unknown demo stage", "Keep ask", "Sam Demo", null);
    db.prepare("UPDATE crm_investor_scores SET companyScale=5,socialProof=4,introductions=3,coMarketing=2,rankOverride=1,why='Keep rationale'").run();
    db.prepare("INSERT INTO crm_interactions VALUES (?,?,?,?,?,?,?,?)").run("note", "demo", "alex", "call", "2026-10-12", "Fictional retained note", "investor", "2026-10-12T00:00:00Z");
    scores = db.prepare("SELECT * FROM crm_investor_scores").all(); tracks = db.prepare("SELECT * FROM crm_tracks").all();
  });
  const result = await ok("list", "--type", "investors");
  expect(result).toMatchObject({ rankCount: 1, parkedCount: 0 });
  expect(result.items[0]).toMatchObject({ parked: false, statusReason: "", rank: 1, rankOverride: 1, total: 14, why: "Keep rationale", legacyStage: "Unknown demo stage" });
  expect(result.items[0].scores).toEqual({ companyScale: 5, socialProof: 4, introductions: 3, coMarketing: 2 });
  expect((await ok("list", "--type", "tracks")).items).toEqual(tracks!);
  expect((await ok("list", "--type", "interactions")).items[0].note).toBe("Fictional retained note");
  const reload = await harness.lifecycle.reload(plugin); cleanups.push(() => reload.harness.lifecycle.dispose());
  expect(JSON.parse((await reload.harness.behavior.runCli(["list", "--type", "investors", "--json"])).stdout!)).toEqual(result);
  // The migration appends fields; all pre-existing score columns retain their values.
  expect(result.items[0]).toMatchObject({ rankOverride: (scores![0] as any).rankOverride, why: (scores![0] as any).why });
});
it("parks independently, preserves history and scores, and returns by score rather than its former manual rank", async () => {
  const { ok, cli, harness } = setup();
  await ok("add", "company", "Demo Company", "--id", "demo");
  for (const [id, score] of [["a","5"],["b","3"],["c","1"]]) {
    await ok("add", "person", "Example " + id, "--id", id!, "--company", "demo");
    await ok("add", "investor", id!, "--id", "i_" + id);
    await ok("score", "investor", "i_" + id, "--company-scale", score!, "--why", "Keep rationale " + id);
  }
  await ok("add", "track", "--company", "demo", "--person", "c", "--kind", "customer", "--id", "customer", "--stage", "M3 · Team");
  await ok("log", "--person", "c", "--kind", "call", "--date", "2026-10-12", "--note", "Keep fictional history");
  const original = await Promise.all(["companies","people","tracks","interactions","customers"].map(type => ok("list", "--type", type)));
  await ok("rank", "set", "i_c", "--rank", "1", "--why", "Keep manual rationale");
  await ok("rank", "set", "i_b", "--rank", "3", "--why", "Demo pinned position");
  const parked = await ok("park", "i_c", "--reason", "  Outside the fictional top ten  ");
  expect(parked).toMatchObject({ parked: true, rank: 0, rankOverride: null, total: 1, why: "Keep manual rationale", statusReason: "Outside the fictional top ten" });
  const active = await ok("list", "--type", "investors");
  expect(active).toMatchObject({ total: 2, rankCount: 2, parkedCount: 1 });
  expect(active.items.map((r: any) => [r.track.id, r.rank, r.rankOverride])).toEqual([["i_a",1,null],["i_b",2,2]]);
  expect(await ok("park", "i_c")).toEqual(parked);
  expect(await ok("list", "--type", "investors")).toEqual(active);
  expect((await ok("list", "--type", "investors", "--status", "parked")).items).toEqual([parked]);
  const page = await ok("list", "--type", "investors", "--status", "all", "--limit", "1", "--offset", "2");
  expect(page).toMatchObject({ items: [parked], total: 3, rankCount: 2, parkedCount: 1, nextOffset: null });
  expect((await harness.behavior.callRpc("investors", { query: "Example c" }) as any).items).toEqual([]);
  expect((await harness.behavior.callRpc("investors", { query: "Example c", status: "all" }) as any).items).toEqual([parked]);
  for (const args of [["rank","set","i_c","--rank","1","--why","Demo"],["rank","move","i_c","--direction","up","--why","Demo"],["rank","auto","i_c"],["park","missing"],["unpark","missing"],["park","i_a","--reason","x".repeat(2001)],["list","--type","investors","--status","invalid"],["list","--type","customers","--status","parked"]]) expect((await cli(...args)).exitCode).not.toBe(0);
  expect(await ok("list", "--type", "investors")).toEqual(active);
  expect(await ok("score", "investor", "i_c", "--social-proof", "0")).toMatchObject({ parked: true, rank: 0, total: 1, why: "Keep manual rationale" });
  expect(await ok("unpark", "i_c", "--reason", "Fictional follow-up resumed")).toMatchObject({ parked: false, rank: 3, rankOverride: null, total: 1, statusReason: "Fictional follow-up resumed" });
  await ok("unpark", "i_b"); // Idempotent active request must preserve an existing manual override.
  expect((await ok("list", "--type", "investors")).items[1]).toMatchObject({ track: { id: "i_b" }, rankOverride: 2 });
  expect(await Promise.all(["companies","people","tracks","interactions","customers"].map(type => ok("list", "--type", type)))).toEqual(original);
  for (const id of ["i_a","i_b","i_c"]) await ok("park", id);
  expect(await ok("list", "--type", "investors")).toMatchObject({ items: [], total: 0, rankCount: 0, parkedCount: 3 });
  expect(await ok("unpark", "i_a")).toMatchObject({ rank: 1, total: 5 });
});
