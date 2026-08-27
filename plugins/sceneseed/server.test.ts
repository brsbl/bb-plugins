import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  createFakePluginHost,
  makeThreadResponse,
  type FakePluginHost,
} from "@get-bb/plugin-sdk/testing";
import type { PluginAgentConfigurationContext } from "@get-bb/plugin-sdk";
import sceneSeedPlugin from "./server.js";
import {
  rpcContract,
  type SceneSeedRpcContract,
} from "./server/rpc-contract.js";

const hosts: FakePluginHost[] = [];

type RpcMethod = keyof SceneSeedRpcContract;
type RpcInput<M extends RpcMethod> = z.input<SceneSeedRpcContract[M]["input"]>;
type RpcOutput<M extends RpcMethod> = z.output<
  SceneSeedRpcContract[M]["output"]
>;

async function callRpc<M extends RpcMethod>(
  host: FakePluginHost,
  method: M,
  input: RpcInput<M>,
): Promise<RpcOutput<M>> {
  const value = await host.harness.callRpc(method, input);
  return rpcContract[method].output.parse(value) as RpcOutput<M>;
}

const personalProject = {
  id: "proj_personal",
  kind: "personal" as const,
  name: "Personal",
  gitRemoteUrl: null,
  sources: [],
  createdAt: 1,
  updatedAt: 1,
};

function validScene(jobId: string, objectId: string) {
  return {
    version: 1 as const,
    jobId,
    objectId,
    name: "Rain jar",
    altText: "A blue cloud raining inside a glass jar",
    bounds: { width: 3, height: 4, depth: 3 },
    cameraHint: "three-quarter" as const,
    palette: ["#3366ff", "theme:accent"] as const,
    material: { preset: "glass" as const, opacity: 0.8 },
    nodes: [
      {
        kind: "mesh" as const,
        id: "jar",
        parentId: null,
        position: [0, 1, 0] as [number, number, number],
        rotation: [0, 0, 0] as [number, number, number],
        scale: [1, 1, 1] as [number, number, number],
        paletteIndex: 0,
        geometry: "cylinder" as const,
        size: { width: 2, height: 3, depth: 2 },
      },
    ],
    lights: [],
    motion: { preset: "breathe" as const, speed: 0.5, amplitude: 0.1 },
    ground: { contactShadow: { strength: 0.6, softness: 0.5 } },
  };
}

function configurationContext(
  overrides: Partial<PluginAgentConfigurationContext> = {},
): PluginAgentConfigurationContext {
  return {
    thread: {
      id: "thr_scene",
      title: "SceneSeed",
      parentThreadId: null,
      sourceThreadId: null,
    },
    project: {
      id: "proj_personal",
      kind: "personal",
      name: "Personal",
      gitRemoteUrl: null,
    },
    environment: {
      id: "env_personal",
      name: null,
      path: null,
      workspaceProvisionType: "personal",
      branchName: null,
    },
    host: { id: "host_local", name: "Local" },
    provider: {
      id: "codex",
      model: "gpt-test",
      capabilities: { supportsNativeUserQuestion: false },
    },
    origin: { kind: null, pluginId: "sceneseed" },
    ...overrides,
  };
}

async function loadHost(input?: {
  threadStatus?: "active" | "idle" | "error";
  threadId?: string;
  onSend?: () => void;
}) {
  const threadId = input?.threadId ?? "thr_scene";
  let threadStatus = input?.threadStatus ?? "idle";
  const send = vi.fn(async () => {
    input?.onSend?.();
    return { ok: true as const, delivery: "sent" as const };
  });
  const stop = vi.fn(async () => ({ ok: true as const }));
  const archive = vi.fn(async () => ({ threads: [] }));
  const host = createFakePluginHost({
    pluginId: "sceneseed",
    agentSkillIds: ["sceneseed-interpreter"],
    sdk: {
      projects: { list: async () => [personalProject] },
      threads: {
        spawn: async () =>
          makeThreadResponse({
            id: threadId,
            projectId: personalProject.id,
            visibility: "hidden",
            originPluginId: "sceneseed",
          }),
        send,
        stop,
        archive,
        get: async () =>
          makeThreadResponse({
            id: threadId,
            projectId: personalProject.id,
            visibility: "hidden",
            originPluginId: "sceneseed",
            status: threadStatus,
          }),
      },
    },
  });
  hosts.push(host);
  await sceneSeedPlugin(host.bb);
  return {
    host,
    send,
    stop,
    archive,
    setThreadStatus(status: "active" | "idle" | "error") {
      threadStatus = status;
    },
  };
}

