import { execFile } from "node:child_process";
import { createHmac } from "node:crypto";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import { describe, expect, it, vi } from "vitest";

import plugin from "./server";

const execFileAsync = promisify(execFile);

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

function agentContext(title: string) {
  return {
    thread: {
      id: "thread-test",
      title,
      parentThreadId: null,
      sourceThreadId: null,
    },
    project: {
      id: "project-test",
      kind: "standard" as const,
      name: "bb",
      gitRemoteUrl: null,
    },
    environment: {
      id: "environment-test",
      name: null,
      path: process.cwd(),
      workspaceProvisionType: "managed-worktree" as const,
      branchName: "test",
    },
    host: { id: "host-test", name: "Test host" },
    provider: { id: "codex", model: "test" },
    sideChat: false,
    origin: { kind: null, pluginId: null },
  };
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
    expect(harness.inspection.registrations.httpRoutes).toEqual([
      expect.objectContaining({ method: "POST", path: "/github", auth: "none" }),
    ]);
    expect(
      harness.inspection.registrations.settingsDescriptors.githubWebhookSecret,
    ).toMatchObject({ type: "string", secret: true });
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

  it("keeps reads available while the webhook awaits secure configuration", async () => {
    const { bb, harness } = createFakePluginHost({
      pluginId: "design-doctrine",
      sdk: { threads: { list: async () => [] } },
      agentSkillIds: ["design-doctrine"],
    });
    await plugin(bb);

    const response = await harness.behavior.fetchHttp("POST", "/github", {
      body: "{}",
    });

    expect(response.status).toBe(503);
    await expect(harness.behavior.callRpc("getLibrary", null)).resolves.toMatchObject({
      rules: expect.any(Array),
    });
    await harness.lifecycle.dispose();
  });

  it("authenticates raw webhook bytes before interpreting the event", async () => {
    const secret = "test-webhook-secret";
    const { bb, harness } = createFakePluginHost({
      pluginId: "design-doctrine",
      settings: { githubWebhookSecret: secret },
      sdk: { threads: { list: async () => [] } },
      agentSkillIds: ["design-doctrine"],
    });
    await plugin(bb);
    const body = JSON.stringify({ zen: "Keep it logically awesome. 🌱" });
    const signature = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;

    const rejected = await harness.behavior.fetchHttp("POST", "/github", {
      body,
      headers: {
        "x-github-event": "ping",
        "x-hub-signature-256": `sha256=${"0".repeat(64)}`,
      },
    });
    expect(rejected.status).toBe(401);

    const accepted = await harness.behavior.fetchHttp("POST", "/github", {
      body,
      headers: {
        "x-github-event": "ping",
        "x-hub-signature-256": signature,
      },
    });
    expect(accepted.status).toBe(202);
    await expect(accepted.json()).resolves.toMatchObject({ ok: true, ignored: "ping" });

    const invalidJson = "not json";
    const invalidJsonSignature = `sha256=${createHmac("sha256", secret).update(invalidJson).digest("hex")}`;
    const malformed = await harness.behavior.fetchHttp("POST", "/github", {
      body: invalidJson,
      headers: {
        "x-github-event": "push",
        "x-hub-signature-256": invalidJsonSignature,
      },
    });
    expect(malformed.status).toBe(400);
    await harness.lifecycle.dispose();
  });

  it("automatically configures bounded guidance and an exact-task search tool", async () => {
    const { bb, harness } = createFakePluginHost({
      pluginId: "design-doctrine",
      sdk: { threads: { list: async () => [] } },
      agentSkillIds: ["design-doctrine"],
    });
    await plugin(bb);

    const configuration = await harness.behavior.resolveAgentConfiguration(
      agentContext("Redesign the compact utility toolbar"),
    );
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
    await expect(
      harness.behavior.callAgentTool("design_doctrine_search", {
        query: "improve",
        limit: 3,
      }),
    ).resolves.toBe("No applicable active Design Doctrine rules found.");
    await expect(
      harness.behavior.runCli(["search", "improve"]),
    ).resolves.toMatchObject({ exitCode: 0, stdout: "No matching rules.\n" });

    await harness.behavior.setSettings({
      doctrinePath: join(tmpdir(), "missing-design-doctrine"),
    });
    const unavailableConfiguration =
      await harness.behavior.resolveAgentConfiguration(
        agentContext("Redesign the compact utility toolbar"),
      );
    expect(unavailableConfiguration.instructions).toBeNull();
    expect(unavailableConfiguration.skills).toEqual(["design-doctrine"]);
    expect(unavailableConfiguration.tools.map(({ name }) => name)).toEqual([
      "design_doctrine_search",
    ]);
    await harness.lifecycle.dispose();
  });

  it("keeps diagnostic surfaces available when the initial corpus is unavailable", async () => {
    const { bb, harness } = createFakePluginHost({
      pluginId: "design-doctrine",
      settings: {
        doctrinePath: join(tmpdir(), "missing-design-doctrine-at-startup"),
      },
      sdk: { threads: { list: async () => [] } },
      agentSkillIds: ["design-doctrine"],
    });

    await expect(plugin(bb)).resolves.toBeUndefined();
    expect(harness.inspection.registrations.rpcMethods).toEqual([
      "getLibrary",
    ]);
    expect(harness.inspection.registrations.cli?.name).toBe("doctrine");
    expect(
      harness.inspection.registrations.agentTools.map(({ name }) => name),
    ).toContain("design_doctrine_search");
    const configuration = await harness.behavior.resolveAgentConfiguration(
      agentContext("Redesign the compact utility toolbar"),
    );
    expect(configuration.instructions).toBeNull();
    await vi.waitFor(() => {
      expect(harness.inspection.logEntries).toContainEqual(
        expect.objectContaining({
          level: "warn",
          message: expect.stringContaining("ENOENT"),
        }),
      );
    });
    await harness.lifecycle.dispose();
  });

  it("registers its core surfaces before history preparation completes", async () => {
    const maintenanceRoot = await mkdtemp(
      join(tmpdir(), "doctrine-harness-history-"),
    );
    await mkdir(join(maintenanceRoot, "rules"));
    await execFileAsync("git", [
      "-C",
      maintenanceRoot,
      "init",
      "-b",
      "doctrine-maintenance",
    ]);
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
    await harness.behavior.setSettings({ doctrinePath: maintenanceRoot });
    await expect(
      harness.behavior.runCli(["history", "scan"]),
    ).resolves.toMatchObject({ exitCode: 0 });
    expect(inventoryCalls).toBe(3);
    await harness.lifecycle.dispose();
    await rm(maintenanceRoot, { recursive: true, force: true });
  });
});
