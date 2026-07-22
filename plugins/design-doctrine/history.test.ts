import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { createFakePluginHost } from "@bb/plugin-sdk/testing";
import { describe, expect, it } from "vitest";

import { createHistoryMaintenance } from "./history";

const execFileAsync = promisify(execFile);
const LEGACY_KEY = "maintenance:thread-history:v2";

async function createPluginRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "doctrine-history-"));
  await mkdir(join(root, "maintenance"), { recursive: true });
  await mkdir(join(root, "rules"), { recursive: true });
  await execFileAsync("git", ["-C", root, "init"]);
  return root;
}

function scanOptions() {
  return {
    limit: 20,
    maxBytes: 20_000,
    maxMessageBytes: 2_000,
    leaseSeconds: 60,
  };
}

describe("Design Doctrine legacy history migration", () => {
  it("keeps state.json until the shared baseline migration succeeds", async () => {
    const root = await createPluginRoot();
    const statePath = join(root, "maintenance", "state.json");
    let inventoryAvailable = false;
    await writeFile(
      statePath,
      `${JSON.stringify({
        version: 1,
        cursor: { created_at: 1_725_000_000_000, segment_id: "seg_1" },
        lease: null,
      })}\n`,
    );
    const { bb, harness } = createFakePluginHost({
      pluginId: "design-doctrine",
      sdk: {
        threads: {
          list: async () => {
            if (!inventoryAvailable) throw new Error("inventory unavailable");
            return [];
          },
        },
      },
    });
    const history = createHistoryMaintenance(bb, async () => root);

    try {
      await expect(history.prepare()).rejects.toThrow("inventory unavailable");
      await expect(readFile(statePath, "utf8")).resolves.toContain("seg_1");
      await expect(bb.storage.kv.get(LEGACY_KEY)).resolves.toBeDefined();

      inventoryAvailable = true;
      await expect(history.prepare()).resolves.toEqual({
        inventory_reconciled: true,
      });
      await expect(readFile(statePath, "utf8")).rejects.toMatchObject({
        code: "ENOENT",
      });
      await expect(bb.storage.kv.get(LEGACY_KEY)).resolves.toBeUndefined();
    } finally {
      await harness.lifecycle.dispose();
      await rm(root, { recursive: true, force: true });
    }
  });

  it("converts the old seconds lease and blocks preparation and scanning", async () => {
    const root = await createPluginRoot();
    const statePath = join(root, "maintenance", "state.json");
    const expiresAtSeconds = Math.floor(Date.now() / 1_000) + 3_600;
    await writeFile(
      statePath,
      `${JSON.stringify({
        version: 1,
        cursor: { created_at: 1_725_000_000_000, segment_id: "seg_1" },
        lease: {
          id: "legacy-lease",
          acquired_at: expiresAtSeconds - 60,
          expires_at: expiresAtSeconds,
          cursor_before: null,
          cursor_commit: {
            created_at: 1_725_000_000_000,
            segment_id: "seg_1",
          },
        },
      })}\n`,
    );
    const { bb, harness } = createFakePluginHost({
      pluginId: "design-doctrine",
      sdk: { threads: { list: async () => [] } },
    });
    const history = createHistoryMaintenance(bb, async () => root);

    try {
      await expect(history.prepare()).rejects.toThrow(
        "legacy maintenance lease legacy-lease is active",
      );
      await expect(history.scan(scanOptions())).rejects.toThrow(
        "legacy maintenance lease legacy-lease is active",
      );
      await expect(readFile(statePath, "utf8")).resolves.toContain(
        "legacy-lease",
      );
      await expect(bb.storage.kv.get(LEGACY_KEY)).resolves.toMatchObject({
        lease: { expires_at: expiresAtSeconds * 1_000 },
      });
    } finally {
      await harness.lifecycle.dispose();
      await rm(root, { recursive: true, force: true });
    }
  });
});
