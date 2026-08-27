// @vitest-environment jsdom

import { act, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadPluginApp, renderSlot } from "@get-bb/plugin-sdk/testing/app";

import {
  createSceneSeedUiFixture,
  SCENESEED_QA_SUBPATH,
} from "./sceneseed-ui-fixture.js";
import type { CanvasSnapshotDto } from "./store.js";

interface MockRenderObject {
  scene: { jobId: string; objectId: string };
  probeOnly?: boolean;
  reveal?: boolean;
  revisionKey?: string | number;
}

vi.mock("./scene-renderer.js", () => ({
  SceneRenderer: ({
    objects,
    onRenderProbe,
    onSelectObject,
    onContextLost,
  }: {
    objects: MockRenderObject[];
    onRenderProbe?: (event: {
      status: "ready";
      jobId: string;
      objectId: string;
      nodeCount: number;
    }) => void;
    onSelectObject?: (objectId: string) => void;
    onContextLost?: () => void;
  }) => (
    <div data-testid="scene-renderer">
      {objects.map((object) =>
        object.probeOnly ? (
          <button
            key={String(object.revisionKey)}
            type="button"
            data-probe-only="true"
            data-revision-key={String(object.revisionKey)}
            onClick={() =>
              onRenderProbe?.({
                status: "ready",
                jobId: object.scene.jobId,
                objectId: object.scene.objectId,
                nodeCount: 1,
              })
            }
          >
            Probe {object.scene.jobId}
          </button>
        ) : (
          <button
            key={String(object.revisionKey)}
            type="button"
            data-reveal={object.reveal ? "true" : "false"}
            onClick={() => onSelectObject?.(object.scene.objectId)}
          >
            Select {object.scene.objectId}
          </button>
        ),
      )}
      <button type="button" onClick={onContextLost}>
        Lose WebGL
      </button>
    </div>
  ),
}));

const app = await loadPluginApp(() => import("./app"));
const mounted: Array<{ lifecycle: { unmount(): void } }> = [];

function track<T extends { lifecycle: { unmount(): void } }>(slot: T): T {
  mounted.push(slot);
  return slot;
}

function disclosureState(acknowledged = true) {
  return {
    canvases: [],
    disclosureAcknowledged: acknowledged,
  };
}

function candidateReadySnapshot(): CanvasSnapshotDto {
  const snapshot = createSceneSeedUiFixture();
  const objectId = "object_lighthouse";
  const jobId = "job_lighthouse";
  return {
    ...snapshot,
    canvas: { ...snapshot.canvas, revision: 20 },
    cards: snapshot.cards.map((card) =>
      card.id === "card_lighthouse" ? { ...card, state: "realizing" } : card,
    ),
    objects: snapshot.objects.map((object) =>
      object.id === objectId
        ? { ...object, activeSceneId: null, activeJobId: jobId }
        : object,
    ),
    jobs: snapshot.jobs.map((job) =>
      job.id === jobId
        ? { ...job, state: "candidate_ready", finishedAt: null }
        : job,
    ),
    candidates: snapshot.candidates.map((candidate) =>
      candidate.jobId === jobId
        ? {
            ...candidate,
            state: "pending",
            realizationAttempts: 0,
            realizedAt: null,
          }
        : candidate,
    ),
  };
}

beforeEach(() => {
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", () => undefined);
});

afterEach(() => {
  while (mounted.length > 0) mounted.pop()?.lifecycle.unmount();
  vi.unstubAllGlobals();
});

