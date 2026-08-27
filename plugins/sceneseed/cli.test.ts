import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createFakePluginHost,
  makeThreadResponse,
  type FakePluginHost,
} from "@get-bb/plugin-sdk/testing";
import sceneSeedPlugin from "./server.js";

const hosts: FakePluginHost[] = [];

async function loadHost() {
  const send = vi.fn(async () => ({
    ok: true as const,
    delivery: "sent" as const,
  }));
  const stop = vi.fn(async () => ({ ok: true as const }));
  const host = createFakePluginHost({
    pluginId: "sceneseed",
    agentSkillIds: ["sceneseed-interpreter"],
    sdk: {
      projects: {
        list: async () => [
          {
            id: "proj_personal",
            kind: "personal" as const,
            name: "Personal",
            gitRemoteUrl: null,
            sources: [],
            createdAt: 1,
            updatedAt: 1,
          },
        ],
      },
      threads: {
        spawn: async () =>
          makeThreadResponse({
            id: "thr_cli",
            projectId: "proj_personal",
            visibility: "hidden",
            originPluginId: "sceneseed",
          }),
        send,
        stop,
        archive: async () => ({ threads: [] }),
        get: async () =>
          makeThreadResponse({
            id: "thr_cli",
            projectId: "proj_personal",
            visibility: "hidden",
            originPluginId: "sceneseed",
          }),
      },
    },
  });
  hosts.push(host);
  await sceneSeedPlugin(host.bb);
  return { host, send, stop };
}

async function createCanvas(host: FakePluginHost): Promise<string> {
  const result = await host.harness.callRpc("createCanvas", {
    name: "CLI canvas",
  });
  if (
    typeof result !== "object" ||
    result === null ||
    !("snapshot" in result) ||
    typeof result.snapshot !== "object" ||
    result.snapshot === null ||
    !("canvas" in result.snapshot) ||
    typeof result.snapshot.canvas !== "object" ||
    result.snapshot.canvas === null ||
    !("id" in result.snapshot.canvas) ||
    typeof result.snapshot.canvas.id !== "string"
  ) {
    throw new Error("createCanvas returned an invalid test payload");
  }
  return result.snapshot.canvas.id;
}

afterEach(async () => {
  await Promise.all(
    hosts.splice(0).map((host) => host.harness.lifecycle.dispose()),
  );
});

describe("SceneSeed CLI", () => {
  it("registers the complete discoverable command surface", async () => {
    const { host } = await loadHost();
    expect(host.harness.registrations.cli).toMatchObject({
      name: "sceneseed",
      commands: [
        { name: "list" },
        { name: "show" },
        { name: "add" },
        { name: "wait" },
        { name: "cancel" },
        { name: "remove-object" },
      ],
    });
  });

  it("lists and shows the same canvas records as RPC", async () => {
    const { host } = await loadHost();
    const canvasId = await createCanvas(host);

    const listed = await host.harness.runCli(["list"]);
    expect(listed).toMatchObject({ exitCode: 0 });
    expect(listed.stdout).toContain(canvasId);
    expect(listed.stdout).toContain("CLI canvas");

    const shown = await host.harness.runCli(["show", canvasId, "--json"]);
    expect(shown).toMatchObject({ exitCode: 0 });
    const payload = JSON.parse(shown.stdout) as {
      canvas: { id: string };
      truncated: { cards: number; jobs: number; candidates: number };
    };
    expect(payload.canvas.id).toBe(canvasId);
    expect(payload.truncated).toEqual({ cards: 0, jobs: 0, candidates: 0 });
  });

  it("adds through the durable card/job queue and honors placement flags", async () => {
    const { host, send } = await loadHost();
    const canvasId = await createCanvas(host);
    await host.harness.callRpc("acknowledgeDisclosure", null);

    const added = await host.harness.runCli([
      "add",
      canvasId,
      "--prompt",
      "rainy thought in a jar",
      "--x",
      "3",
      "--y",
      "-2",
    ]);
    expect(added).toMatchObject({ exitCode: 0 });
    const output = JSON.parse(added.stdout) as {
      cardId: string;
      jobId: string;
      state: string;
    };
    expect(output.state).toBe("interpreting");
    expect(send).toHaveBeenCalledTimes(1);

    const row = host.bb.storage
      .database()
      .prepare(
        `SELECT card.prompt, card.placement_x, card.placement_y, job.state
         FROM sceneseed_cards card
         JOIN sceneseed_jobs job ON job.card_id = card.id
         WHERE card.id = ? AND job.id = ?`,
      )
      .get(output.cardId, output.jobId) as
      | {
          prompt: string;
          placement_x: number;
          placement_y: number;
          state: string;
        }
      | undefined;
    expect(row).toEqual({
      prompt: "rainy thought in a jar",
      placement_x: 3,
      placement_y: -2,
      state: "interpreting",
    });
  });

  it("enforces disclosure for CLI generation and returns a bounded failure", async () => {
    const { host, send } = await loadHost();
    const canvasId = await createCanvas(host);
    const result = await host.harness.runCli([
      "add",
      canvasId,
      "--prompt",
      "private phrase",
    ]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain(
      "Acknowledge the SceneSeed agent and retention disclosure",
    );
    expect(send).not.toHaveBeenCalled();
  });

  it("cancels, waits, and removes through the same store operations as UI", async () => {
    const { host, stop } = await loadHost();
    const canvasId = await createCanvas(host);
    await host.harness.callRpc("acknowledgeDisclosure", null);
    const added = await host.harness.runCli([
      "add",
      canvasId,
      "--prompt",
      "small brass moon",
    ]);
    const ids = JSON.parse(added.stdout) as { jobId: string };
    const cancel = await host.harness.runCli(["cancel", ids.jobId]);
    expect(cancel).toMatchObject({ exitCode: 0 });
    expect(stop).toHaveBeenCalledWith({ threadId: "thr_cli" });

    const waited = await host.harness.runCli(["wait", ids.jobId]);
    expect(waited).toMatchObject({ exitCode: 0 });
    expect(JSON.parse(waited.stdout)).toMatchObject({ state: "cancelled" });

    const object = host.bb.storage
      .database()
      .prepare("SELECT id FROM sceneseed_objects LIMIT 1")
      .get() as { id: string } | undefined;
    expect(object).toBeDefined();
    const removed = await host.harness.runCli([
      "remove-object",
      canvasId,
      object!.id,
    ]);
    expect(removed).toMatchObject({ exitCode: 0 });
    const stored = host.bb.storage
      .database()
      .prepare("SELECT removed_at FROM sceneseed_objects WHERE id = ?")
      .get(object!.id) as { removed_at: number | null } | undefined;
    expect(stored?.removed_at).not.toBeNull();
  });
});
