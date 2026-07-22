import { createFakePluginHost } from "@bb/plugin-sdk/testing";
import { describe, expect, it, vi } from "vitest";

import plugin from "./server";

function deferred<T>(): {
  promise: Promise<T>;
  reject(error: unknown): void;
} {
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((_resolve, rejectPromise) => {
    reject = rejectPromise;
  });
  return { promise, reject };
}

describe("Improve Prompt plugin contract", () => {
  it("registers enhancement RPC and completion events", async () => {
    const { bb, harness } = createFakePluginHost({
      pluginId: "prompt-shaper",
      sdk: { threads: { list: async () => [] } },
    });

    await plugin(bb);

    expect(harness.inspection.registrations.rpcMethods).toEqual([
      "startEnhancement",
      "getEnhancement",
      "cancelEnhancement",
    ]);
    expect(
      harness.inspection.registrations.threadEventHandlers["thread.idle"],
    ).toBe(2);
    expect(
      harness.inspection.registrations.threadEventHandlers["thread.created"],
    ).toBe(1);
    expect(
      harness.inspection.registrations.threadEventHandlers["thread.failed"],
    ).toBe(1);
    expect(
      harness.inspection.registrations.threadEventHandlers["thread.deleted"],
    ).toBe(1);
    await harness.lifecycle.dispose();
  });

  it("stays available while history preparation is pending or fails", async () => {
    const inventory = deferred<never[]>();
    let inventoryCalls = 0;
    let registrationsAtInventoryStart: {
      rpcMethods: string[];
      cliName: string | undefined;
      createdHandlers: number | undefined;
      idleHandlers: number | undefined;
    } | null = null;
    const { bb, harness } = createFakePluginHost({
      pluginId: "prompt-shaper",
      sdk: {
        threads: {
          list: async () => {
            inventoryCalls += 1;
            const registrations = harness.inspection.registrations;
            registrationsAtInventoryStart = {
              rpcMethods: registrations.rpcMethods,
              cliName: registrations.cli?.name,
              createdHandlers:
                registrations.threadEventHandlers["thread.created"],
              idleHandlers: registrations.threadEventHandlers["thread.idle"],
            };
            return inventoryCalls === 1 ? inventory.promise : [];
          },
        },
      },
    });

    await expect(plugin(bb)).resolves.toBeUndefined();
    await vi.waitFor(() => expect(registrationsAtInventoryStart).not.toBeNull());
    expect(registrationsAtInventoryStart?.rpcMethods).toEqual([
      "startEnhancement",
      "getEnhancement",
      "cancelEnhancement",
    ]);
    expect(registrationsAtInventoryStart?.cliName).toBe("prompt-shaper");
    expect(registrationsAtInventoryStart?.createdHandlers).toBe(1);
    expect(registrationsAtInventoryStart?.idleHandlers).toBe(2);

    inventory.reject(new Error("inventory unavailable"));
    await vi.waitFor(() => {
      expect(harness.inspection.logEntries).toContainEqual(
        expect.objectContaining({
          level: "warn",
          message: expect.stringContaining("inventory unavailable"),
        }),
      );
    });
    await expect(
      harness.behavior.runCli(["history", "scan"]),
    ).resolves.toMatchObject({ exitCode: 0 });
    expect(inventoryCalls).toBe(3);
    await harness.lifecycle.dispose();
  });
});