describe("SceneSeed app", () => {
  it("registers an independent canvas route and a real settings surface", () => {
    expect(app.navPanels).toHaveLength(1);
    expect(app.navPanels[0]?.path).toBe("sceneseed");
    expect(app.settingsSections).toHaveLength(1);
    expect(SCENESEED_QA_SUBPATH).toBe("qa-fixture");
  });

  it("creates a canvas from the library and navigates to its durable route", async () => {
    const snapshot = createSceneSeedUiFixture();
    const slot = track(
      renderSlot(
        app.navPanels[0]!,
        { subPath: "" },
        {
          rpc: {
            listCanvases: () => disclosureState(true),
            createCanvas: (input: unknown) => {
              if (
                typeof input !== "object" ||
                input === null ||
                !("name" in input) ||
                typeof input.name !== "string"
              ) {
                throw new Error("expected a canvas name");
              }
              return {
                snapshot: {
                  ...snapshot,
                  canvas: {
                    ...snapshot.canvas,
                    id: "canvas_new",
                    name: input.name,
                  },
                },
              };
            },
          },
        },
      ),
    );

    fireEvent.change(await slot.findByLabelText("New canvas"), {
      target: { value: "Small wonders" },
    });
    fireEvent.click(slot.getByRole("button", { name: "Create" }));

    await waitFor(() =>
      expect(slot.navigateCalls).toContainEqual({
        method: "toPluginPanel",
        path: "sceneseed",
        options: { subPath: "canvas/canvas_new" },
      }),
    );
  });

  it("requires an explicit capability and retention acknowledgement", async () => {
    const slot = track(
      renderSlot(
        app.navPanels[0]!,
        { subPath: "" },
        {
          rpc: {
            listCanvases: () => disclosureState(false),
            acknowledgeDisclosure: () => ({ acknowledgedAt: Date.now() }),
          },
        },
      ),
    );

    expect(
      await slot.findByText("Know what the interpreter can access"),
    ).toBeDefined();
    fireEvent.click(slot.getByRole("button", { name: "I understand" }));
    await waitFor(() =>
      expect(slot.rpcCalls).toContainEqual({
        method: "acknowledgeDisclosure",
        input: null,
      }),
    );
  });

  it("keeps an offline draft in the BB composer and names the paused send state", () => {
    const slot = track(
      renderSlot(
        app.navPanels[0]!,
        { subPath: SCENESEED_QA_SUBPATH },
        { realtimeConnectionState: "reconnecting" },
      ),
    );

    const draft = slot.getByPlaceholderText(
      "Describe something for the scene…",
    );
    fireEvent.change(draft, { target: { value: "a warm clock under snow" } });
    expect(draft).toHaveProperty("value", "a warm clock under snow");
    expect(
      slot.getByText(
        "Reconnecting — keep composing if you like. Sending and scene edits are paused.",
      ),
    ).toBeDefined();
  });

  it("submits the BB composer prompt directly into the durable queue", async () => {
    let current = createSceneSeedUiFixture();
    const slot = track(
      renderSlot(
        app.navPanels[0]!,
        { subPath: "canvas/canvas_fixture" },
        {
          rpc: {
            listCanvases: () => disclosureState(true),
            getCanvas: () => ({ snapshot: current }),
            createCard: (input: unknown) => {
              if (
                typeof input !== "object" ||
                input === null ||
                !("prompt" in input) ||
                typeof input.prompt !== "string"
              ) {
                throw new Error("expected a card prompt");
              }
              current = {
                ...current,
                canvas: { ...current.canvas, revision: 8 },
                cards: [
                  ...current.cards,
                  {
                    id: "card_keyboard",
                    canvasId: current.canvas.id,
                    prompt: input.prompt,
                    state: "ready",
                    order: current.cards.length,
                    placement: null,
                    activeJobId: null,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                  },
                ],
              };
              return { snapshot: current, cardId: "card_keyboard" };
            },
            placeCard: () => ({ snapshot: current, jobId: "job_keyboard" }),
          },
        },
      ),
    );

    const draft = await slot.findByPlaceholderText(
      "Describe something for the scene…",
    );
    fireEvent.change(draft, {
      target: { value: "a silver memory with roots" },
    });
    fireEvent.click(slot.getByTestId("bb-new-thread-composer-submit"));

    await waitFor(() =>
      expect(slot.rpcCalls).toContainEqual({
        method: "placeCard",
        input: {
          canvasId: "canvas_fixture",
          cardId: "card_keyboard",
          placement: { x: 0, y: 0 },
          expectedRevision: 8,
        },
      }),
    );
    const createIndex = slot.rpcCalls.findIndex(
      (call) => call.method === "createCard",
    );
    const placeIndex = slot.rpcCalls.findIndex(
      (call) => call.method === "placeCard",
    );
    expect(createIndex).toBeGreaterThan(-1);
    expect(placeIndex).toBeGreaterThan(createIndex);
  });

  it("probes an inactive candidate before acknowledging and revealing it", async () => {
    let current = candidateReadySnapshot();
    let resolveBegin!: (result: {
      snapshot: CanvasSnapshotDto;
      alreadyProcessed: boolean;
    }) => void;
    const beginResult = new Promise<{
      snapshot: CanvasSnapshotDto;
      alreadyProcessed: boolean;
    }>((resolve) => {
      resolveBegin = resolve;
    });
    const slot = track(
      renderSlot(
        app.navPanels[0]!,
        { subPath: "canvas/canvas_fixture" },
        {
          rpc: {
            listCanvases: () => disclosureState(true),
            getCanvas: () => ({ snapshot: current }),
            beginRealization: () => beginResult,
            acknowledgeRealization: () => {
              current = {
                ...current,
                canvas: { ...current.canvas, revision: 22 },
                cards: current.cards.map((card) =>
                  card.id === "card_lighthouse"
                    ? { ...card, state: "complete" }
                    : card,
                ),
                objects: current.objects.map((object) =>
                  object.id === "object_lighthouse"
                    ? { ...object, activeSceneId: "scene_lighthouse" }
                    : object,
                ),
                jobs: current.jobs.map((job) =>
                  job.id === "job_lighthouse"
                    ? { ...job, state: "complete" }
                    : job,
                ),
                candidates: current.candidates.map((candidate) =>
                  candidate.id === "scene_lighthouse"
                    ? { ...candidate, state: "active" }
                    : candidate,
                ),
              };
              return { snapshot: current, outcome: "complete" };
            },
          },
        },
      ),
    );

    await waitFor(() =>
      expect(
        slot.rpcCalls.some((call) => call.method === "beginRealization"),
      ).toBe(true),
    );
    expect(
      slot.queryByRole("button", { name: "Probe job_lighthouse" }),
    ).toBeNull();
    current = {
      ...current,
      canvas: { ...current.canvas, revision: 21 },
      jobs: current.jobs.map((job) =>
        job.id === "job_lighthouse" ? { ...job, state: "realizing" } : job,
      ),
    };
    resolveBegin({ snapshot: current, alreadyProcessed: false });

    const probe = await slot.findByRole("button", {
      name: "Probe job_lighthouse",
    });
    expect(probe.getAttribute("data-probe-only")).toBe("true");
    expect(
      slot.rpcCalls.some((call) => call.method === "acknowledgeRealization"),
    ).toBe(false);
    fireEvent.click(probe);

    await waitFor(() =>
      expect(
        slot.rpcCalls.some((call) => call.method === "acknowledgeRealization"),
      ).toBe(true),
    );
    await waitFor(() => {
      const revealed = slot.getByRole("button", {
        name: "Select object_lighthouse",
      });
      expect(revealed.getAttribute("data-reveal")).toBe("true");
    });
  });

  it("waits out a stale realization lease before exposing the accepted attempt", async () => {
    vi.useFakeTimers();
    try {
      const initial = candidateReadySnapshot();
      let current: CanvasSnapshotDto = {
        ...initial,
        jobs: initial.jobs.map((job) =>
          job.id === "job_lighthouse" ? { ...job, state: "realizing" } : job,
        ),
      };
      let beginCount = 0;
      const slot = track(
        renderSlot(
          app.navPanels[0]!,
          { subPath: "canvas/canvas_fixture" },
          {
            rpc: {
              listCanvases: () => disclosureState(true),
              getCanvas: () => ({ snapshot: current }),
              beginRealization: () => {
                beginCount += 1;
                if (beginCount === 1) {
                  throw new Error(
                    "another client is already realizing this candidate",
                  );
                }
                current = {
                  ...current,
                  canvas: {
                    ...current.canvas,
                    revision: current.canvas.revision + 1,
                  },
                };
                return { snapshot: current, alreadyProcessed: false };
              },
            },
          },
        ),
      );

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(beginCount).toBe(1);
      expect(
        slot.queryByRole("button", { name: "Probe job_lighthouse" }),
      ).toBeNull();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(30_500);
        await Promise.resolve();
      });

      expect(beginCount).toBe(2);
      const probe = slot.getByRole("button", { name: "Probe job_lighthouse" });
      const beginCalls = slot.rpcCalls.filter(
        (call) => call.method === "beginRealization",
      );
      const acceptedInput = beginCalls[1]?.input;
      if (
        typeof acceptedInput !== "object" ||
        acceptedInput === null ||
        !("attemptId" in acceptedInput) ||
        typeof acceptedInput.attemptId !== "string"
      ) {
        throw new Error("expected an accepted realization attempt id");
      }
      expect(probe.getAttribute("data-revision-key")).toContain(
        acceptedInput.attemptId,
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("makes clear-all an explicit, confirmed settings action", async () => {
    const slot = track(
      renderSlot(
        app.settingsSections[0]!,
        {},
        {
          rpc: {
            clearAllCanvasData: () => ({
              deletedCanvasCount: 3,
              failedThreadIds: [],
            }),
          },
        },
      ),
    );

    fireEvent.click(
      slot.getByRole("button", { name: "Delete all canvas data…" }),
    );
    expect(
      slot.getByText(
        "This clears the plugin database and archives every canvas interpreter thread. This cannot be undone.",
      ),
    ).toBeDefined();
    fireEvent.click(
      slot.getByRole("button", { name: "Delete all canvas data" }),
    );
    await waitFor(() =>
      expect(slot.rpcCalls).toContainEqual({
        method: "clearAllCanvasData",
        input: null,
      }),
    );
    expect(
      await slot.findByText(
        "Deleted 3 canvases and archived their hidden threads.",
      ),
    ).toBeDefined();
  });
});
