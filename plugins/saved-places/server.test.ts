import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import { describe, expect, it } from "vitest";

import plugin from "./server";
import { allPlaces, applyCategoryOverrides } from "./model";

describe("Saved Places plugin", () => {
  it("serves the bundled places over rpc and the CLI", async () => {
    const { bb, harness } = createFakePluginHost({ pluginId: "saved-places" });
    plugin(bb);
    const places = await harness.behavior.callRpc("list") as unknown[];
    expect(places.length).toBeGreaterThan(0);
    const collections = await harness.behavior.runCli(["collections", "--json"]);
    expect(collections.exitCode).toBe(0);
    expect(JSON.parse(collections.stdout).length).toBeGreaterThan(0);
    expect((await harness.behavior.runCli(["list", "--collection", "missing"])).exitCode).toBe(1);
    const names = async (category: string) => (JSON.parse((await harness.behavior.runCli(["list", "--category", category, "--json"])).stdout) as Array<{ name: string }>).map(place => place.name);
    expect(await names("museum")).toEqual(expect.arrayContaining(["Mori Art Museum", "teamLab Planets"]));
    expect(await names("museum")).not.toContain("Senso-ji");
    expect(await names("culture")).toEqual(expect.arrayContaining(["Senso-ji", "Mori Art Museum"]));
    const [sensoji] = JSON.parse((await harness.behavior.runCli(["list", "--query", "Senso-ji", "--json"])).stdout) as Array<{ category: string }>;
    expect(sensoji.category).toBe("temple");
    await harness.lifecycle.dispose();
  });

  it("keeps every other category fix when one stored value is no longer a known category", async () => {
    const { bb, harness } = createFakePluginHost({ pluginId: "saved-places" });
    plugin(bb);
    const sensoji = allPlaces.find(place => place.name === "Senso-ji")!.key;
    await bb.storage.kv.set("category-overrides", { [sensoji]: "shrine", "cid:1": "retired-category" });
    const categoryOf = async (name: string) => (JSON.parse((await harness.behavior.runCli(["list", "--query", name, "--json"])).stdout) as Array<{ category: string }>)[0].category;
    expect(await categoryOf("Senso-ji")).toBe("shrine");
    expect((await harness.behavior.runCli(["category", "Mori Art Museum", "gallery"])).exitCode).toBe(0);
    expect(await bb.storage.kv.get("category-overrides")).toEqual(expect.objectContaining({ [sensoji]: "shrine", "cid:1": "retired-category" }));
    expect(await categoryOf("Senso-ji")).toBe("shrine");
    await harness.behavior.runCli(["category", "Senso-ji", "auto"]);
    await harness.behavior.runCli(["category", "Mori Art Museum", "auto"]);
    applyCategoryOverrides({});
    await harness.lifecycle.dispose();
  });

  it("keeps category fixes in plugin storage, separate from the imported data", async () => {
    const { bb, harness } = createFakePluginHost({ pluginId: "saved-places" });
    plugin(bb);
    const categoryOf = async (name: string) => (JSON.parse((await harness.behavior.runCli(["list", "--query", name, "--json"])).stdout) as Array<{ category: string }>)[0].category;
    expect((await harness.behavior.runCli(["category", "Senso-ji", "shrine"])).exitCode).toBe(0);
    expect(await categoryOf("Senso-ji")).toBe("shrine");
    const state = await harness.behavior.callRpc("state") as { categories: Record<string, string> };
    expect(Object.values(state.categories)).toEqual(["shrine"]);
    expect((await harness.behavior.runCli(["category", "Senso-ji", "nope"])).exitCode).toBe(1);
    expect((await harness.behavior.runCli(["category", "Nowhere at all", "shrine"])).exitCode).toBe(1);
    applyCategoryOverrides({});
    expect(await categoryOf("Senso-ji")).toBe("shrine");
    expect((await harness.behavior.runCli(["category", "Senso-ji", "auto"])).exitCode).toBe(0);
    expect(await categoryOf("Senso-ji")).toBe("temple");
    expect(JSON.parse((await harness.behavior.runCli(["categories", "--json"])).stdout)).toEqual(expect.arrayContaining([expect.objectContaining({ id: "address", label: "Addresses" })]));
    await harness.lifecycle.dispose();
  });
});

describe("import script", () => {
  it("builds lists from a CSV and a Takeout GeoJSON file", async () => {
    const dir = await mkdtemp(join(tmpdir(), "saved-places-import-"));
    try {
      await writeFile(join(dir, "Coffee.csv"), 'Title,Note,URL\n"Cafe ""One""",,"https://www.google.com/maps/place/Cafe/@35.1,139.2,17z"\nNo coords,,\n');
      await writeFile(join(dir, "Saved Places.json"), JSON.stringify({
        type: "FeatureCollection",
        features: [
          { type: "Feature", geometry: { type: "Point", coordinates: [-99.16, 19.42] }, properties: { google_maps_url: "https://maps.google.com/?cid=123", location: { name: "Museo Tamayo", address: "Mexico City" } } },
          { type: "Feature", geometry: { type: "Point", coordinates: [0, 0] }, properties: { location: { name: "Nowhere" } } },
        ],
      }));
      const out = join(dir, "out.json");
      await promisify(execFile)("node", ["scripts/import.mjs", "--out", out, join(dir, "Coffee.csv"), join(dir, "Saved Places.json")]);
      const data = JSON.parse(await readFile(out, "utf8"));
      expect(data.collections.map((c: { id: string }) => c.id)).toEqual(["coffee", "starred-places"]);
      expect(data.places).toMatchObject([
        { name: 'Cafe "One"', latitude: 35.1, longitude: 139.2, collectionId: "coffee", category: "other" },
        { name: "Museo Tamayo", url: "https://maps.google.com/?cid=123", collectionId: "starred-places", category: "other" },
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
