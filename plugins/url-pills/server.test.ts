import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import { afterEach, expect, it } from "vitest";
import plugin, { createIconCache } from "./server.js";
import { ICON_LIMITS } from "./icons.js";

const hosts: ReturnType<typeof createFakePluginHost>[] = [];
const host = () => {
  const current = createFakePluginHost({ pluginId: "url-pills" });
  hosts.push(current);
  return current;
};
afterEach(async () => { for (const current of hosts.splice(0)) await current.harness.lifecycle.dispose(); });

it("defaults to icons enabled, applies setting changes and leaves invalid origins unfetched", async () => {
  const current = host();
  await plugin(current.bb);
  expect(await current.harness.behavior.callRpc("config", {})).toEqual({ enabled: true });
  expect(await current.harness.behavior.callRpc("icon", { origin: "https://example.com/private?secret=1" })).toEqual({ enabled: true, dataUrl: null });
  await current.harness.behavior.setSettings({ loadWebsiteIcons: false });
  expect(await current.harness.behavior.callRpc("icon", { origin: "https://example.com" })).toEqual({ enabled: false, dataUrl: null });
  await expect(current.harness.behavior.callRpc("icon", { origin: "https://example.com", cookie: "secret" })).rejects.toThrow();
  const reloaded = await current.harness.lifecycle.reload(plugin);
  hosts[hosts.indexOf(current)] = reloaded;
  expect(await reloaded.harness.behavior.callRpc("config", {})).toEqual({ enabled: false });
});

it("expires successful and failed origins separately and persists without message data", () => {
  const current = host();
  let time = 1_000;
  const cache = createIconCache(current.bb, () => time);
  cache.put("https://yes.example.com", "data:image/png;base64,AA==");
  cache.put("https://no.example.com", null);
  expect(createIconCache(current.bb, () => time).get("https://yes.example.com")).toBe("data:image/png;base64,AA==");
  expect(cache.get("https://no.example.com")).toBeNull();
  time += ICON_LIMITS.negativeMs;
  expect(cache.get("https://no.example.com")).toBeUndefined();
  expect(cache.get("https://yes.example.com")).toBeTruthy();
  time += ICON_LIMITS.positiveMs;
  expect(cache.get("https://yes.example.com")).toBeUndefined();
});

it("evicts old origins at both the count and byte budgets", () => {
  const current = host();
  let time = 1;
  const cache = createIconCache(current.bb, () => time++);
  for (let index = 0; index <= ICON_LIMITS.entries; index++) cache.put(`https://host${index}.example.com`, null);
  expect(cache.get("https://host0.example.com")).toBeUndefined();
  expect(cache.get("https://host500.example.com")).toBeNull();
  // Each item is within the RPC's image bound; their aggregate hits 32 MiB.
  const image = "data:image/png;base64," + "A".repeat(100_000);
  for (let index = 0; index < 350; index++) cache.put(`https://image${index}.example.com`, image);
  const stored = current.bb.storage.database().prepare("SELECT COUNT(*) AS count, SUM(bytes) AS bytes FROM icons").get() as { count: number; bytes: number };
  expect(stored.count).toBeLessThanOrEqual(ICON_LIMITS.entries);
  expect(stored.bytes).toBeLessThanOrEqual(ICON_LIMITS.cacheBytes);
  expect(cache.get("https://image0.example.com")).toBeUndefined();
  expect(cache.get("https://image349.example.com")).toBe(image);
});
