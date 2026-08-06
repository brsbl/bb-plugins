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

describe("Design Doctrine plugin contract", () => {
  it("registers its RPC, CLI, and watcher through the bb harness", async () => {
    const { bb, harness } = createFakePluginHost({
      pluginId: "design-doctrine",
      sdk: { threads: { list: async () => [] } },
      agentSkillIds: ["design-doctrine"],
    });

    await plugin(bb);

    expect(harness.inspection.registrations.rpcMethods).toEqual([
      "getLibrary",
    ]);
    expect(harness.inspection.registrations.cli?.name).toBe("doctrine");
    expect(
      harness.inspection.registrations.agentTools.map(({ name }) => name),
    ).toContain("design_doctrine_search");
    expect(
      harness.inspection.registrations.agentConfigurationProvider,
    ).not.toBeNull();
    expect(
      harness.inspection.registrations.services.map(({ name }) => name),
    ).toContain("rule-watch");
    expect(
      harness.inspection.registrations.threadEventHandlers["thread.idle"],
    ).toBe(1);
    expect(
      harness.inspection.registrations.threadEventHandlers["thread.created"],
    ).toBe(1);
    expect(
      harness.inspection.registrations.threadEventHandlers["thread.deleted"],
    ).toBe(1);
    await harness.lifecycle.dispose();
  });

  it("automatically configures bounded guidance and an exact-task search tool", async () => {
    const { bb, harness } = createFakePluginHost({
      pluginId: "design-doctrine",
      sdk: { threads: { list: async () => [] } },
      agentSkillIds: ["design-doctrine"],
    });
    await plugin(bb);

    const configuration = await harness.behavior.resolveAgentConfiguration({
      thread: {
        id: "thread-test",
        title: "Redesign the compact utility toolbar",
        parentThreadId: null,
        sourceThreadId: null,
      },
      project: {
        id: "project-test",
        kind: "standard",
        name: "bb",
        gitRemoteUrl: null,
      },
      environment: {
        id: "environment-test",
        name: null,
        path: process.cwd(),
        workspaceProvisionType: "managed-worktree",
        branchName: "test",
      },
      host: { id: "host-test", name: "Test host" },
      provider: { id: "codex", model: "test" },
      sideChat: false,
      origin: { kind: null, pluginId: null },
    });
    const toolResult = await harness.behavior.callAgentTool(
      "design_doctrine_search",
      { query: "compact utility toolbar", limit: 3 },
    );

    expect(configuration.skills).toEqual(["design-doctrine"]);
    expect(configuration.tools.map(({ name }) => name)).toEqual([
      "design_doctrine_search",
    ]);
    expect(configuration.instructions).toContain("ddr_001");
    expect(toolResult).toContain("ddr_001");
    expect(toolResult).toContain("Use when:");
    await harness.lifecycle.dispose();
  });

  it("registers its core surfaces before history preparation completes", async () => {
    const inventory = deferred<never[]>();
    let inventoryCalls = 0;
    let registrationsAtInventoryStart: {
      rpcMethods: string[];
      cliName: string | undefined;
      createdHandlers: number | undefined;
      idleHandlers: number | undefined;
    } | null = null;
    const { bb, harness } = createFakePluginHost({
      pluginId: "design-doctrine",
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
    expect(registrationsAtInventoryStart?.rpcMethods).toEqual(["getLibrary"]);
    expect(registrationsAtInventoryStart?.cliName).toBe("doctrine");
    expect(registrationsAtInventoryStart?.createdHandlers).toBe(1);
    expect(registrationsAtInventoryStart?.idleHandlers).toBe(1);

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
