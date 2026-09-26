import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import { describe, expect, it } from "vitest";

import plugin from "./server";

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
    await harness.lifecycle.dispose();
  });
});

describe("import script", () => {
  it("builds lists from a CSV and a Takeout GeoJSON file", async () => {
    const dir = await mkdtemp(join(tmpdir(), "saved-places-import-"));
    try {
      await writeFile(join(dir, "Coffee.csv"), 'Title,Note,URL\n"Cafe ""One""",,https://www.google.com/maps/place/Cafe/@35.1,139.2,17z\nNo coords,,\n');
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
        { name: 'Cafe "One"', latitude: 35.1, longitude: 139.2, collectionId: "coffee", category: "coffee" },
        { name: "Museo Tamayo", url: "https://maps.google.com/?cid=123", collectionId: "starred-places", category: "culture" },
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