async function createQueuedJob(host: FakePluginHost, prompt = "rain in a jar") {
  await callRpc(host, "acknowledgeDisclosure", null);
  const created = await callRpc(host, "createCanvas", {
    name: "Test canvas",
  });
  const card = await callRpc(host, "createCard", {
    canvasId: created.snapshot.canvas.id,
    prompt,
    expectedRevision: created.snapshot.canvas.revision,
  });
  const placed = await callRpc(host, "placeCard", {
    canvasId: created.snapshot.canvas.id,
    cardId: card.cardId,
    placement: { x: 2, y: -1 },
    expectedRevision: card.snapshot.canvas.revision,
  });
  return {
    canvasId: created.snapshot.canvas.id,
    jobId: placed.jobId,
    snapshot: placed.snapshot,
  };
}

afterEach(async () => {
  await Promise.all(
    hosts.splice(0).map((host) => host.harness.lifecycle.dispose()),
  );
});

describe("SceneSeed agent orchestration", () => {
  it("selects its skill and submit tool only for plugin-origin personal threads", async () => {
    const { host } = await loadHost();
    const selected = await host.harness.resolveAgentConfiguration(
      configurationContext(),
    );
    expect(selected.tools.map((tool) => tool.name)).toEqual([
      "submit_scene_object",
    ]);
    expect(selected.skills).toEqual(["sceneseed-interpreter"]);
    expect(selected.instructions).toContain(
      "not an exclusive capability allowlist",
    );

    const ordinary = await host.harness.resolveAgentConfiguration(
      configurationContext({ origin: { kind: null, pluginId: null } }),
    );
    expect(ordinary.tools).toEqual([]);
    expect(ordinary.skills).toEqual([]);
  });

  it("persists and claims a job before dispatching it to one hidden canvas thread", async () => {
    let host!: FakePluginHost;
    const loaded = await loadHost({
      onSend: () => {
        const row = host.bb.storage
          .database()
          .prepare("SELECT state FROM sceneseed_jobs LIMIT 1")
          .get() as { state: string } | undefined;
        expect(row?.state).toBe("interpreting");
      },
    });
    host = loaded.host;
    const result = await createQueuedJob(host);

    expect(host.harness.sdk.callsTo("threads.spawn")[0]?.[0]).toMatchObject({
      projectId: personalProject.id,
      environment: { type: "project-default" },
      visibility: "hidden",
      permissionMode: "accept-edits",
      origin: "plugin",
      originPluginId: "sceneseed",
    });
    expect(loaded.send).toHaveBeenCalledTimes(1);
    expect(
      result.snapshot.jobs.find((job) => job.id === result.jobId)?.state,
    ).toBe("interpreting");
    expect(host.harness.sdk.callsTo("projects.files")).toEqual([]);
    expect(host.harness.sdk.callsTo("files.write")).toEqual([]);
  });

  it("waits for the bootstrap turn to become idle before claiming the real job", async () => {
    let setThreadStatus!: (status: "active" | "idle" | "error") => void;
    const loaded = await loadHost({
      threadStatus: "active",
      onSend: () => setThreadStatus("active"),
    });
    setThreadStatus = loaded.setThreadStatus;
    const queued = await createQueuedJob(loaded.host);

    expect(loaded.send).not.toHaveBeenCalled();
    expect(
      queued.snapshot.jobs.find((job) => job.id === queued.jobId)?.state,
    ).toBe("queued");

    setThreadStatus("idle");
    await loaded.host.harness.emitThreadEvent("thread.idle", {
      thread: makeThreadResponse({
        id: "thr_scene",
        originPluginId: "sceneseed",
      }),
      lastAssistantText: "READY",
    });
    expect(loaded.send).toHaveBeenCalledTimes(1);

    await loaded.host.harness.emitThreadEvent("thread.idle", {
      thread: makeThreadResponse({
        id: "thr_scene",
        originPluginId: "sceneseed",
      }),
      lastAssistantText: "READY",
    });
    const snapshot = await callRpc(loaded.host, "getCanvas", {
      canvasId: queued.canvasId,
    });
    expect(snapshot.snapshot?.jobs[0]?.state).toBe("interpreting");
  });

  it("counts manual invalid calls, rejects another caller, and fails on attempt two", async () => {
    const { host } = await loadHost();
    const queued = await createQueuedJob(host);

    const wrongCaller = await host.harness.callAgentTool(
      "submit_scene_object",
      { scene: {} },
      { threadId: "thr_wrong" },
    );
    expect(wrongCaller).toMatchObject({ isError: true });
    let snapshot = await callRpc(host, "getCanvas", {
      canvasId: queued.canvasId,
    });
    expect(snapshot.snapshot?.jobs[0]?.invalidSubmissionAttempts).toBe(0);

    const first = await host.harness.callAgentTool(
      "submit_scene_object",
      { scene: { version: 1 } },
      { threadId: "thr_scene" },
    );
    expect(first).toMatchObject({ isError: true });
    snapshot = await callRpc(host, "getCanvas", {
      canvasId: queued.canvasId,
    });
    expect(snapshot.snapshot?.jobs[0]).toMatchObject({
      state: "interpreting",
      invalidSubmissionAttempts: 1,
    });

    const second = await host.harness.callAgentTool(
      "submit_scene_object",
      { scene: { version: 1 } },
      { threadId: "thr_scene" },
    );
    expect(second).toMatchObject({ isError: true });
    snapshot = await callRpc(host, "getCanvas", {
      canvasId: queued.canvasId,
    });
    expect(snapshot.snapshot?.jobs[0]).toMatchObject({
      state: "failed",
      invalidSubmissionAttempts: 2,
      errorCode: "invalid_scene",
    });

    const third = await host.harness.callAgentTool(
      "submit_scene_object",
      { scene: { version: 1 } },
      { threadId: "thr_scene" },
    );
    expect(third).toMatchObject({ isError: true });
  });

  it("serializes jobs and advances only after the active thread settles", async () => {
    const { host, send } = await loadHost();
    const first = await createQueuedJob(host, "first");
    const before = await callRpc(host, "getCanvas", {
      canvasId: first.canvasId,
    });
    const secondCard = await callRpc(host, "createCard", {
      canvasId: first.canvasId,
      prompt: "second",
      expectedRevision: before.snapshot!.canvas.revision,
    });
    const second = await callRpc(host, "placeCard", {
      canvasId: first.canvasId,
      cardId: secondCard.cardId,
      placement: { x: 4, y: 4 },
      expectedRevision: secondCard.snapshot.canvas.revision,
    });
    expect(send).toHaveBeenCalledTimes(1);
    expect(
      second.snapshot.jobs.find((job) => job.id === second.jobId)?.state,
    ).toBe("queued");

    const firstJob = second.snapshot.jobs.find(
      (job) => job.id === first.jobId,
    )!;
    await host.harness.callAgentTool(
      "submit_scene_object",
      { scene: validScene(firstJob.id, firstJob.objectId) },
      { threadId: "thr_scene" },
    );
    await host.harness.emitThreadEvent("thread.idle", {
      thread: makeThreadResponse({
        id: "thr_scene",
        projectId: personalProject.id,
        originPluginId: "sceneseed",
        visibility: "hidden",
      }),
      lastAssistantText: null,
    });
    expect(send).toHaveBeenCalledTimes(2);
    const after = await callRpc(host, "getCanvas", {
      canvasId: first.canvasId,
    });
    expect(
      after.snapshot?.jobs.find((job) => job.id === second.jobId)?.state,
    ).toBe("interpreting");
  });

  it("promotes exactly one render-acknowledged candidate idempotently", async () => {
    const { host } = await loadHost();
    const queued = await createQueuedJob(host);
    const job = queued.snapshot.jobs.find(
      (entry) => entry.id === queued.jobId,
    )!;
    const acceptedText = await host.harness.callAgentTool(
      "submit_scene_object",
      { scene: validScene(job.id, job.objectId) },
      { threadId: "thr_scene" },
    );
    const accepted = JSON.parse(acceptedText as string) as {
      candidateId: string;
      revision: number;
    };
    const begun = await callRpc(host, "beginRealization", {
      candidateId: accepted.candidateId,
      attemptId: "attempt_1",
      jobId: job.id,
      generation: job.generation,
      expectedCanvasRevision: accepted.revision,
    });
    const completed = await callRpc(host, "acknowledgeRealization", {
      candidateId: accepted.candidateId,
      attemptId: "attempt_1",
      jobId: job.id,
      generation: job.generation,
      expectedCanvasRevision: begun.snapshot.canvas.revision,
      outcome: "success",
    });
    expect(completed.outcome).toBe("complete");
    expect(completed.snapshot.objects[0]).toMatchObject({
      activeSceneId: accepted.candidateId,
    });
    expect(completed.snapshot.jobs[0]?.state).toBe("complete");

    const duplicate = await callRpc(host, "acknowledgeRealization", {
      candidateId: accepted.candidateId,
      attemptId: "attempt_1",
      jobId: job.id,
      generation: job.generation,
      expectedCanvasRevision: completed.snapshot.canvas.revision,
      outcome: "success",
    });
    expect(duplicate.outcome).toBe("already_processed");
  });

  it("waits for idle after cancelling an active turn before dispatching the queue", async () => {
    const { host, send, stop } = await loadHost();
    const first = await createQueuedJob(host, "first");
    const snapshot = await callRpc(host, "getCanvas", {
      canvasId: first.canvasId,
    });
    const card = await callRpc(host, "createCard", {
      canvasId: first.canvasId,
      prompt: "second",
      expectedRevision: snapshot.snapshot!.canvas.revision,
    });
    await callRpc(host, "placeCard", {
      canvasId: first.canvasId,
      cardId: card.cardId,
      placement: { x: 0, y: 0 },
      expectedRevision: card.snapshot.canvas.revision,
    });
    await callRpc(host, "cancelJob", { jobId: first.jobId });
    expect(stop).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledTimes(1);

    await host.harness.emitThreadEvent("thread.idle", {
      thread: makeThreadResponse({
        id: "thr_scene",
        originPluginId: "sceneseed",
      }),
      lastAssistantText: null,
    });
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("fails a settled interpreter with no candidate and reconciles stale work on startup", async () => {
    const loaded = await loadHost({ threadStatus: "idle" });
    const queued = await createQueuedJob(loaded.host);
    const reloaded =
      await loaded.host.harness.lifecycle.reload(sceneSeedPlugin);
    hosts.push(reloaded);
    const service = reloaded.harness.runService("scene-reconciler");
    await vi.waitFor(async () => {
      const canvas = await callRpc(reloaded, "getCanvas", {
        canvasId: queued.canvasId,
      });
      expect(canvas.snapshot?.jobs[0]?.state).toBe("failed");
    });
    service.controller.abort();
    await service.done;
  });

  it("clears plugin data and archives/stops every canvas thread", async () => {
    const { host, archive, stop } = await loadHost();
    await createQueuedJob(host);
    const result = await callRpc(host, "clearAllCanvasData", null);
    expect(result).toEqual({ deletedCanvasCount: 1, failedThreadIds: [] });
    expect(archive).toHaveBeenCalledWith({ threadId: "thr_scene" });
    expect(stop).toHaveBeenCalledWith({ threadId: "thr_scene" });
    expect(await callRpc(host, "listCanvases", null)).toMatchObject({
      canvases: [],
    });
  });
});
