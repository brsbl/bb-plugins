import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import { afterEach, describe, expect, it } from "vitest";
import plugin from "./server.js";

const cleanups: (() => Promise<void>)[] = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0)) await cleanup(); });
function setup() {
  const { bb, harness } = createFakePluginHost({ pluginId: "crm" });
  plugin(bb);
  cleanups.push(() => harness.lifecycle.dispose());
  const cli = (...argv: string[]) => harness.behavior.runCli([...argv, "--json"]);
  const ok = async (...argv: string[]) => {
    const result = await cli(...argv);
    expect(result.exitCode, result.stderr).toBe(0);
    return JSON.parse(result.stdout!);
  };
  return { harness, cli, ok };
}
async function fixture(ok: (...args: string[]) => Promise<any>) {
  await ok("add", "company", "Acme Example", "--id", "acme");
  await ok("add", "company", "Demo Orbit", "--id", "orbit");
  await ok("add", "person", "Alex Example", "--id", "alex", "--company", "acme", "--role", "Engineering lead");
  await ok("add", "person", "Blair Sample", "--id", "blair", "--company", "acme", "--role", "CEO");
  await ok("add", "person", "Drew Fiction", "--id", "drew", "--role", "Angel");
  await ok("add", "track", "--id", "customer", "--company", "acme", "--person", "alex", "--kind", "customer", "--next", "Start a shared channel", "--owner", "Sam Demo", "--date", "2026-10-20");
  await ok("add", "track", "--id", "investor", "--company", "acme", "--person", "blair", "--kind", "investor");
  await ok("add", "track", "--id", "angel", "--person", "drew", "--kind", "investor");
}
describe("CRM persisted CLI and RPC", () => {
  it("keeps company tracks independent, supports a shared contact and standalone angels, and survives reload", async () => {
    const { harness, ok } = setup();
    await fixture(ok);
    await ok("update", "track", "customer", "--stage", "Shared channel", "--next", "Book the usage call");
    await ok("update", "track", "investor", "--person", "alex", "--stage", "Conversation");
    const { harness: reloaded } = await harness.lifecycle.reload(plugin);
    cleanups.push(() => reloaded.lifecycle.dispose());
    const listed = await reloaded.behavior.runCli(["list", "--type", "tracks", "--company", "acme", "--json"]);
    expect(listed.exitCode, listed.stderr).toBe(0);
    const { items } = JSON.parse(listed.stdout!);
    expect(items).toHaveLength(2);
    expect(items.find((t: any) => t.id === "customer")).toMatchObject({ stage: "Shared channel", nextStep: "Book the usage call", owner: "Sam Demo", date: "2026-10-20", personId: "alex" });
    expect(items.find((t: any) => t.id === "investor")).toMatchObject({ stage: "Conversation", nextStep: "", personId: "alex" });
    const view: any = await reloaded.behavior.callRpc("view", { query: "", limit: 50, offset: 0 });
    expect(view.groups.find((g: any) => g.subjectId === "drew")).toMatchObject({ subjectType: "person", tracks: [expect.objectContaining({ id: "angel", personId: "drew" })] });
    expect(view.groups.find((g: any) => g.subjectId === "orbit").tracks).toEqual([]);
  });
  it("rejects invalid relationships, dates, stages, duplicate tracks and unknown flags without changing data", async () => {
    const { ok, cli } = setup();
    await fixture(ok);
    for (const argv of [
      ["add", "person", "Missing Example", "--company", "missing"],
      ["add", "track", "--company", "orbit", "--person", "alex", "--kind", "customer"],
      ["add", "track", "--person", "alex", "--kind", "investor"],
      ["add", "track", "--person", "drew", "--kind", "customer"],
      ["add", "track", "--company", "acme", "--kind", "customer"],
      ["update", "track", "customer", "--stage", "Committed"],
      ["update", "track", "customer", "--date", "2026-02-30"],
      ["update", "track", "customer", "--next", "x".repeat(1001)],
      ["update", "track", "customer", "--persno", "blair"],
      ["update", "person", "alex", "--company", "orbit"],
      ["update", "person", "drew", "--company", "orbit"],
      ["update", "track", "angel", "--clear-person"],
      ["add", "company", "Duplicate Example", "--id", "acme"],
      ["update", "track", "customer"],
    ]) {
      const result = await cli(...argv);
      expect(result.exitCode, argv.join(" ")).not.toBe(0);
      expect(JSON.parse(result.stdout!).ok).toBe(false);
    }
    expect((await ok("list", "--type", "tracks", "--company", "acme")).items.find((t: any) => t.id === "customer")).toMatchObject({ personId: "alex", date: "2026-10-20", stage: "Champion identified", nextStep: "Start a shared channel" });
    await ok("update", "track", "customer", "--clear-person", "--clear-date");
    await ok("update", "person", "alex", "--company", "orbit");
    expect((await ok("list", "--type", "people", "--company", "orbit")).items).toHaveLength(1);
  });
  it("logs once against both contact and company and preserves the historical company when the person moves", async () => {
    const { harness, ok, cli } = setup();
    await fixture(ok);
    await ok("log", "--id", "intro", "--person", "alex", "--kind", "intro", "--date", "2026-10-11", "--note", "Met the demo team", "--track", "customer");
    expect((await cli("log", "--id", "intro", "--person", "alex", "--kind", "intro", "--date", "2026-10-11", "--note", "Retry")).exitCode).not.toBe(0);
    expect((await cli("log", "--person", "alex", "--company", "orbit", "--kind", "call", "--date", "2026-10-11", "--note", "Wrong company")).exitCode).not.toBe(0);
    await ok("update", "track", "customer", "--clear-person");
    await ok("update", "person", "alex", "--company", "orbit");
    const history: any = await harness.behavior.callRpc("history", { subjectType: "company", subjectId: "acme", offset: 0 });
    expect(history.items).toHaveLength(1);
    expect(history.items[0]).toMatchObject({ companyId: "acme", personId: "alex", note: "Met the demo team" });
    expect(history.people[0].name).toBe("Alex Example");
    expect((await ok("list", "--type", "interactions", "--person", "alex")).items).toHaveLength(1);
  });
  it("paginates list, view and history deterministically and searches across company contacts", async () => {
    const { harness, ok } = setup();
    await fixture(ok);
    const first = await ok("list", "--type", "companies", "--limit", "1");
    const second = await ok("list", "--type", "companies", "--limit", "1", "--offset", String(first.nextOffset));
    expect(first.items[0].id).not.toBe(second.items[0].id);
    expect(second.nextOffset).toBeNull();
    const view: any = await harness.behavior.callRpc("view", { query: "blair", kind: "investor", limit: 1, offset: 0 });
    expect(view.groups).toHaveLength(1);
    expect(view.groups[0]).toMatchObject({ name: "Acme Example", tracks: [expect.objectContaining({ kind: "investor" })] });
    for (let i = 0; i < 21; i++) await ok("log", "--id", "event_" + i, "--person", "drew", "--kind", "message", "--date", "2026-10-11", "--note", "Fictional note " + i);
    const h1: any = await harness.behavior.callRpc("history", { subjectType: "person", subjectId: "drew", offset: 0 });
    const h2: any = await harness.behavior.callRpc("history", { subjectType: "person", subjectId: "drew", offset: h1.nextOffset });
    expect(h1.items).toHaveLength(20); expect(h2.items).toHaveLength(1); expect(h2.nextOffset).toBeNull();
    expect(new Set([...h1.items, ...h2.items].map(i => i.id)).size).toBe(21);
  });
  it("preserves disjoint concurrent updates and notifies without publishing record content", async () => {
    const { harness, ok } = setup();
    await fixture(ok);
    await Promise.all([ok("update", "track", "customer", "--next", "New step"), ok("update", "track", "customer", "--owner", "New Demo Owner")]);
    expect((await ok("list", "--type", "tracks")).items.find((t: any) => t.id === "customer")).toMatchObject({ nextStep: "New step", owner: "New Demo Owner" });
    expect(harness.inspection.realtimeSignals.every(signal => JSON.stringify(signal.payload) === "{}")).toBe(true);
    expect(harness.inspection.logEntries).toHaveLength(0);
    expect((await harness.behavior.runCli(["add", "track", "--help"])).exitCode).toBe(0);
  });
});

